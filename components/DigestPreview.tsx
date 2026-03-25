"use client";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  html: string | null;
  count: number;
  isLoading: boolean;
}

export function DigestPreview({ html, count, isLoading }: Props) {
  if (!html && isLoading) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 h-64 flex flex-col items-center justify-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-podero-purple/40"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <p className="text-[11px] font-mono text-white/20">Assembling digest…</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="rounded-xl border border-dashed border-white/8 h-48 flex items-center justify-center">
        <p className="text-[11px] font-mono text-white/15">Digest will appear here</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="digest"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-xl overflow-hidden border border-podero-warm/15 shadow-xl shadow-black/30"
      >
        <div className="bg-white/5 px-4 py-2.5 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-podero-green" />
            <span className="text-[11px] font-mono text-white/40">digest ready</span>
          </div>
          <span className="text-[11px] font-semibold text-podero-teal font-mono">
            {count} signal{count !== 1 ? "s" : ""}
          </span>
        </div>
        <iframe
          srcDoc={html}
          className="w-full bg-podero-warm"
          style={{ height: "640px", border: "none" }}
          title="Podero Pulse Digest Preview"
          sandbox="allow-same-origin"
        />
      </motion.div>
    </AnimatePresence>
  );
}
