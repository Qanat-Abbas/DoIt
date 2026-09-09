import { motion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = [
  { key: "capture", label: "Capture" },
  { key: "transcribe", label: "Transcribe" },
  { key: "extract", label: "Extract" },
  { key: "done", label: "Done" },
];

export default function StepIndicator({ currentIndex }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-between">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isDone || isActive ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                }}
                transition={{ duration: 0.3 }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </motion.div>
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-white" : "text-white/35"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-2 mb-4 h-px flex-1 bg-white/10">
                <motion.div
                  animate={{ width: isDone ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                  className="h-px bg-violet-500"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
