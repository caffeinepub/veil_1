import { useState } from "react";
import { renderShapePath } from "../lib/shapeRenderers";
import type { VisualEntry } from "../lib/visualExpressionState";

interface Props {
  entries: VisualEntry[];
  onOpenEntry?: (entry: VisualEntry) => void;
}

export function VisualStoryGallery({ entries, onOpenEntry }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length < 5) return null;

  // Find the month where most visible shift occurred (naive: month with most variety)
  const months = entries.map((e) => {
    const d = new Date(e.created_at);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  });
  // Find month with most distinct emotion types
  const monthEmotions: Record<string, Set<string>> = {};
  entries.forEach((e, i) => {
    const m = months[i];
    if (!monthEmotions[m]) monthEmotions[m] = new Set();
    monthEmotions[m].add(e.emotion_type);
  });
  const pivotMonth =
    Object.entries(monthEmotions).sort(
      (a, b) => b[1].size - a[1].size,
    )[0]?.[0] ?? months[Math.floor(months.length / 2)];

  const visible = expanded ? entries : entries.slice(0, 12);

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 16,
          color: "rgba(58,58,74,0.8)",
          letterSpacing: "0.04em",
          marginBottom: "1.25rem",
          textAlign: "center",
        }}
      >
        Your Visual Story
      </h3>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {visible.map((entry) => {
          let shapes: Array<{
            x: number;
            y: number;
            size: number;
            rotation: number;
          }> = [];
          try {
            shapes = JSON.parse(entry.canvas_data);
          } catch {
            /* empty */
          }

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenEntry?.(entry)}
              aria-label={`${entry.emotion_label} visual expression from ${new Date(entry.created_at).toLocaleDateString()}`}
              style={{
                background: `${entry.aura_color}10`,
                border: `1px solid ${entry.aura_color}25`,
                borderRadius: 10,
                cursor: "pointer",
                aspectRatio: "1",
                padding: 0,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 390 844"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`${entry.emotion_label} abstract shapes`}
                style={{ position: "absolute", inset: 0 }}
              >
                {shapes.slice(0, 20).map((s) => (
                  <g
                    key={`${Math.round(s.x)}-${Math.round(s.y)}-${Math.round(s.size)}`}
                    transform={`translate(${s.x},${s.y}) rotate(${s.rotation})`}
                  >
                    <path
                      d={renderShapePath("soft-circle", s.size)}
                      fill={entry.aura_color}
                      opacity={0.45}
                    />
                  </g>
                ))}
              </svg>
            </button>
          );
        })}
      </div>

      {entries.length > 12 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "block",
            margin: "1rem auto 0",
            background: "none",
            border: "none",
            color: "rgba(100,100,130,0.5)",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.06em",
            padding: "8px 16px",
          }}
        >
          {expanded ? "Show less" : `See all ${entries.length}`}
        </button>
      )}

      {/* Veil observation */}
      <p
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 13,
          color: "rgba(100,100,130,0.55)",
          lineHeight: 1.7,
          padding: "0 1rem",
        }}
      >
        Something in your visuals shifted around {pivotMonth}.
        <br />
        You might recognize that shift.
      </p>
    </div>
  );
}
