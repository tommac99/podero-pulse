"use client";
import { motion } from "framer-motion";

const FREQUENCY_OPTIONS = ["Daily 8am", "Weekly Monday", "On grid stress"];

export function SchedulePanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.5 }}
      className="mt-8 rounded-xl border border-dashed border-white/10 p-5 relative overflow-hidden"
    >
      {/* Subtle background tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-podero-purple/3 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2.5 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/20">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-white/25">
            Automate this digest
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-podero-purple/15 text-podero-purple/60 font-semibold border border-podero-purple/20">
            Coming soon
          </span>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt}
              disabled
              title="Scheduling automation — coming soon"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-white/20 cursor-not-allowed font-mono select-none"
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          disabled
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-podero-purple/10 text-podero-purple/30 cursor-not-allowed font-semibold border border-podero-purple/10 select-none"
        >
          Set up automation
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <p className="text-[10px] text-white/15 mt-3 font-mono leading-relaxed">
          In production: Vercel Cron Jobs would trigger this pipeline on your chosen schedule.
        </p>
      </div>
    </motion.div>
  );
}
