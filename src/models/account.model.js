const mogoose = require('mongoose');
const ledgerModel = require('./ledger.model');

const accountSchema = new mogoose.Schema({
    user: {
        type: mogoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },
    status: {
        enum: {
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "Status must be either ACTIVE, FROZEN, or CLOSED"
        },
        type: String,
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: true,
        default: "NPR"
    },
}, {
    timestamps: true
});


accountSchema.index({ user: 1, status: 1});


accountSchema.methods.getBalance = async function() {

    const ledgerEntries = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        { 
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "DEBIT" ] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "CREDIT" ] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: [ "$totalCredit", "$totalDebit" ] }
            }
        }
    ]);

    return ledgerEntries.length > 0 ? ledgerEntries[0].balance : 0;

}



const accountModel = mogoose.model("account", accountSchema);




module.exports = accountModel;