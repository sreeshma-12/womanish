const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
    },

    // id: {
    //    type: String,
    //    required: true
    // },

    //   status: {
    //     type: String,
    //     required: true
    // },
    image: {
        type: String,
        required: true,
    },
    is_delete: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("categoryData", categorySchema);
