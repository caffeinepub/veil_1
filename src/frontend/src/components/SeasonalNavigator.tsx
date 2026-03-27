// ─── Seasonal Navigator ───────────────────────────────────────────────────────
// Full-screen overlay for navigating the journal by season, year, month, week, day.
// Slides up from under the Journal Cover like lifting a book's table of contents.

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Sparkles, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useMemo, useReducer, useState } from "react";
import type { JournalPage } from "../lib/journalData";
import {
  MONTH_NAMES,
  type MonthData,
  SEASON_INFO,
  type Season,
  type SeasonData,
  type WeekData,
  type YearData,
  buildSeasonalIndex,
  generateSeasonalReflection,
  getEmotionColor,
} from "../lib/seasonalData";

// ─── Props ───────────────────────────────────────────────────────────────────

interface SeasonalNavigatorProps {
  pages: JournalPage[];
  userName: string;
  hemisphere: "NORTHERN" | "SOUTHERN";
  onOpenPage: (pageIndex: number) => void;
  onClose: () => void;
}

// ─── Nav state ───────────────────────────────────────────────────────────────

type NavLevel =
  | "years"
  | "months"
  | "weeks"
  | "day"
  | "season_cover"
  | "reflection";

interface NavState {
  level: NavLevel;
  year?: number;
  season?: Season;
  expandedYear?: number;
  month?: number;
  weekIndex?: number;
  selectedDate?: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SERIF = '"Playfair Display", Georgia, serif';

const BG = "#1a0f08";
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "rgba(232,200,128,0.12)";
const TEXT_CREAM = "#F5E6C8";
const TEXT_MUTED = "#A08060";
const GOLD = "#E8C880";

function formatDateFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Day Circle SVG ───────────────────────────────────────────────────────────

function DayCircle({
  emotions,
  size = 36,
  hasEntries,
}: {
  emotions: string[];
  size?: number;
  hasEntries: boolean;
}) {
  if (!hasEntries) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="none"
          stroke="#444"
          strokeWidth={1.5}
        />
      </svg>
    );
  }

  const unique = Array.from(new Set(emotions)).slice(0, 4);
  const colors = unique.map(getEmotionColor);

  if (colors.length === 1) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill={colors[0]} />
      </svg>
    );
  }

  // Pie segments
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  const sliceAngle = (2 * Math.PI) / colors.length;
  const paths = colors.map((color, i) => {
    const startAngle = i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    return (
      <path
        key={`pie-seg-${color}`}
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
        fill={color}
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

// ─── Emotional Color Strip ────────────────────────────────────────────────────

function EmotionalColorStrip({ pages }: { pages: JournalPage[] }) {
  const dots = pages.slice(0, 40);
  return (
    <div className="flex flex-wrap gap-1" style={{ minHeight: 16 }}>
      {dots.map((p) => (
        <div
          key={p.id}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: getEmotionColor(p.emotionType),
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Week indicator blocks ────────────────────────────────────────────────────

function WeekBlocks({ weeks }: { weeks: WeekData[] }) {
  return (
    <div className="flex gap-1.5">
      {weeks.map((w) => (
        <div
          key={`week-${w.startDate.toISOString()}`}
          style={{
            flex: 1,
            height: 32,
            borderRadius: 6,
            background:
              w.pages.length > 0 ? getEmotionColor(w.dominantEmotion) : "#333",
            opacity: w.pages.length > 0 ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

// ─── Day Summary ─────────────────────────────────────────────────────────────

function getDaySummary(pages: JournalPage[]): string {
  if (pages.length === 0) return "A quiet day.";
  const neg = ["stressed", "sad", "frustrated", "anxious", "lonely", "numb"];
  const pos = ["grateful", "calm", "hopeful", "captured_joy", "achievement"];
  const silent = pages.every(
    (p) =>
      p.pageType === "COMPANION_DUMP_SILENT" || p.content === "You showed up.",
  );
  if (silent) return "You showed up. That was enough.";
  const hasNeg = pages.some((p) => neg.includes(p.emotionType));
  const hasPos = pages.some((p) => pos.includes(p.emotionType));
  if (hasNeg && hasPos) return "A day that held both.";
  if (hasNeg) return "A heavy day.";
  if (hasPos) return "A good day.";
  if (pages.length > 2) return "A full day. You brought it all here.";
  return "You were here.";
}

// ─── Seasonal Color Bar ───────────────────────────────────────────────────────

function SeasonalColorBar({ yearData }: { yearData: YearData }) {
  const seasons: Season[] = ["SPRING", "SUMMER", "FALL", "WINTER"];
  return (
    <div className="flex rounded-md overflow-hidden" style={{ height: 8 }}>
      {seasons.map((s) => {
        const density = yearData.seasonDensities[s];
        const info = SEASON_INFO[s];
        return (
          <div
            key={s}
            style={{
              flex: 1,
              background: info.color,
              opacity: density === 0 ? 0.1 : Math.max(0.2, density),
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SeasonalNavigator({
  pages,
  userName,
  hemisphere,
  onOpenPage,
  onClose,
}: SeasonalNavigatorProps) {
  const [nav, setNav] = useState<NavState>({ level: "years" });
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [quickJumpSeason, setQuickJumpSeason] = useState<Season>("SPRING");
  const [quickJumpYear, setQuickJumpYear] = useState<number | null>(null);
  const [jumping, setJumping] = useState(false);
  const [reflectionText, setReflectionText] = useState<string | null>(null);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const yearData = useMemo(
    () => buildSeasonalIndex(pages, hemisphere),
    [pages, hemisphere],
  );

  const allYears = useMemo(() => yearData.map((y) => y.year), [yearData]);

  // ── Navigation helpers ─────────────────────────────────────────────────

  const goBack = useCallback(() => {
    setNav((prev) => {
      if (prev.level === "reflection")
        return { ...prev, level: "season_cover" };
      if (prev.level === "season_cover") return { ...prev, level: "months" };
      if (prev.level === "day") return { ...prev, level: "weeks" };
      if (prev.level === "weeks") return { ...prev, level: "months" };
      if (prev.level === "months")
        return { level: "years", expandedYear: prev.year };
      return { level: "years" };
    });
  }, []);

  // ── Header title ──────────────────────────────────────────────────────

  function getHeaderTitle(): string {
    if (nav.level === "years") return "Your Journal";
    if (
      nav.level === "months" ||
      nav.level === "season_cover" ||
      nav.level === "reflection"
    ) {
      const info = nav.season ? SEASON_INFO[nav.season] : null;
      return info ? `${info.emoji} ${info.label} ${nav.year}` : "Season";
    }
    if (nav.level === "weeks") {
      return nav.month !== undefined
        ? `${MONTH_NAMES[nav.month]} ${nav.year}`
        : "Month";
    }
    if (nav.level === "day" && nav.selectedDate) {
      return formatDateFull(nav.selectedDate);
    }
    return "Your Journal";
  }

  function getHeaderSubtitle(): string | null {
    if (nav.level === "years") return "A life in seasons.";
    return null;
  }

  // ── Find data helpers ──────────────────────────────────────────────────

  const currentYearData = useMemo(
    () => yearData.find((y) => y.year === nav.year),
    [yearData, nav.year],
  );

  const currentSeasonData = useMemo(
    () => currentYearData?.seasons.find((s) => s.season === nav.season),
    [currentYearData, nav.season],
  );

  const currentMonthData = useMemo(
    () => currentSeasonData?.months.find((m) => m.month === nav.month),
    [currentSeasonData, nav.month],
  );

  // ── Quick jump handler ─────────────────────────────────────────────────

  const handleQuickJump = useCallback(() => {
    const targetYear = quickJumpYear ?? allYears[0] ?? new Date().getFullYear();
    const targetSeasonData = yearData
      .find((y) => y.year === targetYear)
      ?.seasons.find((s) => s.season === quickJumpSeason);

    if (!targetSeasonData || targetSeasonData.isEmpty) return;

    setJumping(true);
    setQuickJumpOpen(false);

    // Flutter animation then navigate
    setTimeout(() => {
      setJumping(false);
      // Navigate to the first page of the season
      if (targetSeasonData.pages.length > 0) {
        const firstPage = targetSeasonData.pages[0];
        const originalIndex = pages.findIndex((p) => p.id === firstPage.id);
        if (originalIndex >= 0) {
          onOpenPage(originalIndex);
          return;
        }
      }
      // Fallback: go to season cover
      setNav({
        level: "season_cover",
        year: targetYear,
        season: quickJumpSeason,
      });
    }, 800);
  }, [quickJumpSeason, quickJumpYear, allYears, yearData, pages, onOpenPage]);

  // ── Reflection handler ─────────────────────────────────────────────────

  const handleReflection = useCallback(
    (seasonData: SeasonData) => {
      const text = generateSeasonalReflection(seasonData, userName);
      setReflectionText(text);
      setNav((prev) => ({ ...prev, level: "reflection" }));
    },
    [userName],
  );

  // ── Render views ───────────────────────────────────────────────────────

  function renderYearView() {
    if (yearData.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center flex-1 gap-4"
          style={{ padding: "60px 24px" }}
        >
          <span style={{ fontSize: 48 }}>📖</span>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              color: TEXT_CREAM,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Your seasons are waiting.
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 14,
              color: TEXT_MUTED,
              textAlign: "center",
            }}
          >
            Write your first entry to begin the journey.
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {yearData.map((yd, yearIdx) => (
            <motion.div
              key={yd.year}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: yearIdx * 0.05, duration: 0.35 }}
            >
              {/* Year card */}
              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() =>
                    setNav((prev) => ({
                      ...prev,
                      expandedYear:
                        prev.expandedYear === yd.year ? undefined : yd.year,
                    }))
                  }
                  data-ocid={`journal.season.year_${yd.year}.button`}
                  style={{ padding: "20px 20px 16px" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontSize: 32,
                        fontWeight: 700,
                        color: TEXT_CREAM,
                        lineHeight: 1,
                      }}
                    >
                      {yd.year}
                    </span>
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontSize: 12,
                        color: TEXT_MUTED,
                        fontStyle: "italic",
                      }}
                    >
                      {nav.expandedYear === yd.year ? "▲" : "▼"}
                    </span>
                  </div>

                  <SeasonalColorBar yearData={yd} />

                  <div
                    className="flex items-center gap-2 mt-3"
                    style={{ flexWrap: "wrap" }}
                  >
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontSize: 12,
                        color: TEXT_MUTED,
                      }}
                    >
                      {yd.totalPages} pages
                    </span>
                    {yd.dominantEmotion && (
                      <>
                        <span style={{ color: TEXT_MUTED, fontSize: 10 }}>
                          ·
                        </span>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: getEmotionColor(yd.dominantEmotion),
                          }}
                        />
                        <span
                          style={{
                            fontFamily: SERIF,
                            fontSize: 12,
                            color: TEXT_MUTED,
                            fontStyle: "italic",
                          }}
                        >
                          Most felt: {yd.dominantEmotion.replace(/_/g, " ")}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 mt-3" style={{ flexWrap: "wrap" }}>
                    {(["SPRING", "SUMMER", "FALL", "WINTER"] as Season[]).map(
                      (s) => (
                        <span
                          key={s}
                          style={{
                            fontFamily: SERIF,
                            fontSize: 11,
                            color:
                              yd.seasonDensities[s] > 0
                                ? TEXT_MUTED
                                : "rgba(160,128,96,0.35)",
                          }}
                        >
                          {SEASON_INFO[s].emoji} {SEASON_INFO[s].label}
                        </span>
                      ),
                    )}
                  </div>
                </button>

                {/* Expanded seasons */}
                <AnimatePresence>
                  {nav.expandedYear === yd.year && (
                    <motion.div
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, height: 0 }
                      }
                      animate={{ opacity: 1, height: "auto" }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, height: 0 }
                      }
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          borderTop: `1px solid ${CARD_BORDER}`,
                          padding: "12px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {yd.seasons.map((sd, si) => (
                          <motion.div
                            key={sd.season}
                            initial={
                              reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: 20 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: si * 0.07, duration: 0.3 }}
                          >
                            <SeasonSubCard
                              seasonData={sd}
                              onTap={() =>
                                setNav({
                                  level: "months",
                                  year: yd.year,
                                  season: sd.season,
                                })
                              }
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  function renderMonthView() {
    if (!currentSeasonData) return null;
    const info = SEASON_INFO[currentSeasonData.season];

    return (
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Season cover tap */}
          <button
            type="button"
            onClick={() =>
              setNav((prev) => ({ ...prev, level: "season_cover" }))
            }
            style={{
              background: `linear-gradient(135deg, ${info.gradientFrom}22, ${info.gradientTo}33)`,
              border: `1px solid ${info.color}44`,
              borderRadius: 12,
              padding: "12px 16px",
              textAlign: "left",
              fontFamily: SERIF,
              fontSize: 13,
              color: info.color,
              fontStyle: "italic",
              cursor: "pointer",
            }}
            data-ocid="journal.season.cover.button"
          >
            View season cover page →
          </button>

          {currentSeasonData.months.map((monthData) => (
            <MonthCard
              key={monthData.month}
              monthData={monthData}
              onTap={() =>
                setNav((prev) => ({
                  ...prev,
                  level: "weeks",
                  month: monthData.month,
                }))
              }
            />
          ))}
        </div>
      </ScrollArea>
    );
  }

  function renderWeekView() {
    if (!currentMonthData) return null;

    return (
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {currentMonthData.weeks.map((weekData) => (
            <WeekCard
              key={weekData.startDate.toISOString()}
              weekData={weekData}
              onTapDay={(date) =>
                setNav((prev) => ({
                  ...prev,
                  level: "day",
                  selectedDate: date,
                }))
              }
              onTapWeek={() => {
                const firstWithEntry = weekData.days.find(
                  (d) => d.pages.length > 0,
                );
                if (firstWithEntry) {
                  setNav((prev) => ({
                    ...prev,
                    level: "day",
                    selectedDate: firstWithEntry.date,
                  }));
                }
              }}
            />
          ))}
        </div>
      </ScrollArea>
    );
  }

  function renderDayView() {
    if (!nav.selectedDate) return null;
    const dayPages = pages.filter((p) => {
      const d = p.date;
      const s = nav.selectedDate!;
      return (
        d.getFullYear() === s.getFullYear() &&
        d.getMonth() === s.getMonth() &&
        d.getDate() === s.getDate()
      );
    });
    const summary = getDaySummary(dayPages);

    return (
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Day summary */}
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 15,
              color: TEXT_CREAM,
              fontStyle: "italic",
              textAlign: "center",
              padding: "8px 0",
              opacity: 0.85,
            }}
          >
            {summary}
          </p>

          {dayPages.length === 0 ? (
            <div
              style={{
                background: CARD_BG,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
              }}
              data-ocid="journal.day.empty_state"
            >
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: 14,
                  color: TEXT_MUTED,
                  fontStyle: "italic",
                }}
              >
                No entries this day.
              </p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
              data-ocid="journal.day.list"
            >
              {dayPages.map((page, i) => {
                const originalIndex = pages.findIndex((p) => p.id === page.id);
                return (
                  <button
                    type="button"
                    key={page.id}
                    onClick={() =>
                      originalIndex >= 0 && onOpenPage(originalIndex)
                    }
                    style={{
                      background: `${page.pageColor}33`,
                      border: `1px solid ${page.pageColor}55`,
                      borderRadius: 12,
                      padding: "14px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                    data-ocid={`journal.day.item.${i + 1}`}
                  >
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontSize: 20,
                        marginBottom: 6,
                      }}
                    >
                      {page.pageTypeEmoji}
                    </div>
                    <p
                      style={{
                        fontFamily: SERIF,
                        fontSize: 11,
                        color: TEXT_MUTED,
                        marginBottom: 4,
                        fontStyle: "italic",
                      }}
                    >
                      {page.pageTypeLabel}
                    </p>
                    <p
                      style={{
                        fontFamily: SERIF,
                        fontSize: 12,
                        color: TEXT_CREAM,
                        opacity: 0.8,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical" as const,
                      }}
                    >
                      {page.contentPreview.slice(0, 60)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

  function renderSeasonCover() {
    if (!currentSeasonData) return null;
    const info = SEASON_INFO[currentSeasonData.season];
    const {
      pages: seasonPages,
      dominantEmotion,
      firstEntryPreview,
      isEmpty,
    } = currentSeasonData;

    return (
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{
          background: `linear-gradient(160deg, ${info.gradientFrom}, ${info.gradientTo})`,
          padding: "40px 32px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Reflection button */}
        {!isEmpty && (
          <button
            type="button"
            onClick={() => handleReflection(currentSeasonData)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(0,0,0,0.25)",
              border: "none",
              borderRadius: 8,
              padding: "8px",
              cursor: "pointer",
              color: GOLD,
            }}
            data-ocid="journal.season_cover.reflection.button"
          >
            <Sparkles size={18} />
          </button>
        )}

        <div style={{ fontSize: 56, marginBottom: 16 }}>{info.emoji}</div>

        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 36,
            fontWeight: 700,
            color: "#2A1A0A",
            marginBottom: 8,
          }}
        >
          {currentSeasonData.label}
        </h1>

        <p
          style={{
            fontFamily: SERIF,
            fontSize: 15,
            color: "#4A3020",
            marginBottom: 20,
          }}
        >
          {info.months.join(" · ")}
        </p>

        {isEmpty ? (
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 15,
              color: "#5A4030",
              fontStyle: "italic",
            }}
          >
            No entries this season.
            <br />
            <span style={{ opacity: 0.7 }}>That is its own story.</span>
          </p>
        ) : (
          <>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: 14,
                color: "#4A3020",
                marginBottom: 8,
              }}
            >
              {seasonPages.length} pages in this season
            </p>

            <div
              className="flex items-center gap-2 justify-center mb-20"
              style={{ marginBottom: 20 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: getEmotionColor(dominantEmotion),
                }}
              />
              <span
                style={{
                  fontFamily: SERIF,
                  fontSize: 13,
                  color: "#4A3020",
                  fontStyle: "italic",
                }}
              >
                {dominantEmotion.replace(/_/g, " ")}
              </span>
            </div>

            {firstEntryPreview && (
              <div
                style={{
                  margin: "0 auto 24px",
                  maxWidth: 280,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "#8A6A4A",
                    opacity: 0.5,
                  }}
                />
                <p
                  style={{
                    fontFamily: SERIF,
                    fontSize: 13,
                    color: "#4A3020",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  "{firstEntryPreview}"
                </p>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "#8A6A4A",
                    opacity: 0.5,
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Bottom marker */}
        {!isEmpty && (
          <p
            style={{
              position: "absolute",
              bottom: 24,
              fontFamily: SERIF,
              fontSize: 11,
              color: "#4A3020",
              opacity: 0.6,
            }}
          >
            {currentSeasonData.label} · Page 1 of {seasonPages.length}
          </p>
        )}
      </div>
    );
  }

  function renderReflection() {
    if (!reflectionText) return null;
    const info = nav.season ? SEASON_INFO[nav.season] : null;

    return (
      <ScrollArea className="flex-1">
        <div
          style={{
            padding: "32px 28px",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          {info && (
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 20,
                fontWeight: 700,
                color: GOLD,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              {info.emoji} {info.label} {nav.year} — A Reflection
            </h2>
          )}
          {reflectionText.split("\n\n").map((para, paraIdx) => {
            const paras = reflectionText.split("\n\n");
            const isLast = paraIdx === paras.length - 1;
            return (
              <p
                key={para.slice(0, 20)}
                style={{
                  fontFamily: SERIF,
                  fontSize: 15,
                  color: TEXT_CREAM,
                  lineHeight: 1.85,
                  marginBottom: isLast ? 0 : 20,
                  fontStyle: isLast ? "italic" : "normal",
                  opacity: isLast ? 0.75 : 1,
                  whiteSpace: "pre-line",
                }}
              >
                {para}
              </p>
            );
          })}
        </div>
      </ScrollArea>
    );
  }

  // ── Quick Jump Overlay ─────────────────────────────────────────────────

  const selectedYear = quickJumpYear ?? allYears[0] ?? new Date().getFullYear();

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
      animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: BG }}
      data-ocid="journal.seasonal_navigator.panel"
    >
      {/* Quick Jump pull-down overlay */}
      <AnimatePresence>
        {quickJumpOpen && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { y: "-100%" }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "-100%" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-x-0 top-0 z-20"
            style={{
              background: "#2C1810",
              borderBottom: `1px solid ${CARD_BORDER}`,
              padding: "20px 20px 24px",
            }}
            data-ocid="journal.quick_jump.panel"
          >
            <div className="flex items-center justify-between mb-4">
              <span
                style={{
                  fontFamily: SERIF,
                  fontSize: 16,
                  fontWeight: 600,
                  color: TEXT_CREAM,
                }}
              >
                Quick Jump
              </span>
              <button
                type="button"
                onClick={() => setQuickJumpOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: TEXT_MUTED,
                  cursor: "pointer",
                }}
                data-ocid="journal.quick_jump.close.button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              {/* Season picker */}
              <select
                value={quickJumpSeason}
                onChange={(e) => setQuickJumpSeason(e.target.value as Season)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: TEXT_CREAM,
                  fontFamily: SERIF,
                  fontSize: 14,
                  cursor: "pointer",
                }}
                data-ocid="journal.quick_jump.season.select"
              >
                {(["SPRING", "SUMMER", "FALL", "WINTER"] as Season[]).map(
                  (s) => (
                    <option key={s} value={s} style={{ background: "#2C1810" }}>
                      {SEASON_INFO[s].emoji} {SEASON_INFO[s].label}
                    </option>
                  ),
                )}
              </select>

              {/* Year picker */}
              <select
                value={selectedYear}
                onChange={(e) => setQuickJumpYear(Number(e.target.value))}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: TEXT_CREAM,
                  fontFamily: SERIF,
                  fontSize: 14,
                  cursor: "pointer",
                }}
                data-ocid="journal.quick_jump.year.select"
              >
                {allYears.map((y) => (
                  <option key={y} value={y} style={{ background: "#2C1810" }}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <AnimatePresence>
              {jumping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    textAlign: "center",
                    fontFamily: SERIF,
                    fontSize: 13,
                    color: GOLD,
                    fontStyle: "italic",
                    marginBottom: 12,
                  }}
                >
                  Turning pages...
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleQuickJump}
              disabled={jumping}
              style={{
                width: "100%",
                background: jumping
                  ? "rgba(232,200,128,0.15)"
                  : "rgba(232,200,128,0.2)",
                border: "1px solid rgba(232,200,128,0.35)",
                borderRadius: 8,
                padding: "11px",
                color: GOLD,
                fontFamily: SERIF,
                fontSize: 14,
                fontStyle: "italic",
                cursor: jumping ? "not-allowed" : "pointer",
              }}
              data-ocid="journal.quick_jump.go.button"
            >
              Go →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: "16px 16px 12px",
          borderBottom: `1px solid ${CARD_BORDER}`,
          background: "rgba(26,15,8,0.95)",
        }}
      >
        <button
          type="button"
          onClick={nav.level === "years" ? onClose : goBack}
          style={{
            background: "none",
            border: "none",
            color: TEXT_MUTED,
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          data-ocid="journal.seasonal_navigator.back.button"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          className="flex flex-col items-center"
          style={{ flex: 1, margin: "0 8px" }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 16,
              fontWeight: 600,
              color: TEXT_CREAM,
              textAlign: "center",
            }}
          >
            {getHeaderTitle()}
          </span>
          {getHeaderSubtitle() && (
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 11,
                color: TEXT_MUTED,
                fontStyle: "italic",
              }}
            >
              {getHeaderSubtitle()}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setQuickJumpOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: TEXT_MUTED,
            cursor: "pointer",
            padding: 4,
          }}
          data-ocid="journal.seasonal_navigator.quick_jump.button"
        >
          <Zap size={18} />
        </button>
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={
            nav.level +
            (nav.year ?? "") +
            (nav.season ?? "") +
            (nav.month ?? "") +
            (nav.selectedDate?.toISOString() ?? "")
          }
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {nav.level === "years" && renderYearView()}
          {nav.level === "months" && renderMonthView()}
          {nav.level === "weeks" && renderWeekView()}
          {nav.level === "day" && renderDayView()}
          {nav.level === "season_cover" && renderSeasonCover()}
          {nav.level === "reflection" && renderReflection()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeasonSubCard({
  seasonData,
  onTap,
}: {
  seasonData: SeasonData;
  onTap: () => void;
}) {
  const info = SEASON_INFO[seasonData.season];

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left"
      style={{
        background: `linear-gradient(135deg, ${info.gradientFrom}18, ${info.gradientTo}22)`,
        border: `1px solid ${info.color}30`,
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
      }}
      data-ocid={`journal.season.${seasonData.season.toLowerCase()}_${seasonData.year}.button`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 18 }}>{info.emoji}</span>
        <span
          style={{
            fontFamily: SERIF,
            fontSize: 15,
            fontWeight: 600,
            color: TEXT_CREAM,
          }}
        >
          {seasonData.label}
        </span>
      </div>

      <p
        style={{
          fontFamily: SERIF,
          fontSize: 11,
          color: TEXT_MUTED,
          marginBottom: 8,
        }}
      >
        {info.months.join(" · ")}
      </p>

      {seasonData.isEmpty ? (
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 12,
            color: TEXT_MUTED,
            fontStyle: "italic",
            opacity: 0.6,
          }}
        >
          No entries this season. That is its own story.
        </p>
      ) : (
        <>
          <EmotionalColorStrip pages={seasonData.pages} />

          <div className="flex items-center gap-2 mt-2">
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 11,
                color: TEXT_MUTED,
              }}
            >
              {seasonData.pages.length} pages
            </span>
            {seasonData.dominantEmotion && (
              <>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: getEmotionColor(seasonData.dominantEmotion),
                  }}
                />
                <span
                  style={{
                    fontFamily: SERIF,
                    fontSize: 11,
                    color: TEXT_MUTED,
                    fontStyle: "italic",
                  }}
                >
                  {seasonData.dominantEmotion.replace(/_/g, " ")}
                </span>
              </>
            )}
          </div>

          {seasonData.firstEntryPreview && (
            <p
              style={{
                fontFamily: SERIF,
                fontSize: 12,
                color: TEXT_CREAM,
                opacity: 0.65,
                fontStyle: "italic",
                marginTop: 8,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
              }}
            >
              "{seasonData.firstEntryPreview}"
            </p>
          )}
        </>
      )}
    </button>
  );
}

function MonthCard({
  monthData,
  onTap,
}: {
  monthData: MonthData;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left"
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
      }}
      data-ocid={`journal.month.${monthData.monthName.toLowerCase()}_${monthData.year}.button`}
    >
      <p
        style={{
          fontFamily: SERIF,
          fontSize: 17,
          fontWeight: 600,
          color: TEXT_CREAM,
          marginBottom: 10,
        }}
      >
        {monthData.monthName} {monthData.year}
      </p>

      <WeekBlocks weeks={monthData.weeks} />

      <div className="flex items-center gap-2 mt-3">
        <span
          style={{
            fontFamily: SERIF,
            fontSize: 12,
            color: TEXT_MUTED,
          }}
        >
          {monthData.pages.length} entries
        </span>
        <div className="flex gap-1.5">
          {monthData.topEmotions.slice(0, 5).map((e) => (
            <div
              key={e}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: getEmotionColor(e),
              }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

function WeekCard({
  weekData,
  onTapDay,
  onTapWeek,
}: {
  weekData: WeekData;
  onTapDay: (date: Date) => void;
  onTapWeek: () => void;
}) {
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 14,
        padding: "16px 18px",
      }}
      data-ocid={`journal.week.week_${weekData.weekNumber}.card`}
    >
      <button
        type="button"
        onClick={onTapWeek}
        className="w-full text-left"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 14,
            fontWeight: 600,
            color: TEXT_CREAM,
            marginBottom: 2,
          }}
        >
          {weekData.weekLabel} · {formatDateShort(weekData.startDate)} –{" "}
          {formatDateShort(weekData.endDate)}
        </p>
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 11,
            color: TEXT_MUTED,
            marginBottom: 14,
          }}
        >
          {weekData.pages.length} entries this week
        </p>
      </button>

      {/* Day circles */}
      <div className="flex justify-between items-end">
        {weekData.days.map((day, di) => (
          <div
            key={`day-${day.date.toISOString()}`}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 10,
                color: TEXT_MUTED,
              }}
            >
              {DAY_LABELS[di]}
            </span>
            {day.pages.length > 0 ? (
              <button
                type="button"
                onClick={() => onTapDay(day.date)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
                data-ocid={`journal.week.day_${di + 1}.button`}
              >
                <DayCircle
                  emotions={day.dominantEmotions}
                  hasEntries={true}
                  size={36}
                />
              </button>
            ) : (
              <DayCircle emotions={[]} hasEntries={false} size={36} />
            )}
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 9,
                color: TEXT_MUTED,
                opacity: 0.6,
              }}
            >
              {day.dayOfMonth}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
