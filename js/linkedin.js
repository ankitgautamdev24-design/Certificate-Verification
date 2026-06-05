if (sessionStorage.getItem("adminLogin") !== "true") {
  alert("Please log in as admin first.");
  window.location.href = "login.html";
}

var LINKEDIN_PREVIEW_KEY = "linkedinCertPreviewHtml";

function notifyLater(msg) {
  setTimeout(function () {
    alert(msg);
  }, 100);
}

function extractLinkCertIdFromHtml(html) {
  var m = html && html.match(/Certificate Id:\s*(LINK\d+)/);
  return m ? m[1] : "";
}

function parseBundle(raw) {
  if (!raw) return null;
  try {
    var o = JSON.parse(raw);
    if (o && o.v === 1 && o.html) return o;
  } catch (e) {}
  if (raw.indexOf("{") !== 0) {
    var id = extractLinkCertIdFromHtml(raw);
    return {
      v: 1,
      html: raw,
      certId: id,
      verifyLink: id ? buildVerifyUrl(id) : "",
      qrCode: null,
      stored: false
    };
  }
  return null;
}

function serializeBundle(b) {
  return JSON.stringify(Object.assign({ v: 1 }, b));
}

let fname = document.getElementById("fname");
let lname = document.getElementById("lname");
let date = document.getElementById("date");
let length = document.getElementById("length");
let course = document.getElementById("course");
let form = document.getElementById("form");
let container = document.querySelector(".container");

form.setAttribute("novalidate", "");
form.addEventListener(
  "submit",
  function (e) {
    e.preventDefault();
    e.stopPropagation();
  },
  true
);

let generate = document.getElementById("Generate");
let download = document.getElementById("download");
let newCertBtn = document.getElementById("newCert");

let verifyPanel = document.getElementById("verifyPanel");
let toggleVerifySection = document.getElementById("toggleVerifySection");
let verifyInlineSection = document.getElementById("verifyInlineSection");
let verifyInlineIdInput = document.getElementById("verifyInlineIdInput");
let verifyInlineSubmit = document.getElementById("verifyInlineSubmit");
let verifyInlineResult = document.getElementById("verifyInlineResult");

function setVerifySectionOpen(open) {
  verifyInlineSection.style.display = open ? "block" : "none";
  if (open) verifyInlineSection.removeAttribute("hidden");
  else verifyInlineSection.setAttribute("hidden", "");
  toggleVerifySection.setAttribute("aria-expanded", open ? "true" : "false");
  toggleVerifySection.textContent = open ? "Hide verification" : "Verify";
}

function showCertActions(show) {
  download.style.display = show ? "block" : "none";
  newCertBtn.style.display = show ? "block" : "none";
}

function updateVerifyPanel(certId) {
  verifyPanel.style.display = "block";
  verifyInlineIdInput.value = certId || "";
  verifyInlineResult.innerHTML = "";
  setVerifySectionOpen(false);
}

function hideVerifyPanel() {
  verifyPanel.style.display = "none";
  setVerifySectionOpen(false);
  verifyInlineResult.innerHTML = "";
}

function applyBundle(bundle) {
  sessionStorage.setItem(LINKEDIN_PREVIEW_KEY, serializeBundle(bundle));
  let certificate = document.getElementById("certificate");
  certificate.innerHTML = bundle.html;
  certificate.style.display = "block";
  showCertActions(true);
  updateVerifyPanel(bundle.certId);
}

function tryRestoreLinkedinPreview() {
  let bundle = parseBundle(sessionStorage.getItem(LINKEDIN_PREVIEW_KEY));
  if (!bundle || !bundle.html) return;
  form.style.display = "none";
  container.style.backgroundColor = "white";
  if (!bundle.certId) bundle.certId = extractLinkCertIdFromHtml(bundle.html);
  if (!bundle.verifyLink && bundle.certId) bundle.verifyLink = buildVerifyUrl(bundle.certId);
  applyBundle(bundle);
}

tryRestoreLinkedinPreview();

toggleVerifySection.addEventListener("click", function () {
  var open = verifyInlineSection.style.display !== "block";
  setVerifySectionOpen(open);
  if (open) verifyInlineIdInput.focus();
});

verifyInlineSubmit.addEventListener("click", function () {
  runCertificateIdLookup(verifyInlineResult, verifyInlineIdInput.value);
});

verifyInlineIdInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    runCertificateIdLookup(verifyInlineResult, verifyInlineIdInput.value);
  }
});

newCertBtn.addEventListener("click", function () {
  sessionStorage.removeItem(LINKEDIN_PREVIEW_KEY);
  document.getElementById("certificate").innerHTML = "";
  document.getElementById("certificate").style.display = "none";
  form.style.display = "block";
  container.style.backgroundColor = "";
  showCertActions(false);
  hideVerifyPanel();
});

async function saveCertificateToBackend(data) {
  try {
    const res = await fetch(`${getApiBase()}/add-certificate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: data.id,
        name: data.name,
        course: data.course,
        issueDate: data.date,
        issuer: "LinkedIn Learning"
      })
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: "Cannot reach server. Run: cd backend  then  node server.js"
    };
  }
}

generate.addEventListener("click", async function (e) {
  e.preventDefault();
  e.stopPropagation();

  let first_name = fname.value.trim();
  let last_name = lname.value.trim();
  let completionDate = date.value.trim();
  let c_length = length.value.trim();
  let course_name = course.value.trim();

  if (!first_name || !last_name || !completionDate || !c_length || !course_name) {
    alert("Please fill all fields.");
    return;
  }

  let certId = "LINK" + Date.now();

  let data = {
    id: certId,
    name: first_name + " " + last_name,
    course: course_name,
    date: completionDate,
    length: c_length,
    status: "Valid"
  };

  localStorage.setItem(certId, JSON.stringify(data));

  generate.disabled = true;
  let apiResult = await saveCertificateToBackend(data);
  generate.disabled = false;

  let stored = !!(apiResult && apiResult.success);
  let verifyLink =
    stored && apiResult.certificate && apiResult.certificate.verifyLink
      ? apiResult.certificate.verifyLink
      : buildVerifyUrl(certId);
  let qrCode =
    stored && apiResult.certificate && apiResult.certificate.qrCode
      ? apiResult.certificate.qrCode
      : null;

  if (!stored) {
    notifyLater(
      (apiResult && apiResult.message) ||
        "Certificate was not saved. Verification will not work until the server is running."
    );
  }

  form.style.display = "none";
  container.style.backgroundColor = "white";

  let html = `
    <div class="outer">
      <div class="light-br">
        <div class="dark-br">
          <div class="main-content">

            <div class="left-side">
              <img src="img/LinkedIn left-2.png" alt="">
            </div>

            <div class="right-content">

              <div class="logo">
                <img id="logo" src="img/Learning.png" alt="">
              </div>

              <div class="congrats">
                <h2>Certificate of Completion</h2>
                <h3>Congratulations, ${escapeHtml(first_name)} ${escapeHtml(last_name)}</h3>
              </div>

              <div class="course-name">
                <h1>${escapeHtml(course_name)}</h1>

                <div class="completion">
                  <h3>Course completed on ${escapeHtml(completionDate)}</h3>
                  <h3>• ${escapeHtml(c_length)}</h3>
                </div>
              </div>

              <div class="para">
                <h2>
                  By continuing to learn, you have expanded your perspective,
                  sharpened your skills, and made yourself even more in demand.
                </h2>
              </div>

              <div class="authority">

                <div class="part-1">
                  <img id="sign" src="img/Sign2.JPG" alt="">
                  <h3>VP, Learning Content at LinkedIn</h3>
                </div>

                <div class="vl"></div>

                <div class="part-2">
                  <h3>LinkedIn Learning</h3>
                  <h3>1000 W Maude Ave</h3>
                  <h3>Sunnyvale, CA 94085</h3>
                </div>

              </div>

              <div class="certificate-id">
                Certificate Id: ${certId}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  `;

  applyBundle({
    html: html,
    certId: certId,
    verifyLink: verifyLink,
    qrCode: qrCode,
    stored: stored
  });

  fname.value = "";
  lname.value = "";
  date.value = "";
  length.value = "";
  course.value = "";
});

download.addEventListener("click", function () {
  let certificate = document.getElementById("certificate");

  if (!certificate.innerHTML.trim()) {
    alert("Please generate a certificate first.");
    return;
  }

  certificate.classList.add("pdf-mode");

  setTimeout(function () {
    html2canvas(certificate, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    })
      .then(function (canvas) {
        let imgData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        let pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [1180, 820]
        });
        pdf.addImage(imgData, "PNG", 0, 0, 1180, 820);
        pdf.save("LinkedIn-certificate-" + Date.now() + ".pdf");
      })
      .catch(function () {
        alert("Could not create PDF. Try again.");
      })
      .finally(function () {
        certificate.classList.remove("pdf-mode");
      });
  }, 500);
});
