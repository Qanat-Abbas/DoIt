const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const fs = require("fs");
const os = require("os");
const path = require("path");

const router = express.Router();
// 25MB matches Groq's free-tier audio upload ceiling — comfortably covers a
// ~10 minute browser recording (webm/opus is only a few MB at that length).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

/**
 * POST /api/transcribe
 * multipart/form-data, field name "audio"
 * Uses Groq's free-tier Whisper large-v3-turbo endpoint (OpenAI-compatible).
 */
router.post("/", upload.single("audio"), async (req, res) => {
  if (!groq) {
    return res.status(503).json({ error: "missing_api_key", message: "GROQ_API_KEY is not configured on the server." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "no_audio", message: "No audio file was received." });
  }

  // Groq's SDK wants a file-like object; write the buffer to a temp file for reliability
  // across audio containers (webm/ogg/wav/mp3) produced by different browsers.
  const ext = guessExtension(req.file.mimetype, req.file.originalname);
  const tmpPath = path.join(os.tmpdir(), `doit-${Date.now()}${ext}`);

  try {
    fs.writeFileSync(tmpPath, req.file.buffer);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: "whisper-large-v3-turbo",
      response_format: "json",
      temperature: 0,
    });

    res.json({ transcript: (transcription.text || "").trim() });
  } catch (err) {
    console.error("Transcription error:", err?.message || err);
    res.status(502).json({ error: "transcription_failed", message: err?.message || "Transcription failed." });
  } finally {
    fs.unlink(tmpPath, () => {});
  }
});

function guessExtension(mimetype, originalname) {
  if (originalname && path.extname(originalname)) return path.extname(originalname);
  if (!mimetype) return ".webm";
  if (mimetype.includes("wav")) return ".wav";
  if (mimetype.includes("mp3") || mimetype.includes("mpeg")) return ".mp3";
  if (mimetype.includes("ogg")) return ".ogg";
  return ".webm";
}

module.exports = router;
