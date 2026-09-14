# DoIt! 🎙️✅

**Say it once. We'll make sure it gets done.**

DoIt! turns a rambling voice note — the kind you mutter to yourself after a
meeting or lecture — into a clean, structured checklist of action items, each
tagged with an owner and a deadline, with one tap to push any of them
straight into Google Calendar.

🏆 **4th place** at the Replit Buildathon — *"Solving Everyday Problems Using
AI."* See [`DoIt-PRD.md`](./DoIt-PRD.md) for the full product spec and
[`DEPLOY.md`](./DEPLOY.md) to deploy your own copy.

---

## Why this is useful

After a meeting, lecture, or brainstorm, the commitments people actually made
— *who* needs to do *what*, by *when* — get buried in a rambling voice memo
nobody re-listens to, or in messy notes that mix decisions, ideas, and
to-dos together. DoIt! is the missing last step: it listens, filters signal
from noise, and hands back only the things you're on the hook for — with a
one-tap path onto your actual calendar.

## How it works

Two chained AI calls, both free-tier, plus a zero-setup calendar hop:

```
 mic / upload / sample
         │  audio (up to ~10 min)
         ▼
┌────────────────────┐
│  Groq Whisper       │   speech → raw transcript
│  large-v3-turbo     │   (shown on screen for transparency)
└─────────┬──────────┘
          │ transcript text
          ▼
┌────────────────────┐
│  Groq GPT-OSS 120B  │   transcript → strict JSON:
│  (JSON mode)        │   [{ task, owner, deadline, priority }]
└─────────┬──────────┘
          │
          ▼
   structured checklist UI ──► "Add to Calendar" per task
                                (chrono-node parses "Thursday" /
                                 "next week" into a real date,
                                 entirely client-side)
```

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + Framer Motion, single-screen
  flow with a live waveform, step indicator, and animated checklist.
- **Backend:** a minimal Express proxy so the Groq API key never reaches the
  browser. Two endpoints: `/api/transcribe` and `/api/extract`, plus a
  `/api/sample` cached response used both as the one-click demo fallback and
  the silent resilience fallback if a live call fails or times out.
- **No database, no accounts** — everything is in-memory / local component
  state, by design (see PRD §3, Non-Goals).

## Why Groq (free tier)

[Groq](https://console.groq.com) gives a free API key (no credit card) with
generous rate limits and very low latency — important for a live demo:

- **Speech-to-text:** `whisper-large-v3-turbo` — fast, accurate, handles
  accents and background noise well, and comfortably covers recordings well
  past a couple of minutes (multi-minute meeting recaps included).
- **Extraction:** `openai/gpt-oss-120b` — strong instruction-following for
  strict JSON output, called with `response_format: json_object`.

Both models are on Groq's free developer tier. (Groq's catalog changes over
time — if a model gets retired, `GET https://api.groq.com/openai/v1/models`
with your key lists what's currently available.)

## Google Calendar, without OAuth

Pushing tasks to Google Calendar normally means registering an app in Google
Cloud Console, setting up an OAuth consent screen, and handling a token
exchange — real setup cost for a feature judged in a single sitting. Instead,
each task's **"Add to Calendar"** button builds a
[Calendar "quick add" link](https://calendar.google.com/calendar/render) —
Google's public, key-free template URL. Clicking it opens Calendar with the
event already filled in (title, owner in the description, and a real date
when one was mentioned); the user just reviews and saves.

The natural-language part — turning "Thursday" or "next week" into an actual
date — is handled entirely client-side with
[`chrono-node`](https://github.com/wanasit/chrono), so no extra API call or
key is involved. When a transcript doesn't name a deadline, the link still
opens with the task pre-filled and lets the user pick a date in Calendar
itself.

## Getting started

### 1. Get a free Groq API key
Sign up at [console.groq.com/keys](https://console.groq.com/keys) — no card
required — and copy your key.

### 2. Configure the server
```bash
cd server
cp .env.example .env
# paste your key into .env → GROQ_API_KEY=gsk_...
```

### 3. Install and run everything
From the project root:
```bash
npm run install:all
npm run dev
```
This starts the Express API on `http://localhost:8787` and the Vite dev
server on `http://localhost:5173` (which proxies `/api` and `/media` to the
backend). Open the client URL in your browser.

> No API key yet? The app still runs — it gracefully falls back to a cached
> sample transcript + task list (FR-9), so you can see the full UI and flow
> immediately while you get a key.

## Product flow (matches the PRD, one screen, no routing)

1. **Landing** — record button, plus a "Try a sample" and an "Upload audio"
   fallback for anyone without a working mic.
2. **Recording** — live animated waveform driven by the actual mic input via
   the Web Audio API, plus a running timer. No fixed time limit beyond a
   generous 10-minute safety cap — talk for as long as the thought takes.
3. **Transcribing...** — animated loading state while Whisper runs.
4. **Transcript shown** — the raw transcript is displayed before extraction,
   so the pipeline never feels like a black box.
5. **Extracting action items...** — second loading state while the LLM
   structures the transcript.
6. **Structured checklist** — each task shows owner, deadline ("Not
   specified" if absent), an inferred priority badge, and an "Add to
   Calendar" button. Items can be checked off (local state). "Start over"
   resets the flow.

## Functional requirements coverage

| ID | Requirement | Status |
|---|---|---|
| FR-1 | Record audio in-browser via microphone | ✅ `MediaRecorder` + live waveform, up to ~10 min |
| FR-2 | One-click "sample recording" fallback | ✅ offline-synthesized sample clip run through the real pipeline |
| FR-3 | Speech-to-text transcription | ✅ Groq Whisper large-v3-turbo |
| FR-4 | Raw transcript shown before extraction | ✅ `TranscriptPanel` |
| FR-5 | LLM returns structured JSON (task/owner/deadline) | ✅ Groq GPT-OSS 120B, JSON mode |
| FR-6 | Checklist UI with owner + deadline (or "Not specified") | ✅ `TaskList` |
| FR-7 | Check off completed items (local state) | ✅ |
| FR-8 | Loading states for both processing stages | ✅ `LoadingState` + step indicator |
| FR-9 | Silent fallback to cached data on API failure | ✅ `/api/sample`, timeout + try/catch in `App.jsx` |
| FR-10 | Push a task to Google Calendar, with natural-language deadlines resolved to a real date | ✅ `lib/calendar.js` + `chrono-node` |

Notion push and a daily digest remain future work, shown as muted "coming
soon" chips on the landing screen — see [Future work](#future-work-not-built-by-design)
below.

## Project structure

```
DoIt/
├── DoIt-PRD.md
├── README.md
├── DEPLOY.md
├── LICENSE
├── render.yaml            # Render Blueprint for one-service deployment
├── package.json           # root dev orchestration (concurrently)
├── server/                # Express API — proxies Groq, hides the API key
│   ├── index.js
│   ├── routes/
│   │   ├── transcribe.js  # POST /api/transcribe (multipart audio)
│   │   ├── extract.js     # POST /api/extract     ({ transcript })
│   │   └── sample.js      # GET  /api/sample       (cached fallback)
│   └── sample/
│       └── sample-recording.wav
└── client/                 # React + Vite + Tailwind + Framer Motion
    └── src/
        ├── App.jsx          # state machine for the single-screen flow
        ├── hooks/useRecorder.js
        ├── lib/
        │   ├── api.js        # Groq proxy calls + timeouts/fallback
        │   └── calendar.js   # Google Calendar "quick add" link builder
        └── components/
            ├── Logo.jsx       # DoIt! mark — speech bubble resolving to a checkmark
            ├── RecordPanel.jsx
            ├── TranscriptPanel.jsx
            └── TaskList.jsx   # checklist + per-task "Add to Calendar"
```

## A note on resilience

Every live API call is wrapped in a timeout and a `try/catch`. If either the
transcription or extraction call fails or takes too long, the app silently
substitutes the cached sample response instead of showing an error — the
demo never breaks mid-flow, and a small "Cached demo response" badge keeps
things honest without being alarming.

## Future work (not built, by design)

- Push extracted tasks directly to Notion
- Multi-speaker diarization for group meeting recordings
- A "silent" Calendar push via OAuth (no click-through), once the setup cost
  is worth it beyond a single demo session
- Persistent history across sessions
- Slack/email daily digest of extracted action items

## Want to extend this?

The codebase is intentionally small — two route files on the backend, a
handful of components on the frontend — so any item in Future Work above is
a reasonable first PR. A few good entry points:

- `server/routes/extract.js` — the extraction prompt. Try adjusting the task
  cap, adding fields, or swapping in a different Groq model.
- `client/src/lib/calendar.js` — the Calendar link builder. A similar
  pattern (build a URL, no OAuth) could add Outlook or Apple Calendar.
- `client/src/lib/api.js` — swap Groq for any OpenAI-compatible endpoint by
  changing the base URL and model names in the two server routes.

Issues and PRs are welcome.

## License

[MIT](./LICENSE) — use it, fork it, ship your own version.
