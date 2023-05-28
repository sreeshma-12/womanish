const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const categoryModel = require("../models/categoryModel");
const orderModel = require("../models/orderModel");
const bannerModel = require("../models/bannerModel");
const productModel = require("../models/productModel");
const couponModel = require("../models/couponModel");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// userlogin started
const loadLogin = async (req, res) => {
    try {
        res.render("admin/login");
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
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render("admin/login", { message: "Email and password incorrect" });
                } else {
                    req.session.user_id = userData._id;
                    req.session.user_type = "admin";
                    res.redirect("/admin/home");
                }
            } else {
                res.render("admin/login", { message: "Email and password incorrect" });
            }
        } else {
            res.render("admin/login", { message: "Email and password incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const cancelOrderApproval = async (req, res) => {
    const orders = await orderModel.find(
        {
            order_status: "cancel-requested",
        },
        {
            payment: 1,
            bill_amount: 1,
            products: 1,
            ordered_date: 1,
            userid: 1,
            _id: 1,
        }
    );
    res.render("admin/cancel-order", { orders });
};

const cancelOrderProcess = async (req, res) => {
    await orderModel.updateOne(
        {
            _id: new ObjectId(req.query.id),
        },
        {
            $set: {
                order_status: req.query.status,
            },
        }
    );
    if (req.query.status == "approve") {
        const user = await userModel.findOne({
            _id: new ObjectId(req.query.user_id),
        });
        const amount = parseInt(user.wallet) || 0;
        prod_ids = req.query.prod_ids?.split(",")?.map((item) => {
            item = item.split(":");
            item[1] = parseInt(item[1]);
            return item;
        });
        await Promise.all(
            prod_ids.map(([pid, quantity]) =>
                productModel.findByIdAndUpdate(pid, {
                    $inc: {
                        stock: quantity,
                    },
                })
            )
        );
        await userModel.updateOne(
            {
                _id: new ObjectId(req.query.user_id),
            },
            {
                $set: {
                    wallet: amount + parseInt(req.query.amount),
                },
            }
        );
    }
    res.redirect("/admin/cancel-order");
};

const getSalesRreport = async (filter, _from = null, _to = null) => {
    _from = _from || null;
    _to = _to || null;
    const userCount = await User.find({}).count();
    const default_filter = "d";
    filter = filter || default_filter;
    const slice_indexes = {
        d: 10,
        m: 7,
        y: 4,
    };
    const slice_index = slice_indexes[filter] || slice_indexes[default_filter] || 0;
    let agg = [];
    if (_from != null && _to != null) {
        [_from, _to] = [new Date(_from), new Date(_to)];
        agg.push({
            $match: {
                ordered_date: {
                    $gte: _from,
                    $lte: _to,
                },
            },
        });
    }
    agg.push({
        $project: {
            bill_amount: 1,
            ordered_date: 1,
            _id: 0,
        },
    });
    let sales = await orderModel.aggregate(agg);
    let orders = {};
    sales = sales
        .map((order) => {
            order.ordered_date = new Date(order.ordered_date).toISOString().slice(0, slice_index);
            return order;
        })
        .forEach((order) => {
            if (orders[order.ordered_date] == undefined) {
                orders[order.ordered_date] = 0;
            }
            orders[order.ordered_date] += order.bill_amount;
        });
    orders = Object.entries(orders).map((order) => {
        order[0] = new Date(order[0]);
        return order;
    });
    orders.sort((item_a, item_b) => item_b - item_a);
    orders = orders.map((order) => {
        order[0] = order[0].toISOString().slice(0, slice_index);
        return order;
    });
    const total_profit = orders.reduce((p, o) => p + o[1], 0);
    // console.log(orders)
    return {
        userCount,
        orders,
        total_profit,
    };
};

const loadSalesReport = async (req, res) => {
    try {
        let { from, to } = req.query;
        const userData = await User.findById({ _id: req.session.user_id });
        const { orders: day_orders } = await getSalesRreport("d", from, to);
        const { orders: month_orders } = await getSalesRreport("m", from, to);
        const { orders: year_orders, total_profit, userCount } = await getSalesRreport("y", from, to);
        // console.log(day_orders, "re")
        // console.log(month_orders, "re")
        // console.log(year_orders, "re")
        const salesReport = await orderModel.aggregate([{ $group: { _id: "$order_status", count: { $sum: 1 } } }]);
        const productCount = await productModel.countDocuments();
        const orders = await orderModel
            .find({ order_status: { $ne: "pending" } })
            .populate("userid")
            .sort({ ordered_date: -1 });
        res.render("admin/sales-report", { admin: userData, day_orders, month_orders, year_orders, total_profit, userCount, productCount, salesReport, orders });
    } catch (error) {
        console.log(error);
    }
};

const loadDashboard = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        const { userCount, orders, total_profit } = await getSalesRreport(req.query.group);
        const salesReport = await orderModel.aggregate([{ $group: { _id: "$order_status", count: { $sum: 1 } } }]);
        const productCount = await productModel.countDocuments();
        res.render("admin/home", { admin: userData, orders, total_profit, userCount, salesReport, productCount });
    } catch (error) {
        console.log(error.message);
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/admin");
    } catch (error) {
        console.log(error.message);
    }
};

const adminDashboard = async (req, res) => {
    try {
        // var search = '';
        // if (req.query.search) {
        //   search = req.query.search;
        // }
        // const userData = await User.find({
        //   is_admin: 0,
        //   $or: [
        //     { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        //     { email: { $regex: '.*' + search + '.*', $options: 'i' } },
        //     { contact: { $regex: '.*' + search + '.*', $options: 'i' } }
        //   ]
        // });
        let users = await userModel.find();
        res.render("admin/users", { users });
    } catch (error) {
        console.log(error.message);
    }
};

// ------------- products update in dashboard-----------------//
const home = async (req, res, next) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);
        let salesChart = await orderModel.aggregate([
            {
                $match: {
                    order_status: { $ne: "pending" },
                    ordered_date: {
                        $gte: startOfMonth,
                        $lt: endOfMonth,
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$ordered_date" } },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        let Orderpending = await orderModel.countDocuments({
            order_status: "pending",
        });
        let Ordercanceled = await orderModel.countDocuments({
            order_status: "canceled",
        });
        let paymentpending = await orderModel.countDocuments({
            "payment.payment_status": "pending",
        });
        let paymentpaid = await orderModel.countDocuments({
            "payment.payment_status": "completed",
        });
        let product = await productModel.find().count();
        let category = await categoryModel.find().count();
        let order = await orderModel.find({ order_status: { $ne: "pending" } }).count();
        let user = await userModel.find().count();
        orderModel
            .find({ order_status: { $ne: "pending" } })
            .populate("userid")
            .sort({ ordered_date: -1 })
            .limit(10)
            .then((orders) => {
                res.render("admin/home", {
                    page: "dashboard",
                    admin: res.locals.admindata.name,
                    orders,
                    product,
                    category,
                    order,
                    User,
                    salesChart,
                    Orderpending,
                    Ordercanceled,
                    paymentpending,
                    paymentpaid,
                });
            });
    } catch (error) {
        next(error);
    }
};
// -------------------  users list ----------------------------
const customers = async (req, res, next) => {
    try {
        const users = await userModel.find();
        res.render("admin/customers", {
            page: "customers",
            users,
            // admin: res.locals.admindata.name,
        });
    } catch (error) {
        next(error);
    }
};

//-------------- block user ------------------//

const block = async (req, res, next) => {
    try {
        const id = req.params.id;
        await userModel.updateOne({ _id: id }, { $set: { status: "banned" } }).then(() => {
            res.redirect("/admin/customers");
        });
    } catch (error) {
        next(error);
    }
};
//------------- Unblock Users -----------------

const unblock = async (req, res, next) => {
    try {
        const id = req.params.id;
        await userModel.updateOne({ _id: id }, { $set: { status: "unbanned" } }).then(() => {
            res.redirect("/admin/customers");
        });
    } catch (error) {
        next(error);
    }
};
//-------------- add new user-------------------
const newUserLoad = async (req, res) => {
    try {
        res.render("admin/new-user");
    } catch (error) {
        console.log(error.message);
    }
};
const addUser = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const contact = req.body.contact;
        const password = randomstring.generate(8);

        const spassword = await securePassword(password);

        const user = new User({
            name: name,
            email: email,
            contact: contact,
            password: spassword,
        });
        const userData = await user.save();
        if (userData) {
            res.redirect("/admin/customers");
        } else {
            res.render("admin/new-user", { message: "Something wrong" });
        }
    } catch (error) {
        console.log(error.message);
    }
};
//---------------edit user-------------------
const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        if (userData) {
            res.render("admin/edit-user", { user: userData });
        } else {
            res.redirect("/admin/customers");
        }
    } catch (error) {
        console.log(error.message);
    }
};
const updateUsers = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, contact: req.body.contact } });
        res.redirect("/admin/customers");
    } catch (error) {
        console.log(error.message);
    }
};
//---------------- delete user --------------------
const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.deleteOne({ _id: id });
        res.redirect("/admin/customers");
    } catch (error) {
        console.log(error.message);
    }
};
//---------------- add category ---------------------
const addCategory = async (req, res) => {
    try {
        const name = req.body.name;

        const oldCategory = await categoryModel.findOne({ title: { $regex: title, $options: "i" } });
        if (oldCategory) {
            res.render("admin/categoryManagement", { message: "category already exists" });
        } else {
            const newCategory = new categoryModel({
                categoryName: name,
            });
            const categoryData = await newCategory.save();
            if (categoryData) {
                res.render("admin/categoryManagement", { message: "successfully added new category" });
            } else {
                res.render("admin/categoryManagement", { message: "something went wrong.Try again" });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};
//----------------- products page -------------------
const products = async (req, res, next) => {
    try {
        const products = await productModel.find({ is_delete: false }).populate("brand");
        res.render("admin/products", {
            //   page: "Products",
            products,
            // admin: res.locals.admindata.name,
        });
    } catch (error) {
        next(error);
    }
};
const addProducts = async (req, res, next) => {
    try {
        let category = await categoryModel.find();
        res.render("admin/new-product", {
            // page: "products",
            // admin: res.locals.admindata.name,
            field: "field",
            userstatus: "false",
            category,
        });
    } catch (error) {
        next(error);
    }
};
//-------------- Add products -----------------------------
const addProduct = async (req, res, next) => {
    try {
        let category = await categoryModel.find();
        const filenames = req.files.map((file) => file.filename);
        if (
            req.body.name &&
            req.body.description &&
            req.body.shortdescription &&
            req.body.price &&
            req.body.brand &&
            req.body.stock &&
            // req.body.status &&
            filenames
        ) {
            let products = productModel({
                name: req.body.name,
                description: req.body.description,
                shortDescription: req.body.shortdescription,
                price: req.body.price,
                brand: req.body.brand,
                stock: req.body.stock,
                // status: req.body.status,
                image: filenames,
            });
            products.save().then(() => {
                res.redirect("/admin/products");
            });
        } else {
            res.render("admin/new-product", {
                // page: "products",
                // admin: res.locals.admindata.name,
                field: "no field",
                userstatus: "false",
                category,
            });
        }
    } catch (error) {
        next(error);
    }
};
//  ----------------------delete Products ---------------------
// ----------------------------------------------------------------
//    products.image.forEach((value) => {
//           fs.unlink(
//             path.join(__dirname, "../public/images/", value),
//     () => {
//     }
//    );
// });
//  ---------------------------------------------------------------

deleteproduct = async (req, res, next) => {
    try {
        const product = await productModel.findByIdAndUpdate(req.params.id, { $set: { is_delete: true } }, { new: true });
        // req.flash('success_msg', 'Product has been soft deleted');
        res.redirect("/admin/products");
    } catch (error) {
        console.log(error);
        // req.flash('error_msg', 'Error occurred while deleting the product');
        res.redirect("/admin/products");
    }
};

//------------------- category ---------------------------
const category = async (req, res) => {
    try {
        let Categories = await categoryModel.find({ is_delete: false });
        res.render("admin/category", {
            // page: "category",
            // admin: res.locals.admindata.name,
            Categories,
        });
    } catch (error) {
        console.log(error.message);
    }
};

//------------------ Add Category page -----------------------
const addcategory = (req, res, next) => {
    try {
        res.render("admin/new-category");
    } catch (error) {
        console.log(error, "error");
        next(error);
    }
};
//--------------------- Add categorys ----------------------
const addcategorydetails = async (req, res) => {
    try {
        let nameCat = req.body.name;
        const oldCategory = await categoryModel.findOne({ categoryName: { $regex: nameCat, $options: "i" }, is_delete: false });
        if (!oldCategory) {
            let category = new categoryModel({
                categoryName: nameCat,
                image: req.file.filename,
            });
            await category.save();
        }
        res.redirect("/admin/category");
    } catch (error) {
        console.log(error.message);
    }
};
const deletecategories = async (req, res) => {
    try {
        const id = req.params.id;
        // const img = req.params.val;
        await categoryModel.findByIdAndUpdate({ _id: id }, { $set: { is_delete: true } });
        //  fs.unlink(path.join(__dirname, "../public/productimages/", img), () => {
        // });
        res.redirect("/admin/category");
    } catch (error) {
        next(error);
    }
};

const Updatecategories = async (req, res, next) => {
    try {
        const oldCategory = await categoryModel.findOne({ categoryName: { $regex: req.body.name, $options: "i" } });
        if (!oldCategory) {
            let cateToUpdate = {
                categoryName: req.body.name,
                img: req.body.img,
            };
            await categoryModel.findOneAndUpdate({ _id: req.params.id }, { $set: cateToUpdate });
        }
        res.redirect("/admin/category");
    } catch (error) {
        next(error);
    }
};

// ---------------------------------------------- category edit ---------------
const editcategory = async (req, res, next) => {
    try {
        const id = req.params.id;
        let category = await categoryModel.findOne({ _id: id }).populate("categoryName");
        let products = await productModel.find();
        res.render("admin/edit-category", {
            category,
            // page: "Products",
            // admin: res.locals.admindata.name,

            field: "field",
            products,
            category,
            userstatus: "false",
        });
    } catch (error) {
        next(error);
    }
};

const updatecategory = async (req, res) => {
    try {
        const categoryData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, contact: req.body.contact } });
        res.redirect("/admin/category");
    } catch (error) {
        console.log(error.message);
    }
};

// ----------------------- banner ------------------------
const banner = async (req, res, next) => {
    try {
        const banner = await bannerModel.find();
        res.render("admin/banner", {
            // page: "banner",

            banner,
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

// --------------------- add  banner page ----------------------------
const addbanner = (req, res, next) => {
    try {
        res.render("admin/addBanner", {
            //  page: "banner",
            //  admin: res.locals.admindata.name,
            ustatus: "no",
        });
    } catch (error) {
        next(error);
    }
};
//  ---------------------- add banner ------------------
const AddBanner = (req, res, next) => {
    try {
        if (req.body.banner && req.file.filename) {
            let banner = bannerModel({
                bannerName: req.body.banner,
                description: req.body.description,
                image: req.file.filename,
            });
            banner.save().then(() => {
                res.render("admin/addBanner", {
                    // page: "banner",
                    // admin: res.locals.admindata.name,
                    ustatus: "true",
                });
            });
        } else {
            res.render("admin//banner", {
                page: "banner",
                admin: res.locals.admindata.name,
                ustatus: "false",
            });
        }
    } catch (error) {
        next(error);
    }
};
//  -------------------  Disable banner ----------------- //

disablebanner = async (req, res, next) => {
    try {
        const id = req.params.id;
        await bannerModel.updateOne({ _id: id }, { $set: { status: "false" } }).then(() => {
            res.redirect("/admin/banner");
        });
    } catch (error) {
        next(error);
    }
};

//----------------------  Enable Banner -----------------------------------//

enablebanner = async (req, res, next) => {
    try {
        const id = req.params.id;
        await bannerModel.updateOne({ _id: id }, { $set: { status: true } }).then(() => {
            res.redirect("/admin/banner");
        });
    } catch (error) {
        next(error);
    }
};
const deletebanner = async (req, res) => {
    try {
        const id = req.params.id;
        const img = req.params.val;
        await bannerModel.findOne({ _id: id });
        fs.unlink(path.join(__dirname, "../public/productimages/", img), () => {});
        bannerModel.deleteOne({ _id: id }).then(() => {
            res.redirect("/admin/banner");
        });
    } catch (error) {
        next(error);
    }
};

// -----------------------------------------------------------------
const ordermanagement = async (req, res, next) => {
    try {
        orderModel
            .find({ order_status: { $ne: "pending" } })
            .populate("userid")
            .sort({ ordered_date: -1 })
            .then((orders) => {
                res.render("admin/orders", {
                    // page: "order",
                    // admin: res.locals.admindata.name,
                    ustatus: "false",
                    orders,
                });
            });
    } catch (error) {
        next(error);
    }
};
const orderlist = (req, res, next) => {
    try {
        orderModel
            .findOne({ _id: req.params.id })
            .populate(["products.product_id", "userid"])
            .then((singleorder) => {
                res.render("admin/orderdetails", {
                    page: "order",
                    //  admin: res.locals.admindata.name,
                    ustatus: "false",
                    singleorder,
                });
            });
    } catch (error) {
        next(error);
    }
};
// ---------------- Delivary Status Update -------------------- //
const delivarystatus = (req, res, next) => {
    try {
        if (req.body.Status == "shipped") {
            orderModel
                .updateOne(
                    { _id: req.body.id },
                    {
                        $set: {
                            "delivery_status.shipped.state": true,
                            "delivery_status.shipped.date": Date.now(),
                        },
                    }
                )
                .then((data) => {
                    res.redirect("/orderlist/" + req.body.id);
                });
        } else if (req.body.Status == "out_for_delivery") {
            orderModel
                .updateOne(
                    { _id: req.body.id },
                    {
                        $set: {
                            "delivery_status.out_for_delivery.state": true,
                            "delivery_status.out_for_delivery.date": Date.now(),
                        },
                    }
                )
                .then((data) => {
                    res.redirect("/orderlist/" + req.body.id);
                });
        } else if (req.body.Status == "delivered") {
            orderModel
                .updateOne(
                    { _id: req.body.id },
                    {
                        $set: {
                            "delivery_status.delivered.state": true,
                            "delivery_status.delivered.date": Date.now(),
                        },
                    }
                )
                .then((data) => {
                    res.redirect("/orderlist/" + req.body.id);
                });
        } else {
            res.redirect("/orderlist/" + req.body.id);
        }
    } catch (error) {
        next(error);
    }
};
//------------------  Payment Pending ----------------//
const paymentpending = (req, res, next) => {
    try {
        orderModel.updateOne({ _id: req.body.id }, { $set: { "payment.payment_status": "completed" } }).then(() => {
            res.json("completed");
        });
    } catch (error) {
        next(error);
    }
};

//------------------ Invoice ----------------------//

// const invoice = (req, res, next) => {
//     try {
//         orderModel
//             .findOne({ _id: req.params.id })
//             .populate(["products.product_id", "userid"])
//             .then((invoice) => {
//                 res.render("admin/orderinvoice", {
//                     page: "order",
//                     admin: res.locals.admindata.name,
//                     ustatus: "false",
//                     invoice,
//                 });
//             });
//     } catch (error) {
//         next(error);
//     }
// };

//---------------------   invoice --------------------------//
const invoice = async (req, res, next) => {
    try {
        console.log(req.params.id, "order_id");
        const invoice = await orderModel.findById(req.params.id).populate("products.product_id");
        console.log("invoice--", invoice);
        res.render("admin/orderinvoice", {
            page: "order",
            // admin: res.locals.admindata.name,
            ustatus: "false",
            invoice,
        });
    } catch (error) {
        next(error);
    }
};

// ----------------  Coupon Page  --------------------------//
const coupon = async (req, res, next) => {
    try {
        const id = req.body.id;
        const coupon = await couponModel.find();
        const singlecoupon = await couponModel.find({ _id: id });
        res.render("admin/coupons", {
            // page: "coupon",
            // admin: res.locals.admindata.name,
            coupon,
            singlecoupon,
        });
    } catch (error) {
        next(error);
    }
};

//------------------ Add coupon -----------------------//
const addcoupon = async (req, res, next) => {
    try {
        // const cpname = req.body.couponName.toLowerCase();
        const cpcheck = await couponModel.findOne({ couponName: req.body.couponName });

        if (!cpcheck) {
            let coupon = couponModel({
                couponName: req.body.couponName,
                couponCode: req.body.couponCode,
                percentage: req.body.percentage,
                expiryDate: req.body.expDate,
                minimumAmount: req.body.minimumAmount,
            });

            coupon.save().then(() => {
                res.redirect("/admin/coupons");
            });
        } else {
            res.redirect("/admin/coupons");
        }
    } catch (error) {
        next(error);
    }
};
//----------------------------  Update Coupon -------------------//

updatecoupon = async (req, res) => {
    try {
        const id = req.params.id;
        const cname = req.body.couponName.toLowerCase();
        let coupToUpdate = {
            couponName: cname,
            couponCode: req.body.couponCode,
            percentage: req.body.percentage,
            expiryDate: req.body.expDate,
            minimumAmount: req.body.minimumAmount,
        };
        await couponModel.updateOne({ _id: id }, { $set: coupToUpdate });
        res.redirect("/admin/coupon");
    } catch (error) {
        next(error);
    }
};

// ----------------------   ajax Coupon Edit ------------------------------- //

ajaxcoupon = async (req, res, next) => {
    try {
        let coupondet = await couponModel.findOne({ _id: req.body.id });
        res.json(coupondet);
    } catch (error) {
        next(error);
    }
};

//---------------------------  Delete coupon --------------------//

const deleteCoupon = async (req, res) => {
    try {
        const id = req.params.id;
        couponModel.deleteOne({ _id: id }).then(() => {
            res.redirect("/admin/coupons");
        });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const filenames = req.files.map((file) => file.filename);
        let dataToUpdate = {
            name: req.body.name,
            description: req.body.description,
            shortDescription: req.body.shortdescription,
            price: req.body.price,
            brand: req.body.brand,
            stock: req.body.stock,
            // status: req.body.status,
        };
        if (req.files.length > 0) {
            console.log("IF CONDITION");
            await productModel.updateOne({ _id: id }, { $push: { image: { $each: filenames } } });
        }
        let category = await categoryModel.find();
        let products = await productModel.findOneAndUpdate({ _id: id }, { $set: dataToUpdate });
        res.render("admin/edit-product", {
            // page: "Products",
            // admin: res.locals.admindata.name,

            field: "field",
            category,
            products,
            userstatus: "true",
        });
    } catch (error) {
        next(error);
    }
};
// --------------------  edit Products Page -----------------------//

const editproducts = async (req, res, next) => {
    try {
        const id = req.params.id;
        let products = await productModel.findOne({ _id: id }).populate("brand");
        let category = await categoryModel.find();
        res.render("admin/edit-product", {
            products,
            // page: "Products",
            // admin: res.locals.admindata.name,

            field: "field",
            products,
            category,
            userstatus: "false",
        });
    } catch (error) {
        next(error);
    }
};
const deleteimage = async (req, res, next) => {
    try {
        const val = req.params.val;
        const id = req.params.id;
        fs.unlink(path.join(__dirname, "../public/images/", val), () => {});
        await productModel.updateOne({ _id: id }, { $pull: { image: val } });
        res.redirect("/admin/edit-product/" + id);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser,
    // dashboard,
    home,
    customers,
    addProduct,
    block,
    unblock,
    addcategorydetails,
    addcategory,
    category,
    deletecategories,
    Updatecategories,
    addProduct,
    deleteproduct,
    products,
    addProducts,
    banner,
    addbanner,
    AddBanner,
    ordermanagement,
    orderlist,
    invoice,
    deleteCoupon,
    addcoupon,
    coupon,
    editproducts,
    updateProduct,
    editcategory,
    deletebanner,
    enablebanner,
    disablebanner,
    ajaxcoupon,
    updatecoupon,
    deleteimage,
    loadSalesReport,
    cancelOrderApproval,
    cancelOrderProcess,
    addCategory,
    //  confirmdeleteproduct
    // loadEditCategory
};
