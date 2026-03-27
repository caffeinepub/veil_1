// ─── Memory Mirror ───────────────────────────────────────────────────────────
// Surface 2 — lives in ReflectionsTab Still Pool, below the prompt card.

import { motion } from "motion/react";
import { useEffect } from "react";
import { getMemoryMirrorCopy } from "../lib/significantMomentsCopy";
import type {
  ScheduledDelivery,
  StoredSignal,
} from "../lib/significantMomentsEngine";
import { markDelivered } from "../lib/significantMomentsEngine";

interface MemoryMirrorProps {
  delivery: ScheduledDelivery;
  signal: StoredSignal;
  onDismiss: () => void;
}

export function MemoryMirror({
  delivery,
  signal,
  onDismiss,
}: MemoryMirrorProps) {
  const copy = getMemoryMirrorCopy(signal);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once on mount
  useEffect(() => {
    markDelivered(delivery.id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      style={{ maxWidth: 480, width: "100%", margin: "0 auto 16px" }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(122,158,126,0.12)",
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        {/* Label */}
        <p
          style={{
            fontSize: 9,
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(122,158,126,0.45)",
            margin: "0 0 10px",
          }}
        >
          {copy.label}
        </p>

        {/* Body */}
        <p
          style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(237,244,238,0.72)",
            lineHeight: 1.65,
            margin: "0 0 10px",
          }}
        >
          {copy.body}
        </p>

        {/* Date */}
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 200,
            fontSize: 11,
            color: "rgba(184,207,192,0.30)",
            margin: 0,
          }}
        >
          {copy.date}
        </p>
      </div>

      {/* Soft link below card */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            fontSize: 9,
            color: "rgba(122,158,126,0.45)",
            cursor: "pointer",
            fontFamily: "'Jost', sans-serif",
            letterSpacing: "0.05em",
            padding: "4px 8px",
          }}
        >
          Continue to your reflection →
        </button>
      </div>
    </motion.div>
  );
}
