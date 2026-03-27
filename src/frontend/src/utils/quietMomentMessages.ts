// ─── Quiet Moment Message Library ───────────────────────────────────────────
// Keyed by emotion type + visibility tier. Rotates through message sets,
// never repeating the same index consecutively.

export interface MessageSet {
  primary: string;
  secondary: string;
}

type VisibilityTier = "only_me" | "social" | "global";

function tier(visibility: string): VisibilityTier {
  const v = visibility.toLowerCase();
  if (v === "only_me") return "only_me";
  if (v === "global") return "global";
  return "social"; // inner_circle | friends
}

// ─── Message bank ─────────────────────────────────────────────────────────────

const MESSAGES: Record<string, Record<string, MessageSet[]>> = {
  grateful: {
    all: [
      {
        primary: "Veil has it.",
        secondary:
          "Gratitude changes the shape of a day. Let this one stay with you.",
      },
      {
        primary: "You noticed something good.",
        secondary: "That is not small. That is everything.",
      },
      {
        primary: "This feeling is here now.",
        secondary: "Gratitude grows when it is given a place to live.",
      },
      {
        primary: "Veil is holding this.",
        secondary: "The good things deserve to be remembered too.",
      },
    ],
  },
  calm: {
    all: [
      {
        primary: "Veil has it.",
        secondary: "Let this calm moment stay with you a little longer.",
      },
      {
        primary: "You found stillness today.",
        secondary: "That is worth noticing.",
      },
      {
        primary: "This moment is here.",
        secondary: "Calm is not always easy to find. You found it.",
      },
      {
        primary: "Veil is holding this.",
        secondary: "Carry this quiet into the rest of your day.",
      },
    ],
  },
  stressed: {
    only_me: [
      {
        primary: "Veil has it now.",
        secondary: "This is just between you and Veil. That is enough.",
      },
      {
        primary: "You put it down.",
        secondary: "It lives here now. Not with you.",
      },
    ],
    social: [
      {
        primary: "Veil has it.",
        secondary:
          "The people you trust may be there for you. You are not carrying this alone.",
      },
      {
        primary: "You said it out loud.",
        secondary:
          "That took something. The people who care about you are here.",
      },
      {
        primary: "It is here now.",
        secondary: "Take one slow breath. Just one. Then go.",
      },
      {
        primary: "Veil received all of it.",
        secondary:
          "Stress does not mean you are failing. It means you are carrying something real.",
      },
    ],
    global: [
      {
        primary: "Veil has it.",
        secondary:
          "The people you trust may be there for you. You are not carrying this alone.",
      },
      {
        primary: "You said it out loud.",
        secondary:
          "That took something. The people who care about you are here.",
      },
      {
        primary: "It is here now.",
        secondary: "Take one slow breath. Just one. Then go.",
      },
      {
        primary: "Veil received all of it.",
        secondary:
          "Stress does not mean you are failing. It means you are carrying something real.",
      },
    ],
  },
  sad: {
    only_me: [
      {
        primary: "Veil has it.",
        secondary: "Your sadness is allowed here. All of it.",
      },
      {
        primary: "You showed up.",
        secondary: "That is the only thing that was asked of you today.",
      },
    ],
    social: [
      {
        primary: "Veil has it.",
        secondary: "Your feelings matter. The people you trust are here.",
      },
      {
        primary: "You let it out.",
        secondary: "Sadness is not weakness. Saying it is.",
      },
      {
        primary: "It is here now.",
        secondary: "You do not have to carry this alone.",
      },
      {
        primary: "Veil received this.",
        secondary:
          "Some days are just heavy. You do not have to explain that to anyone.",
      },
    ],
    global: [
      {
        primary: "Veil has it.",
        secondary: "Your feelings matter. The people you trust are here.",
      },
      {
        primary: "You let it out.",
        secondary: "Sadness is not weakness. Saying it is.",
      },
      {
        primary: "It is here now.",
        secondary: "You do not have to carry this alone.",
      },
      {
        primary: "Veil received this.",
        secondary:
          "Some days are just heavy. You do not have to explain that to anyone.",
      },
    ],
  },
  frustrated: {
    only_me: [
      {
        primary: "Veil has it.",
        secondary:
          "It is okay to feel this. You do not have to calm down before you are ready.",
      },
      {
        primary: "You said it.",
        secondary:
          "Frustration is just energy that has not found its way out yet. This helped.",
      },
    ],
    social: [
      {
        primary: "Veil has it.",
        secondary:
          "The people you trust see you — even when you are frustrated.",
      },
      {
        primary: "You put it down.",
        secondary: "It is okay to feel this. It is okay to say it.",
      },
      {
        primary: "It is here now.",
        secondary: "You do not have to carry this into the rest of your day.",
      },
      {
        primary: "Veil received this.",
        secondary: "Frustration is valid. Full stop.",
      },
    ],
    global: [
      {
        primary: "Veil has it.",
        secondary:
          "The people you trust see you — even when you are frustrated.",
      },
      {
        primary: "You put it down.",
        secondary: "It is okay to feel this. It is okay to say it.",
      },
      {
        primary: "It is here now.",
        secondary: "You do not have to carry this into the rest of your day.",
      },
      {
        primary: "Veil received this.",
        secondary: "Frustration is valid. Full stop.",
      },
    ],
  },
  reflective: {
    all: [
      {
        primary: "Veil has it.",
        secondary:
          "Reflection is how we understand ourselves. You are doing that work.",
      },
      {
        primary: "You looked inward.",
        secondary: "That is not nothing. Most people never do.",
      },
      {
        primary: "This moment is here.",
        secondary:
          "Sometimes the thinking needs somewhere to land. It landed here.",
      },
      {
        primary: "Veil is holding this.",
        secondary: "Sit with it as long as you need. There is no rush.",
      },
    ],
  },
  anxious: {
    only_me: [
      {
        primary: "Veil has it.",
        secondary: "You are safe here. This is a quiet space. Breathe.",
      },
      {
        primary: "You showed up.",
        secondary: "Naming anxiety is the first step to loosening its grip.",
      },
    ],
    social: [
      {
        primary: "Veil has it.",
        secondary: "You are not alone in this. The people you trust are here.",
      },
      {
        primary: "You said it out loud.",
        secondary: "Anxiety shrinks a little when it is named. You named it.",
      },
      {
        primary: "It is here now.",
        secondary: "One breath. Just one. You are okay.",
      },
      {
        primary: "Veil received this.",
        secondary:
          "You do not have to have it all figured out. You just had to say it. You did.",
      },
    ],
    global: [
      {
        primary: "Veil has it.",
        secondary: "You are not alone in this. The people you trust are here.",
      },
      {
        primary: "You said it out loud.",
        secondary: "Anxiety shrinks a little when it is named. You named it.",
      },
      {
        primary: "It is here now.",
        secondary: "One breath. Just one. You are okay.",
      },
      {
        primary: "Veil received this.",
        secondary:
          "You do not have to have it all figured out. You just had to say it. You did.",
      },
    ],
  },
  lonely: {
    only_me: [
      {
        primary: "Veil has it.",
        secondary: "You are here. That matters. Veil is with you.",
      },
      {
        primary: "You showed up.",
        secondary:
          "Loneliness is one of the heaviest things to carry. You put it down here.",
      },
    ],
    social: [
      {
        primary: "Veil has it.",
        secondary:
          "The people you trust are closer than loneliness makes them feel.",
      },
      {
        primary: "You said it.",
        secondary:
          "Saying you are lonely is an act of courage. You were courageous today.",
      },
      {
        primary: "It is here now.",
        secondary: "You reached out. That is the opposite of alone.",
      },
      {
        primary: "Veil received this.",
        secondary:
          "You are not invisible. Not here. Not to Veil. Not to the people you shared this with.",
      },
    ],
    global: [
      {
        primary: "Veil has it.",
        secondary:
          "The people you trust are closer than loneliness makes them feel.",
      },
      {
        primary: "You said it.",
        secondary:
          "Saying you are lonely is an act of courage. You were courageous today.",
      },
      {
        primary: "It is here now.",
        secondary: "You reached out. That is the opposite of alone.",
      },
      {
        primary: "Veil received this.",
        secondary:
          "You are not invisible. Not here. Not to Veil. Not to the people you shared this with.",
      },
    ],
  },
  numb: {
    all: [
      {
        primary: "Veil has it.",
        secondary:
          "Sometimes there are no words. You showed up anyway. That is enough.",
      },
      {
        primary: "You came here.",
        secondary:
          "When feeling nothing is all you have — being here still counts.",
      },
      {
        primary: "It is here now.",
        secondary: "Numbness is its own kind of weight. You put it down.",
      },
      {
        primary: "Veil received this.",
        secondary:
          "You do not have to feel something to deserve support. You are here. That is enough.",
      },
    ],
  },
  hopeful: {
    all: [
      {
        primary: "Veil has it.",
        secondary: "Hope is a quiet, brave thing. Let it grow.",
      },
      {
        primary: "You felt something good today.",
        secondary: "Hold onto this one. It matters.",
      },
      {
        primary: "This feeling is here.",
        secondary: "Hope does not need to be certain to be real. This is real.",
      },
      {
        primary: "Veil is holding this.",
        secondary:
          "Something shifted today. You noticed it. That is everything.",
      },
    ],
  },
};

const GLOBAL_SUFFIX_POSITIVE =
  "Someone out there may feel exactly what you are feeling right now. You reminded them they are not alone.";
const GLOBAL_SUFFIX_DIFFICULT =
  "Someone out there may be carrying exactly what you are carrying. You showed them it is okay to say it.";

const POSITIVE_EMOTIONS = new Set(["grateful", "calm", "hopeful"]);

const CUSTOM_MESSAGES: MessageSet[] = [
  {
    primary: "Veil has it.",
    secondary: "Whatever you are feeling — it is allowed here. All of it.",
  },
  {
    primary: "You named it.",
    secondary:
      "Sometimes the feeling does not have a word. You found one anyway.",
  },
  {
    primary: "It is here now.",
    secondary:
      "Every emotion is valid here. Especially the ones that are hard to name.",
  },
  {
    primary: "Veil received this.",
    secondary: "You showed up for yourself today. That is the whole thing.",
  },
];

// ─── Rotation tracking ────────────────────────────────────────────────────────
// Tracks last-shown index per emotion key so we never repeat consecutively.
const lastShownIndex = new Map<string, number>();

function pickNext(sets: MessageSet[], key: string): MessageSet {
  const last = lastShownIndex.get(key) ?? -1;
  let next = (last + 1) % sets.length;
  // If somehow only one message exists, just return it
  if (sets.length === 1) return sets[0];
  lastShownIndex.set(key, next);
  return sets[next];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getQuietMomentMessage(
  emotion_type: string,
  visibility: string,
): MessageSet {
  const key = emotion_type.toLowerCase();
  const t = tier(visibility);

  let sets: MessageSet[] | undefined;

  const bank = MESSAGES[key];
  if (bank) {
    if ("all" in bank && (bank as any).all) {
      sets = (bank as any).all as MessageSet[];
    } else {
      const byTier = bank as Record<string, MessageSet[]>;
      sets = byTier[t] ?? byTier.social ?? byTier.all;
    }
  }

  if (!sets || sets.length === 0) {
    sets = CUSTOM_MESSAGES;
  }

  const rotationKey = `${key}:${t}`;
  const msg = { ...pickNext(sets, rotationKey) };

  // Append global suffix
  if (t === "global") {
    const suffix = POSITIVE_EMOTIONS.has(key)
      ? GLOBAL_SUFFIX_POSITIVE
      : GLOBAL_SUFFIX_DIFFICULT;
    msg.secondary = `${msg.secondary} ${suffix}`;
  }

  return msg;
}
