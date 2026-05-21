const { Router } = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

/* POST /api/transactions/create
 * - Creates a new transaction
 * - Requires authentication
 */

transactionRoutes.post(
  "/create",
  authMiddleware.verifyToken,
  transactionController.createTransaction,
);

/**
 * - POST /api/transactions/system/initial-funds
 * - Creates an initial fund transaction from a system account to a user account
 * - Requires authentication
 * - Only accessible by admin users
 */

transactionRoutes.post(
  "/system/initial-funds",
  authMiddleware.verifyToken,
  authMiddleware.verifyAdmin,
  transactionController.createInitialFundsTransation,
);

module.exports = transactionRoutes;
