"use client";
import { motion } from "framer-motion";
import type { ScoredArticle } from "@/types";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Regulatory":       { bg: "bg-podero-purple",  text: "text-white",             border: "border-podero-purple/30" },
  "Utility Move":     { bg: "bg-podero-teal",    text: "text-podero-charcoal",   border: "border-podero-teal/30" },
  "Device Adoption":  { bg: "bg-podero-green",   text: "text-white",             border: "border-podero-green/30" },
  "Competitor":       { bg: "bg-podero-red",     text: "text-white",             border: "border-podero-red/30" },
  "Grid Stress":      { bg: "bg-yellow-600",     text: "text-white",             border: "border-yellow-600/30" },
  "Market Structure": { bg: "bg-podero-blue",    text: "text-white",             border: "border-podero-blue/30" },
  "Not Relevant":     { bg: "bg-white/10",       text: "text-white/40",          border: "border-white/5" },
};

export function ArticleCard({ article, index }: { article: ScoredArticle; index: number }) {
  const isRelevant = article.score >= 6;
  const styles = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES["Not Relevant"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isRelevant ? 1 : 0.3, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.5) }}
      className={`rounded-lg border p-4 ${
        isRelevant
          ? `border-white/10 bg-white/5 hover:bg-white/8 transition-colors`
          : "border-white/4 bg-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${styles.bg} ${styles.text}`}>
          {article.category}
        </span>
        <ScoreChip score={article.score} />
      </div>

      <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isRelevant ? "text-podero-warm" : "text-white/30"}`}>
        {article.title}
      </p>

      <p className="text-[11px] text-white/30 mt-1 font-mono truncate">{article.source}</p>

      {isRelevant && article.suggestion && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.2 }}
          className="mt-3 pt-3 border-t border-white/8"
        >
          <p className="text-[10px] font-bold text-podero-purple uppercase tracking-wider mb-1">
            Podero opportunity
          </p>
          <p className="text-[11px] text-white/60 leading-relaxed">{article.suggestion}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function ScoreChip({ score }: { score: number }) {
  const colorClass =
    score >= 8 ? "text-podero-teal" :
    score >= 6 ? "text-podero-purple" :
    "text-white/20";

  return (
    <motion.span
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`font-mono font-bold text-sm shrink-0 tabular-nums ${colorClass}`}
    >
      {score.toFixed(1)}
    </motion.span>
  );
}
