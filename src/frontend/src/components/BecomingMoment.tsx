// ─── Becoming Moment ─────────────────────────────────────────────────────────
// Surface 4 — full-screen overlay in ProfileTab.
// The quarterly delivery experience of the Becoming Line.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface BecomingMomentProps {
  becomingLine: string;
  userSignature: string;
  onComplete: (acknowledged: boolean) => void;
}

type Phase = "fade" | "presence" | "line" | "hold" | "response" | "return";

export function BecomingMoment({
  becomingLine,
  userSignature,
  onComplete,
}: BecomingMomentProps) {
  const [phase, setPhase] = useState<Phase>("fade");
  const [visibleWords, setVisibleWords] = useState(0);
  const [responded, setResponded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const autoTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const words = becomingLine.split(" ");

  // Phase progression
  useEffect(() => {
    const advance = (nextPhase: Phase, delayMs: number) => {
      timeoutRef.current = setTimeout(() => setPhase(nextPhase), delayMs);
    };

    if (phase === "fade") advance("presence", 1500);
    if (phase === "presence") advance("line", 4000);
    if (phase === "hold") advance("response", 6000);

    return () => clearTimeout(timeoutRef.current);
  }, [phase]);

  // Word-by-word reveal
  useEffect(() => {
    if (phase !== "line") return;
    if (visibleWords >= words.length) {
      // Move to hold phase after last word settles
      timeoutRef.current = setTimeout(() => setPhase("hold"), 800);
      return;
    }
    const t = setTimeout(() => {
      setVisibleWords((n) => n + 1);
    }, 450); // 0.3s fade + 0.15s gap
    return () => clearTimeout(t);
  }, [phase, visibleWords, words.length]);

  // Auto-timeout on response phase (20s)
  useEffect(() => {
    if (phase !== "response") return;
    autoTimeoutRef.current = setTimeout(() => {
      if (!responded) onComplete(false);
    }, 20000);
    return () => clearTimeout(autoTimeoutRef.current);
  }, [phase, responded, onComplete]);

  const handleAcknowledge = () => {
    if (responded) return;
    setResponded(true);
    clearTimeout(autoTimeoutRef.current);
    // Hold 2 more seconds then complete
    setTimeout(() => onComplete(true), 2000);
  };

  const handleNotYet = () => {
    if (responded) return;
    setResponded(true);
    clearTimeout(autoTimeoutRef.current);
    onComplete(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#2A3530",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
      data-ocid="becoming_moment.modal"
    >
      {/* Royal Signature — visible from PRESENCE phase onward */}
      <AnimatePresence>
        {(phase === "presence" ||
          phase === "line" ||
          phase === "hold" ||
          phase === "response") && (
          <motion.p
            key="signature"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0 }}
            style={{
              fontFamily: "'Dancing Script', 'Parisienne', cursive",
              fontWeight: 500,
              fontSize: 28,
              color: "#E8C060",
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "0.02em",
            }}
          >
            {userSignature}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Becoming Line — word by word */}
      <AnimatePresence>
        {(phase === "line" || phase === "hold" || phase === "response") && (
          <motion.div
            key="line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display', 'Georgia', serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(18px, 4vw, 22px)",
                color: "rgba(237,244,238,0.88)",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {words.map((word, i) => (
                <motion.span
                  key={`${word}-${String(i)}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i < visibleWords ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "inline" }}
                >
                  {word}
                  {i < words.length - 1 ? " " : ""}
                </motion.span>
              ))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response options */}
      <AnimatePresence>
        {phase === "response" && !responded && (
          <motion.div
            key="response"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            style={{
              position: "absolute",
              bottom: 60,
              display: "flex",
              gap: 32,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              data-ocid="becoming_moment.confirm_button"
              onClick={handleAcknowledge}
              style={{
                background: "none",
                border: "none",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: 11,
                color: "rgba(184,207,192,0.35)",
                cursor: "pointer",
                padding: "8px 12px",
                letterSpacing: "0.04em",
              }}
            >
              This is true.
            </button>
            <span style={{ color: "rgba(184,207,192,0.15)", fontSize: 11 }}>
              |
            </span>
            <button
              type="button"
              data-ocid="becoming_moment.cancel_button"
              onClick={handleNotYet}
              style={{
                background: "none",
                border: "none",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: 11,
                color: "rgba(184,207,192,0.35)",
                cursor: "pointer",
                padding: "8px 12px",
                letterSpacing: "0.04em",
              }}
            >
              Not yet.
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
