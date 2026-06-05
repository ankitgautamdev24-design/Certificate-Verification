function getCertificateIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

window.verifyCertificate = async function () {
  const input = document.getElementById("verifyId");
  const status = document.getElementById("status");
  const urlId = getCertificateIdFromURL();
  await runCertificateIdLookup(status, input ? input.value : "", { urlId });
};

function initVerifyFromUrl() {
  const urlId = getCertificateIdFromURL();
  if (urlId) {
    document.getElementById("verifyId").value = urlId;
    verifyCertificate();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVerifyFromUrl);
} else {
  initVerifyFromUrl();
}
