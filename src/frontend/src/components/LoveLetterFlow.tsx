import React, { useState, useRef, useEffect, useCallback } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import {
  type FeedbackBackground,
  WRITE_FEEDBACK,
} from "../lib/emotionalFeedbackCopy";
import { EmotionalFeedbackOverlay } from "./EmotionalFeedbackOverlay";

// ─── Types ───────────────────────────────────────────────────────────────────

type LetterType = "ROMANTIC" | "FAMILY" | "FRIENDSHIP" | "SELF";
type LetterPath = "SEND" | "KEEP";
type VisualStyle =
  | "WARM_CREAM"
  | "VINTAGE"
  | "MINIMAL_WHITE"
  | "SOFT_NIGHT"
  | "SPRING";
type AIVersion =
  | "TENDER"
  | "HEARTFELT"
  | "POETIC"
  | "DIRECT"
  | "WARM"
  | "SIMPLE"
  | "GENTLE"
  | "AFFIRMING"
  | "HONEST"
  | "NONE";

type Step =
  | "type_select"
  | "path_select"
  | "writing"
  | "ai_assist"
  | "visual_style"
  | "recipient"
  | "delivery"
  | "review"
  | "closure";

interface LetterState {
  letterType: LetterType | null;
  path: LetterPath | null;
  openingLine: string;
  body: string;
  closingLine: string;
  signature: string;
  signatureType: "real" | "nickname" | "anonymous";
  visualStyle: VisualStyle;
  recipient: string; // name from inner circle
  recipientType: string;
  deliveryOption: string;
  deliveryDate: string;
  isAnonymous: boolean;
  aiAssisted: boolean;
  aiVersionUsed: AIVersion;
  editLevel: string;
  crisisSignalDetected: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LETTER_TYPE_CARDS = [
  {
    type: "ROMANTIC" as LetterType,
    icon: "💌",
    title: "To someone I love",
    subtitle: "Romantic love",
    desc: "Say what your heart has been holding.",
  },
  {
    type: "FAMILY" as LetterType,
    icon: "🌸",
    title: "To my family",
    subtitle: "Parent · Sibling · Child",
    desc: "The love that is always there — even unspoken.",
  },
  {
    type: "FRIENDSHIP" as LetterType,
    icon: "🤝",
    title: "To a friend",
    subtitle: "Friendship love",
    desc: "Tell them what they mean to you.",
  },
  {
    type: "SELF" as LetterType,
    icon: "🪞",
    title: "To myself",
    subtitle: "Self-love",
    desc: "The most important letter you will ever write.",
  },
];

const OPENING_PLACEHOLDERS: Record<LetterType, string[]> = {
  ROMANTIC: ["My love,", "Hey you,", "I've been meaning to say this…"],
  FAMILY: ["Dear Mum,", "To the person who shaped me,", "Dear Dad,"],
  FRIENDSHIP: ["To my person,", "Hey,", "This is long overdue,"],
  SELF: ["Dear me,", "To the person reading this,", "Hey you — yes, you,"],
};

const CLOSING_PLACEHOLDERS: Record<LetterType, string[]> = {
  ROMANTIC: ["Yours always,", "With everything I am,"],
  FAMILY: ["With all my love,", "Always yours,"],
  FRIENDSHIP: ["Your friend, always,", "With love,"],
  SELF: ["With kindness,", "Be gentle with yourself,"],
};

const WRITING_PROMPTS: Record<LetterType, string[]> = {
  ROMANTIC: [
    "What do you love most about them?",
    "What do you feel when you think of them?",
    "What would you want them to know if you never got another chance to say it?",
    "What makes you choose them every day?",
  ],
  FAMILY: [
    "What did they do for you that you never thanked them for?",
    "What do you wish you could say out loud?",
    "What do you want them to know about how they shaped you?",
    "What would you say if they could hear everything you felt?",
  ],
  FRIENDSHIP: [
    "When did you realize this friendship was real?",
    "What do they do that they probably don't know means everything?",
    "What would your life look like without them in it?",
    "What have you never said out loud to them?",
  ],
  SELF: [
    "What do you forgive yourself for?",
    "What are you proud of — even if no one else knows?",
    "What do you wish someone would say to you?",
    "What do you need to hear right now?",
    "What would you say to yourself from five years ago?",
  ],
};

const AI_VERSIONS: Record<
  LetterType,
  Array<{ key: AIVersion; label: string; text: string }>
> = {
  ROMANTIC: [
    {
      key: "TENDER",
      label: "Tender",
      text: "I don't always know how to say what I feel.\nBut I know this —\nyou make everything feel less heavy.\nAnd I wanted you to know that.",
    },
    {
      key: "HEARTFELT",
      label: "Heartfelt",
      text: "There are things I think about you that I've never found the words for.\nThis is my attempt.\nI love you — more than I say it,\nmore than you know.",
    },
    {
      key: "POETIC",
      label: "Poetic",
      text: "You are the kind of person I write about in the quiet parts of the day.\nWhen no one is watching.\nWhen it's just me and what I actually feel.",
    },
  ],
  FAMILY: [
    {
      key: "TENDER",
      label: "Tender",
      text: "I don't say it enough.\nI'm not sure I know how.\nBut I want you to know that everything I am —\nyou had a part in it.",
    },
    {
      key: "HEARTFELT",
      label: "Heartfelt",
      text: "There are things I carry from you that I have never thanked you for.\nThis is me trying.\nI love you.\nMore than I show it.",
    },
    {
      key: "DIRECT",
      label: "Direct",
      text: "I'm proud of you.\nI've always been proud of you.\nI should have said it more often.\nI'm saying it now.",
    },
  ],
  FRIENDSHIP: [
    {
      key: "WARM",
      label: "Warm",
      text: "I don't think you know what you mean to me.\nI'm not sure I did either —\nuntil I tried to write this.\nYou matter.\nMore than you know.",
    },
    {
      key: "HEARTFELT",
      label: "Heartfelt",
      text: "Some people come into your life and you just know —\nthis is one of the real ones.\nThat's you.\nThat has always been you.",
    },
    {
      key: "SIMPLE",
      label: "Simple",
      text: "Thank you for being exactly who you are.\nThe world is better because you're in it.\nMy world is better because you're in mine.",
    },
  ],
  SELF: [
    {
      key: "GENTLE",
      label: "Gentle",
      text: "You have been through things no one else knows about.\nYou are still here.\nThat is not nothing.\nThat is everything.",
    },
    {
      key: "AFFIRMING",
      label: "Affirming",
      text: "You are allowed to take up space.\nYou are allowed to be proud of how far you have come.\nYou are allowed to be loved —\nstarting with by yourself.",
    },
    {
      key: "HONEST",
      label: "Honest",
      text: "You are harder on yourself than you would ever be on anyone you love.\nIt is time to change that.\nYou deserve the same gentleness you give everyone else.",
    },
  ],
};

const VISUAL_STYLES: Array<{
  key: VisualStyle;
  icon: string;
  label: string;
  desc: string;
  bg: string;
  text: string;
}> = [
  {
    key: "WARM_CREAM",
    icon: "☀️",
    label: "Warm Cream",
    desc: "Soft amber-toned paper. Gentle, timeless.",
    bg: "#FDF6E3",
    text: "#5C4A2A",
  },
  {
    key: "VINTAGE",
    icon: "📜",
    label: "Vintage Letter",
    desc: "Aged paper texture feel. Classic, intimate.",
    bg: "#F2E8D5",
    text: "#4A3728",
  },
  {
    key: "MINIMAL_WHITE",
    icon: "✦",
    label: "Minimal White",
    desc: "Clean, open, modern. Simple and direct.",
    bg: "#FAFAFA",
    text: "#2D2D2D",
  },
  {
    key: "SOFT_NIGHT",
    icon: "🌙",
    label: "Soft Night",
    desc: "Deep muted tones. For letters written in quiet moments.",
    bg: "#1E1B2E",
    text: "#C9B8E8",
  },
  {
    key: "SPRING",
    icon: "🌸",
    label: "Spring",
    desc: "Soft blush background. Light, tender, warm.",
    bg: "#FDE8EE",
    text: "#7B3D52",
  },
];

const INNER_CIRCLE_MOCK = [
  { id: "1", name: "Alex", emoji: "💛" },
  { id: "2", name: "Jordan", emoji: "💙" },
  { id: "3", name: "Sam", emoji: "💚" },
  { id: "4", name: "Morgan", emoji: "🩷" },
];

const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end it all",
  "can't go on",
  "no reason to live",
  "self harm",
  "hurt myself",
  "worthless",
  "hopeless",
  "no way out",
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function getVisualStyleBg(style: VisualStyle) {
  return VISUAL_STYLES.find((s) => s.key === style) ?? VISUAL_STYLES[0];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LoveLetterFlow({
  onClose,
  onSaved,
}: { onClose: () => void; onSaved: () => void }) {
  const { triggerMoment } = useVeilVoice();

  const [step, setStep] = useState<Step>("type_select");
  const [letter, setLetter] = useState<LetterState>({
    letterType: null,
    path: null,
    openingLine: "",
    body: "",
    closingLine: "",
    signature: "",
    signatureType: "real",
    visualStyle: "WARM_CREAM",
    recipient: "",
    recipientType: "INNER_CIRCLE",
    deliveryOption: "NOW",
    deliveryDate: "",
    isAnonymous: false,
    aiAssisted: false,
    aiVersionUsed: "NONE",
    editLevel: "NONE",
    crisisSignalDetected: false,
  });

  // Writing screen state
  const [showPrompts, setShowPrompts] = useState(false);
  const [showCrisisCard, setShowCrisisCard] = useState(false);
  const crisisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI assist state
  const [selectedAiVersion, setSelectedAiVersion] = useState<AIVersion | null>(
    null,
  );
  const [showAiDisclosure, setShowAiDisclosure] = useState(false);
  const [aiToneSlider, setAiToneSlider] = useState(50);

  // Closure state
  const closureMessages = [
    "You wrote something real.\nNow it belongs to them.",
    "You said what needed to be said.\nThat is enough.",
    "You chose someone today —\nand you told them.\nNot everyone does that.",
    "The words exist now.\nThat is a brave thing.",
  ];
  const [closureMsg] = useState(
    () => closureMessages[Math.floor(Math.random() * closureMessages.length)],
  );
  const [showSupportResources, setShowSupportResources] = useState(false);
  const [feedbackOverlay, setFeedbackOverlay] = useState<{
    lines: string[];
    background: FeedbackBackground;
    onDismiss: () => void;
  } | null>(null);

  // Word count
  const totalWords = countWords(
    `${letter.openingLine} ${letter.body} ${letter.closingLine}`.trim(),
  );
  const wordLimit = 600;

  // Crisis detection with debounce
  const handleBodyChange = useCallback(
    (val: string) => {
      const newLetter = { ...letter, body: val };
      if (detectCrisis(val)) {
        newLetter.crisisSignalDetected = true;
        if (crisisTimerRef.current) clearTimeout(crisisTimerRef.current);
        crisisTimerRef.current = setTimeout(
          () => setShowCrisisCard(true),
          3000,
        );
      }
      setLetter(newLetter);
    },
    [letter],
  );

  useEffect(
    () => () => {
      if (crisisTimerRef.current) clearTimeout(crisisTimerRef.current);
    },
    [],
  );

  const lt = letter.letterType ?? "ROMANTIC";
  const openingPlaceholder = OPENING_PLACEHOLDERS[lt][0];
  const closingPlaceholder = CLOSING_PLACEHOLDERS[lt][0];

  // ─── Step renderers ─────────────────────────────────────────────────────────

  function renderTypeSelect() {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-14 pb-6">
          <h1 className="font-serif text-2xl font-semibold text-veil-text mb-1">
            Who is this for?
          </h1>
          <p className="text-veil-muted text-sm">
            Every kind of love deserves to be written.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-8">
          {LETTER_TYPE_CARDS.map((card) => (
            <button
              type="button"
              key={card.type}
              aria-label={`Letter type: ${card.title}`}
              onClick={() => {
                setLetter({ ...letter, letterType: card.type });
                setStep("path_select");
              }}
              className="w-full bg-white rounded-3xl p-5 shadow-soft text-left flex items-start gap-4 transition-all duration-200 hover:shadow-glow active:scale-[0.98]"
            >
              <span className="text-3xl mt-0.5">{card.icon}</span>
              <div>
                <div className="font-serif text-base font-semibold text-veil-text mb-0.5">
                  {card.title}
                </div>
                <div className="text-xs text-veil-purple font-medium mb-1">
                  {card.subtitle}
                </div>
                <p className="text-veil-muted text-sm">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderPathSelect() {
    const card = LETTER_TYPE_CARDS.find((c) => c.type === letter.letterType)!;
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-14 pb-6 flex items-center gap-3">
          <span className="text-3xl">{card.icon}</span>
          <div>
            <h1 className="font-serif text-xl font-semibold text-veil-text">
              {card.title}
            </h1>
            <p className="text-veil-muted text-sm">{card.subtitle}</p>
          </div>
        </div>
        <div className="flex-1 px-5 flex flex-col justify-center gap-4 pb-10">
          <button
            type="button"
            aria-label="Write to send"
            onClick={() => {
              setLetter({ ...letter, path: "SEND" });
              setStep("writing");
            }}
            className="w-full bg-white rounded-3xl p-6 shadow-soft text-left flex items-start gap-4 transition-all duration-200 hover:shadow-glow active:scale-[0.98]"
          >
            <span className="text-3xl mt-0.5">💌</span>
            <div>
              <div className="font-serif text-base font-semibold text-veil-text mb-1">
                Write to send
              </div>
              <p className="text-veil-muted text-sm">
                Your letter reaches the person you wrote it for.
              </p>
            </div>
          </button>
          <button
            type="button"
            aria-label="Write to keep"
            onClick={() => {
              setLetter({ ...letter, path: "KEEP" });
              setStep("writing");
            }}
            className="w-full bg-white rounded-3xl p-6 shadow-soft text-left flex items-start gap-4 transition-all duration-200 hover:shadow-glow active:scale-[0.98]"
          >
            <span className="text-3xl mt-0.5">📖</span>
            <div>
              <div className="font-serif text-base font-semibold text-veil-text mb-1">
                Write to keep
              </div>
              <p className="text-veil-muted text-sm">
                This stays between you and Veil. Private. Always.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  function renderWriting() {
    const card = LETTER_TYPE_CARDS.find((c) => c.type === lt)!;
    const prompts = WRITING_PROMPTS[lt];
    const hasEnoughWords = countWords(letter.body) >= 15;
    const showCounter = totalWords >= 500;
    const counterColor =
      totalWords >= 570 ? "text-amber-500" : "text-veil-muted";

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <span className="text-2xl">{card.icon}</span>
          <h1 className="font-serif text-lg font-semibold text-veil-text">
            Write Your Letter
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {/* Opening line */}
          <input
            type="text"
            value={letter.openingLine}
            onChange={(e) =>
              setLetter({ ...letter, openingLine: e.target.value })
            }
            placeholder={openingPlaceholder}
            aria-label="Opening line"
            className="w-full bg-white/80 rounded-2xl px-5 py-3 text-veil-text placeholder:text-veil-muted shadow-soft outline-none font-serif text-base focus:shadow-glow transition-shadow"
          />

          {/* Body */}
          <div className="relative">
            <textarea
              value={letter.body}
              onChange={(e) => {
                const val = e.target.value;
                if (totalWords >= wordLimit && val.length > letter.body.length)
                  return;
                handleBodyChange(val);
              }}
              placeholder={
                lt === "SELF"
                  ? "Say everything. This is just for you."
                  : "Write freely. No pressure. No formatting. Just space."
              }
              aria-label="Letter body"
              rows={10}
              className="w-full bg-white rounded-3xl px-5 py-4 text-veil-text placeholder:text-veil-muted shadow-soft outline-none text-sm leading-relaxed resize-none focus:shadow-glow transition-shadow"
              style={{ minHeight: "220px", border: "none" }}
            />
            {lt === "SELF" && (
              <p className="absolute bottom-3 right-4 text-[10px] text-veil-muted/40 pointer-events-none select-none">
                Just you and Veil. Say everything.
              </p>
            )}
          </div>

          {/* Closing line */}
          <input
            type="text"
            value={letter.closingLine}
            onChange={(e) =>
              setLetter({ ...letter, closingLine: e.target.value })
            }
            placeholder={closingPlaceholder}
            aria-label="Closing line"
            className="w-full bg-white/80 rounded-2xl px-5 py-3 text-veil-text placeholder:text-veil-muted shadow-soft outline-none font-serif text-base focus:shadow-glow transition-shadow"
          />

          {/* Signature */}
          {lt !== "SELF" && (
            <div className="bg-white rounded-3xl p-5 shadow-soft space-y-3">
              <p className="text-sm font-medium text-veil-text">Sign as</p>
              <div className="flex flex-wrap gap-2">
                {(["real", "nickname", "anonymous"] as const).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      const isAnon = type === "anonymous";
                      setLetter({
                        ...letter,
                        signatureType: type,
                        isAnonymous: isAnon,
                      });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      letter.signatureType === type
                        ? "bg-veil-purple text-white"
                        : "bg-veil-bg text-veil-muted hover:bg-veil-purple/10"
                    }`}
                  >
                    {type === "real"
                      ? "My real name"
                      : type === "nickname"
                        ? "Nickname"
                        : "Anonymous"}
                  </button>
                ))}
              </div>
              {letter.signatureType !== "anonymous" && (
                <input
                  type="text"
                  value={letter.signature}
                  onChange={(e) =>
                    setLetter({ ...letter, signature: e.target.value })
                  }
                  placeholder={
                    letter.signatureType === "real"
                      ? "Your name"
                      : "Your nickname"
                  }
                  className="w-full bg-veil-bg rounded-2xl px-4 py-3 text-veil-text placeholder:text-veil-muted outline-none text-sm"
                />
              )}
              {lt === "FAMILY" && letter.isAnonymous && (
                <p className="text-xs text-amber-600/80 italic">
                  Family letters often mean more when they know who wrote them.
                  But it's your choice.
                </p>
              )}
            </div>
          )}

          {/* Word counter */}
          {showCounter && (
            <p className={`text-xs text-right pr-1 ${counterColor}`}>
              {totalWords} / {wordLimit}
            </p>
          )}
          {totalWords >= wordLimit && (
            <p className="text-xs text-amber-600/80 text-center italic">
              This letter is complete. The best letters say exactly what they
              need to — no more.
            </p>
          )}

          {/* Writing prompts */}
          <div className="bg-white/60 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPrompts((p) => !p)}
              className="w-full px-5 py-3 text-left text-sm text-veil-muted flex items-center justify-between"
            >
              <span>Need help starting?</span>
              <span className="text-veil-purple">
                {showPrompts ? "↑" : "↓"}
              </span>
            </button>
            {showPrompts && (
              <div className="px-5 pb-4 space-y-2">
                {prompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() =>
                      setLetter({
                        ...letter,
                        body: `${letter.body}${letter.body ? "\n" : ""}${prompt} `,
                      })
                    }
                    className="block w-full text-left text-sm text-veil-text/80 bg-veil-bg/60 rounded-xl px-4 py-2.5 hover:bg-veil-purple/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Crisis inline card */}
          {showCrisisCard && (
            <div className="bg-veil-purple/10 border border-veil-purple/20 rounded-3xl p-5 space-y-3">
              <p className="text-sm text-veil-text leading-relaxed">
                Veil hears how much you are carrying right now. You don't have
                to face this alone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSupportResources(true)}
                  className="flex-1 bg-veil-purple text-white rounded-2xl py-2.5 text-sm font-medium"
                >
                  See support options
                </button>
                <button
                  type="button"
                  onClick={() => setShowCrisisCard(false)}
                  className="flex-1 bg-white text-veil-muted rounded-2xl py-2.5 text-sm"
                >
                  Keep writing
                </button>
              </div>
              {showSupportResources && (
                <div className="pt-2 space-y-1.5 text-xs text-veil-text/80">
                  <p>
                    iCall India:{" "}
                    <a href="tel:9152987821" className="text-veil-purple">
                      9152987821
                    </a>
                  </p>
                  <p>
                    Vandrevala Foundation:{" "}
                    <a href="tel:18002662345" className="text-veil-purple">
                      1860-2662-345
                    </a>
                  </p>
                  <p>Crisis Text Line (US): Text HOME to 741741</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="px-5 py-4 space-y-3 border-t border-veil-purple/10">
          <button
            type="button"
            onClick={() => setStep("ai_assist")}
            disabled={!hasEnoughWords}
            aria-label="Help me find the words — AI Assist"
            className={`w-full rounded-2xl py-3.5 text-sm font-medium transition-all ${
              hasEnoughWords
                ? "bg-veil-purple text-white hover:bg-veil-purple/90"
                : "bg-veil-purple/20 text-veil-purple/40 cursor-not-allowed"
            }`}
            title={
              !hasEnoughWords
                ? "Write a little first — then Veil can help you find the words."
                : undefined
            }
          >
            Help me find the words
          </button>
          <button
            type="button"
            onClick={() => setStep("visual_style")}
            aria-label="Continue without AI"
            className="w-full bg-white text-veil-text rounded-2xl py-3.5 text-sm font-medium shadow-soft hover:shadow-glow transition-all"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  function renderAiAssist() {
    const versions = AI_VERSIONS[lt];
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-14 pb-4">
          <h1 className="font-serif text-xl font-semibold text-veil-text mb-1">
            Choose a starting point
          </h1>
          <p className="text-veil-muted text-sm">
            Three versions, shaped for you. Edit freely — make them yours.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {versions.map((v) => (
            <button
              type="button"
              key={v.key}
              onClick={() => {
                setSelectedAiVersion(v.key);
                if (!showAiDisclosure) setShowAiDisclosure(false);
              }}
              aria-label={`AI version: ${v.label}`}
              className={`w-full bg-white rounded-3xl p-5 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] ${
                selectedAiVersion === v.key ? "ring-2 ring-veil-purple" : ""
              }`}
            >
              <p className="text-xs font-medium text-veil-purple mb-2">
                {v.label}
              </p>
              <p className="text-sm text-veil-text leading-relaxed whitespace-pre-line">
                {v.text}
              </p>
            </button>
          ))}

          {/* Tone slider */}
          {selectedAiVersion && (
            <div className="bg-white rounded-2xl px-5 py-4 shadow-soft">
              <div className="flex justify-between text-xs text-veil-muted mb-2">
                <span>← Raw</span>
                <span>Gentle →</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={aiToneSlider}
                onChange={(e) => setAiToneSlider(Number(e.target.value))}
                aria-label="Tone slider: Raw to Gentle"
                className="w-full accent-veil-purple"
              />
            </div>
          )}

          {/* AI Disclosure */}
          {selectedAiVersion && (
            <div className="bg-veil-purple/10 rounded-3xl p-5 space-y-3">
              <p className="text-sm text-veil-text leading-relaxed italic">
                "These words were shaped by Veil to help you begin.{"\n"}
                Edit them until they sound like you.{"\n"}
                Then they are yours."
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const v = versions.find(
                      (ver) => ver.key === selectedAiVersion,
                    )!;
                    setLetter({
                      ...letter,
                      body: v.text,
                      aiAssisted: true,
                      aiVersionUsed: v.key,
                      editLevel: "NONE",
                    });
                    setStep("writing");
                  }}
                  className="flex-1 bg-veil-purple text-white rounded-2xl py-3 text-sm font-medium"
                >
                  Edit before continuing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const v = versions.find(
                      (ver) => ver.key === selectedAiVersion,
                    )!;
                    setLetter({
                      ...letter,
                      body: v.text,
                      aiAssisted: true,
                      aiVersionUsed: v.key,
                      editLevel: "NONE",
                    });
                    setStep("visual_style");
                  }}
                  className="flex-1 bg-white text-veil-text rounded-2xl py-3 text-sm font-medium shadow-soft"
                >
                  Use as starting point
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep("writing")}
            className="w-full text-center text-sm text-veil-muted py-2 underline"
          >
            None of these feel right → Go back to my own words
          </button>
        </div>
      </div>
    );
  }

  function renderVisualStyle() {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-14 pb-4">
          <h1 className="font-serif text-xl font-semibold text-veil-text mb-1">
            Choose a style
          </h1>
          <p className="text-veil-muted text-sm">
            How should this letter feel?
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {VISUAL_STYLES.map((style) => (
            <button
              type="button"
              key={style.key}
              onClick={() => setLetter({ ...letter, visualStyle: style.key })}
              aria-label={`Visual style: ${style.label}`}
              className={`w-full rounded-3xl p-5 shadow-soft text-left flex items-start gap-4 transition-all duration-200 hover:shadow-glow active:scale-[0.98] ${
                letter.visualStyle === style.key
                  ? "ring-2 ring-veil-purple"
                  : ""
              }`}
              style={{ background: style.bg }}
            >
              <span className="text-2xl mt-0.5">{style.icon}</span>
              <div>
                <div
                  className="font-serif text-base font-semibold mb-0.5"
                  style={{ color: style.text }}
                >
                  {style.label}
                </div>
                <p
                  className="text-sm"
                  style={{ color: style.text, opacity: 0.7 }}
                >
                  {style.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-veil-purple/10">
          <button
            type="button"
            onClick={() => setStep(lt === "SELF" ? "delivery" : "recipient")}
            aria-label="Continue to next step"
            className="w-full bg-veil-purple text-white rounded-2xl py-3.5 text-sm font-medium"
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
        <div className="px-6 pt-14 pb-4">
          <h1 className="font-serif text-xl font-semibold text-veil-text mb-1">
            Who is this for?
          </h1>
          <p className="text-veil-muted text-sm">
            Choose someone from your Inner Circle.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {INNER_CIRCLE_MOCK.map((person) => (
            <button
              type="button"
              key={person.id}
              onClick={() => {
                setLetter({
                  ...letter,
                  recipient: person.name,
                  recipientType: "INNER_CIRCLE",
                });
                setStep("delivery");
              }}
              aria-label={`Send to ${person.name}`}
              className={`w-full bg-white rounded-3xl p-5 shadow-soft text-left flex items-center gap-4 transition-all duration-200 hover:shadow-glow active:scale-[0.98] ${
                letter.recipient === person.name
                  ? "ring-2 ring-veil-purple"
                  : ""
              }`}
            >
              <span className="text-3xl">{person.emoji}</span>
              <span className="font-serif text-base font-medium text-veil-text">
                {person.name}
              </span>
            </button>
          ))}

          <div className="pt-2">
            <p className="text-xs text-veil-muted text-center mb-3">
              Person not in your Inner Circle?
            </p>
            <button
              type="button"
              onClick={() => {
                setLetter({
                  ...letter,
                  recipient: "Someone not on Veil",
                  recipientType: "NON_VEIL_SMS",
                });
                setStep("delivery");
              }}
              className="w-full bg-white/60 rounded-2xl py-3 text-sm text-veil-text/70 hover:bg-white transition-colors"
            >
              Send to someone not on Veil →
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderDelivery() {
    const isSelf = lt === "SELF";

    const selfOptions = [
      { key: "NOW", label: "Save and read now" },
      { key: "1W", label: "Send to myself in 1 week" },
      { key: "1M", label: "Send to myself in 1 month" },
      { key: "3M", label: "Send to myself in 3 months" },
      { key: "1Y", label: "Send to myself in 1 year" },
      { key: "CUSTOM", label: "Choose a date" },
    ];

    const sendOptions = [
      { key: "NOW", label: "Send now" },
      { key: "TONIGHT", label: "Tonight · 8:00 PM local" },
      { key: "TOMORROW", label: "Tomorrow morning · 8:00 AM local" },
      { key: "BIRTHDAY", label: "On their birthday" },
      { key: "SPECIAL", label: "On a special date" },
      { key: "PRIVATE", label: "Keep private for now" },
    ];

    const options = isSelf ? selfOptions : sendOptions;

    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-14 pb-4">
          <h1 className="font-serif text-xl font-semibold text-veil-text mb-1">
            {isSelf
              ? "When would you like to read this?"
              : "When should this arrive?"}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => setLetter({ ...letter, deliveryOption: opt.key })}
              aria-label={`Delivery: ${opt.label}`}
              className={`w-full bg-white rounded-2xl px-5 py-4 shadow-soft text-left text-sm font-medium text-veil-text transition-all hover:shadow-glow ${
                letter.deliveryOption === opt.key
                  ? "ring-2 ring-veil-purple"
                  : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
          {letter.deliveryOption === "CUSTOM" ||
          letter.deliveryOption === "SPECIAL" ||
          letter.deliveryOption === "BIRTHDAY" ? (
            <input
              type="date"
              value={letter.deliveryDate}
              onChange={(e) =>
                setLetter({ ...letter, deliveryDate: e.target.value })
              }
              className="w-full bg-white rounded-2xl px-5 py-3 text-veil-text shadow-soft outline-none text-sm"
            />
          ) : null}

          {letter.deliveryOption !== "NOW" &&
            letter.deliveryOption !== "PRIVATE" &&
            !isSelf && (
              <p className="text-xs text-veil-muted text-center italic px-4">
                We'll deliver this at 8 AM — when they're ready to receive it.
              </p>
            )}
        </div>
        <div className="px-5 py-4 border-t border-veil-purple/10">
          <button
            type="button"
            onClick={() => setStep("review")}
            aria-label="Continue to review"
            className="w-full bg-veil-purple text-white rounded-2xl py-3.5 text-sm font-medium"
          >
            Review your letter →
          </button>
        </div>
      </div>
    );
  }

  function renderReview() {
    const style = getVisualStyleBg(letter.visualStyle);
    const isSelf = lt === "SELF";

    return (
      <div className="flex flex-col h-full">
        <div className="px-5 pt-14 pb-4">
          <h1 className="font-serif text-xl font-semibold text-veil-text mb-1">
            Review your letter
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* Letter preview */}
          <div
            className="rounded-3xl p-7 shadow-soft space-y-4"
            style={{ background: style.bg }}
          >
            {letter.openingLine && (
              <p className="font-serif text-base" style={{ color: style.text }}>
                {letter.openingLine}
              </p>
            )}
            {letter.body && (
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: style.text }}
              >
                {letter.body}
              </p>
            )}
            {letter.closingLine && (
              <p className="font-serif text-sm" style={{ color: style.text }}>
                {letter.closingLine}
              </p>
            )}
            {lt !== "SELF" && letter.signature && (
              <p
                className="font-serif text-sm italic"
                style={{ color: style.text }}
              >
                — {letter.isAnonymous ? "Anonymous" : letter.signature}
              </p>
            )}
            <div
              className="pt-2 text-xs"
              style={{ color: style.text, opacity: 0.5 }}
            >
              {letter.deliveryOption === "NOW"
                ? "Sending now"
                : letter.deliveryOption === "TONIGHT"
                  ? "Arriving tonight at 8 PM"
                  : letter.deliveryOption === "TOMORROW"
                    ? "Arriving tomorrow at 8 AM"
                    : letter.deliveryOption === "BIRTHDAY"
                      ? "Arriving on their birthday"
                      : letter.deliveryOption === "PRIVATE" || isSelf
                        ? "Kept privately"
                        : letter.deliveryDate
                          ? `Arriving ${letter.deliveryDate}`
                          : "Scheduled"}
              {!isSelf &&
                letter.recipient &&
                ` · To ${letter.isAnonymous ? "Anonymous" : letter.recipient}`}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("writing")}
              className="flex-1 bg-white text-veil-text rounded-2xl py-3 text-sm shadow-soft"
            >
              Edit letter
            </button>
            <button
              type="button"
              onClick={() => setStep("visual_style")}
              className="flex-1 bg-white text-veil-text rounded-2xl py-3 text-sm shadow-soft"
            >
              Change style
            </button>
          </div>

          <div className="bg-white/60 rounded-2xl p-5 text-center space-y-1">
            <p className="text-sm text-veil-text">
              You wrote something beautiful.
            </p>
            <p className="text-xs text-veil-muted">
              Take a moment before it goes. Once sent, the words are theirs to
              keep.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3 border-t border-veil-purple/10">
          {letter.path === "SEND" && letter.deliveryOption !== "PRIVATE" ? (
            <button
              type="button"
              onClick={() => {
                setStep("closure");
                setTimeout(() => triggerMoment("ll_a"), 600);
              }}
              aria-label="Send this letter"
              className="w-full bg-veil-purple text-white rounded-2xl py-3.5 text-sm font-semibold shadow-glow"
            >
              Send this letter
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setTimeout(() => triggerMoment("ll_b"), 600);
              const isSelf = lt === "SELF";
              setFeedbackOverlay({
                lines: isSelf
                  ? WRITE_FEEDBACK.self_love
                  : WRITE_FEEDBACK.love_letter_kept,
                background: "default",
                onDismiss: () => {
                  setFeedbackOverlay(null);
                  onSaved();
                },
              });
            }}
            aria-label="Keep it private instead"
            className="w-full bg-white text-veil-text rounded-2xl py-3.5 text-sm font-medium shadow-soft"
          >
            Keep it private instead
          </button>
        </div>
      </div>
    );
  }

  function renderClosure() {
    const style = getVisualStyleBg(letter.visualStyle);
    const card = LETTER_TYPE_CARDS.find((c) => c.type === lt)!;

    return (
      <div
        className="flex flex-col items-center justify-center h-full px-8 text-center"
        style={{ background: style.bg }}
      >
        <div className="animate-fade-in space-y-6">
          <span className="text-5xl">{card.icon}</span>
          <p
            className="font-serif text-xl leading-relaxed whitespace-pre-line"
            style={{ color: style.text }}
          >
            {closureMsg}
          </p>
          <p className="text-sm" style={{ color: style.text, opacity: 0.6 }}>
            Your letter is on its way.
          </p>
          <button
            type="button"
            onClick={() => {
              setFeedbackOverlay({
                lines:
                  lt === "SELF"
                    ? WRITE_FEEDBACK.self_love
                    : WRITE_FEEDBACK.love_letter_sent,
                background: lt === "SELF" ? "default" : "warm-gold",
                onDismiss: () => {
                  setFeedbackOverlay(null);
                  onClose();
                },
              });
            }}
            aria-label="Close"
            className="mt-6 px-8 py-3 rounded-full text-sm font-medium"
            style={{ background: style.text, color: style.bg }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ─── Navigation helpers ──────────────────────────────────────────────────────

  function getBackStep(): Step | null {
    const map: Partial<Record<Step, Step>> = {
      path_select: "type_select",
      writing: "path_select",
      ai_assist: "writing",
      visual_style: "writing",
      recipient: "visual_style",
      delivery: lt === "SELF" ? "visual_style" : "recipient",
      review: "delivery",
    };
    return map[step] ?? null;
  }

  const backStep = getBackStep();

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-veil-bg"
      style={{ fontFamily: "inherit" }}
    >
      {/* Nav bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5 z-10">
        {backStep ? (
          <button
            type="button"
            onClick={() => setStep(backStep)}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 shadow-soft text-veil-text"
          >
            ←
          </button>
        ) : (
          <div />
        )}
        {step !== "closure" && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Express Love"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 shadow-soft text-veil-muted"
          >
            ✕
          </button>
        )}
      </div>

      {/* Step content */}
      {step === "type_select" && renderTypeSelect()}
      {step === "path_select" && renderPathSelect()}
      {step === "writing" && renderWriting()}
      {step === "ai_assist" && renderAiAssist()}
      {step === "visual_style" && renderVisualStyle()}
      {step === "recipient" && renderRecipient()}
      {step === "delivery" && renderDelivery()}
      {step === "review" && renderReview()}
      {step === "closure" && renderClosure()}

      {feedbackOverlay && (
        <EmotionalFeedbackOverlay
          lines={feedbackOverlay.lines}
          background={feedbackOverlay.background}
          onDismiss={feedbackOverlay.onDismiss}
        />
      )}
    </div>
  );
}
