if (sessionStorage.getItem("adminLogin") !== "true") {
  alert("Please log in as admin first.");
  window.location.href = "login.html";
}

window.logout = function () {
  sessionStorage.removeItem("adminLogin");
  window.location.href = "login.html";
};

window.loadRecords = async function () {
  const recordsBox = document.getElementById("records");
  recordsBox.innerHTML = "Loading…";

  try {
    const res = await fetch(`${getApiBase()}/certificates`);
    const records = await res.json();

    if (records.length === 0) {
      recordsBox.innerHTML = "<p class=\"muted\">No certificates yet.</p>";
      return;
    }

    recordsBox.innerHTML = "";

    records.forEach(function (data) {
      const row = document.createElement("div");
      row.className = "record-card";
      row.innerHTML = `
          <p><b>ID:</b> ${escapeHtml(data.id)}</p>
          <p><b>Name:</b> ${escapeHtml(data.name)}</p>
          <p><b>Course:</b> ${escapeHtml(data.course)}</p>
          <p><b>Issuer:</b> ${escapeHtml(data.issuer)}</p>
          <p><b>Date:</b> ${escapeHtml(data.issueDate)}</p>
          <p><b>Verify link:</b><br>
          <a href="${escapeHtml(data.verifyLink)}" target="_blank" rel="noopener">${escapeHtml(data.verifyLink)}</a></p>
          <p><img src="${String(data.qrCode || "").replace(/"/g, "")}" width="120" alt="QR code"></p>
        `;
      recordsBox.appendChild(row);
    });
  } catch (err) {
    recordsBox.innerHTML =
      "<p class=\"error-text\">Could not load records. Start the backend (<code>node server.js</code> in <code>backend</code>).</p>";
  }
};

window.addCertificate = async function () {
  const id = document.getElementById("id").value.trim();
  const name = document.getElementById("name").value.trim();
  const course = document.getElementById("course").value.trim();
  const issueDate = document.getElementById("issueDate").value;
  const issuer = document.getElementById("issuer").value.trim();

  const resultBox = document.getElementById("result");

  if (!id || !name || !course || !issueDate || !issuer) {
    resultBox.innerHTML = `<p class="error-text">Please fill all fields.</p>`;
    return;
  }

  try {
    const res = await fetch(`${getApiBase()}/add-certificate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, course, issueDate, issuer })
    });

    const result = await res.json();

    if (result.success) {
      const c = result.certificate;
      resultBox.innerHTML = `
        <div class="valid-box">
          <h3>Certificate added</h3>
          <p><b>Verify link:</b><br>
          <a href="${escapeHtml(c.verifyLink)}" target="_blank" rel="noopener">${escapeHtml(c.verifyLink)}</a></p>
          <p><img src="${String(c.qrCode || "").replace(/"/g, "")}" width="150" alt="QR code"></p>
        </div>
      `;

      loadRecords();

      document.getElementById("id").value = "";
      document.getElementById("name").value = "";
      document.getElementById("course").value = "";
      document.getElementById("issueDate").value = "";
      document.getElementById("issuer").value = "";
    } else {
      resultBox.innerHTML = `<p class="error-text">${escapeHtml(result.message)}</p>`;
    }
  } catch (err) {
    resultBox.innerHTML = `<p class="error-text">Backend server not running.</p>`;
  }
};
