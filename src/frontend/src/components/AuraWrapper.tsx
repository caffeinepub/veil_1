import { useEffect, useRef, useState } from "react";
import { getAuraColor, getAuraOpacity } from "../utils/auraColors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuraWrapperProps {
  emotion_type: string;
  is_own_post: boolean;
  is_anonymous: boolean;
  color_mode: "light" | "dark";
  reduce_motion: boolean;
  high_contrast: boolean;
  onReactionPulse?: (trigger: () => void) => void;
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuraWrapper({
  emotion_type,
  is_own_post,
  color_mode,
  reduce_motion,
  high_contrast,
  onReactionPulse,
  children,
}: AuraWrapperProps) {
  const isDark = color_mode === "dark";
  const auraColor = getAuraColor(emotion_type, isDark);
  const targetOpacity = getAuraOpacity(emotion_type, isDark, is_own_post);

  const [currentOpacity, setCurrentOpacity] = useState(
    reduce_motion ? targetOpacity : 0,
  );
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  // Entry fade-in
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (reduce_motion) {
      setCurrentOpacity(targetOpacity);
      return;
    }
    // Tiny delay so the DOM paints before we start the transition
    const raf = requestAnimationFrame(() => {
      setCurrentOpacity(targetOpacity);
    });
    return () => cancelAnimationFrame(raf);
  }, [targetOpacity, reduce_motion]);

  // Expose pulse trigger to parent
  useEffect(() => {
    if (!onReactionPulse) return;
    const trigger = () => {
      if (reduce_motion) return;
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      setCurrentOpacity(targetOpacity + 0.03);
      pulseTimeoutRef.current = setTimeout(() => {
        setCurrentOpacity(targetOpacity);
      }, 400);
    };
    onReactionPulse(trigger);
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, [onReactionPulse, targetOpacity, reduce_motion]);

  // High contrast — render children with zero visual enhancement
  if (high_contrast) {
    return <div>{children}</div>;
  }

  // Build the radial gradient background string
  const hexToRgba = (hex: string, opacity: number) => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const auraRgba = hexToRgba(auraColor, currentOpacity);
  const auraBackground = `radial-gradient(ellipse at center, ${auraRgba} 0%, transparent 70%)`;

  return (
    <div style={{ position: "relative", borderRadius: "16px" }}>
      {/* Aura glow layer — sits behind the card */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-14px",
          borderRadius: "22px",
          background: auraBackground,
          pointerEvents: "none",
          userSelect: "none",
          transition: reduce_motion
            ? "none"
            : "opacity 300ms ease-out, background 300ms ease-out",
          zIndex: 0,
        }}
      />
      {/* Card sits on top */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
