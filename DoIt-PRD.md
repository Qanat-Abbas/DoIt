# DoIt! — Product Requirements Document

**Tagline:** *"Say it once. We'll make sure it gets done."*

| | |
|---|---|
| **Prepared for** | Replit Buildathon — "Solving Everyday Problems Using AI" |
| **Result** | 🏆 4th place |
| **Doc version** | 2.0 — shipped spec |

> This PRD describes the product as actually built and deployed. The original
> build began as a 1-hour MVP with a deliberately tight scope; a few items
> originally cut for time (Calendar push, smart deadline parsing, longer
> recordings) were finished afterward and are documented here as shipped
> features, not future work. Nothing below is aspirational — every
> requirement in Section 6 is implemented and covered in the README.

---

## 1. Problem Statement

After a meeting, lecture, or brainstorm, people either:
- Ramble a voice memo to themselves ("ok so I need to follow up with Sarah, and also check the budget by Friday...") and never listen to it again, or
- Scribble messy handwritten/typed notes that mix decisions, ideas, and to-dos together with no structure

In both cases, the *actual commitments* — who needs to do what, by when — get buried and forgotten. This is a daily annoyance for students, professionals, and anyone who takes notes faster than they organize them. The cost isn't dramatic, but it's constant: missed follow-ups, forgotten deadlines, re-explaining things because nothing was written down clearly.

## 2. Solution Summary

**DoIt!** turns a rambling voice note (or messy pasted text) into a clean, structured list of action items — each with an owner, a deadline, and a priority — in seconds, with a one-tap path onto Google Calendar. Talk into the mic, and a checklist appears.

**Core magic moment:** Speak naturally, at whatever length the thought takes → structured, deadline-tagged tasks appear on screen, extracted automatically from the ramble → tap once to put any of them on your actual calendar.

## 3. Goals & Non-Goals

### Goals (shipped)
- Accept audio input: record live in-browser, upload a clip, or try a bundled sample recording
- Transcribe speech to text, for recordings up to ~10 minutes
- Extract discrete action items from the transcript via LLM, each tagged with owner (if mentioned), deadline (if mentioned), and an inferred priority
- Display the results as a clean, readable, checkable to-do list
- Push any task to Google Calendar in one tap, with natural-language deadlines ("Thursday", "next week") resolved to a real date client-side — no OAuth, no backend token exchange
- Deliver a smooth, demo-able, single-screen flow that works live, on stage, with silent fallback if a live API call fails

### Non-Goals (still explicitly out of scope)
- Notion API integration (see Future Work)
- User accounts, login, or saved history across sessions
- Multi-speaker diarization (identifying *who* said what in a multi-person recording)
- Editing/re-recording individual tasks after generation
- Mobile native app (web only, responsive)
- A "silent" Calendar push that skips the click-through review step — that requires a full OAuth app registration, deliberately avoided (see Section 7)

## 4. Target User & Core Use Case

**Primary persona:** Students after a lecture, professionals after a meeting, or anyone who thinks out loud faster than they can organize their thoughts.

**Core use case:**
1. User finishes a meeting/lecture and has scattered thoughts in their head.
2. User opens the app and hits record (or uploads a pre-recorded clip, or tries the bundled sample).
3. User talks naturally, at their own pace: *"Ok so I need to email the professor about the extension, and Sarah's supposed to send the slides by Thursday, and I should also book the room for next week's presentation."*
4. App transcribes the audio, then extracts structured tasks.
5. User sees a clean checklist: three tasks, each with owner (self/Sarah), deadline (Thursday / next week) where mentioned, and a priority badge.
6. User taps "Add to Calendar" on any task — Google Calendar opens with the event pre-filled, ready to save.

## 5. User Flow (Single Screen)

```
[Landing]
   ↓
[Record button] ──► (fallback: "Try a sample" / "Upload audio")
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
   — ☐ Task description | Owner: [name/"You"] | Due: [deadline or "Not specified"] | Priority | [Add to Calendar]
```

No navigation bar, no multi-page routing — everything happens on one page with conditional rendering as each stage completes.

## 6. Functional Requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-1 | User can record audio directly in the browser via microphone | Must | ✅ |
| FR-2 | A pre-loaded "sample recording" button exists as a one-click fallback for the live demo | Must | ✅ |
| FR-3 | System transcribes the audio to text (speech-to-text) | Must | ✅ |
| FR-4 | The raw transcript is displayed to the user before task extraction | Should | ✅ |
| FR-5 | System sends the transcript to an LLM and returns structured action items as JSON (task, owner, deadline, priority) | Must | ✅ |
| FR-6 | Action items render as a checklist UI, with owner and deadline shown per item (or "Not specified" if absent) | Must | ✅ |
| FR-7 | User can check off completed items in the UI (local state only) | Should | ✅ |
| FR-8 | Loading states are shown during both processing stages (no blank/frozen UI) | Must | ✅ |
| FR-9 | If a live API call fails or times out, fall back to a cached transcript + task list so the demo never shows an error | Must | ✅ |
| FR-10 | Each task can be pushed to Google Calendar in one tap, with natural-language deadlines resolved to a real date | Should | ✅ |

## 7. Technical Architecture

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
                                (chrono-node parses natural-language
                                 deadlines client-side, no extra API call)
```

**Stack:**
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + Framer Motion — single-screen flow with a live mic waveform, step indicator, and animated checklist.
- **Speech-to-text:** Groq's `whisper-large-v3-turbo` (free tier).
- **Extraction:** Groq's `openai/gpt-oss-120b`, called with `response_format: json_object` for strict JSON output (free tier).
- **Calendar:** Google Calendar's public "quick add" template URL — no OAuth, no Cloud project, no API key. Deadline text is parsed to a real date entirely client-side with `chrono-node`.
- **Backend:** a minimal Express proxy so the Groq API key never reaches the browser (`/api/transcribe`, `/api/extract`, `/api/sample`). In production this same service also serves the built frontend, so the whole app is one deployable unit.
- **No database, no accounts** — everything is in-memory / local component state, by design (see Section 3, Non-Goals).

### Prompt design notes
- The extraction prompt instructs the model to return *strict JSON only* — an array of objects with fields `task`, `owner` (defaults to `"You"` if no other person is named), `deadline` (a plain string like `"Thursday"` or `"Not specified"`), and `priority`.
- The model is explicitly instructed to **ignore filler and non-actionable rambling** — only extract genuine commitments or tasks, not observations or opinions.
- Output is capped at **5 tasks** to keep the UI clean even for a long ramble.
- Deadline strings are intentionally kept as natural language from the LLM (not pre-converted to dates) — the date resolution happens later, client-side, only when the user actually taps "Add to Calendar." This keeps the extraction prompt simple and keeps date math out of the LLM entirely.

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Microphone permission denied or fails on the presentation laptop | "Try a sample" and "Upload audio" fallbacks are always available and run through the real pipeline |
| Transcription mishears words (accents, background noise) | Raw transcript stays visible on screen — if imperfect, it still reads as transparent and honest, not broken |
| LLM extracts irrelevant or too many tasks | Output capped at 5 items; prompt explicitly skips non-actionable statements |
| API latency during judging (two chained calls) | One full cached sample response (transcript + tasks) is used as a silent fallback if either live call is slow or fails (FR-9) |
| Groq retires or renames a model | `GET https://api.groq.com/openai/v1/models` with the active key lists what's currently available; the extraction model was itself swapped once already (from a retired Llama model to GPT-OSS 120B) with no other changes needed |

## 9. Success Criteria (What "Done" Looks Like)

The build is demo-ready when, without any manual intervention:
1. Clicking "Try a sample" (or a live recording) produces a transcript within ~5–10 seconds
2. The transcript correctly triggers extraction and produces 2–5 structured tasks
3. Each task displays with an owner, a deadline (or "Not specified"), and a priority
4. Tapping "Add to Calendar" on a task opens Google Calendar with that event correctly pre-filled
5. The entire flow can be repeated live in front of judges without errors

All five are true in the shipped product.

## 10. Demo Script (90 Seconds)

- **Hook (15s):** *"How many of you have rambled a voice memo to yourself after a meeting and never listened to it again? We built something that actually listens for you."*
- **Live demo (60s):** Hit record, speak a natural rambling note with 2–3 tasks embedded in it → show the transcript appearing → show it turn into a clean checklist with owners, deadlines, and priorities → tap "Add to Calendar" on one task to show it open in Google Calendar, pre-filled.
- **Technical close (15s):** *"This is two chained AI calls — speech-to-text, then a structured extraction step that filters signal from noise — running live, plus a Calendar push that needed zero OAuth setup."*

## 11. Future Work (not built)

- Push extracted tasks directly to Notion
- Multi-speaker diarization for group meeting recordings
- A "silent" Calendar push via full OAuth (no click-through), once the setup cost is worth it beyond a single demo session
- Persistent history across sessions
- Slack/email daily digest of extracted action items

---

*See [README.md](./README.md) for setup instructions and [DEPLOY.md](./DEPLOY.md) for deployment.*
