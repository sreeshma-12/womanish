const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const randomstring = require("randomstring");
const userModel = require("../models/userModel");
const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
// const orderMdeL = require("../models/orderMdeL");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const couponModel = require("../models/couponModel");
let transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    auth: {
        user: config.emailUser,
        pass: config.emailPassword,
    },
});

const deleteAddress = async (req, res) => {
    await userModel.findByIdAndUpdate(req.session.user_id, {
        $pull: {
            useraddress: {
                name: req.query.name,
            },
        },
    });
    res.redirect(req.query.whereto || "/account");
};

const cancelOrder = async (req, res) => {
    await orderModel.updateOne(
        {
            _id: new ObjectId(req.query.id),
        },
        {
            $set: {
                order_status: "cancel-requested",
            },
        }
    );
    res.redirect("/orderhistory");
};

const returnOrder = async (req, res) => {
    const order = await orderModel.findOne({
        _id: new ObjectId(req.query.id),
    });
    const date = new Date(order.ordered_date);
    date.setDate(date.getDate() + 14);
    if (date > new Date()) {
        order.order_status = "return";
        order.save();
    }
    res.redirect("/orderhistory");
};

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};
//------------------ for send mail --------------------
const sendVerifyMail = async (name, email, user_id) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword,
            },
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: "For verification mail",
            html: "<p>Hii" + name + ',please click here to <a href="http:127.0.0.1:3000/verify?id=' + user_id + '">Verify',
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email has been sent:-", info.response);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
};
//-------------- for reset password send mail -----------------------
const sendResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword,
            },
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: "Reset Password",
            html: `<p>Hi ${name}, please use this OTP "${token}" to reset your password</p>`,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
        });
    } catch (error) {
        console.log(error);
    }
};
const loadRegister = async (req, res) => {
    try {
        res.render("users/registration", { status: "hh" });
    } catch (error) {
        console.log(error.message);
    }
};
const insertUser = async (req, res) => {
    try {
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            contact: req.body.contact,
            address: req.body.address,
            password: spassword,
            is_admin: 0,
        });
        const userData = await user.save();
        if (userData) {
            res.render("users/registration", {
                message: "Your registration has been successfully completed",
            });
        } else {
            res.render("users/registration", {
                message: "Your registration has been failed",
            });
        }
    } catch (error) {
        console.log(error.message);
    }
};
//--------login user methods started----------
const loginLoad = async (req, res) => {
    try {
        res.render("users/login");
    } catch (error) {
        console.log(error.message);
    }
};
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.status == "banned") {
                res.render("users/login", { message: "Admin Blocked Your account" });
            }
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    res.render("users/login", { message: "please verify your mail" });
                } else {
                    req.session.user_id = userData._id;
                    req.session.user_type = "user";
                    res.redirect("/home");
                }
            } else {
                res.render("users/login", {
                    message: "Email and password is incorrect",
                });
            }
        } else {
            res.render("users/login", { message: "Email and password is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const loadHome = async (req, res) => {
    try {
        let products = await productModel.find({ is_delete: false });
        if (req.query?.sort != undefined) {
            products = products.sort({
                price: req.query.sort == "low" ? 1 : -1,
            });
        }
        products = await products;
        res.render("users/home", { products });
    } catch (error) {
        console.log(error.message);
    }
};
const loadProductdetail = async (req, res) => {
    try {
        res.render("users/product-detail");
    } catch (error) {
        console.log(error.message);
    }
};
const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
};
//----------forgot password code started-----------------------
const forgotLoad = async (req, res) => {
    try {
        res.render("users/forgot");
    } catch (error) {
        console.log(error.message);
    }
};

const generateOTP = () =>
    Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, 0);

const forgotVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.is_verified === 0) {
                res.render("users/forgot", { message: "please verify your mail" });
            } else {
                otp = generateOTP();
                await User.updateOne({ email: email }, { $set: { token: otp } });
                sendResetPasswordMail(userData.name, userData.email, otp);
                res.render("users/forgot-pass", { email });
            }
        } else {
            res.render("users/forgot", { message: "user email is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const forgotPasswordLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token });
        if (tokenData) {
            res.render("users/forgot-password", { user_id: tokenData._id });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const resetPassword = async (req, res) => {
    try {
        const secure_password = await securePassword(req.body.password);
        const stat = await User.updateOne({ email: req.body.email, token: req.body.otp }, { $set: { password: secure_password, token: "" } });
        if (stat.modifiedCount == 1) {
            res.redirect("/");
        } else {
            res.render("users/forgot", { message: "invalid otp" });
        }
    } catch (error) {
        console.log(error.message);
    }
};
//---------- Otp ---------------------------
let otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
// console.log("otp",otp);

//-------------- OTP Page ----------------------
const otpget = (req, res) => {
    res.render("users/otp", { message: "", error: "" });
};
//-------------- Send OTP -------------------------
const sendOtp = async (req, res, next) => {
    try {
        if (req.body.password != req.body.repassword) {
            res.redirect("register?message=repeat%20password%20not%20same");
            return;
        }
        let user = await userModel.findOne({ email: req.body.email });
        if (user) {
            res.redirect("register?message=email%20already%20exists");
            return;
        }
        user = await userModel.findOne({ contact: req.body.contact});
        if (user) {
            res.redirect("register?message=phone%20already%20exists");
            return;
        }
        req.session.name = req.body.name;
        req.session.email = req.body.email;
        req.session.address = req.body.address;
        req.session.contact = req.body.contact;
        req.session.password = req.body.password;
        transporter.sendMail(
            {
                from: config.emailUser,
                to: req.body.email,
                subject: "Otp for registration is: ",
                html: `<h3>OTP for account verification is </h3><h1 style='font-weight:bold;'>${otp}</h1>`,
            },
            (error, info) => {
                if(error) {
                    res.render("users/otp", { error: "Mail send error", message: "" });
                } else {
                    res.render("users/otp", { error: "", message : "Mail sent, check your email" });
                }
            }
        );
    } catch (error) {
        console.log(error);
        next(error);
    }
};
//------------------ Verify OTP -----------------------
const verifyotp = async (req, res, next) => {
    try {
        if (req.body.otp == otp) {
            req.session.password = await bcrypt.hash(req.session.password, 10);

            let newUser = userModel({
                name: req.session.name,
                email: req.session.email,
                address: req.session.address,
                contact: req.session.contact,
                password: req.session.password,
            });

            newUser.save().then(() => {
                req.session.useremail = req.session.Email;
                req.session.userlogged = true;
                req.session.user = newUser;
                res.redirect("/");
            });
        } else {
            res.render("users/otp", { error: "Invalid OTP", message: "" });
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};
//-------------- Resend Otp ----------------------------
const resendOTP = (req, res, next) => {
    try {
        const mailoptions = {
            from: config.emailUser,
            to: req.session.email,
            subject: "OTP for registration is :",
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>",
        };
        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                res.render("users/error/error");
            }
            res.render("users/otp", { message: "OTP sent", error: "" });
        });
    } catch (err) {
        next(err);
    }
};

//-----------------------   user home -------------------------------
const home = async (req, res, next) => {
    try {
        let banner = await bannerModel.findOne({ status: true }).limit(1);
        let category = await categoryModel.find().limit(1);
        let row = await categoryModel.find().skip(1).limit(2);
        let col = await categoryModel.find().skip(3).limit(1);
        let products = await productModel.find().limit(8).populate("brand");
        res.render("users/home", {
            page: "Home",
            category,
            row,
            col,
            products,
            banner,
            user: req.session.user,
        });
    } catch (error) {
        next(error);
    }
};

async function getShopProducts(req, limit, count = false) {
    let products,
        search_obj = {};
    if (req.query.category || req.query.search) {
        if (req.query.category) {
            // category
            search_obj["brand"] = new ObjectId(req.query.category);
        }
        if (req.query.search) {
            // search
            search_obj["name"] = { $regex: req.query.search };
        }
    }
    products = productModel.find(search_obj);
    // sort
    if (req.query.sort != undefined) {
        products = products.sort({
            price: req.query.sort == "low" ? 1 : -1,
        });
    }
    // count
    if (count) {
        return await products.countDocuments();
    }
    // pagination
    if (req.query.page != undefined) {
        products = products.skip((req.query.page - 1) * limit);
    }
    // limit
    products = products.limit(limit);
    return await products;
}

// -------------------------- Shop ----------------------------
const shop = async (req, res, next) => {
    try {
        const limit = 8;
        const category = await categoryModel.find({});
        const count = await getShopProducts(req, limit, true);
        const products = await getShopProducts(req, limit, false);
        pages = Math.ceil(count / limit);
        const banners = await bannerModel.find({}).skip(2).limit(3);
        console.log(banners, "BANNER");
        res.render("users/shop", {
            page: "Shop",
            products,
            category,
            pages,
            count,
            banners,
            current_page: parseInt(req.query.page) || 1,
        });
    } catch (error) {
        next(error);
    }
};
// -------------- copy ----------------------------
const shopp = async (req, res, next) => {
    try {
        console.log("SHOP");
        let category = await categoryModel.find({ status: "Show" });
        //  let allcount = await productModel.find().count();
        let searResult = [];
        if (req.query.category) {
            let products = await productModel.find({ brand: req.query.category });
            // let count = await productModel.find({
            // brand: req.query.cate,
            // }).countDocuments();
            res.render("shop", {
                page: "Shop",
                products,
                category,
                // count,
                // allcount,
                user: req.session.user,
            });
        } else if (req.query.page) {
            const page = req.query.page;
            let products = await productModel
                .find()
                .skip((page - 1) * 8)
                .limit(8);
            //  let count = await ProductModel.find({
            // brand: req.query.cate,
            //  }).countDocuments();
            res.render("shop", {
                page: "shop",
                products,
                category,
                // count,
                // allcount,
                user: req.session.user,
            });
        } else if (req.query.search) {
            console.log(req.query.search);
            let products = await productModel.find({
                name: { $regex: req.query.search },
            });
            console.log(products);
            res.render("shop", {
                page: "shop",
                products,
                category,
                // user:req.session.user,
            });
        } else {
            let products = await productModel.find().limit(12);
            // let count = await productModel.find().limit(12).count();
            res.render("shop", {
                // page: "shop",
                products,
                category,
                // count,
                // allcount,
                user: req.session.user,
            });
        }
    } catch (error) {
        next(error);
    }
};
//-------------------------- wishlist -------------------------------
const wishlist = async (req, res, next) => {
    try {
        // let wishlist=await userModel.find({_id:req.session.user_id}).populate('wishlist')
        let wishlist = await userModel.aggregate([
            { $match: { _id: new ObjectId(req.session.user_id) } },
            {
                $lookup: {
                    from: "productdatas",
                    localField: "wishlist",
                    foreignField: "_id",
                    as: "wishlistData",
                },
            },
        ]);
        // console.log(find);
        wishlist = wishlist[0];
        res.render("users/wishlist", {
            page: "wishlist",
            wishlist,
            user: req.session.user,
        });
    } catch (error) {
        next(error);
    }
};
const addcart = async (req, res, next) => {
    try {
        const id = req.session.user_id;
        let isExist = await userModel.findOne({ _id: id });
        const prod = await productModel.findOne({
            _id: new ObjectId(req.body.proId),
        });
        let cart = isExist.cart.findIndex((pdid) => pdid.product_id == req.body.proId);
        if (prod.status == "Out of Stock") {
            res.json("out of stock");
        } else if (cart == -1) {
            await userModel.updateOne(
                { _id: id },
                {
                    $push: {
                        cart: {
                            product_id: req.body.proId,
                            quantity: 1,
                        },
                    },
                }
            );
            res.json({ key: "added" });
        } else {
            res.json("alreadyexit");
        }
    } catch (error) {
        next(error);
    }
};
const editaddress = async (req, res, next) => {
    try {
        const id = new ObjectId(req.session.user_id);
        const oldname = req.body.oldname;

        let newaddress = {
            fname: req.body.fname,
            name: req.body.name,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state,
            post: req.body.post,
            phone: req.body.phone,
            pin: req.body.pin,
        };
        await userModel.updateOne(
            { _id: id },
            {
                $pull: {
                    useraddress: {
                        name: oldname,
                    },
                },
            }
        );
        await userModel.updateOne(
            { _id: id },
            {
                $push: { useraddress: newaddress },
            }
        );
        res.redirect("back");
    } catch (error) {
        next(error);
    }
};
// ---------------------- address -----------------------------
const addaddress = async (req, res, next) => {
    try {
        const id = new ObjectId(req.session.user_id);
        console.log(req.body);
        let newaddress = {
            fname: req.body.fname,
            name: req.body.name,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state,
            post: req.body.post,
            phone: req.body.phone,
            pin: req.body.pin,
        };
        // console.log(newaddresss)
        await userModel.updateOne({ _id: id }, { $push: { useraddress: newaddress } });
        res.redirect("back");
    } catch (error) {
        next(error);
    }
};
// -------------------------- check out --------------------
const checkout = async (req, res, next) => {
    try {
        let id = req.query.id;
        let orderData = await orderModel.findOne({
            _id: id,
            order_status: "pending",
        });
        const coupon = await couponModel.find();
        userdetials = await userModel.findById(req.session.user_id);
        //  let cartbill = await userModel.findOne({ _id: req.session.user_id });

        // let userData = await userModel.findOne({_id:req.session.user_id}).populate('cart.product_id')
        // let cart = await userModel.aggregate([{$match:{_id:req.session.user_id}}])
        // console.log(orderData,"..............");
        res.render("users/checkout", {
            // page: "none",
            // cart,
            // cartbill,
            // userData,
            orderData,
            user: req.session.user,
            coupon,
            userdetials,
        });
    } catch (error) {
        next(error);
    }
};
const checkoutform = async (req, res, next) => {
    try {
        let usedFromWallet = false;
        if (req.body.optradio != "cod") {
            return;
        }
        let order = await orderModel.findOne({
            _id: req.body.id,
        });
        const amount = order.bill_amount;
        let usr = await userModel.findById(req.session.user_id);
        const wallet = usr.wallet;
        if (wallet >= amount) {
            await userModel.findByIdAndUpdate(req.session.user_id, {
                $inc: {
                    wallet: -amount,
                },
                $push: {
                    wallet_history: wallet - amount,
                },
            });
            usedFromWallet = true;
        }
        if (!order) {
            res.json({ success: false });
        }
        await orderModel.updateOne(
            {
                _id: req.body.id,
            },
            {
                $set: {
                    address: {
                        fname: req.body.fname,
                        house: req.body.address1,
                        phonenumber: req.body.pnumber,
                        post: req.body.post,
                        pin: req.body.pincode,
                        city: req.body.city,

                        state: req.body.state,
                    },
                    order_status: "completed",
                    "payment.payment_id": "COD_" + req.body.id,
                    "payment.payment_order_id": "COD_noOID",
                    "payment.payment_method": "cash_on_delivery",
                    "delivery_status.ordered.state": true,
                    "delivery_status.ordered.date": Date.now(),
                },
            }
        );
        console.log(req.body.couponcode, "CODE");

        const coupon = await orderModel.findByIdAndUpdate(req.body.id, {
            "coupon.code": req.body.couponcode,
            "coupon.discount": req.body.discount,
            bill_amount: req.body.billAmount,
        });
        console.log("coupon=", coupon);
        const user = await userModel.findById(req.session.user_id);
        await Promise.all(
            user.cart.map((item) => {
                return productModel.findByIdAndUpdate(item.product_id, {
                    $inc: {
                        stock: -item.quantity,
                    },
                });
            })
        );
        const prods = await Promise.all(
            user.cart.map((item) =>
                productModel.findOne({
                    _id: new ObjectId(item.product_id),
                    stock: {
                        $lte: 0,
                    },
                })
            )
        );
        for (let i = 0; i < prods.length; i++) {
            if (prods[i] != null) {
                prods[i].status = "Out of Stock";
                prods[i].save();
            }
        }
        await user.updateOne({ cart: [] });
        res.json({ success: true, usedFromWallet });
    } catch (error) {
        console.log(error);
        res.json({ success: false });
    }
};

// ------------------ verify payment -----------------------------------
const payment = async (req, res, next) => {
    try {
        console.log("verify", req.body);
        const { payment, order } = req.body;
        let hmac = crypto.createHmac("sha256", "OxPD34ItyleLJgzGlWfCQa1p");
        hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
        hmac = hmac.digest("hex");
        if (hmac === payment.razorpay_signature) {
            console.log("payment success");
            const updatePayStatus = await order.findOneAndUpdate({ _id: order.receipt }, { paymentStatus: "completed" });
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
        //res.send(req.body)
    } catch (e) {
        next(e);
    }
};

// ----------------------------  try code --------------------------------

const verifyPayment = async (req, res, next) => {
    try {
        const id = req.session.user._id;
        await orderModel.updateOne({ _id: req.session.OrderId, user_Id: req.session.user._id }, { $set: { paymentStatus: "Paid", paymentMethod: "Online Payment" } }).then((data) => {
            res.json({ success: true });
        });

        const userData = await userModel.findById(res.locals.userdata._id);
        const cartProducts = userData.cart;

        for (let i = 0; i < cartProducts.length; i++) {
            let singleProduct = await productModel.findById(cartProducts[i].product_id);

            singleProduct.stock -= cartProducts[i].quantity;

            if (singleProduct.stock <= 0) {
                singleProduct.status = "Out of Stock";
            }

            singleProduct.save();
        }
        const userCart = await userModel.updateOne({ _id: id }, { $unset: { cart: { $exists: true } } });
        req.session.OrderId = "";
    } catch (error) {
        next(error);
    }
};
// ------------------------- order history---------------------------------------------
const orderhistory = async (req, res, next) => {
    const id = req.session.user_id;

    const userData = await userModel.findOne({ _id: id });
    const orderDetails = await orderModel
        .find({ userid: req.session.user_id })
        .sort({
            ordered_date: -1,
        })
        .populate("products.product_id");
    res.render("users/orderhistory", {
        userData,
        orderDetails,
        user: req.session.user,
    });
};

// --------- view order --------------------

const orderDetails = async (req, res, next) => {
    try {
        const orderid = req.params.id;

        orderModel
            .findById(orderid)
            .populate("products.product_id")
            .then((orderDetails) => {
                console.log("HELLO=", orderDetails);

                res.render("users/singleOrder", {
                    page: "account",
                    orderDetails,
                    user: req.session.user_id,
                });
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// ----------------------------- Delete Item -----------------------
deleteitem: async (req, res, next) => {
    try {
        await userModel.updateOne({ _id: res.locals.userdata.id }, { $pull: { wishlist: req.body.id } });
        res.json("added");
    } catch (error) {
        next(error);
    }
};

// ------------------- single product ---------------------------
const productdetails = async (req, res, next) => {
    try {
        let product = await productModel.findOne({
            _id: new ObjectId(req.query.pid),
        });
        // console.log(product)
        let brand = await categoryModel.findOne({
            _id: product.brand,
        });
        res.render("users/product-detail", {
            product,
            brand,
        });
    } catch (error) {
        next(error);
    }
};
// ---------- cart ----------------

const cart = async (req, res, next) => {
    try {
        // ------------------
        // let cart = await userModel.aggregate([{$match:{_id:mongoose.Types.ObjectId(req.session.user_id)}},

        // let userData = await userModel.findOne(
        //     { _id: req.session.user_id },
        //     {
        //         cart: {
        //             product_id: 1,
        //             quantity: 1,
        //         },
        //         wallet: 1
        //     }
        // )
        // .populate("cart.product_id");

        // let userData = await userModel.findOne({ _id: req.session.user_id }).populate("cart.product_id");

        // console.log(userData);
        // console.log(userData.cart);
        // console.log(userData.cart.product_id);
        //  let cart = await userModel.aggregate([{$match:{_id:req.session.user_id}},
        //   {$lookup:{
        //     from:"productdatas",
        //     localField:"cart",
        //     foreignField:"_id",
        //     as:"cartData"
        //     }
        //   }
        //   ]);
        // -----------
        const id = req.session.user_id;
        let cart = await userModel.findOne({ _id: id }).populate("cart.product_id");
        // console.log(cart);
        res.render("users/cart", {
            page: "cart",
            cart,
            userData: cart,
            user: req.session.user,
        });
    } catch (error) {
        next(error);
    }
};
const about = async (req, res, next) => {
    res.render("users/about", {
        user: req.session.user,
    });
};
const contact = async (req, res, next) => {
    res.render("users/contact", {
        user: req.session.user,
    });
};
const orderComplete = async (req, res, next) => {
    res.render("users/order-complete", {
        user: req.session.user,
    });
};

const addtocart = async (req, res, next) => {
    console.log("addtocart");
    try {
        // const id = res.locals.userdata;

        const pdid = req.body.proId;
        let prod = await productModel.findOne({ _id: pdid });
        console.log(prod);
        let isExist = await userModel.findOne({ _id: req.session.user_id });
        let cart = isExist.cart.findIndex((pdid) => pdid.product_id == req.body.pdid);
        if (cart == -1) {
            await userModel.updateOne(
                { _id: req.session.user_id },
                {
                    $push: {
                        cart: {
                            product_id: pdid,
                            quantity: 1,
                            // price: productprice.price,
                        },
                    },
                }
            );
            res.json({ key: "added", price: prod.price });
        } else {
            res.json("alreadyexit");
        }
    } catch (error) {
        next(error);
    }
};
// ----------------------------------------------

const createOrder = async (req, res) => {
    try {
        const { userId, address, billAmount, payment, products } = req.body;

        const newOrder = newOrder({
            user_id: userId,
            address: address,
            bill_amount: billAmount,
            payment: payment,
            products: products,
        });

        const savedOrder = await newOrder.save();

        res.status(201).json(savedOrder);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating order");
    }
};

const orderid = async (req, res, next) => {
    const id = req.session.user_id;
    let total = 0;
    let cartProduct = [];
    const cartbill = await userModel.findOne({ _id: id }).populate("cart.product_id");
    // console.log(JSON.stringify(cartbill));
    cartbill.cart.forEach((id) => {
        total = total + id.quantity * id.product_id.price;
        let Product = {
            product_id: id.product_id._id,
            name: id.product_id.name,
            quantity: id.quantity,
            price: id.product_id.price,
        };
        cartProduct.push(Product);
    });
    let product = {
        userid: req.session.user_id,
        bill_amount: total,
        products: cartProduct,
        coupon: { discount: 0 },
    };
    let newOrder = new orderModel(product);
    newOrder.save().then((data) => {
        res.json(data);
    });
};
//---------------------- Cart Quantity Increase -----------------------------//
const quantity = async (req, res, next) => {
    try {
        const id = req.session.user_id;
        const cdid = req.body.id;
        let productcheck = await userModel.findOne({ _id: id, "cart._id": cdid });
        productcheck.cart.forEach(async (val, i) => {
            if (val._id.toString() == cdid.toString()) {
                productquantity = await productModel.findOne({ _id: val.product_id });
                if (productquantity.stock <= val.quantity) {
                    res.json({ key: "over", price: productquantity.stock });
                } else {
                    await userModel.updateOne({ _id: id, "cart._id": cdid }, { $inc: { "cart.$.quantity": 1 } });
                    res.json("added");
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
//--------------------------- Cart Ouantity decrease -----------------------//
const quantitydec = async (req, res, next) => {
    try {
        const id = req.session.user_id;
        const cdid = req.body.id;
        let quantitycheck = await userModel.findOne({
            _id: id,
            "cart._id": cdid,
        });
        quantitycheck.cart.forEach(async (val, i) => {
            if (val._id.toString() == cdid.toString()) {
                if (val.quantity <= 1) {
                    await userModel.updateOne({ _id: id }, { $pull: { cart: { _id: cdid } } });
                    res.json("deleted");
                } else {
                    await userModel.updateOne({ _id: id, "cart._id": cdid }, { $inc: { "cart.$.quantity": -1 } });
                    res.json("added");
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
const cartDelete = async (req, res, next) => {
    try {
        const id = req.params.id;
        await userModel.findOne({ _id: id });

        await userModel.updateOne({ _id: req.session.user_id }, { $pull: { cart: { _id: id } } }).then(() => {
            res.redirect("/cart");
        });
    } catch (error) {
        next(error);
    }
};
const wishlistDelete = async (req, res, next) => {
    try {
        const id = req.params.id;
        await userModel
            .findByIdAndUpdate({ _id: req.session.user_id }, { $pull: { wishlist: id } })
            .then(() => {
                res.redirect("/wishlist");
            })
            .catch((err) => {
                console.log(err);
            });
    } catch (error) {
        next(error);
    }
};
const productdet = async (req, res, next) => {
    res.render("users/product-detail", {
        user: req.session.user,
    });
};
const account = async (req, res, next) => {
    userdetials = await userModel.findById(req.session.user_id);
    // console.log(userdetials)

    res.render("users/account", {
        user: req.session.user,
        userdetials,
    });
};
const couponValidate = async (req, res, next) => {
    try {
        const user = req.session.user_id;
        const code = req.body.couponCode;
        const total = req.body.subTotal;
        const isValidCode = await couponModel.findOne({
            couponCode: code,
            expiryDate: { $gte: new Date().getTime() },
        });
        // const isValidCode = await couponModel.findOne({ couponCode: code });
        if (!isValidCode) {
            return res.json({
                success: false,
                message: "Coupon does not exist",
                isVerified: false,
                newToCoupon: false,
            });
        }
        const minimumPamount = isValidCode.minimumAmount;
        let discountAmount;

        const userData = await userModel.findById(user);
        console.log(code, "DATA");
        const appliedCoupons = userData.appliedCoupons.map((item) => item.couponCode);
        console.log("appliedCoupons", appliedCoupons);
        if (appliedCoupons.includes(code)) {
            res.json({
                success: false,
                message: "Coupon Already Applied",
                isVerified: true,
                newToCoupon: false,
            });
        } else {
            if (minimumPamount <= total) {
                discountAmount = total * isValidCode.percentage * 0.01;
            }
            console.log("dis", discountAmount);
            res.json({
                success: true,
                message: "Coupon is Valid.",
                isVerified: true,
                newToCoupon: true,
                discountAmount,
            });
        }
    } catch (error) {
        next(error);
    }
};
const wallet = async (req, res, next) => {
    try {
        let wallet = await userModel.aggregate(
            { $match: { _id: new ObjectId(req.session.user_id) } },
            {
                $lookup: {
                    from: "productdatas",
                    localField: "wallet",
                    foreignField: "_id",
                    as: "walletData",
                },
            }
        );
    } catch (error) {
        next(error);
    }
};

const orderli = async (req, res, next) => {
    try {
        // const order = await orderModel.findById(orderid).populate("products.product");
        //  const productImage = order.products[0].product.image;
        console.log(req.params.id, "ID");
        orderModel
            .findOne({ _id: req.params.id })
            .populate(["products.product_id", "userid"])
            .then((order) => {
                console.log("strrr", order);
                res.render("users/singleOrder", {
                    page: "order",
                    //  admin: res.locals.admindata.name,
                    ustatus: "false",
                    order,
                    // image
                });
            });
    } catch (error) {
        next(error);
    }
};

// const orderlist = (req, res, next) => {
//   try {
//     orderModel
//       .findOne({ _id: req.params.id })
//       .populate(["products.product_id", "userid"])
//       .then((singleorder) => {
//         res.render("users/singleOrder", {
//           page: "order",
//  admin: res.locals.admindata.name,
//           ustatus: "false",
//           singleorder,
//         });
//       });
//   } catch (error) {
//     next(error);
//   }
// };

const walletHistory = async (req, res) => {
    const user = await userModel.findById(req.session.user_id);
    res.render("users/walletHistory", {
        data: user.wallet_history || [],
    });
};

module.exports = {
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    forgotLoad,
    forgotVerify,
    forgotPasswordLoad,
    resetPassword,
    loadProductdetail,
    otpget,
    sendOtp,
    verifyotp,
    resendOTP,
    shop,
    wishlist,
    addcart,
    productdetails,
    addaddress,
    checkout,
    cart,
    about,
    // contact,
    orderComplete,
    addtocart,
    quantitydec,
    quantity,
    cartDelete,
    wishlistDelete,
    createOrder,
    orderid,
    checkoutform,
    orderhistory,
    productdet,
    payment,
    orderDetails,
    shopp,
    account,
    couponValidate,
    wallet,
    cancelOrder,
    returnOrder,
    deleteAddress,
    orderli,
    walletHistory,
    editaddress,
};
