const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');


async function verifyToken(req, res, next) {

    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]; // Check for token in cookies or Authorization header
    if (!token) {
        return res.status(401).json({ message: "Unauthorized access! No token provided." });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await userModel.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized access! User not found." });
        }

        req.user = user; // Attach the user object to the request for use in subsequent handlers
        
        return next(); // Return to the next middleware or route handler

    } catch (err) {
        console.error("Error verifying token:", err);
        return res.status(401).json({ message: "Unauthorized access! Invalid token." });
    }

}





module.exports = { verifyToken };