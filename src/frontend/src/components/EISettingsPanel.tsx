import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export interface EISettings {
  enabled: boolean;
  breathing: boolean;
  grounding: boolean;
  rebuild: boolean;
  agencyReminder: boolean;
}

const EI_SETTINGS_KEY = "veil-ei-settings";

export function getEISettings(): EISettings {
  const defaults: EISettings = {
    enabled: true,
    breathing: true,
    grounding: true,
    rebuild: true,
    agencyReminder: true,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(EI_SETTINGS_KEY);
    if (!stored) return defaults;
    return { ...defaults, ...JSON.parse(stored) };
  } catch {
    return defaults;
  }
}

function saveEISettings(settings: EISettings) {
  try {
    localStorage.setItem(EI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  id,
}: ToggleRowProps) {
  return (
    <div
      className="flex items-start gap-4 py-4"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: disabled ? "rgba(0,0,0,0.35)" : "#2D2D2D" }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-xs mt-0.5 leading-relaxed"
            style={{ color: "rgba(0,0,0,0.45)" }}
          >
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

export function EISettingsPanel() {
  const [settings, setSettings] = useState<EISettings>(getEISettings);

  function update(patch: Partial<EISettings>) {
    const next = { ...settings, ...patch };
    // If disabling master, disable all sub-toggles
    if (patch.enabled === false) {
      next.breathing = false;
      next.grounding = false;
      next.rebuild = false;
      next.agencyReminder = false;
    }
    // If re-enabling master, restore defaults
    if (patch.enabled === true) {
      next.breathing = true;
      next.grounding = true;
      next.rebuild = true;
      next.agencyReminder = true;
    }
    setSettings(next);
    saveEISettings(next);
  }

  return (
    <div
      data-ocid="ei.settings.panel"
      className="rounded-3xl px-6 py-5 mb-5"
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(201,184,232,0.25)",
        boxShadow: "0 2px 16px rgba(107,79,187,0.06)",
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🧠</span>
          <h3
            className="font-serif text-base font-semibold"
            style={{ color: "#2D2D2D" }}
          >
            Emotional Intelligence
          </h3>
        </div>
        <p className="text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>
          How should Veil respond to what you carry?
        </p>
      </div>

      {/* Toggles */}
      <div>
        <ToggleRow
          id="ei-enabled"
          label="Understand my emotions"
          description="Veil gently detects what you were carrying and responds personally."
          checked={settings.enabled}
          onCheckedChange={(v) => update({ enabled: v })}
        />
        <ToggleRow
          id="ei-breathing"
          label="Breathing guide"
          description="Veil offers a 60-second breathing exercise after difficult emotions."
          checked={settings.breathing}
          onCheckedChange={(v) => update({ breathing: v })}
          disabled={!settings.enabled}
        />
        <ToggleRow
          id="ei-grounding"
          label="Grounding"
          description="Veil offers a short present-moment anchor."
          checked={settings.grounding}
          onCheckedChange={(v) => update({ grounding: v })}
          disabled={!settings.enabled}
        />
        <ToggleRow
          id="ei-rebuild"
          label="Rebuild with me"
          description="Veil walks you through the Strength Mirror, One True Thing, and Agency Anchor."
          checked={settings.rebuild}
          onCheckedChange={(v) => update({ rebuild: v })}
          disabled={!settings.enabled}
        />
        <div className="flex items-start gap-4 pt-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium"
              style={{
                color: !settings.enabled ? "rgba(0,0,0,0.35)" : "#2D2D2D",
              }}
            >
              Remind me of my agency action
            </p>
            <p
              className="text-xs mt-0.5 leading-relaxed"
              style={{ color: "rgba(0,0,0,0.45)" }}
            >
              Veil sends a reminder for your chosen action.
            </p>
          </div>
          <Switch
            id="ei-agency"
            checked={settings.agencyReminder}
            onCheckedChange={(v) => update({ agencyReminder: v })}
            disabled={!settings.enabled}
            aria-label="Remind me of my agency action"
          />
        </div>
      </div>
    </div>
  );
}
