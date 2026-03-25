"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ResizablePanels } from "@/components/ResizablePanels";
import { SourceCard, type SourceStatus } from "@/components/SourceCard";
import { ArticleCard } from "@/components/ArticleCard";
import { DigestPreview } from "@/components/DigestPreview";
import { RSS_SOURCES } from "@/config/sources";
import type { ScoredArticle } from "@/types";

type Phase = "fetching" | "scoring" | "emailing" | "done" | "error";

export default function RunPage() {
  const router = useRouter();

  const [email, setEmailState] = useState("");
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>(
    Object.fromEntries(RSS_SOURCES.map((s) => [s.label, "idle"]))
  );
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
  const [articles, setArticles] = useState<ScoredArticle[]>([]);
  const [digestHtml, setDigestHtml] = useState<string | null>(null);
  const [digestCount, setDigestCount] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [phase, setPhase] = useState<Phase>("fetching");
  const [totalToScore, setTotalToScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const started = useRef(false);
  const articleListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const storedEmail = sessionStorage.getItem("podero_email") ?? "";
    const storedKey = sessionStorage.getItem("podero_api_key") ?? "";

    if (!storedEmail || !storedKey) {
      router.replace("/");
      return;
    }

    setEmailState(storedEmail);

    const run = async () => {
      let response: Response;
      try {
        response = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: storedEmail, claudeApiKey: storedKey }),
        });
      } catch {
        setPhase("error");
        setErrorMsg("Network error — could not reach the server.");
        return;
      }

      if (!response.ok) {
        setPhase("error");
        setErrorMsg(`Server error: ${response.status}`);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const { type, payload } = JSON.parse(line.slice(6));

            switch (type) {
              case "source_fetching":
                setSourceStatuses((s) => ({ ...s, [payload.label as string]: "fetching" }));
                break;
              case "source_done":
                setSourceStatuses((s) => ({
                  ...s,
                  [payload.label as string]: payload.error ? "error" : "done",
                }));
                if (!payload.error) {
                  setSourceCounts((c) => ({ ...c, [payload.label as string]: payload.count as number }));
                }
                break;
              case "scoring_start":
                setPhase("scoring");
                setTotalToScore(payload.total as number);
                break;
              case "article_scored":
                setArticles((prev) => [payload as ScoredArticle, ...prev]);
                // Auto-scroll article list
                setTimeout(() => {
                  articleListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }, 50);
                break;
              case "digest_ready":
                setDigestCount(payload.count as number);
                setPhase("emailing");
                break;
              case "digest_html":
                setDigestHtml(payload.html as string);
                break;
              case "email_sent":
                setEmailSent(true);
                setPhase("done");
                break;
              case "error":
                setPhase("error");
                setErrorMsg(payload.message as string);
                break;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    };

    run();
  }, [router]);

  const relevantCount = articles.filter((a) => a.score >= 6).length;

  return (
    <div className="h-screen bg-podero-charcoal flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="shrink-0 px-6 py-3.5 flex items-center justify-between border-b border-white/5 bg-podero-charcoal/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-podero-purple flex items-center justify-center shadow-md shadow-podero-purple/30">
            <span className="text-white text-[11px] font-bold">P</span>
          </div>
          <span className="font-bold text-podero-warm text-sm">Podero Pulse</span>
        </div>

        <div className="flex items-center gap-5">
          <AnimatePresence>
            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-podero-green text-xs font-semibold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-podero-green animate-pulse" />
                Digest sent to {email}
              </motion.div>
            )}
            {phase === "error" && errorMsg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-podero-red text-xs font-mono max-w-xs truncate"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => router.push("/")}
            className="text-[11px] text-white/25 hover:text-white/60 transition-colors font-mono"
          >
            ← New run
          </button>
        </div>
      </header>

      {/* ── Phase bar ───────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-2.5 border-b border-white/5 bg-white/2 flex items-center gap-4 overflow-x-auto">
        <PhaseStep
          label="Fetching feeds"
          active={phase === "fetching"}
          done={phase !== "fetching"}
        />
        <Arrow />
        <PhaseStep
          label={totalToScore > 0 ? `Scoring ${articles.length}/${totalToScore}` : "Scoring articles"}
          active={phase === "scoring"}
          done={["emailing", "done"].includes(phase)}
        />
        <Arrow />
        <PhaseStep
          label={`Building digest${digestCount > 0 ? ` (${digestCount} signals)` : ""}`}
          active={phase === "emailing"}
          done={phase === "done" || !!digestHtml}
        />
        <Arrow />
        <PhaseStep
          label={emailSent ? `Sent to ${email}` : "Sending email"}
          active={phase === "emailing" && emailSent}
          done={emailSent}
        />
      </div>

      {/* ── Three-column resizable layout ────────────────────────── */}
      <ResizablePanels
        initialLeftPx={220}
        initialRightPx={480}
        minLeftPx={180}
        minCenterPx={240}
        minRightPx={320}
        left={
          <div className="h-full flex flex-col overflow-hidden">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Sources</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {RSS_SOURCES.map((source, i) => (
                <motion.div
                  key={source.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <SourceCard
                    label={source.label}
                    status={sourceStatuses[source.label] ?? "idle"}
                    count={sourceCounts[source.label]}
                  />
                </motion.div>
              ))}
              {phase !== "fetching" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-3 mt-1 border-t border-white/5"
                >
                  <p className="text-[11px] font-mono text-white/30">{articles.length} processed</p>
                  <p className="text-[11px] font-mono text-podero-purple mt-0.5">{relevantCount} relevant</p>
                </motion.div>
              )}
            </div>
          </div>
        }
        center={
          <div className="h-full flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-2 shrink-0 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Scoring</p>
              {articles.length > 0 && (
                <span className="text-[10px] font-mono text-white/25">
                  {articles.filter((a) => a.score >= 5).length} relevant / {articles.length} total
                </span>
              )}
            </div>
            <div ref={articleListRef} className="flex-1 overflow-y-auto px-5 pb-5 space-y-2.5">
              <AnimatePresence initial={false}>
                {articles.map((a, i) => (
                  <ArticleCard key={`${a.url}-${i}`} article={a} index={i} />
                ))}
              </AnimatePresence>
              {articles.length === 0 && (
                <div className="flex items-center gap-2 py-4">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full bg-white/20"
                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-mono text-white/20">Fetching feeds…</p>
                </div>
              )}
            </div>
          </div>
        }
        right={
          <div className="h-full flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-2 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Digest</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <DigestPreview
                html={digestHtml}
                count={digestCount}
                isLoading={phase === "scoring" || phase === "emailing"}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}

function PhaseStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {active && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-podero-teal opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-podero-teal" />
        </span>
      )}
      {done && !active && <span className="w-1.5 h-1.5 rounded-full bg-podero-green shrink-0" />}
      {!active && !done && <span className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />}
      <span className={`text-[11px] font-mono whitespace-nowrap ${active ? "text-podero-teal" : done ? "text-podero-green" : "text-white/20"}`}>
        {label}
      </span>
    </div>
  );
}

function Arrow() {
  return <span className="text-white/10 text-xs shrink-0">→</span>;
}
