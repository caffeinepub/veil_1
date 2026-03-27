import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import { useActor } from "../hooks/useActor";

// ── Types ─────────────────────────────────────────────────────────────────────

type Intent = "express" | "heal";
type Step =
  | "PATH_CHOICE"
  | "WRITE"
  | "AI_SUGGESTIONS"
  | "SIGNATURE"
  | "RECIPIENT"
  | "IDENTITY"
  | "DELIVERY"
  | "CONFIRM"
  | "UNSENT_CONFIRM"
  | "SENT_CONFIRM";

type ToneVariant = "Simple" | "Emotional" | "Reflective";
type DeliveryOption = "now" | "1hour" | "tonight" | "tomorrow" | "custom";

const DELIVERY_LABELS: Record<DeliveryOption, string> = {
  now: "Send now",
  "1hour": "In 1 hour",
  tonight: "Tonight · 8:00 PM your time",
  tomorrow: "Tomorrow · 9:00 AM your time",
  custom: "Choose a time",
};

const PLACEHOLDERS = [
  "What do you wish you could say?",
  "What have you been carrying?",
  "What would you say if you knew they'd understand?",
  "What's the one thing you wish they knew?",
];

const WRITING_PROMPTS = [
  "What I did that I regret most...",
  "What I wish I had done differently...",
  "What I want you to know...",
  "I didn't mean to hurt you when...",
  "The thing I've never been able to say is...",
];

const AI_CONTENT: Record<ToneVariant, { raw: string; gentle: string }> = {
  Simple: {
    raw: "I'm sorry. What I did wasn't right, and I've been carrying that ever since.",
    gentle:
      "I wanted you to know that I'm truly sorry. What happened wasn't right, and I've thought about it every day since.",
  },
  Emotional: {
    raw: "I've thought about this more times than I can say. I'm sorry for the hurt I caused. You deserved better from me.",
    gentle:
      "I've thought about what happened more times than I can count. I'm deeply sorry for the pain I caused. You deserved so much better.",
  },
  Reflective: {
    raw: "I've had a lot of time to think about what happened. I understand now what I got wrong. I'm sorry — genuinely.",
    gentle:
      "I've spent a long time reflecting on what happened between us. I understand now what I got wrong, and I'm genuinely, deeply sorry.",
  },
};

const CRISIS_KEYWORDS = [
  "kill myself",
  "end it all",
  "can't go on",
  "cannot go on",
  "no reason to live",
  "want to die",
  "hurt myself",
];

const SIGNATURE_OPTIONS = [
  "From someone who regrets",
  "From someone who misses you",
  "From someone who cares",
];

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function interpolate(a: string, b: string, t: number): string {
  // Simple blend: if slider is left (0) return raw, right (100) return gentle
  // We discretely switch at midpoint for clean text
  return t < 50 ? a : b;
}

// ── Apology Creation Flow Component ──────────────────────────────────────────

export function ApologyCreationFlow({
  onClose,
  onSaved,
  initialContent,
}: {
  onClose: () => void;
  onSaved: () => void;
  initialContent?: string;
}) {
  const { actor } = useActor();
  const { triggerMoment } = useVeilVoice();
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // ── State ──
  const [step, setStep] = useState<Step>("PATH_CHOICE");
  const [intent, setIntent] = useState<Intent>("express");
  const [text, setText] = useState(initialContent ?? "");
  const [originalText, setOriginalText] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [showCrisisCard, setShowCrisisCard] = useState(false);
  const [showSupportOptions, setShowSupportOptions] = useState(false);

  // AI
  const [selectedTone, setSelectedTone] = useState<ToneVariant | null>(null);
  const [toneSlider, setToneSlider] = useState(50);
  const [showAIDisclosure, setShowAIDisclosure] = useState(false);

  // Signature
  const [signature, setSignature] = useState("");
  const [customSig, setCustomSig] = useState("");
  const [sigMode, setSigMode] = useState<"preset" | "custom">("preset");

  // Recipient
  const [recipientType, setRecipientType] = useState<
    "INNER_CIRCLE" | "NON_VEIL_EMAIL" | "NON_VEIL_SMS" | null
  >(null);
  const [recipientContact, setRecipientContact] = useState("");
  const [showContactInput, setShowContactInput] = useState(false);

  // Identity
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Delivery
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("now");
  const [customTime, setCustomTime] = useState("");

  // Saving
  const [saving, setSaving] = useState(false);

  // Crisis debounce
  const crisisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Daily placeholder
  const placeholder = PLACEHOLDERS[new Date().getDay() % PLACEHOLDERS.length];

  // Word count
  const wordCount = countWords(text);
  const atLimit = wordCount >= 300;

  // ── Crisis detection ──
  const detectCrisis = useCallback((val: string) => {
    const lower = val.toLowerCase();
    const found = CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
    setCrisisDetected(found);
    if (found) setShowCrisisCard(true);
  }, []);

  const handleTextChange = (val: string) => {
    if (wordCount >= 300 && countWords(val) > 300) return;
    setText(val);
    if (crisisTimerRef.current) clearTimeout(crisisTimerRef.current);
    crisisTimerRef.current = setTimeout(() => detectCrisis(val), 3000);
  };

  useEffect(() => {
    return () => {
      if (crisisTimerRef.current) clearTimeout(crisisTimerRef.current);
    };
  }, []);

  // ── Derived ──
  const effectiveSig =
    sigMode === "custom" ? customSig.slice(0, 60) : signature;
  const canContinueFromWrite = text.trim().length > 0;
  const canAIAssist = wordCount >= 20;

  const selectedAIText = selectedTone
    ? interpolate(
        AI_CONTENT[selectedTone].raw,
        AI_CONTENT[selectedTone].gentle,
        toneSlider,
      )
    : "";

  // ── Delivery time calc ──
  function getDeliveryTimestamp(): bigint | null {
    const now = new Date();
    if (deliveryOption === "now") return null;
    if (deliveryOption === "1hour") {
      return BigInt(now.getTime() + 3600000);
    }
    if (deliveryOption === "tonight") {
      const t = new Date(now);
      t.setHours(20, 0, 0, 0);
      if (t <= now) t.setDate(t.getDate() + 1);
      return BigInt(t.getTime());
    }
    if (deliveryOption === "tomorrow") {
      const t = new Date(now);
      t.setDate(t.getDate() + 1);
      t.setHours(9, 0, 0, 0);
      return BigInt(t.getTime());
    }
    if (deliveryOption === "custom" && customTime) {
      return BigInt(new Date(customTime).getTime());
    }
    return null;
  }

  function formatDeliveryLabel(): string {
    if (deliveryOption === "now") return "Sending now";
    if (deliveryOption === "1hour") return "In about 1 hour";
    if (deliveryOption === "tonight") return "Tonight at 8:00 PM";
    if (deliveryOption === "tomorrow") return "Tomorrow at 9:00 AM";
    if (deliveryOption === "custom" && customTime) {
      return new Date(customTime).toLocaleString();
    }
    return "Scheduled";
  }

  // ── Save logic ──
  async function handleSend() {
    if (!actor) return;
    setSaving(true);
    try {
      const apologyId = await actor.createApology(
        text,
        effectiveSig,
        "APOLOGY",
        isAnonymous,
        false,
        "NONE",
        intent === "express" ? "MANUAL" : "MANUAL",
        crisisDetected,
      );

      const deliveryTs = getDeliveryTimestamp();

      if (deliveryTs && deliveryOption !== "now") {
        await actor.scheduleApology(
          apologyId,
          null,
          recipientType ?? "NON_VEIL_EMAIL",
          recipientContact || null,
          deliveryTs,
        );
      } else {
        await actor.sendApologyNow(
          apologyId,
          null,
          recipientType ?? "NON_VEIL_EMAIL",
          recipientContact || null,
        );
      }

      setStep("SENT_CONFIRM");
      setTimeout(() => triggerMoment("apology_sent" as any), 500);
    } catch {
      // continue silently
    } finally {
      setSaving(false);
    }
  }

  async function handleKeepPrivate() {
    if (!actor) return;
    setSaving(true);
    try {
      const apologyId = await actor.createApology(
        text,
        effectiveSig,
        "APOLOGY",
        false,
        false,
        "NONE",
        "MANUAL",
        crisisDetected,
      );
      await actor.saveApologyAsUnsent(apologyId);
      setStep("UNSENT_CONFIRM");
      setTimeout(() => triggerMoment("apology_unsent" as any), 500);
    } catch {
      // continue silently
    } finally {
      setSaving(false);
    }
  }

  // ── Animations ──
  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.22 },
      };

  // ── Render helpers ──

  function BackButton({ to }: { to: Step }) {
    return (
      <button
        type="button"
        onClick={() => setStep(to)}
        className="flex items-center gap-1 text-veil-muted text-sm hover:text-veil-text transition-colors"
        aria-label="Go back"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 3L5 8L10 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>
    );
  }

  // ─────────────────────────── STEP RENDERS ───────────────────────────────────

  function renderPathChoice() {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🕊</div>
          <h1 className="font-serif text-2xl font-semibold text-veil-text mb-3">
            Write an Apology
          </h1>
          <p className="text-veil-muted text-sm">Two paths. Both are real.</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            data-ocid="apology.express_path.button"
            type="button"
            onClick={() => {
              setIntent("express");
              setStep("WRITE");
            }}
            className="w-full bg-white rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98]"
          >
            <div className="text-2xl mb-3">🕊</div>
            <div className="font-serif text-base font-semibold text-veil-text mb-1">
              Write to express
            </div>
            <p className="text-veil-muted text-sm leading-relaxed">
              Send to someone you hurt. Or keep it private. You decide at the
              end.
            </p>
          </button>

          <button
            data-ocid="apology.heal_path.button"
            type="button"
            onClick={() => {
              setIntent("heal");
              setStep("WRITE");
            }}
            className="w-full bg-white rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98]"
          >
            <div className="text-2xl mb-3">📖</div>
            <div className="font-serif text-base font-semibold text-veil-text mb-1">
              Write to heal
            </div>
            <p className="text-veil-muted text-sm leading-relaxed">
              This stays between you and Veil. Never sent. Always safe.
            </p>
          </button>
        </div>
      </div>
    );
  }

  function renderWrite() {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <BackButton to="PATH_CHOICE" />
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            Write an Apology
          </h1>
        </div>

        {/* Crisis card */}
        {showCrisisCard && (
          <div className="mx-5 mb-4 bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <p className="text-sm text-amber-800 mb-3 leading-relaxed">
              Veil hears how heavy this is. You don't have to carry this alone.
            </p>
            {showSupportOptions ? (
              <div className="space-y-1 text-xs text-amber-700 mb-3">
                <p>
                  iCall India: <strong>9152987821</strong>
                </p>
                <p>
                  Vandrevala Foundation: <strong>1860-2662-345</strong>
                </p>
                <p>
                  Crisis Text Line (US): Text <strong>HOME</strong> to{" "}
                  <strong>741741</strong>
                </p>
              </div>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSupportOptions(true)}
                className="text-xs text-amber-700 underline underline-offset-2"
              >
                See support options
              </button>
              <button
                type="button"
                onClick={() => setShowCrisisCard(false)}
                className="text-xs text-amber-600"
              >
                Keep writing
              </button>
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 px-5 relative">
          <textarea
            data-ocid="apology.write.textarea"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full min-h-[200px] bg-transparent text-veil-text placeholder:text-veil-muted/50 outline-none text-base leading-relaxed resize-none font-serif pt-2"
            style={{ border: "none" }}
            aria-label="Write your apology"
          />

          {/* Word counter */}
          {wordCount >= 250 && (
            <div
              className={`text-right text-xs mt-1 transition-colors ${
                wordCount >= 280 ? "text-amber-500" : "text-veil-muted"
              }`}
            >
              {wordCount} / 300 words
            </div>
          )}
          {atLimit && (
            <p className="text-xs text-amber-500 text-center mt-1">
              This feels complete. Sometimes less is more.
            </p>
          )}
        </div>

        {/* Writing prompts */}
        <div className="px-5 mt-2">
          <button
            type="button"
            onClick={() => setShowPrompts((v) => !v)}
            className="text-xs text-veil-muted hover:text-veil-purple transition-colors flex items-center gap-1"
          >
            <span>Need help starting?</span>
            <span>{showPrompts ? "▲" : "▼"}</span>
          </button>
          {showPrompts && (
            <div className="mt-2 space-y-2">
              {WRITING_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setText(p);
                    setShowPrompts(false);
                  }}
                  className="block w-full text-left text-xs text-veil-purple bg-purple-50/60 rounded-xl px-3 py-2 hover:bg-purple-50 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom buttons */}
        <div className="px-5 py-5 space-y-3">
          <div className="relative group">
            <button
              data-ocid="apology.write.ai_assist.button"
              type="button"
              disabled={!canAIAssist}
              onClick={() => {
                setOriginalText(text);
                setStep("AI_SUGGESTIONS");
              }}
              className={`w-full py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                canAIAssist
                  ? "bg-veil-purple/10 text-veil-purple hover:bg-veil-purple/20 active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              ✨ Help me express this
            </button>
            {!canAIAssist && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-veil-text text-white text-xs rounded-xl px-3 py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Write a little first — then Veil can help you find the words.
              </div>
            )}
          </div>

          <button
            data-ocid="apology.write.continue.button"
            type="button"
            disabled={!canContinueFromWrite}
            onClick={() => setStep("SIGNATURE")}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 active:scale-[0.98] shadow-soft"
            style={{
              background: canContinueFromWrite
                ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
                : undefined,
              backgroundColor: canContinueFromWrite ? undefined : "#C9B8E8",
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  function renderAISuggestions() {
    const tones: ToneVariant[] = ["Simple", "Emotional", "Reflective"];

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <BackButton to="WRITE" />
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            Choose a starting point
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
          {tones.map((tone) => {
            const txt = interpolate(
              AI_CONTENT[tone].raw,
              AI_CONTENT[tone].gentle,
              toneSlider,
            );
            const isSelected = selectedTone === tone;
            return (
              <button
                data-ocid={`apology.ai_tone_${tone.toLowerCase()}.button`}
                key={tone}
                type="button"
                onClick={() => setSelectedTone(tone)}
                className={`w-full bg-white rounded-3xl p-5 text-left transition-all duration-200 shadow-soft ${
                  isSelected
                    ? "ring-2 ring-veil-purple/60 shadow-glow"
                    : "hover:shadow-glow active:scale-[0.99]"
                }`}
              >
                <p className="text-xs font-semibold text-veil-purple uppercase tracking-wider mb-2">
                  {tone}
                </p>
                <p className="text-sm text-veil-text leading-relaxed font-serif">
                  {txt}
                </p>
              </button>
            );
          })}

          {/* Tone slider */}
          <div className="bg-white rounded-3xl p-5 shadow-soft">
            <div className="flex justify-between text-xs text-veil-muted mb-3">
              <span>← Raw</span>
              <span>Gentle →</span>
            </div>
            <input
              data-ocid="apology.ai_tone_slider.input"
              type="range"
              min={0}
              max={100}
              value={toneSlider}
              onChange={(e) => setToneSlider(Number(e.target.value))}
              className="w-full accent-veil-purple"
              aria-label="Tone slider: Raw to Gentle"
            />
          </div>

          {/* None feel right */}
          <button
            type="button"
            onClick={() => {
              setText(originalText);
              setStep("WRITE");
            }}
            className="w-full text-center text-sm text-veil-muted hover:text-veil-purple transition-colors py-2"
          >
            None of these feel right → Go back to my own words
          </button>
        </div>

        <div className="px-5 py-5">
          <button
            data-ocid="apology.ai_select.button"
            type="button"
            disabled={!selectedTone}
            onClick={() => selectedTone && setShowAIDisclosure(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 active:scale-[0.98] shadow-soft"
            style={{
              background: selectedTone
                ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
                : undefined,
              backgroundColor: selectedTone ? undefined : "#C9B8E8",
            }}
          >
            Use this →
          </button>
        </div>

        {/* AI Disclosure overlay */}
        {showAIDisclosure && (
          <div className="absolute inset-0 z-10 flex items-end bg-black/20 backdrop-blur-sm">
            <div className="w-full bg-white rounded-t-3xl p-6 shadow-xl">
              <p className="font-serif text-base font-medium text-veil-text mb-2">
                These words were shaped by Veil to help you begin.
              </p>
              <p className="text-sm text-veil-muted mb-6 leading-relaxed">
                Edit them until they sound like you. Then they are yours.
              </p>
              <div className="space-y-3">
                <button
                  data-ocid="apology.ai_edit.button"
                  type="button"
                  onClick={() => {
                    setText(selectedAIText);
                    setShowAIDisclosure(false);
                    setStep("WRITE");
                  }}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold text-veil-purple bg-veil-purple/10 hover:bg-veil-purple/20 transition-colors active:scale-[0.98]"
                >
                  Edit before continuing
                </button>
                <button
                  data-ocid="apology.ai_use.button"
                  type="button"
                  onClick={() => {
                    setText(selectedAIText);
                    setShowAIDisclosure(false);
                    setStep("SIGNATURE");
                  }}
                  className="w-full py-3.5 rounded-2xl text-sm font-medium text-veil-muted hover:text-veil-text transition-colors"
                >
                  Use as starting point
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSignature() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <BackButton to="WRITE" />
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            How do you want to sign this?
          </h1>
        </div>

        <div className="flex-1 px-5 space-y-3">
          {SIGNATURE_OPTIONS.map((opt) => (
            <button
              data-ocid={`apology.signature_${opt.split(" ")[1]}.button`}
              key={opt}
              type="button"
              onClick={() => {
                setSignature(opt);
                setSigMode("preset");
              }}
              className={`w-full bg-white rounded-2xl px-5 py-4 text-left text-sm font-medium transition-all duration-200 shadow-soft ${
                sigMode === "preset" && signature === opt
                  ? "ring-2 ring-veil-purple/60 text-veil-purple"
                  : "text-veil-text hover:shadow-glow"
              }`}
            >
              {opt}
            </button>
          ))}

          {/* Custom signature */}
          <button
            type="button"
            onClick={() => setSigMode("custom")}
            className={`w-full bg-white rounded-2xl px-5 py-4 text-left transition-all duration-200 shadow-soft ${
              sigMode === "custom"
                ? "ring-2 ring-veil-purple/60"
                : "hover:shadow-glow"
            }`}
          >
            <p className="text-sm font-medium text-veil-text mb-2">
              Write your own...
            </p>
            {sigMode === "custom" && (
              <input
                data-ocid="apology.signature_custom.input"
                type="text"
                maxLength={60}
                value={customSig}
                onChange={(e) => setCustomSig(e.target.value)}
                placeholder="e.g. From someone who's been thinking about you"
                className="w-full bg-transparent outline-none text-sm text-veil-text placeholder:text-veil-muted/60"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </button>
        </div>

        <div className="px-5 py-5">
          <button
            data-ocid="apology.signature_continue.button"
            type="button"
            disabled={!effectiveSig}
            onClick={() => {
              if (intent === "express") setStep("RECIPIENT");
              else setStep("CONFIRM");
            }}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 active:scale-[0.98] shadow-soft"
            style={{
              background: effectiveSig
                ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
                : undefined,
              backgroundColor: effectiveSig ? undefined : "#C9B8E8",
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  function renderRecipient() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <BackButton to="SIGNATURE" />
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            Who is this for?
          </h1>
        </div>

        <div className="flex-1 px-5 space-y-4">
          {/* Inner circle */}
          <div className="bg-white rounded-3xl p-5 shadow-soft">
            <p className="text-xs font-semibold text-veil-purple uppercase tracking-wider mb-3">
              Your Inner Circle
            </p>
            <div className="text-center py-6">
              <p className="text-sm text-veil-muted leading-relaxed mb-4">
                This person isn't in your Inner Circle yet.
              </p>
              <p className="text-sm text-veil-text leading-relaxed mb-5">
                You can invite them to Veil, or keep this apology private for
                now.
              </p>
              <div className="space-y-2">
                <button
                  data-ocid="apology.invite.button"
                  type="button"
                  className="w-full py-3 rounded-2xl text-sm font-medium text-veil-purple bg-veil-purple/10 hover:bg-veil-purple/20 transition-colors"
                >
                  Invite them
                </button>
                <button
                  data-ocid="apology.keep_private.button"
                  type="button"
                  onClick={async () => {
                    setStep("CONFIRM");
                    setIntent("heal");
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-medium text-veil-muted hover:text-veil-text transition-colors"
                >
                  Keep it private
                </button>
              </div>
            </div>
          </div>

          {/* Non-Veil user */}
          <div className="bg-white rounded-3xl p-5 shadow-soft">
            <p className="text-xs font-semibold text-veil-muted uppercase tracking-wider mb-3">
              Send to someone not on Veil
            </p>
            {!showContactInput ? (
              <button
                data-ocid="apology.non_veil_contact.button"
                type="button"
                onClick={() => setShowContactInput(true)}
                className="w-full py-3 rounded-2xl text-sm font-medium text-veil-text bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Enter phone or email →
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  data-ocid="apology.contact_input.input"
                  type="text"
                  value={recipientContact}
                  onChange={(e) => setRecipientContact(e.target.value)}
                  placeholder="Phone number or email address"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-veil-text outline-none placeholder:text-veil-muted"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const isEmail = recipientContact.includes("@");
                      setRecipientType(
                        isEmail ? "NON_VEIL_EMAIL" : "NON_VEIL_SMS",
                      );
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs text-veil-muted"
                  >
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType("NON_VEIL_EMAIL")}
                    className="flex-1 py-2.5 rounded-xl text-xs text-veil-muted"
                  >
                    Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-5">
          <button
            data-ocid="apology.recipient_continue.button"
            type="button"
            disabled={!recipientContact}
            onClick={() => setStep("IDENTITY")}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 active:scale-[0.98] shadow-soft"
            style={{
              background: recipientContact
                ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
                : undefined,
              backgroundColor: recipientContact ? undefined : "#C9B8E8",
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  function renderIdentity() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <BackButton to="RECIPIENT" />
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            How do you want to appear?
          </h1>
        </div>

        <div className="flex-1 px-5 space-y-4">
          <button
            data-ocid="apology.identity_reveal.button"
            type="button"
            onClick={() => setIsAnonymous(false)}
            className={`w-full bg-white rounded-3xl p-6 text-left shadow-soft transition-all duration-200 ${
              !isAnonymous ? "ring-2 ring-veil-purple/60" : "hover:shadow-glow"
            }`}
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-veil-text text-sm mb-1">
              Reveal who I am
            </div>
            <p className="text-xs text-veil-muted">
              Your name will appear alongside your apology.
            </p>
          </button>

          <button
            data-ocid="apology.identity_anonymous.button"
            type="button"
            onClick={() => setIsAnonymous(true)}
            className={`w-full bg-white rounded-3xl p-6 text-left shadow-soft transition-all duration-200 ${
              isAnonymous ? "ring-2 ring-veil-purple/60" : "hover:shadow-glow"
            }`}
          >
            <div className="text-2xl mb-2">🌫</div>
            <div className="font-medium text-veil-text text-sm mb-1">
              Stay anonymous
            </div>
            <p className="text-xs text-veil-muted">
              Only your signature will show. Your identity stays private.
            </p>
          </button>
        </div>

        <div className="px-5 py-5">
          <button
            data-ocid="apology.identity_continue.button"
            type="button"
            onClick={() => setStep("DELIVERY")}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] shadow-soft"
            style={{
              background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  function renderDelivery() {
    const isDelayed = deliveryOption !== "now";
    const opts: DeliveryOption[] = [
      "now",
      "1hour",
      "tonight",
      "tomorrow",
      "custom",
    ];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <BackButton to="IDENTITY" />
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            When should this arrive?
          </h1>
        </div>

        <div className="flex-1 px-5 space-y-3">
          {opts.map((opt) => (
            <button
              data-ocid={`apology.delivery_${opt}.button`}
              key={opt}
              type="button"
              onClick={() => setDeliveryOption(opt)}
              className={`w-full bg-white rounded-2xl px-5 py-4 text-left text-sm font-medium shadow-soft transition-all duration-200 ${
                deliveryOption === opt
                  ? "ring-2 ring-veil-purple/60 text-veil-purple"
                  : "text-veil-text hover:shadow-glow"
              }`}
            >
              {DELIVERY_LABELS[opt]}
            </button>
          ))}

          {deliveryOption === "custom" && (
            <input
              data-ocid="apology.delivery_custom_time.input"
              type="datetime-local"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full bg-white rounded-2xl px-5 py-4 text-sm text-veil-text shadow-soft outline-none"
            />
          )}

          {isDelayed && (
            <div className="bg-purple-50/60 rounded-2xl p-4">
              <p className="text-xs text-veil-muted leading-relaxed">
                Giving it time often brings clarity.
                <br />
                You can still change your mind before it arrives.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-5">
          <button
            data-ocid="apology.delivery_continue.button"
            type="button"
            onClick={() => setStep("CONFIRM")}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] shadow-soft"
            style={{
              background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
            }}
          >
            Review & Send →
          </button>
        </div>
      </div>
    );
  }

  function renderConfirm() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <BackButton
            to={
              intent === "express"
                ? "DELIVERY"
                : intent === "heal"
                  ? "SIGNATURE"
                  : "SIGNATURE"
            }
          />
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            Review your apology
          </h1>
        </div>

        <div className="flex-1 px-5 overflow-y-auto">
          {/* Preview card */}
          <div className="bg-white rounded-3xl p-8 shadow-soft text-center mb-5">
            <p className="font-serif text-base text-veil-text leading-relaxed mb-6 whitespace-pre-wrap">
              {text}
            </p>
            <p className="font-serif italic text-veil-muted text-sm mb-5">
              — {effectiveSig || "Anonymous"}
            </p>
            <div className="border-t border-gray-100 pt-4 space-y-1 text-xs text-veil-muted">
              {intent === "express" && (
                <>
                  <p>Delivery: {formatDeliveryLabel()}</p>
                  {recipientContact && <p>To: {recipientContact}</p>}
                  <p>Identity: {isAnonymous ? "Anonymous" : "Revealed"}</p>
                </>
              )}
              {intent === "heal" && <p>Private reflection — never sent</p>}
            </div>
          </div>

          <p className="text-xs text-veil-muted text-center leading-relaxed mb-6">
            You wrote something real. Sending it takes courage.
            <br />
            Once delivered, it cannot be changed.
            <br />
            Until then — it's yours to refine.
          </p>

          {intent === "express" && (
            <button
              data-ocid="apology.send.button"
              type="button"
              disabled={saving}
              onClick={handleSend}
              className="w-full py-4 rounded-3xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 active:scale-[0.98] shadow-soft mb-3 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
              }}
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </button>
          )}

          <button
            data-ocid="apology.keep_private_confirm.button"
            type="button"
            disabled={saving}
            onClick={handleKeepPrivate}
            className="w-full py-3 rounded-2xl text-sm font-medium text-veil-muted hover:text-veil-text transition-colors"
          >
            Keep it private instead
          </button>
        </div>
      </div>
    );
  }

  function renderUnsentConfirm() {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
        <div className="text-5xl mb-6">🌿</div>
        <h2 className="font-serif text-xl font-semibold text-veil-text mb-4">
          Your apology is safe here.
        </h2>
        <p className="text-veil-muted text-sm leading-relaxed mb-8 max-w-xs">
          You can come back to it anytime.
          <br />
          You can send it later if you ever choose to.
          <br />
          Or leave it here, where it belongs.
        </p>
        <button
          data-ocid="apology.unsent_confirm.close_button"
          type="button"
          onClick={() => {
            onSaved();
            onClose();
          }}
          className="px-8 py-3 rounded-full text-sm font-medium text-veil-purple bg-veil-purple/10 hover:bg-veil-purple/20 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  function renderSentConfirm() {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
        <div className="text-5xl mb-6">🕊</div>
        <h2 className="font-serif text-xl font-semibold text-veil-text mb-4">
          Your apology is on its way.
        </h2>
        <p className="text-veil-muted text-sm leading-relaxed mb-8 max-w-xs">
          You did something brave today.
        </p>
        <button
          data-ocid="apology.sent_confirm.close_button"
          type="button"
          onClick={() => {
            onSaved();
            onClose();
          }}
          className="px-8 py-3 rounded-full text-sm font-medium text-veil-purple bg-veil-purple/10 hover:bg-veil-purple/20 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  const STEP_RENDER: Record<Step, () => React.ReactElement> = {
    PATH_CHOICE: renderPathChoice,
    WRITE: renderWrite,
    AI_SUGGESTIONS: renderAISuggestions,
    SIGNATURE: renderSignature,
    RECIPIENT: renderRecipient,
    IDENTITY: renderIdentity,
    DELIVERY: renderDelivery,
    CONFIRM: renderConfirm,
    UNSENT_CONFIRM: renderUnsentConfirm,
    SENT_CONFIRM: renderSentConfirm,
  };

  return (
    <div
      data-ocid="apology.modal"
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#FAF9F7" }}
    >
      {/* Close button (hidden on terminal screens) */}
      {step !== "UNSENT_CONFIRM" && step !== "SENT_CONFIRM" && (
        <button
          data-ocid="apology.close_button"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/80 text-veil-muted flex items-center justify-center shadow-soft hover:text-veil-text transition-colors"
          aria-label="Close apology flow"
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
        <motion.div
          key={step}
          className="flex flex-col flex-1 overflow-y-auto relative"
          {...fade}
        >
          {STEP_RENDER[step]()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
