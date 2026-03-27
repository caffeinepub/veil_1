// ─── Celebration Flow ────────────────────────────────────────────────────────
// Positive Emotion Celebration System for Veil.
// Replaces the standard Exhale screen when a positive emotion is detected.
// Full-screen overlay. Warm gold/amber palette. Everything moves upward.

import { Slider } from "@/components/ui/slider";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type {
  MilestoneLevel,
  PositiveEmotionType,
} from "../lib/positiveEmotionDetection";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CelebrationFlowProps {
  emotionType: PositiveEmotionType;
  milestoneLevel: MilestoneLevel;
  intensity: number;
  onComplete: () => void;
  onNavigateToWrite?: () => void;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

const CELEBRATION_MESSAGES: Record<PositiveEmotionType, string> = {
  HAPPY:
    "Something good happened today.\n\nHold onto that.\n\nYou deserve to feel this fully — not just for a moment — all the way through.",
  GRATEFUL:
    "You are carrying gratitude today.\n\nThat is one of the rarest things a person can feel.\n\nLet yourself feel the full weight of it.",
  HOPEFUL:
    "Something opened up for you.\n\nHope is not small.\n\nIt is one of the most powerful things you can carry.\n\nHold it carefully.",
  EXCITED:
    "Something wonderful is alive in you right now.\n\nDo not rush past it.\n\nFeel it completely.",
  LOVED:
    "Someone chose you. Someone sees you.\n\nLet that land.\n\nReally land.",
  CALM: "This feeling — this stillness — is rare and precious.\n\nVeil is celebrating it with you.\n\nYou earned this.",
  PROMOTION:
    "You worked for this.\n\nThis moment is yours.\n\nLet yourself feel the full weight of it — every hour that led here, every doubt you pushed through, every day you kept going.\n\nThis is what that looks like.\n\nFeel it.",
  NEW_RELATIONSHIP:
    "You are carrying something beautiful today.\n\nVeil felt it in every word you said.\n\nThis kind of feeling — remember it.\n\nIt is worth remembering.",
  MARRIAGE:
    "You are beginning something.\n\nSomething real and rare and chosen.\n\nThis is the feeling to carry into everything that comes after.\n\nHold it.",
  ENGAGEMENT:
    "You are beginning something.\n\nSomething real and rare and chosen.\n\nThis is the feeling to carry into everything that comes after.\n\nHold it.",
  HONEYMOON:
    "You are fully alive right now.\n\nNot carrying anything heavy. Not rushing toward anything.\n\nJust this. Just here. Just everything good.\n\nVeil is here with you in this.",
  BIRTH_OF_CHILD:
    "Something extraordinary just happened.\n\nThe world is different now — because of you.\n\nThis feeling — this specific feeling — right now —\n\nremember it.\n\nOn the hardest days that come — and some will — remember this exact feeling.\n\nIt will carry you.",
  PERSONAL_ACHIEVEMENT:
    "This is what it feels like when the work pays off.\n\nYou did not give up. You kept going. You earned this moment.\n\nDo not move past it too quickly.\n\nFeel it completely first.",
};

const MILESTONE_MARKER_MESSAGES: Partial<Record<PositiveEmotionType, string>> =
  {
    BIRTH_OF_CHILD:
      "A child was born.\n\nToday, everything changed.\n\nVeil will remember this day with you.",
    MARRIAGE:
      "You made a choice today that changes everything.\n\nVeil will remember this day with you.",
    ENGAGEMENT:
      "You said yes.\n\nSomething new begins today.\n\nVeil will remember this day with you.",
    HONEYMOON:
      "You are living one of the most alive moments of your life.\n\nVeil is here with you in it.",
  };

const FINAL_MESSAGES: Record<MilestoneLevel, string> = {
  EVERYDAY:
    "You felt something good today.\n\nYou let yourself feel it.\n\nThat is not nothing.\n\nGo carry this into the rest of your day.",
  SIGNIFICANT:
    "Something real happened today.\n\nYou showed up for it. You felt it fully. You captured it.\n\nIt is yours now — not just for today. For whenever you need it.",
  LIFE: "This is one of the days you will remember.\n\nYou were here for it. You felt it completely.\n\nVeil was here with you.\n\nGo live the rest of it.",
};

// ─── Background styles ─────────────────────────────────────────────────────────

function getBg(level: MilestoneLevel): React.CSSProperties {
  if (level === "LIFE") {
    return {
      background:
        "linear-gradient(160deg, #E8C060 0%, #F9E4A0 50%, #FFF8E7 100%)",
    };
  }
  if (level === "SIGNIFICANT") {
    return { backgroundColor: "#E8C060" };
  }
  return { backgroundColor: "#F9E4A0" };
}

const TEXT_COLOR = "#5C3D00";

// ─── Animations ────────────────────────────────────────────────────────────────

function RisingParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 6 + (i % 4) * 3,
            height: 6 + (i % 4) * 3,
            backgroundColor:
              i % 3 === 0 ? "#E8A800" : i % 3 === 1 ? "#F9C94E" : "#FFE084",
            left: `${8 + ((i * 6.5) % 84)}%`,
            bottom: "-10%",
            opacity: 0,
          }}
          animate={{
            y: ["-0vh", "-110vh"],
            x: [0, (i % 2 === 0 ? 1 : -1) * (10 + ((i * 7) % 30))],
            opacity: [0, 0.85, 0.6, 0],
          }}
          transition={{
            duration: 4 + (i % 3),
            delay: (i * 0.3) % 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function ExpandingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: "#C8900080" }}
          animate={{
            width: [60, 420],
            height: [60, 420],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 3.5,
            delay: i * 0.9,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function RadiantExpansion() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <motion.div
        className="absolute rounded-full"
        style={{
          background: "radial-gradient(circle, #FFE08490 0%, transparent 70%)",
        }}
        animate={{
          width: [200, 900],
          height: [200, 900],
          opacity: [0.9, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function GentlePulse() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="w-48 h-48 rounded-full"
        style={{
          background: "radial-gradient(circle, #E8A80040 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{
          duration: 3.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// ─── Text formatter ────────────────────────────────────────────────────────────

function FormattedText({
  text,
  className = "",
}: { text: string; className?: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p
          key={p.slice(0, 20)}
          className={i > 0 ? "mt-4" : ""}
          style={{ color: TEXT_COLOR }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

type FlowScreen =
  | "celebration"
  | "milestone_marker"
  | "phase1_feel"
  | "phase2_capture"
  | "phase2_write"
  | "phase2_voice"
  | "phase3_multiply"
  | "final"
  | "wellbeing";

// ─── Phase 2: Write ────────────────────────────────────────────────────────────

const DELIVERY_OPTIONS = [
  { key: "3_MONTHS", label: "In 3 months" },
  { key: "6_MONTHS", label: "In 6 months" },
  { key: "1_YEAR", label: "In 1 year" },
  { key: "HARD_DAY", label: "When I'm having a really hard day" },
  { key: "CUSTOM", label: "Choose a date" },
] as const;
type DeliveryType = (typeof DELIVERY_OPTIONS)[number]["key"];

function Phase2Write({
  emotionType,
  milestoneLevel,
  onDone,
}: {
  emotionType: PositiveEmotionType;
  milestoneLevel: MilestoneLevel;
  onDone: () => void;
}) {
  const [content, setContent] = useState(
    "To the version of me who needs to remember this — ",
  );
  const [delivery, setDelivery] = useState<DeliveryType | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!delivery) return;
    const entry = {
      type: "written",
      content,
      deliveryType: delivery,
      customDate: delivery === "CUSTOM" ? customDate : null,
      emotionType,
      milestoneLevel,
      createdAt: Date.now(),
      delivered: false,
    };
    localStorage.setItem(
      `veil-captured-joy-${Date.now()}`,
      JSON.stringify(entry),
    );
    setSaved(true);
    setTimeout(onDone, 1200);
  }

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center px-8"
      >
        <div className="text-5xl mb-4">📖</div>
        <p
          className="text-lg font-serif font-semibold"
          style={{ color: TEXT_COLOR }}
        >
          Captured.
        </p>
        <p className="text-sm mt-2 opacity-70" style={{ color: TEXT_COLOR }}>
          Your future self will find it when they need it most.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 py-6">
      <h2
        className="font-serif text-xl font-semibold mb-4 leading-snug"
        style={{ color: TEXT_COLOR }}
      >
        Write what this feels like
      </h2>

      <textarea
        data-ocid="celebration.capture.textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={7}
        className="w-full rounded-2xl px-4 py-3 text-sm leading-relaxed resize-none outline-none mb-2"
        style={{
          backgroundColor: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(92,61,0,0.15)",
          color: TEXT_COLOR,
        }}
      />

      <div className="space-y-0.5 mb-5">
        {[
          "What exactly happened today?",
          "How does your body feel carrying this joy?",
          "What do you want your future self to know?",
          "What does this tell you about yourself?",
          "What made this possible?",
        ].map((prompt) => (
          <p
            key={prompt}
            className="text-xs opacity-40"
            style={{ color: TEXT_COLOR }}
          >
            · {prompt}
          </p>
        ))}
      </div>

      <p className="text-sm font-medium mb-3" style={{ color: TEXT_COLOR }}>
        When would you like to send this to yourself?
      </p>

      <div className="flex flex-col gap-2 mb-5">
        {DELIVERY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            data-ocid={`celebration.delivery.${opt.key.toLowerCase()}.button`}
            onClick={() => setDelivery(opt.key)}
            className="w-full py-3 px-4 rounded-2xl text-sm font-medium text-left transition-all"
            style={{
              backgroundColor:
                delivery === opt.key
                  ? "rgba(92,61,0,0.15)"
                  : "rgba(255,255,255,0.4)",
              border: `1px solid ${delivery === opt.key ? "rgba(92,61,0,0.3)" : "rgba(92,61,0,0.1)"}`,
              color: TEXT_COLOR,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {delivery === "CUSTOM" && (
        <input
          type="date"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
          style={{
            backgroundColor: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(92,61,0,0.15)",
            color: TEXT_COLOR,
          }}
        />
      )}

      <button
        data-ocid="celebration.capture.save_button"
        type="button"
        disabled={!delivery || !content.trim()}
        onClick={handleSave}
        className="w-full py-4 rounded-full font-semibold text-sm transition-all disabled:opacity-40"
        style={{
          backgroundColor: "rgba(92,61,0,0.85)",
          color: "#FFF8E7",
        }}
      >
        Capture this moment
      </button>
    </div>
  );
}

// ─── Phase 2: Voice ────────────────────────────────────────────────────────────

function Phase2Voice({
  emotionType,
  milestoneLevel,
  onDone,
}: {
  emotionType: PositiveEmotionType;
  milestoneLevel: MilestoneLevel;
  onDone: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryType | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [seconds, setSeconds] = useState(0);

  function startRecording() {
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setDone(true);
  }

  function handleSave() {
    if (!delivery) return;
    const entry = {
      type: "voice",
      content: `[Voice note — ${seconds}s captured]`,
      deliveryType: delivery,
      customDate: delivery === "CUSTOM" ? customDate : null,
      emotionType,
      milestoneLevel,
      durationSeconds: seconds,
      createdAt: Date.now(),
      delivered: false,
    };
    localStorage.setItem(
      `veil-captured-joy-${Date.now()}`,
      JSON.stringify(entry),
    );
    setSaved(true);
    setTimeout(onDone, 1200);
  }

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center px-8"
      >
        <div className="text-5xl mb-4">🎤</div>
        <p
          className="text-lg font-serif font-semibold"
          style={{ color: TEXT_COLOR }}
        >
          Your voice is safe here.
        </p>
        <p className="text-sm mt-2 opacity-70" style={{ color: TEXT_COLOR }}>
          Future you will hear exactly how you felt today.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 py-6">
      <h2
        className="font-serif text-xl font-semibold mb-3 leading-snug"
        style={{ color: TEXT_COLOR }}
      >
        Say it out loud
      </h2>

      {!done && (
        <>
          <p
            className="text-sm mb-6 leading-relaxed opacity-70"
            style={{ color: TEXT_COLOR }}
          >
            Tell yourself what this moment feels like. In your own voice. So
            your future self can hear exactly how you felt today.
          </p>
          <div className="flex flex-col items-center gap-5 mt-4">
            {recording && (
              <motion.div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: TEXT_COLOR }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Recording... {seconds}s
              </motion.div>
            )}
            <button
              data-ocid={
                recording
                  ? "celebration.voice.stop_button"
                  : "celebration.voice.start_button"
              }
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all active:scale-95"
              style={{
                backgroundColor: recording
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(92,61,0,0.12)",
                border: `3px solid ${recording ? "rgba(239,68,68,0.5)" : "rgba(92,61,0,0.3)"}`,
              }}
            >
              {recording ? "⏹" : "🎤"}
            </button>
            <p className="text-xs opacity-50" style={{ color: TEXT_COLOR }}>
              {recording ? "Tap to finish" : "Tap to start"}
            </p>
          </div>
        </>
      )}

      {done && (
        <>
          <p className="text-sm mb-4 font-medium" style={{ color: TEXT_COLOR }}>
            When would you like to send this to yourself?
          </p>
          <div className="flex flex-col gap-2 mb-5">
            {DELIVERY_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDelivery(opt.key)}
                className="w-full py-3 px-4 rounded-2xl text-sm font-medium text-left transition-all"
                style={{
                  backgroundColor:
                    delivery === opt.key
                      ? "rgba(92,61,0,0.15)"
                      : "rgba(255,255,255,0.4)",
                  border: `1px solid ${delivery === opt.key ? "rgba(92,61,0,0.3)" : "rgba(92,61,0,0.1)"}`,
                  color: TEXT_COLOR,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {delivery === "CUSTOM" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(92,61,0,0.15)",
                color: TEXT_COLOR,
              }}
            />
          )}
          <button
            data-ocid="celebration.voice.save_button"
            type="button"
            disabled={!delivery}
            onClick={handleSave}
            className="w-full py-4 rounded-full font-semibold text-sm transition-all disabled:opacity-40"
            style={{ backgroundColor: "rgba(92,61,0,0.85)", color: "#FFF8E7" }}
          >
            Save this voice note
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main CelebrationFlow ─────────────────────────────────────────────────────

export function CelebrationFlow({
  emotionType,
  milestoneLevel,
  intensity: _intensity,
  onComplete,
  onNavigateToWrite,
}: CelebrationFlowProps) {
  const [screen, setScreen] = useState<FlowScreen>(
    milestoneLevel === "LIFE" && MILESTONE_MARKER_MESSAGES[emotionType]
      ? "celebration"
      : "celebration",
  );
  const [phase1Paused, setPhase1Paused] = useState(false);
  const [phase1Complete, setPhase1Complete] = useState(false);
  const [phase1Progress, setPhase1Progress] = useState(0);
  const [showSkip, setShowSkip] = useState(milestoneLevel !== "LIFE");
  const [milestoneNameInput, setMilestoneNameInput] = useState("");
  const [showCelebrationCTA, setShowCelebrationCTA] = useState(false);
  const [wellbeingValue, setWellbeingValue] = useState([5]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const bgStyle = getBg(milestoneLevel);

  // Celebration screen: auto-show CTA after 3s, auto-advance after 8s
  useEffect(() => {
    if (screen !== "celebration") return;
    const ctaTimer = setTimeout(() => setShowCelebrationCTA(true), 3000);
    const advanceTimer = setTimeout(() => {
      if (milestoneLevel === "LIFE" && MILESTONE_MARKER_MESSAGES[emotionType]) {
        setScreen("milestone_marker");
      } else {
        setScreen("phase1_feel");
      }
    }, 8000);
    return () => {
      clearTimeout(ctaTimer);
      clearTimeout(advanceTimer);
    };
  }, [screen, milestoneLevel, emotionType]);

  // Phase 1 timer
  useEffect(() => {
    if (screen !== "phase1_feel") return;
    // Show skip for LIFE after 30s, immediately for others
    if (milestoneLevel === "LIFE") {
      const skipTimer = setTimeout(() => setShowSkip(true), 30000);
      return () => clearTimeout(skipTimer);
    }
    setShowSkip(true);
  }, [screen, milestoneLevel]);

  useEffect(() => {
    if (screen !== "phase1_feel" || phase1Paused || phase1Complete) return;
    intervalRef.current = setInterval(() => {
      setPhase1Progress((p) => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPhase1Complete(true);
          return 100;
        }
        return p + 100 / 60;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [screen, phase1Paused, phase1Complete]);

  // Auto-advance after phase1 complete text
  useEffect(() => {
    if (!phase1Complete) return;
    const t = setTimeout(() => setScreen("phase2_capture"), 2500);
    return () => clearTimeout(t);
  }, [phase1Complete]);

  function handleWellbeing() {
    const delta = wellbeingValue[0] - (_intensity ?? 5);
    try {
      localStorage.setItem(
        `veil-joy-wellbeing-${Date.now()}`,
        JSON.stringify({
          pre: _intensity,
          post: wellbeingValue[0],
          delta,
          emotionType,
          milestoneLevel,
        }),
      );
    } catch {
      // ignore
    }
    onComplete();
  }

  function handleMilestoneMarkerContinue() {
    if (milestoneNameInput.trim()) {
      try {
        localStorage.setItem(
          `veil-milestone-${Date.now()}`,
          JSON.stringify({
            emotionType,
            milestoneLevel,
            name: milestoneNameInput.trim(),
            date: new Date().toISOString(),
          }),
        );
      } catch {
        // ignore
      }
    }
    setScreen("phase1_feel");
  }

  return (
    <motion.div
      data-ocid="celebration.modal"
      className="fixed inset-0 z-[100] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={bgStyle}
    >
      <div className="max-w-[430px] mx-auto w-full h-full flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ── Celebration Screen ── */}
          {screen === "celebration" && (
            <motion.div
              key="celebration"
              className="flex flex-col items-center justify-center flex-1 px-8 text-center relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7 }}
            >
              {!reduceMotion && milestoneLevel === "EVERYDAY" && (
                <RisingParticles />
              )}
              {!reduceMotion && milestoneLevel === "SIGNIFICANT" && (
                <ExpandingRings />
              )}
              {!reduceMotion && milestoneLevel === "LIFE" && (
                <RadiantExpansion />
              )}

              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <p
                  className="font-serif text-2xl font-semibold leading-relaxed mb-2"
                  style={{ color: TEXT_COLOR }}
                >
                  {CELEBRATION_MESSAGES[emotionType].split("\n\n")[0]}
                </p>
                <FormattedText
                  text={CELEBRATION_MESSAGES[emotionType]
                    .split("\n\n")
                    .slice(1)
                    .join("\n\n")}
                  className="text-base leading-relaxed mt-3 opacity-85"
                />
              </motion.div>

              <AnimatePresence>
                {showCelebrationCTA && (
                  <motion.div
                    key="celebration-cta"
                    className="relative z-10 mt-12 flex flex-col gap-3 w-full max-w-xs"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <button
                      data-ocid="celebration.deeper.button"
                      type="button"
                      onClick={() => {
                        if (
                          milestoneLevel === "LIFE" &&
                          MILESTONE_MARKER_MESSAGES[emotionType]
                        ) {
                          setScreen("milestone_marker");
                        } else {
                          setScreen("phase1_feel");
                        }
                      }}
                      className="w-full py-4 rounded-full font-semibold text-sm transition-all active:scale-95"
                      style={{
                        backgroundColor: "rgba(92,61,0,0.85)",
                        color: "#FFF8E7",
                      }}
                    >
                      Yes — take me deeper
                    </button>
                    <button
                      data-ocid="celebration.skip_to_final.button"
                      type="button"
                      onClick={() => setScreen("final")}
                      className="w-full py-3 rounded-full text-sm font-medium transition-all"
                      style={{
                        backgroundColor: "rgba(92,61,0,0.1)",
                        color: TEXT_COLOR,
                      }}
                    >
                      Go live it
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Life Milestone Marker ── */}
          {screen === "milestone_marker" && (
            <motion.div
              key="milestone_marker"
              className="flex flex-col items-center justify-center flex-1 px-8 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7 }}
            >
              <FormattedText
                text={MILESTONE_MARKER_MESSAGES[emotionType] ?? ""}
                className="font-serif text-2xl font-semibold leading-relaxed mb-8"
              />
              <input
                type="text"
                data-ocid="celebration.milestone.input"
                value={milestoneNameInput}
                onChange={(e) => setMilestoneNameInput(e.target.value)}
                placeholder={
                  emotionType === "BIRTH_OF_CHILD"
                    ? "What is their name? (optional)"
                    : "What would you like to call this day? (optional)"
                }
                className="w-full max-w-xs rounded-2xl px-4 py-3 text-sm text-center outline-none mb-8"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(92,61,0,0.15)",
                  color: TEXT_COLOR,
                }}
              />
              <button
                data-ocid="celebration.milestone.continue_button"
                type="button"
                onClick={handleMilestoneMarkerContinue}
                className="w-full max-w-xs py-4 rounded-full font-semibold text-sm transition-all active:scale-95"
                style={{
                  backgroundColor: "rgba(92,61,0,0.85)",
                  color: "#FFF8E7",
                }}
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ── Phase 1: Feel It Fully ── */}
          {screen === "phase1_feel" && (
            <motion.div
              key="phase1"
              className="flex flex-col flex-1 px-8 pt-20 pb-10 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              onClick={() => {
                if (!phase1Complete) setPhase1Paused((p) => !p);
              }}
              style={{ cursor: "default" }}
            >
              <div
                className="absolute inset-0 rounded-none"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              />
              {!reduceMotion && <GentlePulse />}

              <div className="relative z-10 flex flex-col items-center text-center flex-1 justify-center">
                <AnimatePresence mode="wait">
                  {!phase1Complete ? (
                    <motion.div
                      key="phase1-active"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {!phase1Paused ? (
                        <p
                          className="font-serif text-xl leading-relaxed"
                          style={{ color: TEXT_COLOR }}
                        >
                          Before you go — <br />
                          take 60 seconds.
                          <br />
                          <br />
                          Just to feel this.
                          <br />
                          No doing. No sharing.
                          <br />
                          No next thing.
                          <br />
                          <br />
                          Just this feeling.
                          <br />
                          Right now. Completely.
                        </p>
                      ) : (
                        <p
                          className="font-serif text-xl leading-relaxed"
                          style={{ color: TEXT_COLOR }}
                        >
                          Take your time.
                          <br />
                          <br />
                          This moment is yours.
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="phase1-done"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <p
                        className="font-serif text-xl leading-relaxed"
                        style={{ color: TEXT_COLOR }}
                      >
                        You felt it.
                        <br />
                        Really felt it.
                        <br />
                        <br />
                        That is rarer than you know.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!phase1Complete && (
                <div className="relative z-10 mt-8">
                  <div
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: "rgba(92,61,0,0.15)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${phase1Progress}%`,
                        backgroundColor: "rgba(92,61,0,0.4)",
                      }}
                    />
                  </div>
                  <p
                    className="text-xs text-center mt-2 opacity-50"
                    style={{ color: TEXT_COLOR }}
                  >
                    60 seconds is yours
                  </p>
                </div>
              )}

              <AnimatePresence>
                {showSkip && !phase1Complete && (
                  <motion.button
                    key="skip"
                    data-ocid="celebration.phase1.skip_button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScreen("phase2_capture");
                    }}
                    className="relative z-10 mt-6 text-sm font-medium self-center px-5 py-2 rounded-full transition-all"
                    style={{
                      color: TEXT_COLOR,
                      backgroundColor: "rgba(92,61,0,0.08)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    [ I need to go ]
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Phase 2: Capture It ── */}
          {screen === "phase2_capture" && (
            <motion.div
              key="phase2"
              className="flex flex-col flex-1 px-8 pt-20 pb-10 text-center items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="font-serif text-xl leading-relaxed mb-10"
                style={{ color: TEXT_COLOR }}
              >
                This feeling will not always feel this strong.
                <br />
                <br />
                Would you like to capture it now — so Veil can bring it back
                when you need it most?
              </p>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  data-ocid="celebration.capture.write_button"
                  type="button"
                  onClick={() => setScreen("phase2_write")}
                  className="w-full p-5 rounded-3xl text-left transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(92,61,0,0.12)",
                  }}
                >
                  <div className="text-2xl mb-1">📖</div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: TEXT_COLOR }}
                  >
                    Write what this feels like
                  </p>
                  <p
                    className="text-xs mt-0.5 opacity-60"
                    style={{ color: TEXT_COLOR }}
                  >
                    A letter to yourself — from this exact moment.
                  </p>
                </button>

                <button
                  data-ocid="celebration.capture.voice_button"
                  type="button"
                  onClick={() => setScreen("phase2_voice")}
                  className="w-full p-5 rounded-3xl text-left transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(92,61,0,0.12)",
                  }}
                >
                  <div className="text-2xl mb-1">🎤</div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: TEXT_COLOR }}
                  >
                    Say it out loud
                  </p>
                  <p
                    className="text-xs mt-0.5 opacity-60"
                    style={{ color: TEXT_COLOR }}
                  >
                    Speak this feeling into existence. Private. Just yours.
                  </p>
                </button>
              </div>

              <button
                data-ocid="celebration.capture.skip_button"
                type="button"
                onClick={() => setScreen("phase3_multiply")}
                className="mt-7 text-sm font-medium px-5 py-2 rounded-full transition-all"
                style={{
                  color: TEXT_COLOR,
                  backgroundColor: "rgba(92,61,0,0.08)",
                }}
              >
                [ Keep it in my heart ]
              </button>
            </motion.div>
          )}

          {/* ── Phase 2: Write ── */}
          {screen === "phase2_write" && (
            <motion.div
              key="phase2_write"
              className="flex flex-col flex-1 overflow-hidden"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Phase2Write
                emotionType={emotionType}
                milestoneLevel={milestoneLevel}
                onDone={() => setScreen("phase3_multiply")}
              />
            </motion.div>
          )}

          {/* ── Phase 2: Voice ── */}
          {screen === "phase2_voice" && (
            <motion.div
              key="phase2_voice"
              className="flex flex-col flex-1 overflow-hidden"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Phase2Voice
                emotionType={emotionType}
                milestoneLevel={milestoneLevel}
                onDone={() => setScreen("phase3_multiply")}
              />
            </motion.div>
          )}

          {/* ── Phase 3: Multiply It ── */}
          {screen === "phase3_multiply" && (
            <motion.div
              key="phase3"
              className="flex flex-col flex-1 px-8 pt-20 pb-10 text-center items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="font-serif text-xl leading-relaxed mb-10"
                style={{ color: TEXT_COLOR }}
              >
                Joy grows when it is shared with the right person.
                <br />
                <br />
                Is there someone in your circle who would celebrate this with
                you?
              </p>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  data-ocid="celebration.multiply.share_button"
                  type="button"
                  onClick={() => {
                    // Show brief inner-circle share confirmation then go to final
                    try {
                      localStorage.setItem(
                        `veil-joy-shared-${Date.now()}`,
                        JSON.stringify({
                          emotionType,
                          milestoneLevel,
                          sharedAt: Date.now(),
                        }),
                      );
                    } catch {
                      // ignore
                    }
                    setScreen("final");
                  }}
                  className="w-full p-5 rounded-3xl text-left transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(92,61,0,0.12)",
                  }}
                >
                  <div className="text-2xl mb-1">🌿</div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: TEXT_COLOR }}
                  >
                    Share this feeling
                  </p>
                  <p
                    className="text-xs mt-0.5 opacity-60"
                    style={{ color: TEXT_COLOR }}
                  >
                    Let your Inner Circle celebrate with you.
                  </p>
                </button>

                <button
                  data-ocid="celebration.multiply.letter_button"
                  type="button"
                  onClick={() => {
                    if (onNavigateToWrite) {
                      onNavigateToWrite();
                    } else {
                      setScreen("final");
                    }
                  }}
                  className="w-full p-5 rounded-3xl text-left transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(92,61,0,0.12)",
                  }}
                >
                  <div className="text-2xl mb-1">💌</div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: TEXT_COLOR }}
                  >
                    Write them a love letter
                  </p>
                  <p
                    className="text-xs mt-0.5 opacity-60"
                    style={{ color: TEXT_COLOR }}
                  >
                    Tell someone what they mean to you in this moment.
                  </p>
                </button>
              </div>

              <button
                data-ocid="celebration.multiply.skip_button"
                type="button"
                onClick={() => setScreen("final")}
                className="mt-7 text-sm font-medium px-5 py-2 rounded-full transition-all"
                style={{
                  color: TEXT_COLOR,
                  backgroundColor: "rgba(92,61,0,0.08)",
                }}
              >
                [ Keep this just for me ]
              </button>
            </motion.div>
          )}

          {/* ── Final Screen ── */}
          {screen === "final" && (
            <motion.div
              key="final"
              className="flex flex-col items-center justify-center flex-1 px-8 text-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              {!reduceMotion && milestoneLevel === "LIFE" && (
                <RadiantExpansion />
              )}
              {!reduceMotion && milestoneLevel !== "LIFE" && (
                <RisingParticles />
              )}
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <FormattedText
                  text={FINAL_MESSAGES[milestoneLevel]}
                  className="font-serif text-xl leading-relaxed mb-10"
                />
                <button
                  data-ocid="celebration.final.button"
                  type="button"
                  onClick={() => setScreen("wellbeing")}
                  className="w-full max-w-xs py-5 rounded-full font-bold text-base transition-all active:scale-95 mt-2"
                  style={{
                    backgroundColor: "rgba(92,61,0,0.85)",
                    color: "#FFF8E7",
                  }}
                >
                  Go live it
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── Wellbeing Measurement ── */}
          {screen === "wellbeing" && (
            <motion.div
              key="wellbeing"
              className="flex flex-col items-center justify-center flex-1 px-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="font-serif text-xl font-semibold mb-2"
                style={{ color: TEXT_COLOR }}
              >
                How full are you carrying now?
              </p>
              <p
                className="text-sm mb-10 opacity-60"
                style={{ color: TEXT_COLOR }}
              >
                Just okay → Completely full
              </p>

              <div className="flex items-center gap-4 w-full max-w-xs mb-3">
                <span className="text-2xl">😐</span>
                <div className="flex-1">
                  <Slider
                    data-ocid="celebration.wellbeing.slider"
                    value={wellbeingValue}
                    onValueChange={setWellbeingValue}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                    aria-label="Joy fullness slider. 1 is just okay. 10 is completely full."
                  />
                </div>
                <span className="text-2xl">🌟</span>
              </div>

              <p
                className="text-sm font-semibold mb-10"
                style={{ color: TEXT_COLOR }}
              >
                {wellbeingValue[0]} / 10
              </p>

              <button
                data-ocid="celebration.wellbeing.confirm_button"
                type="button"
                onClick={handleWellbeing}
                className="w-full max-w-xs py-4 rounded-full font-semibold text-sm transition-all active:scale-95 mb-3"
                style={{
                  backgroundColor: "rgba(92,61,0,0.85)",
                  color: "#FFF8E7",
                }}
              >
                Done
              </button>

              <button
                data-ocid="celebration.wellbeing.skip_button"
                type="button"
                onClick={onComplete}
                className="text-sm font-medium px-5 py-2 rounded-full"
                style={{
                  color: TEXT_COLOR,
                  backgroundColor: "rgba(92,61,0,0.08)",
                }}
              >
                [ Skip ]
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Hard Day Delivery ────────────────────────────────────────────────────────

interface HardDayItem {
  type: "written" | "voice";
  content: string;
  emotionType: PositiveEmotionType;
  milestoneLevel: MilestoneLevel;
  createdAt: number;
  durationSeconds?: number;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? "s" : ""} ago`;
}

export function HardDayDelivery({ onContinue }: { onContinue: () => void }) {
  const [item, setItem] = useState<(HardDayItem & { key: string }) | null>(
    null,
  );

  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k?.startsWith("veil-captured-joy-")) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed.deliveryType === "HARD_DAY" && !parsed.delivered) {
          setItem({ ...parsed, key: k });
          break;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function handleContinue() {
    if (item) {
      try {
        const updated = { ...item, delivered: true, deliveredAt: Date.now() };
        (updated as any).key = undefined;
        localStorage.setItem(item.key, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    onContinue();
  }

  if (!item) return null;

  return (
    <motion.div
      data-ocid="celebration.hardday.modal"
      className="fixed inset-0 z-[110] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        background: "linear-gradient(160deg, #E8C060 0%, #FFF8E7 100%)",
      }}
    >
      <div className="max-w-[430px] mx-auto w-full h-full flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p
            className="text-sm font-medium mb-6 opacity-60"
            style={{ color: TEXT_COLOR }}
          >
            Before the hard day goes further —
          </p>
          <p
            className="font-serif text-xl font-semibold mb-2"
            style={{ color: TEXT_COLOR }}
          >
            {timeAgo(item.createdAt)}, you left yourself something.
          </p>

          {item.type === "written" ? (
            <div
              className="mt-8 mb-8 p-6 rounded-3xl text-left text-sm leading-relaxed"
              style={{
                backgroundColor: "rgba(255,255,255,0.55)",
                color: TEXT_COLOR,
              }}
            >
              {item.content}
            </div>
          ) : (
            <div
              className="mt-8 mb-8 p-6 rounded-3xl text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.55)" }}
            >
              <div className="text-4xl mb-2">🎤</div>
              <p className="text-sm opacity-70" style={{ color: TEXT_COLOR }}>
                You recorded yourself on a good day.
              </p>
              <p
                className="text-xs mt-1 opacity-50"
                style={{ color: TEXT_COLOR }}
              >
                {item.durationSeconds
                  ? `${item.durationSeconds}s voice note`
                  : "Voice note"}
              </p>
            </div>
          )}

          <p
            className="font-serif text-lg leading-relaxed mb-10"
            style={{ color: TEXT_COLOR }}
          >
            You wrote that.
            <br />
            On a good day.
            <br />
            For this exact moment.
            <br />
            <br />
            The person who wrote that — is still you.
            <br />
            <br />
            That good day was real.
            <br />
            This hard day is real.
            <br />
            Both are true. Both are you.
          </p>

          <button
            data-ocid="celebration.hardday.continue_button"
            type="button"
            onClick={handleContinue}
            className="w-full max-w-xs py-4 rounded-full font-semibold text-sm transition-all active:scale-95"
            style={{ backgroundColor: "rgba(92,61,0,0.85)", color: "#FFF8E7" }}
          >
            Continue
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
