const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cookieParser()); // Middleware to parse cookies

/*
 * - Importing routes
 */
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");

app.get("/", (req, res) => {
  res.json({ msg: "The Ledger Service is up and running!" });
});

/*
 * - Mounting routes
 */
app.use("/api/auth", authRouter); // Mount the auth routes at /api/auth
app.use("/api/accounts", accountRouter); // Mount the account routes at /api/accounts
app.use("/api/transactions", transactionRouter); // Mount the transaction routes at /api/transactions

module.exports = app;
