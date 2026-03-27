import { renderShapePath } from "../lib/shapeRenderers";
import type { CanvasShape } from "./VisualExpressionCanvas";

interface Props {
  emotionType: string;
  emotionLabel: string;
  auraColor: string;
  bgDark: string;
  canvasShapes: CanvasShape[];
  canvasShapeType: string;
  aiSnapshotSvg?: string;
  onDone: () => void;
}

export function VisualSnapshotResult({
  emotionLabel,
  auraColor,
  bgDark,
  canvasShapes,
  canvasShapeType,
  aiSnapshotSvg,
  onDone,
}: Props) {
  const vbW = typeof window !== "undefined" ? window.innerWidth : 390;
  const vbH = typeof window !== "undefined" ? window.innerHeight : 844;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: bgDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        gap: "1.75rem",
        overflowY: "auto",
      }}
    >
      {/* Veil voice line */}
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 16,
          color: `${auraColor}99`,
          textAlign: "center",
          lineHeight: 1.75,
          maxWidth: 280,
          letterSpacing: "0.01em",
        }}
      >
        You said something
        <br />
        without words.
        <br />
        Veil received it.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          width: "100%",
          maxWidth: 320,
        }}
      >
        {/* What you made */}
        <div>
          <p
            style={{
              fontSize: 10,
              color: `${auraColor}55`,
              textAlign: "center",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 10,
              fontFamily: "inherit",
            }}
          >
            What you made
          </p>
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              background: bgDark,
              border: `1px solid ${auraColor}22`,
              width: "100%",
              aspectRatio: "1",
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${vbW} ${vbH}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`Your ${emotionLabel} visual expression`}
            >
              {canvasShapes.map((s) => (
                <g
                  key={s.id}
                  transform={`translate(${s.x},${s.y}) rotate(${s.rotation})`}
                >
                  <path
                    d={renderShapePath(canvasShapeType, s.size)}
                    fill={auraColor}
                    opacity={s.opacity * 0.75}
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* What Veil made */}
        {aiSnapshotSvg && (
          <div>
            <div
              style={{
                width: 60,
                height: 1,
                background: `${auraColor}22`,
                margin: "0 auto 1.25rem",
              }}
            />
            <p
              style={{
                fontSize: 10,
                color: `${auraColor}55`,
                textAlign: "center",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 10,
                fontFamily: "inherit",
              }}
            >
              What Veil made
            </p>
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: `1px solid ${auraColor}22`,
                width: "100%",
                aspectRatio: "1",
              }}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: AI-generated SVG from closed system
              dangerouslySetInnerHTML={{ __html: aiSnapshotSvg }}
              role="img"
              aria-label={`Abstract visual generated from ${emotionLabel} emotion. Shapes with flowing motion.`}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDone}
        style={{
          background: "none",
          border: `1px solid ${auraColor}33`,
          borderRadius: 24,
          color: `${auraColor}88`,
          fontSize: 13,
          fontFamily: "inherit",
          cursor: "pointer",
          padding: "14px 28px",
          minHeight: 48,
          letterSpacing: "0.04em",
        }}
      >
        Done
      </button>
    </div>
  );
}
