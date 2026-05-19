const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: true,
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
        message:
          "Status must be either PENDING, COMPLETED, FAILED, or REVERSED",
      },
      default: "PENDING",
    },
    idempotencyKey: {
      type: String,
      required: [
        true,
        "Idempotency key is required to prevent duplicate transactions",
      ],
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;
