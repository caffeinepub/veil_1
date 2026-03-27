// ─── Streak Awareness Message Library ───────────────────────────────────────
// All messages keyed by emotion + milestone bracket.
// Tone: caring friend who noticed a pattern — never diagnosis, never alarm.

export type AwarenessMessage = {
  headline: string;
  subline: string;
};

type EmotionMessages = {
  day3: AwarenessMessage;
  day5: AwarenessMessage;
  day7: AwarenessMessage;
  day10plus: AwarenessMessage;
};

const MESSAGES: Record<string, EmotionMessages> = {
  stressed: {
    day3: {
      headline: "You have been carrying stress for three days in a row.",
      subline: "That is worth noticing.",
    },
    day5: {
      headline: "Five days of stress.",
      subline:
        "That is not just a hard day — that is something worth paying attention to.",
    },
    day7: {
      headline: "You have been carrying stress every day this week.",
      subline:
        "You have been putting it down every day too. That takes strength.\n\nBut something may need more than release — it may need addressing.",
    },
    day10plus: {
      headline: "Ten days of stress.",
      subline:
        "Veil has been here for you every day.\n\nYou deserve more than daily release.\n\nIs there something that needs to change?",
    },
  },
  sad: {
    day3: {
      headline: "You have been carrying sadness for three days.",
      subline: "Veil sees you.",
    },
    day5: {
      headline: "Five days of sadness.",
      subline: "That is heavy.\n\nYou do not have to carry this alone.",
    },
    day7: {
      headline: "A week of sadness.",
      subline:
        "You have shown up every day. That matters.\n\nBut some weight needs more than one person. Or one app.",
    },
    day10plus: {
      headline: "You have been sad for ten days or more.",
      subline:
        "Veil is here. Always.\n\nBut you may need someone who can be there in ways Veil cannot.",
    },
  },
  anxious: {
    day3: {
      headline: "Three days of anxiety.",
      subline:
        "Something is unsettled. Veil has been holding it.\n\nHow are you really?",
    },
    day5: {
      headline: "Five days of carrying anxiety.",
      subline:
        "That is exhausting.\n\nYou are allowed to name what is underneath it.",
    },
    day7: {
      headline: "A week of anxiety.",
      subline:
        "You have been releasing it daily. That is brave.\n\nBut anxiety that stays this long may need more than release.",
    },
    day10plus: {
      headline: "A week of anxiety.",
      subline:
        "You have been releasing it daily. That is brave.\n\nBut anxiety that stays this long may need more than release.",
    },
  },
  lonely: {
    day3: {
      headline: "Three days of loneliness.",
      subline: "Veil has been here every one of them.",
    },
    day5: {
      headline: "Five days of feeling alone.",
      subline:
        "You are not invisible. Not to Veil. Not to the people who care about you.",
    },
    day7: {
      headline: "A week of loneliness.",
      subline:
        "Veil sees you.\n\nBut you deserve to be seen by people who can reach back.",
    },
    day10plus: {
      headline: "A week of loneliness.",
      subline:
        "Veil sees you.\n\nBut you deserve to be seen by people who can reach back.",
    },
  },
  frustrated: {
    day3: {
      headline: "Three days of frustration.",
      subline: "Something is not resolving.\n\nIt is okay to name what it is.",
    },
    day5: {
      headline: "Five days of the same frustration.",
      subline: "Releasing it helps. But something may need to actually change.",
    },
    day7: {
      headline: "Five days of the same frustration.",
      subline: "Releasing it helps. But something may need to actually change.",
    },
    day10plus: {
      headline: "Five days of the same frustration.",
      subline: "Releasing it helps. But something may need to actually change.",
    },
  },
  numb: {
    day3: {
      headline: "Three days of feeling nothing.",
      subline:
        "Showing up anyway — even with nothing to say — takes something.",
    },
    day5: {
      headline: "Five days of numbness.",
      subline:
        "That is its own kind of heavy.\n\nVeil is here. But you may need someone who can sit with you.",
    },
    day7: {
      headline: "Five days of numbness.",
      subline:
        "That is its own kind of heavy.\n\nVeil is here. But you may need someone who can sit with you.",
    },
    day10plus: {
      headline: "Five days of numbness.",
      subline:
        "That is its own kind of heavy.\n\nVeil is here. But you may need someone who can sit with you.",
    },
  },
};

export const AWARENESS_MILESTONES = [3, 5, 7, 10, 14, 21, 30];

/** Returns the highest milestone <= streakDays, or null if < 3. */
export function getActiveMilestone(streakDays: number): number | null {
  let active: number | null = null;
  for (const m of AWARENESS_MILESTONES) {
    if (streakDays >= m) active = m;
  }
  return active;
}

/** Returns the awareness message for the given emotion type and streak length. */
export function getAwarenessMessage(
  emotionType: string,
  streakDays: number,
): AwarenessMessage | null {
  const key = emotionType.toLowerCase();
  const set = MESSAGES[key];
  if (!set) return null;

  if (streakDays >= 10) return set.day10plus;
  if (streakDays >= 7) return set.day7;
  if (streakDays >= 5) return set.day5;
  if (streakDays >= 3) return set.day3;
  return null;
}

/** Difficult emotions that trigger streak awareness. */
export const DIFFICULT_EMOTION_TYPES = new Set([
  "stressed",
  "sad",
  "frustrated",
  "anxious",
  "lonely",
  "numb",
]);

/**
 * Emotions where crisis resources should appear at 5+ day streaks.
 * Per spec: SAD | LONELY | NUMB
 */
export const CRISIS_ESCALATION_TYPES = new Set(["sad", "lonely", "numb"]);

/** Returns true if crisis resources should be shown for this emotion + streak combo. */
export function shouldShowCrisisResources(
  emotionType: string,
  streakDays: number,
): boolean {
  return (
    CRISIS_ESCALATION_TYPES.has(emotionType.toLowerCase()) && streakDays >= 5
  );
}
