const express = require("express");
const router = express.Router();
const multer = require("multer");

const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");

const FILE_TYPE_MAP = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
};


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error("invalid image type");
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, "./public/images");
    },
    filename: function (req, file, cb) {
        const filename = file.originalname.split(" ").join("-");
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${filename.split(".")[0]}-${Date.now()}.${extension}`);
    },
});


const uploadOptions = multer({ storage: storage });


router.get("/", auth.isLogout, adminController.loadLogin);
router.post("/", adminController.verifyLogin);
router.get("/home", auth.isAdmin, adminController.loadDashboard);
router.get("/logout", auth.isAdmin, adminController.logout);
router.get("/customers", auth.isAdmin, adminController.customers);
router.get("/category", auth.isAdmin, adminController.category);
router.get("/delete-category/:id", auth.isAdmin, adminController.deletecategories);
router.get("/edit-category/:id", auth.isAdmin, adminController.editcategory);
router.post("/edit-category", auth.isAdmin, adminController.deletecategories);
router.post("/edit-category/:id/:val", auth.isAdmin, uploadOptions.single("product_images", 10), adminController.Updatecategories);
router.get("/products", auth.isAdmin, adminController.products);
router.get("/edit-product/:id", auth.isAdmin, adminController.editproducts);
router.get("/deleteimage/:id/:val", auth.isAdmin, adminController.deleteimage);
router.post("/edit-product/:id", auth.isAdmin, uploadOptions.array("product_images", 10), adminController.updateProduct);
router.get("/banner", auth.isAdmin, adminController.banner);
router.get("/addBanner", auth.isAdmin, adminController.addbanner);
router.get("/sales-report", auth.isAdmin, adminController.loadSalesReport);
router.get("/cancel-order", auth.isAdmin, adminController.cancelOrderApproval);
router.get("/cancel-order-request", auth.isAdmin, adminController.cancelOrderProcess)
router.post("/addBanner", auth.isAdmin, uploadOptions.single("product_images", 10), adminController.AddBanner);
router.post("/disablebanner/:id", auth.isAdmin, adminController.disablebanner);
router.post("/enablebanner/:id", auth.isAdmin, adminController.enablebanner);
router.post("/deletebanner/:id/:val", auth.isAdmin, adminController.deletebanner);
router.get("/deletebanner/:id", auth.isAdmin, adminController.deletebanner);
router.get("/orders", auth.isAdmin, adminController.ordermanagement);
router.get("/orderdetails/:id", auth.isAdmin,adminController.orderlist);
router.get("/orderinvoice/:id", auth.isAdmin, adminController.invoice);
router.get("/coupons", auth.isAdmin, adminController.coupon);
router.get("/addcoupon", auth.isAdmin, adminController.addcoupon);
router.post("/addcoupon", auth.isAdmin, adminController.addcoupon);
router.post("/updateCoupon/:id", auth.isAdmin, adminController.updatecoupon);
router.post("/editcoupon", auth.isAdmin, adminController.ajaxcoupon);
router.get("/deleteCoupon/:id", auth.isAdmin, adminController.deleteCoupon);
router.get("/orders", auth.isAdmin, adminController.orderlist);
router.get("/new-orders", auth.isAdmin, adminController.addProducts);
router.post("/new-product", auth.isAdmin, uploadOptions.array("product_images", 10), adminController.addProduct);
router.get("/new-products", auth.isAdmin, adminController.addProducts);
router.get("/new-category", auth.isAdmin, adminController.addcategory);
router.post("/new-category", auth.isAdmin, uploadOptions.single("product_images", 10), adminController.addcategorydetails);
router.get("/new-user", auth.isAdmin, adminController.newUserLoad);
router.post("/new-user", auth.isAdmin, adminController.addUser);
router.get("/edit-user", auth.isAdmin, adminController.editUserLoad);
router.post("/edit-user", auth.isAdmin, adminController.updateUsers);
router.get("/delete-user", auth.isAdmin, adminController.deleteUser);
router.get("/delete-category", auth.isAdmin, adminController.deletecategories);
router.get("/delete-product/:id", auth.isAdmin, adminController.deleteproduct);
router.get("/block/:id", auth.isAdmin, adminController.block);
router.get("/unblock/:id", auth.isAdmin, adminController.unblock);
router.get("*", function (req, res) { res.redirect("/admin"); });
router.get("/", function (req, res, next) { res.render("admin", { admin: true }); });

module.exports = router;
