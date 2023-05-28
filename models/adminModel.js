const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
    Email: {
        type: String,
        required: true,
    },
    pswd: {
        type: String,
        required: true,
    },
});
module.exports = mongoose.model("admin", adminSchema);
