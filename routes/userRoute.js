const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/userImages"));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + "-" + file.originalname;
        cb(null, name);
    },
});

const upload = multer({ storage: storage });
const userController = require("../controllers/userController");
const ajax = require("../middleware/ajax");
router.get("/register", auth.isLogout, userController.loadRegister);
router.post("/register", upload.single("image"), userController.insertUser);
router.get("/", auth.isLogout, userController.loginLoad);
router.get("/login", auth.isLogout, userController.loginLoad);
router.post("/otp", userController.sendOtp);
router.post("/verifyotp", userController.verifyotp);
router.get("/resend", userController.resendOTP);
router.get("/about", userController.about);
// router.get("/contact", userController.contact);
router.get("/wishlist", auth.isLogin, auth.isBlocked, userController.wishlist);
router.get("/shop", auth.isLogin, auth.isBlocked, userController.shop);
// router.get("/shop", auth.isLogin, auth.isBlocked, userController.shopp);
router.get("/return-order", auth.isLogin, auth.isBlocked, userController.returnOrder);
router.get("/cancel-order", auth.isLogin, auth.isBlocked, userController.cancelOrder);
router.get("/orderhistory", auth.isLogin, auth.isBlocked, userController.orderhistory);
router.get("/checkout", auth.isLogin, auth.isBlocked, userController.checkout);
router.get("/cart", auth.isLogin, auth.isBlocked, userController.cart);
router.get("/order-complete", auth.isLogin, auth.isBlocked, userController.orderComplete);
router.post("/orderid", auth.isLogin, auth.isBlocked, userController.orderid);
router.post("/checkoutform", auth.isLogin, auth.isBlocked, userController.checkoutform);
router.post("/addwishlist", auth.isLogin, auth.isBlocked, userController.addwishlist);
router.post("/addwishlist", auth.isLogin, auth.isBlocked, ajax.ajaxSession, userController.addwishlist);
router.post("/addtocart", auth.isLogin, auth.isBlocked, userController.addtocart);
router.post("/delete-cart/:id", auth.isLogin, auth.isBlocked, userController.cartDelete);
router.post("/delete-wishlist/:id", auth.isLogin, auth.isBlocked, userController.wishlistDelete);
router.post("/quantity", auth.isLogin, auth.isBlocked, userController.quantity);
router.post("/quantitydec", auth.isLogin, auth.isBlocked, userController.quantitydec);
router.post("/orders/create", auth.isLogin, auth.isBlocked, userController.createOrder);
router.post("/product-detail", auth.isLogin, auth.isBlocked, userController.loadProductdetail);
router.post("/product-detail", auth.isLogin, auth.isBlocked, ajax.ajaxSession, userController.loadProductdetail);
router.get("/product-detail", auth.isLogin, auth.isBlocked, userController.productdetails);
router.get("/productdetails", auth.isLogin, auth.isBlocked, userController.productdetails);
// router.get("/payment", auth.isLogin, auth.isBlocked,userController.verifypayment);
router.get("/product-det", auth.isLogin, auth.isBlocked, userController.productdet);
router.get("/home", auth.isLogin, auth.isBlocked, userController.loadHome);
 router.get("/orderDetails/:id", auth.isLogin, auth.isBlocked, userController.orderDetails);
router.get("/singleOrder/:id",  userController.orderlist);
router.get("/account", auth.isLogin, auth.isBlocked, userController.account);
router.post("/login", userController.verifyLogin);
router.get("/logout", userController.userLogout);
router.get("/forgot", auth.isLogout, userController.forgotLoad);
router.post("/forgot", userController.forgotVerify);
router.get("/forgot-password", auth.isLogout, userController.forgotPasswordLoad);
router.post("/forgot-password", userController.resetPassword);
router.post("/couponvalidate", userController.couponValidate);
router.post("/mywallet", userController.wallet);
router.post("/addaddress", userController.addaddress);
router.get("/delete-address", auth.isLogin, auth.isBlocked, userController.deleteAddress)

module.exports = router;
