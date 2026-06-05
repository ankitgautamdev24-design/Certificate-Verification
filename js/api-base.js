(function () {
  window.getApiBase = function () {
    var port = window.location.port;
    if (port === "5000") return "";
    var protocol = window.location.protocol;
    var host = window.location.hostname;
    return protocol + "//" + host + ":5000";
  };

  /** Origin where the site + verify page are served (same as API when using port 5000). */
  window.getPublicSiteOrigin = function () {
    var base = window.getApiBase();
    if (base === "") return window.location.origin;
    return base.replace(/\/$/, "");
  };

  /** Full URL to the verify page for a certificate ID (fallback if API did not return one). */
  window.buildVerifyUrl = function (certId) {
    if (window.location.protocol === "file:") {
      return "http://localhost:5000/verify.html?id=" + encodeURIComponent(certId);
    }
    var origin = window.getPublicSiteOrigin();
    if (!origin || !window.location.hostname) {
      origin = "http://localhost:5000";
    }
    return origin.replace(/\/$/, "") + "/verify.html?id=" + encodeURIComponent(certId);
  };

  window.escapeHtml = function (text) {
    if (text == null) return "";
    var d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  };
})();
