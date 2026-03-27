// ═══════════════════════════════════════════════════════════════
// VEIL — LAYER 3: EMOTIONAL BALANCE ALGORITHM
// Emotion classification, 3-consecutive-difficult cap, recovery insertion
// ═══════════════════════════════════════════════════════════════

export type EmotionCategory = "POSITIVE" | "NEUTRAL" | "DIFFICULT";

// ─── Complete emotion classification map ───
// No "Angry" — Veil uses "Frustrated" with soft coral aura (#E8A598)
// Red is never used. Red is alarming. Veil is never alarming.
export const EMOTION_CLASSIFICATION: Record<
  string,
  { category: EmotionCategory; auraColor: string; compassZone: string }
> = {
  // POSITIVE
  Grateful: {
    category: "POSITIVE",
    auraColor: "#F9E4A0",
    compassZone: "NORTH",
  },
  Calm: { category: "POSITIVE", auraColor: "#A8D5BA", compassZone: "NORTH" },
  Happy: { category: "POSITIVE", auraColor: "#F9E4A0", compassZone: "NORTH" },
  Hopeful: { category: "POSITIVE", auraColor: "#F9E4A0", compassZone: "NORTH" },
  Excited: { category: "POSITIVE", auraColor: "#F4C28A", compassZone: "EAST" },
  Loved: { category: "POSITIVE", auraColor: "#F2B5C0", compassZone: "NORTH" },
  Peaceful: {
    category: "POSITIVE",
    auraColor: "#A8D5BA",
    compassZone: "NORTH",
  },
  Relieved: {
    category: "POSITIVE",
    auraColor: "#A8D5BA",
    compassZone: "NORTH",
  },
  Elated: { category: "POSITIVE", auraColor: "#F9E4A0", compassZone: "NORTH" },
  // NEUTRAL / REFLECTIVE
  Reflective: {
    category: "NEUTRAL",
    auraColor: "#B8C4D4",
    compassZone: "WEST",
  },
  Thoughtful: {
    category: "NEUTRAL",
    auraColor: "#B8C4D4",
    compassZone: "WEST",
  },
  Uncertain: { category: "NEUTRAL", auraColor: "#B8C4D4", compassZone: "WEST" },
  Processing: {
    category: "NEUTRAL",
    auraColor: "#B8C4D4",
    compassZone: "WEST",
  },
  // DIFFICULT
  Stressed: {
    category: "DIFFICULT",
    auraColor: "#F4C28A",
    compassZone: "EAST",
  },
  Sad: { category: "DIFFICULT", auraColor: "#C3B8D8", compassZone: "SOUTH" },
  Frustrated: {
    category: "DIFFICULT",
    auraColor: "#E8A598",
    compassZone: "EAST",
  }, // soft coral — never red
  Anxious: { category: "DIFFICULT", auraColor: "#F4C28A", compassZone: "EAST" },
  Lonely: { category: "DIFFICULT", auraColor: "#C3B8D8", compassZone: "SOUTH" },
  Numb: { category: "DIFFICULT", auraColor: "#C3B8D8", compassZone: "SOUTH" },
  Overwhelmed: {
    category: "DIFFICULT",
    auraColor: "#F4C28A",
    compassZone: "EAST",
  },
  Hurt: { category: "DIFFICULT", auraColor: "#C3B8D8", compassZone: "SOUTH" },
  Broken: { category: "DIFFICULT", auraColor: "#C3B8D8", compassZone: "SOUTH" },
};

export function emotionCategory(emotionType: string): EmotionCategory {
  return EMOTION_CLASSIFICATION[emotionType]?.category ?? "NEUTRAL";
}

export function emotionAuraColor(emotionType: string): string {
  return EMOTION_CLASSIFICATION[emotionType]?.auraColor ?? "#B8C4D4";
}

export function emotionCompassZone(emotionType: string): string {
  return EMOTION_CLASSIFICATION[emotionType]?.compassZone ?? "WEST";
}

// ─── The Balance Algorithm ───
// Runs AFTER relationship priority + support urgency have been applied.
// Only reorders within the same priority group.
// Max 3 consecutive difficult posts.
import type { FeedPost } from "./feedAlgorithm";

export function applyEmotionalBalance(feed: FeedPost[]): FeedPost[] {
  const result: FeedPost[] = [];
  // Pool of remaining posts (mutable index)
  const remaining = [...feed];
  let difficultCount = 0;

  for (let i = 0; i < remaining.length; i++) {
    const post = remaining[i];
    const cat = post.emotionCategory ?? emotionCategory(post.emotionType);

    if (cat === "DIFFICULT") {
      difficultCount++;
    } else {
      difficultCount = 0;
    }

    if (difficultCount > 3) {
      // Find next POSITIVE or NEUTRAL in the SAME priority group
      const currentGroup = post.relationshipGroup;
      const insertIdx = remaining.findIndex(
        (p, idx) =>
          idx > i &&
          p.relationshipGroup === currentGroup &&
          (p.emotionCategory ?? emotionCategory(p.emotionType)) !== "DIFFICULT",
      );

      if (insertIdx !== -1) {
        // Splice that post out and insert before current
        const [inserted] = remaining.splice(insertIdx, 1);
        result.push(inserted);
        difficultCount = 1;
        // Now still process current post
        result.push(post);
        continue;
      }
      {
        // Look in next priority group
        const crossGroupIdx = remaining.findIndex(
          (p, idx) =>
            idx > i &&
            (p.emotionCategory ?? emotionCategory(p.emotionType)) !==
              "DIFFICULT",
        );
        if (crossGroupIdx !== -1) {
          const [inserted] = remaining.splice(crossGroupIdx, 1);
          result.push(inserted);
          difficultCount = 1;
          result.push(post);
          continue;
        }
        // None found — continue, reset count naturally
        difficultCount = 0;
      }
    }

    result.push(post);
  }

  return result;
}

// ─── Recovery insertion: gentle interleaving preference ───
// After every 2 difficult posts, check if a positive/neutral is available
// and naturally interleave it. Not a hard rule — a gentle preference.
export function applyRecoveryInsertion(feed: FeedPost[]): FeedPost[] {
  const result: FeedPost[] = [];
  const pool = [...feed];
  let recentDifficultCount = 0;

  for (let i = 0; i < pool.length; i++) {
    const post = pool[i];
    const cat = post.emotionCategory ?? emotionCategory(post.emotionType);

    result.push(post);

    if (cat === "DIFFICULT") {
      recentDifficultCount++;
      if (recentDifficultCount >= 2) {
        // Look for a positive/neutral within same group to naturally interleave
        const interleaveIdx = pool.findIndex(
          (p, idx) =>
            idx > i &&
            p.relationshipGroup === post.relationshipGroup &&
            (p.emotionCategory ?? emotionCategory(p.emotionType)) !==
              "DIFFICULT",
        );
        if (interleaveIdx !== -1) {
          const [toInsert] = pool.splice(interleaveIdx, 1);
          result.push(toInsert);
          recentDifficultCount = 0;
        }
      }
    } else {
      recentDifficultCount = 0;
    }
  }

  return result;
}
