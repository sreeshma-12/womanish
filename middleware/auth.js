const userModel = require("../models/userModel");

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            next();
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.log(error.message);
    }
};
const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect("/home");
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
};
const isBlocked = async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const user = await userModel.findById(user_id);
    if (user?.status == "banned") {
      return res.redirect("/logout");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
  isBlocked,
};
