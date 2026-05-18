const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');



/**
* - User Registration Controller
* - POST /api/auth/register
*/

async function registerUser(req, res) {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: "Name, email, and password are required!" });
    }

    const isUserAlreadyRegistered = await userModel.findOne({ email });

    if (isUserAlreadyRegistered) {
        return res.status(422).json({ 
            msg: "User with this email already exists!",
            status: "failed"
        });
    }

    const user = await userModel.create({ name, email, password });

    const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
    );

    res.cookie("token", token);

    res.status(201).json({
        msg: "User registered successfully!",
        status: "success",
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });

    // Send registration email
    await emailService.sendRegistrationEmail(user.email, user.name);

}



/**
 * - User Login Controller
 * - POST /api/auth/login
 */

async function loginUser(req, res) {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Email and password are required!" });
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
        return res.status(401).json({ msg: "Invalid email or password!" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return res.status(401).json({ msg: "Invalid email or password!" });
    }

    const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
    );

    res.cookie("token", token);

    return res.status(200).json({
        msg: "User logged in successfully!",
        status: "success",
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });

}




module.exports = { registerUser, loginUser };