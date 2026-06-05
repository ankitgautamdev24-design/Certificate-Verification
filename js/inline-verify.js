/**
 * Shared certificate lookup for verify.html and inline panels after generate.
 * @param {HTMLElement} statusEl
 * @param {string} certIdFromInput
 * @param {{ urlId?: string | null }} [opts] - When set (verify page), wins over input.
 */
window.runCertificateIdLookup = async function (statusEl, certIdFromInput, opts) {
  opts = opts || {};
  const urlId = opts.urlId;
  const id = (urlId != null && urlId !== "" ? urlId : certIdFromInput || "").trim();

  if (id === "") {
    statusEl.innerHTML = '<p class="error-text">Please enter a certificate ID.</p>';
    return;
  }

  statusEl.innerHTML = "<p>Checking…</p>";

  try {
    const res = await fetch(`${getApiBase()}/verify/${encodeURIComponent(id)}`);
    const data = await res.json();

    if (data.success) {
      const user = data.certificate;
      statusEl.innerHTML = `
        <div class="valid-box">
          <h3>Valid certificate</h3>
          <p><b>ID:</b> ${escapeHtml(user.id)}</p>
          <p><b>Name:</b> ${escapeHtml(user.name)}</p>
          <p><b>Course:</b> ${escapeHtml(user.course)}</p>
          <p><b>Issue date:</b> ${escapeHtml(user.issueDate)}</p>
          <p><b>Issuer:</b> ${escapeHtml(user.issuer)}</p>
          <p><b>Status:</b> Verified</p>
        </div>
      `;
    } else {
      statusEl.innerHTML = `
        <div class="invalid-box">
          <h3>Not found or invalid</h3>
          <p>No matching certificate was found for this ID.</p>
        </div>
      `;
    }
  } catch (error) {
    statusEl.innerHTML =
      '<p class="error-text">Cannot reach the server. From the project folder run: <code>cd backend</code> then <code>node server.js</code>, then open <code>http://localhost:5000</code>.</p>';
  }
};
