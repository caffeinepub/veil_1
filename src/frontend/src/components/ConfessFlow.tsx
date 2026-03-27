import type { Principal } from "@icp-sdk/core/principal";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import { useActor } from "../hooks/useActor";
import {
  type FeedbackBackground,
  WRITE_FEEDBACK,
} from "../lib/emotionalFeedbackCopy";
import { getConfessionScript } from "../lib/voiceScripts";
import { EmotionalFeedbackOverlay } from "./EmotionalFeedbackOverlay";

type ConfessMode = "UNIVERSE" | "PRIVATE" | "WITNESS" | null;
type ConfessScreen = "entry" | "mode_select" | "writing" | "release";

interface ConfessFlowProps {
  onClose: () => void;
  onOpenApology?: () => void;
}

const WRITING_PROMPTS = [
  "What have you never said out loud to anyone?",
  "What do you carry when no one is watching?",
  "What would you say if there were no consequences?",
  "What have you done that you have never told anyone?",
  "What do you feel that you are ashamed of feeling?",
  "What happened that only you know about?",
  "What truth about yourself have you been hiding?",
  "What do you need to release to be free?",
  "What would you confess if you knew you'd be heard?",
  "What have you been pretending about for so long you almost believe it?",
];

const UNIVERSE_RELEASE_TEXTS = [
  "It is released.\nInto something\ngreater than this moment.",
  "You said it.\nAfter all this time —\nyou finally said it.\n\nThat is everything.",
  "The universe received it.\n\nYou are lighter now.",
  "It exists now\noutside of you.\n\nThat is what you needed.",
  "You carried it long enough.\n\nIt belongs to the universe now.\nNot to you.",
];

const PRIVATE_RELEASE_TEXTS = [
  "It is safe here.\n\nNamed.\nHeld.\nPrivate.\n\nAlways.",
  "You said it to yourself.\n\nThat is braver than\nmost people ever get.",
  "It has a name now.\n\nNaming something\ntakes away some of its power.",
  "This is between you and Veil.\n\nNo one else.\nNo one ever.",
  "You trusted yourself\nwith your own truth.\n\nThat is not nothing.",
];

const WITNESS_RELEASE_TEXTS = [
  "Someone is holding this\nwith you right now.\n\nThey don't know who you are.\nBut they know you were brave.",
  "You let one person\ninto this.\n\nNot to judge.\nJust to witness.\n\nThat is what courage looks like.",
  "A witness received this.\n\nThey will hold it quietly.\n\nYou are not alone\nin carrying this anymore.",
];

const CRISIS_KEYWORDS = [
  "kill myself",
  "end my life",
  "suicide",
  "want to die",
  "don't want to live",
  "hurt myself",
  "self harm",
  "cut myself",
  "no reason to live",
  "can't go on",
  "hopeless",
  "worthless",
  "nobody cares",
  "better off dead",
];

// Stable particle data generated once per render to avoid noArrayIndexKey issues
const STAR_PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: `star-${i}`,
  width: `${(((i * 7) % 20) / 10 + 1).toFixed(1)}px`,
  height: `${(((i * 7) % 20) / 10 + 1).toFixed(1)}px`,
  left: `${(i * 3.33) % 100}%`,
  top: `${(i * 7.77) % 100}%`,
  opacity: ((i % 6) / 20 + 0.05).toFixed(2),
  duration: `${((i % 30) / 10 + 2).toFixed(1)}s`,
  delay: `${((i % 30) / 10).toFixed(1)}s`,
}));

const RELEASE_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: `particle-${i}`,
  width: `${(((i * 5) % 40) / 10 + 2).toFixed(1)}px`,
  height: `${(((i * 5) % 40) / 10 + 2).toFixed(1)}px`,
  left: `${40 + ((i * 3.7) % 20)}%`,
  top: `${40 + ((i * 2.3) % 20)}%`,
  hue: `${260 + (i % 10) * 4}`,
  lum: `${(0.7 + (i % 3) * 0.1).toFixed(2)}`,
  duration: `${(2 + (i % 30) / 10).toFixed(1)}s`,
  delay: `${((i * 2.5) % 20) / 10}s`,
  tx: `${(i % 2 === 0 ? 1 : -1) * ((i * 23) % 200)}px`,
  ty: `${-(((i * 17) % 150) + 50)}px`,
}));

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function renderLines(text: string) {
  return text.split("\n").map((line, i, arr) => {
    const key = `line-${i}-${line.slice(0, 8)}`;
    return (
      <span key={key}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

export function ConfessFlow({ onClose, onOpenApology }: ConfessFlowProps) {
  const { actor } = useActor();
  const { triggerMoment } = useVeilVoice();

  const [screen, setScreen] = useState<ConfessScreen>("entry");
  const [mode, setMode] = useState<ConfessMode>(null);
  const [content, setContent] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [showPromptText, setShowPromptText] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisShown, setCrisisShown] = useState(false);
  const [releaseText, setReleaseText] = useState("");
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voiceScript, setVoiceScript] = useState<string | null>(null);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [apologyBridgeShown, setApologyBridgeShown] = useState(false);
  const [feedbackOverlay, setFeedbackOverlay] = useState<{
    lines: string[];
    background: FeedbackBackground;
  } | null>(null);
  const [entryReady, setEntryReady] = useState(false);

  const crisisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (screen === "entry") {
      const t = setTimeout(() => setEntryReady(true), 4000);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const handleContentChange = useCallback(
    (val: string) => {
      setContent(val);
      if (crisisTimerRef.current) clearTimeout(crisisTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (detectCrisis(val) && !crisisShown) {
          crisisTimerRef.current = setTimeout(() => {
            setCrisisDetected(true);
            setCrisisShown(true);
          }, 5000);
        }
      }, 300);
    },
    [crisisShown],
  );

  const getModeAtmosphere = () => {
    if (mode === "UNIVERSE")
      return { bg: "#0f0d1e", star: true, label: "The universe is listening." };
    if (mode === "PRIVATE")
      return {
        bg: "#0a0a0a",
        star: false,
        label: "This is just between you and Veil.",
      };
    return {
      bg: "#0d1117",
      star: false,
      label: "One person will receive this — they will never know it's you.",
    };
  };

  const getSubmitLabel = () => {
    if (mode === "UNIVERSE") return "Release this";
    if (mode === "PRIVATE") return "Keep this safely";
    return "Send this to my witness";
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitted) return;
    setSubmitted(true);

    const texts =
      mode === "UNIVERSE"
        ? UNIVERSE_RELEASE_TEXTS
        : mode === "PRIVATE"
          ? PRIVATE_RELEASE_TEXTS
          : WITNESS_RELEASE_TEXTS;
    setReleaseText(texts[Math.floor(Math.random() * texts.length)]);

    const momentKey =
      mode === "UNIVERSE" ? "cf_a" : mode === "PRIVATE" ? "cf_b" : "cf_c";
    const script = getConfessionScript(momentKey as "cf_a" | "cf_b" | "cf_c");
    setVoiceScript(script.text);

    try {
      if (actor) {
        // Cast to extended type since backend.ts is auto-generated
        const extActor = actor as typeof actor & {
          createConfession: (
            mode: string,
            content: string,
            wordCount: bigint,
            hadVoiceComponent: boolean,
            witnessUserId: [] | [Principal],
            crisisSignalDetected: boolean,
            crisisResourcesShown: boolean,
          ) => Promise<string>;
        };
        await extActor.createConfession(
          mode ?? "PRIVATE",
          content.trim(),
          BigInt(content.trim().split(/\s+/).filter(Boolean).length),
          false,
          [],
          crisisDetected,
          crisisShown,
        );
      }
    } catch (_) {
      // fail silently — ritual still completes
    }

    setScreen("release");
    setTimeout(() => setParticlesVisible(true), 200);
    setTimeout(() => setVoiceVisible(true), 1500);
    setTimeout(() => setApologyBridgeShown(true), 8000);
    triggerMoment(momentKey as "cf_a" | "cf_b" | "cf_c");

    // Show emotional feedback overlay immediately
    const feedbackLines =
      mode === "UNIVERSE"
        ? WRITE_FEEDBACK.confession_universe
        : mode === "PRIVATE"
          ? WRITE_FEEDBACK.confession_private
          : WRITE_FEEDBACK.confession_witness;
    setTimeout(() => {
      setFeedbackOverlay({ lines: feedbackLines, background: "dark" });
    }, 600);
  };

  // ── ENTRY SCREEN ────────────────────────────────────────────────────────────
  if (screen === "entry") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: "#1a1535" }}
        aria-label="Confess — safe space"
      >
        <div
          className="flex flex-col items-center gap-6 px-8 text-center"
          style={{
            animation: prefersReducedMotion ? "none" : "fadeIn 0.8s ease",
          }}
        >
          <div className="text-5xl">🕊</div>
          <p className="text-white/90 text-xl font-serif leading-relaxed">
            This is a safe place.
          </p>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Whatever you have been carrying —<br />
            you can put it down here.
          </p>
          <p className="text-white/40 text-xs leading-relaxed max-w-xs">
            No judgment.
            <br />
            No audience.
            <br />
            Just you — and the act of saying it.
          </p>
          {entryReady ? (
            <button
              type="button"
              onClick={() => setScreen("mode_select")}
              className="mt-4 px-8 py-3 rounded-full text-white/70 text-sm border border-white/20 hover:border-white/40 transition-all"
              style={{ minHeight: "48px" }}
              aria-label="Continue to choose how to confess"
              data-ocid="confess.entry.button"
            >
              I'm ready
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEntryReady(true);
                setTimeout(() => setScreen("mode_select"), 50);
              }}
              className="mt-4 px-8 py-3 rounded-full text-white/30 text-xs"
              aria-label="Skip to mode selection"
            >
              Tap to continue
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-12 left-6 text-white/30 text-sm"
          aria-label="Close confess"
          data-ocid="confess.close.button"
        >
          ✕
        </button>
      </div>
    );
  }

  // ── MODE SELECT ─────────────────────────────────────────────────────────────
  if (screen === "mode_select") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "#1a1535" }}
        aria-label="Choose how to confess"
      >
        <div className="flex items-center px-6 pt-12 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 text-sm mr-auto"
            aria-label="Close confess"
            data-ocid="confess.close.button"
          >
            ← Back
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-6 pb-12 gap-4">
          <p className="text-white/50 text-xs text-center mb-4 uppercase tracking-widest">
            What would you like to do?
          </p>
          <button
            type="button"
            aria-label="Button: Say it to the Universe"
            data-ocid="confess.universe.button"
            onClick={() => {
              setMode("UNIVERSE");
              setScreen("writing");
            }}
            className="w-full rounded-2xl p-5 text-left border border-white/10 hover:border-white/30 transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.04)", minHeight: "72px" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🌌</span>
              <div>
                <div className="text-white/90 font-serif text-sm font-semibold mb-1">
                  Say it to the Universe
                </div>
                <div className="text-white/40 text-xs leading-relaxed">
                  Release it into something greater than yourself. No one will
                  ever see this.
                </div>
              </div>
            </div>
          </button>
          <button
            type="button"
            aria-label="Button: Keep it between you and Veil"
            data-ocid="confess.private.button"
            onClick={() => {
              setMode("PRIVATE");
              setScreen("writing");
            }}
            className="w-full rounded-2xl p-5 text-left border border-white/10 hover:border-white/30 transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.04)", minHeight: "72px" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔒</span>
              <div>
                <div className="text-white/90 font-serif text-sm font-semibold mb-1">
                  Keep it between you and Veil
                </div>
                <div className="text-white/40 text-xs leading-relaxed">
                  Written. Held. Private. Sometimes naming it is enough.
                </div>
              </div>
            </div>
          </button>
          <button
            type="button"
            aria-label="Button: Share with one trusted witness"
            data-ocid="confess.witness.button"
            onClick={() => {
              setMode("WITNESS");
              setScreen("writing");
            }}
            className="w-full rounded-2xl p-5 text-left border border-white/10 hover:border-white/30 transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.04)", minHeight: "72px" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🤍</span>
              <div>
                <div className="text-white/90 font-serif text-sm font-semibold mb-1">
                  Share with one trusted witness
                </div>
                <div className="text-white/40 text-xs leading-relaxed">
                  Anonymous. One person. No words back. Just presence.
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── WRITING SCREEN ───────────────────────────────────────────────────────────
  if (screen === "writing") {
    const atm = getModeAtmosphere();
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: atm.bg }}
        aria-label="Write your confession"
      >
        {atm.star && !prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {STAR_PARTICLES.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full bg-white"
                style={{
                  width: p.width,
                  height: p.height,
                  left: p.left,
                  top: p.top,
                  opacity: Number(p.opacity),
                  animation: `twinkle ${p.duration} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 px-6 pt-14 pb-2">
          <button
            type="button"
            onClick={() => setScreen("mode_select")}
            className="text-white/25 text-xs mb-3 block"
            aria-label="Go back to mode selection"
          >
            ← Change
          </button>
          <p className="text-white/30 text-xs text-center leading-relaxed">
            {atm.label}
          </p>
        </div>

        <div className="relative z-10 flex-1 px-6">
          <textarea
            className="w-full h-full bg-transparent text-white/85 text-base leading-relaxed resize-none outline-none placeholder-white/20 font-sans"
            style={{ minHeight: "50vh", fontSize: "16px" }}
            placeholder="Say everything."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            aria-label="Write your confession"
            data-ocid="confess.writing.textarea"
            // biome-ignore lint/a11y/noAutofocus: intentional for sacred writing experience
            autoFocus
          />
        </div>

        {crisisDetected && (
          <div
            className="relative z-10 mx-6 mb-4 rounded-2xl p-4 text-sm"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            role="alert"
            data-ocid="confess.crisis.card"
          >
            <p className="text-white/70 leading-relaxed mb-3">
              Veil hears how heavy this is.
              <br />
              What you are carrying sounds very hard.
              <br />
              You do not have to face this alone.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a
                href="tel:9152987821"
                className="text-white/50 text-xs underline"
                aria-label="iCall India crisis line: 9152987821"
              >
                iCall India: 9152987821
              </a>
              <a
                href="tel:18002662345"
                className="text-white/50 text-xs underline"
                aria-label="Vandrevala Foundation crisis line"
              >
                Vandrevala: 1860-2662-345
              </a>
              <a
                href="sms:741741&body=HOME"
                className="text-white/50 text-xs underline"
                aria-label="Crisis Text Line: text HOME to 741741"
              >
                Text HOME to 741741
              </a>
            </div>
            <button
              type="button"
              className="mt-3 text-white/40 text-xs"
              onClick={() => setCrisisDetected(false)}
              aria-label="Keep writing"
              style={{ minHeight: "44px" }}
            >
              Keep writing →
            </button>
          </div>
        )}

        <div className="relative z-10 px-6 pb-2 text-right">
          {showPromptText ? (
            <div className="text-left">
              <p className="text-white/30 text-xs leading-relaxed mb-2 italic">
                {WRITING_PROMPTS[promptIndex % WRITING_PROMPTS.length]}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-white/40 text-xs underline"
                  onClick={() => {
                    const prompt =
                      WRITING_PROMPTS[promptIndex % WRITING_PROMPTS.length];
                    setContent((prev) =>
                      prev ? `${prev}\n\n${prompt}` : prompt,
                    );
                    setPromptIndex((i) => i + 1);
                    setShowPromptText(false);
                  }}
                  aria-label="Use this prompt"
                >
                  Use this
                </button>
                <button
                  type="button"
                  className="text-white/25 text-xs"
                  onClick={() => setPromptIndex((i) => i + 1)}
                  aria-label="Try another prompt"
                >
                  Try another
                </button>
                <button
                  type="button"
                  className="text-white/20 text-xs"
                  onClick={() => setShowPromptText(false)}
                  aria-label="Close prompts"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-white/20 text-xs"
              onClick={() => setShowPromptText(true)}
              aria-label="Get a prompt to help start writing"
            >
              I don't know how to start
            </button>
          )}
        </div>

        <div className="relative z-10 px-6 pb-10 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || submitted}
            className="w-full py-4 rounded-full text-white/80 text-sm font-medium border border-white/20 hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ minHeight: "52px" }}
            aria-label={getSubmitLabel()}
            data-ocid="confess.writing.submit_button"
          >
            {getSubmitLabel()}
          </button>
        </div>
      </div>
    );
  }

  // ── RELEASE SCREEN ──────────────────────────────────────────────────────────
  if (screen === "release") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: "#1a1535" }}
        aria-label="Your confession has been released"
      >
        {!prefersReducedMotion && particlesVisible && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {RELEASE_PARTICLES.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full"
                style={
                  {
                    width: p.width,
                    height: p.height,
                    left: p.left,
                    top: p.top,
                    background: `oklch(${p.lum} 0.05 ${p.hue})`,
                    opacity: 0,
                    animation: `particleRelease ${p.duration} ease-out forwards`,
                    animationDelay: p.delay,
                    "--tx": p.tx,
                    "--ty": p.ty,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center max-w-sm">
          {voiceVisible && voiceScript && (
            <p
              className="text-white/55 text-sm leading-relaxed"
              style={{
                animation: prefersReducedMotion ? "none" : "fadeIn 1s ease",
              }}
              aria-live="polite"
            >
              {renderLines(voiceScript)}
            </p>
          )}

          {releaseText && (
            <p
              className="text-white/85 font-serif text-lg leading-relaxed"
              style={{
                animation: prefersReducedMotion
                  ? "none"
                  : "fadeIn 1.5s ease 0.5s both",
              }}
            >
              {renderLines(releaseText)}
            </p>
          )}

          {apologyBridgeShown && (
            <div
              className="w-full mt-4 rounded-2xl p-4 text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                animation: prefersReducedMotion ? "none" : "fadeIn 0.8s ease",
              }}
              data-ocid="confess.apology_bridge.card"
            >
              <p className="text-white/40 text-xs leading-relaxed mb-3">
                Sometimes a confession becomes an apology.
                <br />
                Would you like to write to the person this involves?
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {onOpenApology && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-white/60 text-xs border border-white/15 hover:border-white/30 transition-all"
                    style={{ minHeight: "48px" }}
                    aria-label="Write an apology"
                    data-ocid="confess.apology_bridge.button"
                    onClick={() => {
                      onClose();
                      onOpenApology();
                    }}
                  >
                    Write an apology
                  </button>
                )}
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-white/40 text-xs border border-white/10 hover:border-white/20 transition-all"
                  style={{ minHeight: "48px" }}
                  aria-label="No, this was enough"
                  data-ocid="confess.release.close.button"
                  onClick={onClose}
                >
                  No — this was enough
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="mt-4 px-8 py-3 rounded-full text-white/40 text-sm border border-white/10 hover:border-white/20 transition-all"
            style={{ minHeight: "48px" }}
            aria-label="I am ready to go"
            data-ocid="confess.release.button"
            onClick={onClose}
          >
            I am ready to go
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {feedbackOverlay && (
        <EmotionalFeedbackOverlay
          lines={feedbackOverlay.lines}
          background={feedbackOverlay.background}
          onDismiss={() => setFeedbackOverlay(null)}
        />
      )}
    </>
  );
}
