import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import {
  AWARENESS_MILESTONES,
  DIFFICULT_EMOTION_TYPES,
  getActiveMilestone,
} from "../utils/streakAwarenessMessages";
import { CarryingThisCard } from "./CarryingThisCard";

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = 1 | 2 | 3 | 4 | 5;

type Emotion = {
  emoji: string;
  label: string;
  type: string;
  aiPrompt: string;
  isDifficult: boolean;
};

type ExpressionMethod = "write" | "voice" | "log";
type VisibilityLevel =
  | "only_me"
  | "inner_circle"
  | "friends"
  | "global_anonymous";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOTIONS: Emotion[] = [
  {
    emoji: "😊",
    label: "Grateful",
    type: "grateful",
    aiPrompt:
      "That's a beautiful feeling. Would you like to capture what you're grateful for so you can return to it?",
    isDifficult: false,
  },
  {
    emoji: "😌",
    label: "Calm",
    type: "calm",
    aiPrompt:
      "It sounds like you've found some peace. Would writing a little more help you hold onto this feeling?",
    isDifficult: false,
  },
  {
    emoji: "😟",
    label: "Stressed",
    type: "stressed",
    aiPrompt:
      "That sounds like a lot to carry. Would writing a little more help you put it down fully?",
    isDifficult: true,
  },
  {
    emoji: "😔",
    label: "Sad",
    type: "sad",
    aiPrompt:
      "You don't have to sit with this alone. Would you like Veil to gently let someone know you could use support?",
    isDifficult: true,
  },
  {
    emoji: "😡",
    label: "Frustrated",
    type: "frustrated",
    aiPrompt:
      "It's okay to feel this. Is there more you want to say before you let it go?",
    isDifficult: true,
  },
  {
    emoji: "💭",
    label: "Reflective",
    type: "reflective",
    aiPrompt:
      "Something's clearly on your mind. Would writing it out help you understand it better?",
    isDifficult: false,
  },
  {
    emoji: "😰",
    label: "Anxious",
    type: "anxious",
    aiPrompt:
      "That feeling is allowed here. Would a moment of quiet reflection help right now?",
    isDifficult: true,
  },
  {
    emoji: "🥀",
    label: "Lonely",
    type: "lonely",
    aiPrompt:
      "You don't have to sit with this alone. Would you like Veil to gently let someone know you could use support?",
    isDifficult: true,
  },
  {
    emoji: "😶",
    label: "Numb",
    type: "numb",
    aiPrompt:
      "Sometimes there are no words. That's okay too. Veil is here either way.",
    isDifficult: true,
  },
  {
    emoji: "🌤",
    label: "Hopeful",
    type: "hopeful",
    aiPrompt:
      "Hope is worth holding onto. Would you like to write what's giving you hope today?",
    isDifficult: false,
  },
];

const WRITE_PLACEHOLDERS = [
  "What's weighing on you today?",
  "What happened today that stayed with you?",
  "What are you carrying right now?",
  "Say whatever you need to say. Veil is listening.",
  "You don't have to explain it. Just put it here.",
];

const EXHALE_MESSAGES = [
  "Veil has it. You can breathe now.",
  "You put it down. That takes courage.",
  "It's here with Veil now. You don't have to carry it anymore.",
  "You showed up for yourself today.",
  "Whatever you're feeling is allowed here.",
  "It's safe here. Always.",
  "You don't have to carry this into the rest of your day.",
  "Veil is holding this for you.",
];

const VISIBILITY_OPTIONS: {
  value: VisibilityLevel;
  emoji: string;
  label: string;
  desc: string;
}[] = [
  {
    value: "only_me",
    emoji: "🔒",
    label: "Only Me",
    desc: "Stays between you and Veil. Always private.",
  },
  {
    value: "inner_circle",
    emoji: "👥",
    label: "Inner Circle",
    desc: "Shared only with your most trusted people.",
  },
  {
    value: "friends",
    emoji: "🤝",
    label: "Friends",
    desc: "Shared with your wider friend network.",
  },
  {
    value: "global_anonymous",
    emoji: "🌍",
    label: "Global (Anonymous)",
    desc: "Shared anonymously with the Veil community.",
  },
];

const CRISIS_KEYWORDS = [
  "hurt myself",
  "hurt my self",
  "end it",
  "can't go on",
  "cannot go on",
  "kill myself",
  "want to die",
  "no reason to live",
  "self harm",
  "don't want to be here",
  "do not want to be here",
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function getDailyPlaceholder(): string {
  const day = new Date().getDate();
  return WRITE_PLACEHOLDERS[day % WRITE_PLACEHOLDERS.length];
}

let lastExhaleIdx = -1;
function getExhaleMessage(): string {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * EXHALE_MESSAGES.length);
  } while (idx === lastExhaleIdx && EXHALE_MESSAGES.length > 1);
  lastExhaleIdx = idx;
  return EXHALE_MESSAGES[idx];
}

// ─── Waveform Canvas ─────────────────────────────────────────────────────────

function VoiceWaveform({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const barsRef = useRef<number[]>(Array(32).fill(0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = barsRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const barW = w / bars.length - 2;

      bars.forEach((_amp, i) => {
        // Smoothly animate toward random target when active
        if (active) {
          const target = 0.08 + Math.random() * 0.9;
          barsRef.current[i] = bars[i] * 0.7 + target * 0.3;
        } else {
          barsRef.current[i] = bars[i] * 0.92 + 0.06 * 0.08;
        }
        const barH = barsRef.current[i] * (h * 0.85);
        const x = i * (barW + 2);
        const y = (h - barH) / 2;
        // Soft lavender-sage gradient bars
        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, "rgba(168, 197, 160, 0.9)");
        gradient.addColorStop(0.5, "rgba(201, 184, 232, 0.95)");
        gradient.addColorStop(1, "rgba(242, 181, 197, 0.85)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, barW / 2);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={80}
      className="w-full"
      style={{ borderRadius: 12 }}
      aria-label="Voice recording waveform"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmotionCheckInProps {
  onPostSuccess?: (data: {
    emotion_type: string;
    emotion_label: string;
    emotion_emoji: string;
    visibility: string;
    source: "emotion_checkin";
    crisis_signal_detected: boolean;
  }) => void;
}

export function EmotionCheckIn({ onPostSuccess }: EmotionCheckInProps = {}) {
  const { actor, isFetching } = useActor();

  // Modal open/close
  const [open, setOpen] = useState(false);

  // u2500u2500 Streak awareness state u2500u2500
  const [streakInfo, setStreakInfo] = useState<{
    emotionType: string;
    emotionEmoji: string;
    emotionLabel: string;
    streakDays: number;
    milestone: number;
  } | null>(null);
  const [streakCardDismissed, setStreakCardDismissed] = useState(false);

  // Stage flow
  const [stage, setStage] = useState<Stage>(1);

  // Stage 1
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [customEmotion, setCustomEmotion] = useState("");
  const [showCustomField, setShowCustomField] = useState(false);

  // Stage 2
  const [expressionMethod, setExpressionMethod] =
    useState<ExpressionMethod | null>(null);
  const [textContent, setTextContent] = useState("");
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stage 3
  const [visibility, setVisibility] = useState<VisibilityLevel>("inner_circle");
  const [globalConfirmed, setGlobalConfirmed] = useState(
    () => localStorage.getItem("veil_global_anon_confirmed") === "true",
  );
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);

  // Stage 4 / Exhale
  const [submitting, setSubmitting] = useState(false);
  const [exhaleMessage, setExhaleMessage] = useState("");
  const [showExhale, setShowExhale] = useState(false);

  // Stage 5 resting
  const [completedEntry, setCompletedEntry] = useState<{
    emotion: Emotion;
    visibility: VisibilityLevel;
  } | null>(null);

  // AI prompt / crisis state
  const [aiPromptDismissed, setAiPromptDismissed] = useState(false);
  const [showCrisisResources, setShowCrisisResources] = useState(false);

  // ── Helpers ──
  const voiceOverride = expressionMethod === "voice";
  const effectiveVisibility: VisibilityLevel = voiceOverride
    ? "only_me"
    : visibility;

  const crisisDetected = textContent.length > 10 && detectCrisis(textContent);
  const showAiPrompt =
    expressionMethod === "write" &&
    textContent.length > 30 &&
    !aiPromptDismissed &&
    selectedEmotion?.isDifficult;

  // ── Voice recording ──
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setVoiceSeconds(0);
    voiceTimerRef.current = setInterval(() => {
      setVoiceSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    // Voice is never stored — just duration
  }, []);

  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, []);

  // u2500u2500 Streak awareness computation u2500u2500
  useEffect(() => {
    if (!open || !actor || isFetching) return;
    let cancelled = false;
    async function computeStreak() {
      try {
        const entries = await (actor as any).getEmotionEntries();
        if (cancelled) return;
        // Build a set of {emotionType, dateString} pairs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const emotion of EMOTIONS) {
          if (!DIFFICULT_EMOTION_TYPES.has(emotion.type)) continue;
          // Count consecutive days ending today
          let streak = 0;
          const checkDate = new Date(today);
          while (true) {
            const dateStr = checkDate.toDateString();
            const found = entries.some((e: any) => {
              const d = new Date(Number(e.createdAt) / 1_000_000);
              d.setHours(0, 0, 0, 0);
              return (
                e.emotionType === emotion.type && d.toDateString() === dateStr
              );
            });
            if (found) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
          const milestone = getActiveMilestone(streak);
          if (milestone === null) continue;
          // Check if this milestone was already shown
          const record = await (actor as any).getEmotionStreakRecord(
            emotion.type,
          );
          if (cancelled) return;
          const lastMilestone =
            record && record.lastAwarenessMilestone !== null
              ? Array.isArray(record.lastAwarenessMilestone) &&
                record.lastAwarenessMilestone.length > 0
                ? Number(record.lastAwarenessMilestone[0])
                : null
              : null;
          if (lastMilestone === milestone) continue; // already shown for this milestone
          // Show card for this emotion
          setStreakInfo({
            emotionType: emotion.type,
            emotionEmoji: emotion.emoji,
            emotionLabel: emotion.label,
            streakDays: streak,
            milestone,
          });
          setStreakCardDismissed(false);
          return; // Show only one card (the first qualifying emotion)
        }
      } catch (_e) {
        // Silently fail u2014 streak awareness is non-critical
      }
    }
    computeStreak();
    return () => {
      cancelled = true;
    };
  }, [open, actor, isFetching]);
  // ── Reset on close ──
  const resetFlow = useCallback(() => {
    setStage(1);
    setSelectedEmotion(null);
    setCustomEmotion("");
    setShowCustomField(false);
    setExpressionMethod(null);
    setTextContent("");
    setVoiceSeconds(0);
    setIsRecording(false);
    setVisibility("inner_circle");
    setShowGlobalConfirm(false);
    setSubmitting(false);
    setExhaleMessage("");
    setShowExhale(false);
    setAiPromptDismissed(false);
    setShowCrisisResources(false);
    setStreakInfo(null);
    setStreakCardDismissed(false);
    stopRecording();
  }, [stopRecording]);

  const closeModal = useCallback(() => {
    stopRecording();
    setOpen(false);
    // Small delay before full reset so exit animation completes
    setTimeout(resetFlow, 400);
  }, [stopRecording, resetFlow]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!selectedEmotion) return;
    setSubmitting(true);

    const msg = getExhaleMessage();
    setExhaleMessage(msg);

    const finalVisibility = effectiveVisibility;
    const aiShown = !!showAiPrompt;
    const aiText = aiShown ? selectedEmotion.aiPrompt : null;
    const crisisDet = crisisDetected;

    try {
      if (actor && !isFetching) {
        await (actor as any).saveEmotionEntry(
          selectedEmotion.type,
          selectedEmotion.label,
          selectedEmotion.emoji,
          customEmotion || null,
          textContent || null,
          voiceSeconds > 0 ? BigInt(voiceSeconds) : null,
          finalVisibility,
          voiceOverride,
          aiShown,
          aiText,
          crisisDet,
          showCrisisResources,
          msg,
        );
      }
    } catch (_e) {
      // Don't block the emotional flow on backend errors
    }

    setSubmitting(false);
    setShowExhale(true);

    // Auto-dismiss exhale
    setTimeout(() => {
      setShowExhale(false);
      setOpen(false);
      setCompletedEntry({
        emotion: selectedEmotion,
        visibility: finalVisibility,
      });
      // Notify parent so QuietMomentScreen can be triggered
      onPostSuccess?.({
        emotion_type: selectedEmotion.type,
        emotion_label: selectedEmotion.label,
        emotion_emoji: selectedEmotion.emoji,
        visibility: finalVisibility,
        source: "emotion_checkin",
        crisis_signal_detected: crisisDet,
      });
      setTimeout(resetFlow, 200);
    }, 3000);
  }, [
    selectedEmotion,
    effectiveVisibility,
    textContent,
    voiceSeconds,
    voiceOverride,
    showAiPrompt,
    crisisDetected,
    showCrisisResources,
    customEmotion,
    actor,
    isFetching,
    resetFlow,
    onPostSuccess,
  ]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // ─── Entry card (resting / invite) ─────────────────────────────────────────
  if (completedEntry) {
    return (
      <div className="px-5 mt-4">
        <div
          data-ocid="emotion_checkin.card"
          className="veil-card-breathe-slow rounded-3xl p-5 shadow-soft"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,184,232,0.18) 0%, rgba(168,197,160,0.15) 100%)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{completedEntry.emotion.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-veil-text">
                You felt{" "}
                <span className="text-primary">
                  {completedEntry.emotion.label}
                </span>{" "}
                today.
              </p>
              <p className="text-xs text-veil-muted mt-0.5">
                Your check-in is safe with Veil.
              </p>
            </div>
          </div>

          {/* Support reactions */}
          <div className="flex gap-2 mb-4">
            {(["❤️", "🌿", "🤍", "💬"] as const).map((r, i) => {
              const labels = [
                "Support",
                "I'm here",
                "Thinking of you",
                "Talk if you want",
              ];
              return (
                <button
                  key={r}
                  type="button"
                  data-ocid={
                    `emotion_checkin.toggle.${i + 1}` as `emotion_checkin.toggle.${number}`
                  }
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-xs text-veil-muted transition-all hover:bg-white/60 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.4)" }}
                  aria-label={labels[i]}
                >
                  <span className="text-base">{r}</span>
                  <span>{labels[i]}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            data-ocid="emotion_checkin.button"
            onClick={() => {
              setCompletedEntry(null);
              setOpen(true);
            }}
            className="w-full py-2.5 rounded-2xl text-sm font-medium text-primary transition-all hover:bg-white/40 active:scale-98"
            style={{ background: "rgba(255,255,255,0.35)" }}
          >
            Check in again
          </button>
        </div>
      </div>
    );
  }

  // ─── Home invite card ────────────────────────────────────────────────────────
  return (
    <>
      <div className="px-5 mt-4">
        <button
          type="button"
          data-ocid="emotion_checkin.open_modal_button"
          onClick={() => setOpen(true)}
          className="w-full veil-card-breathe rounded-3xl p-5 shadow-soft text-left transition-all hover:shadow-md active:scale-98 cursor-pointer"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,184,232,0.22) 0%, rgba(242,181,197,0.18) 100%)",
          }}
          aria-label="Open emotion check-in"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              🫶
            </span>
            <div>
              <p className="text-sm font-semibold text-veil-text">
                How are you feeling today?
              </p>
              <p className="text-xs text-veil-muted mt-0.5">
                Tap to check in — it only takes a moment.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Full-screen modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="checkin-modal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "oklch(0.977 0.008 70)" }}
            data-ocid="emotion_checkin.modal"
            aria-modal="true"
            aria-label="Emotion Check-In"
          >
            {/* Exhale overlay */}
            <AnimatePresence>
              {showExhale && (
                <motion.div
                  key="exhale"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(160deg, oklch(0.94 0.04 295) 0%, oklch(0.96 0.035 148) 100%)",
                  }}
                  aria-live="polite"
                >
                  <div
                    className="veil-exhale-circle rounded-full mb-8"
                    style={{
                      width: 120,
                      height: 120,
                      background:
                        "linear-gradient(135deg, rgba(201,184,232,0.6) 0%, rgba(168,197,160,0.5) 100%)",
                      boxShadow: "0 0 60px rgba(201,184,232,0.4)",
                    }}
                    aria-hidden="true"
                  />
                  <p className="text-center text-lg font-serif font-medium text-veil-text px-8 leading-relaxed">
                    {exhaleMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-4">
              {stage > 1 ? (
                <button
                  type="button"
                  data-ocid="emotion_checkin.button"
                  onClick={() => setStage((s) => (s - 1) as Stage)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-veil-muted transition-colors hover:bg-muted active:scale-95"
                  aria-label="Go back"
                >
                  ←
                </button>
              ) : (
                <div className="w-10" />
              )}
              <div className="flex gap-1.5">
                {([1, 2, 3, 4] as Stage[]).map((s) => (
                  <div
                    key={s}
                    className="rounded-full transition-all"
                    style={{
                      width: stage === s ? 20 : 6,
                      height: 6,
                      background:
                        stage >= s
                          ? "oklch(0.453 0.112 295)"
                          : "oklch(0.92 0.015 295)",
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                data-ocid="emotion_checkin.close_button"
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full text-veil-muted transition-colors hover:bg-muted active:scale-95"
                aria-label="Close check-in"
              >
                ✕
              </button>
            </div>

            {/* Stage content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* ── STAGE 1 — Emotion Selection ───────────────────────────── */}
                {stage === 1 && (
                  <motion.div
                    key="stage1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-8"
                  >
                    {/* u2500u2500 Awareness Card u2014 "You Have Been Carrying This" u2500u2500 */}
                    <AnimatePresence>
                      {streakInfo && !streakCardDismissed && (
                        <CarryingThisCard
                          emotionType={streakInfo.emotionType}
                          streakDays={streakInfo.streakDays}
                          onReflect={async () => {
                            setStreakCardDismissed(true);
                            // Record "REFLECTED" acknowledgment
                            try {
                              if (actor && !isFetching) {
                                await (actor as any).saveEmotionStreakRecord(
                                  streakInfo.emotionType,
                                  [streakInfo.milestone],
                                  ["REFLECTED"],
                                  false,
                                );
                              }
                            } catch (_e) {}
                            closeModal();
                          }}
                          onDismiss={async () => {
                            setStreakCardDismissed(true);
                            // Record "DISMISSED" acknowledgment
                            try {
                              if (actor && !isFetching) {
                                await (actor as any).saveEmotionStreakRecord(
                                  streakInfo.emotionType,
                                  [streakInfo.milestone],
                                  ["DISMISSED"],
                                  false,
                                );
                              }
                            } catch (_e) {}
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <h2 className="font-serif text-xl font-semibold text-veil-text mb-1">
                      How are you feeling right now?
                    </h2>
                    <p className="text-sm text-veil-muted mb-6">
                      Choose what feels closest. You can always add more.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {EMOTIONS.map((emotion) => (
                        <button
                          key={emotion.type}
                          type="button"
                          data-ocid="emotion_checkin.button"
                          onClick={() => {
                            setSelectedEmotion(emotion);
                            setTimeout(() => setStage(2), 120);
                          }}
                          className={[
                            "flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 shadow-soft active:scale-95",
                            selectedEmotion?.type === emotion.type
                              ? "ring-2 ring-primary/40 emotion-tile-selected"
                              : "hover:shadow-md",
                          ].join(" ")}
                          style={{
                            background:
                              selectedEmotion?.type === emotion.type
                                ? "linear-gradient(135deg, rgba(201,184,232,0.35) 0%, rgba(242,181,197,0.25) 100%)"
                                : "rgba(255,255,255,0.75)",
                            minHeight: 64,
                          }}
                          aria-pressed={selectedEmotion?.type === emotion.type}
                          aria-label={`${emotion.emoji} ${emotion.label}`}
                        >
                          <span className="text-2xl" aria-hidden="true">
                            {emotion.emoji}
                          </span>
                          <span className="text-sm font-medium text-veil-text">
                            {emotion.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Custom emotion */}
                    <button
                      type="button"
                      data-ocid="emotion_checkin.button"
                      onClick={() => setShowCustomField(true)}
                      className="w-full py-3 rounded-2xl text-sm text-veil-muted border border-border/50 transition-colors hover:bg-muted/50 active:scale-98"
                    >
                      + I feel something else...
                    </button>

                    <AnimatePresence>
                      {showCustomField && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="mt-3 overflow-hidden"
                        >
                          <textarea
                            data-ocid="emotion_checkin.textarea"
                            className="w-full rounded-2xl p-4 text-sm text-veil-text bg-white/80 border border-border/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                            rows={2}
                            placeholder="Describe how you're feeling in your own words..."
                            value={customEmotion}
                            onChange={(e) => setCustomEmotion(e.target.value)}
                            aria-label="Describe your emotion"
                          />
                          {customEmotion.trim() && (
                            <button
                              type="button"
                              data-ocid="emotion_checkin.submit_button"
                              onClick={() => {
                                setSelectedEmotion({
                                  emoji: "💬",
                                  label: customEmotion.trim(),
                                  type: "custom",
                                  aiPrompt:
                                    "Thank you for sharing that. Would writing more help you explore this feeling?",
                                  isDifficult: false,
                                });
                                setTimeout(() => setStage(2), 120);
                              }}
                              className="mt-2 w-full py-3 rounded-2xl text-sm font-medium bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-98"
                            >
                              Continue with this feeling →
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ── STAGE 2 — Expression ──────────────────────────────────── */}
                {stage === 2 && selectedEmotion && (
                  <motion.div
                    key="stage2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-8"
                  >
                    <p className="text-2xl mb-1">{selectedEmotion.emoji}</p>
                    <h2 className="font-serif text-xl font-semibold text-veil-text mb-1">
                      You're feeling{" "}
                      <span style={{ color: "oklch(0.453 0.112 295)" }}>
                        {selectedEmotion.label}
                      </span>
                      .
                    </h2>
                    <p className="text-sm text-veil-muted mb-6">
                      Would you like to say more?
                    </p>

                    <div className="space-y-3">
                      {/* Write option */}
                      <div
                        className={[
                          "rounded-3xl p-5 transition-all cursor-pointer",
                          expressionMethod === "write"
                            ? "ring-2 ring-primary/30"
                            : "",
                        ].join(" ")}
                        style={{ background: "rgba(255,255,255,0.8)" }}
                        onClick={() => setExpressionMethod("write")}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setExpressionMethod("write")
                        }
                        aria-label="Write it out option"
                        data-ocid="emotion_checkin.panel"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span aria-hidden="true">✍️</span>
                          <span className="text-sm font-semibold text-veil-text">
                            Write it out
                          </span>
                        </div>
                        <AnimatePresence>
                          {expressionMethod === "write" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <textarea
                                data-ocid="emotion_checkin.textarea"
                                className="w-full rounded-2xl p-4 text-sm text-veil-text bg-background border border-border/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                rows={4}
                                placeholder={getDailyPlaceholder()}
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                aria-label="Write your feelings"
                              />

                              {/* AI guidance */}
                              <AnimatePresence>
                                {showAiPrompt && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-3 p-3 rounded-2xl flex items-start gap-2"
                                    style={{
                                      background: "rgba(168,197,160,0.18)",
                                    }}
                                  >
                                    <span
                                      className="text-base"
                                      aria-hidden="true"
                                    >
                                      🌿
                                    </span>
                                    <div className="flex-1">
                                      <p className="text-xs text-veil-text leading-relaxed">
                                        {selectedEmotion.aiPrompt}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      data-ocid="emotion_checkin.close_button"
                                      onClick={() => setAiPromptDismissed(true)}
                                      className="text-veil-muted text-xs ml-1 hover:text-veil-text transition-colors"
                                      aria-label="Dismiss Veil guidance"
                                    >
                                      ✕
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Crisis detection */}
                              <AnimatePresence>
                                {crisisDetected && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 p-4 rounded-2xl"
                                    style={{
                                      background: "rgba(242,181,197,0.22)",
                                    }}
                                    data-ocid="emotion_checkin.panel"
                                    role="alert"
                                    aria-live="polite"
                                  >
                                    <p className="text-sm text-veil-text mb-2">
                                      Veil cares about you. If things feel very
                                      heavy right now, you don't have to face it
                                      alone.
                                    </p>
                                    <button
                                      type="button"
                                      data-ocid="emotion_checkin.button"
                                      onClick={() =>
                                        setShowCrisisResources(
                                          !showCrisisResources,
                                        )
                                      }
                                      className="text-sm font-medium text-primary underline decoration-dotted"
                                    >
                                      {showCrisisResources
                                        ? "Hide support options"
                                        : "See support options"}
                                    </button>
                                    <AnimatePresence>
                                      {showCrisisResources && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{
                                            opacity: 1,
                                            height: "auto",
                                          }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="mt-3 space-y-2"
                                        >
                                          {[
                                            {
                                              label: "iCall India",
                                              detail: "9152987821",
                                              href: "tel:9152987821",
                                            },
                                            {
                                              label: "Vandrevala Foundation",
                                              detail: "1860-2662-345",
                                              href: "tel:18602662345",
                                            },
                                            {
                                              label: "Crisis Text Line (US)",
                                              detail: "Text HOME to 741741",
                                              href: "sms:741741?body=HOME",
                                            },
                                            {
                                              label: "International resources",
                                              detail: "iasp.info",
                                              href: "https://www.iasp.info/resources/Crisis_Centres/",
                                            },
                                          ].map((r) => (
                                            <a
                                              key={r.label}
                                              href={r.href}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 p-2 rounded-xl text-xs text-veil-text hover:bg-white/60 transition-colors"
                                            >
                                              <span className="text-primary">
                                                🌿
                                              </span>
                                              <span className="font-medium">
                                                {r.label}
                                              </span>
                                              <span className="text-veil-muted">
                                                — {r.detail}
                                              </span>
                                            </a>
                                          ))}
                                          <p className="text-xs text-veil-muted pt-1">
                                            You can also keep writing. Veil is
                                            still here.
                                          </p>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Voice note option */}
                      <div
                        className={[
                          "rounded-3xl p-5 transition-all cursor-pointer",
                          expressionMethod === "voice"
                            ? "ring-2 ring-primary/30"
                            : "",
                        ].join(" ")}
                        style={{ background: "rgba(255,255,255,0.8)" }}
                        onClick={() =>
                          expressionMethod !== "voice" &&
                          setExpressionMethod("voice")
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          expressionMethod !== "voice" &&
                          setExpressionMethod("voice")
                        }
                        aria-label="Voice note option"
                        data-ocid="emotion_checkin.panel"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span aria-hidden="true">🎙️</span>
                          <span className="text-sm font-semibold text-veil-text">
                            Voice note
                          </span>
                        </div>
                        <p className="text-xs text-veil-muted mb-3">
                          Speak it softly, or just breathe. Veil is listening.
                        </p>

                        <AnimatePresence>
                          {expressionMethod === "voice" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <VoiceWaveform active={isRecording} />

                              <div className="flex items-center justify-between mt-3 mb-4">
                                <span
                                  className="text-xs text-veil-muted"
                                  aria-live="polite"
                                >
                                  {isRecording
                                    ? "Recording..."
                                    : voiceSeconds > 0
                                      ? "Recorded"
                                      : "Ready"}
                                </span>
                                <span
                                  className="text-sm font-mono text-veil-text"
                                  aria-live="polite"
                                >
                                  {formatDuration(voiceSeconds)}
                                </span>
                              </div>

                              <button
                                type="button"
                                data-ocid="emotion_checkin.button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  isRecording
                                    ? stopRecording()
                                    : startRecording();
                                }}
                                className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
                                style={{
                                  background: isRecording
                                    ? "linear-gradient(135deg, rgba(242,181,197,0.5) 0%, rgba(201,184,232,0.4) 100%)"
                                    : "linear-gradient(135deg, rgba(201,184,232,0.4) 0%, rgba(168,197,160,0.35) 100%)",
                                  color: "oklch(0.453 0.112 295)",
                                }}
                                aria-label={
                                  isRecording
                                    ? "Tap to stop recording"
                                    : "Tap to start recording"
                                }
                                aria-pressed={isRecording}
                              >
                                {isRecording
                                  ? "🔴  Tap to stop"
                                  : "🎙️  Tap to speak"}
                              </button>

                              <p className="mt-3 text-xs text-veil-muted text-center">
                                🔒 Voice notes are always kept private — just
                                for you.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Log only */}
                      <button
                        type="button"
                        data-ocid="emotion_checkin.button"
                        onClick={() => setExpressionMethod("log")}
                        className={[
                          "w-full p-4 rounded-2xl text-sm font-medium text-veil-muted transition-all text-center active:scale-98",
                          expressionMethod === "log"
                            ? "ring-2 ring-primary/30 bg-white/90"
                            : "bg-white/60 hover:bg-white/80",
                        ].join(" ")}
                        aria-pressed={expressionMethod === "log"}
                      >
                        Just log my emotion — no words needed
                      </button>
                    </div>

                    {expressionMethod && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        type="button"
                        data-ocid="emotion_checkin.primary_button"
                        onClick={() => setStage(3)}
                        className="w-full mt-6 py-4 rounded-2xl text-sm font-semibold text-primary-foreground transition-all active:scale-98 shadow-soft"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.453 0.112 295) 0%, oklch(0.5 0.1 295) 100%)",
                        }}
                        disabled={expressionMethod === "voice" && isRecording}
                      >
                        Continue →
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* ── STAGE 3 — Visibility ──────────────────────────────────── */}
                {stage === 3 && (
                  <motion.div
                    key="stage3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-8"
                  >
                    <h2 className="font-serif text-xl font-semibold text-veil-text mb-1">
                      Who should hold this with you?
                    </h2>
                    <p className="text-sm text-veil-muted mb-6">
                      Your emotion, your choice — always safe.
                    </p>

                    {voiceOverride ? (
                      <div
                        className="p-4 rounded-2xl mb-4 text-sm text-veil-text"
                        style={{ background: "rgba(201,184,232,0.2)" }}
                      >
                        🔒 Voice notes are always kept private — just for you.
                      </div>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            data-ocid="emotion_checkin.button"
                            onClick={() => {
                              if (
                                opt.value === "global_anonymous" &&
                                !globalConfirmed
                              ) {
                                setShowGlobalConfirm(true);
                              } else {
                                setVisibility(opt.value);
                              }
                            }}
                            className={[
                              "w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all active:scale-98",
                              visibility === opt.value
                                ? "ring-2 ring-primary/30"
                                : "hover:bg-white/80",
                            ].join(" ")}
                            style={{
                              background:
                                visibility === opt.value
                                  ? "linear-gradient(135deg, rgba(201,184,232,0.3) 0%, rgba(168,197,160,0.2) 100%)"
                                  : "rgba(255,255,255,0.7)",
                            }}
                            aria-pressed={visibility === opt.value}
                          >
                            <span className="text-xl" aria-hidden="true">
                              {opt.emoji}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-veil-text">
                                {opt.label}
                              </p>
                              <p className="text-xs text-veil-muted mt-0.5">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Global anonymous confirmation */}
                    <AnimatePresence>
                      {showGlobalConfirm && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-5 rounded-3xl mb-4"
                          style={{ background: "rgba(242,181,197,0.2)" }}
                          data-ocid="emotion_checkin.dialog"
                          aria-label="Anonymous sharing confirmation"
                        >
                          <p className="text-sm text-veil-text mb-1 font-medium">
                            Share anonymously?
                          </p>
                          <p className="text-xs text-veil-muted mb-4 leading-relaxed">
                            Your emotion will be shared anonymously — no name,
                            no photo, no identity. Only your feeling and words.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              data-ocid="emotion_checkin.confirm_button"
                              onClick={() => {
                                setVisibility("global_anonymous");
                                setGlobalConfirmed(true);
                                localStorage.setItem(
                                  "veil_global_anon_confirmed",
                                  "true",
                                );
                                setShowGlobalConfirm(false);
                              }}
                              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-primary-foreground transition-all active:scale-95"
                              style={{ background: "oklch(0.453 0.112 295)" }}
                            >
                              Yes, share anonymously
                            </button>
                            <button
                              type="button"
                              data-ocid="emotion_checkin.cancel_button"
                              onClick={() => setShowGlobalConfirm(false)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-veil-muted bg-white/70 transition-all active:scale-95"
                            >
                              Go back
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      data-ocid="emotion_checkin.primary_button"
                      onClick={() => setStage(4)}
                      disabled={showGlobalConfirm}
                      className="w-full py-4 rounded-2xl text-sm font-semibold text-primary-foreground transition-all active:scale-98 shadow-soft disabled:opacity-50"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.453 0.112 295) 0%, oklch(0.5 0.1 295) 100%)",
                      }}
                    >
                      Continue →
                    </button>
                  </motion.div>
                )}

                {/* ── STAGE 4 — Put it down ─────────────────────────────────── */}
                {stage === 4 && (
                  <motion.div
                    key="stage4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-8"
                  >
                    {selectedEmotion && (
                      <div
                        className="mb-6 p-5 rounded-3xl"
                        style={{ background: "rgba(255,255,255,0.7)" }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">
                            {selectedEmotion.emoji}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-veil-text">
                              {selectedEmotion.label}
                            </p>
                            <p className="text-xs text-veil-muted">
                              {
                                VISIBILITY_OPTIONS.find(
                                  (v) => v.value === effectiveVisibility,
                                )?.label
                              }
                            </p>
                          </div>
                        </div>
                        {textContent && (
                          <p className="text-xs text-veil-muted italic line-clamp-3">
                            {textContent}
                          </p>
                        )}
                        {expressionMethod === "voice" && voiceSeconds > 0 && (
                          <p className="text-xs text-veil-muted">
                            Voice note — {formatDuration(voiceSeconds)}
                          </p>
                        )}
                        {expressionMethod === "log" && (
                          <p className="text-xs text-veil-muted">
                            Emotion only — no words needed.
                          </p>
                        )}
                      </div>
                    )}

                    <div
                      className="p-4 rounded-2xl mb-8 text-center"
                      style={{ background: "rgba(201,184,232,0.15)" }}
                    >
                      <p className="text-sm text-veil-muted leading-relaxed">
                        🔒 Only you and Veil. Always private. Never shared.
                      </p>
                    </div>

                    <button
                      type="button"
                      data-ocid="emotion_checkin.submit_button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-5 rounded-3xl text-base font-semibold text-primary-foreground transition-all active:scale-98 shadow-soft disabled:opacity-60"
                      style={{
                        background: submitting
                          ? "oklch(0.7 0.06 295)"
                          : "linear-gradient(135deg, oklch(0.453 0.112 295) 0%, oklch(0.48 0.09 320) 100%)",
                        boxShadow: "0 8px 32px rgba(107,91,142,0.28)",
                        fontSize: "1rem",
                        letterSpacing: "0.01em",
                      }}
                      aria-label="Put it down — submit check-in"
                    >
                      {submitting ? "Veil is receiving..." : "Put it down"}
                    </button>

                    <p className="text-center text-xs text-veil-muted mt-4">
                      Veil will hold this gently. You'll feel lighter.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
