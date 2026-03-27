import { useEffect, useRef, useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import { CHECK_IN_FEEDBACK } from "../lib/emotionalFeedbackCopy";
import { getAuraColor } from "../utils/auraColors";
import { getQuietMomentMessage } from "../utils/quietMomentMessages";
import { EmotionalFeedbackOverlay } from "./EmotionalFeedbackOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuietMomentProps {
  emotion_type: string;
  emotion_label: string;
  emotion_emoji: string;
  visibility: "ONLY_ME" | "INNER_CIRCLE" | "FRIENDS" | "GLOBAL";
  onDismiss: () => void;
  onExpressVisually?: () => void;
  reduceMotion?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuietMomentScreen({
  emotion_type,
  emotion_label,
  emotion_emoji,
  visibility,
  onDismiss,
  onExpressVisually,
  reduceMotion = false,
}: QuietMomentProps) {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const rm = reduceMotion;
  const { triggerMoment } = useVeilVoice();

  // Voice System: Moment 6 — plays 1 second into Quiet Moment, only for difficult emotions
  const difficultEmotions = [
    "STRESSED",
    "SAD",
    "FRUSTRATED",
    "ANXIOUS",
    "LONELY",
    "NUMB",
  ];
  const isDifficult = difficultEmotions.includes(emotion_type.toUpperCase());
  const isDifficultRef = useRef(isDifficult);
  const triggerMomentRef = useRef(triggerMoment);
  triggerMomentRef.current = triggerMoment;

  // Emotional Feedback Overlay — shown before Quiet Moment reveals
  const emotionKey = emotion_type.toLowerCase();
  const feedbackLines =
    CHECK_IN_FEEDBACK[emotionKey] ?? CHECK_IN_FEEDBACK.custom;
  const [showFeedbackFirst, setShowFeedbackFirst] = useState(true);
  useEffect(() => {
    if (!isDifficultRef.current) return;
    const t = setTimeout(() => triggerMomentRef.current(6), 1000);
    return () => clearTimeout(t);
  }, []); // stable refs used inside effect

  const auraColor = getAuraColor(emotion_type, isDark);
  const bgOpacity = isDark ? 0.22 : 0.17;

  const message = useRef(
    getQuietMomentMessage(emotion_type, visibility),
  ).current;

  // ── Animation stage state ─────────────────────────────────────────────────
  // Each stage: false = hidden, true = visible
  const [bgVisible, setBgVisible] = useState(rm);
  const [emojiVisible, setEmojiVisible] = useState(rm);
  const [labelVisible, setLabelVisible] = useState(rm);
  const [dividerVisible, setDividerVisible] = useState(rm);
  const [primaryVisible, setPrimaryVisible] = useState(rm);
  const [secondaryVisible, setSecondaryVisible] = useState(rm);
  const [stayVisible, setStayVisible] = useState(rm);

  // Screen-level fade-out
  const [screenOut, setScreenOut] = useState(false);

  // Stay-here state
  const [stayMode, setStayMode] = useState<"stay" | "ready" | null>("stay");

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissed = useRef(false);

  const triggerDismissRef = useRef<() => void>(() => {});
  triggerDismissRef.current = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    if (rm) {
      onDismiss();
    } else {
      setScreenOut(true);
      setTimeout(onDismiss, 420);
    }
  };
  const triggerDismiss = () => triggerDismissRef.current();

  // ── Animation sequence ────────────────────────────────────────────────────
  useEffect(() => {
    if (rm) {
      // Instant — all visible, just start the dismiss timer
      const baseDelay = 5500; // give screen readers more time
      dismissTimer.current = setTimeout(
        () => triggerDismissRef.current(),
        baseDelay,
      );
      return () => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      };
    }

    // Step 1: bg
    const t1 = setTimeout(() => setBgVisible(true), 20);
    // Step 2: emoji (delay 200ms after mount)
    const t2 = setTimeout(() => setEmojiVisible(true), 220);
    // Step 3: label
    const t3 = setTimeout(() => setLabelVisible(true), 470);
    // Step 4: divider
    const t4 = setTimeout(() => setDividerVisible(true), 720);
    // Step 5: primary
    const t5 = setTimeout(() => setPrimaryVisible(true), 970);
    // Step 6: secondary
    const t6 = setTimeout(() => setSecondaryVisible(true), 1320);
    // Step 7: stay here
    const t7 = setTimeout(() => setStayVisible(true), 1670);
    // Auto-dismiss: 3500ms after secondary appears (t6 + 3500)
    dismissTimer.current = setTimeout(
      () => triggerDismissRef.current(),
      1320 + 3500,
    );

    return () => {
      [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [rm]); // rm is stable for lifetime of screen

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStayHere = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = null;
    setStayMode("ready");
  };

  const handleReady = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerDismiss();
  };

  const handleContainerClick = () => {
    triggerDismiss();
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const textColor = isDark ? "#F0F0F0" : "#3a3a4a";
  const mutedColor = isDark ? "rgba(240,240,240,0.7)" : "rgba(58,58,74,0.65)";
  const softColor = isDark ? "rgba(240,240,240,0.5)" : "rgba(58,58,74,0.5)";
  const dividerColor = isDark
    ? "rgba(240,240,240,0.15)"
    : "rgba(58,58,74,0.15)";

  const transition = (ms: number) =>
    rm ? undefined : `opacity ${ms}ms ease-out`;

  if (showFeedbackFirst) {
    return (
      <EmotionalFeedbackOverlay
        lines={feedbackLines}
        background="default"
        onDismiss={() => setShowFeedbackFirst(false)}
      />
    );
  }

  return (
    <dialog
      aria-modal="true"
      aria-label={`${emotion_label}. ${message.primary} ${message.secondary}`}
      data-ocid="quiet_moment.dialog"
      onClick={handleContainerClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleContainerClick();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: screenOut ? 0 : 1,
        transition: rm ? undefined : "opacity 400ms ease-in-out",
        cursor: "pointer",
      }}
    >
      {/* Background color layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: auraColor,
          opacity: bgVisible ? bgOpacity : 0,
          transition: transition(300),
        }}
      />
      {/* Soft white/dark base so text is always legible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: isDark ? "#1a1a2e" : "#faf9f7",
          zIndex: -1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 2rem",
          maxWidth: 480,
          width: "100%",
          gap: 0,
        }}
      >
        {/* Emoji */}
        <div
          aria-hidden="true"
          style={{
            fontSize: 72,
            lineHeight: 1,
            opacity: emojiVisible ? 1 : 0,
            transition: transition(250),
            marginBottom: 12,
          }}
        >
          {emotion_emoji}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: textColor,
            opacity: labelVisible ? 1 : 0,
            transition: transition(200),
            marginBottom: 28,
            letterSpacing: "0.01em",
          }}
        >
          {emotion_label}
        </div>

        {/* Divider */}
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 1,
            backgroundColor: dividerColor,
            opacity: dividerVisible ? 1 : 0,
            transition: transition(200),
            marginBottom: 28,
          }}
        />

        {/* Primary message */}
        <p
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: textColor,
            opacity: primaryVisible ? 1 : 0,
            transition: transition(300),
            marginBottom: 16,
            lineHeight: 1.3,
          }}
        >
          {message.primary}
        </p>

        {/* Secondary message */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 400,
            color: mutedColor,
            opacity: secondaryVisible ? 1 : 0,
            transition: transition(300),
            lineHeight: 1.7,
            maxWidth: 360,
          }}
        >
          {message.secondary}
        </p>
      </div>

      {/* Stay here / I'm ready */}
      <div
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: stayVisible ? 1 : 0,
          transition: transition(300),
        }}
      >
        {stayMode === "stay" && (
          <button
            type="button"
            aria-label="Stay on this screen"
            data-ocid="quiet_moment.button"
            onClick={handleStayHere}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: softColor,
              opacity: 0.6,
              padding: "12px 20px",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
            }}
          >
            Stay here a moment longer
          </button>
        )}
        {stayMode === "ready" && (
          <button
            type="button"
            aria-label="Continue to feed"
            data-ocid="quiet_moment.confirm_button"
            onClick={handleReady}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: softColor,
              opacity: 0.6,
              padding: "12px 20px",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
            }}
          >
            I&apos;m ready
          </button>
        )}
      </div>

      {/* Express visually entry point */}
      {onExpressVisually && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpressVisually();
          }}
          style={{
            position: "absolute",
            bottom: "5rem",
            left: 0,
            right: 0,
            textAlign: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: softColor,
            opacity: stayVisible ? 0.45 : 0,
            transition: transition(400),
            fontFamily: "inherit",
            letterSpacing: "0.04em",
            padding: "8px",
          }}
        >
          Express visually →
        </button>
      )}
    </dialog>
  );
}
