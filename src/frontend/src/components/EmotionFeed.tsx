import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { AuraWrapper } from "./AuraWrapper";
import { BatchEndCard } from "./BatchEndCard";
import { EmotionCard } from "./EmotionCard";
import type { EmotionCardProps } from "./EmotionCard";
// Layer 3
import {
  applyEmotionalBalance,
  applyRecoveryInsertion,
  emotionAuraColor,
  emotionCategory,
} from "./emotionalBalance";
// Layer 2
import {
  applyGlobalModeration,
  applySessionOverloadProtection,
  detectUnansweredPosts,
} from "./emotionalSafety";
// Layer 1
import {
  FIRST_BATCH_SIZE,
  type FeedPost,
  type FeedSession,
  SUBSEQUENT_BATCH_SIZE,
  generateEmotionFeed,
  getBatch,
} from "./feedAlgorithm";

// ─── Types ───

interface EmotionEntry {
  id: string;
  emotionType: string;
  emotionLabel: string;
  emoji: string;
  textReflection?: string;
  voiceOverrideApplied: boolean;
  visibilityLevel: string;
  createdAt: bigint;
}

type Visibility = "only_me" | "inner_circle" | "friends" | "global_anonymous";

interface MockEntry {
  id: string;
  type: "inner_circle" | "friend" | "global";
  name?: string;
  initial?: string;
  avatarColor?: string;
  emotionType: string;
  emotionLabel: string;
  emoji: string;
  textReflection?: string;
  createdAt: Date;
  hasReactions?: boolean;
}

interface FeedItem {
  kind: "own" | "inner_circle" | "friend" | "global" | "balance";
  data?: EmotionEntry | MockEntry;
  id: string;
  // algorithm enrichment
  supportUrgency?: boolean; // 0 reactions + DIFFICULT
  carryingAwarenessActive?: boolean;
  unansweredNudge?: string;
}

// ─── Constants ───

const DIFFICULT = new Set([
  "stressed",
  "sad",
  "frustrated",
  "anxious",
  "lonely",
  "numb",
  "overwhelmed",
  "hurt",
  "broken",
]);
const POSITIVE = new Set([
  "grateful",
  "calm",
  "hopeful",
  "reflective",
  "happy",
  "peaceful",
  "loved",
  "relieved",
  "elated",
]);

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: string }[] =
  [
    { value: "only_me", label: "Only Me", icon: "🔒" },
    { value: "inner_circle", label: "Inner Circle", icon: "👥" },
    { value: "friends", label: "Friends", icon: "🤝" },
    { value: "global_anonymous", label: "Global (Anonymous)", icon: "🌍" },
  ];

const AVATAR_COLORS = [
  "linear-gradient(135deg, #C9B8E8 0%, #9B7FC0 100%)",
  "linear-gradient(135deg, #A8C5A0 0%, #6B9E6B 100%)",
  "linear-gradient(135deg, #F2B5C5 0%, #D47FA8 100%)",
  "linear-gradient(135deg, #B5C8E8 0%, #6B8EC0 100%)",
];

const now = new Date();
const MOCK_ENTRIES: MockEntry[] = [
  {
    id: "mock_ic_1",
    type: "inner_circle",
    name: "Anita Rao",
    initial: "A",
    avatarColor: AVATAR_COLORS[0],
    emotionType: "calm",
    emotionLabel: "Calm",
    emoji: "😌",
    textReflection: "Finally had a peaceful day after a stressful week.",
    createdAt: new Date(now.getTime() - 1.3 * 60 * 60 * 1000),
    hasReactions: true,
  },
  {
    id: "mock_ic_2",
    type: "inner_circle",
    name: "Rahul Sharma",
    initial: "R",
    avatarColor: AVATAR_COLORS[1],
    emotionType: "stressed",
    emotionLabel: "Stressed",
    emoji: "😟",
    createdAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000),
  },
  {
    id: "mock_ic_3",
    type: "inner_circle",
    name: "Maya Patel",
    initial: "M",
    avatarColor: AVATAR_COLORS[2],
    emotionType: "hopeful",
    emotionLabel: "Hopeful",
    emoji: "🌤",
    textReflection: "Small steps, but I can see the light at the end.",
    createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
  },
  {
    id: "mock_fr_1",
    type: "friend",
    name: "Priya Menon",
    initial: "P",
    avatarColor: AVATAR_COLORS[3],
    emotionType: "anxious",
    emotionLabel: "Anxious",
    emoji: "😰",
    textReflection: "Big meeting tomorrow. Trying to breathe through it.",
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
  },
  {
    id: "mock_fr_2",
    type: "friend",
    name: "Karan Mehta",
    initial: "K",
    avatarColor: AVATAR_COLORS[0],
    emotionType: "grateful",
    emotionLabel: "Grateful",
    emoji: "😊",
    textReflection: "Grateful for a quiet morning with coffee and silence.",
    createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    hasReactions: true,
  },
  {
    id: "mock_gl_1",
    type: "global",
    emotionType: "sad",
    emotionLabel: "Sad",
    emoji: "😔",
    textReflection: "Today felt very long.",
    createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
  },
  {
    id: "mock_gl_2",
    type: "global",
    emotionType: "reflective",
    emotionLabel: "Reflective",
    emoji: "💭",
    textReflection: "Thinking about what really matters. Hard to say.",
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
  },
  {
    id: "mock_gl_3",
    type: "global",
    emotionType: "lonely",
    emotionLabel: "Lonely",
    emoji: "🥀",
    createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
  },
  {
    id: "mock_gl_4",
    type: "global",
    emotionType: "calm",
    emotionLabel: "Calm",
    emoji: "😌",
    textReflection: "Just taking it one breath at a time today.",
    createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000),
  },
];

// ─── Helpers ───

function entryToDate(entry: EmotionEntry): Date {
  return new Date(Number(entry.createdAt) / 1_000_000);
}

function mockEntryToFeedPost(entry: MockEntry): FeedPost {
  const relGroup =
    entry.type === "inner_circle"
      ? ("INNER_CIRCLE_COUSINS" as const)
      : entry.type === "friend"
        ? ("FRIENDS" as const)
        : ("GLOBAL" as const);
  return {
    id: entry.id,
    authorId: entry.id,
    emotionType: entry.emotionType,
    emotionLabel: entry.emotionLabel,
    emoji: entry.emoji,
    textReflection: entry.textReflection,
    hasVoiceNote: false,
    visibilityLevel:
      entry.type === "global"
        ? "GLOBAL"
        : entry.type === "inner_circle"
          ? "INNER_CIRCLE_COUSINS"
          : "FRIENDS",
    supportReactionCount: entry.hasReactions ? 2 : 0,
    createdAt: entry.createdAt.getTime(),
    relationshipGroup: relGroup,
    isOwn: false,
    emotionCategory: emotionCategory(entry.emotionType),
  };
}

function ownEntryToFeedPost(entry: EmotionEntry): FeedPost {
  return {
    id: entry.id,
    authorId: "current_user",
    emotionType: entry.emotionType,
    emotionLabel: entry.emotionLabel,
    emoji: entry.emoji,
    textReflection: entry.textReflection,
    hasVoiceNote: entry.voiceOverrideApplied && !entry.textReflection,
    visibilityLevel: entry.visibilityLevel
      .toUpperCase()
      .replace(/ /g, "_") as FeedPost["visibilityLevel"],
    supportReactionCount: 0,
    createdAt: Number(entry.createdAt) / 1_000_000,
    relationshipGroup: "OWN",
    isOwn: true,
    emotionCategory: emotionCategory(entry.emotionType),
  };
}

function ownEntryToCardProps(
  entry: EmotionEntry,
  index: number,
): EmotionCardProps {
  const date = entryToDate(entry);
  const ageHours = (Date.now() - date.getTime()) / 3600000;
  const isDifficult = DIFFICULT.has(entry.emotionType);
  return {
    emotion_id: entry.id,
    user_id: "current_user",
    user_name: "You",
    user_avatar: null,
    is_own_post: true,
    is_anonymous: false,
    relationship_type: "INNER_CIRCLE",
    emotion_type: entry.emotionType,
    emotion_label: entry.emotionLabel,
    emotion_emoji: entry.emoji,
    emotion_text: entry.textReflection ?? null,
    has_voice_note: false,
    visibility:
      (entry.visibilityLevel.toUpperCase() as EmotionCardProps["visibility"]) ??
      "ONLY_ME",
    created_at: entryToDate(entry).toISOString(),
    current_user_reaction: null,
    reactions_exist: false,
    is_unanswered: isDifficult && ageHours > 4,
    index,
  };
}

function mockEntryToCardProps(
  entry: MockEntry,
  index: number,
  isAnonymous: boolean,
): EmotionCardProps {
  const relType: EmotionCardProps["relationship_type"] =
    entry.type === "inner_circle"
      ? "INNER_CIRCLE"
      : entry.type === "friend"
        ? "FRIENDS"
        : "GLOBAL";
  return {
    emotion_id: entry.id,
    user_id: entry.id,
    user_name: entry.name ?? "",
    user_avatar: null,
    is_own_post: false,
    is_anonymous: isAnonymous,
    relationship_type: relType,
    emotion_type: entry.emotionType,
    emotion_label: entry.emotionLabel,
    emotion_emoji: entry.emoji,
    emotion_text: entry.textReflection ?? null,
    has_voice_note: false,
    visibility: isAnonymous
      ? "GLOBAL"
      : entry.type === "inner_circle"
        ? "INNER_CIRCLE"
        : "FRIENDS",
    created_at: entry.createdAt.toISOString(),
    current_user_reaction: null,
    reactions_exist: entry.hasReactions ?? false,
    is_unanswered: false,
    index,
  };
}

// ─── Breathing Exercise ───

function BreathingExercise({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [seconds, setSeconds] = useState(30);
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  useEffect(() => {
    const cycle = ["inhale", "hold", "exhale"] as const;
    let idx = 0;
    const id = setInterval(() => {
      idx = (idx + 1) % 3;
      setPhase(cycle[idx]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const phaseText =
    phase === "inhale"
      ? "Breathe in…"
      : phase === "hold"
        ? "Hold…"
        : "Let it go…";

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #C9B8E8 0%, #A8C5A0 100%)",
          transition: prefersReduced ? "none" : "transform 2s ease-in-out",
          transform: phase === "exhale" ? "scale(0.85)" : "scale(1.2)",
          boxShadow: "0 4px 20px rgba(107,91,142,0.2)",
        }}
      >
        <span className="text-2xl">🌿</span>
      </div>
      <p
        className="text-base font-medium text-center"
        style={{ color: "#6B5B8E" }}
      >
        {phaseText}
      </p>
      {seconds > 0 && (
        <p className="text-xs" style={{ color: "#8B8097" }}>
          {seconds}s remaining
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
        }}
      >
        I’m ready
      </button>
    </div>
  );
}

// ─── Balance Card (used when no positive/neutral found) ───

function BalanceCard() {
  return (
    <div
      className="rounded-3xl p-5 flex items-start gap-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(168,197,160,0.2) 0%, rgba(201,184,232,0.2) 100%)",
        border: "1px solid rgba(168,197,160,0.3)",
      }}
    >
      <span className="text-xl mt-0.5">🌿</span>
      <p className="text-sm font-medium" style={{ color: "#6B5B8E" }}>
        Take a breath. You’re not alone in this.
      </p>
    </div>
  );
}

// ─── Session Overload Notice (Layer 2) ───

function SessionOverloadNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      data-ocid="feed.overload_notice.panel"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35 }}
      className="mb-4 rounded-2xl px-5 py-4 flex items-start justify-between gap-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(195,184,216,0.2) 0%, rgba(184,196,212,0.2) 100%)",
        border: "1px solid rgba(195,184,216,0.3)",
      }}
    >
      <p className="text-sm leading-relaxed" style={{ color: "#2D2540" }}>
        Your feed is gently adjusting — you’ve been carrying a lot today.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-all"
        style={{ color: "#8B8097", background: "rgba(195,184,216,0.2)" }}
      >
        ✕
      </button>
    </motion.div>
  );
}

// ─── Carrying Awareness Badge (Layer 1 / EIE) ───

function CarryingBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: "rgba(195,184,216,0.25)", color: "#9B7FC0" }}
      aria-label="Carrying this emotion"
    >
      Carrying this
    </span>
  );
}

// ─── Support Urgency Ring (Layer 1) ───
// Wraps a card with a subtle amber ring for 0-reaction difficult posts
function SupportUrgencyWrapper({
  children,
  active,
}: { children: React.ReactNode; active: boolean }) {
  if (!active) return <>{children}</>;
  return (
    <div
      style={{
        borderRadius: "1.5rem",
        boxShadow:
          "0 0 0 2px rgba(244,194,138,0.55), 0 2px 12px rgba(244,194,138,0.18)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Component ───

export function EmotionFeed({ onCheckIn }: { onCheckIn?: () => void }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const feedTopRef = useRef<HTMLDivElement>(null);

  // UI state
  const [heavyBannerDismissed, setHeavyBannerDismissed] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overloadNoticeDismissed, setOverloadNoticeDismissed] = useState(false);

  // Batch state (Layer 1)
  const [batchNumber, setBatchNumber] = useState(0);
  const [shownCount, setShownCount] = useState(FIRST_BATCH_SIZE);

  // Session state (Layer 2)
  const [session] = useState<FeedSession>(() => ({
    sessionDifficultCount: 0,
    sessionStart: Date.now(),
    batchNumber: 0,
    globalPostsShown: 0,
    lastFeedGenerated: Date.now(),
  }));

  // Aura environment detection
  const [colorMode, setColorMode] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const highContrast =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-contrast: more)").matches ||
        window.matchMedia("(forced-colors: active)").matches
      : false;
  const pulseTriggersRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setColorMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { data: ownEntries = [] } = useQuery<EmotionEntry[]>({
    queryKey: ["emotionEntries"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getEmotionEntries();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const filteredOwn = ownEntries.filter(
    (e) => !(e.voiceOverrideApplied && !e.textReflection),
  );

  const sortedOwn = [...filteredOwn].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  const isHeavySession =
    sortedOwn.length >= 5 &&
    sortedOwn.every((e) => DIFFICULT.has(e.emotionType));

  const sevenDaysAgo = Date.now() - 7 * 24 * 3600000;
  const recentPositive = sortedOwn.some(
    (e) =>
      POSITIVE.has(e.emotionType) &&
      Number(e.createdAt) / 1_000_000 > sevenDaysAgo,
  );
  const showPositivePrompt = sortedOwn.length > 0 && !recentPositive;

  // All algorithm pipeline + unanswered detection computed together
  const { processedFeed, hasMore, unansweredIds } = useMemo(() => {
    const ownFeedPosts = sortedOwn.map(ownEntryToFeedPost);
    // Layer 2: unanswered post detection
    const unanswered = detectUnansweredPosts(ownFeedPosts);
    const unansweredSet = new Set(unanswered.map((u) => u.post.id));

    // Full pipeline: Layers 1–3 applied in sequence
    // Convert mock entries to FeedPosts
    const mockFeedPosts: FeedPost[] = MOCK_ENTRIES.map(mockEntryToFeedPost);
    const allPosts: FeedPost[] = [...ownFeedPosts, ...mockFeedPosts];

    // Layer 2: Global moderation
    const moderated = applyGlobalModeration(allPosts);

    // Layer 1: Feed generation (priority + urgency ranking)
    const { feed } = generateEmotionFeed("current_user", moderated, session, {
      cousins: ["mock_ic_1", "mock_ic_2", "mock_ic_3"],
      closestFriends: [],
      friends: ["mock_fr_1", "mock_fr_2"],
    });

    // Layer 3: Recovery insertion (gentle interleaving)
    const recovered = applyRecoveryInsertion(feed);

    // Layer 3: Emotional balance (3-consecutive cap)
    const balanced = applyEmotionalBalance(recovered);

    // Layer 2: Session overload protection
    // Count difficult posts in current balanced feed (for session protection)
    const sessionDifficultCount = balanced.filter(
      (p) => (p.emotionCategory ?? "NEUTRAL") === "DIFFICULT",
    ).length;
    const protected_ = applySessionOverloadProtection(
      balanced,
      session,
      sessionDifficultCount,
    );

    // Get current batch
    const { hasMore: more } = getBatch(protected_, batchNumber, 0);
    const batchSize =
      batchNumber === 0 ? FIRST_BATCH_SIZE : SUBSEQUENT_BATCH_SIZE;
    const shown = protected_.slice(
      0,
      Math.min(shownCount, batchSize * (batchNumber + 1)),
    );

    return {
      processedFeed: shown,
      hasMore: more || shownCount < protected_.length,
      unansweredIds: unansweredSet,
    };
  }, [sortedOwn, batchNumber, shownCount, session]);

  useEffect(() => {
    const id = setTimeout(() => setShowNewPostsBanner(true), 10000);
    return () => clearTimeout(id);
  }, []);

  // Track difficult posts viewed in this session (derived, no effect needed)
  const isOverloaded =
    processedFeed.filter(
      (p) =>
        (p.emotionCategory ?? emotionCategory(p.emotionType)) === "DIFFICULT",
    ).length >= 5;

  async function handleRefresh() {
    setIsRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["emotionEntries"] });
    setTimeout(() => setIsRefreshing(false), 800);
  }

  function scrollToTop() {
    feedTopRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewPostsBanner(false);
  }

  function handleSeeMore() {
    setBatchNumber((n) => n + 1);
    setShownCount((c) => c + SUBSEQUENT_BATCH_SIZE);
  }

  function handlePutItDown() {
    // Navigate to Quiet Moment / dismiss — scroll to top and show Veil is here message
    scrollToTop();
  }

  // Convert FeedPost back to a render-able FeedItem with enrichment
  function feedPostToItem(post: FeedPost): FeedItem {
    const mockData = MOCK_ENTRIES.find((m) => m.id === post.id);
    const ownData = sortedOwn.find((e) => e.id === post.id);
    const kind = post.isOwn
      ? "own"
      : post.relationshipGroup === "GLOBAL"
        ? "global"
        : post.relationshipGroup.startsWith("INNER_CIRCLE")
          ? "inner_circle"
          : "friend";

    return {
      kind: kind as FeedItem["kind"],
      data: ownData ?? mockData,
      id: post.id,
      supportUrgency:
        post.supportReactionCount === 0 &&
        (post.emotionCategory ?? emotionCategory(post.emotionType)) ===
          "DIFFICULT",
      carryingAwarenessActive: post.carryingAwarenessActive ?? false,
      unansweredNudge: unansweredIds.has(post.id)
        ? "No reactions yet — your feelings are still valid."
        : undefined,
    };
  }

  const feedItems: FeedItem[] = processedFeed.map((p) => feedPostToItem(p));
  const showBatchEndCard = feedItems.length > 0 && !hasMore;
  const reachedBatchEnd =
    feedItems.length > 0 &&
    feedItems.length >=
      (batchNumber === 0
        ? FIRST_BATCH_SIZE
        : FIRST_BATCH_SIZE + batchNumber * SUBSEQUENT_BATCH_SIZE);

  return (
    <section className="px-5 pb-8" data-ocid="feed.section">
      <div className="flex items-center justify-between mb-4" ref={feedTopRef}>
        <h2
          className="font-serif text-base font-semibold"
          style={{ color: "#2D2540" }}
        >
          Your Circle
        </h2>
        <button
          data-ocid="feed.secondary_button"
          type="button"
          aria-label="Refresh feed"
          onClick={handleRefresh}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
          style={{ backgroundColor: "rgba(201,184,232,0.2)" }}
        >
          <RefreshCw
            size={16}
            style={{ color: "#6B5B8E" }}
            className={isRefreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* New posts banner */}
      <AnimatePresence>
        {showNewPostsBanner && (
          <motion.button
            data-ocid="feed.toast"
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            className="w-full mb-3 py-3 rounded-2xl text-sm font-medium text-center transition-all"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,197,160,0.25) 0%, rgba(201,184,232,0.25) 100%)",
              border: "1px solid rgba(168,197,160,0.35)",
              color: "#6B5B8E",
            }}
          >
            🌿 New support from your circle
          </motion.button>
        )}
      </AnimatePresence>

      {/* Layer 2: Session overload notice */}
      <AnimatePresence>
        {isOverloaded && !overloadNoticeDismissed && (
          <SessionOverloadNotice
            onDismiss={() => setOverloadNoticeDismissed(true)}
          />
        )}
      </AnimatePresence>

      {/* Heavy session breathing card */}
      <AnimatePresence>
        {isHeavySession && !heavyBannerDismissed && (
          <motion.div
            data-ocid="feed.panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="mb-4 rounded-3xl p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(242,181,197,0.2) 0%, rgba(201,184,232,0.2) 100%)",
              border: "1px solid rgba(242,181,197,0.35)",
            }}
          >
            <p
              className="text-sm font-medium mb-3"
              style={{ color: "#2D2540" }}
            >
              You’ve been carrying a lot lately. Take a moment for yourself
              today.
            </p>
            {showBreathing ? (
              <BreathingExercise onClose={() => setShowBreathing(false)} />
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  data-ocid="feed.secondary_button"
                  type="button"
                  onClick={() => setHeavyBannerDismissed(true)}
                  className="w-full py-2.5 rounded-2xl text-xs font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: "rgba(201,184,232,0.2)",
                    color: "#8B8097",
                  }}
                >
                  I’m okay, keep going
                </button>
                <button
                  data-ocid="feed.primary_button"
                  type="button"
                  onClick={() => setShowBreathing(true)}
                  className="w-full py-2.5 rounded-2xl text-xs font-medium text-white transition-all active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
                  }}
                >
                  Take a quiet moment →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Positive check-in prompt */}
      {showPositivePrompt && (
        <motion.div
          data-ocid="feed.card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4 rounded-3xl p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,184,232,0.15) 0%, rgba(168,197,160,0.15) 100%)",
            border: "1px solid rgba(201,184,232,0.25)",
          }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "#2D2540" }}>
            How are you doing today? Even small things count.
          </p>
          <button
            data-ocid="feed.primary_button"
            type="button"
            onClick={onCheckIn}
            className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
            }}
          >
            Check in now →
          </button>
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
        {feedItems.length === 0 ? (
          <motion.div
            data-ocid="feed.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl p-8 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,197,160,0.15) 0%, rgba(201,184,232,0.15) 100%)",
              border: "1px dashed rgba(201,184,232,0.4)",
            }}
          >
            <span className="text-3xl block mb-3">🌿</span>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: "#2D2540" }}
            >
              Your feed is quiet right now.
              <br />
              <br />
              The people you trust will appear here when they share something.
              <br />
              <br />
              In the meantime — how are you feeling today?
            </p>
            <button
              data-ocid="feed.primary_button"
              type="button"
              onClick={onCheckIn}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
              }}
            >
              Check in with yourself →
            </button>
          </motion.div>
        ) : (
          feedItems.map((item, i) => {
            if (item.kind === "balance") {
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <BalanceCard />
                </motion.div>
              );
            }

            if (item.kind === "own") {
              const entryData = item.data as EmotionEntry;
              if (!entryData) return null;
              const cardProps = ownEntryToCardProps(entryData, i);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  {/* Layer 2: Unanswered nudge */}
                  {item.unansweredNudge && (
                    <p
                      className="text-xs font-medium mb-1.5 px-1"
                      style={{ color: "#9B7FC0" }}
                    >
                      {item.unansweredNudge}
                    </p>
                  )}
                  {/* Layer 1: Carrying awareness badge */}
                  {item.carryingAwarenessActive && (
                    <div className="mb-1.5 px-1">
                      <CarryingBadge />
                    </div>
                  )}
                  {/* Layer 1: Support urgency ring for 0-reaction difficult posts */}
                  <SupportUrgencyWrapper active={!!item.supportUrgency}>
                    <AuraWrapper
                      emotion_type={cardProps.emotion_type}
                      is_own_post={true}
                      is_anonymous={false}
                      color_mode={colorMode}
                      reduce_motion={reduceMotion}
                      high_contrast={highContrast}
                      onReactionPulse={(trigger) =>
                        pulseTriggersRef.current.set(item.id, trigger)
                      }
                    >
                      <EmotionCard
                        {...cardProps}
                        onReact={(id, reaction) => {
                          pulseTriggersRef.current.get(item.id)?.();
                          cardProps.onReact?.(id, reaction);
                        }}
                      />
                    </AuraWrapper>
                  </SupportUrgencyWrapper>
                </motion.div>
              );
            }

            if (item.kind === "inner_circle" || item.kind === "friend") {
              const mockData = item.data as MockEntry;
              if (!mockData) return null;
              const cardProps = mockEntryToCardProps(mockData, i, false);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  {item.carryingAwarenessActive && (
                    <div className="mb-1.5 px-1">
                      <CarryingBadge />
                    </div>
                  )}
                  <SupportUrgencyWrapper active={!!item.supportUrgency}>
                    <AuraWrapper
                      emotion_type={cardProps.emotion_type}
                      is_own_post={false}
                      is_anonymous={false}
                      color_mode={colorMode}
                      reduce_motion={reduceMotion}
                      high_contrast={highContrast}
                      onReactionPulse={(trigger) =>
                        pulseTriggersRef.current.set(item.id, trigger)
                      }
                    >
                      <EmotionCard
                        {...cardProps}
                        onReact={(id, reaction) => {
                          pulseTriggersRef.current.get(item.id)?.();
                          cardProps.onReact?.(id, reaction);
                        }}
                      />
                    </AuraWrapper>
                  </SupportUrgencyWrapper>
                </motion.div>
              );
            }

            if (item.kind === "global") {
              const mockData = item.data as MockEntry;
              if (!mockData) return null;
              const cardProps = mockEntryToCardProps(mockData, i, true);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <SupportUrgencyWrapper active={!!item.supportUrgency}>
                    <AuraWrapper
                      emotion_type={cardProps.emotion_type}
                      is_own_post={false}
                      is_anonymous={true}
                      color_mode={colorMode}
                      reduce_motion={reduceMotion}
                      high_contrast={highContrast}
                      onReactionPulse={(trigger) =>
                        pulseTriggersRef.current.set(item.id, trigger)
                      }
                    >
                      <EmotionCard
                        {...cardProps}
                        onReact={(id, reaction) => {
                          pulseTriggersRef.current.get(item.id)?.();
                          cardProps.onReact?.(id, reaction);
                        }}
                      />
                    </AuraWrapper>
                  </SupportUrgencyWrapper>
                </motion.div>
              );
            }

            return null;
          })
        )}

        {/* Batch End Card (Layer 1) — after each batch */}
        {(reachedBatchEnd || showBatchEndCard) && feedItems.length > 0 && (
          <BatchEndCard
            onSeeMore={handleSeeMore}
            onPutItDown={handlePutItDown}
          />
        )}
      </div>
    </section>
  );
}

// Keep VISIBILITY_OPTIONS exported for any future reuse
export { VISIBILITY_OPTIONS };
