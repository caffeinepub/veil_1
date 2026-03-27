// ─── Significance Whisper ────────────────────────────────────────────────────
// Surface 1 — lives below exhale message in Companion Card RELEASED state.
// A single italic line. Not a card. Not a box. Just warmth.

import { motion } from "motion/react";
import { useEffect } from "react";
import { getWhisperCopy } from "../lib/significantMomentsCopy";
import type {
  ScheduledDelivery,
  StoredSignal,
} from "../lib/significantMomentsEngine";
import { markDelivered } from "../lib/significantMomentsEngine";

interface SignificanceWhisperProps {
  delivery: ScheduledDelivery;
  signal: StoredSignal;
  onShown?: () => void;
}

export function SignificanceWhisper({
  delivery,
  signal,
  onShown,
}: SignificanceWhisperProps) {
  const copy = getWhisperCopy(signal);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once on mount
  useEffect(() => {
    markDelivered(delivery.id);
    onShown?.();
  }, []);

  return (
    <div style={{ marginTop: 8 }}>
      {/* Separator */}
      <div
        style={{
          width: "100%",
          height: 1,
          background: "rgba(122,158,126,0.10)",
          marginBottom: 8,
        }}
        aria-hidden="true"
      />
      {/* The Whisper */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1.2 }}
        style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 200,
          fontSize: 13,
          color: "rgba(184,207,192,0.55)",
          letterSpacing: "0.03em",
          fontStyle: "italic",
          textAlign: "center",
          lineHeight: 1.6,
          margin: 0,
          padding: 0,
        }}
        aria-live="polite"
      >
        {copy}
      </motion.p>
    </div>
  );
}
