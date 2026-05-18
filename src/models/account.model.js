const mogoose = require('mongoose');


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


const accountModel = mogoose.model("account", accountSchema);




module.exports = accountModel;