import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import type { FeedbackBackground } from "../lib/emotionalFeedbackCopy";

// ─── Background configurations ────────────────────────────────────────────────

const BG_CONFIGS: Record<
  FeedbackBackground,
  { bg: string; glow: string; glowPos: string }
> = {
  default: {
    bg: "#0E0B14",
    glow: "radial-gradient(ellipse 70% 50% at 50% 80%, oklch(0.35 0.12 290 / 0.45) 0%, transparent 70%)",
    glowPos: "bottom",
  },
  "purple-aura": {
    bg: "#1A0E2E",
    glow: "radial-gradient(ellipse 80% 60% at 50% 70%, oklch(0.42 0.18 295 / 0.55) 0%, transparent 70%)",
    glowPos: "center",
  },
  "warm-gold": {
    bg: "#1C1200",
    glow: "radial-gradient(ellipse 80% 55% at 50% 85%, oklch(0.72 0.18 75 / 0.45) 0%, transparent 70%)",
    glowPos: "bottom",
  },
  dark: {
    bg: "#080610",
    glow: "radial-gradient(ellipse 60% 45% at 50% 75%, oklch(0.3 0.08 285 / 0.35) 0%, transparent 70%)",
    glowPos: "bottom",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmotionalFeedbackOverlayProps {
  lines: string[];
  background?: FeedbackBackground;
  onDismiss: () => void;
  voiceKey?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmotionalFeedbackOverlay({
  lines,
  background = "default",
  onDismiss,
  voiceKey,
}: EmotionalFeedbackOverlayProps) {
  const { triggerMoment, settings } = useVeilVoice();
  const [hintVisible, setHintVisible] = useState(false);
  const dismissed = useRef(false);

  const bgConfig = BG_CONFIGS[background];

  // Show tap hint after 1.5 s — never sooner
  useEffect(() => {
    const t = setTimeout(() => setHintVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Speak if voice enabled and voiceKey provided
  useEffect(() => {
    if (voiceKey && settings.voice_enabled) {
      const t = setTimeout(() => {
        try {
          triggerMoment(voiceKey as Parameters<typeof triggerMoment>[0]);
        } catch {
          // voice key may not exist — fail silently
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [voiceKey, settings.voice_enabled, triggerMoment]);

  function handleDismiss() {
    if (dismissed.current) return;
    dismissed.current = true;
    onDismiss();
  }

  // Font size depends on number of lines
  const textSizeClass =
    lines.length <= 2
      ? "text-3xl"
      : lines.length === 3
        ? "text-2xl"
        : "text-xl";

  // Full announcement for screen readers
  const ariaLabel = lines.join(" ");

  return (
    <AnimatePresence>
      <motion.div
        key="emotional-feedback-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none"
        style={{ background: bgConfig.bg }}
        onClick={handleDismiss}
        aria-modal="true"
        aria-live="polite"
        aria-label={ariaLabel}
        data-ocid="feedback.overlay"
      >
        {/* Radial glow layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: bgConfig.glow }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="relative z-10 flex flex-col items-center gap-2 px-8 text-center max-w-sm"
        >
          {lines.map((line, lineIndex) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: 0.15 + lineIndex * 0.12,
              }}
              className={`font-serif italic leading-snug text-white/90 ${textSizeClass}`}
              style={{
                fontFamily:
                  "'InstrumentSerif-Italic', 'Instrument Serif', serif",
              }}
            >
              {line}
            </motion.p>
          ))}
        </motion.div>

        {/* Tap hint — never appears before 1.5 s */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: hintVisible ? 0.3 : 0 }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-12 text-white text-xs tracking-widest uppercase"
          aria-hidden="true"
          style={{
            animation: hintVisible ? "pulse 2.5s ease-in-out infinite" : "none",
          }}
        >
          tap anywhere to continue
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
