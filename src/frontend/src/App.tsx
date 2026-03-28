import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { JournalEntry, UserProfile } from "./backend";
import { ApologyCreationFlow } from "./components/ApologyCreationFlow";
import { CelebrationFlow, HardDayDelivery } from "./components/CelebrationFlow";
import { CompanionCard } from "./components/CompanionCard";
import { ConfessFlow } from "./components/ConfessFlow";
import { EIConsentModal } from "./components/EIConsentModal";
import { EISettingsPanel, getEISettings } from "./components/EISettingsPanel";
import { EmotionCheckIn } from "./components/EmotionCheckIn";
import { EmotionFeed } from "./components/EmotionFeed";
import { EmotionalFeedbackOverlay } from "./components/EmotionalFeedbackOverlay";
import { GentleReentryCard } from "./components/GentleReentryCard";
import { LoveLetterFlow } from "./components/LoveLetterFlow";
import MyJournalTab from "./components/MyJournalTab";
import { NotificationCenter } from "./components/NotificationCenter";
import { NotificationPermissionModal } from "./components/NotificationPermissionModal";
import { NotificationSettingsPanel } from "./components/NotificationSettingsPanel";
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
import { StillWithYouCard } from "./components/StillWithYouCard";
import { TransformationArcFlow } from "./components/TransformationArcFlow";
import { VeilVoiceOverlay } from "./components/VeilVoiceOverlay";
import { VisualExpressionCanvas } from "./components/VisualExpressionCanvas";
import { VoiceOnboarding } from "./components/VoiceOnboarding";
import { VoiceSettingsPanel } from "./components/VoiceSettingsPanel";
import { VeilVoiceProvider } from "./contexts/VeilVoiceContext";
import { useActor } from "./hooks/useActor";
import { detectEmotion } from "./lib/emotionDetection";
import type { EmotionType } from "./lib/emotionDetection";
import { WRITE_FEEDBACK } from "./lib/emotionalFeedbackCopy";
import {
  evaluateRetentionSurface,
  markItemDismissed,
} from "./lib/notificationOrchestrator";
import { classifyPositiveEmotion } from "./lib/positiveEmotionDetection";
import type {
  MilestoneLevel,
  PositiveEmotionType,
} from "./lib/positiveEmotionDetection";
import {
  RetentionStateProvider,
  useRetentionState,
} from "./lib/retentionState";
import type { RetentionUserState } from "./lib/retentionState";
import {
  getState,
  incrementSessionCount,
  runSignificanceEngine,
} from "./lib/significantMomentsEngine";
import { hasUsedVisualCanvas } from "./lib/visualExpressionState";

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
  onPostSuccess,
  onDumpComplete,
  retentionState,
  onStillWithYouSeeIt,
  onStillWithYouNotYet,
  showPeaceMessage,
  onExpressVisually,
  onOpenNotifications,
}: {
  onNavigate: (tab: Tab) => void;
  onOpenNotifications?: () => void;
  profile: UserProfile | null | undefined;
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
  onExpressVisually?: (emotionType: string, emotionLabel: string) => void;
  retentionState?: RetentionUserState;
  onStillWithYouSeeIt?: () => void;
  onStillWithYouNotYet?: () => void;
  showPeaceMessage?: boolean;
}) {
  const quote = todayQuote();
  const name = profile?.displayName;

  return (
    <div className="animate-fade-in pb-28">
      {/* Header gradient */}
      <div
        className="relative rounded-b-3xl px-6 pt-12 pb-8 mb-6"
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
        {/* Bell icon */}
        <button
          type="button"
          data-ocid="home.notification_center.open_modal_button"
          onClick={onOpenNotifications}
          className="absolute top-12 right-6 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{
            width: 40,
            height: 40,
            background: "rgba(255,255,255,0.22)",
            color: "#1A1720",
          }}
          aria-label="Open notification center"
        >
          <Bell size={18} />
        </button>
      </div>

      {/* Still With You — Retention Engine surface, above CompanionCard */}
      {retentionState &&
        (() => {
          const surface = evaluateRetentionSurface(retentionState);
          const shouldShow = surface.showStillWithYou || showPeaceMessage;
          if (!shouldShow) return null;
          return (
            <div className="px-5 mb-4">
              <StillWithYouCard
                pendingItemType={surface.pendingItemType}
                onSeeIt={onStillWithYouSeeIt ?? (() => {})}
                onNotYet={onStillWithYouNotYet ?? (() => {})}
                showPeaceMessage={showPeaceMessage ?? false}
              />
            </div>
          );
        })()}

      {/* Companion Card — emotional release feature */}
      <CompanionCard
        onDumpComplete={onDumpComplete}
        onExpressVisually={
          onExpressVisually
            ? () => {
                // Express with the most recent emotion; fallback to custom
                onExpressVisually("custom", "Your feeling");
              }
            : undefined
        }
      />

      {/* Emotion Check-In — Component 2 */}
      <EmotionCheckIn onPostSuccess={onPostSuccess} />

      {/* Emotion Feed — Component 3 */}
      <EmotionFeed onCheckIn={() => onNavigate("write")} />

      <div className="px-5 space-y-5">
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

function WriteTab({
  onSaved,
  onExpressVisually,
}: {
  onSaved: () => void;
  onExpressVisually?: (type: string, label: string) => void;
}) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [selectedMood, setSelectedMood] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showApologyFlow, setShowApologyFlow] = useState(false);
  const [showLoveLetterFlow, setShowLoveLetterFlow] = useState(false);
  const [showConfessFlow, setShowConfessFlow] = useState(false);
  const [showJournalFeedback, setShowJournalFeedback] = useState(false);
  const [journalFeedbackLines, setJournalFeedbackLines] = useState<string[]>(
    [],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.addJournalEntry(title.trim(), body.trim(), selectedMood);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Entry saved 🌿");
      const positiveKeys = [
        "calm",
        "happy",
        "grateful",
        "hopeful",
        "loved",
        "peaceful",
        "elated",
      ];
      const isPositive = positiveKeys.some((k) =>
        selectedMood.toLowerCase().includes(k),
      );
      setJournalFeedbackLines(
        isPositive
          ? WRITE_FEEDBACK.journal_positive
          : WRITE_FEEDBACK.journal_negative,
      );
      setShowJournalFeedback(true);
      setTitle("");
      setBody("");
      setSelectedMood("");
    },
    onError: () => toast.error("Failed to save entry"),
  });

  const canSave = body.trim().length > 0 && selectedMood !== "";

  return (
    <div className="animate-fade-in pb-28">
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
      {showJournalFeedback && (
        <EmotionalFeedbackOverlay
          lines={journalFeedbackLines}
          background="default"
          onDismiss={() => {
            setShowJournalFeedback(false);
            onSaved();
          }}
        />
      )}
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
          className="w-full rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] flex items-start gap-4"
          style={{
            background: "linear-gradient(135deg, #3d1a2e 0%, #2e1a2a 100%)",
          }}
        >
          <div className="text-3xl mt-0.5">💌</div>
          <div>
            <div className="font-serif text-base font-semibold text-white/90 mb-1">
              Express Love
            </div>
            <p className="text-white/50 text-sm">
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
          className="w-full rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] flex items-start gap-4"
          style={{
            background: "linear-gradient(135deg, #2a1f2e 0%, #1e1a28 100%)",
          }}
        >
          <div className="text-3xl mt-0.5">🕊</div>
          <div>
            <div className="font-serif text-base font-semibold text-white/90 mb-1">
              Write an Apology
            </div>
            <p className="text-white/50 text-sm">
              Say what you've been carrying.
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

        {/* Add visual layer entry point */}
        {onExpressVisually && (
          <button
            type="button"
            onClick={() =>
              onExpressVisually(
                selectedMood || "custom",
                selectedMood || "Your feeling",
              )
            }
            style={{
              display: "block",
              width: "100%",
              background: "none",
              border: "none",
              color: "rgba(107,91,142,0.5)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.04em",
              padding: "12px",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Add visual layer →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: Tab; icon: React.ReactElement; label: string }[] = [
  {
    key: "home",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Home"
      >
        <ellipse cx="12" cy="4.5" rx="2" ry="2.5" />
        <path d="M12 7 C10 9.5 8.5 11 8 13" />
        <path d="M12 7 C14 9.5 15.5 11 16 13" />
        <path d="M8 13 C6.5 14.5 5 15.5 4 16 C5 16.5 7 17 9 16.5 C10 16.2 11 15.5 12 15.5 C13 15.5 14 16.2 15 16.5 C17 17 19 16.5 20 16 C19 15.5 17.5 14.5 16 13" />
        <path d="M10 14.5 C10.5 13.5 11.5 13 12 13.5 C12.5 14 11.5 14.8 12 15.5" />
      </svg>
    ),
    label: "Home",
  },
  {
    key: "write",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Write"
      >
        {/* Ink bottle - small square vessel bottom-left */}
        <rect x="2" y="16" width="6" height="5.5" rx="0.8" />
        {/* Bottle neck */}
        <rect x="3.5" y="14.2" width="3" height="2" rx="0.5" />
        {/* Bottle cap */}
        <line x1="3.2" y1="14.2" x2="6.8" y2="14.2" strokeWidth="1.6" />
        {/* Ink splash left of bottle */}
        <path d="M1.5 15.5 C0.8 14.5 0.5 13.8 1.2 13.2" />
        <circle cx="0.9" cy="12.6" r="0.4" fill="currentColor" stroke="none" />
        <circle cx="1.8" cy="11.8" r="0.3" fill="currentColor" stroke="none" />
        {/* Quill feather shaft - diagonal from bottom-left to upper-right */}
        <line x1="5" y1="15.5" x2="20" y2="2.5" />
        {/* Quill tip / nib at bottle */}
        <path d="M5 15.5 C4.2 14.8 4.5 13.8 5.5 14.5" />
        {/* Feather barbs - left side */}
        <path d="M8.5 12.5 C7 11.5 6 11 7 9.5" strokeWidth="1" />
        <path d="M11 10 C9.5 9 8.5 8.5 9.5 7" strokeWidth="1" />
        <path d="M13.5 7.5 C12 6.8 11.5 6 12 4.8" strokeWidth="1" />
        {/* Feather barbs - right side */}
        <path d="M9.5 11 C11 10.5 11.8 10 11.5 8.5" strokeWidth="1" />
        <path d="M12 8.5 C13.5 8 14.2 7.5 14 6" strokeWidth="1" />
        <path d="M14.5 6.2 C16 5.8 16.8 5.2 16.5 3.8" strokeWidth="1" />
        {/* Feather tip at top */}
        <path d="M18.5 3.5 C19.5 2.5 20.5 2 20 2.5" strokeWidth="1.2" />
      </svg>
    ),
    label: "Write",
  },
  {
    key: "journal",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="My Journal"
      >
        {/* Open book - left page */}
        <path d="M12 19 C12 19 6 17.5 3 18.5 L3 7 C6 6 12 7.5 12 7.5" />
        {/* Open book - right page */}
        <path d="M12 19 C12 19 18 17.5 21 18.5 L21 7 C18 6 12 7.5 12 7.5" />
        {/* Center spine */}
        <line x1="12" y1="7.5" x2="12" y2="19" />
        {/* Small flower stem at spine center */}
        <line x1="12" y1="13" x2="12" y2="10" strokeWidth="1" />
        {/* Yellow flower petals (left side) */}
        <circle
          cx="10.8"
          cy="9.5"
          r="0.7"
          fill="currentColor"
          strokeWidth="0"
          opacity="0.85"
        />
        {/* Pink/purple flower petals (right side) */}
        <circle
          cx="13.2"
          cy="9.2"
          r="0.65"
          fill="currentColor"
          strokeWidth="0"
          opacity="0.7"
        />
        {/* Tiny leaf on stem */}
        <path d="M12 11.5 C11 11 10.5 10.5 11 10" strokeWidth="0.9" />
        {/* Butterfly body */}
        <ellipse
          cx="17"
          cy="5.5"
          rx="0.5"
          ry="1"
          fill="currentColor"
          strokeWidth="0"
          opacity="0.6"
        />
        {/* Butterfly left wing */}
        <path d="M17 5 C15.5 4 14.5 5 15.5 6.5" strokeWidth="1" opacity="0.7" />
        {/* Butterfly right wing */}
        <path
          d="M17 5 C18.5 3.8 19.5 4.8 18.5 6"
          strokeWidth="1"
          opacity="0.7"
        />
      </svg>
    ),
    label: "Journal",
  },
  {
    key: "reflections",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Reflections"
      >
        {/* Crescent moon */}
        <path d="M20 13.5A8 8 0 1 1 10.5 4a6 6 0 0 0 9.5 9.5z" />
        {/* Stars */}
        <circle cx="19" cy="4" r="0.6" fill="currentColor" stroke="none" />
        <circle cx="21" cy="7" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="2" r="0.45" fill="currentColor" stroke="none" />
        {/* Ripple lines below - introspective water */}
        <path d="M5 19 C6.5 18.5 8 19.5 9.5 19" strokeWidth="1" opacity="0.6" />
        <path
          d="M4 21 C6 20.2 8.5 21.2 11 20.5"
          strokeWidth="0.9"
          opacity="0.4"
        />
      </svg>
    ),
    label: "Reflections",
  },
  {
    key: "profile",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Profile"
      >
        {/* Round head */}
        <circle cx="12" cy="6" r="3" />
        {/* Hair - bob style, top and sides */}
        <path
          d="M9 5 C9 3 10 2.2 12 2.2 C14 2.2 15 3 15 5"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Headphones arc */}
        <path d="M8.5 6.5 C8.5 3.5 15.5 3.5 15.5 6.5" strokeWidth="1.2" />
        {/* Headphone left ear cup */}
        <circle cx="8.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        {/* Headphone right ear cup */}
        <circle cx="15.8" cy="6.8" r="1" fill="currentColor" stroke="none" />
        {/* Neck */}
        <line x1="12" y1="9" x2="12" y2="10.5" />
        {/* Torso / T-shirt body */}
        <path d="M8.5 10.5 C8.5 10.5 10 10 12 10 C14 10 15.5 10.5 15.5 10.5 L15.5 16 L8.5 16 Z" />
        {/* Left arm */}
        <path d="M8.5 11 L6.5 14" />
        {/* Right arm (slightly back for backpack) */}
        <path d="M15.5 11 L17 13.5" />
        {/* Backpack */}
        <rect
          x="14.5"
          y="11"
          width="2.5"
          height="3.5"
          rx="0.8"
          fill="currentColor"
          stroke="none"
          opacity="0.7"
        />
        {/* Backpack strap */}
        <path d="M14.5 11.5 C14 10.8 14.5 10 15.5 10.5" strokeWidth="1" />
        {/* Left leg (forward) */}
        <line x1="10" y1="16" x2="9" y2="21" />
        {/* Right leg (back) */}
        <line x1="14" y1="16" x2="15" y2="21" />
        {/* Left foot */}
        <path d="M9 21 L7.5 21.5" strokeWidth="1.8" />
        {/* Right foot */}
        <path d="M15 21 L16.5 21.5" strokeWidth="1.8" />
      </svg>
    ),
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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border/60 px-2 pb-safe z-50"
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
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3.5 transition-all duration-200"
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

// ─── App Inner (consumes RetentionStateProvider) ──────────────────────────────

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [retentionState, setRetentionState] = useRetentionState();
  const [showPeaceMessage, setShowPeaceMessage] = useState(false);
  const [showQuickRelease, setShowQuickRelease] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("quick") === "1";
    }
    return false;
  });
  const [showQROnboarding, setShowQROnboarding] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
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
  // Significant Moments: run engine on every session start
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const state = getState();
      incrementSessionCount();
      runSignificanceEngine({
        carryingDays: 0,
        emotionType: "neutral",
        sessionNumber: state.sessionCount + 1,
        isInCrisis: false,
      });
    } catch {}
  }, []);

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

  const [visualCanvas, setVisualCanvas] = useState<{
    emotionType: string;
    emotionLabel: string;
  } | null>(null);
  function openVisualCanvas(type: string, label: string) {
    setVisualCanvas({ emotionType: type, emotionLabel: label });
  }

  // Retention Engine handlers
  function handleStillWithYouSeeIt() {
    setActiveTab("write");
  }

  function handleStillWithYouNotYet() {
    const surface = evaluateRetentionSurface(retentionState);
    if (!surface.pendingItemType) return;
    const next = markItemDismissed(retentionState, surface.pendingItemType);
    setRetentionState(next);
    // If no more items after dismissal, show brief peace message
    const nextSurface = evaluateRetentionSurface(next);
    if (!nextSurface.showStillWithYou) {
      setShowPeaceMessage(true);
      setTimeout(() => setShowPeaceMessage(false), 3500);
    }
  }

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

  useQuery<JournalEntry[]>({
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
          <main className="overflow-y-auto" style={{ paddingBottom: "7rem" }}>
            {activeTab === "home" && (
              <HomeTab
                onNavigate={setActiveTab}
                profile={profile}
                onPostSuccess={handlePostSuccess}
                onDumpComplete={handleDumpComplete}
                retentionState={retentionState}
                onStillWithYouSeeIt={handleStillWithYouSeeIt}
                onStillWithYouNotYet={handleStillWithYouNotYet}
                showPeaceMessage={showPeaceMessage}
                onOpenNotifications={() => setShowNotifCenter(true)}
                onExpressVisually={openVisualCanvas}
              />
            )}
            {activeTab === "write" && (
              <WriteTab
                onSaved={() => setActiveTab("journal")}
                onExpressVisually={openVisualCanvas}
              />
            )}
            {activeTab === "journal" && <MyJournalTab />}
            {activeTab === "reflections" && <ReflectionsTab />}
            {activeTab === "profile" && (
              <ProfileTab
                onNavigate={setActiveTab}
                onOpenNotificationSettings={() => setShowNotifSettings(true)}
              />
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
              onExpressVisually={() => {
                setQuietMoment(null);
                openVisualCanvas(
                  quietMoment.emotion_type,
                  quietMoment.emotion_label,
                );
              }}
              reduceMotion={reduceMotion}
            />
          )}
          {/* Visual Expression Canvas overlay */}
          {visualCanvas && (
            <VisualExpressionCanvas
              emotionType={visualCanvas.emotionType}
              emotionLabel={visualCanvas.emotionLabel}
              isFirstTime={!hasUsedVisualCanvas()}
              onClose={() => setVisualCanvas(null)}
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
      {/* Notification System v2.0 */}
      <NotificationPermissionModal />
      <NotificationCenter
        open={showNotifCenter}
        onClose={() => setShowNotifCenter(false)}
        onNavigateHome={() => {
          setShowNotifCenter(false);
          setActiveTab("home");
        }}
      />
      <NotificationSettingsPanel
        open={showNotifSettings}
        onClose={() => setShowNotifSettings(false)}
      />
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

// ─── App Shell (with Retention Provider) ─────────────────────────────────────

export default function App() {
  return (
    <RetentionStateProvider>
      <AppInner />
    </RetentionStateProvider>
  );
}
