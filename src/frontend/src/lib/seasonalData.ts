// ─── Seasonal Data Utilities ────────────────────────────────────────────────
// Provides all data transformation needed for the Seasonal Navigator.

import { EMOTION_AURA_COLORS, type JournalPage } from "./journalData";

export type Season = "SPRING" | "SUMMER" | "FALL" | "WINTER";

export interface SeasonInfo {
  season: Season;
  label: string;
  emoji: string;
  months: string[];
  monthNumbers: number[];
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const SEASON_INFO: Record<Season, SeasonInfo> = {
  SPRING: {
    season: "SPRING",
    label: "Spring",
    emoji: "🌸",
    months: ["March", "April", "May"],
    monthNumbers: [2, 3, 4],
    color: "#8BC4A8",
    gradientFrom: "#d4f0e0",
    gradientTo: "#f8e8ee",
  },
  SUMMER: {
    season: "SUMMER",
    label: "Summer",
    emoji: "☀️",
    months: ["June", "July", "August"],
    monthNumbers: [5, 6, 7],
    color: "#F5D080",
    gradientFrom: "#fef3c7",
    gradientTo: "#fde68a",
  },
  FALL: {
    season: "FALL",
    label: "Fall",
    emoji: "🍂",
    months: ["September", "October", "November"],
    monthNumbers: [8, 9, 10],
    color: "#E0844A",
    gradientFrom: "#fde8c8",
    gradientTo: "#c47820",
  },
  WINTER: {
    season: "WINTER",
    label: "Winter",
    emoji: "❄️",
    months: ["December", "January", "February"],
    monthNumbers: [11, 0, 1],
    color: "#6A8CAA",
    gradientFrom: "#d4e8f8",
    gradientTo: "#3a5a7a",
  },
};

export interface DayData {
  date: Date;
  dayOfMonth: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  pages: JournalPage[];
  dominantEmotions: string[]; // up to 4 most common emotion types
  dominantColor: string;
}

export interface WeekData {
  weekNumber: number; // 1,2,3,4,5
  weekLabel: string;
  startDate: Date;
  endDate: Date;
  days: DayData[]; // 7 days Mon-Sun
  pages: JournalPage[];
  dominantEmotion: string;
  dominantColor: string;
}

export interface MonthData {
  month: number; // 0-11
  year: number;
  monthName: string;
  weeks: WeekData[];
  pages: JournalPage[];
  dominantEmotion: string;
  topEmotions: string[]; // up to 5
}

export interface SeasonData {
  season: Season;
  year: number;
  label: string; // "Spring 2024"
  months: MonthData[];
  pages: JournalPage[];
  dominantEmotion: string;
  firstEntryPreview: string;
  isEmpty: boolean;
}

export interface YearData {
  year: number;
  seasons: SeasonData[];
  pages: JournalPage[];
  dominantEmotion: string;
  totalPages: number;
  seasonDensities: Record<Season, number>; // 0.0 to 1.0
}

// ─── Season detection ────────────────────────────────────────────────────────

function getSeasonForMonth(
  month: number,
  hemisphere: "NORTHERN" | "SOUTHERN",
): Season {
  // Northern: Spring=Mar-May(2-4), Summer=Jun-Aug(5-7), Fall=Sep-Nov(8-10), Winter=Dec-Feb(11,0,1)
  const northMap: Record<number, Season> = {
    0: "WINTER",
    1: "WINTER",
    2: "SPRING",
    3: "SPRING",
    4: "SPRING",
    5: "SUMMER",
    6: "SUMMER",
    7: "SUMMER",
    8: "FALL",
    9: "FALL",
    10: "FALL",
    11: "WINTER",
  };
  const southFlip: Record<Season, Season> = {
    SPRING: "FALL",
    FALL: "SPRING",
    SUMMER: "WINTER",
    WINTER: "SUMMER",
  };
  const northSeason = northMap[month];
  return hemisphere === "SOUTHERN" ? southFlip[northSeason] : northSeason;
}

function getSeasonYear(date: Date, season: Season): number {
  // Winter spanning Dec → assign to the year it starts in
  // e.g. Dec 2023 is part of Winter 2023, Jan/Feb 2024 is also Winter 2023
  if (season === "WINTER" && date.getMonth() === 11) {
    return date.getFullYear();
  }
  // For Jan/Feb winter, keep actual year (so Winter 2023 covers Dec 2023 + Jan/Feb 2024)
  // Actually to keep it simple and consistent, we group by the calendar year of the date
  return date.getFullYear();
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ─── Enrich pages ────────────────────────────────────────────────────────────

export function enrichPagesWithSeasonalData(
  pages: JournalPage[],
  hemisphere: "NORTHERN" | "SOUTHERN" = "NORTHERN",
): (JournalPage & {
  season: Season;
  seasonYear: number;
  weekOfYear: number;
})[] {
  return pages.map((p) => {
    const month = p.date.getMonth();
    const season = getSeasonForMonth(month, hemisphere);
    const seasonYear = getSeasonYear(p.date, season);
    const weekOfYear = getISOWeek(p.date);
    return { ...p, season, seasonYear, weekOfYear };
  });
}

// ─── Dominant emotion helpers ────────────────────────────────────────────────

function getDominantEmotion(pages: JournalPage[]): string {
  const counts: Record<string, number> = {};
  for (const p of pages) {
    const e = p.emotionType;
    if (e && e !== "default" && e !== "confession" && e !== "apology") {
      counts[e] = (counts[e] ?? 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "reflective";
}

function getTopEmotions(pages: JournalPage[], limit = 5): string[] {
  const counts: Record<string, number> = {};
  for (const p of pages) {
    const e = p.emotionType;
    if (e && e !== "default") counts[e] = (counts[e] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([e]) => e);
}

function getEmotionColor(emotion: string): string {
  return (
    EMOTION_AURA_COLORS[emotion] ?? EMOTION_AURA_COLORS.default ?? "#E8E0D8"
  );
}

// ─── Week building ───────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function buildWeeksForMonth(
  month: number,
  year: number,
  pages: JournalPage[],
): WeekData[] {
  // Get first Monday on or before the 1st of the month
  const firstDay = new Date(year, month, 1);
  // ISO week starts Monday (1), Sunday = 7
  const dayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(year, month, 1 + mondayOffset);

  const weeks: WeekData[] = [];
  let current = new Date(weekStart);
  let weekNum = 1;

  while (current.getMonth() <= month || current.getFullYear() < year) {
    const end = new Date(current);
    end.setDate(end.getDate() + 6);

    // Only include week if it overlaps with the month
    if (end.getMonth() < month && end.getFullYear() <= year) {
      current = new Date(current);
      current.setDate(current.getDate() + 7);
      weekNum++;
      continue;
    }
    if (
      current.getFullYear() > year ||
      (current.getFullYear() === year && current.getMonth() > month)
    ) {
      break;
    }

    const weekPages = pages.filter((p) => {
      const d = p.date;
      return d >= current && d <= end;
    });

    // Build 7 day data objects (Mon=0 to Sun=6)
    const days: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(current);
      dayDate.setDate(dayDate.getDate() + i);
      const dayPages = weekPages.filter(
        (p) =>
          p.date.getFullYear() === dayDate.getFullYear() &&
          p.date.getMonth() === dayDate.getMonth() &&
          p.date.getDate() === dayDate.getDate(),
      );
      const dominantEmotions = getTopEmotions(dayPages, 4);
      days.push({
        date: dayDate,
        dayOfMonth: dayDate.getDate(),
        dayOfWeek: dayDate.getDay(),
        pages: dayPages,
        dominantEmotions,
        dominantColor: getEmotionColor(dominantEmotions[0] ?? "default"),
      });
    }

    const domEmotion = getDominantEmotion(weekPages);
    weeks.push({
      weekNumber: weekNum,
      weekLabel: `Week ${weekNum}`,
      startDate: new Date(current),
      endDate: end,
      days,
      pages: weekPages,
      dominantEmotion: domEmotion,
      dominantColor: getEmotionColor(domEmotion),
    });

    current = new Date(current);
    current.setDate(current.getDate() + 7);
    weekNum++;

    // Safety: don't go past 6 weeks
    if (weekNum > 6) break;
  }

  return weeks;
}

// ─── Main index builder ──────────────────────────────────────────────────────

export function buildSeasonalIndex(
  pages: JournalPage[],
  hemisphere: "NORTHERN" | "SOUTHERN" = "NORTHERN",
): YearData[] {
  if (pages.length === 0) return [];

  const enriched = enrichPagesWithSeasonalData(pages, hemisphere);

  // Collect all unique years
  const yearSet = new Set<number>();
  for (const p of enriched) yearSet.add(p.date.getFullYear());
  const years = Array.from(yearSet).sort((a, b) => b - a); // most recent first

  const seasonOrder: Season[] = ["SPRING", "SUMMER", "FALL", "WINTER"];

  return years.map((year) => {
    const yearPages = enriched.filter((p) => p.date.getFullYear() === year);

    const seasons: SeasonData[] = seasonOrder.map((season) => {
      const info = SEASON_INFO[season];
      const seasonPages = enriched.filter(
        (p) => p.season === season && p.seasonYear === year,
      );
      const isEmpty = seasonPages.length === 0;

      // Build months
      const months: MonthData[] = info.monthNumbers.map((monthNum) => {
        const monthPages = seasonPages.filter(
          (p) =>
            p.date.getMonth() === monthNum && p.date.getFullYear() === year,
        );
        const weeks = buildWeeksForMonth(monthNum, year, monthPages);
        return {
          month: monthNum,
          year,
          monthName: MONTH_NAMES[monthNum],
          weeks,
          pages: monthPages,
          dominantEmotion: getDominantEmotion(monthPages),
          topEmotions: getTopEmotions(monthPages, 5),
        };
      });

      const domEmotion = getDominantEmotion(seasonPages);
      const firstPreview = seasonPages[0]?.contentPreview?.slice(0, 80) ?? "";

      return {
        season,
        year,
        label: `${info.label} ${year}`,
        months,
        pages: seasonPages,
        dominantEmotion: domEmotion,
        firstEntryPreview: firstPreview,
        isEmpty,
      };
    });

    // Season densities
    const counts = seasonOrder.map(
      (s) => seasons.find((sd) => sd.season === s)?.pages.length ?? 0,
    );
    const maxCount = Math.max(...counts, 1);
    const seasonDensities = Object.fromEntries(
      seasonOrder.map((s, i) => [s, counts[i] / maxCount]),
    ) as Record<Season, number>;

    const domEmotion = getDominantEmotion(yearPages);

    return {
      year,
      seasons,
      pages: yearPages,
      dominantEmotion: domEmotion,
      totalPages: yearPages.length,
      seasonDensities,
    };
  });
}

// ─── Seasonal reflection generator ──────────────────────────────────────────

export function generateSeasonalReflection(
  seasonData: SeasonData,
  userName: string,
): string {
  const info = SEASON_INFO[seasonData.season];
  const { pages, dominantEmotion, months, year } = seasonData;
  const total = pages.length;

  // Find heaviest month (most pages with negative emotions)
  const negativeEmotions = [
    "stressed",
    "sad",
    "frustrated",
    "anxious",
    "lonely",
    "numb",
  ];
  const heaviestMonth = months.reduce(
    (best, m) => {
      const negCount = m.pages.filter((p) =>
        negativeEmotions.includes(p.emotionType),
      ).length;
      return negCount > best.count
        ? { name: m.monthName, count: negCount }
        : best;
    },
    { name: months[0]?.monthName ?? info.months[0], count: 0 },
  );

  // Positive count
  const positiveEmotions = [
    "grateful",
    "calm",
    "hopeful",
    "captured_joy",
    "achievement",
    "love_letter",
  ];
  const positiveCount = pages.filter((p) =>
    positiveEmotions.includes(p.emotionType),
  ).length;

  // Find a notable positive entry
  const positiveEntry = pages.find((p) =>
    positiveEmotions.includes(p.emotionType),
  );

  // Last month observation
  const lastMonth = months[months.length - 1];
  const lastMonthEmotion = lastMonth?.dominantEmotion ?? "reflective";
  const midMonthEmotion = months[0]?.dominantEmotion ?? dominantEmotion;
  const shifted = lastMonthEmotion !== midMonthEmotion;

  const greeting = userName && userName !== "You" ? userName : "you";

  const para1 = `That ${info.label.toLowerCase()} you brought ${total} thing${total !== 1 ? "s" : ""} to these pages.\n\nYou felt ${dominantEmotion.replace(/_/g, " ")} more than anything else.${heaviestMonth.count > 0 ? ` ${heaviestMonth.name} seemed heaviest.` : ""}`;

  const para2 =
    positiveCount > 0
      ? `There were also ${positiveCount} moment${positiveCount !== 1 ? "s" : ""} of ${positiveEntry ? positiveEntry.emotionType.replace(/_/g, " ") : "lightness"}.${positiveEntry?.contentPreview ? `\n\nOn ${positiveEntry.dateFormatted} you wrote something that seemed to matter —\n"${positiveEntry.contentPreview.slice(0, 80)}"` : ""}`
      : "Even in the quiet, you kept showing up. That matters.";

  const para3 = shifted
    ? `By ${lastMonth?.monthName ?? info.months[2]} something seemed to change. The entries grew ${lastMonthEmotion === "grateful" || lastMonthEmotion === "hopeful" || lastMonthEmotion === "calm" ? "lighter" : "different"}. You might not have noticed at the time. The pages did.`
    : `This ${info.label.toLowerCase()} held a certain consistency. You brought the same honest voice to every page. That steadiness is its own kind of strength.`;

  const para4 =
    "Veil was here for all of it.\nEvery page of this season is yours — exactly as you lived it.";

  return [
    `Dear ${greeting},`,
    para1,
    para2,
    para3,
    para4,
    `With care,\nVeil\n${info.label} ${year}`,
  ].join("\n\n");
}

// ─── Date formatting helpers ─────────────────────────────────────────────────

export { MONTH_NAMES, getEmotionColor };
