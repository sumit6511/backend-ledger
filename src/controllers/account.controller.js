const accountModel = require("../models/account.model");

async function createAccount(req, res) {
  const user = req.user; // Get the authenticated user from the request

  try {
    const account = await accountModel.create({ user: user._id });

    return res.status(201).json({
      msg: "Account created successfully!",
      account,
    });
  } catch (err) {
    console.error("Error creating account:", err);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the account." });
  }
}

async function getUserAccounts(req, res) {
  const user = req.user; // Get the authenticated user from the request

  try {
    const accounts = await accountModel.find({ user: user._id });

    return res.status(200).json({
      msg: "User accounts retrieved successfully!",
      accounts,
    });
  } catch (err) {
    console.error("Error retrieving user accounts:", err);
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving user accounts." });
  }
}

async function getAccountBalance(req, res) {
  const { accountId } = req.params;

  const account = await accountModel.findOne({
    _id: accountId,
    user: req.user._id,
  });

  if (!account) {
    return res.status(404).json({ msg: "Account not found!" });
  }

  const balance = await account.getBalance();

  return res.status(200).json({
    msg: "Account balance retrieved successfully!",
    balance: balance,
  });
}

module.exports = {
  createAccount,
  getUserAccounts,
  getAccountBalance,
};
