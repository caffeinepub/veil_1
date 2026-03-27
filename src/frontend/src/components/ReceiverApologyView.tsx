import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ApologyEntry } from "../backend";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import { useActor } from "../hooks/useActor";

type ReceiverStep = "LANDING" | "PAUSE" | "REFLECTION" | "GUIDANCE" | "CLOSURE";

type EmotionChip = "Relieved" | "Hurt" | "Not ready" | "Confused" | "Neutral";

const GUIDANCE: Record<EmotionChip, string> = {
  Relieved:
    "Something shifted for you today. Whatever you decide to do with it — that matters.",
  Hurt: "Hearing this doesn't erase what happened. Take all the time you need.",
  "Not ready":
    "You don't have to feel anything right now. Not ready is a complete answer.",
  Confused:
    "Mixed feelings make sense here. You don't have to sort them out right now.",
  Neutral:
    "Whatever you feel — or don't feel — is valid. There's no right response to this.",
};

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function ReceiverApologyView({
  apology,
  onClose,
}: {
  apology: ApologyEntry;
  onClose: () => void;
}) {
  const { actor } = useActor();
  const { triggerMoment } = useVeilVoice();
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const [step, setStep] = useState<ReceiverStep>("LANDING");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionChip | null>(
    null,
  );
  const [privateText, setPrivateText] = useState("");
  const [closureMessage, setClosureMessage] = useState("");
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Acknowledge opened
  useEffect(() => {
    if (actor) {
      actor.acknowledgeApologyOpened(apology.id).catch(() => {});
    }
  }, [actor, apology.id]);

  // Pause duration based on word count and emotion type
  const wordCount = countWords(apology.content);
  const pauseMs =
    wordCount > 150
      ? 8000
      : ["grief", "heartbreak"].some((e) =>
            apology.emotionType.toLowerCase().includes(e),
          )
        ? 10000
        : 5000;

  // Advance from LANDING → PAUSE after a brief render
  useEffect(() => {
    if (step === "LANDING") {
      const t = setTimeout(() => setStep("PAUSE"), 600);
      return () => clearTimeout(t);
    }
    if (step === "PAUSE") {
      pauseTimerRef.current = setTimeout(() => setStep("REFLECTION"), pauseMs);
      return () => {
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      };
    }
  }, [step, pauseMs]);

  async function handleAction(action: "I_RECEIVE_THIS" | "LET_IT_BE") {
    if (actor && selectedEmotion) {
      try {
        await actor.saveReceiverReflection(
          apology.id,
          selectedEmotion.toUpperCase().replace(" ", "_"),
          privateText || null,
          action,
        );
      } catch {
        // proceed regardless
      }
    }

    const message =
      action === "I_RECEIVE_THIS"
        ? "You acknowledged something real. That takes its own kind of courage."
        : "Some things don't need words to move forward. You handled this your way.";
    setClosureMessage(message);
    setStep("CLOSURE");

    setTimeout(
      () =>
        triggerMoment(
          action === "I_RECEIVE_THIS"
            ? ("apology_receiver_receive" as any)
            : ("apology_receiver_letitbe" as any),
        ),
      500,
    );
  }

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.4 },
      };

  return (
    <div
      data-ocid="receiver_apology.modal"
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#FAF9F7" }}
    >
      {/* Close */}
      {step !== "CLOSURE" && (
        <button
          data-ocid="receiver_apology.close_button"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/80 text-veil-muted flex items-center justify-center shadow-soft hover:text-veil-text transition-colors"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* LANDING + PAUSE — apology displayed */}
        {(step === "LANDING" || step === "PAUSE") && (
          <motion.div
            key="apology-content"
            className="flex flex-col items-center justify-center min-h-full px-8 py-16 text-center"
            {...fade}
          >
            <p className="font-serif text-lg text-veil-text leading-relaxed whitespace-pre-wrap mb-8 max-w-sm">
              {apology.content}
            </p>
            <p className="font-serif italic text-veil-muted text-sm mb-3">
              — {apology.signature}
            </p>
            {!apology.isAnonymous && (
              <p className="text-xs text-veil-muted">Someone who cares</p>
            )}
            {step === "PAUSE" && (
              <motion.p
                className="mt-12 text-xs text-veil-muted/50 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                aria-live="polite"
              >
                Take a moment.
              </motion.p>
            )}
          </motion.div>
        )}

        {/* REFLECTION */}
        {step === "REFLECTION" && (
          <motion.div
            key="reflection"
            className="flex flex-col min-h-full px-6 py-16"
            {...fade}
          >
            <h2 className="font-serif text-xl font-semibold text-veil-text text-center mb-8">
              How does this land for you?
            </h2>

            {/* Emotion chips */}
            <div
              className="flex flex-wrap gap-3 justify-center mb-8"
              aria-label="Emotional response options"
            >
              {(
                [
                  "Relieved",
                  "Hurt",
                  "Not ready",
                  "Confused",
                  "Neutral",
                ] as EmotionChip[]
              ).map((chip) => (
                <button
                  data-ocid={`receiver_apology.emotion_${chip.toLowerCase().replace(" ", "_")}.button`}
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSelectedEmotion(chip);
                    setStep("GUIDANCE");
                  }}
                  className={`min-w-[48px] min-h-[48px] px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedEmotion === chip
                      ? "bg-veil-purple text-white shadow-glow"
                      : "bg-white text-veil-text shadow-soft hover:shadow-glow active:scale-[0.97]"
                  }`}
                  aria-pressed={selectedEmotion === chip}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Private text */}
            <div className="bg-white rounded-3xl p-5 shadow-soft">
              <p className="text-xs text-veil-muted mb-3">
                Anything you want to say to yourself?
                <span className="block text-veil-muted/60 mt-0.5">
                  This is never sent to the sender. Always private.
                </span>
              </p>
              <textarea
                data-ocid="receiver_apology.private_reflection.textarea"
                value={privateText}
                onChange={(e) => setPrivateText(e.target.value)}
                placeholder="Only you will ever see this..."
                rows={3}
                className="w-full bg-transparent text-sm text-veil-text placeholder:text-veil-muted/50 outline-none resize-none"
                aria-label="Private reflection (never shared with sender)"
              />
            </div>
          </motion.div>
        )}

        {/* GUIDANCE */}
        {step === "GUIDANCE" && selectedEmotion && (
          <motion.div
            key="guidance"
            className="flex flex-col items-center justify-center min-h-full px-6 py-16 text-center"
            {...fade}
          >
            <p className="font-serif text-base text-veil-text leading-relaxed max-w-xs mb-12">
              {GUIDANCE[selectedEmotion]}
            </p>

            <div className="w-full max-w-xs space-y-3">
              <button
                data-ocid="receiver_apology.receive.button"
                type="button"
                onClick={() => handleAction("I_RECEIVE_THIS")}
                aria-label="Button: I receive this apology"
                className="w-full min-h-[48px] py-4 rounded-3xl text-sm font-semibold text-white shadow-soft transition-all duration-200 active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
                }}
              >
                ❤️ I receive this
              </button>
              <button
                data-ocid="receiver_apology.letitbe.button"
                type="button"
                onClick={() => handleAction("LET_IT_BE")}
                aria-label="Button: Let it be"
                className="w-full min-h-[48px] py-4 rounded-3xl text-sm font-medium text-veil-muted bg-white shadow-soft hover:shadow-glow transition-all duration-200 active:scale-[0.98]"
              >
                🕊 Let it be
              </button>
            </div>
          </motion.div>
        )}

        {/* CLOSURE */}
        {step === "CLOSURE" && (
          <motion.div
            key="closure"
            className="flex flex-col items-center justify-center min-h-full px-6 py-16 text-center"
            {...fade}
          >
            <div className="text-4xl mb-6">🕊</div>
            <p className="font-serif text-lg font-medium text-veil-text leading-relaxed max-w-xs mb-4">
              {closureMessage}
            </p>
            {apology.isAnonymous && (
              <p className="text-sm text-veil-muted leading-relaxed max-w-xs mb-6">
                Whoever sent this found the courage to say something real. So
                did you — just by being here.
              </p>
            )}
            <button
              data-ocid="receiver_apology.closure.close_button"
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-full text-sm font-medium text-veil-purple bg-veil-purple/10 hover:bg-veil-purple/20 transition-colors mt-6"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
