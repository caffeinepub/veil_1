// ═══════════════════════════════════════════════════════════════
// VEIL — LAYER 4: EMOTIONAL INTELLIGENCE ENGINE
// Module 1: Pattern Analyzer
// Module 2: Emotional Direction Calculator
// Module 3: Support Presence Analyzer
// Module 4: Insight Generator
// ═══════════════════════════════════════════════════════════════

import { EmotionCategory, emotionCategory } from "./emotionalBalance";

export interface UEDLEvent {
  id: string;
  userId: string;
  eventType:
    | "CHECK_IN"
    | "DUMP"
    | "JOURNAL"
    | "LETTER"
    | "CONFESSION"
    | "APOLOGY"
    | "TURNING_POINT"
    | "TUCKED_LETTER"
    | "REFLECTION"
    | "SUPPORT_GIVEN"
    | "SUPPORT_RECEIVED";
  emotionType: string;
  emotionWeight: "PROFOUND" | "HIGH" | "MEDIUM" | "LIGHT";
  dayOfWeek: number; // 0=Sun 6=Sat
  createdAt: number; // unix ms
}

export type EmotionalDirection =
  | "PREDOMINANTLY_POSITIVE"
  | "PREDOMINANTLY_DIFFICULT"
  | "BALANCED"
  | "SHIFTING_POSITIVE"
  | "SHIFTING_DIFFICULT";

export type PatternType =
  | "RECURRING"
  | "TIME_BASED"
  | "TRAJECTORY"
  | "RECOVERY"
  | null;

export interface EIEAnalysisResult {
  userId: string;
  dominantEmotion: string | null;
  emotionalDirection: EmotionalDirection;
  patternType: PatternType;
  patternDescription: string;
  confidence: number; // 0.0 - 1.0
  analyzedAt: number;
  routeTo:
    | "CARRYING_AWARENESS"
    | "PASSIVE_SIGNAL"
    | "RECOVERY_ANCHOR"
    | "REFLECTIONS_PROMPT"
    | "COMPASS_UPDATE"
    | null;
}

export interface EIEInsight {
  type: "PATTERN" | "DIRECTION" | "RECOVERY" | "SUPPORT";
  text: string; // max 3 lines, no advice, no numbers
}

export interface SupportPresenceResult {
  postsWithZeroSupport: number;
  supportGiven: number;
  hasReceivedSupport: boolean; // Yes/No only — never a count
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── MODULE 1: Emotion Pattern Analyzer ───
// Runs on last 30 days of UEDL events
export function analyzeEmotionPatterns(
  events: UEDLEvent[],
  userId: string,
): EIEAnalysisResult {
  const nowMs = Date.now();
  const thirtyDaysAgo = nowMs - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => e.createdAt >= thirtyDaysAgo);
  const lastWeek = events.filter((e) => e.createdAt >= sevenDaysAgo);

  // Dominant emotion (most frequent in 30 days)
  const emotionCounts: Record<string, number> = {};
  for (const e of recent) {
    emotionCounts[e.emotionType] = (emotionCounts[e.emotionType] ?? 0) + 1;
  }
  const dominantEmotion =
    Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // RECURRING EMOTION: same emotion 3+ times in 7 days
  const weekEmotionCounts: Record<string, number> = {};
  for (const e of lastWeek) {
    weekEmotionCounts[e.emotionType] =
      (weekEmotionCounts[e.emotionType] ?? 0) + 1;
  }
  const recurringEntry = Object.entries(weekEmotionCounts).find(
    ([, count]) => count >= 3,
  );
  if (recurringEntry) {
    const [recurringEmotion] = recurringEntry;
    const confidence = Math.min(weekEmotionCounts[recurringEmotion] / 7, 1.0);
    if (confidence >= 0.7) {
      return {
        userId,
        dominantEmotion: recurringEmotion,
        emotionalDirection: calculateDirection(recent),
        patternType: "RECURRING",
        patternDescription: `You have been feeling ${recurringEmotion} repeatedly this week.`,
        confidence,
        analyzedAt: nowMs,
        routeTo: "CARRYING_AWARENESS",
      };
    }
  }

  // TIME-BASED PATTERN: same emotion at same day of week for 3+ weeks
  const dayPatterns: Record<string, Record<number, number>> = {}; // emotion -> day -> count
  for (const e of recent) {
    if (!dayPatterns[e.emotionType]) dayPatterns[e.emotionType] = {};
    dayPatterns[e.emotionType][e.dayOfWeek] =
      (dayPatterns[e.emotionType][e.dayOfWeek] ?? 0) + 1;
  }
  for (const [emotion, dayCounts] of Object.entries(dayPatterns)) {
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count >= 3) {
        const confidence = Math.min(count / 4, 1.0);
        if (confidence >= 0.7) {
          return {
            userId,
            dominantEmotion: emotion,
            emotionalDirection: calculateDirection(recent),
            patternType: "TIME_BASED",
            patternDescription: `You often feel ${emotion} on ${DAYS[Number(day)]}.`,
            confidence,
            analyzedAt: nowMs,
            routeTo: "PASSIVE_SIGNAL",
          };
        }
      }
    }
  }

  // RECOVERY PATTERN: 3+ difficult days followed by 2+ positive days
  const dailyEmotions = groupByDay(recent);
  const days = Object.keys(dailyEmotions).sort();
  let difficultStreak = 0;
  let recoveryDetected = false;
  for (let i = 0; i < days.length; i++) {
    const dayEvents = dailyEmotions[days[i]];
    const hasDifficult = dayEvents.some(
      (e) => emotionCategory(e.emotionType) === "DIFFICULT",
    );
    const hasPositive = dayEvents.some(
      (e) => emotionCategory(e.emotionType) === "POSITIVE",
    );
    if (hasDifficult && !hasPositive) {
      difficultStreak++;
    } else if (hasPositive && difficultStreak >= 3) {
      recoveryDetected = true;
      break;
    } else {
      difficultStreak = 0;
    }
  }
  if (recoveryDetected) {
    return {
      userId,
      dominantEmotion,
      emotionalDirection: calculateDirection(recent),
      patternType: "RECOVERY",
      patternDescription:
        "You were carrying something heavy. Then something shifted.",
      confidence: 0.85,
      analyzedAt: nowMs,
      routeTo: "RECOVERY_ANCHOR",
    };
  }

  // Default: trajectory
  return {
    userId,
    dominantEmotion,
    emotionalDirection: calculateDirection(recent),
    patternType: "TRAJECTORY",
    patternDescription: "Emotional trajectory observed over 30 days.",
    confidence: 0.75,
    analyzedAt: nowMs,
    routeTo: "COMPASS_UPDATE",
  };
}

// ─── MODULE 2: Emotional Direction Calculator ───
// Produces a direction word — never a number
export function calculateDirection(events: UEDLEvent[]): EmotionalDirection {
  const nowMs = Date.now();
  const fourteenDaysAgo = nowMs - 14 * 24 * 60 * 60 * 1000;

  let positiveCount = 0;
  let difficultCount = 0;
  let firstHalfPositive = 0;
  let firstHalfDifficult = 0;
  let secondHalfPositive = 0;
  let secondHalfDifficult = 0;

  for (const e of events) {
    const cat = emotionCategory(e.emotionType);
    if (cat === "POSITIVE") positiveCount++;
    if (cat === "DIFFICULT") difficultCount++;

    const isSecondHalf = e.createdAt >= fourteenDaysAgo;
    if (cat === "POSITIVE") {
      if (isSecondHalf) secondHalfPositive++;
      else firstHalfPositive++;
    }
    if (cat === "DIFFICULT") {
      if (isSecondHalf) secondHalfDifficult++;
      else firstHalfDifficult++;
    }
  }

  const total = positiveCount + difficultCount;
  if (total === 0) return "BALANCED";

  // Check shifting direction first (last 14 days vs first 14 days)
  const firstHalfScore = firstHalfPositive - firstHalfDifficult;
  const secondHalfScore = secondHalfPositive - secondHalfDifficult;
  if (secondHalfScore > firstHalfScore + 2) return "SHIFTING_POSITIVE";
  if (secondHalfScore < firstHalfScore - 2) return "SHIFTING_DIFFICULT";

  // Overall direction
  const ratio = positiveCount / total;
  if (ratio >= 0.65) return "PREDOMINANTLY_POSITIVE";
  if (ratio <= 0.35) return "PREDOMINANTLY_DIFFICULT";
  return "BALANCED";
}

// ─── MODULE 3: Support Presence Analyzer ───
export function analyzeSupportPresence(
  myPosts: Array<{ supportReactionCount: number; emotionType: string }>,
  supportGivenCount: number,
): SupportPresenceResult {
  const difficultPosts = myPosts.filter(
    (p) => emotionCategory(p.emotionType) === "DIFFICULT",
  );
  const postsWithZeroSupport = difficultPosts.filter(
    (p) => p.supportReactionCount === 0,
  ).length;
  const hasReceivedSupport = difficultPosts.some(
    (p) => p.supportReactionCount > 0,
  );

  return {
    postsWithZeroSupport,
    supportGiven: supportGivenCount,
    hasReceivedSupport,
  };
}

// ─── MODULE 4: Insight Generator ───
// Produces max-3-line, no-advice, no-number, directional observations
export function generateInsights(
  analysis: EIEAnalysisResult,
  support: SupportPresenceResult,
  events: UEDLEvent[],
): EIEInsight[] {
  const insights: EIEInsight[] = [];

  // Pattern insight
  if (analysis.patternType === "RECURRING" && analysis.dominantEmotion) {
    const dayPattern = detectDayPattern(events, analysis.dominantEmotion);
    if (dayPattern) {
      insights.push({
        type: "PATTERN",
        text: `You often feel ${analysis.dominantEmotion} on ${dayPattern}.\nVeil noticed.`,
      });
    } else {
      insights.push({
        type: "PATTERN",
        text: `You have been carrying ${analysis.dominantEmotion} close lately.\nVeil noticed.`,
      });
    }
  }

  // Direction insight
  if (analysis.emotionalDirection === "SHIFTING_POSITIVE") {
    insights.push({
      type: "DIRECTION",
      text: "Something has been shifting.\nThe last two weeks have felt lighter than before.",
    });
  } else if (analysis.emotionalDirection === "SHIFTING_DIFFICULT") {
    insights.push({
      type: "DIRECTION",
      text: "Something has been shifting.\nThe last two weeks have felt heavier than before.",
    });
  }

  // Recovery insight
  if (analysis.patternType === "RECOVERY") {
    insights.push({
      type: "RECOVERY",
      text: "You were carrying something heavy.\nThen something shifted.\nYou came through it.",
    });
  }

  // Support insight
  if (support.supportGiven > 0) {
    insights.push({
      type: "SUPPORT",
      text: "You showed up for people in your circle this week.\nThey felt it.",
    });
  }

  return insights;
}

// ─── Helpers ───
function groupByDay(events: UEDLEvent[]): Record<string, UEDLEvent[]> {
  const result: Record<string, UEDLEvent[]> = {};
  for (const e of events) {
    const day = new Date(e.createdAt).toDateString();
    if (!result[day]) result[day] = [];
    result[day].push(e);
  }
  return result;
}

function detectDayPattern(
  events: UEDLEvent[],
  emotionType: string,
): string | null {
  const dayCounts: Record<number, number> = {};
  for (const e of events) {
    if (e.emotionType === emotionType) {
      dayCounts[e.dayOfWeek] = (dayCounts[e.dayOfWeek] ?? 0) + 1;
    }
  }
  const peak = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  if (peak && Number(peak[1]) >= 3) return DAYS[Number(peak[0])];
  return null;
}

// ─── Carrying Awareness: 3+ days of same difficult emotion ───
export function detectCarryingAwareness(
  events: UEDLEvent[],
  emotionType: string,
): boolean {
  const nowMs = Date.now();
  const threeDaysAgo = nowMs - 3 * 24 * 60 * 60 * 1000;
  const recentOfType = events.filter(
    (e) =>
      e.emotionType === emotionType &&
      e.createdAt >= threeDaysAgo &&
      emotionCategory(e.emotionType) === "DIFFICULT",
  );
  const uniqueDays = new Set(
    recentOfType.map((e) => new Date(e.createdAt).toDateString()),
  );
  return uniqueDays.size >= 3;
}
