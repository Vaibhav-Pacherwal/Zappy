const mongoose = require("mongoose");
const User = require("../models/user");
const initUserData = require("./userData");
require("dotenv").config();

main()
.then(()=>{
    console.log("connected to mongodb successfully!");
}).catch((err)=>{
    console.log("failed to connect with mongodb!");
});

async function main() {
    await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    });
}

async function initDB() {
    await User.deleteMany({});
    await User.insertMany(initUserData.data);
}

initDB()
.then(()=>{
    console.log("user data successfully inserted into database!");
}).catch((err)=>{
    console.log("failed to insert user data", err);
})