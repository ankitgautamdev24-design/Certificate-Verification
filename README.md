# Certificate Generator

A simple certificate management web app with a static frontend and Express backend.

## Features

- Add new certificates with ID, name, course, issue date, and issuer
- Store certificates in `backend/certificates.json`
- Generate QR codes that link to the verification page
- Verify certificates by ID using `/verify.html`
- Static frontend pages for login, certificate creation, and record viewing

## Project structure

- `index.html` — main entry page
- `login.html` — login UI
- `records.html` — certificate records page
- `udemy.html` — sample certificate generation page
- `linkedin.html` — share certificate page
- `verify.html` — certificate verification page
- `backend/server.js` — Express backend API
- `backend/certificates.json` — stored certificate data
- `js/` — frontend JavaScript files
- `css/` — frontend styles
- `img/` — image assets

## Prerequisites

- Node.js installed

## Run the backend server

From the project root:

```bash
cd backend
npm install
npm start
```

The backend server listens on `http://localhost:5000` by default.

## Access the app

Open the frontend pages directly in your browser from the project root, or use the backend URL when needed for API access.

Example pages:

- `index.html`
- `verify.html`

## Notes

- The backend serves static files from the project root.
- Verify links are generated using the server's public origin.
