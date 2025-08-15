const mongoose = require("mongoose");
const User = require("../models/user");
const initUserData = require("./userData");
require("dotenv").config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully!");

    await initDB();

    console.log("User data successfully inserted into database!");
  } catch (err) {
    console.error("Failed to connect or insert data:", err);
    process.exit(1);
  }
}

async function initDB() {
  await User.deleteMany({});
  await User.insertMany(initUserData.data);
}

main()
