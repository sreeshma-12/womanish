const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    contact: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    // is_admin:{
    //  type:Number,
    //   required:true
    //  },
    token: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        default: "unbanned",
    },
    useraddress: [
        {
            name: { type: String },
            city: { type: String },
            district: { type: String },
            state: { type: String },
            post: { type: String },
            pin: { type: Number },
            phone: { type: Number },
        },
    ],
    cart: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "productdata",
                required: true,
            },
            quantity: { type: Number, required: null },
        },
    ],
    wishlist: [mongoose.Schema.Types.ObjectId, (ref = "productdata")],
    wallet: {
        type: Number,
        default: 0,
    },
    appliedCoupons: [{ couponCode: { type: String } }],
});

module.exports = mongoose.model("User", userSchema);
