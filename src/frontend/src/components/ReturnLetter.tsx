// ─── Return Letter ───────────────────────────────────────────────────────────
// Surface 3 — lives inside CarryingThisCard.
// "From a moment you have already survived."

import { motion } from "motion/react";
import { getReturnLetterCopy } from "../lib/significantMomentsCopy";
import type {
  ScheduledDelivery,
  StoredSignal,
} from "../lib/significantMomentsEngine";

interface ReturnLetterProps {
  delivery: ScheduledDelivery;
  signal: StoredSignal;
  isFutureSelfLetter?: boolean;
  futureLetterText?: string;
  futureLetterWrittenAt?: number;
  userSignature?: string;
}

export function ReturnLetter({
  signal,
  isFutureSelfLetter = false,
  futureLetterText,
  futureLetterWrittenAt,
  userSignature,
}: ReturnLetterProps) {
  const copy = getReturnLetterCopy(signal);

  const topLabel = isFutureSelfLetter
    ? "You wrote this to yourself"
    : copy.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        background: "rgba(122,158,126,0.06)",
        border: "1px solid rgba(122,158,126,0.14)",
        borderRadius: 12,
        padding: "18px 20px",
      }}
    >
      {/* Top label */}
      <p
        style={{
          fontSize: 9,
          fontFamily: "'Jost', sans-serif",
          fontWeight: 300,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          color: "rgba(122,158,126,0.50)",
          margin: "0 0 12px",
        }}
      >
        {topLabel}
      </p>

      {/* Body */}
      {isFutureSelfLetter ? (
        <div>
          <p
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 14,
              color: "rgba(237,244,238,0.80)",
              lineHeight: 1.7,
              margin: "0 0 16px",
              whiteSpace: "pre-wrap",
            }}
          >
            {futureLetterText}
          </p>
          {userSignature && (
            <p
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: 20,
                color: "#E8C060",
                margin: "0 0 8px",
              }}
            >
              {userSignature}
            </p>
          )}
          {futureLetterWrittenAt && (
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: 11,
                color: "rgba(184,207,192,0.28)",
                margin: 0,
              }}
            >
              Written{" "}
              {Math.round((Date.now() - futureLetterWrittenAt) / 86400000)} days
              ago
            </p>
          )}
        </div>
      ) : (
        <div>
          <p
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontStyle: "italic",
              fontSize: 14,
              color: "rgba(237,244,238,0.80)",
              lineHeight: 1.7,
              margin: "0 0 10px",
            }}
          >
            {copy.body}
          </p>
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 200,
              fontSize: 11,
              color: "rgba(184,207,192,0.28)",
              margin: 0,
            }}
          >
            {copy.date}
          </p>
        </div>
      )}
    </motion.div>
  );
}
