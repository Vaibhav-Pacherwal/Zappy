const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const User = require("./models/user")
const generateToken = require("./utils/generateToken");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const {protect} = require("./middleware/authMiddleware");
const socketAuth = require("./middleware/socketAuth");
const { info } = require("console");
const { Server } = require("socket.io");
const moment = require("moment");
const Message = require("./models/message");
const Group = require("./models/group");
const Request = require("./models/join-request")
const app = express();
const server = require("http").createServer(app);
require("dotenv").config();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    credentials: true
  }
});

io.use(socketAuth);

io.on("connection", (socket) => {
    const username = socket.user.fname;
    console.log(username, "connected");

    socket.join(username);

    socket.on("chat message", async (msg) => {
        try {
            await Message.create({
                sender: msg.sender,
                reciever: msg.reciever,
                content: msg.content,
                users: [msg.sender, msg.reciever]
            });

            io.to(msg.sender).emit("chat message", msg);
            io.to(msg.reciever).emit("chat message", msg);

        } catch(err) {
            console.log("Can't keep track of this message!", err);
        }
    });

    socket.on("disconnect", () => {
        console.log(username, "disconnected");
    });
});


main()
.then(()=>{
    console.log("connected to mongodb successfully!");
}).catch((err)=>{
    console.log("failed to connect with mongodb!", err);
});

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
}

const port = process.env.PORT;
server.listen(port, ()=>{
    console.log(`server is running on http://localhost:${port}`);
});

app.use(cookieParser());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));

const transport = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_MAIL,
        pass: process.env.BREVO_PASS
    }, 
    logger: true,
    debug: true
});

function generateOTP() {
    let otp = "";
    let digits = "0123456789";
    for(let i = 0; i < 6; i++) {
        let rdm = Math.floor(Math.random() * 10);
        otp += digits[rdm];
    }
    return otp;
}

const sentOTP = async (to, otp) => {
    try {
        const info = await transport.sendMail({
            from: "Zappy Auth <vaibhavpacherwal5@gmail.com>",
            to,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}. It will expire in 5 minutes.`
        });

    } catch(err) {
        console.log("failed to generate OTP!");
    }
}

app.get("/", (req, res)=>{
    res.render("routes/index.ejs");
});

app.get("/signup-form", (req, res)=>{
    res.render("routes/signup.ejs");
});

app.post("/signup", async (req, res)=>{
    const {fname, lname, username, email, phone, password, confirmedPass} = req.body;
    if(password != confirmedPass) {
        res.send("password do not match, try again!");
    }
    try {
        await User.create({
            fname: fname,
            lname: lname,
            username, username,
            email: email,
            phone: phone,
            password: password
        });
        res.redirect("/");
    } catch(err) {
        console.log("signup failed, try again later!");
    }
});

app.get("/login-form", (req, res)=>{
    res.render("routes/login.ejs");
});

app.post("/login", async (req, res)=>{
    const {username, password} = req.body;
    try {
        const details = await User.findOne({username: username});
        if(details && (password == details.password)) {
            const token = generateToken(details._id);
            res.cookie("token", token, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.redirect("/chats");
        } else {
            return res.status(401).json({ message: "Invalid Username or Password" });
        } 
    }catch(err) {
        console.log("can't perform operations right now!");
    }
});

app.get("/verification", (req, res)=>{
    res.render("routes/email-verification.ejs");
});

const map = new Map();

app.post("/verify-email", async (req, res)=>{
    let {email} = req.body;
    try {
        const user = await User.findOne({email: email});
        if(!user) {
            return res.send("invalid email, try again!");
        }
        const otp = generateOTP();
        map.set("otp", otp);
        sentOTP(email, otp);
        res.render("routes/otp-verification.ejs", {email});
    } catch(err) {
        console.log("user doesn't exist!");
    }
});

app.post("/verify-otp", async (req, res)=>{
    const {email, otp} = req.body;
    try {
        const user = await User.findOne({email: email});
        if(user && (otp == map.get("otp"))) {
            let token = generateToken(user._id);
            res.cookie("token", token, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.redirect("/chats");
        } else {
            return res.status(401).json({ message: "Invalid Username or Password" });
        }
    } catch(err) {
        console.log("failed to login!");
    }
});

app.get("/chats", protect, async (req, res) => {
    const details = req.user;
    try {
        let users = await User.find();
        let groups = await Group.find();
        const username = details.username;
        let requests = await Request.find({admin: username});
        let otherUsers = users.filter(user => user._id.toString() !== details._id.toString());
        let recents = await Message.find({$and: [{ users: { $in: [details.fname] } },{ sender: details.fname }]}).sort({ sendAt: -1 });
        let uniqueRecievers = new Set();
        recents.forEach(chat => {
            uniqueRecievers.add(chat.reciever);
        });
        let recievers = Array.from(uniqueRecievers);
        let recieversUsername = await Promise.all(
            recievers.map(async (reciever) => {
                let user = await User.findOne({ fname: reciever });
                return user.username;
            })
        );

        res.render("routes/chats.ejs", { details, otherUsers, recieversUsername, groups, requests });
    } catch (err) {
        console.log("Can't find user details!", err);
        res.status(500).send("Server error");
    }
});

app.get("/chats/:id", protect, async (req, res)=>{
    const {id} = req.params;
    const user1 = req.user;
    try {
        const user2 = await User.findOne({_id: id});
        const chats = await Message.find({ users: { $all: [user1.fname, user2.fname] } }).sort({ date: 1 });
        let sortedChats = [];
        let msgDates = new Set();
        chats.forEach(chat => {
            msgDates.add(chat.date);
        });
        let dates = Array.from(msgDates);
        dates.forEach(date => {
            let subData = [];
            chats.forEach(chat => {
                if(chat.date === date) {
                    subData.push(chat);
                }
            });
            sortedChats.push(subData);
        });
        
        res.render("routes/personalChats.ejs", {user1, user2, sortedChats});
    } catch(err) {
        res.send("you can't chat right now!");
    }
});

app.get("/chats/recents/:username", async (req, res)=>{
    const {username} = req.params;
    try {
        const user = await User.findOne({username: username});
        res.redirect(`/chats/${user._id}`);
    } catch(err) {
        res.send("you can't chat right now!");
    }
});

app.get("/create-group", protect, async (req, res)=>{
    const userId = req.user._id;
    try {
        const allMembers = await User.find();
        const filteredMembers = allMembers.filter(member => member._id.toString() !== userId.toString());
        res.render("routes/createGroup", {filteredMembers}); 
    } catch(err) {
        console.log("Can't Fetch Users!");
    }
});

app.post("/group", protect, async (req, res)=>{
    const gAdmin = req.user.username;
    const {gName, user} = req.body;
    let users = Array.isArray(user)?user:[user];
    users.push(gAdmin);
    try {
        await Group.create({
            groupName: gName,
            groupAdmin: gAdmin,
            members: users,
        });
        res.redirect("/chats");
    } catch(err) {
        console.log("can't create group right now");
    }
});

app.get("/chats/group/:grpName", protect, async (req, res)=>{
    const {grpName} = req.params;
    const currentUser = req.user.username;
    try {
        let grpDetails = await Group.findOne({groupName: grpName});
        let members = grpDetails.members;

        if(members.includes(currentUser)) {
            return res.render("routes/grpChats.ejs", {grpDetails});
        }
        res.render("routes/illegalMember.ejs", {grpDetails});
    } catch(err) {
        console.log("there is an error coming up!");
    }
});

app.get("/:grpName/join-request", protect, async (req, res)=>{
    const {grpName} = req.params;
    const user = req.user.username;
    try {
        const grpDetails = await Group.findOne({groupName: grpName});
        let grpAdmin = grpDetails.groupAdmin;
        await Request.create({
            user: user,
            admin: grpAdmin,
            groupName: grpName
        });
        res.render("routes/sentRequest.ejs", {grpDetails});
    } catch(err) {
        res.send("can't sent request to admin!");
    }
});

app.get("/requests", protect, async (req, res)=>{
    const username = req.user.username;
    try {
        let requests = await Request.find({admin: username});
        if(!requests) {
            return res.send("when someone wants to join any of your groups, his/her request appears here!");
        }
        res.render("routes/requestApprovals.ejs", {requests});
    } catch(err) {
        console.log("failing to gather info!");
    }
});

app.delete("/request/disapprove/:id", protect, async (req, res)=>{
    const {id} = req.params;
    try {
        await Request.findByIdAndDelete(id);
        res.redirect("/requests"); 
    } catch(err) {
        res.send("request not found!");
    }
});

app.patch("/request/approve/:id", protect, async (req, res)=>{
    const {id} = req.params;
    try {
        const request = await Request.findOne({_id: id});
        const username = request.user;
        const grpName = request.groupName;
        const group = await Group.findOne({groupName: grpName});
        const grpId = group._id;
        await Group.findByIdAndUpdate(grpId, {
            $addToSet: { members: username }
        });
        await Request.findByIdAndDelete(id);
        res.redirect("/requests"); 
    } catch(err) {
        console.log(err);
    }
});

