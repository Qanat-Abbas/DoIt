import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function TranscriptPanel({ transcript, isCached }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
          <FileText className="h-3.5 w-3.5" />
          Raw transcript
        </div>
        {isCached && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
            Cached demo response
          </span>
        )}
      </div>
      <p className="text-[15px] leading-relaxed text-white/70">{transcript}</p>
    </motion.div>
  );
}
