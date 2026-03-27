// ═══════════════════════════════════════════════════════════
// VEIL — ALGORITHM INSIGHTS PANEL
// Layer 4 EIE: Emotional Direction + Insights + Support Presence
// No numbers. No scores. No percentages. Direction only.
// ═══════════════════════════════════════════════════════════

import { motion } from "motion/react";
import { useMemo } from "react";
import {
  type EIEInsight,
  type EmotionalDirection,
  type UEDLEvent,
  analyzeEmotionPatterns,
  analyzeSupportPresence,
  calculateDirection,
  generateInsights,
} from "./eieEngine";

// ─── Mock UEDL data (until backend is wired for this) ───
const MOCK_EVENTS: UEDLEvent[] = [
  {
    id: "1",
    userId: "user1",
    eventType: "CHECK_IN",
    emotionType: "Stressed",
    emotionWeight: "HIGH",
    dayOfWeek: 0,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "2",
    userId: "user1",
    eventType: "CHECK_IN",
    emotionType: "Sad",
    emotionWeight: "HIGH",
    dayOfWeek: 1,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: "3",
    userId: "user1",
    eventType: "JOURNAL",
    emotionType: "Reflective",
    emotionWeight: "MEDIUM",
    dayOfWeek: 2,
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
  {
    id: "4",
    userId: "user1",
    eventType: "CHECK_IN",
    emotionType: "Hopeful",
    emotionWeight: "MEDIUM",
    dayOfWeek: 3,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: "5",
    userId: "user1",
    eventType: "SUPPORT_GIVEN",
    emotionType: "Calm",
    emotionWeight: "LIGHT",
    dayOfWeek: 4,
    createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  },
  {
    id: "6",
    userId: "user1",
    eventType: "CHECK_IN",
    emotionType: "Stressed",
    emotionWeight: "HIGH",
    dayOfWeek: 0,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: "7",
    userId: "user1",
    eventType: "CHECK_IN",
    emotionType: "Stressed",
    emotionWeight: "HIGH",
    dayOfWeek: 0,
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
  },
];

// ─── Direction → human-readable phrase ───
const DIRECTION_PHRASES: Record<EmotionalDirection, string> = {
  PREDOMINANTLY_POSITIVE: "Things have been opening up.",
  PREDOMINANTLY_DIFFICULT: "You have been carrying something.",
  BALANCED: "You have been moving between light and heavy.",
  SHIFTING_POSITIVE: "Something has been lifting.",
  SHIFTING_DIFFICULT: "Something has been weighing on you.",
};

// ─── Direction → aura background color ───
const DIRECTION_AURA: Record<EmotionalDirection, string> = {
  PREDOMINANTLY_POSITIVE: "rgba(249,228,160,0.18)",
  PREDOMINANTLY_DIFFICULT: "rgba(195,184,216,0.22)",
  BALANCED: "rgba(184,196,212,0.18)",
  SHIFTING_POSITIVE: "rgba(168,213,186,0.18)",
  SHIFTING_DIFFICULT: "rgba(244,194,138,0.18)",
};

// ─── Insight card style per type ───
const INSIGHT_STYLE: Record<
  EIEInsight["type"],
  { bg: string; icon: string; border: string }
> = {
  PATTERN: {
    bg: "rgba(195,184,216,0.2)",
    icon: "🌊",
    border: "rgba(195,184,216,0.4)",
  },
  DIRECTION: {
    bg: "rgba(244,194,138,0.18)",
    icon: "↗",
    border: "rgba(244,194,138,0.35)",
  },
  RECOVERY: {
    bg: "rgba(168,213,186,0.18)",
    icon: "🌱",
    border: "rgba(168,213,186,0.4)",
  },
  SUPPORT: {
    bg: "rgba(249,228,160,0.18)",
    icon: "✦",
    border: "rgba(249,228,160,0.4)",
  },
};

const CREAM = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.55)";
const GOLD = "#D4AF6A";

export function AlgorithmInsightsPanel() {
  const analysis = useMemo(
    () => analyzeEmotionPatterns(MOCK_EVENTS, "user1"),
    [],
  );
  const direction = useMemo(() => calculateDirection(MOCK_EVENTS), []);
  const supportResult = useMemo(
    () =>
      analyzeSupportPresence(
        MOCK_EVENTS.map((e) => ({
          supportReactionCount: 0,
          emotionType: e.emotionType,
        })),
        MOCK_EVENTS.filter((e) => e.eventType === "SUPPORT_GIVEN").length,
      ),
    [],
  );
  const insights = useMemo(
    () => generateInsights(analysis, supportResult, MOCK_EVENTS),
    [analysis, supportResult],
  );

  return (
    <motion.section
      data-ocid="reflections.eie.panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
      aria-label="What Veil has noticed"
    >
      {/* Section header */}
      <h2
        className="font-serif text-sm font-medium tracking-wide"
        style={{ color: GOLD, opacity: 0.8 }}
      >
        What Veil has noticed
      </h2>

      {/* 2a. Emotional Direction summary */}
      <div
        data-ocid="reflections.eie.direction.card"
        className="rounded-2xl p-6 text-center"
        style={{
          background: DIRECTION_AURA[direction],
          border: "1px solid rgba(245,240,232,0.06)",
        }}
      >
        <p
          className="font-serif italic text-base leading-relaxed"
          style={{ color: CREAM }}
        >
          {DIRECTION_PHRASES[direction]}
        </p>
      </div>

      {/* 2b. EIE Insights list */}
      {insights.length > 0 && (
        <div className="space-y-3" data-ocid="reflections.eie.insights.list">
          {insights.map((insight, i) => {
            const style = INSIGHT_STYLE[insight.type];
            return (
              <motion.div
                key={`${insight.type}-${i}`}
                data-ocid={`reflections.eie.insight.item.${i + 1}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="rounded-2xl p-5 flex items-start gap-3"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                <span
                  className="text-lg shrink-0 mt-0.5"
                  aria-hidden="true"
                  style={{ color: CREAM }}
                >
                  {style.icon}
                </span>
                <p
                  className="font-serif italic text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: CREAM }}
                >
                  {insight.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 2c. Support Presence summary */}
      <div
        data-ocid="reflections.eie.support.card"
        className="rounded-2xl p-5 space-y-2"
        style={{
          background: "rgba(245,240,232,0.04)",
          border: "1px solid rgba(245,240,232,0.06)",
        }}
      >
        {supportResult.hasReceivedSupport ? (
          <p className="font-serif italic text-sm" style={{ color: CREAM }}>
            You were supported this period.
          </p>
        ) : supportResult.postsWithZeroSupport > 0 ? (
          <p className="font-serif italic text-sm" style={{ color: MUTED }}>
            Some of what you shared is still waiting to be held.
          </p>
        ) : null}
        {supportResult.supportGiven > 0 && (
          <p className="text-xs" style={{ color: GOLD, opacity: 0.75 }}>
            You showed up for others.
          </p>
        )}
      </div>
    </motion.section>
  );
}
