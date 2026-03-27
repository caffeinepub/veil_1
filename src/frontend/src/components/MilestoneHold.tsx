// ─── Milestone Hold ───────────────────────────────────────────────────────────
// Surface 5 — full-screen interstitial before Journal tab opens.
// The only place in Veil where the user cannot immediately skip.

import { BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface MilestoneHoldProps {
  milestone: 7 | 30 | 90 | 365;
  sessionCount: number;
  journalPageCount: number;
  becomingLine?: string;
  dominantEmotionColor?: string;
  onComplete: (volumeName?: string) => void;
}

export function MilestoneHold({
  milestone,
  sessionCount,
  journalPageCount,
  becomingLine,
  dominantEmotionColor = "#A8D8EA",
  onComplete,
}: MilestoneHoldProps) {
  const [phase, setPhase] = useState<"intro" | "naming">("intro");
  const [volumeName, setVolumeName] = useState("");

  const moments = journalPageCount;
  const carriedAndPutDown = Math.floor(journalPageCount * 0.6);

  // Auto-advance for 7/30/90 day milestones
  useEffect(() => {
    if (milestone === 365) return;
    const duration = 10000;
    const t = setTimeout(() => onComplete(), duration);
    return () => clearTimeout(t);
  }, [milestone, onComplete]);

  // 365-day: phase timing
  useEffect(() => {
    if (milestone !== 365) return;
    const phases = [
      setTimeout(() => {}, 0), // phase 1: 3s (black + year)
      setTimeout(() => {}, 3000), // phase 2: 2s (spine)
      setTimeout(() => {}, 5000), // phase 3: 5s (text)
      setTimeout(() => setPhase("naming"), 10000), // phase 4: naming
    ];
    return () => phases.forEach(clearTimeout);
  }, [milestone]);

  const yearNumber = new Date().getFullYear() - 1; // last year

  if (milestone === 365 && phase === "naming") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: "#2A3530",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(122,158,126,0.50)",
            marginBottom: 24,
          }}
        >
          Name this volume
        </p>
        <input
          data-ocid="milestone.input"
          type="text"
          value={volumeName}
          onChange={(e) => setVolumeName(e.target.value)}
          placeholder="The year I..."
          style={{
            background: "none",
            border: "none",
            borderBottom: "1px solid rgba(122,158,126,0.30)",
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontSize: 22,
            color: "rgba(237,244,238,0.88)",
            textAlign: "center",
            width: "100%",
            maxWidth: 360,
            padding: "8px 0",
            outline: "none",
            marginBottom: 40,
          }}
        />
        <button
          type="button"
          data-ocid="milestone.submit_button"
          onClick={() => onComplete(volumeName || undefined)}
          style={{
            background: "none",
            border: "none",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 13,
            color: "rgba(122,158,126,0.60)",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Close this chapter →
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: milestone === 365 ? "#000" : "#2A3530",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
      data-ocid="milestone.modal"
    >
      {milestone === 7 && (
        <>
          <BookOpen
            size={28}
            style={{ color: "rgba(122,158,126,0.6)", marginBottom: 32 }}
            aria-hidden="true"
          />
          <p
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 19,
              color: "rgba(237,244,238,0.82)",
              lineHeight: 1.55,
              maxWidth: 320,
              margin: "0 0 32px",
            }}
          >
            One week.
            <br />
            Seven times you came here
            <br />
            and put something down.
            <br />
            That is not nothing.
            <br />
            That is a beginning.
          </p>
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 200,
              fontSize: 11,
              color: "rgba(184,207,192,0.25)",
              margin: 0,
            }}
          >
            {journalPageCount} pages
          </p>
        </>
      )}

      {milestone === 30 && (
        <>
          <p
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 19,
              color: "rgba(237,244,238,0.82)",
              lineHeight: 1.55,
              maxWidth: 320,
              margin: "0 0 32px",
            }}
          >
            Thirty days.
            <br />
            {moments} moments documented.
            <br />
            {carriedAndPutDown} things carried and put down.
            <br />
            Something exists now that
            <br />
            did not exist a month ago.
            <br />
            It is yours.
          </p>
          {/* Mini bookshelf */}
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
          >
            <div
              style={{
                width: 8,
                height: 60,
                background: dominantEmotionColor,
                borderRadius: "2px 2px 0 0",
                opacity: 0.7,
              }}
              aria-hidden="true"
            />
          </div>
        </>
      )}

      {milestone === 90 && (
        <>
          <p
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 19,
              color: "rgba(237,244,238,0.82)",
              lineHeight: 1.55,
              maxWidth: 320,
              margin: "0 0 28px",
            }}
          >
            Three months.
            <br />
            You showed up {sessionCount} times.
            <br />
            You put things down.
            <br />
            You went home lighter.
            <br />
            {moments} times, you went home lighter.
            <br />
            This is who you are becoming.
          </p>
          {becomingLine && (
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: 11,
                color: "rgba(184,207,192,0.28)",
                fontStyle: "italic",
                maxWidth: 280,
                lineHeight: 1.55,
              }}
            >
              {becomingLine}
            </p>
          )}
        </>
      )}

      {milestone === 365 && (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1.0 }}
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontWeight: 300,
              fontSize: 48,
              color: "rgba(237,244,238,0.20)",
              margin: "0 0 40px",
            }}
          >
            {yearNumber}
          </motion.p>
          {/* Volume spine */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.2, duration: 0.8 }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 40,
                height: 80,
                background: dominantEmotionColor,
                borderRadius: "3px 3px 0 0",
                opacity: 0.75,
              }}
              aria-hidden="true"
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.2, duration: 1.2 }}
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 18,
              color: "rgba(237,244,238,0.82)",
              lineHeight: 1.55,
              maxWidth: 320,
              margin: 0,
            }}
          >
            You have completed a year.
            <br />A full year of moments
            <br />
            documented and held.
            <br />
            This year is now a Volume.
            <br />
            It has a name — when you are ready
            <br />
            to give it one.
          </motion.p>
        </>
      )}
    </motion.div>
  );
}
