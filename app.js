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
const { protect } = require("./middleware/authMiddleware");
const socketAuth = require("./middleware/socketAuth");
const { info } = require("console");
const { Server } = require("socket.io");
const userSocketMap = {};
const moment = require("moment");
const Message = require("./models/message");
const Group = require("./models/group");
const Request = require("./models/join-request")
const GroupChat = require("./models/groupChats");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const server = require("http").createServer(app);
require("dotenv").config();

const io = new Server(server, {
    cors: {
        origin: "*",
        credentials: true
    }
});

io.use(socketAuth);

const userGroupMap = {};

io.on("connection", (socket) => {
    const username = socket.user.fname;
    console.log(username, "connected");

    socket.join(username);
    userGroupMap[socket.id] = new Set();

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

        } catch (err) {
            console.log("Can't keep track of this message!", err);
        }
    });

    socket.on("register-user", ({ room, name }) => {
        userSocketMap[name] = socket.id;
        socket.join(room);
    });

    socket.on("get target id", (targetName) => {
        const targetId = userSocketMap[targetName];
        socket.emit("target id", targetId || null);
    });

    socket.on("call-user", ({ target }) => {
        io.to(target).emit("call-user", { target: socket.id });
    });

    socket.on("ready", ({ from }) => {
        io.to(from).emit("ready", { from: socket.id });
    });

    socket.on("offer", ({ offer, target }) => {
        io.to(target).emit("offer", { offer });
    });

    socket.on("answer", ({ answer, target }) => {
        io.to(target).emit("answer", { answer });
    });

    socket.on("candidate", ({ candidate, target }) => {
        io.to(target).emit("candidate", { candidate });
    });

    socket.on("join group", (groupName) => {
        socket.join(groupName);

        userGroupMap[socket.id].add(groupName);

        console.log(`${socket.user.fname} joined group: ${groupName}`);

        socket.to(groupName).emit("user joined", {
            username: socket.user.fname
        });
    });

    socket.on("group chat", async (msg) => {
        try {
            await GroupChat.create({
                groupName: msg.groupName,
                sender: msg.sender,
                content: msg.content,
            });

            io.to(msg.groupName).emit("group chat", msg);

        } catch (err) {
            console.log("Can't keep track of this message!", err);
        }
    });

    socket.on("disconnect", () => {
        console.log(username, "disconnected");

        const userGroups = userGroupMap[socket.id];
        if (userGroups) {
            userGroups.forEach(groupName => {
                socket.to(groupName).emit("user left", {
                    username: socket.user.fname
                });
            });
        }

        delete userGroupMap[socket.id];
    });
});

main()
    .then(() => {
        console.log("connected to mongodb successfully!");
    }).catch((err) => {
        console.log("failed to connect with mongodb!", err);
    });

async function main() {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.engine("ejs", ejsMate);
app.use(cookieParser());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

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
    for (let i = 0; i < 6; i++) {
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

    } catch (err) {
        console.log("failed to generate OTP!");
    }
}

app.get("/", (req, res) => {
    res.render("routes/index.ejs");
});

app.get("/signup-form", (req, res) => {
    res.render("routes/signup.ejs");
});

app.post("/signup", async (req, res) => {
    const { fname, lname, username, email, phone, password, confirmedPass } = req.body;
    if (password != confirmedPass) {
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
    } catch (err) {
        console.log("signup failed, try again later!");
    }
});

app.get("/login-form", (req, res) => {
    res.render("routes/login.ejs");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const details = await User.findOne({ username: username });
        if (details && (password == details.password)) {
            const token = generateToken(details._id);
            res.cookie("token", token, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            req.flash("success", "Welcome to Zappy!");
            return res.redirect("/chats");
        } else {
            req.flash("error", "invalid username or password");
            res.redirect("/login-form");
        }
    } catch (err) {
        console.log("can't perform operations right now!");
        return res.status(400).json({ error: `Can't perform operations right now! ${err}` });
    }
});

app.get("/verification", (req, res) => {
    res.render("routes/email-verification.ejs");
});

const map = new Map();

app.post("/verify-email", async (req, res) => {
    let { email } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.send("invalid email, try again!");
        }
        const otp = generateOTP();
        map.set("otp", otp);
        sentOTP(email, otp);
        res.render("routes/otp-verification.ejs", { email });
    } catch (err) {
        console.log("user doesn't exist!");
    }
});

app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (user && (otp == map.get("otp"))) {
            let token = generateToken(user._id);
            res.cookie("token", token, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.redirect("/chats");
        } else {
            return res.status(401).json({ message: "Invalid Username or Password" });
        }
    } catch (err) {
        console.log("failed to login!");
    }
});

app.get("/chats", protect, async (req, res) => {
    const details = req.user;
    try {
        let users = await User.find();
        let groups = await Group.find();
        const username = details.username;
        let requests = await Request.find({ admin: username });
        let otherUsers = users.filter(user => user._id.toString() !== details._id.toString());
        let recents = await Message.find({ users: { $in: [details.fname] } }).sort({ sendAt: -1 });
        let uniqueRecievers = new Set();
        recents.forEach(chat => {
            const secondUser = chat.users.find(user => user !== details.fname);
            if (secondUser) {
                uniqueRecievers.add(secondUser);
            }
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

app.get("/chats/:id", protect, async (req, res) => {
    const { id } = req.params;
    const user1 = req.user;
    try {
        const user2 = await User.findOne({ _id: id });
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
                if (chat.date === date) {
                    subData.push(chat);
                }
            });
            sortedChats.push(subData);
        });

        res.render("routes/personalChats.ejs", { user1, user2, sortedChats });
    } catch (err) {
        res.send("you can't chat right now!");
    }
});

app.get("/chats/recents/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username: username });
        res.redirect(`/chats/${user._id}`);
    } catch (err) {
        res.send("you can't chat right now!");
    }
});

app.get("/create-group", protect, async (req, res) => {
    const userId = req.user._id;
    try {
        const allMembers = await User.find();
        const filteredMembers = allMembers.filter(member => member._id.toString() !== userId.toString());
        res.render("routes/createGroup", { filteredMembers });
    } catch (err) {
        console.log("Can't Fetch Users!");
    }
});

app.post("/group", protect, async (req, res) => {
    const gAdmin = req.user.username;
    const { gName, user } = req.body;
    let users = Array.isArray(user) ? user : [user];
    users.push(gAdmin);
    try {
        await Group.create({
            groupName: gName,
            groupAdmin: gAdmin,
            members: users,
        });
        res.redirect("/chats");
    } catch (err) {
        console.log("can't create group right now");
    }
});

app.get("/chats/group/:grpName", protect, async (req, res) => {
    const { grpName } = req.params;
    const currentUser = req.user.username;
    try {
        let grpDetails = await Group.findOne({ groupName: grpName });
        let members = grpDetails.members;

        if (members.includes(currentUser)) {
            return res.redirect(`/group/${grpDetails._id}`);
        }
        res.render("routes/illegalMember.ejs", { grpDetails });
    } catch (err) {
        console.log("there is an error coming up!");
    }
});

app.get("/:grpName/join-request", protect, async (req, res) => {
    const { grpName } = req.params;
    const user = req.user.username;
    try {
        const grpDetails = await Group.findOne({ groupName: grpName });
        let grpAdmin = grpDetails.groupAdmin;
        await Request.create({
            user: user,
            admin: grpAdmin,
            groupName: grpName
        });
        if(grpAdmin[0] === '@') {
            req.flash("success", `Join request sent to ${grpAdmin}`);
        } else {
            req.flash("success", `Join request sent to @${grpAdmin}`);
        }
        res.redirect("/chats");
    } catch (err) {
        res.send("can't sent request to admin!");
    }
});

app.get("/requests", protect, async (req, res) => {
    const username = req.user.username;
    try {
        let requests = await Request.find({ admin: username });
        res.render("routes/requestApprovals.ejs", { requests });
    } catch (err) {
        console.log("failing to gather info!");
    }
});

app.delete("/request/disapprove/:id", protect, async (req, res) => {
    const { id } = req.params;
    try {
        await Request.findByIdAndDelete(id);
        res.redirect("/requests");
    } catch (err) {
        res.send("request not found!");
    }
});

app.patch("/request/approve/:id", protect, async (req, res) => {
    const { id } = req.params;
    try {
        const request = await Request.findOne({ _id: id });
        const username = request.user;
        const grpName = request.groupName;
        const group = await Group.findOne({ groupName: grpName });
        const grpId = group._id;
        await Group.findByIdAndUpdate(grpId, {
            $addToSet: { members: username }
        });
        await Request.findByIdAndDelete(id);
        res.redirect("/requests");
    } catch (err) {
        console.log(err);
    }
});

app.get("/group/:grpId", protect, async (req, res) => {
    const userId = req.user._id;
    const { grpId } = req.params;
    try {
        const grpDetails = await Group.findOne({ _id: grpId });
        const userDetails = await User.findOne({ _id: userId });
        const grpChats = await GroupChat.find({ groupName: grpDetails.groupName }).sort({ date: 1 });
        const members = grpDetails.members;
        let otherMembers = members.filter(member => member !== userDetails.username);
        const uniqueDates = new Set();
        grpChats.forEach(message => {
            uniqueDates.add(message.date);
        });
        const uD = Array.from(uniqueDates);
        let sortedChats = [];
        uD.forEach(date => {
            let subArr = [];
            grpChats.forEach(chat => {
                if (chat.date === date) {
                    subArr.push(chat);
                }
            });
            sortedChats.push(subArr);
        });

        res.render("routes/grpChats.ejs", { grpDetails, userDetails, otherMembers, sortedChats });
    } catch (err) {
        res.send("failed to display chats right now!");
    }
});

app.get("/exit/:grpId/", protect, async (req, res) => {
    const username = req.user.username;
    const { grpId } = req.params;
    try {
        const grpDetails = await Group.findOne({ _id: grpId });
        const admin = grpDetails.groupAdmin;
        const members = grpDetails.members;
        if (username === admin) {
            const otherMembers = members.filter(member => member !== username);
            res.render("routes/newAdmin.ejs", { grpDetails, otherMembers });
        }
        await Group.findByIdAndUpdate({ _id: grpId }, { $pull: { members: username } });
        req.flash(`You are no longer member of ${grpDetails.groupName}`)
        res.redirect("/chats");
    } catch (err) {
        res.send("unable to left this group, try again later!");
    }
});

app.post("/change-admin/:grpId", async (req, res) => {
    const adminObj = req.body;
    const { grpId } = req.params;
    try {
        const newAdmin = adminObj.user;
        await Group.findByIdAndUpdate({ _id: grpId }, { groupAdmin: newAdmin });
        res.redirect(`/exit/${grpId}`);
    } catch (err) {
        res.send("unable to make new admin");
    }
});

app.get("/chat/private/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            res.status(404).send("User Not Found!");
        }
        const userID = user._id;
        res.redirect(`/chats/${userID}`);
    } catch (err) {
        res.send(err);
    }
});

app.delete("/:grpName/remove/:nominee", protect, async (req, res) => {
    const user = req.user.username;
    const { grpName, nominee } = req.params;
    try {
        const grpDetails = await Group.findOne({ groupName: grpName });
        const grpAdmin = grpDetails.groupAdmin;
        if (grpAdmin !== user) {
            req.flash("error", "Only admin can remove any user!");
            res.redirect(`/group/${grpDetails._id}`);
        } else {
            await Group.updateOne({ groupName: grpName }, { $pull: { members: nominee } });
            res.redirect(`/group/${grpDetails._id}`);
        }
    } catch (err) {
        console.log(err);
    }
});

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    req.flash("success", "You have been logged out!");
    res.redirect("/");
});

