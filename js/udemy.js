if (sessionStorage.getItem("adminLogin") !== "true") {
  alert("Please log in as admin first.");
  window.location.href = "login.html";
}

var UDEMY_PREVIEW_KEY = "udemyCertPreviewHtml";

function notifyLater(msg) {
  setTimeout(function () {
    alert(msg);
  }, 100);
}

function extractUdemyCertIdFromHtml(html) {
  var m = html && html.match(/Certificate no:\s*(UDEMY\d+)/);
  return m ? m[1] : "";
}

function parseBundle(raw) {
  if (!raw) return null;
  try {
    var o = JSON.parse(raw);
    if (o && o.v === 1 && o.html) return o;
  } catch (e) {}
  if (raw.indexOf("{") !== 0) {
    var id = extractUdemyCertIdFromHtml(raw);
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
  return JSON.stringify(
    Object.assign(
      {
        v: 1
      },
      b
    )
  );
}

let fname = document.getElementById("fname");
let lname = document.getElementById("lname");
let date = document.getElementById("date");
let length = document.getElementById("length");
let course = document.getElementById("course");
let customCourse = document.getElementById("customCourse");
let teacher = document.getElementById("teacher");

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

let instruct = "Instructor";

course.addEventListener("change", function () {
  const isOther = course.value === "other";
  course.style.display = isOther ? "none" : "block";
  customCourse.style.display = isOther ? "block" : "none";
  customCourse.required = isOther;
  if (isOther) {
    customCourse.value = "";
    customCourse.focus();
  } else {
    customCourse.value = "";
  }
});

customCourse.addEventListener("blur", function () {
  // If user leaves custom input empty, bring back dropdown.
  if (customCourse.value.trim() === "") {
    course.value = "";
    course.style.display = "block";
    customCourse.style.display = "none";
    customCourse.required = false;
  }
});

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
  sessionStorage.setItem(UDEMY_PREVIEW_KEY, serializeBundle(bundle));
  let certificate = document.getElementById("certificate");
  certificate.innerHTML = bundle.html;
  certificate.style.backgroundColor = "#f8f9fb";
  certificate.style.display = "flex";
  showCertActions(true);
  updateVerifyPanel(bundle.certId);
}

function tryRestoreUdemyPreview() {
  let bundle = parseBundle(sessionStorage.getItem(UDEMY_PREVIEW_KEY));
  if (!bundle || !bundle.html) return;
  form.style.display = "none";
  container.style.backgroundColor = "white";
  container.style.height = "auto";
  if (!bundle.certId) bundle.certId = extractUdemyCertIdFromHtml(bundle.html);
  if (!bundle.verifyLink && bundle.certId) bundle.verifyLink = buildVerifyUrl(bundle.certId);
  applyBundle(bundle);
}

tryRestoreUdemyPreview();

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
  sessionStorage.removeItem(UDEMY_PREVIEW_KEY);
  document.getElementById("certificate").innerHTML = "";
  document.getElementById("certificate").style.display = "none";
  form.style.display = "block";
  container.style.backgroundColor = "";
  container.style.height = "";
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
        issuer: data.issuerRaw
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
  let DateValue = date.value.trim();
  let c_length = length.value.trim();
  let selectedCourse = course.value.trim();
  let course_raw =
    selectedCourse === "other" ? customCourse.value.trim() : selectedCourse;
  let teacher_raw = teacher.value.trim();
  let course_name = escapeHtml(course_raw);
  let instructor_html = escapeHtml(teacher_raw);

  if (
    first_name === "" ||
    last_name === "" ||
    DateValue === "" ||
    c_length === "" ||
    course_raw === "" ||
    teacher_raw === ""
  ) {
    alert("Please fill all fields.");
    return;
  }

  instruct = teacher_raw.includes(",") ? "Instructors" : "Instructor";

  let certId = "UDEMY" + Date.now();

  let data = {
    id: certId,
    name: first_name + " " + last_name,
    course: course_raw,
    issuerRaw: teacher_raw,
    date: DateValue,
    length: c_length,
    status: "Valid"
  };

  localStorage.setItem(
    certId,
    JSON.stringify({
      id: certId,
      name: data.name,
      course: course_raw,
      teacher: teacher_raw,
      date: DateValue,
      length: c_length,
      status: "Valid"
    })
  );

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
  container.style.height = "auto";

  let html = `
    <div class="logo">
      <img id="udemy-logo" src="img/udemy-logo.png" alt="">

      <div class="right-side">
        <div class="c-no">Certificate no: ${certId}</div>
        <div class="c-url">Verify: ${escapeHtml(verifyLink)}</div>
        <div class="ref-no">Reference Number: ${Math.floor(Math.random() * 9000) + 1000}</div>
      </div>
    </div>

    <div class="content">
      <h3>CERTIFICATE OF COMPLETION</h3>
      <h1 id="course-name">${course_name}</h1>
      <h4>${instruct} <b>${instructor_html}</b></h4>
    </div>

    <div class="user">
      <h1 id="name">${escapeHtml(first_name)} ${escapeHtml(last_name)}</h1>
      <h4>Date <b>${escapeHtml(DateValue)}</b></h4>
      <h4>Length <b>${escapeHtml(c_length)} total hours</b></h4>
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
  course.style.display = "block";
  customCourse.value = "";
  customCourse.style.display = "none";
  customCourse.required = false;
  teacher.value = "";
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
      backgroundColor: "#f8f9fb"
    })
      .then(function (canvas) {
        let imgData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        let pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [1280, 720]
        });
        pdf.addImage(imgData, "PNG", 0, 0, 1280, 720);
        pdf.save("Udemy-certificate-" + Date.now() + ".pdf");
      })
      .catch(function () {
        alert("Could not create PDF. Try again.");
      })
      .finally(function () {
        certificate.classList.remove("pdf-mode");
      });
  }, 500);
});
