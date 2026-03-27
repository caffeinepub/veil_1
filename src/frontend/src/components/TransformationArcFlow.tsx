import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { EmotionType } from "../lib/emotionDetection";
import { ARC_FEEDBACK } from "../lib/emotionalFeedbackCopy";
import { collectSignal } from "../lib/significantMomentsEngine";
import type { EISettings } from "./EISettingsPanel";
import { EmotionalFeedbackOverlay } from "./EmotionalFeedbackOverlay";
import { PeakSeal } from "./PeakSeal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransformationArcFlowProps {
  emotionType: EmotionType;
  intensity: number;
  onComplete: () => void;
  settings: EISettings;
}

type Phase =
  | "phase1"
  | "phase2"
  | "phase3"
  | "phase4_strength"
  | "phase4_onetrue"
  | "phase4_agency"
  | "phase4_affirmation"
  | "final"
  | "measurement";

// ─── Data ─────────────────────────────────────────────────────────────────────

const AURA_COLORS: Record<string, string> = {
  STRESSED: "#F4C28A",
  SAD: "#C3B8D8",
  FRUSTRATED: "#E8A598",
  ANXIOUS: "#C8D4B8",
  BROKEN: "#B8C8D8",
  HURT: "#C3B8D8",
  LONELY: "#B8C8D8",
};

const PHASE1_COPY: Record<string, string> = {
  STRESSED:
    "The pressure you were carrying — Veil has it now. Your body can begin to let it go.",
  SAD: "Sadness needs to be felt before it can be released. You gave it somewhere to go. That matters.",
  FRUSTRATED:
    "That frustration was real. It deserved to be said. Now it belongs to Veil — not to your evening.",
  ANXIOUS:
    "The anxiety brought you here. That was the right instinct. Veil has what you were carrying. You can breathe now.",
  BROKEN:
    "When everything is too much — putting it into words is the bravest thing. You did that. Veil has all of it.",
  HURT: "What hurt you was real. You did not imagine it. You did not deserve it. Veil is holding it now.",
  LONELY:
    "You brought your loneliness here. Which means you are not alone with it anymore. Veil is here.",
};

const CLOSING_AFFIRMATIONS: Record<string, string> = {
  STRESSED:
    "You handled the pressure today.\n\nYou are still standing.\n\nThe person who shows up under pressure — that is not weakness.\n\nThat is exactly who you are.",
  SAD: "Sadness does not mean you are broken.\n\nIt means you felt something real.\n\nYou are still whole.\n\nAnd whole people carry on.",
  FRUSTRATED:
    "The frustration tells you something matters to you.\n\nThat is not weakness. That is care.\n\nAnd care is strength.\n\nYou have that in abundance.",
  ANXIOUS:
    "The anxiety tells you something matters.\n\nYou showed up anyway.\n\nThe person who faces the thing they are afraid of — that is not a fearful person.\n\nThat is a brave one.\n\nThat is you.",
  BROKEN:
    "You showed up today carrying more than most people know about.\n\nThat is who you are.\n\nSomeone who shows up.\n\nThat person can handle what comes next.\n\nYou will.",
  HURT: "What happened to you does not define you.\n\nHow you handled it — by coming here, by saying it, by releasing it —\n\nthat defines you.\n\nAnd that is something to be proud of.",
  LONELY:
    "You reached out today — even when you felt alone.\n\nThat is the opposite of giving up.\n\nThat is someone who knows their own worth — even when it does not feel that way.\n\nThat is you.",
};

const STRENGTH_MIRROR = [
  "You have been in difficult places before.\n\nAnd you came through every single one of them.\n\nThis is no different.",
  "The person who just put something heavy down — has handled hard things before.\n\nThat person is still here.\n\nThat person is you.",
  "Veil has seen you carry difficult things.\n\nAnd Veil has seen you come through them.\n\nYou always do.",
  "You are stronger than this moment.\n\nNot because it is easy — but because you have proven that before.\n\nYou are proving it again right now.",
  "The weight you carried here today — you have carried heavier.\n\nAnd you are still standing.\n\nThat is not luck. That is who you are.",
  "Hard moments have come before.\n\nYou handled them. Not perfectly. Not without pain. But you handled them.\n\nThis one is no different.",
  "You have a history of coming through.\n\nVeil has been witness to that.\n\nToday is part of the same story.",
  "Difficult things have tried to stop you before.\n\nNone of them did.\n\nThis one will not either.",
];

const ONE_TRUE_THING_EXAMPLES = [
  "I showed up today.",
  "I am still trying.",
  "I care about the people I love.",
  "I have gotten through hard things before.",
  "I am honest.",
];

const AGENCY_EXAMPLES = [
  "Make a cup of tea.",
  "Text someone I love.",
  "Take a five-minute walk.",
  "Write down what I need to do.",
  "Do one small thing on my list.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBreathingTechnique(emotion: string): "box" | "extended" | "sigh" {
  if (emotion === "STRESSED" || emotion === "ANXIOUS") return "box";
  if (emotion === "SAD" || emotion === "HURT" || emotion === "LONELY")
    return "extended";
  return "sigh"; // FRUSTRATED | BROKEN
}

function getBreathingCompletionMsg(
  technique: "box" | "extended" | "sigh",
): string {
  if (technique === "box")
    return "Your nervous system is beginning to settle. You did that.";
  if (technique === "extended")
    return "Your body is beginning to release what your mind was holding.";
  return "The physiological grip of that emotion — your body just released some of it. That is real.";
}

// ─── Phase 1: Adaptive Exhale ─────────────────────────────────────────────────

function Phase1Release({
  emotionType,
  onDeepen,
  onExit,
}: {
  emotionType: string;
  onDeepen: () => void;
  onExit: () => void;
}) {
  const aura = AURA_COLORS[emotionType] ?? "#C3B8D8";
  const [showDeepen, setShowDeepen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowDeepen(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Animation variant per emotion
  const isSlowFade = emotionType === "SAD";
  const isExpanding = emotionType === "FRUSTRATED";
  const isGentle = emotionType === "BROKEN";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center relative">
      {/* Breathing circle */}
      <div className="relative mb-10">
        {isExpanding ? (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 140,
                  height: 140,
                  top: 0,
                  left: 0,
                  background: `radial-gradient(circle, ${aura}40 0%, transparent 70%)`,
                  border: `1px solid ${aura}60`,
                }}
                animate={{ scale: [1, 2.5 + i * 0.5], opacity: [0.6, 0] }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.7,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeOut",
                }}
              />
            ))}
            <motion.div
              className="rounded-full"
              style={{
                width: 140,
                height: 140,
                background: `radial-gradient(circle, ${aura}80 0%, ${aura}30 60%, transparent 100%)`,
                boxShadow: `0 0 40px ${aura}60`,
              }}
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </>
        ) : isGentle ? (
          <motion.div
            className="rounded-full"
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle, ${aura}70 0%, ${aura}20 60%, transparent 100%)`,
              boxShadow: `0 0 50px ${aura}40`,
            }}
            animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ) : isSlowFade ? (
          <motion.div
            className="rounded-full"
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle, ${aura}70 0%, ${aura}20 60%, transparent 100%)`,
              boxShadow: `0 0 60px ${aura}50`,
            }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ) : (
          <motion.div
            className="rounded-full"
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle, ${aura}80 0%, ${aura}30 60%, transparent 100%)`,
              boxShadow: `0 0 50px ${aura}60`,
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
            transition={{
              duration: 3.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="font-serif text-xl leading-relaxed mb-12"
        style={{ color: "rgba(255,255,255,0.9)", maxWidth: 320 }}
      >
        {PHASE1_COPY[emotionType] ?? PHASE1_COPY.STRESSED}
      </motion.p>

      {/* Deepen prompt */}
      <AnimatePresence>
        {showDeepen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 w-full max-w-[300px]"
          >
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              Would you like to go a little deeper?
            </p>
            <motion.button
              data-ocid="ei.arc.deepen_button"
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onDeepen}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${aura}40 0%, ${aura}20 100%)`,
                border: `1px solid ${aura}60`,
                color: "rgba(255,255,255,0.9)",
                minHeight: "48px",
              }}
            >
              Yes — take me further
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit button — always visible */}
      <motion.button
        data-ocid="ei.arc.exit_button"
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        whileTap={{ scale: 0.97 }}
        onClick={onExit}
        className="absolute bottom-10 text-sm"
        style={{
          color: "rgba(255,255,255,0.35)",
          minHeight: "48px",
          padding: "12px 24px",
        }}
      >
        I&apos;m ready to go
      </motion.button>
    </div>
  );
}

// ─── Phase 2: Breathing Guide ─────────────────────────────────────────────────

type BreathStep = { label: string; duration: number };

function getBoxBreathingSteps(): BreathStep[] {
  return [
    { label: "Breathe in — two — three — four.", duration: 4000 },
    { label: "Hold — two — three — four.", duration: 4000 },
    { label: "Out — two — three — four.", duration: 4000 },
    { label: "Hold — two — three — four.", duration: 4000 },
  ];
}

function getExtendedExhaleSteps(): BreathStep[] {
  return [
    { label: "Breathe in slowly — two — three — four — five.", duration: 5000 },
    {
      label: "And out — two — three — four — five — six — seven.",
      duration: 7000,
    },
  ];
}

function getSighSteps(): BreathStep[] {
  return [
    {
      label:
        "Double inhale — in through the nose, then one more short inhale on top.",
      duration: 4000,
    },
    {
      label: "Then a long, slow exhale through the mouth. Let it go.",
      duration: 6000,
    },
  ];
}

function Phase2Calm({
  emotionType,
  onNext,
  onSkip,
}: {
  emotionType: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const technique = getBreathingTechnique(emotionType);
  const aura = AURA_COLORS[emotionType] ?? "#C3B8D8";

  const steps =
    technique === "box"
      ? getBoxBreathingSteps()
      : technique === "extended"
        ? getExtendedExhaleSteps()
        : getSighSteps();

  const totalCycles =
    technique === "box" ? 3 : technique === "extended" ? 4 : 5;

  const [cycleIndex, setCycleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const completionMsg = getBreathingCompletionMsg(technique);

  // Timer-based sequencing
  useEffect(() => {
    if (done) return;
    const step = steps[stepIndex];
    const t = setTimeout(() => {
      const nextStep = stepIndex + 1;
      if (nextStep < steps.length) {
        setStepIndex(nextStep);
      } else {
        const nextCycle = cycleIndex + 1;
        if (nextCycle < totalCycles) {
          setCycleIndex(nextCycle);
          setStepIndex(0);
        } else {
          setDone(true);
        }
      }
    }, step.duration);
    return () => clearTimeout(t);
  }, [stepIndex, cycleIndex, done, steps, totalCycles]);

  // Auto-advance after completion message
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onNext, 2500);
    return () => clearTimeout(t);
  }, [done, onNext]);

  // Breathing animation scale
  const isInhale = stepIndex === 0;
  const scale = isInhale ? 1.25 : 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center relative">
      {!done ? (
        <>
          {/* Breathing visual */}
          {technique === "box" ? (
            // Animated square
            <div className="relative mb-10" style={{ width: 140, height: 140 }}>
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  border: `2px solid ${aura}80`,
                  background: `${aura}15`,
                  boxShadow: `0 0 30px ${aura}40`,
                }}
                animate={{
                  scale: isInhale ? 1.15 : 1,
                  opacity: isInhale ? 1 : 0.7,
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              <motion.div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl" style={{ color: aura }}>
                  ◻
                </span>
              </motion.div>
            </div>
          ) : technique === "extended" ? (
            // Wave animation
            <div className="mb-10">
              <motion.div
                className="rounded-full"
                style={{
                  width: 140,
                  height: 140,
                  background: `radial-gradient(circle, ${aura}70 0%, ${aura}20 60%, transparent 100%)`,
                  boxShadow: `0 0 40px ${aura}50`,
                }}
                animate={{ scale: [1, scale, 1] }}
                transition={{
                  duration: isInhale ? 5 : 7,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            </div>
          ) : (
            // Physiological sigh — double pulse
            <div className="mb-10">
              <motion.div
                className="rounded-full"
                style={{
                  width: 140,
                  height: 140,
                  background: `radial-gradient(circle, ${aura}70 0%, ${aura}20 60%, transparent 100%)`,
                  boxShadow: `0 0 40px ${aura}50`,
                }}
                animate={
                  stepIndex === 0
                    ? { scale: [1, 1.1, 1.2], opacity: [0.7, 0.9, 1] }
                    : { scale: [1.2, 1], opacity: [1, 0.6] }
                }
                transition={{
                  duration: stepIndex === 0 ? 4 : 6,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}

          {/* Instruction */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`${cycleIndex}-${stepIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="font-serif text-lg leading-relaxed mb-6"
              style={{ color: "rgba(255,255,255,0.9)", maxWidth: 300 }}
            >
              {steps[stepIndex].label}
            </motion.p>
          </AnimatePresence>

          {/* Cycle counter */}
          <div className="flex gap-2 mb-8">
            {Array.from({ length: totalCycles }, (_, i) => i).map(
              (dotIndex) => {
                return (
                  <div
                    key={`dot-${dotIndex}`}
                    className="rounded-full transition-all"
                    style={{
                      width: dotIndex === cycleIndex ? 20 : 8,
                      height: 8,
                      background: dotIndex <= cycleIndex ? aura : `${aura}30`,
                    }}
                  />
                );
              },
            )}
          </div>
        </>
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-xl leading-relaxed"
          style={{ color: "rgba(255,255,255,0.9)", maxWidth: 320 }}
        >
          {completionMsg}
        </motion.p>
      )}

      {/* Skip */}
      {!done && (
        <button
          data-ocid="ei.arc.skip_breathing_button"
          type="button"
          onClick={onSkip}
          className="absolute bottom-10 right-8 text-xs"
          style={{
            color: "rgba(255,255,255,0.3)",
            minHeight: "48px",
            padding: "12px 16px",
          }}
        >
          Skip breathing
        </button>
      )}
    </div>
  );
}

// ─── Phase 3: Grounding ───────────────────────────────────────────────────────

const GROUND_QUESTIONS = [
  "Where are you right now? Not where the problem is. Where YOU are.",
  "Is your body safe in this moment?",
  "What is one thing around you right now that is still okay?",
];

function Phase3Ground({
  emotionType,
  onNext,
  onSkip,
}: {
  emotionType: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const aura = AURA_COLORS[emotionType] ?? "#C3B8D8";
  const [step, setStep] = useState<"intro" | 0 | 1 | 2 | "closing">("intro");
  const [thirdAnswer, setThirdAnswer] = useState("");

  useEffect(() => {
    if (step === "intro") {
      const t = setTimeout(() => setStep(0), 2500);
      return () => clearTimeout(t);
    }
    if (step === 0 || step === 1) {
      const t = setTimeout(
        () => setStep((prev) => ((prev as number) + 1) as 0 | 1 | 2),
        4000,
      );
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step]);

  useEffect(() => {
    if (step === "closing") {
      const t = setTimeout(onNext, 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step, onNext]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center relative">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${aura} 0%, transparent 70%)`,
        }}
      />

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p
              className="font-serif text-xl leading-relaxed"
              style={{ color: "rgba(255,255,255,0.9)", maxWidth: 320 }}
            >
              Come back to where you are.
              <br />
              <br />
              Right now.
              <br />
              Just this moment.
            </p>
          </motion.div>
        )}

        {(step === 0 || step === 1) && (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p
              className="text-xs font-medium mb-4"
              style={{
                color: aura,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Question {step + 1} of 3
            </p>
            <p
              className="font-serif text-xl leading-relaxed"
              style={{ color: "rgba(255,255,255,0.9)", maxWidth: 320 }}
            >
              {GROUND_QUESTIONS[step as number]}
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="q-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center w-full max-w-[320px]"
          >
            <p
              className="text-xs font-medium mb-4"
              style={{
                color: aura,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Question 3 of 3
            </p>
            <p
              className="font-serif text-xl leading-relaxed mb-6"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {GROUND_QUESTIONS[2]}
            </p>
            <textarea
              value={thirdAnswer}
              onChange={(e) => setThirdAnswer(e.target.value)}
              placeholder="You can type or just think it…"
              rows={2}
              className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: `1px solid ${aura}40`,
                color: "rgba(255,255,255,0.8)",
              }}
            />
            <motion.button
              data-ocid="ei.ground.continue_button"
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("closing")}
              className="mt-4 w-full py-3.5 rounded-2xl text-sm font-medium"
              style={{
                background: `${aura}25`,
                border: `1px solid ${aura}50`,
                color: "rgba(255,255,255,0.85)",
                minHeight: "48px",
              }}
            >
              Continue
            </motion.button>
          </motion.div>
        )}

        {step === "closing" && (
          <motion.div
            key="closing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p
              className="font-serif text-xl leading-relaxed"
              style={{ color: "rgba(255,255,255,0.9)", maxWidth: 320 }}
            >
              You are here.
              <br />
              <br />
              This moment is safe.
              <br />
              The rest can wait.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      <button
        data-ocid="ei.arc.skip_grounding_button"
        type="button"
        onClick={onSkip}
        className="absolute bottom-10 right-8 text-xs"
        style={{
          color: "rgba(255,255,255,0.3)",
          minHeight: "48px",
          padding: "12px 16px",
        }}
      >
        Skip grounding
      </button>
    </div>
  );
}

// ─── Phase 4: Rebuild ─────────────────────────────────────────────────────────

const lastMirrorIdx = { current: -1 };

function Phase4Strength({ onNext }: { onNext: () => void }) {
  const [idx] = useState(() => {
    let next = Math.floor(Math.random() * STRENGTH_MIRROR.length);
    while (next === lastMirrorIdx.current && STRENGTH_MIRROR.length > 1) {
      next = Math.floor(Math.random() * STRENGTH_MIRROR.length);
    }
    lastMirrorIdx.current = next;
    return next;
  });

  useEffect(() => {
    const t = setTimeout(onNext, 7000);
    return () => clearTimeout(t);
  }, [onNext]);

  const lines = STRENGTH_MIRROR[idx].split("\n\n");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="max-w-[320px] space-y-5"
      >
        {lines.map((line, lineIdx) => {
          return (
            <motion.p
              key={line.slice(0, 20)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + lineIdx * 0.6, duration: 0.8 }}
              className="font-serif text-xl leading-relaxed"
              style={{
                color:
                  lineIdx === 0
                    ? "rgba(255,255,255,0.95)"
                    : lineIdx === 1
                      ? "rgba(255,255,255,0.80)"
                      : "rgba(255,255,255,0.70)",
              }}
            >
              {line}
            </motion.p>
          );
        })}
      </motion.div>

      <motion.button
        data-ocid="ei.strength.hear_button"
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4, duration: 0.6 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="absolute bottom-10 text-sm"
        style={{
          color: "rgba(255,255,255,0.35)",
          minHeight: "48px",
          padding: "12px 24px",
        }}
      >
        I hear this
      </motion.button>
    </div>
  );
}

function Phase4OneTrueThing({
  aura,
  onNext,
}: { aura: string; onNext: () => void }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [showOneTrueOverlay, setShowOneTrueOverlay] = useState(false);

  function handleSubmit() {
    if (!value.trim()) return;
    try {
      const existing = JSON.parse(
        localStorage.getItem("veil-one-true-things") ?? "[]",
      );
      existing.push({ text: value.trim(), date: new Date().toISOString() });
      localStorage.setItem("veil-one-true-things", JSON.stringify(existing));
    } catch {
      /* ignore */
    }
    setSubmitted(true);
    setShowOneTrueOverlay(true);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 relative">
      {!submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[340px]"
        >
          <p
            className="font-serif text-xl leading-relaxed mb-2 text-center"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Now — just one thing.
          </p>
          <p
            className="text-sm leading-relaxed mb-8 text-center"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            What is one thing that is true and good about you — right now — even
            in the middle of this?
          </p>

          <textarea
            data-ocid="ei.onetrue.textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full rounded-2xl px-5 py-4 text-base resize-none outline-none mb-3"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: `1px solid ${aura}30`,
              color: "rgba(255,255,255,0.9)",
            }}
          />

          {/* Ghost examples */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-6 px-1">
            {ONE_TRUE_THING_EXAMPLES.map((ex) => (
              <span
                key={ex}
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                {ex}
              </span>
            ))}
          </div>

          <motion.button
            data-ocid="ei.onetrue.submit_button"
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl text-sm font-semibold mb-3"
            style={{
              background: `linear-gradient(135deg, ${aura}50 0%, ${aura}30 100%)`,
              border: `1px solid ${aura}60`,
              color: "rgba(255,255,255,0.9)",
              minHeight: "48px",
            }}
          >
            This is true about me
          </motion.button>

          <button
            data-ocid="ei.onetrue.skip_button"
            type="button"
            onClick={onNext}
            className="w-full text-sm text-center py-3"
            style={{ color: "rgba(255,255,255,0.3)", minHeight: "48px" }}
          >
            [ I&apos;ll hold this quietly ]
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-[320px]"
        >
          <p
            className="font-serif text-2xl leading-relaxed mb-6"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            {value}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            You said something true. Hold onto that.
          </p>
        </motion.div>
      )}
      {showOneTrueOverlay && (
        <EmotionalFeedbackOverlay
          lines={ARC_FEEDBACK.one_true_thing}
          background="default"
          onDismiss={() => {
            setShowOneTrueOverlay(false);
            onNext();
          }}
        />
      )}
    </div>
  );
}

function Phase4Agency({
  aura,
  agencyReminder,
  onNext,
}: {
  aura: string;
  agencyReminder: boolean;
  onNext: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reminderChoice, setReminderChoice] = useState<
    "pending" | "yes" | "no"
  >("pending");
  const reminderSet = useRef(false);

  const [showAgencyOverlay, setShowAgencyOverlay] = useState(false);

  function handleSubmit() {
    if (!value.trim()) return;
    setSubmitted(true);
    setShowAgencyOverlay(true);
  }

  function handleReminder(yes: boolean) {
    if (yes && !reminderSet.current) {
      reminderSet.current = true;
      const msg = value.trim();
      setTimeout(
        () => {
          toast(`You said you would: ${msg}. You still can.`, {
            duration: 8000,
            icon: "🌿",
          });
        },
        60 * 60 * 1000,
      ); // 1 hour
    }
    setReminderChoice(yes ? "yes" : "no");
    setTimeout(onNext, 1500);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 relative">
      {!submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[340px]"
        >
          <p
            className="font-serif text-xl leading-relaxed mb-2 text-center"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            One last thing.
          </p>
          <p
            className="text-sm leading-relaxed mb-8 text-center"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            What is one small thing — just one — that you can do in the next
            hour that is completely in your control?
          </p>

          <textarea
            data-ocid="ei.agency.textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full rounded-2xl px-5 py-4 text-base resize-none outline-none mb-3"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: `1px solid ${aura}30`,
              color: "rgba(255,255,255,0.9)",
            }}
          />

          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-6 px-1">
            {AGENCY_EXAMPLES.map((ex) => (
              <span
                key={ex}
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                {ex}
              </span>
            ))}
          </div>

          <motion.button
            data-ocid="ei.agency.submit_button"
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl text-sm font-semibold mb-3"
            style={{
              background: `linear-gradient(135deg, ${aura}50 0%, ${aura}30 100%)`,
              border: `1px solid ${aura}60`,
              color: "rgba(255,255,255,0.9)",
              minHeight: "48px",
            }}
          >
            I can do this
          </motion.button>
          <button
            data-ocid="ei.agency.skip_button"
            type="button"
            onClick={onNext}
            className="w-full text-sm text-center py-3"
            style={{ color: "rgba(255,255,255,0.3)", minHeight: "48px" }}
          >
            [ I&apos;ll think about it ]
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-[320px]"
        >
          <p
            className="font-serif text-2xl leading-relaxed mb-4"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            {value}
          </p>
          <p
            className="text-sm mb-8"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            That is yours. You chose it. You can do it.
            <br />
            <br />
            That is what being in control feels like.
          </p>

          {agencyReminder && reminderChoice === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3"
            >
              <motion.button
                data-ocid="ei.agency.reminder_button"
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => handleReminder(true)}
                className="w-full py-3.5 rounded-2xl text-sm font-medium"
                style={{
                  background: `${aura}25`,
                  border: `1px solid ${aura}50`,
                  color: "rgba(255,255,255,0.85)",
                  minHeight: "48px",
                }}
              >
                Remind me in 1 hour
              </motion.button>
              <button
                data-ocid="ei.agency.no_reminder_button"
                type="button"
                onClick={() => handleReminder(false)}
                className="text-sm py-3"
                style={{ color: "rgba(255,255,255,0.3)", minHeight: "48px" }}
              >
                No reminder needed
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
      {showAgencyOverlay && (
        <EmotionalFeedbackOverlay
          lines={ARC_FEEDBACK.agency_anchor}
          background="default"
          onDismiss={() => {
            setShowAgencyOverlay(false);
            if (agencyReminder) {
              // Show reminder choice - already in submitted view
            } else {
              setTimeout(onNext, 100);
            }
          }}
        />
      )}
    </div>
  );
}

function Phase4Affirmation({
  emotionType,
  aura,
  onNext,
}: { emotionType: string; aura: string; onNext: () => void }) {
  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const lines = (
    CLOSING_AFFIRMATIONS[emotionType] ?? CLOSING_AFFIRMATIONS.STRESSED
  ).split("\n\n");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="max-w-[320px] space-y-5"
      >
        {lines.map((line, lineIdx) => {
          return (
            <motion.p
              key={line.slice(0, 20)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + lineIdx * 0.8, duration: 0.9 }}
              className="font-serif text-xl leading-relaxed"
              style={{
                color:
                  lineIdx === 0
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.80)",
              }}
            >
              {line}
            </motion.p>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {showReady && (
          <motion.button
            data-ocid="ei.affirmation.ready_button"
            key="ready"
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="absolute bottom-10 py-3.5 px-8 rounded-2xl text-sm font-semibold"
            style={{
              background: `${aura}30`,
              border: `1px solid ${aura}50`,
              color: "rgba(255,255,255,0.85)",
              minHeight: "48px",
            }}
          >
            I&apos;m ready
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Final Screen ─────────────────────────────────────────────────────────────

function FinalScreen({
  aura,
  phasesCompleted,
  onNext,
}: { aura: string; phasesCompleted: number; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="max-w-[320px]"
      >
        {phasesCompleted >= 2 ? (
          <p
            className="font-serif text-2xl leading-relaxed"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            You came in carrying something.
            <br />
            <br />
            You are leaving carrying less of it.
            <br />
            <br />
            Go be present.
          </p>
        ) : (
          <p
            className="font-serif text-2xl leading-relaxed"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            You showed up.
            <br />
            <br />
            That was the whole thing.
            <br />
            <br />
            Go be present.
          </p>
        )}
      </motion.div>

      <motion.button
        data-ocid="ei.final.ready_button"
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="mt-14 py-4 px-10 rounded-2xl text-sm font-semibold"
        style={{
          background: `linear-gradient(135deg, ${aura}50 0%, ${aura}30 100%)`,
          border: `1px solid ${aura}60`,
          color: "rgba(255,255,255,0.9)",
          minHeight: "48px",
        }}
      >
        I&apos;m ready
      </motion.button>
    </div>
  );
}

// ─── Wellbeing Measurement ────────────────────────────────────────────────────

function WellbeingMeasurement({
  aura,
  onComplete,
}: { aura: string; onComplete: () => void }) {
  const [value, setValue] = useState(5);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[340px]"
      >
        <p
          className="font-serif text-xl mb-2"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          How are you carrying now?
        </p>
        <p className="text-xs mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
          Just for you — never shown as a number
        </p>

        <div className="flex justify-between text-2xl mb-4">
          <span>😖</span>
          <span>😌</span>
        </div>

        <div className="relative mb-3">
          <input
            data-ocid="ei.measurement.slider"
            type="range"
            min={1}
            max={10}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 rounded-full outline-none cursor-pointer"
            style={{
              accentColor: aura,
              background: `linear-gradient(to right, ${aura} ${(value - 1) * 11.11}%, rgba(255,255,255,0.15) ${(value - 1) * 11.11}%)`,
            }}
            aria-label="Emotional wellbeing slider. Drag to indicate how you are feeling. 1 is very heavy. 10 is much lighter."
          />
        </div>

        <div
          className="flex justify-between text-xs mb-10"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <span>Heavy</span>
          <span>Lighter</span>
        </div>

        <motion.button
          data-ocid="ei.measurement.submit_button"
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          className="w-full py-4 rounded-2xl text-sm font-semibold mb-3"
          style={{
            background: `linear-gradient(135deg, ${aura}50 0%, ${aura}30 100%)`,
            border: `1px solid ${aura}60`,
            color: "rgba(255,255,255,0.9)",
            minHeight: "48px",
          }}
        >
          Done
        </motion.button>

        <button
          data-ocid="ei.measurement.skip_button"
          type="button"
          onClick={onComplete}
          className="w-full text-sm py-3"
          style={{ color: "rgba(255,255,255,0.3)", minHeight: "48px" }}
        >
          [ Skip ]
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransformationArcFlow({
  emotionType,
  intensity: _intensity,
  onComplete,
  settings,
}: TransformationArcFlowProps) {
  const [phase, setPhase] = useState<Phase>("phase1");
  const [phasesCompleted, setPhasesCompleted] = useState(0);
  const aura = AURA_COLORS[emotionType] ?? "#C3B8D8";

  const advance = useCallback((nextPhase: Phase) => {
    setPhasesCompleted((n) => n + 1);
    setPhase(nextPhase);
  }, []);

  function handlePhase1Deepen() {
    if (settings.breathing) {
      advance("phase2");
    } else if (settings.grounding) {
      advance("phase3");
    } else if (settings.rebuild) {
      advance("phase4_strength");
    } else {
      advance("final");
    }
  }

  function handlePhase2Next() {
    if (settings.grounding) {
      advance("phase3");
    } else if (settings.rebuild) {
      advance("phase4_strength");
    } else {
      advance("final");
    }
  }

  function handlePhase3Next() {
    if (settings.rebuild) {
      advance("phase4_strength");
    } else {
      advance("final");
    }
  }

  const memoOnComplete = onComplete;
  const memoHandlePhase2Next = handlePhase2Next;
  const memoHandlePhase3Next = handlePhase3Next;

  return (
    <motion.div
      data-ocid="ei.arc.modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[70] overflow-hidden"
      style={{
        background: "rgba(26, 18, 48, 0.97)",
      }}
    >
      {/* Ambient aura glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${aura}18 0%, transparent 60%)`,
        }}
      />

      <AnimatePresence mode="wait">
        {phase === "phase1" && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Phase1Release
              emotionType={emotionType}
              onDeepen={handlePhase1Deepen}
              onExit={() => advance("final")}
            />
          </motion.div>
        )}

        {phase === "phase2" && (
          <motion.div
            key="phase2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Phase2Calm
              emotionType={emotionType}
              onNext={memoHandlePhase2Next}
              onSkip={memoHandlePhase2Next}
            />
          </motion.div>
        )}

        {phase === "phase3" && (
          <motion.div
            key="phase3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Phase3Ground
              emotionType={emotionType}
              onNext={memoHandlePhase3Next}
              onSkip={memoHandlePhase3Next}
            />
          </motion.div>
        )}

        {phase === "phase4_strength" && (
          <motion.div
            key="phase4_strength"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Phase4Strength onNext={() => advance("phase4_onetrue")} />
          </motion.div>
        )}

        {phase === "phase4_onetrue" && (
          <motion.div
            key="phase4_onetrue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Phase4OneTrueThing
              aura={aura}
              onNext={() => advance("phase4_agency")}
            />
          </motion.div>
        )}

        {phase === "phase4_agency" && (
          <motion.div
            key="phase4_agency"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Phase4Agency
              aura={aura}
              agencyReminder={settings.agencyReminder}
              onNext={() => advance("phase4_affirmation")}
            />
          </motion.div>
        )}

        {phase === "phase4_affirmation" && (
          <motion.div
            key="phase4_affirmation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Phase4Affirmation
              emotionType={emotionType}
              aura={aura}
              onNext={() => advance("final")}
            />
          </motion.div>
        )}

        {phase === "final" && (
          <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            {phasesCompleted >= 4 ? (
              <PeakSeal
                emotionAuraColor={aura}
                onComplete={() => {
                  try {
                    collectSignal(
                      "SIGNAL_ARC_FULL_COMPLETION",
                      emotionType,
                      _intensity,
                      {
                        phasesCompleted: 4,
                        firstArc: false,
                        wellbeingDelta: 3,
                      },
                    );
                  } catch {}
                  setPhase("measurement");
                }}
              />
            ) : (
              <FinalScreen
                aura={aura}
                phasesCompleted={phasesCompleted}
                onNext={() => setPhase("measurement")}
              />
            )}
          </motion.div>
        )}

        {phase === "measurement" && (
          <motion.div
            key="measurement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <WellbeingMeasurement aura={aura} onComplete={memoOnComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
