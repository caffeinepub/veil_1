// ─── Veil Notification Types ────────────────────────────────────────────────
// Version 2.0 — Emotion-Driven Notification System

export type NotificationType =
  | "follow_up_state"
  | "carrying_awareness"
  | "emotional_pending"
  | "growth"
  | "memory_resurfacing"
  | "journal_milestone"
  | "reflection_prompt"
  | "seasonal_reflection"
  | "gentle_reentry";

export type MemoryResurfacingSubType =
  | "anniversary"
  | "emotional_mirror"
  | "growth_proof";
export type JournalMilestoneSubType =
  | "on_this_day"
  | "volume_completion"
  | "future_self_letter";
export type SeasonalSubType = "spring" | "summer" | "fall" | "winter";

export type NotificationSubType =
  | MemoryResurfacingSubType
  | JournalMilestoneSubType
  | SeasonalSubType
  | string;

export interface NotificationTypeConfig {
  type: NotificationType;
  label: string; // human-readable label for settings
  timeWindowStart: number; // 24h hour
  timeWindowEnd: number; // 24h hour
  maxFrequency: string;
  minSameTypeGapHours: number;
  isInApp: boolean; // carrying_awareness is in-app only
  copyLibrary: string[] | Record<string, string>;
}

export const NOTIFICATION_CONFIGS: Record<
  NotificationType,
  NotificationTypeConfig
> = {
  follow_up_state: {
    type: "follow_up_state",
    label: "The morning after a hard day",
    timeWindowStart: 6,
    timeWindowEnd: 11,
    maxFrequency: "Once per difficult event",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: [
      "Yesterday was heavy. Veil is here if you want to sit with it.",
      "Something from yesterday is still with you. Veil noticed.",
      "You carried something difficult yesterday. Today is new.",
    ],
  },

  carrying_awareness: {
    type: "carrying_awareness",
    label: "When you have been carrying something for days",
    timeWindowStart: 0,
    timeWindowEnd: 24,
    maxFrequency: "Once per streak milestone",
    minSameTypeGapHours: 48,
    isInApp: true, // in-app trigger only, not push
    copyLibrary: [
      "You have been carrying this for a few days now. That is worth noticing.",
      "Something has been staying with you. Veil has been watching.",
    ],
  },

  emotional_pending: {
    type: "emotional_pending",
    label: "When something feels unfinished",
    timeWindowStart: 6,
    timeWindowEnd: 21,
    maxFrequency: "Per unfinished item",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: [
      "Something you wrote is still here.",
      "You wrote something meaningful. It will be here whenever you are ready.",
      "Veil is here when you are ready.",
    ],
  },

  growth: {
    type: "growth",
    label: "When something has shifted",
    timeWindowStart: 9,
    timeWindowEnd: 12,
    maxFrequency: "Once per week maximum",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: [
      "Something has shifted in how you are carrying things. Veil noticed.",
      "You are moving through something differently than you were before.",
      "The weight you have been carrying is lighter now. That happened because you showed up.",
      "Something in the direction of your emotional life has been changing. Veil has been watching.",
    ],
  },

  memory_resurfacing: {
    type: "memory_resurfacing",
    label: "When a memory might help",
    timeWindowStart: 8,
    timeWindowEnd: 11,
    maxFrequency: "Once per week",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: {
      anniversary:
        "On this day last year — you wrote something. Veil thought you might want to read it.",
      emotional_mirror:
        "The last time you were in a similar place — you wrote something that seemed to help. Would you like to read it?",
      growth_proof:
        "Something you wrote after a hard time — from a person who came through it — might be worth reading today.",
    },
  },

  journal_milestone: {
    type: "journal_milestone",
    label: "When a chapter in your journal matters",
    timeWindowStart: 8,
    timeWindowEnd: 10,
    maxFrequency: "Per milestone, never more than once",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: {
      on_this_day:
        "On this day last year — you left something here. It is still yours.",
      volume_completion:
        "Your Journal has grown through a full year. A chapter is ready to be closed.",
      future_self_letter:
        "You wrote yourself something [X days] ago. You might need it today.",
    },
  },

  reflection_prompt: {
    type: "reflection_prompt",
    label: "When a question is waiting",
    timeWindowStart: 18,
    timeWindowEnd: 21,
    maxFrequency: "Once per meaningful event, max twice per week",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: [
      "Veil has a question for you — when you have a quiet moment.",
      "Something you did recently is worth sitting with. Veil has a question.",
      "A reflection is waiting for you.",
    ],
  },

  seasonal_reflection: {
    type: "seasonal_reflection",
    label: "At the turn of each season",
    timeWindowStart: 8,
    timeWindowEnd: 10,
    maxFrequency: "Once per season, 4 per year",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: {
      spring:
        "Something is waking up. Veil has a question about what you want to grow toward.",
      summer:
        "A new season is beginning. Veil is wondering what you want more of.",
      fall: "Something in the air is changing. Veil has a question about what you might be ready to release.",
      winter:
        "The quieter months are beginning. Veil has a question about what you find when you go inward.",
    },
  },

  gentle_reentry: {
    type: "gentle_reentry",
    label: "After a long quiet",
    timeWindowStart: 9,
    timeWindowEnd: 12,
    maxFrequency:
      "Once per 5–7 day absence, then silence for 7 days if no response",
    minSameTypeGapHours: 48,
    isInApp: false,
    copyLibrary: [
      "It has been a quiet week. Veil is here whenever you need it.",
      "You have been away for a bit. That is okay. Veil is still here.",
      "Whenever you are ready — Veil is here.",
    ],
  },
};

// ─── Copy helpers ─────────────────────────────────────────────────────────────

export function getCopyForType(
  type: NotificationType,
  subType?: string,
  index?: number,
): string {
  const config = NOTIFICATION_CONFIGS[type];
  const lib = config.copyLibrary;

  if (Array.isArray(lib)) {
    const i =
      index !== undefined
        ? index % lib.length
        : Math.floor(Math.random() * lib.length);
    return lib[i];
  }

  if (subType && subType in lib) {
    return (lib as Record<string, string>)[subType];
  }

  // fallback: first value
  return Object.values(lib)[0];
}

// ─── Notification State ────────────────────────────────────────────────────────

export type NotificationPermissionState =
  | "not_asked"
  | "granted"
  | "deferred"
  | "permanently_deferred";

export interface NotificationState {
  permissionState: NotificationPermissionState;
  isSessionActive: boolean;
  crisisInLast24h: boolean;
  lastSentAtByType: Partial<Record<NotificationType, number>>;
  daysSinceOnboarding: number;
  reentrySnoozedUntil: number | null; // timestamp
  quietModeEnabled: boolean;
}

export interface NotificationHistoryItem {
  id: string;
  type: NotificationType;
  subType?: string;
  copy: string;
  sentAt: number; // timestamp
  isRead: boolean;
}

// ─── Default state ────────────────────────────────────────────────────────────

export function getDefaultNotificationState(): NotificationState {
  return {
    permissionState: "not_asked",
    isSessionActive: false,
    crisisInLast24h: false,
    lastSentAtByType: {},
    daysSinceOnboarding: 3,
    reentrySnoozedUntil: null,
    quietModeEnabled: false,
  };
}

const STORAGE_KEY = "veil_notification_state";

export function loadNotificationState(): NotificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...getDefaultNotificationState(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return getDefaultNotificationState();
}

export function saveNotificationState(state: NotificationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// Quiet mode: only these types are allowed when quiet mode is on
export const QUIET_MODE_ALLOWED_TYPES: NotificationType[] = [
  "emotional_pending", // inner circle alert maps here
  "follow_up_state", // support received maps here
  "journal_milestone", // scheduled delivery maps here
];

// Color map for badge display
export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  growth: "#F9E4A0",
  memory_resurfacing: "#C3B8D8",
  gentle_reentry: "#B8C4D4",
  reflection_prompt: "#F4C28A",
  journal_milestone: "#A8C5A0",
  seasonal_reflection: "#A8C8DA",
  follow_up_state: "#F2B5C5",
  carrying_awareness: "#C3B8D8",
  emotional_pending: "#D4C5B5",
};
