// ─── Positive Emotion Detection Engine ──────────────────────────────────────
// Fine-grained classification of positive emotions detected from Companion Card
// dumps. Runs client-side in memory. No data leaves the device.

import type { DetectionResult } from "./emotionDetection";

export type PositiveEmotionType =
  | "HAPPY"
  | "GRATEFUL"
  | "HOPEFUL"
  | "EXCITED"
  | "LOVED"
  | "CALM"
  | "PROMOTION"
  | "NEW_RELATIONSHIP"
  | "MARRIAGE"
  | "ENGAGEMENT"
  | "HONEYMOON"
  | "BIRTH_OF_CHILD"
  | "PERSONAL_ACHIEVEMENT";

export type MilestoneLevel = "EVERYDAY" | "SIGNIFICANT" | "LIFE";

export interface PositiveDetectionResult {
  emotion_type: PositiveEmotionType;
  milestone_level: MilestoneLevel;
  intensity: number;
  confidence: number;
}

const MILESTONE_KEYWORDS: Record<PositiveEmotionType, string[]> = {
  PROMOTION: [
    "promotion",
    "promoted",
    "got the job",
    "new job",
    "raise",
    "bonus",
    "got in",
    "accepted",
    "recognition",
    "career",
  ],
  BIRTH_OF_CHILD: [
    "baby",
    "born",
    "birth",
    "newborn",
    "she arrived",
    "he arrived",
    "they arrived",
    "labor",
    "delivery",
    "child born",
    "new baby",
    "our baby",
    "my baby",
    "pregnant",
  ],
  MARRIAGE: [
    "married",
    "wedding",
    "vows",
    "husband",
    "wife",
    "ceremony",
    "our day",
    "i do",
  ],
  ENGAGEMENT: [
    "engaged",
    "proposal",
    "proposed",
    "said yes",
    "ring",
    "will you marry",
    "engagement",
  ],
  HONEYMOON: ["honeymoon", "just married", "newlyweds"],
  NEW_RELATIONSHIP: [
    "relationship",
    "together",
    "dating",
    "fell for",
    "falling for",
    "first kiss",
    "they like me",
    "he likes me",
    "she likes me",
  ],
  PERSONAL_ACHIEVEMENT: [
    "finished",
    "completed",
    "achieved",
    "crossed the finish",
    "passed",
    "graduated",
    "published",
    "launched",
    "won",
    "accomplished",
    "achievement",
  ],
  GRATEFUL: [
    "grateful",
    "gratitude",
    "thankful",
    "blessed",
    "appreciate",
    "so lucky",
  ],
  HOPEFUL: [
    "hope",
    "hopeful",
    "looking forward",
    "things are looking",
    "turning around",
    "getting better",
  ],
  LOVED: [
    "loved",
    "love me",
    "they love me",
    "feel loved",
    "chosen",
    "seen",
    "cherished",
  ],
  CALM: [
    "calm",
    "peaceful",
    "still",
    "quiet",
    "at peace",
    "serene",
    "grounded",
  ],
  EXCITED: [
    "excited",
    "can't wait",
    "so excited",
    "buzzing",
    "thrilled",
    "can't believe",
    "elated",
  ],
  HAPPY: [
    "happy",
    "joy",
    "wonderful",
    "amazing",
    "great",
    "fantastic",
    "delighted",
  ],
};

const MILESTONE_LEVELS: Record<PositiveEmotionType, MilestoneLevel> = {
  HAPPY: "EVERYDAY",
  GRATEFUL: "EVERYDAY",
  CALM: "EVERYDAY",
  HOPEFUL: "EVERYDAY",
  EXCITED: "EVERYDAY",
  PROMOTION: "SIGNIFICANT",
  NEW_RELATIONSHIP: "SIGNIFICANT",
  PERSONAL_ACHIEVEMENT: "SIGNIFICANT",
  LOVED: "SIGNIFICANT",
  MARRIAGE: "LIFE",
  BIRTH_OF_CHILD: "LIFE",
  ENGAGEMENT: "LIFE",
  HONEYMOON: "LIFE",
};

// Priority order — LIFE milestones first, then SIGNIFICANT, then EVERYDAY
const DETECTION_ORDER: PositiveEmotionType[] = [
  "BIRTH_OF_CHILD",
  "MARRIAGE",
  "ENGAGEMENT",
  "HONEYMOON",
  "PROMOTION",
  "NEW_RELATIONSHIP",
  "PERSONAL_ACHIEVEMENT",
  "GRATEFUL",
  "HOPEFUL",
  "LOVED",
  "CALM",
  "EXCITED",
  "HAPPY",
];

function countHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce(
    (count, kw) => (lower.includes(kw.toLowerCase()) ? count + 1 : count),
    0,
  );
}

/**
 * Classify a positive emotion from text content.
 * If text is null (voice dump), returns HAPPY/EVERYDAY as default.
 */
export function classifyPositiveEmotion(
  detection: DetectionResult,
  text: string | null,
): PositiveDetectionResult {
  // Voice dump: no transcript — default to HAPPY EVERYDAY
  if (text === null || text.trim() === "") {
    return {
      emotion_type: "HAPPY",
      milestone_level: "EVERYDAY",
      intensity: 7,
      confidence: 0.75,
    };
  }

  let bestEmotion: PositiveEmotionType = "HAPPY";
  let bestHits = 0;

  for (const emotionType of DETECTION_ORDER) {
    const hits = countHits(text, MILESTONE_KEYWORDS[emotionType]);
    if (hits > bestHits) {
      bestHits = hits;
      bestEmotion = emotionType;
    }
  }

  const intensity = Math.min(10, Math.max(5, Math.round(detection.intensity)));
  const confidence = bestHits > 0 ? Math.min(1.0, 0.7 + bestHits * 0.1) : 0.7;

  return {
    emotion_type: bestEmotion,
    milestone_level: MILESTONE_LEVELS[bestEmotion],
    intensity,
    confidence,
  };
}
