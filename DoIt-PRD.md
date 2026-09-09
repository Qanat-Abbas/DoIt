# DoIt! — Product Requirements Document

**Tagline:** *"Say it once. We'll make sure it gets done."*

| | |
|---|---|
| **Prepared for** | Rapid Buildathon — "Solving Everyday Problems Using AI" |
| **Build window** | 1 hour |
| **Doc version** | 1.0 |

---

## 1. Problem Statement

After a meeting, lecture, or brainstorm, people either:
- Ramble a voice memo to themselves ("ok so I need to follow up with Sarah, and also check the budget by Friday...") and never listen to it again, or
- Scribble messy handwritten/typed notes that mix decisions, ideas, and to-dos together with no structure

In both cases, the *actual commitments* — who needs to do what, by when — get buried and forgotten. This is a daily annoyance for students, professionals, and anyone who takes notes faster than they organize them. The cost isn't dramatic, but it's constant: missed follow-ups, forgotten deadlines, re-explaining things because nothing was written down clearly.

## 2. Solution Summary

**DoIt!** turns a rambling voice note (or messy pasted text) into a clean, structured list of action items — each with an owner and a deadline — in seconds. Talk into the mic, and a checklist appears.

**Core magic moment:** Speak naturally for 20–30 seconds → structured, deadline-tagged tasks appear on screen, extracted automatically from the ramble.

## 3. Goals & Non-Goals

### Goals (in scope for the 1-hour build)
- Accept audio input (record live in-browser, or upload a short audio clip)
- Transcribe speech to text
- Extract discrete action items from the transcript via LLM, each tagged with owner (if mentioned) and deadline (if mentioned)
- Display the results as a clean, readable to-do list
- Deliver a smooth, demo-able, single-screen flow that works live, on stage

### Non-Goals (explicitly out of scope — do not attempt)
- Calendar or Notion API integration (mention as a future extension only — do not build live during judging unless the core flow is done with 15+ minutes to spare)
- User accounts, login, or saved history across sessions
- Multi-speaker diarization (identifying *who* said what in a multi-person recording)
- Editing/re-recording individual tasks after generation
- Mobile native app (web only)
- Support for long recordings (>2 minutes) — optimize for short, single-person input

> **Hackathon discipline:** the Calendar/Notion push is the single most tempting scope-creep item in this idea. It sounds impressive but eats OAuth setup time that will kill your demo. Treat it as a "if everything else is done with time to spare" stretch, never as a Must-have.

## 4. Target User & Core Use Case

**Primary persona:** Students after a lecture, professionals after a meeting, or anyone who thinks out loud faster than they can organize their thoughts.

**Core use case (the only one we build):**
1. User finishes a meeting/lecture and has scattered thoughts in their head.
2. User opens the app and hits record (or uploads a pre-recorded clip as a fallback).
3. User talks for 20–30 seconds, rambling naturally: *"Ok so I need to email the professor about the extension, and Sarah's supposed to send the slides by Thursday, and I should also book the room for next week's presentation."*
4. App transcribes the audio, then extracts structured tasks.
5. User sees a clean checklist: three tasks, each with owner (self/Sarah) and deadline (Thursday / next week) where mentioned.

## 5. User Flow (Single Screen)

```
[Landing]
   ↓
[Record button] ──► (fallback: "Try a sample recording" button)
   ↓
[Recording... / Uploading...]
   ↓
[Loading state: "Transcribing..."]
   ↓
[Transcript shown] (raw text, for transparency/trust)
   ↓
[Loading state: "Extracting action items..."]
   ↓
[Structured To-Do List]
   — ☐ Task description | Owner: [name/"You"] | Due: [deadline or "Not specified"]
```

No navigation bar, no multi-page routing — everything happens on one page with conditional rendering as each stage completes.

## 6. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | User can record audio directly in the browser via microphone | Must |
| FR-2 | A pre-loaded "sample recording" button exists as a one-click fallback for the live demo | Must |
| FR-3 | System transcribes the audio to text (speech-to-text) | Must |
| FR-4 | The raw transcript is displayed to the user before task extraction (builds trust, shows the pipeline isn't a black box) | Should |
| FR-5 | System sends the transcript to an LLM and returns structured action items as JSON (task, owner, deadline) | Must |
| FR-6 | Action items render as a checklist UI, with owner and deadline shown per item (or "Not specified" if absent from the transcript) | Must |
| FR-7 | User can check off completed items in the UI (local state only, no persistence needed) | Should |
| FR-8 | Loading states are shown during both processing stages (no blank/frozen UI) | Must |
| FR-9 | If the audio/transcription call fails, fall back to a cached transcript + task list so the demo never shows an error | Must |

## 7. Technical Architecture

```
┌─────────────┐    audio     ┌────────────────────┐
│  Frontend   │ ───────────► │  Speech-to-Text API  │
│ (mic record │              │  (Whisper API or     │
│  or upload) │ ◄─────────── │  browser Speech API) │
└─────────────┘  transcript  └────────────────────┘
       │
       │ transcript text
       ▼
┌───────────────────┐  structured tasks  ┌─────────────┐
│  Extraction LLM     │ ─────────────────►│   Frontend   │
│  Call (JSON mode:    │                   │  renders     │
│  task/owner/deadline)│                   │  checklist   │
└───────────────────┘                   └─────────────┘
```

**Recommended stack (optimized for 1-hour build, not production):**
- **Frontend:** Single HTML/JS page, using the browser's built-in `MediaRecorder` API for capturing audio (fastest path, no extra libraries)
- **Transcription:** Whisper API call (most reliable for accented/rambling speech) — browser-native `SpeechRecognition` API is a faster-to-wire fallback if Whisper integration is unfamiliar to your team, but is less reliable and browser-dependent
- **Extraction:** One LLM API call, text-only, instructed to return strict JSON
- **No backend/database required** — API calls can be made directly from the frontend, or through one lightweight serverless function if API keys must stay hidden
- **Hosting:** local run is fine for a live demo

### Prompt design notes
- **Extraction prompt:** instruct the model to return *strict JSON only* — an array of objects with fields `task`, `owner` (default to `"You"` if no other person is named), and `deadline` (a plain string like `"Thursday"` or `"Not specified"` — do not attempt date-parsing to actual calendar dates, that's unnecessary complexity for the demo).
- Explicitly instruct the model to **ignore filler and non-actionable rambling** — only extract things that are genuinely commitments or tasks, not observations or opinions.
- Ask for a **maximum of 5 tasks** to keep the UI clean even if the ramble is long.

## 8. Risks & Mitigations (Hackathon-Specific)

| Risk | Mitigation |
|---|---|
| Microphone permission denied or fails on the presentation laptop | Always have the "sample recording" fallback ready and tested; treat live mic recording as the primary path but rehearse the fallback too |
| Transcription mishears words (accents, background noise) | Keep the raw transcript visible on screen — if it's slightly imperfect, it still reads as transparent and honest, not broken |
| LLM extracts irrelevant or too many tasks | Cap output at 5 items and explicitly prompt to skip non-actionable statements |
| API latency during judging (two chained calls = two points of delay) | Cache one full sample response (transcript + tasks) and fall back to it silently if either live call is slow |
| Temptation to add Calendar/Notion push mid-build | Explicitly out of scope (Section 3) — only attempt if core flow is fully working with meaningful time still on the clock |

## 9. Success Criteria (What "Done" Looks Like)

The build is demo-ready when, without any manual intervention:
1. Clicking "Try sample recording" (or a live recording) produces a transcript within ~5–10 seconds
2. The transcript correctly triggers extraction and produces 2–5 structured tasks
3. Each task displays with an owner and a deadline (or "Not specified")
4. The entire flow can be repeated live in front of judges without errors

If all four are true, **stop building and move to rehearsing the pitch.**

## 10. Demo Script (90 Seconds)

- **Hook (15s):** *"How many of you have rambled a voice memo to yourself after a meeting and never listened to it again? We built something that actually listens for you."*
- **Live demo (60s):** Hit record, speak a natural rambling note with 2–3 tasks embedded in it → show the transcript appearing → show it turn into a clean checklist with owners and deadlines.
- **Technical close (15s):** *"This is two chained AI calls — speech-to-text, then a structured extraction step that filters signal from noise — running live, not scripted."*

## 11. Future Work (Explicitly NOT for today)

- Push extracted tasks directly to Google Calendar or Notion via API
- Multi-speaker diarization for meeting recordings with multiple people
- Recurring/smart deadline parsing (e.g., "next Thursday" → actual calendar date)
- Persistent history of past voice notes and tasks
- Slack/email digest of daily extracted action items

---

*This PRD is intentionally scoped to what is achievable in a 1-hour build. Every "Should" or "Future Work" item is a deliberate cut, not an oversight — protect the Must-haves first.*
