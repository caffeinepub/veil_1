// ─── Peak Seal ────────────────────────────────────────────────────────────────
// Surface 6 — replaces TransformationArc FinalScreen on full 4-phase completion.
// The closing experience of a complete arc.

import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface PeakSealProps {
  emotionAuraColor: string;
  onComplete: () => void;
}

type Phase = "dissolve" | "seal" | "voice" | "close";

export function PeakSeal({ emotionAuraColor, onComplete }: PeakSealProps) {
  const [phase, setPhase] = useState<Phase>("dissolve");
  const [sentenceVisible, setSentenceVisible] = useState(0);
  const [closing, setClosing] = useState(false);

  // Phase progression
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("seal"), 4000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "seal") return;
    const t = setTimeout(() => setPhase("voice"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "voice") return;
    // Each sentence fades in
    const t1 = setTimeout(() => setSentenceVisible(1), 0);
    const t2 = setTimeout(() => setSentenceVisible(2), 1200);
    const t3 = setTimeout(() => setSentenceVisible(3), 2400);
    // After sentence 3 visible 3s → begin close
    const t4 = setTimeout(() => setPhase("close"), 2400 + 3000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "close") return;
    setClosing(true);
    const t = setTimeout(() => onComplete(), 1500);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  // Record seal in localStorage for journal
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sealKey = "veil-peak-seal-dates";
    try {
      const existing = JSON.parse(
        localStorage.getItem(sealKey) || "[]",
      ) as string[];
      if (!existing.includes(today)) {
        existing.push(today);
        localStorage.setItem(sealKey, JSON.stringify(existing));
      }
    } catch {}
  }, []);

  // Background color transitions
  const bgStyle =
    phase === "dissolve"
      ? { background: emotionAuraColor }
      : { background: "rgba(237,244,238,0.96)", backgroundColor: "#e8ede9" };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={closing ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: closing ? 1.5 : 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition:
          "background 4s ease-in-out, background-color 4s ease-in-out",
        ...bgStyle,
      }}
      data-ocid="peak_seal.modal"
    >
      {/* Seal circle */}
      {(phase === "seal" || phase === "voice" || phase === "close") && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "1.5px solid rgba(122,158,126,0.30)",
            background: "rgba(122,158,126,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
          aria-hidden="true"
        >
          {/* Wax seal SVG — minimal V */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            role="img"
            aria-label="Veil peak seal"
          >
            <title>Veil peak seal</title>
            <circle
              cx="14"
              cy="14"
              r="12"
              stroke="rgba(122,158,126,0.55)"
              strokeWidth="1"
            />
            <path
              d="M9 9 L14 20 L19 9"
              stroke="rgba(122,158,126,0.55)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}

      {/* Veil's voice */}
      {(phase === "voice" || phase === "close") && (
        <div
          style={{
            maxWidth: 280,
            textAlign: "center",
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 16,
            color: "rgba(44,48,40,0.72)",
            lineHeight: 1.65,
          }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: sentenceVisible >= 1 ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ margin: "0 0 12px" }}
          >
            You came in carrying something.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: sentenceVisible >= 2 ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ margin: "0 0 12px" }}
          >
            You are leaving carrying less of it.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: sentenceVisible >= 3 ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ margin: 0 }}
          >
            Go be present.
          </motion.p>
        </div>
      )}
    </motion.div>
  );
}
