import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { AuraWrapper } from "./AuraWrapper";
import { EmotionCard } from "./EmotionCard";
import type { EmotionCardProps } from "./EmotionCard";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULT = new Set([
  "stressed",
  "sad",
  "frustrated",
  "anxious",
  "lonely",
  "numb",
]);
const POSITIVE = new Set(["grateful", "calm", "hopeful", "reflective"]);

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entryToDate(entry: EmotionEntry): Date {
  return new Date(Number(entry.createdAt) / 1_000_000);
}

function applyEmotionalBalance(items: FeedItem[]): FeedItem[] {
  const result: FeedItem[] = [];
  let consecutiveDifficult = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const emotionType =
      item.kind === "own"
        ? (item.data as EmotionEntry)?.emotionType
        : item.kind === "inner_circle" ||
            item.kind === "friend" ||
            item.kind === "global"
          ? (item.data as MockEntry)?.emotionType
          : undefined;

    const isDifficult = emotionType ? DIFFICULT.has(emotionType) : false;

    if (isDifficult) {
      consecutiveDifficult++;
      result.push(item);

      if (consecutiveDifficult >= 3) {
        let swapped = false;
        for (let j = i + 1; j < items.length; j++) {
          const ahead = items[j];
          const aheadType =
            ahead.kind === "own"
              ? (ahead.data as EmotionEntry)?.emotionType
              : (ahead.data as MockEntry)?.emotionType;
          if (aheadType && POSITIVE.has(aheadType)) {
            result.push(ahead);
            items.splice(j, 1);
            swapped = true;
            break;
          }
        }
        if (!swapped) {
          result.push({ kind: "balance", id: `balance_${i}` });
        }
        consecutiveDifficult = 0;
      }
    } else {
      consecutiveDifficult = 0;
      result.push(item);
    }
  }

  return result;
}

// ─── Breathing Exercise ───────────────────────────────────────────────────

function BreathingExercise({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [seconds, setSeconds] = useState(30);
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  useEffect(() => {
    const phases: Array<{
      name: "inhale" | "hold" | "exhale";
      duration: number;
    }> = [
      { name: "inhale", duration: 4000 },
      { name: "hold", duration: 2000 },
      { name: "exhale", duration: 4000 },
    ];
    let idx = 0;
    const cyclePhase = () => {
      idx = (idx + 1) % phases.length;
      setPhase(phases[idx].name);
      return phases[idx].duration;
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const dur = cyclePhase();
      timeoutId = setTimeout(schedule, dur);
    };
    timeoutId = setTimeout(schedule, phases[0].duration);

    const countdownId = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(countdownId);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(countdownId);
    };
  }, []);

  const phaseText =
    phase === "inhale"
      ? "Breathe in..."
      : phase === "hold"
        ? "Hold..."
        : "Breathe out...";

  return (
    <div className="py-6 flex flex-col items-center gap-5">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 120, height: 120 }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,184,232,0.2), rgba(168,197,160,0.1))",
            transition: prefersReduced ? "none" : "transform 2s ease-in-out",
            transform: phase === "exhale" ? "scale(0.9)" : "scale(1.15)",
          }}
        />
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            background: "linear-gradient(135deg, #C9B8E8 0%, #A8C5A0 100%)",
            transition: prefersReduced ? "none" : "transform 2s ease-in-out",
            transform: phase === "exhale" ? "scale(0.85)" : "scale(1.2)",
            boxShadow: "0 4px 20px rgba(107,91,142,0.2)",
          }}
        >
          <span className="text-2xl">🌿</span>
        </div>
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
        I&apos;m ready
      </button>
    </div>
  );
}

// ─── Balance Card ─────────────────────────────────────────────────────────────────

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
        Take a breath. You&apos;re not alone in this.
      </p>
    </div>
  );
}

// ─── Mappers: EmotionEntry / MockEntry → EmotionCardProps ────────────────────────

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
    created_at: date.toISOString(),
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

// ─── Main Component ─────────────────────────────────────────────────────────────────

export function EmotionFeed({ onCheckIn }: { onCheckIn?: () => void }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const feedTopRef = useRef<HTMLDivElement>(null);

  const [heavyBannerDismissed, setHeavyBannerDismissed] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    const id = setTimeout(() => setShowNewPostsBanner(true), 10000);
    return () => clearTimeout(id);
  }, []);

  const ownItems: FeedItem[] = sortedOwn.map((e) => ({
    kind: "own",
    data: e,
    id: e.id,
  }));

  const innerCircleItems: FeedItem[] = MOCK_ENTRIES.filter(
    (e) => e.type === "inner_circle",
  )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((e) => ({ kind: "inner_circle", data: e, id: e.id }));

  const friendItems: FeedItem[] = MOCK_ENTRIES.filter(
    (e) => e.type === "friend",
  )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((e) => ({ kind: "friend", data: e, id: e.id }));

  const globalItems: FeedItem[] = MOCK_ENTRIES.filter(
    (e) => e.type === "global",
  )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((e) => ({ kind: "global", data: e, id: e.id }));

  const rawFeed = [...innerCircleItems, ...friendItems, ...globalItems];
  const balancedFeed = applyEmotionalBalance(rawFeed);
  const fullFeed = [...ownItems, ...balancedFeed];

  async function handleRefresh() {
    setIsRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["emotionEntries"] });
    setTimeout(() => setIsRefreshing(false), 800);
  }

  function scrollToTop() {
    feedTopRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewPostsBanner(false);
  }

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
              You&apos;ve been carrying a lot lately. Take a moment for yourself
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
                  I&apos;m okay, keep going
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
        {fullFeed.length === 0 ? (
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
          fullFeed.map((item, i) => {
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
              const cardProps = ownEntryToCardProps(
                item.data as EmotionEntry,
                i,
              );
              return (
                <AuraWrapper
                  key={item.id}
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
              );
            }

            if (item.kind === "inner_circle" || item.kind === "friend") {
              const cardProps = mockEntryToCardProps(
                item.data as MockEntry,
                i,
                false,
              );
              return (
                <AuraWrapper
                  key={item.id}
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
              );
            }

            if (item.kind === "global") {
              const cardProps = mockEntryToCardProps(
                item.data as MockEntry,
                i,
                true,
              );
              return (
                <AuraWrapper
                  key={item.id}
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
              );
            }

            return null;
          })
        )}
      </div>
    </section>
  );
}

// Keep VISIBILITY_OPTIONS exported for any future reuse
export { VISIBILITY_OPTIONS };
