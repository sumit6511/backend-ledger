const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/*
 * POST /api/accounts/create
 * - Creates a new account
 * - Requires authentication
 */

router.post(
  "/create",
  authMiddleware.verifyToken,
  accountController.createAccount,
);

/**
 * - GET /api/accounts/
 * - Retrieves all accounts associated with the authenticated user
 * - Requires authentication
 * - Only accessible by the account owner
 */

router.get("/", authMiddleware.verifyToken, accountController.getUserAccounts);

/**
 * - GET /api/accounts/balance/:accountId
 * - Retrieves the balance of the authenticated user's account specified by accountId
 * - Requires authentication
 * - Only accessible by the account owner
 */

router.get(
  "/balance/:accountId",
  authMiddleware.verifyToken,
  accountController.getAccountBalance,
);

module.exports = router;
