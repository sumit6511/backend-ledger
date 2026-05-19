const userModel = require("../models/user.model");
const tokenBlacklistModel = require("../models/blacklist.model");
const jwt = require("jsonwebtoken");

async function verifyToken(req, res, next) {
  const token =
    req.cookies.token || req.headers["authorization"]?.split(" ")[1]; // Check for token in cookies or Authorization header
  if (!token) {
    return res.status(401).json({
      msg: "Unauthorized access! No token provided.",
    });
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({
      msg: "Unauthorized access! Token has been blacklisted.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await userModel.findById(decoded.userId).select("+systemRole");
    if (!user) {
      return res.status(401).json({
        msg: "Unauthorized access! User not found.",
      });
    }

    req.user = user; // Attach the user object to the request for use in subsequent handlers

    return next(); // Return to the next middleware or route handler
  } catch (err) {
    console.error("Error verifying token:", err);
    return res.status(401).json({ msg: "Unauthorized access! Invalid token." });
  }
}

function verifyAdmin(req, res, next) {
  const user = req.user; // Get the authenticated user from the request

  if (!user.systemRole) {
    return res.status(403).json({ msg: "Forbidden access! Admins only." });
  }

  return next(); // Return to the next middleware or route handler
}

module.exports = { verifyToken, verifyAdmin };
