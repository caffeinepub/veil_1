// ─── Veil Emotional Compass — Full Screen Overlay ─────────────────────────────
// The complete Emotional Compass experience. Opens as a full-screen overlay
// from Reflections tab. Contains Layer 1 (needle + narrative + history) and
// Layer 2 (four dimension cards).

import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import {
  CONNECTION_GIVING_NARRATIVES,
  CONNECTION_RECEIVING_NARRATIVES,
  GROWTH_NARRATIVES,
  MEANING_NARRATIVES,
  type MonthEntry,
  NEEDLE_NARRATIVES,
  NEEDLE_ROTATION,
  REFLECTION_NARRATIVES,
  ZONE_COLORS,
  ZONE_LABELS,
  mockCompassState,
  mockMonthHistory,
} from "./compassData";
import type { CompassDirection, CompassState } from "./compassData";

// ─── Design constants ─────────────────────────────────────────────────────────

const PARCHMENT = "#FAF7F2";
const WARM_DARK = "#2A1A0A";
const WARM_AMBER = "#C87C3A";
const GOLD = "#E8C060";
const BODY_TEXT = "#4A3728";
const CARD_BG = "#FFFDF9";
const NEEDLE_RED = "#C75B3A";
const NEEDLE_TAIL = "#B8C4D4";

// ─── Compass Rose SVG ─────────────────────────────────────────────────────────

function CompassRoseSVG({
  direction,
  size = 280,
  mini = false,
  pulsing = false,
}: {
  direction: CompassDirection;
  size?: number;
  mini?: boolean;
  pulsing?: boolean;
}) {
  const angle = NEEDLE_ROTATION[direction];
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - (mini ? 3 : 8);
  const zoneColor = ZONE_COLORS[direction] ?? GOLD;
  const zoneLabel = ZONE_LABELS[direction] ?? direction;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Emotional compass pointing ${direction
        .replace(/_/g, " ")
        .toLowerCase()}. ${NEEDLE_NARRATIVES[direction]}`}
      style={{
        animation: pulsing
          ? "veil-compass-pulse 2s ease-in-out infinite"
          : undefined,
      }}
    >
      <title>{`Emotional compass — ${zoneLabel}`}</title>

      {/* Parchment background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={mini ? "transparent" : PARCHMENT}
        stroke={mini ? "rgba(42,26,10,0.12)" : "rgba(42,26,10,0.08)"}
        strokeWidth={mini ? 0.8 : 1.5}
      />

      {/* Zone quadrant arcs — 18% opacity fill */}
      {(
        [
          { start: -90, end: 0, color: ZONE_COLORS.NORTH },
          { start: 0, end: 90, color: ZONE_COLORS.EAST },
          { start: 90, end: 180, color: ZONE_COLORS.SOUTH },
          { start: 180, end: 270, color: ZONE_COLORS.WEST },
        ] as Array<{ start: number; end: number; color: string }>
      ).map((q, i) => {
        const startRad = (q.start * Math.PI) / 180;
        const endRad = (q.end * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        // Use cardinal labels as stable keys
        const quadrantKeys = ["NE", "SE", "SW", "NW"];
        return (
          <path
            key={quadrantKeys[i]}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
            fill={q.color}
            opacity={0.18}
          />
        );
      })}

      {/* Dashed ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={mini ? "rgba(42,26,10,0.1)" : "rgba(42,26,10,0.07)"}
        strokeWidth={mini ? 0.6 : 1}
        strokeDasharray={mini ? "2,4" : "3,6"}
      />

      {/* Cardinal direction marks */}
      {!mini &&
        [
          { label: "N", a: -90 },
          { label: "E", a: 0 },
          { label: "S", a: 90 },
          { label: "W", a: 180 },
        ].map(({ label, a }) => {
          const rad = (a * Math.PI) / 180;
          const dist = r - 14;
          const x = cx + dist * Math.cos(rad);
          const y = cy + dist * Math.sin(rad);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size > 100 ? 11 : 6}
              fill={`rgba(42,26,10,${label === "N" ? "0.45" : "0.28"})`}
              fontFamily="'Playfair Display', Georgia, serif"
              fontStyle="italic"
            >
              {label}
            </text>
          );
        })}

      {/* 8-point compass rose star — hand-drawn aesthetic with slight variation */}
      {!mini &&
        (() => {
          const rOuter = r * 0.38;
          const rInner = r * 0.13;
          const pts = Array.from({ length: 8 }, (_, i) => {
            const a = ((i * 45 - 90) * Math.PI) / 180;
            const isMain = i % 2 === 0;
            const ro = isMain ? rOuter : rInner;
            const jitter = isMain ? 1 : 0.5;
            return `${cx + (ro + (i % 3 === 0 ? jitter : -jitter * 0.5)) * Math.cos(a)},${cy + ro * Math.sin(a)}`;
          }).join(" ");
          return (
            <polygon
              points={pts}
              fill="none"
              stroke="rgba(42,26,10,0.18)"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          );
        })()}

      {/* Needle — red tip, slate tail */}
      {!pulsing &&
        (() => {
          const needleLen = mini ? r * 0.62 : r * 0.58;
          const tailLen = mini ? r * 0.28 : r * 0.26;
          const needleW = mini ? 1.8 : 3;
          const rad = ((angle - 90) * Math.PI) / 180;
          const tipX = cx + needleLen * Math.cos(rad);
          const tipY = cy + needleLen * Math.sin(rad);
          const tailX = cx - tailLen * Math.cos(rad);
          const tailY = cy - tailLen * Math.sin(rad);
          return (
            <g>
              <line
                x1={cx}
                y1={cy}
                x2={tailX}
                y2={tailY}
                stroke={mini ? zoneColor : NEEDLE_TAIL}
                strokeWidth={needleW * 0.7}
                strokeLinecap="round"
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: "all 1.5s ease",
                }}
              />
              <line
                x1={cx}
                y1={cy}
                x2={tipX}
                y2={tipY}
                stroke={mini ? zoneColor : NEEDLE_RED}
                strokeWidth={needleW}
                strokeLinecap="round"
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: "all 1.5s ease",
                }}
              />
            </g>
          );
        })()}

      {/* Center dot */}
      <circle
        cx={cx}
        cy={cy}
        r={mini ? 2 : 4}
        fill={mini ? zoneColor : GOLD}
        opacity={0.9}
      />
    </svg>
  );
}

// ─── Mini compass for history strip ──────────────────────────────────────────

function MiniHistoryCompass({
  entry,
  isExpanded,
  onClick,
}: {
  entry: MonthEntry;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const zoneColor = ZONE_COLORS[entry.direction] ?? GOLD;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${entry.month}: Pointing ${entry.direction.replace(/_/g, " ").toLowerCase()}`}
      aria-pressed={isExpanded}
      className="flex flex-col items-center gap-1 shrink-0 transition-transform duration-200 hover:scale-110 active:scale-95"
      style={{ minWidth: 48 }}
    >
      <div
        className="rounded-full p-0.5"
        style={{
          background: `${zoneColor}30`,
          border: isExpanded
            ? `1.5px solid ${zoneColor}`
            : "1.5px solid transparent",
        }}
      >
        <CompassRoseSVG direction={entry.direction} size={44} mini />
      </div>
    </button>
  );
}

// ─── Dimension Card ───────────────────────────────────────────────────────────

function DimensionCard({
  icon,
  title,
  children,
  ctaLabel,
  onCta,
  ariaLabel,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  ctaLabel: string;
  onCta?: () => void;
  ariaLabel: string;
}) {
  return (
    <article
      aria-label={ariaLabel}
      className="rounded-2xl p-5 shadow-sm"
      style={{
        backgroundColor: CARD_BG,
        border: "1px solid rgba(42,26,10,0.06)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
        <h3
          className="text-base font-semibold"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: WARM_DARK,
          }}
        >
          {title}
        </h3>
      </div>
      <div className="space-y-1">{children}</div>
      {onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 text-sm flex items-center gap-1"
          style={{ color: WARM_AMBER, minHeight: 48 }}
        >
          {ctaLabel}
        </button>
      )}
    </article>
  );
}

function ObservationText({ children }: { children: string }) {
  return (
    <p
      className="text-sm leading-relaxed"
      style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontStyle: "italic",
        color: BODY_TEXT,
        lineHeight: 1.75,
      }}
    >
      {children}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmotionalCompassProps {
  onClose: () => void;
  onOpenReflection?: () => void;
  onNavigateWrite?: () => void;
  onNavigateJournal?: () => void;
  onNavigateProfile?: () => void;
  compassState?: CompassState;
  monthHistory?: MonthEntry[];
}

export function EmotionalCompass({
  onClose,
  onOpenReflection,
  onNavigateWrite,
  onNavigateJournal,
  onNavigateProfile,
  compassState = mockCompassState,
  monthHistory = mockMonthHistory,
}: EmotionalCompassProps) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const cs = compassState;
  const isEmptyState = cs.daysOfData < 14;
  const direction = cs.needleDirection;
  const narrative = NEEDLE_NARRATIVES[direction];

  const showReflection = cs.hasJournalEntry;
  const showConnection = cs.hasInnerCircleInteraction;
  const showGrowth = cs.daysOfData >= 30;
  const showMeaning = cs.hasTurningPoint;

  function toggleMonth(idx: number) {
    setExpandedMonth((prev) => (prev === idx ? null : idx));
  }

  const expandedEntry =
    expandedMonth !== null ? monthHistory[expandedMonth] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: PARCHMENT }}
    >
      {/* ── Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
        style={{
          backgroundColor: PARCHMENT,
          borderBottom: "1px solid rgba(42,26,10,0.07)",
        }}
      >
        <div />
        <h1
          className="text-xl font-semibold text-center tracking-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: WARM_DARK,
          }}
        >
          Your Direction
        </h1>
        <button
          type="button"
          data-ocid="compass.close_button"
          onClick={onClose}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "rgba(42,26,10,0.06)",
            color: WARM_DARK,
          }}
          aria-label="Close compass"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* ── Content */}
      <div className="px-5 pb-16 max-w-lg mx-auto">
        {/* ── Layer 1: Compass Rose */}
        <div className="flex flex-col items-center pt-8 pb-6 gap-5">
          <div data-ocid="compass.canvas_target">
            <CompassRoseSVG
              direction={direction}
              size={280}
              pulsing={isEmptyState}
            />
          </div>

          {isEmptyState ? (
            <div className="text-center max-w-xs">
              <p
                className="text-base leading-relaxed italic"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: BODY_TEXT,
                  lineHeight: 1.75,
                }}
              >
                Your compass is finding its direction.
                <br />
                <br />
                The more you bring to Veil — the more clearly it will point.
              </p>
            </div>
          ) : (
            <p
              className="text-center"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontStyle: "italic",
                fontSize: 18,
                color: WARM_DARK,
                lineHeight: 1.7,
                maxWidth: 320,
              }}
            >
              {narrative}
            </p>
          )}

          {!isEmptyState && (
            <button
              type="button"
              data-ocid="compass.primary_button"
              onClick={onOpenReflection}
              className="w-full max-w-xs rounded-2xl py-3.5 text-sm font-medium transition-colors"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                minHeight: 48,
                border: "1px solid rgba(200,124,58,0.35)",
                color: WARM_AMBER,
                backgroundColor: "rgba(200,124,58,0.05)",
              }}
            >
              Reflect on your direction →
            </button>
          )}
        </div>

        {/* ── 12-Month History Strip */}
        {!isEmptyState && monthHistory.length > 0 && (
          <section
            className="mb-8"
            aria-label="12-month emotional direction history"
          >
            <div
              className="overflow-x-auto pb-3"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex gap-2 w-max">
                {monthHistory.map((entry, idx) => (
                  <MiniHistoryCompass
                    key={`${entry.month}-${entry.direction}`}
                    entry={entry}
                    isExpanded={expandedMonth === idx}
                    onClick={() => toggleMonth(idx)}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence>
              {expandedEntry !== null && expandedMonth !== null && (
                <motion.div
                  key={expandedMonth}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-3 rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: `${ZONE_COLORS[expandedEntry.direction] ?? GOLD}20`,
                      border: `1px solid ${ZONE_COLORS[expandedEntry.direction] ?? GOLD}40`,
                    }}
                  >
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: WARM_DARK, opacity: 0.6 }}
                    >
                      {expandedEntry.month} —{" "}
                      {ZONE_LABELS[expandedEntry.direction]}
                    </p>
                    <p
                      className="text-sm italic leading-relaxed"
                      style={{
                        fontFamily: "'EB Garamond', Georgia, serif",
                        color: BODY_TEXT,
                        lineHeight: 1.7,
                      }}
                    >
                      {NEEDLE_NARRATIVES[expandedEntry.direction]}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* ── Layer 2: Dimension Cards */}
        {!isEmptyState && (
          <div className="space-y-4">
            {showReflection && (
              <DimensionCard
                icon="🌊"
                title="How you sit with yourself"
                ctaLabel="Write a reflection →"
                onCta={onOpenReflection}
                ariaLabel={`Reflection dimension: ${REFLECTION_NARRATIVES[cs.reflectionDirection]}`}
              >
                <ObservationText>
                  {REFLECTION_NARRATIVES[cs.reflectionDirection]}
                </ObservationText>
              </DimensionCard>
            )}

            {showConnection && (
              <DimensionCard
                icon="🌿"
                title="How you are with others"
                ctaLabel="Write someone something →"
                onCta={onNavigateWrite}
                ariaLabel={`Connection dimension: giving — ${CONNECTION_GIVING_NARRATIVES[cs.connectionGivingDirection]}. Receiving — ${CONNECTION_RECEIVING_NARRATIVES[cs.connectionReceivingDirection]}`}
              >
                <div className="space-y-4">
                  <div>
                    <p
                      className="text-xs uppercase tracking-widest mb-1.5"
                      style={{ color: WARM_DARK, opacity: 0.45 }}
                    >
                      Giving
                    </p>
                    <ObservationText>
                      {
                        CONNECTION_GIVING_NARRATIVES[
                          cs.connectionGivingDirection
                        ]
                      }
                    </ObservationText>
                  </div>
                  <div
                    style={{
                      height: 1,
                      backgroundColor: "rgba(42,26,10,0.07)",
                    }}
                  />
                  <div>
                    <p
                      className="text-xs uppercase tracking-widest mb-1.5"
                      style={{ color: WARM_DARK, opacity: 0.45 }}
                    >
                      Receiving
                    </p>
                    <ObservationText>
                      {
                        CONNECTION_RECEIVING_NARRATIVES[
                          cs.connectionReceivingDirection
                        ]
                      }
                    </ObservationText>
                  </div>
                </div>
              </DimensionCard>
            )}

            {showGrowth && (
              <DimensionCard
                icon="🌱"
                title="How you are changing"
                ctaLabel="See your turning points →"
                onCta={onNavigateJournal}
                ariaLabel={`Growth dimension: ${GROWTH_NARRATIVES[cs.growthDirection]}`}
              >
                <ObservationText>
                  {GROWTH_NARRATIVES[cs.growthDirection]}
                </ObservationText>
              </DimensionCard>
            )}

            {showMeaning && (
              <DimensionCard
                icon="✦"
                title="What your life is about"
                ctaLabel="Read your Becoming →"
                onCta={onNavigateProfile}
                ariaLabel={`Meaning dimension: ${MEANING_NARRATIVES[cs.meaningDirection]}`}
              >
                <ObservationText>
                  {MEANING_NARRATIVES[cs.meaningDirection]}
                </ObservationText>
              </DimensionCard>
            )}
          </div>
        )}
      </div>

      {/* Keyframes for empty-state compass pulse */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes veil-compass-pulse {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50% { transform: scale(0.97); opacity: 1; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes veil-compass-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
          }
        }
      `}</style>
    </motion.div>
  );
}

export default EmotionalCompass;
