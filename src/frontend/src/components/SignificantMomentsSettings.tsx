// ─── Significant Moments Settings ────────────────────────────────────────────
// Section component for embedding in ProfileTab Settings → Emotional Intelligence.
// The user controls when and how Veil reflects moments back.

import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import {
  getSettings,
  getSignalList,
  saveSettings,
} from "../lib/significantMomentsEngine";
import type { SignificantMomentsState } from "../lib/significantMomentsEngine";

type Settings = SignificantMomentsState["settings"];

// Reuse the WARM_DARK / GOLD color scheme from ProfileTab
const WARM_DARK = "oklch(0.3 0.04 295)";
const MUTED = "#9ca3af";
const SAGE = "rgba(122,158,126,0.60)";

interface ToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div
      className="flex items-start justify-between gap-3 py-3"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium block cursor-pointer"
          style={{ color: WARM_DARK }}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: MUTED }}>
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}

export function SignificantMomentsSettings() {
  const [settings, setSettings] = useState<Settings>(getSettings);
  const signals = getSignalList();

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <ToggleRow
        id="sig-moments-master"
        label="Significant Moments"
        description="Veil reflects emotionally significant moments back to you at the right time."
        checked={settings.enabled}
        onChange={(v) => update({ enabled: v })}
      />

      {settings.enabled && (
        <>
          {/* Sub-toggles */}
          <div style={{ paddingLeft: 0 }}>
            <p className="text-xs mb-1" style={{ color: MUTED }}>
              Which moments Veil reflects back
            </p>
            <ToggleRow
              id="sig-whisper"
              label="Significance Whisper"
              description="A quiet line during a session, noticing something you did."
              checked={settings.whisperEnabled}
              onChange={(v) => update({ whisperEnabled: v })}
            />
            <ToggleRow
              id="sig-mirror"
              label="Memory Mirror"
              description="A reflection card surfacing a significant moment from your past."
              checked={settings.memoryMirrorEnabled}
              onChange={(v) => update({ memoryMirrorEnabled: v })}
            />
            <ToggleRow
              id="sig-return"
              label="Return Letter"
              description="A message from a moment you already survived, when you need it most."
              checked={settings.returnLetterEnabled}
              onChange={(v) => update({ returnLetterEnabled: v })}
            />
            <ToggleRow
              id="sig-becoming"
              label="Becoming Moment"
              description="The delivery experience for your quarterly Becoming Line."
              checked={settings.becomingMomentEnabled}
              onChange={(v) => update({ becomingMomentEnabled: v })}
            />
            <ToggleRow
              id="sig-milestone"
              label="Milestone Hold"
              description="A brief moment before your Journal opens at session milestones."
              checked={settings.milestoneHoldEnabled}
              onChange={(v) => update({ milestoneHoldEnabled: v })}
            />
            <ToggleRow
              id="sig-peak"
              label="Peak Seal"
              description="The closing experience when you complete the full Transformation Arc."
              checked={settings.peakSealEnabled}
              onChange={(v) => update({ peakSealEnabled: v })}
            />
          </div>

          {/* Frequency */}
          <div style={{ paddingTop: 8 }}>
            <p
              className="text-xs font-medium mb-2"
              style={{ color: WARM_DARK }}
            >
              How often Veil reflects moments back
            </p>
            <div className="space-y-1">
              {(["RARELY", "OCCASIONALLY", "OFTEN"] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  data-ocid={`sig.${freq.toLowerCase()}.toggle`}
                  onClick={() => update({ frequency: freq })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
                  style={{
                    background:
                      settings.frequency === freq
                        ? "rgba(122,158,126,0.12)"
                        : "transparent",
                    border:
                      settings.frequency === freq
                        ? "1px solid rgba(122,158,126,0.25)"
                        : "1px solid transparent",
                    color: WARM_DARK,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        settings.frequency === freq
                          ? SAGE
                          : "rgba(156,163,175,0.4)",
                      flexShrink: 0,
                    }}
                  />
                  <span>{freq.charAt(0) + freq.slice(1).toLowerCase()}</span>
                  {freq === "OFTEN" && (
                    <span className="ml-auto text-xs" style={{ color: MUTED }}>
                      sends more frequently
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: MUTED }}>
              &ldquo;Often&rdquo; sends more frequently but never overrides care
              gaps.
            </p>
          </div>

          {/* Signal list — human readable, no scores */}
          <div style={{ paddingTop: 8 }}>
            <p
              className="text-xs font-medium mb-3"
              style={{ color: WARM_DARK }}
            >
              Your Significant Moments
            </p>
            {signals.length === 0 ? (
              <p
                className="text-sm"
                style={{ color: MUTED, fontStyle: "italic" }}
              >
                Veil is watching. Significant moments will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {signals.map((s, i) => (
                  <div
                    key={`${s.date.getTime()}-${i}`}
                    data-ocid={`sig.item.${i + 1}`}
                    className="flex items-start gap-3 py-2"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  >
                    <span
                      className="text-xs shrink-0 mt-0.5"
                      style={{ color: MUTED, minWidth: 80 }}
                    >
                      {s.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span
                      className="text-sm flex-1"
                      style={{ color: WARM_DARK }}
                    >
                      {s.humanLabel}
                    </span>
                    {s.reflected && (
                      <span
                        aria-label="reflected"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "rgba(122,158,126,0.40)",
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
