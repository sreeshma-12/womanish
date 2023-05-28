const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const config = require("./config/config");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

const app = express();

mongoose.set("strictQuery", false);
mongoose.connect(config.db_url);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        secret: config.sessionSecret,
        cookie: {
            secure: false,
            maxAge: 6000000,
        },
        saveUninitialized: true,
        resave: true,
    })
);

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.listen(config.port, function () {
    console.log(`Server is running on port ${config.port}`);
});
//--------- for admin routes--------
// const adminRoute= require('./routes/adminRoute');
const Razorpay = require("razorpay");
const cors = require("cors");
app.use("/admin", adminRoute);
app.use(cors());

// razorpay
app.post("/payment", async (req, res) => {
    let { amount } = req.body;
    var instance = new Razorpay({
        key_id: "rzp_test_MSPCtYdp5Zx6lY",
        key_secret: "OxPD34ItyleLJgzGlWfCQa1p",
    });
    let order = await instance.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: "receipt#1",
    });
    res.status(201).json({
        success: true,
        order,
        amount,
    });
});
