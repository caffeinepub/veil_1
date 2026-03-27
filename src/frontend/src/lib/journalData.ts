// ─── Journal Data Aggregation Layer ─────────────────────────────────────────────
// Converts raw backend data into JournalPage objects sorted chronologically.

import type {
  ApologyEntry,
  CompanionDump,
  EmotionEntry,
  JournalEntry,
} from "../backend.d";

// Backend inline confession type
type ConfessionRaw = {
  id: string;
  mode: string;
  content: string;
  createdAt: bigint;
};

export type PageType =
  | "EMOTION_CHECKIN"
  | "COMPANION_DUMP_VOICE"
  | "COMPANION_DUMP_TEXT"
  | "COMPANION_DUMP_SILENT"
  | "LOVE_LETTER"
  | "APOLOGY"
  | "CONFESSION"
  | "JOURNAL_ENTRY"
  | "CAPTURED_JOY_WRITTEN"
  | "CAPTURED_JOY_VOICE"
  | "ONE_TRUE_THING"
  | "AGENCY_ANCHOR"
  | "MILESTONE_PAGE"
  | "MONTHLY_LETTER"
  | "VOICE_JOURNAL"
  | "TUCKED_LETTER"
  | "DEDICATION";

export interface JournalPage {
  id: string;
  pageNumber: number;
  pageType: PageType;
  emotionType: string;
  pageColor: string;
  content: string;
  contentPreview: string;
  date: Date;
  dateFormatted: string;
  emoji?: string;
  letterType?: string;
  deliveryStatus?: string;
  confessionMode?: string;
  voiceDurationSeconds?: number;
  milestoneType?: string;
  isMilestone?: boolean;
  isMonthlyLetter?: boolean;
  visibility?: string;
  pageTypeLabel: string;
  pageTypeEmoji: string;
  season?: "SPRING" | "SUMMER" | "FALL" | "WINTER";
  seasonYear?: number;
  weekOfYear?: number;
  // v1.2 extensions
  voiceWaveformPoints?: number[];
  voiceAudioDataUrl?: string;
  voiceTitle?: string;
  tuckedLetterRecipient?: string;
  tuckedLetterCondition?: string;
}

export const EMOTION_AURA_COLORS: Record<string, string> = {
  grateful: "#F9E4A0",
  calm: "#A8D8EA",
  stressed: "#F4C28A",
  sad: "#C3B8D8",
  frustrated: "#E8A598",
  reflective: "#B8C4D4",
  anxious: "#C8D4B8",
  lonely: "#B8C8D8",
  numb: "#D0D0D0",
  hopeful: "#A8D8B8",
  love_letter: "#FFD8E8",
  apology: "#D8D0F8",
  confession: "#C8D0D8",
  captured_joy: "#F9E8A0",
  captured_joy_letter: "#F9E8A0",
  captured_joy_voice: "#F9E8A0",
  achievement: "#F5D080",
  journal_entry: "#E8E4DC",
  voice_journal: "#D4E8C8",
  tucked_letter: "#EAD8C0",
  default: "#E8E0D8",
};

function getPageColor(emotionType: string, pageType: PageType): string {
  if (pageType === "APOLOGY") return EMOTION_AURA_COLORS.apology;
  if (pageType === "CONFESSION") return EMOTION_AURA_COLORS.confession;
  if (pageType === "LOVE_LETTER") return EMOTION_AURA_COLORS.love_letter;
  if (pageType === "CAPTURED_JOY_WRITTEN" || pageType === "CAPTURED_JOY_VOICE")
    return EMOTION_AURA_COLORS.captured_joy;
  if (pageType === "MILESTONE_PAGE" || pageType === "MONTHLY_LETTER")
    return EMOTION_AURA_COLORS.achievement;
  if (pageType === "JOURNAL_ENTRY") return EMOTION_AURA_COLORS.journal_entry;
  if (pageType === "VOICE_JOURNAL") return EMOTION_AURA_COLORS.voice_journal;
  if (pageType === "TUCKED_LETTER") return EMOTION_AURA_COLORS.tucked_letter;
  if (pageType === "DEDICATION") return "#F5EFE4";
  const key = emotionType?.toLowerCase();
  return EMOTION_AURA_COLORS[key] ?? EMOTION_AURA_COLORS.default;
}

const PAGE_TYPE_META: Record<PageType, { label: string; emoji: string }> = {
  EMOTION_CHECKIN: { label: "Emotion Check-In", emoji: "📝" },
  COMPANION_DUMP_VOICE: { label: "Daily Dump", emoji: "🌊" },
  COMPANION_DUMP_TEXT: { label: "Daily Dump", emoji: "🌊" },
  COMPANION_DUMP_SILENT: { label: "Daily Dump", emoji: "🌊" },
  LOVE_LETTER: { label: "Love Letter", emoji: "💌" },
  APOLOGY: { label: "Apology", emoji: "🕊" },
  CONFESSION: { label: "Confession", emoji: "🌿" },
  JOURNAL_ENTRY: { label: "Journal Entry", emoji: "📖" },
  CAPTURED_JOY_WRITTEN: { label: "Captured Joy", emoji: "☀️" },
  CAPTURED_JOY_VOICE: { label: "Captured Joy", emoji: "☀️" },
  ONE_TRUE_THING: { label: "Something True", emoji: "🌱" },
  AGENCY_ANCHOR: { label: "What I Chose", emoji: "🎯" },
  MILESTONE_PAGE: { label: "Milestone", emoji: "✨" },
  MONTHLY_LETTER: { label: "Letter from Veil", emoji: "💙" },
  VOICE_JOURNAL: { label: "Voice Entry", emoji: "🎤" },
  TUCKED_LETTER: { label: "Letter for Later", emoji: "📧" },
  DEDICATION: { label: "Dedication", emoji: "🌹" },
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function bigintToDate(ts: bigint): Date {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms);
}

function preview(text: string, len = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? `${clean.slice(0, len)}…` : clean;
}

export interface AllJournalData {
  journalEntries: JournalEntry[];
  emotionEntries: EmotionEntry[];
  companionDumps: CompanionDump[];
  apologies: ApologyEntry[];
  unsentApologies: ApologyEntry[];
  confessions: ConfessionRaw[];
}

export function buildJournalPages(data: AllJournalData): JournalPage[] {
  const raw: Omit<JournalPage, "pageNumber">[] = [];

  // ── Journal Entries ────────────────────────────────────────────────────────────────────
  for (const e of data.journalEntries) {
    const date = bigintToDate(e.timestamp);
    raw.push({
      id: `je-${e.id}`,
      pageType: "JOURNAL_ENTRY",
      emotionType: e.mood ?? "default",
      pageColor: getPageColor(e.mood ?? "default", "JOURNAL_ENTRY"),
      content: [e.title, e.body].filter(Boolean).join("\n\n"),
      contentPreview: preview(e.body || e.title),
      date,
      dateFormatted: formatDate(date),
      emoji: "📖",
      visibility: "ONLY_ME",
      pageTypeLabel: "Journal Entry",
      pageTypeEmoji: "📖",
    });
  }

  // ── Emotion Check-Ins ──────────────────────────────────────────────────────────────────────────
  for (const e of data.emotionEntries) {
    const date = bigintToDate(e.createdAt);
    const isCapturedJoy =
      e.source === "captured_joy" ||
      e.emotionType?.toLowerCase().includes("joy");
    const isOneTrueThing = e.source === "one_true_thing";
    const isAgencyAnchor = e.source === "agency_anchor";

    let pageType: PageType = "EMOTION_CHECKIN";
    if (isCapturedJoy) pageType = "CAPTURED_JOY_WRITTEN";
    else if (isOneTrueThing) pageType = "ONE_TRUE_THING";
    else if (isAgencyAnchor) pageType = "AGENCY_ANCHOR";

    const text = e.textReflection ?? "";
    raw.push({
      id: `em-${e.id}`,
      pageType,
      emotionType: e.emotionType,
      pageColor: getPageColor(e.emotionType, pageType),
      content: text,
      contentPreview: preview(text || e.emotionLabel),
      date,
      dateFormatted: formatDate(date),
      emoji: e.emoji,
      visibility: e.visibilityLevel,
      voiceDurationSeconds: e.voiceDurationSeconds
        ? Number(e.voiceDurationSeconds)
        : undefined,
      pageTypeLabel: PAGE_TYPE_META[pageType].label,
      pageTypeEmoji: PAGE_TYPE_META[pageType].emoji,
    });
  }

  // ── Companion Dumps ──────────────────────────────────────────────────────────────────────────
  for (const d of data.companionDumps) {
    const date = bigintToDate(d.createdAt);
    let pageType: PageType = "COMPANION_DUMP_TEXT";
    if (d.contentType === "voice") pageType = "COMPANION_DUMP_VOICE";
    else if (d.contentType === "silent") pageType = "COMPANION_DUMP_SILENT";

    let content = "";
    if (d.contentType === "voice") {
      const mins = d.voiceDurationSeconds
        ? Math.ceil(Number(d.voiceDurationSeconds) / 60)
        : 1;
      content = `You spoke to Veil for ${mins} ${mins === 1 ? "minute" : "minutes"}.`;
    } else if (d.contentType === "silent") {
      content = "You showed up.";
    } else {
      content = d.textContent ?? "";
    }

    raw.push({
      id: `cd-${d.id}`,
      pageType,
      emotionType: "default",
      pageColor: getPageColor("default", pageType),
      content,
      contentPreview: preview(content),
      date,
      dateFormatted: formatDate(date),
      voiceDurationSeconds: d.voiceDurationSeconds
        ? Number(d.voiceDurationSeconds)
        : undefined,
      visibility: "ONLY_ME",
      pageTypeLabel: PAGE_TYPE_META[pageType].label,
      pageTypeEmoji: "🌊",
    });
  }

  // ── Apologies ────────────────────────────────────────────────────────────────────────────────────────
  const apologyIds = new Set<string>();
  for (const a of [...data.apologies, ...data.unsentApologies]) {
    if (apologyIds.has(a.id)) continue;
    apologyIds.add(a.id);
    const date = bigintToDate(a.createdAt);
    raw.push({
      id: `ap-${a.id}`,
      pageType: "APOLOGY",
      emotionType: a.emotionType ?? "apology",
      pageColor: EMOTION_AURA_COLORS.apology,
      content: a.content,
      contentPreview: preview(a.content),
      date,
      dateFormatted: formatDate(date),
      deliveryStatus: a.status,
      visibility: "ONLY_ME",
      pageTypeLabel: "Apology",
      pageTypeEmoji: "🕊",
    });
  }

  // ── Confessions ──────────────────────────────────────────────────────────────────────────
  for (const c of data.confessions) {
    const date = bigintToDate(c.createdAt);
    raw.push({
      id: `cf-${c.id}`,
      pageType: "CONFESSION",
      emotionType: "confession",
      pageColor: EMOTION_AURA_COLORS.confession,
      content: c.content,
      contentPreview: preview(c.content),
      date,
      dateFormatted: formatDate(date),
      confessionMode: c.mode,
      visibility: "ONLY_ME",
      pageTypeLabel: "Confession",
      pageTypeEmoji: "🌿",
    });
  }

  // ── Local Storage: Captured Joy ──────────────────────────────────────────────────────────────────────
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("veil-captured-joy-")) continue;
      const raw2 = localStorage.getItem(k);
      if (!raw2) continue;
      try {
        const item = JSON.parse(raw2);
        const date = new Date(item.createdAt ?? Date.now());
        const isVoice = item.type === "voice";
        const pageType: PageType = isVoice
          ? "CAPTURED_JOY_VOICE"
          : "CAPTURED_JOY_WRITTEN";
        raw.push({
          id: `ls-${k}`,
          pageType,
          emotionType: item.emotionType ?? "captured_joy",
          pageColor: EMOTION_AURA_COLORS.captured_joy,
          content: item.content ?? "",
          contentPreview: preview(item.content ?? "Joy captured."),
          date,
          dateFormatted: formatDate(date),
          visibility: "ONLY_ME",
          pageTypeLabel: "Captured Joy",
          pageTypeEmoji: "☀️",
        });
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  // ── Sort oldest → newest ──────────────────────────────────────────────────────────────────────────
  raw.sort((a, b) => a.date.getTime() - b.date.getTime());

  // ── Assign page numbers ──────────────────────────────────────────────────────────────────────────
  return raw.map((p, i) => ({ ...p, pageNumber: i + 1 }));
}

/** Generate a monthly summary letter from Veil */
export function generateMonthlyLetter(
  pages: JournalPage[],
  month: number,
  year: number,
  userName: string,
): string {
  const monthName = new Date(year, month).toLocaleString("en-US", {
    month: "long",
  });
  const monthPages = pages.filter(
    (p) => p.date.getMonth() === month && p.date.getFullYear() === year,
  );
  if (monthPages.length === 0) return "";

  const emotionCounts: Record<string, number> = {};
  for (const p of monthPages) {
    if (p.emotionType && p.emotionType !== "default") {
      emotionCounts[p.emotionType] = (emotionCounts[p.emotionType] ?? 0) + 1;
    }
  }
  const dominant =
    Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "something";
  const firstPreview = monthPages[0]?.contentPreview ?? "";
  const positiveCount = monthPages.filter((p) =>
    ["grateful", "calm", "hopeful", "captured_joy", "achievement"].includes(
      p.emotionType,
    ),
  ).length;

  return `Dear ${userName},\n\nIn ${monthName} you brought ${monthPages.length} things to these pages.\n\nYou carried ${dominant.replace(/_/g, " ")} more than anything else.${firstPreview ? `\n\nOn ${monthPages[0].dateFormatted} you wrote something that seemed important:\n"${firstPreview}"` : ""}${positiveCount > 0 ? `\n\nIn ${monthName} you also captured ${positiveCount} moment${positiveCount > 1 ? "s" : ""} of light.` : ""}\n\nVeil was here for all of it.\n\nWith care,\nVeil`;
}
export interface MilestoneDef {
  id: string;
  type: string;
  date: Date;
  text: string;
}

/** Check for milestone pages that should be auto-generated */
export function checkMilestones(pages: JournalPage[]): MilestoneDef[] {
  if (pages.length === 0) return [];
  const milestones: MilestoneDef[] = [];
  const first = pages[0].date;
  const now = new Date();
  const diffMs = now.getTime() - first.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (pages.length >= 1) {
    milestones.push({
      id: "first_entry",
      type: "FIRST_ENTRY",
      date: first,
      text: `This is where it began.\n${formatDate(first)}\n\nYou opened Veil for the first time and brought something here.\nThis page marks that moment.`,
    });
  }
  if (diffDays >= 30) {
    milestones.push({
      id: "one_month",
      type: "ONE_MONTH",
      date: new Date(first.getTime() + 30 * 24 * 60 * 60 * 1000),
      text: "One month of pages.\n\nYou showed up, again and again.\nThat is not nothing.\nThat is everything.",
    });
  }
  if (diffDays >= 90) {
    milestones.push({
      id: "three_months",
      type: "THREE_MONTHS",
      date: new Date(first.getTime() + 90 * 24 * 60 * 60 * 1000),
      text: "Three months.\n\nLook at what you have built here.\nPage after page, honest and present.\n\nThat took something real.",
    });
  }
  if (diffDays >= 180) {
    milestones.push({
      id: "six_months",
      type: "SIX_MONTHS",
      date: new Date(first.getTime() + 180 * 24 * 60 * 60 * 1000),
      text: "Six months.\n\nHalf a year of your emotional life, lived out loud.\nEvery heavy page.\nEvery golden page.\n\nAll of it, real. All of it, yours.",
    });
  }
  if (diffDays >= 365) {
    milestones.push({
      id: "one_year",
      type: "ONE_YEAR",
      date: new Date(first.getTime() + 365 * 24 * 60 * 60 * 1000),
      text: "A year of pages.\n\nEverything you carried.\nEverything you felt.\nEverything you said when you needed to say it.\n\nIt is all here.\n\nThis is your life — as you actually lived it.\n\nThat is not nothing.\n\nThat is everything.",
    });
  }
  return milestones;
}

// ─── Seasonal enrichment (re-exported from seasonalData) ──────────────────────────────────────────────────
// Added for Version 1.1 — Seasonal Navigation Architecture

type SeasonType = "SPRING" | "SUMMER" | "FALL" | "WINTER";

function getSeasonForMonthLocal(
  month: number,
  hemisphere: "NORTHERN" | "SOUTHERN",
): SeasonType {
  const northMap: Record<number, SeasonType> = {
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
  const southFlip: Record<SeasonType, SeasonType> = {
    SPRING: "FALL",
    FALL: "SPRING",
    SUMMER: "WINTER",
    WINTER: "SUMMER",
  };
  const north = northMap[month];
  return hemisphere === "SOUTHERN" ? southFlip[north] : north;
}

function getISOWeekLocal(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function enrichPagesWithSeasonalData(
  pages: JournalPage[],
  hemisphere: "NORTHERN" | "SOUTHERN" = "NORTHERN",
): JournalPage[] {
  return pages.map((p) => {
    const month = p.date.getMonth();
    const season = getSeasonForMonthLocal(month, hemisphere);
    const seasonYear = p.date.getFullYear();
    const weekOfYear = getISOWeekLocal(p.date);
    return { ...p, season, seasonYear, weekOfYear };
  });
}
