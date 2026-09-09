const TIMEOUT_MS = 15000;
const TRANSCRIBE_TIMEOUT_MS = 60000; // longer recordings take longer to upload + transcribe
const EXTRACT_TIMEOUT_MS = 30000; // longer transcripts take longer to reason over

async function withTimeout(promise, ms = TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** POST audio blob -> { transcript } */
export async function transcribeAudio(blob) {
  const form = new FormData();
  const ext = blob.type.includes("wav") ? "wav" : blob.type.includes("mp3") ? "mp3" : "webm";
  form.append("audio", blob, `recording.${ext}`);

  const res = await withTimeout(
    fetch("/api/transcribe", { method: "POST", body: form }),
    TRANSCRIBE_TIMEOUT_MS
  );
  if (!res.ok) throw new Error("transcribe_failed");
  const data = await res.json();
  if (!data.transcript) throw new Error("empty_transcript");
  return data.transcript;
}

/** POST transcript text -> { tasks: [...] } */
export async function extractTasks(transcript) {
  const res = await withTimeout(
    fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    }),
    EXTRACT_TIMEOUT_MS
  );
  if (!res.ok) throw new Error("extract_failed");
  const data = await res.json();
  return data.tasks || [];
}

/** GET cached sample transcript + tasks (used for fallback + optional pre-seed) */
export async function fetchCachedSample() {
  const res = await fetch("/api/sample");
  if (!res.ok) throw new Error("sample_failed");
  return res.json();
}

export async function fetchSampleAudioBlob() {
  const res = await fetch("/media/sample-recording.wav");
  if (!res.ok) throw new Error("sample_audio_failed");
  return res.blob();
}
