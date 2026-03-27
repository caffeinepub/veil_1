// ═══════════════════════════════════════════════════════════════
// VEIL — LAYER 1: FEED ALGORITHM
// Priority hierarchy, inverted support boost, carrying awareness,
// batch structure, global post limits
// ═══════════════════════════════════════════════════════════════

import { type EmotionCategory, emotionCategory } from "./emotionalBalance";

export type VisibilityLevel =
  | "ONLY_ME"
  | "INNER_CIRCLE_COUSINS"
  | "INNER_CIRCLE_FRIENDS"
  | "INNER_CIRCLE_BOTH"
  | "FRIENDS"
  | "GLOBAL";

export type RelationshipGroup =
  | "OWN"
  | "INNER_CIRCLE_COUSINS"
  | "INNER_CIRCLE_FRIENDS"
  | "FRIENDS"
  | "GLOBAL";

export interface FeedPost {
  id: string;
  authorId: string;
  emotionType: string;
  emotionLabel: string;
  emoji: string;
  textReflection?: string;
  hasVoiceNote: boolean;
  visibilityLevel: VisibilityLevel;
  supportReactionCount: number;
  createdAt: number; // unix ms
  relationshipGroup: RelationshipGroup;
  isOwn: boolean;
  // EIE enrichment
  carryingAwarenessActive?: boolean; // 3+ days same difficult emotion
  crisisSignalDetected?: boolean;
  isModerationPending?: boolean;
  // derived by algorithm
  priorityScore?: number;
  emotionCategory?: EmotionCategory;
}

export interface FeedSession {
  sessionDifficultCount: number;
  sessionStart: number;
  batchNumber: number;
  globalPostsShown: number;
  lastFeedGenerated: number;
}

export const FIRST_BATCH_SIZE = 12;
export const SUBSEQUENT_BATCH_SIZE = 8;
export const MAX_GLOBAL_PER_SESSION = 3;

// ─── Relationship priority (lower = higher priority) ───
const GROUP_PRIORITY: Record<RelationshipGroup, number> = {
  OWN: 0,
  INNER_CIRCLE_COUSINS: 1,
  INNER_CIRCLE_FRIENDS: 2,
  FRIENDS: 3,
  GLOBAL: 4,
};

// ─── Inverted support urgency boost ───
function supportUrgencyBoost(reactionCount: number): number {
  if (reactionCount === 0) return 300;
  if (reactionCount === 1) return 200;
  if (reactionCount === 2) return 100;
  return 0; // 3+ already supported
}

// ─── Carrying awareness boost ───
function carryingAwarenessBoost(post: FeedPost): number {
  const cat = emotionCategory(post.emotionType);
  if (cat === "DIFFICULT" && post.carryingAwarenessActive) return 150;
  return 0;
}

// ─── Compute per-post priority score ───
function computePriorityScore(post: FeedPost, nowMs: number): number {
  // Recency: freshest emotion most urgent
  // Decay over 48h — posts within 2h get max recency score
  const ageMs = nowMs - post.createdAt;
  const ageHours = ageMs / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 1000 - ageHours * 8);

  return (
    recencyScore +
    supportUrgencyBoost(post.supportReactionCount) +
    carryingAwarenessBoost(post)
  );
}

// ─── STEP 1-13: Full feed generation pipeline ───
export function generateEmotionFeed(
  _userId: string,
  allPosts: FeedPost[],
  session: FeedSession,
  userRelationships: {
    cousins: string[];
    closestFriends: string[];
    friends: string[];
  },
): { feed: FeedPost[]; updatedSession: FeedSession } {
  const nowMs = Date.now();

  // STEP 5-6: Filter voice note posts and ONLY_ME posts from others
  let eligible = allPosts.filter((p) => {
    if (p.hasVoiceNote) return false; // RULE 7 — voice notes never in feed
    if (!p.isOwn && p.visibilityLevel === "ONLY_ME") return false;
    if (p.crisisSignalDetected) return false; // crisis handled separately
    if (p.isModerationPending) return false;
    return true;
  });

  // STEP 7: Assign relationship group and enforce visibility rules
  eligible = eligible
    .map((p) => {
      if (p.isOwn)
        return { ...p, relationshipGroup: "OWN" as RelationshipGroup };

      const isCousinOf = userRelationships.cousins.includes(p.authorId);
      const isCloseFriendOf = userRelationships.closestFriends.includes(
        p.authorId,
      );
      const isFriendOf = userRelationships.friends.includes(p.authorId);

      // Enforce visibility
      if (p.visibilityLevel === "INNER_CIRCLE_COUSINS") {
        if (!isCousinOf) return null as unknown as FeedPost;
        return {
          ...p,
          relationshipGroup: "INNER_CIRCLE_COUSINS" as RelationshipGroup,
        };
      }
      if (p.visibilityLevel === "INNER_CIRCLE_FRIENDS") {
        if (!isCloseFriendOf) return null as unknown as FeedPost;
        return {
          ...p,
          relationshipGroup: "INNER_CIRCLE_FRIENDS" as RelationshipGroup,
        };
      }
      if (p.visibilityLevel === "INNER_CIRCLE_BOTH") {
        if (!isCousinOf && !isCloseFriendOf) return null as unknown as FeedPost;
        return {
          ...p,
          relationshipGroup: (isCousinOf
            ? "INNER_CIRCLE_COUSINS"
            : "INNER_CIRCLE_FRIENDS") as RelationshipGroup,
        };
      }
      if (p.visibilityLevel === "FRIENDS") {
        if (!isFriendOf && !isCousinOf && !isCloseFriendOf)
          return null as unknown as FeedPost;
        return { ...p, relationshipGroup: "FRIENDS" as RelationshipGroup };
      }
      if (p.visibilityLevel === "GLOBAL") {
        return { ...p, relationshipGroup: "GLOBAL" as RelationshipGroup };
      }
      return null as unknown as FeedPost;
    })
    .filter(Boolean);

  // STEP 4: Apply global session limit
  let globalShown = session.globalPostsShown;
  eligible = eligible.filter((p) => {
    if (p.relationshipGroup === "GLOBAL") {
      if (globalShown >= MAX_GLOBAL_PER_SESSION) return false;
      globalShown++;
      return true;
    }
    return true;
  });

  // STEP 8: Enrich with priority scores and emotion category
  eligible = eligible.map((p) => ({
    ...p,
    emotionCategory: emotionCategory(p.emotionType),
    priorityScore: computePriorityScore(p, nowMs),
  }));

  // STEP 7+8: Sort by group priority first, then priority score within group
  eligible.sort((a, b) => {
    const groupDiff =
      GROUP_PRIORITY[a.relationshipGroup] - GROUP_PRIORITY[b.relationshipGroup];
    if (groupDiff !== 0) return groupDiff;
    return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
  });

  return {
    feed: eligible,
    updatedSession: {
      ...session,
      globalPostsShown: globalShown,
      lastFeedGenerated: nowMs,
    },
  };
}

// ─── Get one batch from the full feed ───
export function getBatch(
  feed: FeedPost[],
  batchNumber: number,
  offset: number,
): { batch: FeedPost[]; hasMore: boolean } {
  const size = batchNumber === 0 ? FIRST_BATCH_SIZE : SUBSEQUENT_BATCH_SIZE;
  const batch = feed.slice(offset, offset + size);
  return { batch, hasMore: offset + size < feed.length };
}
