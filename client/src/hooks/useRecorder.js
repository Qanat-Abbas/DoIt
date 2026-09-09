import { useCallback, useEffect, useRef, useState } from "react";

// Generous cap (10 minutes) — long enough for a real meeting recap, short
// enough to keep the transcription + extraction round trip snappy for a demo.
const MAX_SECONDS = 600;

/**
 * Encapsulates MediaRecorder + a lightweight Web Audio analyser so the UI
 * can render a live waveform while the user talks.
 */
export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0); // 0..1 live volume
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const resolveRef = useRef(null);

  // "Latest ref" pattern: these are updated in effects (not during render)
  // so the recursive rAF loop and the interval callback can always reach
  // the newest closure without re-subscribing.
  const stopRef = useRef(null);
  const tickImplRef = useRef(null);

  const cleanupAudioGraph = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const tickImpl = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    setLevel(Math.min(1, rms * 4));
    rafRef.current = requestAnimationFrame(() => tickImplRef.current?.());
  }, []);

  useEffect(() => {
    tickImplRef.current = tickImpl;
  }, [tickImpl]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(() => tickImplRef.current?.());

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanupAudioGraph();
        if (resolveRef.current) {
          resolveRef.current(blob);
          resolveRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRef.current?.();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        err?.name === "NotAllowedError"
          ? "Microphone access was denied. Try the sample recording instead."
          : "Couldn't access the microphone. Try the sample recording instead."
      );
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  return { isRecording, seconds, level, error, start, stop };
}
