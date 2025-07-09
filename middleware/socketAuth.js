const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/user");

const socketAuth = async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error("No cookies found"));

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.token;

    if (!token) return next(new Error("No token found"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    return next(new Error("Authentication error"));
  }
};

module.exports = socketAuth;

