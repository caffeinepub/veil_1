export type PatternType =
  | "RECURRING"
  | "TIME_BASED"
  | "IMPROVEMENT"
  | "STAGNATION"
  | "ANNIVERSARY";

export interface EmotionEvent {
  emotionType: string;
  category: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  timestamp: Date;
  wellbeingDelta?: number;
}

export interface DetectedPattern {
  type: PatternType;
  description: string;
  confidence: number;
  detectedAt: Date;
  routesTo:
    | "carrying_awareness"
    | "passive_signal"
    | "recovery_anchor"
    | "reflections_stagnation_prompt"
    | "memory_resurfacing";
}

const MIN_CONFIDENCE = 0.7;

function detectRecurring(events: EmotionEvent[]): DetectedPattern | null {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = events.filter((e) => e.timestamp >= sevenDaysAgo);
  const counts: Record<string, number> = {};
  for (const e of recent) {
    counts[e.emotionType] = (counts[e.emotionType] ?? 0) + 1;
  }
  for (const [emotionType, count] of Object.entries(counts)) {
    if (count >= 3) {
      const confidence = Math.min(0.5 + (count - 3) * 0.1, 1.0);
      if (confidence >= MIN_CONFIDENCE) {
        return {
          type: "RECURRING",
          description: `${emotionType} has appeared ${count} times in the past 7 days`,
          confidence,
          detectedAt: new Date(),
          routesTo: "carrying_awareness",
        };
      }
    }
  }
  return null;
}

function detectTimeBased(events: EmotionEvent[]): DetectedPattern | null {
  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const relevant = events.filter((e) => e.timestamp >= threeWeeksAgo);

  // Group by emotionType + dayOfWeek
  const grouped: Record<string, Set<number>> = {}; // key: emotionType, value: set of week numbers
  for (const e of relevant) {
    const dow = e.timestamp.getDay();
    const weekNum = Math.floor(
      e.timestamp.getTime() / (7 * 24 * 60 * 60 * 1000),
    );
    const key = `${e.emotionType}:${dow}`;
    if (!grouped[key]) grouped[key] = new Set();
    grouped[key].add(weekNum);
  }
  for (const [key, weeks] of Object.entries(grouped)) {
    if (weeks.size >= 3) {
      const [emotionType, dowStr] = key.split(":");
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const confidence = Math.min(0.5 + (weeks.size - 3) * 0.1, 1.0);
      if (confidence >= MIN_CONFIDENCE) {
        return {
          type: "TIME_BASED",
          description: `${emotionType} recurs on ${dayNames[Number(dowStr)]} for ${weeks.size} weeks`,
          confidence,
          detectedAt: new Date(),
          routesTo: "passive_signal",
        };
      }
    }
  }
  return null;
}

function detectImprovement(events: EmotionEvent[]): DetectedPattern | null {
  const withDelta = events.filter(
    (e) => e.wellbeingDelta !== undefined && e.wellbeingDelta !== null,
  );
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const recent = withDelta.filter(
    (e) => now - e.timestamp.getTime() <= sevenDaysMs,
  );
  const older = withDelta.filter((e) => {
    const age = now - e.timestamp.getTime();
    return age > sevenDaysMs && age <= 14 * 24 * 60 * 60 * 1000;
  });

  if (recent.length === 0 || older.length === 0) return null;

  const avgRecent =
    recent.reduce((s, e) => s + (e.wellbeingDelta ?? 0), 0) / recent.length;
  const avgOlder =
    older.reduce((s, e) => s + (e.wellbeingDelta ?? 0), 0) / older.length;

  if (avgRecent > avgOlder) {
    const confidence = Math.min(0.6 + (avgRecent - avgOlder) * 0.05, 1.0);
    if (confidence >= MIN_CONFIDENCE) {
      return {
        type: "IMPROVEMENT",
        description: "Wellbeing delta improving over the past 7 days",
        confidence,
        detectedAt: new Date(),
        routesTo: "recovery_anchor",
      };
    }
  }
  return null;
}

function detectStagnation(events: EmotionEvent[]): DetectedPattern | null {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recent = events.filter((e) => e.timestamp >= fourteenDaysAgo);
  if (recent.length < 5) return null;

  const allNegative = recent.every((e) => e.category === "NEGATIVE");
  if (!allNegative) return null;

  const hasImprovement = recent.some(
    (e) => e.wellbeingDelta !== undefined && (e.wellbeingDelta ?? 0) > 0,
  );
  if (hasImprovement) return null;

  return {
    type: "STAGNATION",
    description:
      "14+ consecutive days of difficult emotions with no improvement detected",
    confidence: 0.8,
    detectedAt: new Date(),
    routesTo: "reflections_stagnation_prompt",
  };
}

function detectAnniversary(events: EmotionEvent[]): DetectedPattern | null {
  const today = new Date();
  const todayMD = `${today.getMonth()}-${today.getDate()}`;

  // Look at events older than 300 days (roughly ~1 year)
  const oldEnough = events.filter((e) => {
    const ageDays =
      (Date.now() - e.timestamp.getTime()) / (24 * 60 * 60 * 1000);
    return ageDays >= 300 && ageDays <= 400;
  });

  const significantPast = oldEnough.filter((e) => {
    const d = e.timestamp;
    const md = `${d.getMonth()}-${d.getDate()}`;
    return md === todayMD;
  });

  if (significantPast.length > 0) {
    return {
      type: "ANNIVERSARY",
      description: "A significant past event occurred on this date",
      confidence: 0.9,
      detectedAt: new Date(),
      routesTo: "memory_resurfacing",
    };
  }
  return null;
}

export function detectPatterns(events: EmotionEvent[]): DetectedPattern[] {
  const results: DetectedPattern[] = [];
  const checks = [
    detectRecurring,
    detectTimeBased,
    detectImprovement,
    detectStagnation,
    detectAnniversary,
  ];
  for (const check of checks) {
    const result = check(events);
    if (result && result.confidence >= MIN_CONFIDENCE) {
      results.push(result);
    }
  }
  return results;
}

export function getStagnationPrompt(): string {
  return "Something has been staying the same. What would need to change for something to shift?";
}
