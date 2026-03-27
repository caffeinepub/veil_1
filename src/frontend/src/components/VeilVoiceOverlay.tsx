import { useEffect, useRef, useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";

// Soft pulsing dot that indicates voice is playing
function VoiceDot({ playing }: { playing: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "oklch(0.55 0.12 295)",
        opacity: playing ? 1 : 0.4,
        animation: playing
          ? "veilVoicePulse 1.8s ease-in-out infinite"
          : "none",
        flexShrink: 0,
      }}
    />
  );
}

// Split transcript text on \n to render each line
function TranscriptLines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable order
        <span key={i} style={{ display: "block", lineHeight: 1.65 }}>
          {line}
        </span>
      ))}
    </>
  );
}

export function VeilVoiceOverlay() {
  const { activeMoment, dismissMoment } = useVeilVoice();
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const prevMomentRef = useRef<string | null>(null);
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (!activeMoment) {
      // Fade out
      if (visible) {
        if (reduceMotion) {
          setVisible(false);
          setTextVisible(false);
        } else {
          setTextVisible(false);
          const t = setTimeout(() => setVisible(false), 350);
          return () => clearTimeout(t);
        }
      }
      return;
    }

    // New moment — fade in
    const isNew = activeMoment.script.id !== prevMomentRef.current;
    prevMomentRef.current = activeMoment.script.id;

    if (isNew) {
      setTextVisible(false);
      if (reduceMotion) {
        setVisible(true);
        setTextVisible(true);
      } else {
        setVisible(true);
        const t = setTimeout(() => setTextVisible(true), 120);
        return () => clearTimeout(t);
      }
    }
  }, [activeMoment, visible, reduceMotion]);

  if (!visible && !activeMoment) return null;

  const script = activeMoment?.script;

  return (
    <>
      {/* Pulse animation keyframes injected once */}
      <style>{`
        @keyframes veilVoicePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      {/* Overlay container — fixed bottom, above bottom nav */}
      <div
        aria-live="polite"
        aria-atomic="true"
        aria-label={
          script ? `Veil says: ${script.text.replace(/\n/g, " ")}` : ""
        }
        data-ocid="veil_voice.overlay"
        style={{
          position: "fixed",
          bottom: "calc(5rem + env(safe-area-inset-bottom, 0px) + 12px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 60,
          width: "calc(100% - 2rem)",
          maxWidth: 400,
          opacity: visible ? 1 : 0,
          transition: reduceMotion ? undefined : "opacity 300ms ease-out",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            background: "rgba(250, 249, 247, 0.97)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 20,
            padding: "16px 20px",
            boxShadow:
              "0 4px 32px rgba(107, 91, 142, 0.14), 0 1px 8px rgba(107, 91, 142, 0.08)",
            border: "1px solid rgba(201, 184, 232, 0.3)",
          }}
        >
          {/* Header row: voice indicator + Veil label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <VoiceDot playing={!!activeMoment} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "oklch(0.55 0.08 295)",
                textTransform: "uppercase",
              }}
            >
              Veil
            </span>
            {/* Dismiss button — accessible tap target */}
            <button
              type="button"
              aria-label="Dismiss Veil's voice"
              onClick={dismissMoment}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: 13,
                color: "oklch(0.65 0.04 295)",
                lineHeight: 1,
                minWidth: 44,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              ✕
            </button>
          </div>

          {/* Transcript */}
          <p
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: "oklch(0.3 0.04 295)",
              lineHeight: 1.65,
              margin: 0,
              opacity: textVisible ? 1 : 0,
              transition: reduceMotion ? undefined : "opacity 280ms ease-out",
              fontStyle: "italic",
            }}
          >
            {script ? <TranscriptLines text={script.text} /> : null}
          </p>
        </div>
      </div>
    </>
  );
}
