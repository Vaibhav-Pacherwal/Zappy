const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (err) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

module.exports = { protect };
