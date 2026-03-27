import { useCallback, useEffect, useRef, useState } from "react";
import { getEmotionShape } from "../lib/emotionShapes";
import { renderShapePath } from "../lib/shapeRenderers";
import {
  generateAISnapshot,
  getAISnapshotConsent,
  saveVisualEntry,
  setAISnapshotConsent,
} from "../lib/visualExpressionState";
import { AISnapshotOptIn } from "./AISnapshotOptIn";
import { VisualExpressionFirstTime } from "./VisualExpressionFirstTime";
import { VisualSnapshotResult } from "./VisualSnapshotResult";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasShape {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  createdAt: number;
  intensity: number; // 1–3 from long press
  phase: number; // for animation offset
}

interface Props {
  emotionType: string;
  emotionLabel: string;
  isFirstTime: boolean;
  onClose: () => void;
  onSaved?: (entryId: string) => void;
  reduceMotion?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SHAPES = 50;
const LONG_PRESS_MS = 500;
const ENERGY_DECAY = 0.92;

// ─── Component ────────────────────────────────────────────────────────────────

export function VisualExpressionCanvas({
  emotionType,
  emotionLabel,
  isFirstTime,
  onClose,
  onSaved,
  reduceMotion = false,
}: Props) {
  const config = getEmotionShape(emotionType);
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [energyLevel, setEnergyLevel] = useState(0); // 0–100
  const [showFirstTime, setShowFirstTime] = useState(isFirstTime);
  const [showAIOptIn, setShowAIOptIn] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [savedEntry, setSavedEntry] = useState<{
    id: string;
    ai_snapshot?: string;
  } | null>(null);
  const [savedShapes, setSavedShapes] = useState<CanvasShape[]>([]);

  const energyRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragTargetRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const canvasW = useRef(
    typeof window !== "undefined" ? window.innerWidth : 390,
  ).current;
  const canvasH = useRef(
    typeof window !== "undefined" ? window.innerHeight : 844,
  ).current;

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion || showFirstTime || showAIOptIn || showResult) return;
    let lastTime = 0;

    function animate(time: number) {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      energyRef.current = Math.max(0, energyRef.current * ENERGY_DECAY);
      setEnergyLevel(Math.round(energyRef.current));

      const motionType = config.motionType;
      const centerX = canvasW / 2;
      const centerY = canvasH / 2;

      setShapes((prev) =>
        prev
          .map((s, idx) => {
            const age = (time - s.createdAt) / 1000;
            const energy = energyRef.current / 100;
            let dy = 0;
            let dx = 0;
            let dr = 0;
            const sp = 1;

            switch (motionType) {
              case "drift-down":
                dy = sp * dt * (8 + energy * 4);
                break;
              case "pulse": {
                const pulse =
                  Math.sin(age * 1.2 + s.phase) * 0.04 * (1 + energy);
                return {
                  ...s,
                  size: Math.max(4, s.size + pulse * s.size * dt * 4),
                };
              }
              case "tremor":
                dx =
                  Math.sin(age * 23 + s.phase * 7) *
                  sp *
                  dt *
                  (10 + energy * 12);
                dy =
                  Math.cos(age * 17 + s.phase * 5) *
                  sp *
                  dt *
                  (10 + energy * 12);
                break;
              case "push-out": {
                const angle = Math.atan2(s.y - centerY, s.x - centerX);
                dx = Math.cos(angle) * sp * dt * (3 + energy * 5);
                dy = Math.sin(angle) * sp * dt * (3 + energy * 5);
                break;
              }
              case "rotate":
                dr = sp * dt * (12 + energy * 18);
                break;
              case "rise":
                dy = -sp * dt * (5 + energy * 3);
                break;
              case "radiate": {
                const angle2 = Math.atan2(s.y - centerY, s.x - centerX);
                dx = Math.cos(angle2) * sp * dt * (2 + energy * 3);
                dy = Math.sin(angle2) * sp * dt * (2 + energy * 3);
                break;
              }
              case "wave":
                dx = Math.sin(age * 0.8 + s.phase) * sp * dt * (5 + energy * 4);
                break;
              case "drift-separate": {
                const angle3 = s.phase * Math.PI * 2;
                dx = Math.cos(angle3) * sp * dt * (2 + energy * 2);
                dy = Math.sin(angle3) * sp * dt * (1 + energy * 1.5);
                break;
              }
              default:
                dx = Math.sin(age * 0.5 + s.phase) * sp * dt * 2;
                dy = Math.cos(age * 0.4 + s.phase * 0.7) * sp * dt * 2;
            }

            // Fade oldest shapes near cap
            const fadeOpacity =
              idx < 5 && prev.length >= MAX_SHAPES - 5
                ? s.opacity * 0.995
                : s.opacity;

            return {
              ...s,
              x: s.x + dx,
              y: s.y + dy,
              rotation: s.rotation + dr,
              opacity: Math.max(0, fadeOpacity),
            };
          })
          .filter((s) => s.opacity > 0.02),
      );

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [
    config.motionType,
    canvasW,
    canvasH,
    reduceMotion,
    showFirstTime,
    showAIOptIn,
    showResult,
  ]);

  // ── Add shape ───────────────────────────────────────────────────────────────
  function addShape(x: number, y: number, intensityMult = 1) {
    const energy = energyRef.current / 100;
    const newShape: CanvasShape = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x,
      y,
      size: config.sizeBase * (0.75 + energy * 0.6) * intensityMult,
      opacity: 0.65 + energy * 0.3,
      rotation: Math.random() * 360,
      createdAt: performance.now(),
      intensity: intensityMult,
      phase: Math.random(),
    };

    const now = Date.now();
    tapTimesRef.current = [
      ...tapTimesRef.current.filter((t) => now - t < 2000),
      now,
    ];
    const tapRate = tapTimesRef.current.length;
    energyRef.current = Math.min(100, energyRef.current + tapRate * 9);

    setShapes((prev) => {
      const next = [...prev, newShape];
      return next.length > MAX_SHAPES ? next.slice(-MAX_SHAPES) : next;
    });
  }

  const getCanvasXY = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const rect = svg.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  // ── Pointer events ─────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getCanvasXY(e.clientX, e.clientY);
    addShape(x, y);

    dragTargetRef.current = null; // will be set after state update
    dragStartRef.current = { x, y };

    // Long press: intensify last shape
    longPressTimerRef.current = setTimeout(() => {
      setShapes((prev) => {
        if (prev.length === 0) return prev;
        const lastId = prev[prev.length - 1].id;
        dragTargetRef.current = lastId;
        return prev.map((s) =>
          s.id === lastId
            ? {
                ...s,
                size: s.size * 1.65,
                opacity: Math.min(1, s.opacity * 1.3),
                intensity: 3,
              }
            : s,
        );
      });
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStartRef.current) return;
    const { x, y } = getCanvasXY(e.clientX, e.clientY);
    const dx = x - dragStartRef.current.x;
    const dy = y - dragStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 3) return;
    dragStartRef.current = { x, y };

    setShapes((prev) => {
      if (prev.length === 0) return prev;
      // Drag distorts the most recently touched shape
      const targetId = dragTargetRef.current ?? prev[prev.length - 1].id;
      return prev.map((s) => {
        if (s.id !== targetId) return s;
        return {
          ...s,
          x: s.x + dx * 0.35,
          y: s.y + dy * 0.35,
          size: Math.min(s.size * (1 + dist * 0.01), config.sizeBase * 3.5),
          rotation: s.rotation + dx * 0.4,
        };
      });
    });
  }

  function handlePointerUp() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    dragStartRef.current = null;
  }

  // ── Save flow ───────────────────────────────────────────────────────────────

  function handleSave() {
    const consent = getAISnapshotConsent();
    if (consent === null) {
      setShowAIOptIn(true);
      return;
    }
    doSave(consent === "yes");
  }

  function handleAIConsentDecision(yes: boolean) {
    setAISnapshotConsent(yes ? "yes" : "no");
    setShowAIOptIn(false);
    doSave(yes);
  }

  function doSave(withAI: boolean) {
    const intensity = Math.max(
      1,
      Math.min(10, Math.round(1 + (shapes.length / MAX_SHAPES) * 9)),
    );
    const energy = Math.round(energyRef.current);
    const aiSnapshot = withAI
      ? generateAISnapshot(emotionType, intensity, energy, config.color)
      : undefined;

    const entryId = `visual-${Date.now()}`;
    saveVisualEntry({
      id: entryId,
      emotion_type: emotionType,
      emotion_label: emotionLabel,
      aura_color: config.color,
      canvas_data: JSON.stringify(
        shapes.map((s) => ({
          x: s.x,
          y: s.y,
          size: s.size,
          rotation: s.rotation,
        })),
      ),
      ai_snapshot_svg: aiSnapshot,
      interaction_energy: energy,
      intensity,
      created_at: new Date().toISOString(),
    });

    setSavedEntry({ id: entryId, ai_snapshot: aiSnapshot });
    setSavedShapes([...shapes]);
    setShowResult(true);
    onSaved?.(entryId);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (showResult && savedEntry) {
    return (
      <VisualSnapshotResult
        emotionType={emotionType}
        emotionLabel={emotionLabel}
        auraColor={config.color}
        bgDark={config.bgDark}
        canvasShapes={savedShapes}
        canvasShapeType={config.shapeType}
        aiSnapshotSvg={savedEntry.ai_snapshot}
        onDone={onClose}
      />
    );
  }

  if (showAIOptIn) {
    return (
      <AISnapshotOptIn
        onAccept={() => handleAIConsentDecision(true)}
        onDecline={() => handleAIConsentDecision(false)}
      />
    );
  }

  if (showFirstTime) {
    return (
      <VisualExpressionFirstTime
        auraColor={config.color}
        onReady={() => setShowFirstTime(false)}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: config.bgDark,
        touchAction: "none",
      }}
      aria-label={`Visual expression canvas. ${emotionLabel} shapes present. Tap to create. Drag to change.`}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close canvas"
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          background: "none",
          border: "none",
          color: `${config.color}55`,
          fontSize: 13,
          fontFamily: "inherit",
          cursor: "pointer",
          padding: "8px 12px",
          letterSpacing: "0.04em",
        }}
      >
        ← back
      </button>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        role="img"
        aria-label={`${emotionLabel} expression canvas`}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
        }}
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <radialGradient id="ve-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={config.color} stopOpacity="0.07" />
            <stop offset="100%" stopColor={config.color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={canvasW} height={canvasH} fill="url(#ve-glow)" />

        {/* Energy ring */}
        {energyLevel > 20 && (
          <circle
            cx={canvasW / 2}
            cy={canvasH / 2}
            r={60 + energyLevel * 2}
            fill="none"
            stroke={config.color}
            strokeWidth="0.4"
            opacity={(energyLevel / 100) * 0.12}
          />
        )}

        {/* Shapes */}
        {shapes.map((shape) => (
          <g
            key={shape.id}
            transform={`translate(${shape.x},${shape.y}) rotate(${shape.rotation})`}
          >
            {/* glow */}
            <path
              d={renderShapePath(config.shapeType, shape.size * 1.5)}
              fill={config.glowColor}
              opacity={shape.opacity * 0.35}
            />
            {/* body */}
            <path
              d={renderShapePath(config.shapeType, shape.size)}
              fill={config.color}
              opacity={shape.opacity * (0.55 + shape.intensity * 0.12)}
            />
          </g>
        ))}
      </svg>

      {/* Bottom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 32px",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setShapes([]);
            energyRef.current = 0;
          }}
          aria-label="Start over"
          style={{
            background: "none",
            border: "none",
            color: `${config.color}40`,
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
            padding: "12px 16px",
            minWidth: 48,
            minHeight: 48,
            letterSpacing: "0.04em",
          }}
        >
          Start over
        </button>

        {shapes.length > 0 && (
          <span
            style={{
              color: `${config.color}28`,
              fontSize: 10,
              letterSpacing: "0.08em",
            }}
          >
            {shapes.length}/{MAX_SHAPES}
          </span>
        )}

        <button
          type="button"
          onClick={handleSave}
          aria-label="Save this visual expression"
          disabled={shapes.length === 0}
          style={{
            background: shapes.length > 0 ? `${config.color}18` : "transparent",
            border: `1px solid ${config.color}${shapes.length > 0 ? "40" : "18"}`,
            borderRadius: 24,
            color: `${config.color}${shapes.length > 0 ? "bb" : "33"}`,
            fontSize: 13,
            fontFamily: "inherit",
            cursor: shapes.length > 0 ? "pointer" : "default",
            padding: "12px 20px",
            minWidth: 48,
            minHeight: 48,
            letterSpacing: "0.04em",
            transition: "all 0.3s",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
