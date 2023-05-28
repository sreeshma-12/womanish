const isLogin = async (req, res, next) => {
    try {
        if (!req.session.user_id) {
            res.redirect("/admin");
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
};

const isAdmin = async (req, res, next) => {
    try {
        if (req.session.user_id == undefined || req.session.user_type != "admin") {
            res.redirect("/admin");
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect("/admin/home");
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
    isLogin,
    isLogout,
    isAdmin
};
