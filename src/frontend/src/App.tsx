import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookHeart,
  BookOpen,
  Check,
  Flame,
  Home,
  Loader2,
  PenLine,
  Pencil,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { JournalEntry, Reflection, Stats, UserProfile } from "./backend";
import type { ApologyEntry, ApologySchedule } from "./backend";
import { ApologyCreationFlow } from "./components/ApologyCreationFlow";
import { CelebrationFlow, HardDayDelivery } from "./components/CelebrationFlow";
import { CompanionCard } from "./components/CompanionCard";
import { ConfessFlow } from "./components/ConfessFlow";
import { EIConsentModal } from "./components/EIConsentModal";
import { EISettingsPanel, getEISettings } from "./components/EISettingsPanel";
import { EmotionCheckIn } from "./components/EmotionCheckIn";
import { EmotionFeed } from "./components/EmotionFeed";
import { LoveLetterFlow } from "./components/LoveLetterFlow";
import MyJournalTab from "./components/MyJournalTab";
import { ProfileTab } from "./components/ProfileTab";
import {
  QuickReleaseOnboarding,
  shouldShowQROnboarding,
} from "./components/QuickReleaseOnboarding";
import { QuickReleaseScreen } from "./components/QuickReleaseScreen";
import { QuickReleaseSettings } from "./components/QuickReleaseSettings";
import { QuietMomentScreen } from "./components/QuietMomentScreen";
import { ReceiverApologyView } from "./components/ReceiverApologyView";
import { ReflectionsTab } from "./components/ReflectionsTab";
import { TransformationArcFlow } from "./components/TransformationArcFlow";
import { VeilVoiceOverlay } from "./components/VeilVoiceOverlay";
import { VoiceOnboarding } from "./components/VoiceOnboarding";
import { VoiceSettingsPanel } from "./components/VoiceSettingsPanel";
import { VeilVoiceProvider } from "./contexts/VeilVoiceContext";
import { useActor } from "./hooks/useActor";
import { detectEmotion } from "./lib/emotionDetection";
import type { EmotionType } from "./lib/emotionDetection";
import { classifyPositiveEmotion } from "./lib/positiveEmotionDetection";
import type {
  MilestoneLevel,
  PositiveEmotionType,
} from "./lib/positiveEmotionDetection";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUOTES = [
  {
    text: "You are allowed to be both a masterpiece and a work in progress simultaneously.",
    author: "Sophia Bush",
  },
  {
    text: "Healing is not linear. Be patient with yourself.",
    author: "Unknown",
  },
  {
    text: "Your feelings are valid. Every single one of them.",
    author: "Unknown",
  },
  {
    text: "The act of writing is the act of discovering what you believe.",
    author: "David Hare",
  },
  {
    text: "In the middle of difficulty lies opportunity for growth.",
    author: "Adapted",
  },
  {
    text: "You deserve the same compassion you give to others.",
    author: "Unknown",
  },
  {
    text: "Breathing in, I calm my body. Breathing out, I smile.",
    author: "Thich Nhat Hanh",
  },
];

const MOODS = [
  { key: "calm", emoji: "😌", label: "Calm", color: "#A8C5A0" },
  { key: "anxious", emoji: "😰", label: "Anxious", color: "#F2B5C5" },
  { key: "happy", emoji: "😊", label: "Happy", color: "#F7E6A0" },
  { key: "sad", emoji: "😢", label: "Sad", color: "#B5C8E8" },
  { key: "grateful", emoji: "🙏", label: "Grateful", color: "#C9B8E8" },
  { key: "hopeful", emoji: "🌟", label: "Hopeful", color: "#F5C5A0" },
  { key: "tired", emoji: "😴", label: "Tired", color: "#D4C5B5" },
  { key: "angry", emoji: "😤", label: "Angry", color: "#E8A5A5" },
];

type Tab = "home" | "write" | "journal" | "reflections" | "profile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMoodInfo(key: string) {
  return (
    MOODS.find((m) => m.key === key) ?? {
      emoji: "💭",
      label: key,
      color: "#C9B8E8",
    }
  );
}

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function todayQuote(): { text: string; author: string } {
  const day = new Date().getDay();
  return QUOTES[day % QUOTES.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MoodChip({
  mood,
  selected,
  onClick,
}: {
  mood: (typeof MOODS)[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-200 select-none"
      style={{
        backgroundColor: selected ? mood.color : `${mood.color}40`,
        color: "#2D2540",
        border: selected ? `2px solid ${mood.color}` : "2px solid transparent",
        boxShadow: selected ? `0 2px 8px ${mood.color}60` : "none",
        transform: selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      <span>{mood.emoji}</span>
      <span>{mood.label}</span>
    </button>
  );
}

// ─── Tab: Home ────────────────────────────────────────────────────────────────

function HomeTab({
  onNavigate,
  profile,
  entries,
  onPostSuccess,
  onDumpComplete,
}: {
  onNavigate: (tab: Tab) => void;
  profile: UserProfile | null | undefined;
  entries: JournalEntry[] | undefined;
  onPostSuccess?: (data: {
    emotion_type: string;
    emotion_label: string;
    emotion_emoji: string;
    visibility: string;
    source: "emotion_checkin";
    crisis_signal_detected: boolean;
  }) => void;
  onDumpComplete?: (
    textContent: string | null,
    dumpType: "voice" | "text",
  ) => void;
}) {
  const quote = todayQuote();
  const name = profile?.displayName;
  const recent = (entries ?? [])
    .slice()
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .slice(0, 3);

  return (
    <div className="animate-fade-in pb-6">
      {/* Header gradient */}
      <div
        className="rounded-b-3xl px-6 pt-12 pb-8 mb-6"
        style={{
          background: "linear-gradient(135deg, #C9B8E8 0%, #F2B5C5 100%)",
        }}
      >
        <p className="text-sm font-medium text-veil-purple/70 mb-1">
          Good {getTimeOfDay()}
        </p>
        <h1 className="font-serif text-2xl font-semibold text-veil-text">
          {name ? `Hello, ${name} 🌿` : "Welcome back 🌿"}
        </h1>
        <p className="text-sm text-veil-text/70 mt-1">
          How are you feeling today?
        </p>
      </div>

      {/* Companion Card — emotional release feature */}
      <CompanionCard onDumpComplete={onDumpComplete} />

      {/* Emotion Check-In — Component 2 */}
      <EmotionCheckIn onPostSuccess={onPostSuccess} />

      {/* Emotion Feed — Component 3 */}
      <EmotionFeed onCheckIn={() => onNavigate("write")} />

      <div className="px-5 space-y-5">
        {/* Mood check-in */}
        <section
          data-ocid="home.section"
          className="bg-white rounded-3xl p-5 shadow-soft"
        >
          <h2 className="font-serif text-base font-semibold text-veil-text mb-4">
            Quick Mood Check-in
          </h2>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.key}
                type="button"
                onClick={() => onNavigate("write")}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: `${mood.color}40` }}
              >
                <span className="text-xl">{mood.emoji}</span>
                <span className="text-xs font-medium text-veil-muted">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section
          className="rounded-3xl p-5"
          style={{
            background: "linear-gradient(135deg, #A8C5A020 0%, #C9B8E830 100%)",
          }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-veil-purple/60 mb-2">
            Today&apos;s Reflection
          </p>
          <blockquote className="font-serif text-base italic text-veil-text leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <p className="text-xs text-veil-muted mt-2">&mdash; {quote.author}</p>
        </section>

        {/* Recent entries */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base font-semibold text-veil-text">
              Recent Entries
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("journal")}
              className="text-xs text-veil-purple font-medium hover:underline"
            >
              See all
            </button>
          </div>
          {recent.length === 0 ? (
            <div
              data-ocid="home.empty_state"
              className="bg-white rounded-3xl p-6 shadow-soft text-center"
            >
              <BookHeart
                className="mx-auto mb-2 text-veil-lavender"
                size={32}
              />
              <p className="text-sm text-veil-muted">
                No entries yet. Start your first one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((entry, i) => {
                const mood = getMoodInfo(entry.mood);
                return (
                  <div
                    key={entry.id}
                    data-ocid={`home.item.${i + 1}`}
                    className="bg-white rounded-2xl p-4 shadow-soft"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${mood.color}50`,
                          color: "#2D2540",
                        }}
                      >
                        {mood.emoji} {mood.label}
                      </span>
                      <span className="text-xs text-veil-muted">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    {entry.title && (
                      <p className="font-serif text-sm font-semibold text-veil-text line-clamp-1">
                        {entry.title}
                      </p>
                    )}
                    <p className="text-xs text-veil-muted line-clamp-1 mt-0.5">
                      {entry.body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA */}
        <button
          data-ocid="home.primary_button"
          type="button"
          onClick={() => onNavigate("write")}
          className="w-full py-4 rounded-3xl font-semibold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-95 shadow-soft"
          style={{
            background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
          }}
        >
          ✍️ Start Writing
        </button>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── Tab: Write ───────────────────────────────────────────────────────────────

function WriteTab({ onSaved }: { onSaved: () => void }) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [selectedMood, setSelectedMood] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showApologyFlow, setShowApologyFlow] = useState(false);
  const [showLoveLetterFlow, setShowLoveLetterFlow] = useState(false);
  const [showConfessFlow, setShowConfessFlow] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.addJournalEntry(title.trim(), body.trim(), selectedMood);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Entry saved 🌿");
      setTitle("");
      setBody("");
      setSelectedMood("");
      onSaved();
    },
    onError: () => toast.error("Failed to save entry"),
  });

  const canSave = body.trim().length > 0 && selectedMood !== "";

  return (
    <div className="animate-fade-in pb-6">
      <div
        className="rounded-b-3xl px-6 pt-12 pb-8 mb-6"
        style={{
          background: "linear-gradient(135deg, #A8C5A0 0%, #C9B8E8 100%)",
        }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-veil-purple/70 mb-1">
          New Entry
        </p>
        <h1 className="font-serif text-2xl font-semibold text-veil-text">
          Write Freely ✍️
        </h1>
        <p className="text-sm text-veil-text/70 mt-1">
          This is your safe space.
        </p>
      </div>

      {/* Confess Card */}
      <div className="px-5 mb-3">
        <button
          type="button"
          data-ocid="write.confess.button"
          onClick={() => setShowConfessFlow(true)}
          className="w-full rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] flex items-start gap-4"
          style={{
            background: "linear-gradient(135deg, #1e1a2e 0%, #2a1f3d 100%)",
          }}
        >
          <div className="text-3xl mt-0.5">🕊</div>
          <div>
            <div className="font-serif text-base font-semibold text-white/90 mb-1">
              Confess
            </div>
            <p className="text-white/50 text-sm">
              Put down what you have been carrying alone.
            </p>
          </div>
        </button>
      </div>
      {showConfessFlow && (
        <ConfessFlow
          onClose={() => setShowConfessFlow(false)}
          onOpenApology={() => {
            setShowConfessFlow(false);
            setShowApologyFlow(true);
          }}
        />
      )}
      {/* Express Love Card */}
      <div className="px-5 mb-3">
        <button
          type="button"
          data-ocid="write.express_love.button"
          onClick={() => setShowLoveLetterFlow(true)}
          className="w-full bg-white rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] flex items-start gap-4"
        >
          <div className="text-3xl mt-0.5">💌</div>
          <div>
            <div className="font-serif text-base font-semibold text-veil-text mb-1">
              Express Love
            </div>
            <p className="text-veil-muted text-sm">
              Write something that matters.
            </p>
          </div>
        </button>
      </div>
      {showLoveLetterFlow && (
        <LoveLetterFlow
          onClose={() => setShowLoveLetterFlow(false)}
          onSaved={() => setShowLoveLetterFlow(false)}
        />
      )}
      {/* Apology Card */}
      <div className="px-5 mb-5">
        <button
          data-ocid="write.apology.button"
          type="button"
          onClick={() => setShowApologyFlow(true)}
          className="w-full bg-white rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] flex items-start gap-4"
        >
          <div className="text-3xl mt-0.5">🕊</div>
          <div>
            <div className="font-serif text-base font-semibold text-veil-text mb-1">
              Write an Apology
            </div>
            <p className="text-veil-muted text-sm">
              Say what you’ve been carrying.
            </p>
          </div>
        </button>
      </div>

      {showApologyFlow && (
        <ApologyCreationFlow
          onClose={() => setShowApologyFlow(false)}
          onSaved={() => setShowApologyFlow(false)}
        />
      )}

      <div className="px-5 space-y-5">
        {/* Mood selector */}
        <section className="bg-white rounded-3xl p-5 shadow-soft">
          <h2 className="font-serif text-sm font-semibold text-veil-text mb-3">
            How are you feeling?
          </h2>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <MoodChip
                key={mood.key}
                mood={mood}
                selected={selectedMood === mood.key}
                onClick={() => setSelectedMood(mood.key)}
              />
            ))}
          </div>
        </section>

        {/* Title */}
        <input
          data-ocid="write.input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your entry a title..."
          className="w-full bg-white rounded-2xl px-5 py-4 text-veil-text placeholder:text-veil-muted shadow-soft outline-none font-serif text-base focus:shadow-glow transition-shadow duration-200"
          style={{ border: "none" }}
        />

        {/* Body */}
        <textarea
          data-ocid="write.textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Begin writing here... this is your safe space 🌿"
          rows={8}
          className="w-full bg-white rounded-3xl px-5 py-4 text-veil-text placeholder:text-veil-muted shadow-soft outline-none text-sm leading-relaxed resize-none focus:shadow-glow transition-shadow duration-200"
          style={{ border: "none", minHeight: "200px" }}
        />

        {/* Save */}
        <button
          data-ocid="write.submit_button"
          type="button"
          disabled={!canSave || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="w-full py-4 rounded-3xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 active:scale-95 shadow-soft flex items-center justify-center gap-2"
          style={{
            background: canSave
              ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
              : undefined,
            backgroundColor: canSave ? undefined : "#C9B8E8",
          }}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            "💾 Save Entry"
          )}
        </button>

        {saveMutation.isPending && (
          <div
            data-ocid="write.loading_state"
            className="text-center text-xs text-veil-muted"
          >
            Saving your thoughts...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: My Journal ──────────────────────────────────────────────────────────

const NAV_ITEMS: { key: Tab; icon: React.ReactElement; label: string }[] = [
  { key: "home", icon: <span className="text-xl">🏠</span>, label: "Home" },
  { key: "write", icon: <span className="text-xl">✍️</span>, label: "Write" },
  {
    key: "journal",
    icon: <span className="text-xl">📖</span>,
    label: "Journal",
  },
  {
    key: "reflections",
    icon: <span className="text-xl">🔮</span>,
    label: "Reflections",
  },
  {
    key: "profile",
    icon: <span className="text-xl">🌿</span>,
    label: "Profile",
  },
];

function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      data-ocid="nav.panel"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border/60 px-2 pb-safe"
      style={{ boxShadow: "0 -4px 20px rgba(107,91,142,0.08)" }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              data-ocid={`nav.${item.key}.tab`}
              type="button"
              onClick={() => onChange(item.key)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
            >
              <span
                className="transition-all duration-200"
                style={{ color: isActive ? "#6B5B8E" : "#8B8097" }}
              >
                {item.icon}
              </span>
              <span
                className="text-[10px] font-medium transition-all duration-200"
                style={{ color: isActive ? "#6B5B8E" : "#8B8097" }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 w-4 h-0.5 rounded-full"
                  style={{ backgroundColor: "#6B5B8E" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showQuickRelease, setShowQuickRelease] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("quick") === "1";
    }
    return false;
  });
  const [showQROnboarding, setShowQROnboarding] = useState(false);
  const [eiConsentPending, setEiConsentPending] = useState(false);
  const [eiArcData, setEiArcData] = useState<{
    emotionType: EmotionType;
    intensity: number;
  } | null>(null);
  const [celebrationData, setCelebrationData] = useState<{
    emotionType: PositiveEmotionType;
    milestoneLevel: MilestoneLevel;
    intensity: number;
  } | null>(null);
  const [showHardDayDelivery, setShowHardDayDelivery] = useState(false);
  const pendingDumpRef = useRef<{
    textContent: string | null;
    dumpType: "voice" | "text";
  } | null>(null);
  const [quietMoment, setQuietMoment] = useState<{
    emotion_type: string;
    emotion_label: string;
    emotion_emoji: string;
    visibility: "ONLY_ME" | "INNER_CIRCLE" | "FRIENDS" | "GLOBAL";
  } | null>(null);
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const handlePostSuccess = (data: {
    emotion_type: string;
    emotion_label: string;
    emotion_emoji: string;
    visibility: string;
    source: "emotion_checkin";
    crisis_signal_detected: boolean;
  }) => {
    setActiveTab("home");
    if (data.crisis_signal_detected) {
      return;
    }
    const visMap: Record<
      string,
      "ONLY_ME" | "INNER_CIRCLE" | "FRIENDS" | "GLOBAL"
    > = {
      only_me: "ONLY_ME",
      inner_circle: "INNER_CIRCLE",
      friends: "FRIENDS",
      global_anonymous: "GLOBAL",
      global: "GLOBAL",
    };
    setQuietMoment({
      emotion_type: data.emotion_type,
      emotion_label: data.emotion_label,
      emotion_emoji: data.emotion_emoji,
      visibility: visMap[data.visibility.toLowerCase()] ?? "ONLY_ME",
    });
  };
  const { actor, isFetching } = useActor();

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: entries } = useQuery<JournalEntry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJournalEntries();
    },
    enabled: !!actor && !isFetching,
  });

  function handleDumpComplete(
    textContent: string | null,
    dumpType: "voice" | "text",
  ) {
    const consent =
      typeof window !== "undefined"
        ? localStorage.getItem("veil-ei-consent")
        : null;
    if (!consent) {
      pendingDumpRef.current = { textContent, dumpType };
      setEiConsentPending(true);
      return;
    }
    if (consent !== "yes") return;
    const result = detectEmotion(textContent);
    if (result.emotion_category === "NEGATIVE" && result.confidence >= 0.65) {
      setEiArcData({
        emotionType: result.emotion_type as EmotionType,
        intensity: result.intensity,
      });
      return;
    }
    if (result.emotion_category === "POSITIVE" && result.confidence >= 0.65) {
      const positiveResult = classifyPositiveEmotion(result, textContent);
      setCelebrationData({
        emotionType: positiveResult.emotion_type,
        milestoneLevel: positiveResult.milestone_level,
        intensity: positiveResult.intensity,
      });
    }
  }

  function handleEIAccept() {
    localStorage.setItem("veil-ei-consent", "yes");
    setEiConsentPending(false);
    const pending = pendingDumpRef.current;
    if (pending) {
      pendingDumpRef.current = null;
      const result = detectEmotion(pending.textContent);
      if (result.emotion_category === "NEGATIVE" && result.confidence >= 0.65) {
        setEiArcData({
          emotionType: result.emotion_type as EmotionType,
          intensity: result.intensity,
        });
        return;
      }
      if (result.emotion_category === "POSITIVE" && result.confidence >= 0.65) {
        const positiveResult = classifyPositiveEmotion(
          result,
          pending.textContent,
        );
        setCelebrationData({
          emotionType: positiveResult.emotion_type,
          milestoneLevel: positiveResult.milestone_level,
          intensity: positiveResult.intensity,
        });
      }
    }
  }

  function handleEIDecline() {
    localStorage.setItem("veil-ei-consent", "no");
    setEiConsentPending(false);
    pendingDumpRef.current = null;
  }

  return (
    <VeilVoiceProvider>
      <div
        className="min-h-screen bg-background"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {/* Mobile shell */}
        <div className="max-w-[430px] mx-auto min-h-screen relative overflow-x-hidden">
          {/* Scrollable content area */}
          <main className="overflow-y-auto" style={{ paddingBottom: "5rem" }}>
            {activeTab === "home" && (
              <HomeTab
                onNavigate={setActiveTab}
                profile={profile}
                entries={entries}
                onPostSuccess={handlePostSuccess}
                onDumpComplete={handleDumpComplete}
              />
            )}
            {activeTab === "write" && (
              <WriteTab onSaved={() => setActiveTab("journal")} />
            )}
            {activeTab === "journal" && <MyJournalTab />}
            {activeTab === "reflections" && <ReflectionsTab />}
            {activeTab === "profile" && (
              <ProfileTab onNavigate={setActiveTab} />
            )}
          </main>

          <BottomNav active={activeTab} onChange={setActiveTab} />
          {quietMoment && (
            <QuietMomentScreen
              emotion_type={quietMoment.emotion_type}
              emotion_label={quietMoment.emotion_label}
              emotion_emoji={quietMoment.emotion_emoji}
              visibility={quietMoment.visibility}
              onDismiss={() => setQuietMoment(null)}
              reduceMotion={reduceMotion}
            />
          )}
        </div>

        <Toaster position="top-center" richColors />

        {/* Footer */}
        <footer className="hidden">
          <p>
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
      {/* Veil Voice System — global audio layer */}
      <VeilVoiceOverlay />
      {/* EI Consent Modal */}
      <EIConsentModal
        isOpen={eiConsentPending}
        onAccept={handleEIAccept}
        onDecline={handleEIDecline}
      />
      {/* EI Transformation Arc */}
      <AnimatePresence>
        {eiArcData && (
          <TransformationArcFlow
            emotionType={eiArcData.emotionType}
            intensity={eiArcData.intensity}
            onComplete={() => setEiArcData(null)}
            settings={getEISettings()}
          />
        )}
      </AnimatePresence>
      {/* Positive Emotion Celebration Flow */}
      <AnimatePresence>
        {celebrationData && (
          <CelebrationFlow
            emotionType={celebrationData.emotionType}
            milestoneLevel={celebrationData.milestoneLevel}
            intensity={celebrationData.intensity}
            onComplete={() => setCelebrationData(null)}
            onNavigateToWrite={() => {
              setCelebrationData(null);
              setActiveTab("write");
            }}
          />
        )}
      </AnimatePresence>
      {/* Hard Day Delivery */}
      <AnimatePresence>
        {showHardDayDelivery && (
          <HardDayDelivery onContinue={() => setShowHardDayDelivery(false)} />
        )}
      </AnimatePresence>
      <VoiceOnboarding />
      <AnimatePresence>
        {showQuickRelease && (
          <QuickReleaseScreen
            accessPoint="DIRECT"
            onClose={() => {
              setShowQuickRelease(false);
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.delete("quick");
                window.history.replaceState({}, "", url.toString());
              }
              if (shouldShowQROnboarding()) setShowQROnboarding(true);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showQROnboarding && (
          <QuickReleaseOnboarding onClose={() => setShowQROnboarding(false)} />
        )}
      </AnimatePresence>
    </VeilVoiceProvider>
  );
}
