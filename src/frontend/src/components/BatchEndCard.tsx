// ═══════════════════════════════════════════════════════════
// VEIL — BATCH END CARD
// After every batch of posts — pause, breathe, decide consciously.
// No auto-load. Presence over consumption.
// ═══════════════════════════════════════════════════════════

import { motion } from "motion/react";

interface BatchEndCardProps {
  onSeeMore: () => void;
  onPutItDown: () => void;
  isLoading?: boolean;
}

export function BatchEndCard({
  onSeeMore,
  onPutItDown,
  isLoading,
}: BatchEndCardProps) {
  return (
    <motion.div
      data-ocid="feed.batch_end.card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl p-8 text-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,252,248,0.97) 0%, rgba(249,228,160,0.08) 100%)",
        border: "1px solid rgba(195,184,216,0.2)",
        boxShadow: "0 2px 16px rgba(107,91,142,0.06)",
      }}
    >
      <p
        className="font-serif italic text-base leading-relaxed mb-1"
        style={{ color: "#2D2540" }}
      >
        You have seen everything in this moment.
      </p>
      <p className="text-sm mb-7" style={{ color: "#8B8097" }}>
        Take a breath. You've been present.
      </p>
      <div className="flex flex-col gap-3">
        <button
          data-ocid="feed.put_it_down.button"
          type="button"
          onClick={onPutItDown}
          className="w-full py-3.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #C3B8D8 0%, #9B7FC0 100%)",
            color: "#fff",
          }}
        >
          Put it down
        </button>
        <button
          data-ocid="feed.see_more.button"
          type="button"
          onClick={onSeeMore}
          disabled={isLoading}
          className="w-full py-3.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
          style={{
            background: "rgba(195,184,216,0.15)",
            color: "#6B5B8E",
            border: "1px solid rgba(195,184,216,0.3)",
          }}
        >
          {isLoading ? "Loading…" : "See more"}
        </button>
      </div>
    </motion.div>
  );
}
