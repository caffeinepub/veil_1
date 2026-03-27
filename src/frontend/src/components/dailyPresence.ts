// ═══════════════════════════════════════════════════════════════
// VEIL — LAYER 5: DAILY EMOTIONAL PRESENCE SYSTEM
// No streaks. No scores. Depth over frequency.
// ═══════════════════════════════════════════════════════════════

export type MilestoneType =
  | "FIRST_EXPRESSION"
  | "FIRST_LETTER"
  | "FIRST_CONFESSION"
  | "FIRST_VOLUME"
  | "FIRST_YEAR"
  | "FIRST_TURNING_POINT";

export interface EmotionalMilestone {
  id: string;
  userId: string;
  milestoneType: MilestoneType;
  achievedAt: number;
  surfacedToUser: boolean;
  surfacedAt?: number;
}

export interface DailyPresenceState {
  userId: string;
  checkedInToday: boolean;
  lastCheckinAt: number | null;
  daysSinceLastSession: number;
  // NO STREAK FIELD. NO STREAK COUNTER. NEVER.
  reflectionCompletedToday: boolean;
  supportGivenToday: number;
  gentleReminderSentToday: boolean;
  lastReminderSentAt: number | null;
  quietModeEnabled: boolean;
  updatedAt: number;
}

export const MILESTONE_COPY: Record<MilestoneType, string> = {
  FIRST_EXPRESSION:
    "You said something real for the first time.\nThat takes courage.",
  FIRST_LETTER: "You wrote something that needed to be said.",
  FIRST_CONFESSION: "You said something you had been carrying alone.",
  FIRST_VOLUME: "Your first chapter is complete.\nIt lives on your shelf now.",
  FIRST_YEAR:
    "A year of pages.\nA year of honest moments.\nThis is your story.",
  FIRST_TURNING_POINT:
    "You recognized a moment that changed things.\nThat takes wisdom.",
};

// ─── Gentle check-in reminder eligibility ───
// Sent ONLY if:
// 1. User has not opened Veil today
// 2. AND user has been active in last 5 days
// 3. AND it is within user's established emotional release time window
// NOT sent daily automatically. NOT sent on consecutive days without variation.
export function shouldSendGentleReminder(
  state: DailyPresenceState,
  userTimeWindowHour: number | null, // null = use default 20 (8 PM)
  currentHour: number,
  _currentDayMs: number,
): boolean {
  // Must not have opened today
  if (state.checkedInToday) return false;

  // Must have been active in last 5 days (not away)
  if (state.daysSinceLastSession > 5) return false;

  // Must not have sent reminder today
  if (state.gentleReminderSentToday) return false;

  // Must be within time window (±1 hour of established time, default 8PM)
  const targetHour = userTimeWindowHour ?? 20;
  if (Math.abs(currentHour - targetHour) > 1) return false;

  return true;
}

export const GENTLE_REMINDER_COPY = "Veil is here\nwhen you are ready.";

export const SUPPORT_RECEIVED_NOTIFICATION_COPY =
  "Someone in your circle is thinking of you.";

export const INNER_CIRCLE_ALERT_COPY =
  "Someone in your circle may need support today.";

export const WEEKLY_REFLECTION_COPY =
  "A reflection from your week is waiting for you.";

// ─── Milestone evaluation ───
// Checks current user activity against milestone conditions.
// Milestones celebrate acts of emotional courage — never frequency.
export function evaluateMilestones(
  existingMilestones: EmotionalMilestone[],
  userStats: {
    hasExpressed: boolean;
    hasWrittenLetter: boolean;
    hasConfessed: boolean;
    hasCompletedVolume: boolean;
    firstEntryAt: number | null;
    hasTurningPoint: boolean;
  },
  nowMs: number = Date.now(),
): MilestoneType[] {
  const achieved = new Set(existingMilestones.map((m) => m.milestoneType));
  const newMilestones: MilestoneType[] = [];

  if (userStats.hasExpressed && !achieved.has("FIRST_EXPRESSION")) {
    newMilestones.push("FIRST_EXPRESSION");
  }
  if (userStats.hasWrittenLetter && !achieved.has("FIRST_LETTER")) {
    newMilestones.push("FIRST_LETTER");
  }
  if (userStats.hasConfessed && !achieved.has("FIRST_CONFESSION")) {
    newMilestones.push("FIRST_CONFESSION");
  }
  if (userStats.hasCompletedVolume && !achieved.has("FIRST_VOLUME")) {
    newMilestones.push("FIRST_VOLUME");
  }
  if (
    userStats.firstEntryAt !== null &&
    nowMs - userStats.firstEntryAt >= 365 * 24 * 60 * 60 * 1000 &&
    !achieved.has("FIRST_YEAR")
  ) {
    newMilestones.push("FIRST_YEAR");
  }
  if (userStats.hasTurningPoint && !achieved.has("FIRST_TURNING_POINT")) {
    newMilestones.push("FIRST_TURNING_POINT");
  }

  return newMilestones;
}

// ─── Quiet mode notification filter ───
// Default ON for new users in first 7 days
export type AllowedQuietNotification =
  | "INNER_CIRCLE_ALERT"
  | "SUPPORT_RECEIVED"
  | "SCHEDULED_DELIVERY";

export function filterNotificationForQuietMode(
  notificationType: string,
  quietModeEnabled: boolean,
  notificationsSentToday: number,
): boolean {
  const ALLOWED_IN_QUIET: AllowedQuietNotification[] = [
    "INNER_CIRCLE_ALERT",
    "SUPPORT_RECEIVED",
    "SCHEDULED_DELIVERY",
  ];

  if (!quietModeEnabled) return notificationsSentToday < 1; // max 1/day always in Veil

  if (!ALLOWED_IN_QUIET.includes(notificationType as AllowedQuietNotification))
    return false;
  return notificationsSentToday < 1; // master limit: 1 per day
}

// ─── Reflection prompt after check-in ───
export const POST_CHECKIN_PROMPT = {
  question: "Would you like to sit with this for a moment?",
  actionLabel: "Write something",
  skipLabel: "Skip",
};
