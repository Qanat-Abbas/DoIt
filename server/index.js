require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const transcribeRouter = require("./routes/transcribe");
const extractRouter = require("./routes/extract");
const sampleRouter = require("./routes/sample");

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Serve the bundled sample audio clip (generated offline, no API cost)
app.use("/media", express.static(path.join(__dirname, "sample")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.GROQ_API_KEY) });
});

app.use("/api/transcribe", transcribeRouter);
app.use("/api/extract", extractRouter);
app.use("/api/sample", sampleRouter);

// In production, this one service also serves the built React app, so a
// single free web service (no separate static host, no CORS setup) is
// enough to deploy the whole product. In local dev, the client instead runs
// its own Vite dev server on :5173 and proxies /api and /media here.
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^\/(?!api|media).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`\n  DoIt! server running → http://localhost:${PORT}\n`);
});
