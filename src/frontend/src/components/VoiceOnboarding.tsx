import { useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";

export function VoiceOnboarding() {
  const { onboardingNeeded, completeOnboarding } = useVeilVoice();
  const [visible, setVisible] = useState(true);
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  if (!onboardingNeeded || !visible) return null;

  const handleYes = () => {
    completeOnboarding(true);
    setVisible(false);
  };

  const handleLater = () => {
    completeOnboarding(false);
    setVisible(false);
  };

  return (
    <dialog
      aria-modal="true"
      aria-labelledby="voice-onboarding-title"
      aria-describedby="voice-onboarding-desc"
      data-ocid="voice_onboarding.dialog"
      open
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 1rem 2rem",
        border: "none",
        background: "none",
        width: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={handleLater}
        onKeyDown={() => {}}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(45, 37, 64, 0.35)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "#faf9f7",
          borderRadius: 28,
          padding: "32px 28px 28px",
          width: "100%",
          maxWidth: 420,
          boxShadow:
            "0 -4px 40px rgba(107, 91, 142, 0.18), 0 0 0 1px rgba(201, 184, 232, 0.2)",
          opacity: reduceMotion ? 1 : undefined,
          animation: reduceMotion
            ? undefined
            : "voiceOnboardingSlide 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <style>{`
          @keyframes voiceOnboardingSlide {
            from { transform: translateY(24px); opacity: 0; }
            to   { transform: translateY(0);   opacity: 1; }
          }
        `}</style>

        {/* Icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C9B8E8 0%, #F2B5C5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            marginBottom: 20,
          }}
          aria-hidden="true"
        >
          🩹
        </div>

        <h2
          id="voice-onboarding-title"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "oklch(0.25 0.06 295)",
            marginBottom: 12,
            lineHeight: 1.3,
            fontFamily: "inherit",
          }}
        >
          Veil can speak to you
        </h2>

        <p
          id="voice-onboarding-desc"
          style={{
            fontSize: 15,
            color: "oklch(0.45 0.04 295)",
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          After you share an emotion, Veil can respond with a warm, calm voice —
          to let you know it was received.
          <br />
          <br />
          Not an assistant. Not a chatbot. A companion.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            data-ocid="voice_onboarding.yes_button"
            onClick={handleYes}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              color: "white",
              background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
              fontFamily: "inherit",
              minHeight: 52,
            }}
          >
            Yes — turn on Veil&apos;s voice
          </button>

          <button
            type="button"
            data-ocid="voice_onboarding.later_button"
            onClick={handleLater}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              color: "oklch(0.55 0.06 295)",
              background: "rgba(201, 184, 232, 0.2)",
              fontFamily: "inherit",
              minHeight: 48,
            }}
          >
            Maybe later
          </button>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "oklch(0.65 0.03 295)",
            marginTop: 16,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          You can change this anytime in Profile → Veil Voice settings.
        </p>
      </div>
    </dialog>
  );
}
