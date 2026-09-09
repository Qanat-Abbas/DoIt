import { motion, AnimatePresence } from "framer-motion";
import { User, CalendarClock, RotateCcw, CalendarPlus } from "lucide-react";
import { buildGoogleCalendarUrl } from "../lib/calendar";

const PRIORITY_STYLES = {
  high: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

export default function TaskList({ tasks, checked, onToggle, onReset }) {
  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">
        No clear action items were found in that recording — try describing a specific
        commitment, like "I need to email Sam by Friday."
      </div>
    );
  }

  const doneCount = tasks.filter((_, i) => checked[i]).length;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-white/40">
          {doneCount} / {tasks.length} completed
        </span>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-violet-400/40 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Start over
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        <AnimatePresence>
          {tasks.map((t, i) => {
            const isChecked = Boolean(checked[i]);
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                  isChecked
                    ? "border-white/5 bg-white/[0.02] opacity-50"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <button
                  onClick={() => onToggle(i)}
                  aria-label={isChecked ? "Mark incomplete" : "Mark complete"}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    isChecked
                      ? "border-violet-400 bg-violet-500"
                      : "border-white/25 hover:border-violet-400"
                  }`}
                >
                  {isChecked && (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[15px] font-medium text-white ${
                      isChecked ? "line-through decoration-white/30" : ""
                    }`}
                  >
                    {t.task}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">
                      <User className="h-3 w-3" />
                      {t.owner}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">
                      <CalendarClock className="h-3 w-3" />
                      {t.deadline}
                    </span>
                    {t.priority && (
                      <span
                        className={`rounded-full border px-2.5 py-1 font-medium capitalize ${
                          PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium
                        }`}
                      >
                        {t.priority}
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={buildGoogleCalendarUrl(t)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Add to Google Calendar"
                  aria-label={`Add "${t.task}" to Google Calendar`}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-violet-300"
                >
                  <CalendarPlus className="h-4 w-4" />
                </a>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
