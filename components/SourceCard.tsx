"use client";
import { motion } from "framer-motion";
import { RSS_SOURCES } from "@/config/sources";

export type SourceStatus = "idle" | "fetching" | "done" | "error";

interface Props {
  label: string;
  status: SourceStatus;
  count?: number;
}

export function SourceCard({ label, status, count }: Props) {
  const source = RSS_SOURCES.find((s) => s.label === label);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-all duration-300 ${
        status === "fetching"
          ? "border-podero-teal/40 bg-podero-teal/5"
          : status === "done"
          ? "border-podero-green/30 bg-podero-green/5"
          : status === "error"
          ? "border-podero-red/30 bg-podero-red/5"
          : "border-white/8 bg-white/3"
      }`}
    >
      <span className="text-base leading-none">{source?.flag ?? "📡"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-podero-warm truncate leading-tight">{label}</p>
        <p className="text-[11px] font-mono mt-0.5 truncate">
          {status === "fetching" && <span className="text-podero-teal">fetching…</span>}
          {status === "done" && count !== undefined && <span className="text-white/40">{count} articles</span>}
          {status === "error" && <span className="text-podero-red">failed</span>}
          {status === "idle" && <span className="text-white/20">{source?.description}</span>}
        </p>
      </div>
      <StatusDot status={status} />
    </motion.div>
  );
}

function StatusDot({ status }: { status: SourceStatus }) {
  if (status === "fetching") {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-podero-teal opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-podero-teal" />
      </span>
    );
  }
  if (status === "done") return <span className="w-2 h-2 rounded-full bg-podero-green shrink-0" />;
  if (status === "error") return <span className="w-2 h-2 rounded-full bg-podero-red shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-white/15 shrink-0" />;
}
