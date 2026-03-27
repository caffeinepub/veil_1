import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import { AURA_COLOR_MAP } from "../utils/auraColors";
import {
  getAwarenessMessage,
  shouldShowCrisisResources,
} from "../utils/streakAwarenessMessages";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CarryingThisCardProps {
  emotionType: string;
  streakDays: number;
  onReflect: () => void;
  onDismiss: () => void;
  reduceMotion?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CarryingThisCard({
  emotionType,
  streakDays,
  onReflect,
  onDismiss,
  reduceMotion = false,
}: CarryingThisCardProps) {
  const [showCrisisDetails, setShowCrisisDetails] = useState(false);

  const { triggerMoment } = useVeilVoice();
  const message = getAwarenessMessage(emotionType, streakDays);

  // Voice System: Moment 5 — carrying awareness (0.5s after appearance)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally fire once on mount
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      triggerMoment(5, { emotionType: emotionType.toUpperCase(), streakDays });
    }, 500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!message) return null;

  const auraColor =
    AURA_COLOR_MAP[emotionType.toLowerCase()] ?? AURA_COLOR_MAP.default;
  const showCrisis = shouldShowCrisisResources(emotionType, streakDays);
  const cardBg = `${auraColor}14`; // ~0.08 opacity

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? {} : { opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mb-6"
      aria-label={`${message.headline} ${message.subline}`}
    >
      <div
        className="rounded-3xl p-5"
        style={{
          background: cardBg,
          boxShadow: `0 2px 20px ${auraColor}18`,
        }}
      >
        {/* Icon + headline */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl mt-0.5" aria-hidden="true">
            🌿
          </span>
          <div className="flex-1">
            <p
              className="text-sm font-semibold leading-snug"
              style={{ color: "oklch(0.3 0.04 295)" }}
            >
              {message.headline}
            </p>
          </div>
        </div>

        {/* Subline */}
        <p
          className="text-sm leading-relaxed whitespace-pre-line mb-4 pl-9"
          style={{ color: "oklch(0.4 0.04 295)", lineHeight: 1.7 }}
        >
          {message.subline}
        </p>

        {/* Crisis resources — for SAD/LONELY/NUMB at 5+ days */}
        <AnimatePresence>
          {showCrisis && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? {} : { opacity: 0, height: 0 }}
              className="mb-4 pl-9 overflow-hidden"
            >
              <div
                className="rounded-2xl p-4"
                style={{ background: `${auraColor}10` }}
              >
                <p
                  className="text-xs leading-relaxed mb-2"
                  style={{ color: "oklch(0.4 0.04 295)" }}
                >
                  If things feel very heavy — you do not have to face this
                  alone.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCrisisDetails((v) => !v)}
                  className="text-xs font-medium underline decoration-dotted transition-opacity hover:opacity-70"
                  style={{ color: "oklch(0.453 0.112 295)", minHeight: 48 }}
                  aria-expanded={showCrisisDetails}
                >
                  {showCrisisDetails
                    ? "Hide support options"
                    : "See support options"}
                </button>

                <AnimatePresence>
                  {showCrisisDetails && (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? {} : { opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        {[
                          {
                            label: "iCall India",
                            detail: "9152987821",
                            href: "tel:9152987821",
                          },
                          {
                            label: "Vandrevala Foundation",
                            detail: "1860-2662-345",
                            href: "tel:18602662345",
                          },
                          {
                            label: "Crisis Text Line (US)",
                            detail: "Text HOME to 741741",
                            href: "sms:741741?body=HOME",
                          },
                        ].map((r) => (
                          <a
                            key={r.label}
                            href={r.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-xl text-xs transition-colors hover:bg-white/60"
                            style={{ color: "oklch(0.4 0.04 295)" }}
                          >
                            <span>🌿</span>
                            <span className="font-medium">{r.label}</span>
                            <span style={{ color: "oklch(0.55 0.04 295)" }}>
                              — {r.detail}
                            </span>
                          </a>
                        ))}
                        <p
                          className="text-xs pt-1"
                          style={{ color: "oklch(0.55 0.04 295)" }}
                        >
                          You can also keep using Veil. It is always here.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <hr className="mb-4 ml-9" style={{ borderColor: `${auraColor}30` }} />

        {/* Action links */}
        <div className="flex flex-col gap-2 pl-9">
          <button
            type="button"
            onClick={onReflect}
            className="text-left text-sm font-medium transition-opacity hover:opacity-70 active:scale-98"
            style={{
              color: "oklch(0.453 0.112 295)",
              minHeight: 48,
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Reflect on this — opens Reflections tab"
          >
            Reflect on this →
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="text-left text-sm transition-opacity hover:opacity-70 active:scale-98"
            style={{
              color: "oklch(0.55 0.04 295)",
              minHeight: 48,
              display: "flex",
              alignItems: "center",
            }}
            aria-label="I see it. Thank you. — dismiss this card"
          >
            I see it. Thank you.
          </button>
        </div>
      </div>
    </motion.section>
  );
}
