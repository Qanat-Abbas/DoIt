import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Sparkles, Upload } from "lucide-react";

function formatTime(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function RecordPanel({
  isRecording,
  seconds,
  level,
  micError,
  onStart,
  onStop,
  onTrySample,
  onUploadFile,
  disabled,
}) {
  const fileInputRef = useRef(null);
  const bars = 24;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative flex h-44 w-44 items-center justify-center">
        <AnimatePresence>
          {isRecording && (
            <>
              <span className="pulse-ring absolute inset-0 rounded-full bg-rose-500/30" />
              <span
                className="pulse-ring absolute inset-0 rounded-full bg-rose-500/20"
                style={{ animationDelay: "0.6s" }}
              />
            </>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={isRecording ? onStop : onStart}
          disabled={disabled}
          whileTap={{ scale: 0.94 }}
          className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full shadow-2xl transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isRecording
              ? "bg-rose-500 shadow-rose-900/50"
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-900/50"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <Square className="h-9 w-9 text-white" strokeWidth={2} fill="white" />
          ) : (
            <Mic className="h-11 w-11 text-white" strokeWidth={1.8} />
          )}
        </motion.button>
      </div>

      <div className="flex h-12 items-center gap-1">
        {isRecording ? (
          Array.from({ length: bars }).map((_, i) => {
            const seed = Math.abs(Math.sin(i * 12.9898)) % 1;
            const baseHeight = 6 + seed * 14;
            const dynamicHeight = baseHeight + level * 28;
            return (
              <span
                key={i}
                className="wave-bar w-1 rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400"
                style={{
                  height: `${Math.min(44, dynamicHeight)}px`,
                  animationDelay: `${(i % 8) * 0.07}s`,
                }}
              />
            );
          })
        ) : (
          <span className="text-sm text-white/40">
            {micError ? micError : "Tap to start — talk for as long as you need"}
          </span>
        )}
      </div>

      {isRecording && (
        <div className="-mt-4 font-mono text-sm text-white/50">{formatTime(seconds)}</div>
      )}

      {!isRecording && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/40">
          <span>New here?</span>
          <button
            type="button"
            onClick={onTrySample}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 font-medium text-violet-300 underline decoration-violet-400/30 underline-offset-4 transition hover:text-violet-200 hover:decoration-violet-300 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Try a sample
          </button>
          <span className="text-white/20">·</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 font-medium text-violet-300 underline decoration-violet-400/30 underline-offset-4 transition hover:text-violet-200 hover:decoration-violet-300 disabled:opacity-40"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload audio
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadFile(file);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
