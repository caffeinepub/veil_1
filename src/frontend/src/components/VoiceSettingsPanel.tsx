import type { VeilVoiceMomentsEnabled } from "../contexts/VeilVoiceContext";
import { useVeilVoice } from "../contexts/VeilVoiceContext";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid rgba(201, 184, 232, 0.2)",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "oklch(0.3 0.04 295)",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {label}
        </p>
        {description && (
          <p
            style={{
              fontSize: 12,
              color: "oklch(0.55 0.04 295)",
              margin: "4px 0 0",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: 48,
          height: 28,
          borderRadius: 14,
          border: "none",
          cursor: disabled ? "default" : "pointer",
          background: checked
            ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
            : "rgba(201, 184, 232, 0.4)",
          position: "relative",
          transition: "background 200ms ease",
          padding: 0,
          minHeight: 44,
          minWidth: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: checked ? "flex-end" : "flex-start",
          paddingLeft: 4,
          paddingRight: 4,
        }}
        aria-label={`${label}: ${checked ? "on" : "off"}`}
      >
        <span
          style={{
            display: "block",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            transition: "transform 200ms ease",
          }}
        />
      </button>
    </div>
  );
}

export function VoiceSettingsPanel() {
  const { settings, updateSettings } = useVeilVoice();
  const masterOn = settings.voice_enabled;

  const setMaster = (v: boolean) => updateSettings({ voice_enabled: v });

  const setMoment = (key: keyof VeilVoiceMomentsEnabled, v: boolean) => {
    updateSettings({
      moments_enabled: { ...settings.moments_enabled, [key]: v },
    });
  };

  const momentRows: {
    key: keyof VeilVoiceMomentsEnabled;
    label: string;
    description: string;
  }[] = [
    {
      key: "after_voice_dump",
      label: "After voice dump",
      description: "Veil speaks after you finish recording a voice dump.",
    },
    {
      key: "after_text_dump",
      label: "After text dump",
      description:
        "Veil speaks when you tap \u201cVeil, take this from me.\u201d",
    },
    {
      key: "after_silent_dump",
      label: "After silent dump",
      description: "A brief, gentle voice when you choose to just show up.",
    },
    {
      key: "morning_follow_up",
      label: "Morning follow-up",
      description:
        "Veil speaks softly when you open the app the morning after.",
    },
    {
      key: "carrying_awareness",
      label: "Carrying awareness",
      description:
        "Veil speaks when it notices you\u2019ve been carrying the same emotion for days.",
    },
    {
      key: "after_checkin",
      label: "After check-in",
      description:
        "Veil speaks during your Quiet Moment after an emotion check-in.",
    },
  ];

  return (
    <section
      aria-labelledby="voice-settings-title"
      style={{
        background: "white",
        borderRadius: 24,
        padding: "20px 20px 8px",
        boxShadow: "0 2px 12px rgba(107, 91, 142, 0.07)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 22 }} aria-hidden="true">
          🩹
        </span>
        <h2
          id="voice-settings-title"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "oklch(0.25 0.06 295)",
            margin: 0,
          }}
        >
          Veil Voice
        </h2>
      </div>

      <p
        style={{
          fontSize: 13,
          color: "oklch(0.55 0.04 295)",
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        Hear Veil respond to you after you share an emotion. A warm, calm voice
        — like a companion who is listening.
      </p>

      {/* Master toggle */}
      <ToggleRow
        label="Veil Voice"
        description="Turn on or off all voice responses."
        checked={masterOn}
        onChange={setMaster}
      />

      {/* Individual moment toggles */}
      {masterOn && (
        <div style={{ marginTop: 4 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "oklch(0.6 0.06 295)",
              textTransform: "uppercase",
              margin: "16px 0 4px",
            }}
          >
            Individual Moments
          </p>
          {momentRows.map((row) => (
            <ToggleRow
              key={row.key}
              label={row.label}
              description={row.description}
              checked={settings.moments_enabled[row.key]}
              onChange={(v) => setMoment(row.key, v)}
            />
          ))}
        </div>
      )}

      {/* Accessibility note */}
      <p
        style={{
          fontSize: 12,
          color: "oklch(0.65 0.03 295)",
          lineHeight: 1.5,
          marginTop: 16,
          marginBottom: 8,
          paddingTop: 12,
          borderTop: "1px solid rgba(201, 184, 232, 0.2)",
        }}
      >
        Veil’s voice always appears with the full transcript on screen. No
        information is lost if audio is off.
      </p>
    </section>
  );
}
