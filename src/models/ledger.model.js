const mongoose = require('mongoose');


const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true,
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Ledger entry must be associated with a transaction"],
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ["DEBIT", "CREDIT"],
            message: "Type can be either DEBIT or CREDIT"
        },
        required: [true, "Type is required and must be either DEBIT or CREDIT"],
        immutable: true
    }
}, {
    timestamps: true
});


function preventLedgerModification() {
    throw new Error("Ledger entries are immutable and cannot be modified after creation.");
}


ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('update', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndRemove', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('replaceOne', preventLedgerModification);


const ledgerModel = mongoose.model("ledger", ledgerSchema);




module.exports = ledgerModel;