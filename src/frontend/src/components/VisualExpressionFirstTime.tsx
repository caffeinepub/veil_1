import { useEffect, useState } from "react";

interface Props {
  auraColor: string;
  onReady: () => void;
}

export function VisualExpressionFirstTime({ auraColor, onReady }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onReady, 600);
    }, 3000);
    return () => clearTimeout(t);
  }, [onReady]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onReady, 400);
  }

  return (
    <button
      type="button"
      onClick={handleDismiss}
      aria-label="Touch to begin your visual expression"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: auraColor,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease-out",
        cursor: "pointer",
        border: "none",
        width: "100%",
        height: "100%",
        padding: 0,
      }}
    >
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "clamp(18px, 4vw, 24px)",
          color: "rgba(20,20,30,0.75)",
          textAlign: "center",
          lineHeight: 1.7,
          maxWidth: 320,
          padding: "0 2rem",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease-out",
          letterSpacing: "0.01em",
          pointerEvents: "none",
        }}
      >
        You don&apos;t have to find the words.
        <br />
        Just touch the screen
        <br />
        and let it feel.
      </p>
    </button>
  );
}
