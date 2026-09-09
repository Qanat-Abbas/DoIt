const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are an extraction engine inside a productivity app called "DoIt!".
You will receive a raw, possibly rambling speech-to-text transcript of someone thinking out loud
after a meeting, lecture, or brainstorm.

Your job: extract ONLY genuine action items / commitments — things someone needs to DO.
Ignore filler words, opinions, observations, greetings, and non-actionable statements.

For each action item, identify:
- "task": a short, clear, imperative description of the task (e.g. "Email the professor about the extension")
- "owner": the person responsible. If the speaker refers to themselves ("I", "I'll", "I need to"), use "You".
           If another person is named (e.g. "Sarah's supposed to..."), use their name. Default to "You" if unclear.
- "deadline": a plain string exactly as implied by the transcript (e.g. "Thursday", "next week", "by Friday").
              If no deadline is mentioned for that task, use the literal string "Not specified".
              Do NOT convert to calendar dates — keep it as natural language.
- "priority": one of "high", "medium", "low" — infer from urgency cues in the phrasing (e.g. "ASAP", "urgent" = high;
              no urgency cue = medium; "eventually", "whenever" = low). Default to "medium".

Rules:
- Return a MAXIMUM of 5 tasks. If more are mentioned, keep the 5 most concrete/important ones.
- If there are truly no actionable items, return an empty array.
- Respond with STRICT JSON ONLY, matching this exact shape, no markdown, no commentary:
{"tasks": [{"task": "string", "owner": "string", "deadline": "string", "priority": "high|medium|low"}]}`;

/**
 * POST /api/extract
 * body: { transcript: string }
 * Uses Groq's free-tier Llama 3.3 70B with JSON-mode output.
 */
router.post("/", async (req, res) => {
  if (!groq) {
    return res.status(503).json({ error: "missing_api_key", message: "GROQ_API_KEY is not configured on the server." });
  }

  const { transcript } = req.body || {};
  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    return res.status(400).json({ error: "no_transcript", message: "No transcript text was provided." });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Transcript:\n"""\n${transcript.trim()}\n"""` },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { tasks: [] };
    }

    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 5) : [];
    const clean = tasks
      .filter((t) => t && typeof t.task === "string" && t.task.trim())
      .map((t) => ({
        task: t.task.trim(),
        owner: (t.owner && String(t.owner).trim()) || "You",
        deadline: (t.deadline && String(t.deadline).trim()) || "Not specified",
        priority: ["high", "medium", "low"].includes(t.priority) ? t.priority : "medium",
      }));

    res.json({ tasks: clean });
  } catch (err) {
    console.error("Extraction error:", err?.message || err);
    res.status(502).json({ error: "extraction_failed", message: err?.message || "Extraction failed." });
  }
});

module.exports = router;
