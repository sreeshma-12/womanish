const passwordInput = document.querySelector("#password");
const passwordLabel = document.querySelector("label[for='password']");

passwordInput.addEventListener("input", checkPasswordStrength);

function checkPasswordStrength() {
  const password = passwordInput.value;
  if (password.length >= 8) {
    passwordLabel.innerHTML = "Password (strong)";
    passwordLabel.style.color = "green";
  } else {
    passwordLabel.innerHTML = "Password (weak)";
    passwordLabel.style.color = "red";
  }
}

// const form = document.querySelector("form");
// form.addEventListener("submit", validateForm);

// function validateForm(event) {
//   const password = passwordInput.value;
//   const repassword = document.querySelector("#repassword").value;
//   if (password !== repassword) {
//     event.preventDefault(); // Prevent form submission
//     const errorMessage = "Passwords do not match. Please try again.";
//     alert(errorMessage);
//     document.querySelector("#msg-wrapper").innerHTML = errorMessage;
//   }
// }
