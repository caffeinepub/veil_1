// ═══════════════════════════════════════════════════════════════
// VEIL — LAYER 2: EMOTIONAL SAFETY SYSTEM
// Session overload protection, crisis detection, unanswered post detection
// ═══════════════════════════════════════════════════════════════

import { emotionCategory } from "./emotionalBalance";
import type { FeedPost, FeedSession } from "./feedAlgorithm";

export const SESSION_OVERLOAD_THRESHOLD = 5; // 5+ difficult posts triggers protection

export interface SafetyState {
  sessionDifficultCount: number;
  overloadProtectionActive: boolean;
  crisisPostsDetected: string[]; // post IDs
}

// ─── Apply session overload protection ───
// If 5+ difficult posts viewed this session, temporarily reduce difficult posts
// until next batch. Reset at session/batch boundary.
export function applySessionOverloadProtection(
  feed: FeedPost[],
  _session: FeedSession,
  viewedDifficultCountThisSession: number,
): FeedPost[] {
  if (viewedDifficultCountThisSession < SESSION_OVERLOAD_THRESHOLD) {
    return feed;
  }
  // Protection active: move difficult posts toward the end, surface positive/neutral first
  const positiveNeutral = feed.filter(
    (p) =>
      (p.emotionCategory ?? emotionCategory(p.emotionType)) !== "DIFFICULT",
  );
  const difficult = feed.filter(
    (p) =>
      (p.emotionCategory ?? emotionCategory(p.emotionType)) === "DIFFICULT",
  );
  return [...positiveNeutral, ...difficult];
}

// ─── Unanswered post detection ───
// Posts that are 2+ hours old, difficult, shared with inner circle/friends,
// and have zero reactions — these need visibility boost + quiet nudge
export interface UnansweredPost {
  post: FeedPost;
  hoursUnanswered: number;
  nudgeMessage: string;
}

export function detectUnansweredPosts(
  posts: FeedPost[],
  nowMs: number = Date.now(),
): UnansweredPost[] {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  return posts
    .filter((p) => {
      const ageMs = nowMs - p.createdAt;
      const isDifficult =
        (p.emotionCategory ?? emotionCategory(p.emotionType)) === "DIFFICULT";
      const isSharedWithCircle =
        p.visibilityLevel !== "ONLY_ME" && p.visibilityLevel !== "GLOBAL";
      return (
        ageMs >= TWO_HOURS_MS &&
        isDifficult &&
        p.supportReactionCount === 0 &&
        isSharedWithCircle
      );
    })
    .map((p) => ({
      post: p,
      hoursUnanswered: Math.floor((nowMs - p.createdAt) / (1000 * 60 * 60)),
      nudgeMessage: "No reactions yet — your feelings are still valid.",
    }));
}

// ─── Crisis detection at feed level ───
// HIGH intensity posts from Inner Circle surface warm notification
// Global high-intensity posts shown normally (privacy protected)
export function getCrisisAwarenessPosts(feed: FeedPost[]): FeedPost[] {
  return feed.filter(
    (p) =>
      p.crisisSignalDetected && p.relationshipGroup !== "GLOBAL" && !p.isOwn,
  );
}

// ─── Global content moderation filter ───
// In production: async API call. Here: client-side keyword heuristic
// for demo purposes. Real moderation runs server-side before feed pool inclusion.
const MODERATION_KEYWORDS = [
  "kill myself",
  "end it all",
  "want to die",
  "hurt someone",
  "abuse",
  "hate you",
];

export function passesGlobalModeration(post: FeedPost): boolean {
  if (post.visibilityLevel !== "GLOBAL") return true;
  const text = (post.textReflection ?? "").toLowerCase();
  return !MODERATION_KEYWORDS.some((kw) => text.includes(kw));
}

export function applyGlobalModeration(feed: FeedPost[]): FeedPost[] {
  return feed.filter((p) => passesGlobalModeration(p));
}
