const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const QRCode = require("qrcode");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const LISTEN_HOST = process.env.LISTEN_HOST || "0.0.0.0";

function getLanIPv4() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const v4 = net.family === "IPv4" || net.family === 4;
      if (!v4 || net.internal) continue;
      candidates.push(net.address);
    }
  }
  const preferred = (a) =>
    a.startsWith("192.168.") ||
    a.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(a);
  return candidates.find(preferred) || candidates[0] || null;
}

const LAN_IP = getLanIPv4();
const DEFAULT_PUBLIC_ORIGIN = LAN_IP
  ? `http://${LAN_IP}:${PORT}`
  : `http://localhost:${PORT}`;

const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || DEFAULT_PUBLIC_ORIGIN).replace(
  /\/$/,
  ""
);

app.use(cors());
app.use(express.json());

const FILE = "./certificates.json";

function readData() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

app.post("/add-certificate", async (req, res) => {
  const { id, name, course, issueDate, issuer } = req.body;

  if (!id || !name || !course || !issueDate || !issuer) {
    return res.json({
      success: false,
      message: "All fields are required"
    });
  }

  let certificates = readData();

  const exists = certificates.find((cert) => cert.id === id);
  if (exists) {
    return res.json({
      success: false,
      message: "Certificate ID already exists"
    });
  }

  const verifyLink = `${PUBLIC_ORIGIN}/verify.html?id=${encodeURIComponent(id)}`;
  const qrCode = await QRCode.toDataURL(verifyLink);

  const newCertificate = {
    id,
    name,
    course,
    issueDate,
    issuer,
    verifyLink,
    qrCode
  };

  certificates.push(newCertificate);
  writeData(certificates);

  res.json({
    success: true,
    message: "Certificate added successfully",
    certificate: newCertificate
  });
});

app.get("/verify/:id", (req, res) => {
  const id = req.params.id;
  const certificates = readData();
  const certificate = certificates.find((cert) => cert.id === id);

  if (certificate) {
    res.json({
      success: true,
      message: "Valid Certificate",
      certificate
    });
  } else {
    res.json({
      success: false,
      message: "Invalid Certificate"
    });
  }
});

app.get("/certificates", (req, res) => {
  res.json(readData());
});

app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, LISTEN_HOST, () => {
  console.log(`Server (this PC): http://localhost:${PORT}`);
  if (LAN_IP) {
    console.log(`Server (phones on same Wi‑Fi): http://${LAN_IP}:${PORT}`);
  }
  console.log(`QR / verify links use: ${PUBLIC_ORIGIN}`);
  console.log(`Verify page: ${PUBLIC_ORIGIN}/verify.html`);
});
