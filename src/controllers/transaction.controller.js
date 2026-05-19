const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");

const emailService = require("../services/email.service");

/**
 * Create a new transaction
 * THE 10-STEP TRANSACTION PROCESS:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction with PENDING status
 * 6. Create DEBIT ledger entry for sender
 * 7. Create CREDIT ledger entry for receiver
 * 8. Update transaction status to COMPLETED
 * 9. Commit MongoDB transaction
 * 10. Send email notification
 *
 * * Note: If any step fails, the transaction should be rolled back and the status updated to FAILED.
 *
 * * Idempotency key is used to prevent duplicate transactions in case of network retries or client errors.
 * * MongoDB transactions ensure atomicity, so either all steps succeed or none do, maintaining data integrity.
 */

async function createTransaction(req, res) {
  /**
   * 1. Validate request
   * - Check if fromAccount, toAccount, amount, and idempotencyKey are present in the request body.
   * - Validate that amount is a positive number.
   * - Validate that fromAccount and toAccount are valid account IDs and belong to the authenticated user (for fromAccount).
   */

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      msg: "fromAccount, toAccount, amount, and idempotencyKey are required.",
    });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      msg: "Amount must be a positive number.",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(404).json({
      msg: "Invalid fromAccount. Account not found or does not belong to the authenticated user.",
    });
  }

  const toUserAccount = await accountModel.findById(toAccount);

  if (!toUserAccount) {
    return res.status(404).json({
      msg: "Invalid toAccount. Account not found.",
    });
  }

  /**
   * 2. Validate idempotency key
   * - Check if a transaction with the same idempotencyKey already exists.
   * - If it does, return a 409 Conflict response to prevent duplicate transactions.
   */

  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });

  if (existingTransaction) {
    if (existingTransaction.status === "COMPLETED") {
      return res.status(200).json({
        msg: "Duplicate idempotencyKey. Transaction already processed.",
        transaction: existingTransaction,
      });
    } else if (existingTransaction.status === "PENDING") {
      return res.status(409).json({
        msg: "Duplicate idempotencyKey. Transaction is currently being processed.",
      });
    } else if (existingTransaction.status === "FAILED") {
      return res.status(409).json({
        msg: "Duplicate idempotencyKey. Previous transaction attempt failed.",
      });
    } else if (existingTransaction.status === "REVERSED") {
      return res.status(500).json({
        msg: "Duplicate idempotencyKey. Previous transaction was reversed.",
      });
    } else {
      return res.status(409).json({
        msg: "Duplicate idempotencyKey. Transaction with this key already exists.",
      });
    }
  }

  /**
   * 3. Check account status
   * - Ensure that both fromAccount and toAccount are active and not frozen or closed.
   * - If either account is not in good standing, return a 403 Forbidden response.
   */

  if (fromUserAccount.status !== "ACTIVE") {
    return res.status(403).json({
      msg: "Sender account is not active. Transaction cannot be processed.",
    });
  }

  if (toUserAccount.status !== "ACTIVE") {
    return res.status(403).json({
      msg: "Recipient account is not active. Transaction cannot be processed.",
    });
  }

  /**
   * 4. Derive sender balance from ledger
   * - Calculate the current balance of the fromAccount by summing all related ledger entries.
   * - If the balance is insufficient to cover the transaction amount, return a 403 Forbidden response.
   */

  const senderBalance = await fromUserAccount.getBalance();

  if (senderBalance < amount) {
    return res.status(409).json({
      msg: `Insufficient funds. Current balance is ${senderBalance}, but transaction amount is ${amount}.`,
    });
  }

  let transaction;
  try {
    /**
     * 5. Create transaction with PENDING status
     * - Create a new transaction document in the database with the status set to PENDING.
     * - This indicates that the transaction is in progress and has not yet been completed.
     * - The transaction will be updated to COMPLETED or FAILED based on the outcome of the subsequent steps.
     */

    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            idempotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0];

    /**
     * 6. Create DEBIT ledger entry for sender
     * - Create a new ledger entry for the fromAccount with the type set to DEBIT and the amount equal to the transaction amount.
     * - This represents the deduction of funds from the sender's account.
     */

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await new Promise((resolve) => setTimeout(resolve, 15 * 1000));

    /**
     * 7. Create CREDIT ledger entry for receiver
     * - Create a new ledger entry for the toAccount with the type set to CREDIT and the amount equal to the transaction amount.
     * - This represents the addition of funds to the recipient's account.
     */

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toUserAccount._id,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    /**
     * 8. Update transaction status to COMPLETED
     * - If all previous steps succeed, update the transaction status to COMPLETED.
     * - This indicates that the transaction has been successfully processed.
     */

    transaction.status = "COMPLETED";
    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    /**
     * 9. Commit MongoDB transaction
     * - If all operations (creating transaction and ledger entries) are successful, commit the MongoDB transaction to persist the changes to the database.
     * - If any operation fails, the transaction will be rolled back to maintain data integrity.
     */

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    return res.status(400).json({
      msg: "Transaction PENDING! Please wait and try again later.",
    });
  }

  /**
   * 10. Send email notification
   * - After the transaction is completed, send an email notification to the recipient (toAccount) informing them of the incoming funds.
   * - The email should include details such as the amount received and the sender's account information.
   */

  await emailService.sendTransactionNotificationEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount,
  );

  return res.status(201).json({
    msg: "Transaction Successful!",
    transaction,
  });
}

/**
 * Create an initial funds transaction from SYSTEM account to a user account
 * This is used to fund user accounts when they are created or for promotional purposes. The SYSTEM account is a special account that represents the platform itself and is used for transactions that do not originate from a user, such as initial funding or refunds.
 */

async function createInitialFundsTransation(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res
      .status(400)
      .json({ msg: "toAccount, amount, and idempotencyKey are required." });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ msg: "Amount must be a positive number." });
  }

  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });

  if (existingTransaction) {
    return res.status(409).json({
      msg: "Duplicate idempotencyKey. Transaction already processed.",
    });
  }

  const toUserAccount = await accountModel.findById(toAccount);

  if (!toUserAccount) {
    return res.status(404).json({ msg: "Recipient account not found." });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(404).json({ msg: "SYSTEM user account not found." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    msg: "Initial funds transaction created successfully!",
    transaction,
    debitLedgerEntry,
    creditLedgerEntry,
  });

  // // Send email notification to recipient
  // await emailService.sendTransactionNotificationEmail(toUserAccount.email, amount, fromAccountUser._id);
}

module.exports = { createTransaction, createInitialFundsTransation };
