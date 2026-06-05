document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  var username = document.getElementById("username").value.trim();
  var password = document.getElementById("password").value.trim();
  var status = document.getElementById("status");
  var submitBtn = document.getElementById("loginSubmit");

  status.innerHTML = "";

  if (username === "admin" && password === "12345") {
    sessionStorage.setItem("adminLogin", "true");
    status.innerHTML = "<p class=\"success-text\">Success. Redirecting…</p>";
    submitBtn.disabled = true;
    setTimeout(function () {
      window.location.href = "index.html";
    }, 600);
  } else {
    status.innerHTML = "<p class=\"error-text\">Wrong username or password.</p>";
  }
});
