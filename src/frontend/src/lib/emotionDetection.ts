// ─── Emotion Detection Engine ────────────────────────────────────────────────
// Keyword-based sentiment analysis for Veil's EI Engine.
// All detection runs client-side, in memory. No data leaves the device.

export type EmotionCategory = "NEGATIVE" | "POSITIVE" | "NEUTRAL";
export type EmotionType =
  | "STRESSED"
  | "SAD"
  | "FRUSTRATED"
  | "ANXIOUS"
  | "BROKEN"
  | "HURT"
  | "LONELY"
  | "POSITIVE"
  | "NEUTRAL";

export interface DetectionResult {
  emotion_category: EmotionCategory;
  emotion_type: EmotionType;
  intensity: number; // 1–10
  confidence: number; // 0.0–1.0
}

const KEYWORDS: Record<EmotionType, string[]> = {
  STRESSED: [
    "work",
    "pressure",
    "deadline",
    "meeting",
    "boss",
    "failed",
    "overwhelmed",
    "stressed",
    "stress",
    "exhausted",
    "burnout",
    "too much",
    "overworked",
    "behind",
    "performance",
  ],
  SAD: [
    "miss",
    "lost",
    "gone",
    "sad",
    "cry",
    "crying",
    "grief",
    "heartbreak",
    "heartbroken",
    "sorrow",
    "tears",
    "mourning",
    "depressed",
    "depression",
    "empty",
    "numb",
  ],
  FRUSTRATED: [
    "unfair",
    "angry",
    "frustrated",
    "frustration",
    "cant",
    "cannot believe",
    "why",
    "injustice",
    "blocked",
    "failed again",
    "ridiculous",
    "pointless",
    "stupid",
    "annoyed",
    "irritated",
  ],
  ANXIOUS: [
    "scared",
    "worried",
    "afraid",
    "what if",
    "terrified",
    "anxiety",
    "anxious",
    "nervous",
    "dread",
    "panic",
    "fear",
    "fearful",
    "uneasy",
    "apprehensive",
    "overthinking",
  ],
  BROKEN: [
    "too much",
    "breaking",
    "cant cope",
    "everything",
    "nothing left",
    "shattered",
    "falling apart",
    "overwhelmed by everything",
    "can't go on",
    "breaking down",
    "collapse",
    "desperate",
  ],
  HURT: [
    "betrayed",
    "rejected",
    "dismissed",
    "unseen",
    "hurt",
    "they",
    "didn't",
    "ignored",
    "treated",
    "betrayal",
    "rejection",
    "abandoned",
    "let down",
    "disappointed me",
  ],
  LONELY: [
    "alone",
    "isolated",
    "invisible",
    "nobody",
    "disconnected",
    "no one",
    "doesn't care",
    "doesnt care",
    "by myself",
    "no friends",
    "no one cares",
    "unwanted",
    "unloved",
  ],
  POSITIVE: [
    "happy",
    "joy",
    "excited",
    "wonderful",
    "grateful",
    "love",
    "amazing",
    "great",
    "proud",
    "celebrate",
    "blessed",
    "thankful",
    "fantastic",
    "thrilled",
    "delighted",
    "promotion",
    "promoted",
    "baby",
    "born",
    "married",
    "engagement",
    "engaged",
    "incredible",
    "best day",
    "finally",
    "so happy",
    "so grateful",
    "honeymoon",
    "pregnant",
    "wedding",
    "relationship",
    "accomplished",
    "achievement",
    "elated",
    "wonderful news",
    "good news",
  ],
  NEUTRAL: [],
};

const NEGATIVE_TYPES: EmotionType[] = [
  "STRESSED",
  "SAD",
  "FRUSTRATED",
  "ANXIOUS",
  "BROKEN",
  "HURT",
  "LONELY",
];

function countKeywordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, kw) => {
    return lower.includes(kw.toLowerCase()) ? count + 1 : count;
  }, 0);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Detect emotion from text content.
 * If text is null (voice dump with no transcript), returns a random
 * negative emotion with moderate intensity and moderate confidence.
 */
export function detectEmotion(text: string | null): DetectionResult {
  // Voice dump: no transcript available
  if (text === null || text.trim() === "") {
    const randomNegative =
      NEGATIVE_TYPES[Math.floor(Math.random() * NEGATIVE_TYPES.length)];
    const intensity = Math.floor(Math.random() * 3) + 6; // 6–8
    return {
      emotion_category: "NEGATIVE",
      emotion_type: randomNegative,
      intensity,
      confidence: 0.75,
    };
  }

  const scores: Partial<Record<EmotionType, number>> = {};
  let totalHits = 0;

  for (const [emotion, keywords] of Object.entries(KEYWORDS) as [
    EmotionType,
    string[],
  ][]) {
    if (emotion === "NEUTRAL") continue;
    const hits = countKeywordHits(text, keywords);
    scores[emotion] = hits;
    totalHits += hits;
  }

  if (totalHits === 0) {
    return {
      emotion_category: "NEUTRAL",
      emotion_type: "NEUTRAL",
      intensity: 3,
      confidence: 0.5,
    };
  }

  // Find top emotion
  let topEmotion: EmotionType = "NEUTRAL";
  let topHits = 0;
  for (const [emotion, hits] of Object.entries(scores) as [
    EmotionType,
    number,
  ][]) {
    if ((hits ?? 0) > topHits) {
      topHits = hits ?? 0;
      topEmotion = emotion;
    }
  }

  const confidence = clamp(topHits / totalHits, 0, 1.0);

  if (confidence < 0.65) {
    return {
      emotion_category: "NEUTRAL",
      emotion_type: "NEUTRAL",
      intensity: 3,
      confidence,
    };
  }

  const intensity = clamp(3 + topHits * 1.5, 1, 10);
  const category: EmotionCategory =
    topEmotion === "POSITIVE" ? "POSITIVE" : "NEGATIVE";

  return {
    emotion_category: category,
    emotion_type: topEmotion,
    intensity: Math.round(intensity),
    confidence,
  };
}
