import { motion } from "framer-motion";

export default function LoadingState({ label }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-violet-400"
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <p className="text-sm text-white/50">{label}</p>
    </div>
  );
}
