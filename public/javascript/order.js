const orderbutton = document.getElementById("orderbutton");
console.log("orderbutton", orderbutton);
orderbutton.addEventListener("click", () => {
  console.log("clicked");
  Order();
});
const Order = () => {
  const id = document.getElementById("id").value;
  const optradio = document.querySelector(
    'input[name="optradio"]:checked'
  ).value;
  const fname = document.getElementById("fname").value;
  const address1 = document.getElementById("address1").value;
  const pnumber = document.getElementById("phone").value;
  const post = document.getElementById("post").value;
  const pincode = document.getElementById("pin").value;
  const city = document.getElementById("city").value;
  const couponcode = document.getElementById("couponcode").value;
  const billAmount = document.getElementById("ordertotal").innerHTML;
  const discount = document.getElementById("discountAmount").innerHTML;
  const state = document.getElementById("state").value;
  fetch("/checkoutform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fname,
      address1,
      pnumber,
      post,
      pincode,
      city,
      state,
      id,
      optradio,
      couponcode,
      discount,
      billAmount,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        window.location.href = `/order-complete?message=${
          data.usedFromWallet ? "Paid%20from%20wallet" : "Paid%20from%20account"
        }`;
      } else {
        alert("failed");
      }
    });
};
