import React, { useState, useEffect, useRef } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";

type LetterType = "ROMANTIC" | "FAMILY" | "FRIENDSHIP" | "SELF";
type VisualStyle =
  | "WARM_CREAM"
  | "VINTAGE"
  | "MINIMAL_WHITE"
  | "SOFT_NIGHT"
  | "SPRING";
type ReactionType = "FELT" | "LET_IT_SIT" | "WROTE_BACK" | null;

interface LetterData {
  letterType: LetterType;
  openingLine: string;
  bodyText: string;
  closingLine: string;
  signature: string;
  isAnonymous: boolean;
  visualStyle: VisualStyle;
  senderName?: string;
}

interface Props {
  letter: LetterData;
  onClose: () => void;
  onWriteBack?: () => void;
}

const STYLE_MAP: Record<VisualStyle, { bg: string; text: string }> = {
  WARM_CREAM: { bg: "#FDF6E3", text: "#5C4A2A" },
  VINTAGE: { bg: "#F2E8D5", text: "#4A3728" },
  MINIMAL_WHITE: { bg: "#FAFAFA", text: "#2D2D2D" },
  SOFT_NIGHT: { bg: "#1E1B2E", text: "#C9B8E8" },
  SPRING: { bg: "#FDE8EE", text: "#7B3D52" },
};

const TYPE_ICONS: Record<LetterType, string> = {
  ROMANTIC: "💌",
  FAMILY: "🌸",
  FRIENDSHIP: "🤝",
  SELF: "🪞",
};

const PRE_READ_LINES: Record<LetterType, string> = {
  ROMANTIC: "Someone wrote this just for you.",
  FAMILY: "Someone who loves you wrote this.",
  FRIENDSHIP: "A friend chose you today.",
  SELF: "You wrote this for yourself.\nYou needed to hear it then.\nYou may need it now.",
};

const RESPONSE_OPTIONS: Record<
  LetterType,
  {
    primary: string;
    secondary: Array<{
      key: ReactionType;
      icon: string;
      label: string;
      ariaLabel: string;
    }>;
  }
> = {
  ROMANTIC: {
    primary: "❤️",
    secondary: [
      {
        key: "WROTE_BACK",
        icon: "✍️",
        label: "Write them a letter back",
        ariaLabel: "Button: Write them a letter back",
      },
      {
        key: "LET_IT_SIT",
        icon: "🕊",
        label: "Let it sit with me",
        ariaLabel: "Button: Let it sit with me",
      },
    ],
  },
  FAMILY: {
    primary: "❤️",
    secondary: [
      {
        key: "WROTE_BACK",
        icon: "✍️",
        label: "Write something back",
        ariaLabel: "Button: Write something back",
      },
      {
        key: "LET_IT_SIT",
        icon: "🤍",
        label: "Hold this quietly",
        ariaLabel: "Button: Hold this quietly",
      },
    ],
  },
  FRIENDSHIP: {
    primary: "❤️",
    secondary: [
      {
        key: "WROTE_BACK",
        icon: "✍️",
        label: "Write them back",
        ariaLabel: "Button: Write them back",
      },
      {
        key: "LET_IT_SIT",
        icon: "🩷",
        label: "Keep this with me",
        ariaLabel: "Button: Keep this with me",
      },
    ],
  },
  SELF: {
    primary: "",
    secondary: [],
  },
};

const CLOSURE_MESSAGES: Record<string, string> = {
  FELT: "They felt it.\nYou felt it.\nSomething real happened today.",
  WROTE_BACK: "You're answering love with love.\nThat is rare.",
  LET_IT_SIT: "Some things don't need a response.\nThey just need to be felt.",
  SELF: "You wrote to yourself when you needed it.\nYou showed up for yourself.\nThat matters.",
};

type Phase = "pre_read" | "reveal" | "still" | "respond" | "closure";

export function LetterRevealExperience({
  letter,
  onClose,
  onWriteBack,
}: Props) {
  const { triggerMoment } = useVeilVoice();
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const [phase, setPhase] = useState<Phase>("pre_read");
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [reaction, setReaction] = useState<ReactionType>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const style = STYLE_MAP[letter.visualStyle];
  const icon = TYPE_ICONS[letter.letterType];
  const isSelf = letter.letterType === "SELF";

  // Build lines for line-by-line reveal
  const lines = [
    letter.openingLine,
    ...letter.bodyText.split("\n").filter(Boolean),
    letter.closingLine,
    !isSelf && !letter.isAnonymous && letter.signature
      ? `\u2014 ${letter.signature}`
      : "",
  ].filter(Boolean);

  // Phase sequencing
  useEffect(() => {
    if (phase === "pre_read") {
      timerRef.current = setTimeout(() => {
        triggerMoment("ll_c");
        setPhase("reveal");
      }, 3000);
    }

    if (phase === "reveal") {
      if (prefersReducedMotion) {
        setVisibleLines(lines.length);
        timerRef.current = setTimeout(() => setPhase("still"), 500);
      } else {
        let idx = 0;
        const revealNext = () => {
          idx++;
          setVisibleLines(idx);
          if (idx < lines.length) {
            const delay = idx === 1 ? 800 : 300;
            timerRef.current = setTimeout(revealNext, delay);
          } else {
            timerRef.current = setTimeout(() => setPhase("still"), 500);
          }
        };
        timerRef.current = setTimeout(revealNext, 400);
      }
    }

    if (phase === "still") {
      timerRef.current = setTimeout(() => setPhase("respond"), 5000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, lines.length, prefersReducedMotion, triggerMoment]); // biome-ignore lint/correctness/useExhaustiveDependencies: phase controls sequencing intentionally

  function handleFelt() {
    setReaction("FELT");
    triggerMoment("ll_d");
    setPhase("closure");
  }

  function handleSecondaryReaction(r: ReactionType) {
    setReaction(r);
    if (r === "WROTE_BACK") {
      setPhase("closure");
      triggerMoment("ll_d");
    } else {
      setPhase("closure");
    }
  }

  // Pre-read phase
  if (phase === "pre_read") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: style.bg }}
      >
        <div className="text-center space-y-6 animate-fade-in px-8">
          <span className="text-6xl block">{icon}</span>
          <p
            className="font-serif text-lg leading-relaxed whitespace-pre-line"
            style={{ color: style.text }}
          >
            {PRE_READ_LINES[letter.letterType]}
          </p>
        </div>
      </div>
    );
  }

  // Reveal + still + respond phases share letter layout
  if (phase === "reveal" || phase === "still" || phase === "respond") {
    const responseOpts = RESPONSE_OPTIONS[letter.letterType];

    return (
      <div
        role="presentation"
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
        style={{ background: style.bg }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
        }}
        onClick={() => {
          if (phase === "reveal") {
            // Accelerate to full reveal
            if (timerRef.current) clearTimeout(timerRef.current);
            setVisibleLines(lines.length);
            setTimeout(() => setPhase("still"), 300);
          }
        }}
      >
        <div className="flex-1 px-8 pt-16 pb-8 space-y-5">
          {lines.map((line, i) => (
            <p
              key={`${i}-${line.slice(0, 10)}`}
              className={`leading-relaxed transition-opacity duration-700 ${
                i < visibleLines ? "opacity-100" : "opacity-0"
              } ${
                i === lines.length - 1
                  ? "font-serif text-base italic"
                  : i === 0
                    ? "font-serif text-lg"
                    : "text-sm"
              }`}
              style={{ color: style.text }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Response options */}
        {phase === "respond" && (
          <div
            className="px-6 pb-10 pt-4 space-y-3 animate-fade-in border-t"
            style={{ borderColor: `${style.text}20` }}
          >
            {isSelf ? (
              <>
                <p
                  className="text-center text-sm py-2"
                  style={{ color: style.text }}
                >
                  You wrote this for yourself. It found you when it needed to.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerMoment("ll_e");
                    onClose();
                  }}
                  aria-label="Close and carry it with you"
                  className="w-full rounded-2xl py-3.5 text-sm font-medium"
                  style={{ background: style.text, color: style.bg }}
                >
                  Close — and carry it with you
                </button>
              </>
            ) : (
              <>
                {/* Primary: felt */}
                <button
                  type="button"
                  onClick={handleFelt}
                  aria-label="Button: I felt this letter"
                  className="w-full rounded-2xl py-4 text-base font-semibold flex items-center justify-center gap-3 min-h-[48px]"
                  style={{ background: `${style.text}15`, color: style.text }}
                >
                  <span>❤️</span>
                  <span>I felt this</span>
                </button>

                {/* Secondary toggle */}
                {!showSecondary ? (
                  <button
                    type="button"
                    onClick={() => setShowSecondary(true)}
                    className="w-full text-sm text-center py-2"
                    style={{ color: style.text, opacity: 0.5 }}
                  >
                    More options
                  </button>
                ) : (
                  responseOpts.secondary.map((opt) => (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => handleSecondaryReaction(opt.key)}
                      aria-label={opt.ariaLabel}
                      className="w-full rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-3 min-h-[48px]"
                      style={{
                        background: `${style.text}10`,
                        color: style.text,
                      }}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {phase === "still" && (
          <div className="h-16 flex items-center justify-center">
            <p className="text-xs" style={{ color: style.text, opacity: 0.3 }}>
              Take your time.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Closure phase
  if (phase === "closure") {
    const closureKey =
      reaction === "FELT"
        ? "FELT"
        : reaction === "WROTE_BACK"
          ? "WROTE_BACK"
          : reaction === "LET_IT_SIT"
            ? "LET_IT_SIT"
            : isSelf
              ? "SELF"
              : "FELT";
    const closureMsg = CLOSURE_MESSAGES[closureKey];

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-10 text-center"
        style={{ background: style.bg }}
      >
        <div className="animate-fade-in space-y-8">
          <span className="text-5xl">{icon}</span>
          <p
            className="font-serif text-xl leading-relaxed whitespace-pre-line"
            style={{ color: style.text }}
          >
            {closureMsg}
          </p>
          {reaction === "WROTE_BACK" ? (
            <button
              type="button"
              onClick={() => {
                onWriteBack?.();
                onClose();
              }}
              aria-label="Write a letter back"
              className="px-8 py-3.5 rounded-2xl text-sm font-semibold min-h-[48px]"
              style={{ background: style.text, color: style.bg }}
            >
              Write a letter back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="px-8 py-3 rounded-full text-sm font-medium"
              style={{ background: `${style.text}20`, color: style.text }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
