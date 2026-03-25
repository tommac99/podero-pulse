"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { SchedulePanel } from "@/components/SchedulePanel";
import { RSS_SOURCES } from "@/config/sources";

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.1 } } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const router = useRouter();

  const isReady = email.trim().length > 0 && apiKey.trim().startsWith("sk-ant-");

  const handleRun = () => {
    if (!isReady) return;
    // Store in sessionStorage — API key never exposed in URL
    sessionStorage.setItem("podero_email", email.trim());
    sessionStorage.setItem("podero_api_key", apiKey.trim());
    router.push("/run");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isReady) handleRun();
  };

  return (
    <div className="min-h-screen bg-podero-charcoal flex flex-col relative overflow-hidden">
      {/* Background grain + glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(125,91,230,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-podero-purple flex items-center justify-center shadow-lg shadow-podero-purple/30">
            <span className="text-white text-xs font-bold leading-none">P</span>
          </div>
          <span className="font-bold text-podero-warm tracking-tight text-sm">Podero Pulse</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-white/20 hidden sm:block">
            European Energy Intelligence
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-podero-green/70">
            <span className="w-1.5 h-1.5 rounded-full bg-podero-green/70 animate-pulse" />
            {RSS_SOURCES.length} feeds active
          </span>
        </div>
      </motion.header>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
          >
            {/* Eyebrow */}
            <motion.div variants={stagger.item} className="mb-6">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-podero-purple">
                <span className="w-4 h-px bg-podero-purple/60" />
                AI-powered news screening
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={stagger.item}
              className="text-[40px] font-bold text-podero-warm leading-[1.05] tracking-tight mb-5"
            >
              European energy
              <br />
              intelligence,{" "}
              <span className="text-podero-purple">automated.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={stagger.item}
              className="text-white/45 text-base leading-relaxed mb-8"
            >
              Monitors {RSS_SOURCES.length} European energy feeds. Scores each article for Podero relevance using Claude AI. Delivers a digest to your inbox in minutes.
            </motion.p>

            {/* Feed pills */}
            <motion.div variants={stagger.item} className="flex flex-wrap gap-1.5 mb-10">
              {RSS_SOURCES.map((s) => (
                <span key={s.label} className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/5 text-white/30 border border-white/8">
                  {s.flag} {s.label}
                </span>
              ))}
            </motion.div>

            {/* Form */}
            <motion.div variants={stagger.item} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-white/35 uppercase tracking-wider mb-1.5">
                  Your email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-podero-warm text-sm font-mono placeholder:text-white/15 focus:outline-none focus:border-podero-purple focus:bg-white/8 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/35 uppercase tracking-wider mb-1.5">
                  Anthropic API key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="sk-ant-api03-..."
                    autoComplete="off"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-10 text-podero-warm text-sm font-mono placeholder:text-white/15 focus:outline-none focus:border-podero-purple focus:bg-white/8 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors text-[10px] font-mono uppercase tracking-wider"
                  >
                    {showKey ? "hide" : "show"}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-white/20 mt-1.5">
                  Sent to Claude API only. Never stored or logged.
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-podero-purple/60 hover:text-podero-purple transition-colors"
                  >
                    Get a key →
                  </a>
                </p>
              </div>

              <motion.button
                whileHover={isReady ? { scale: 1.01 } : {}}
                whileTap={isReady ? { scale: 0.98 } : {}}
                onClick={handleRun}
                disabled={!isReady}
                className={`w-full py-3.5 rounded-lg font-bold text-sm tracking-wide transition-all duration-200 ${
                  isReady
                    ? "bg-podero-purple hover:bg-podero-purple/90 text-white shadow-lg shadow-podero-purple/25 cursor-pointer"
                    : "bg-podero-purple/20 text-podero-purple/30 cursor-not-allowed"
                }`}
              >
                {isReady ? "Run digest →" : "Enter credentials to continue"}
              </motion.button>

              {!apiKey.startsWith("sk-ant-") && apiKey.length > 5 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-podero-red/70 font-mono"
                >
                  Anthropic API keys start with sk-ant-…
                </motion.p>
              )}
            </motion.div>
          </motion.div>

          <SchedulePanel />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-podero-charcoal to-transparent pointer-events-none" />
    </div>
  );
}
