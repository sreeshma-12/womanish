const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    shortDescription: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categoryData",
        required: true,
        index: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: "In Stock",
    },
    is_delete: {
        type: Boolean,
        default: false,
    },

    image: [
        {
            type: String,
            required: true,
        },
    ],
});
module.exports = productModel = mongoose.model("productdata", productSchema);
