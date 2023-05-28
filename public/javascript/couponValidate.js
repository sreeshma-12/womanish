let dPrice;
let dCode;
// function validatecoupon(e) {
const subTotal = document.getElementById("subtotal").value;
const form = document.querySelector("#couponForm");
const checkbutton = document.getElementById("couponButton");
console.log("form=", form);
console.log("form=", checkbutton);
window.addEventListener("DOMContentLoaded", (event) => {
  console.log("event=", event);
  // if (form) {
  checkbutton.addEventListener("click", () => {
    // e.preventDefault();
    const couponCode = document.getElementById("couponCode").value;
    console.log("code=", couponCode);
    fetch("/couponvalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode, subTotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data, "DATA");
        dPrice = data.discountAmount;

        if (data.isVerified) {
          if (data.newToCoupon) {
            document.getElementById("applyButton").disabled = false;
            document.getElementById("discountAmount").innerHTML = dPrice;
            document.getElementById("ordertotal").innerHTML = subTotal - dPrice;
            document.getElementById("couponStatus").innerHTML =
              "Coupon code available";
            document.getElementById("couponStatus").style =
              "display:block;color:green;";
            var myModalEl = document.getElementById("closeCoupon");
            setTimeout(() => {
              myModalEl.click();
            }, 3000);
            document.getElementById("applyCoupon").style.display = "none";
            document.getElementById("CouponApplied").innerHTML =
              "Coupon applied";
            // document.getElementById("priceDiv").style = "visibility:visible";
            // document.getElementById("offerPrice").innerHTML = data.offerPrice;
            // document.getElementById("offerLabel").innerHTML = "Offer Price";
            // document.getElementById("maxDiscount").style =
            //   "visibility:visible";
            // document.getElementById("maxDiscount").innerHTML =
            //   data.totalDiscount;
          } else {
            document.getElementById("couponStatus").style =
              "display:block;color:red;";
            document.getElementById("couponStatus").innerHTML =
              "Already Applied This Coupon";
            document.getElementById("priceDiv").style = "visibility:hidden";
            document.getElementById("maxDiscount").style = "visibility:hidden";
            document.getElementById("applyButton").disabled = true;
          }
        } else {
          document.getElementById("couponStatus").style =
            "display:block;color:red;";
          document.getElementById("couponStatus").innerHTML = "Invalid Code";
          // document.getElementById("priceDiv").style = "visibility:hidden";
          // document.getElementById("maxDiscount").style = "visibility:hidden";
          document.getElementById("applyButton").disabled = true;
        }
      });
  });
  // }
});
function applyCoupon() {
  const discountAmount = document.getElementById("maxDiscount").innerHTML;
  // document.getElementById("applyCoupon").innerHTML = discountAmount + "&nbsp" + "(" + dCode + ")";
  const discountTotal = dPrice;
  fetch("/product/setdiscount", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discountAmount, discountTotal }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("ordertotal").innerHTML = discountTotal;
    });
}
