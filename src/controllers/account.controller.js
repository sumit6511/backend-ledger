const accountModel = require('../models/account.model');



async function createAccount(req, res) {

    const user = req.user; // Get the authenticated user from the request

    try {
        const account = await accountModel.create({ user: user._id });

        return res.status(201).json({
            msg: "Account created successfully!",
            account
        });
    } catch (err) {
        console.error("Error creating account:", err);
        return res.status(500).json({ message: "An error occurred while creating the account." });
    }

}





module.exports = { createAccount };