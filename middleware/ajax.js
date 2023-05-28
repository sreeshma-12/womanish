const { login } = require("../controllers/adminController");
//  const adminModel = require("../model/adminModel");
const userModel = require("../models/userModel");

module.exports = {
    ajaxSession: async (req, res, next) => {
        if (req.session.user_id) {
            res.locals.userdata = await userModel.findOne({
                _id: req.session.user_id,
            });
            next();
        } else {
            res.json("LOGIN FIRST");
        }
    },
};
