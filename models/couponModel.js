const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true,
    },
    couponCode: {
        type: String,
        required: true,
    },
    percentage: {
        type: String,
        required: true,
    },
    minimumAmount: {
        type: Number,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    couponUser: [mongoose.Schema.Types.ObjectId],
});
module.exports = couponModel = mongoose.model("couponData", couponSchema);
