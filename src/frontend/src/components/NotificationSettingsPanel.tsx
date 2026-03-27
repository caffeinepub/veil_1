import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  NOTIFICATION_CONFIGS,
  type NotificationState,
  type NotificationType,
  loadNotificationState,
  saveNotificationState,
} from "../lib/notificationTypes";

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  badge,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={id}
            className="text-sm cursor-pointer"
            style={{ color: "rgba(220,210,240,0.85)" }}
          >
            {label}
          </Label>
          {badge && (
            <span
              className="text-xs rounded-full px-2 py-0.5"
              style={{
                background: "rgba(201,184,232,0.15)",
                color: "rgba(201,184,232,0.70)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p
            className="text-xs mt-0.5"
            style={{ color: "rgba(201,184,232,0.45)" }}
          >
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="flex-shrink-0"
        aria-label={label}
        data-ocid={`notification_settings.${id}.switch`}
      />
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationSettingsPanel({ open, onClose }: Props) {
  const [state, setState] = useState<NotificationState>(loadNotificationState);
  const [typeToggles, setTypeToggles] = useState<
    Partial<Record<NotificationType, boolean>>
  >({});

  useEffect(() => {
    if (open) {
      const ns = loadNotificationState();
      setState(ns);
      // Default: all enabled unless explicitly disabled
      const stored = localStorage.getItem("veil_notif_type_toggles");
      if (stored) {
        try {
          setTypeToggles(JSON.parse(stored));
        } catch {
          /* ignore */
        }
      }
    }
  }, [open]);

  function setQuietMode(v: boolean) {
    const ns = { ...state, quietModeEnabled: v };
    setState(ns);
    saveNotificationState(ns);
  }

  function setTypeToggle(type: NotificationType, v: boolean) {
    const next = { ...typeToggles, [type]: v };
    setTypeToggles(next);
    try {
      localStorage.setItem("veil_notif_type_toggles", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function isTypeEnabled(type: NotificationType): boolean {
    if (type in typeToggles) return !!typeToggles[type];
    return true; // default on
  }

  const allTypes: NotificationType[] = [
    "follow_up_state",
    "carrying_awareness",
    "emotional_pending",
    "growth",
    "memory_resurfacing",
    "journal_milestone",
    "reflection_prompt",
    "seasonal_reflection",
    "gentle_reentry",
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="nsp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(13,13,15,0.65)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="nsp-panel"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl flex flex-col"
            style={{
              background: "linear-gradient(180deg, #1A1720 0%, #12101A 100%)",
              border: "1px solid rgba(201,184,232,0.12)",
              maxHeight: "90dvh",
            }}
            aria-label="Notification settings"
            data-ocid="notification_settings.panel"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(201,184,232,0.10)" }}
            >
              <h2
                className="font-serif text-lg"
                style={{ color: "#F9E4A0", fontStyle: "italic" }}
              >
                When Veil reaches out
              </h2>
              <button
                type="button"
                data-ocid="notification_settings.close_button"
                onClick={onClose}
                className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(201,184,232,0.10)",
                  color: "rgba(220,210,240,0.70)",
                }}
                aria-label="Close notification settings"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-6 py-4 space-y-1">
                {/* Quiet Mode */}
                <div
                  className="rounded-2xl px-4 py-1 mb-4"
                  style={{
                    background: state.quietModeEnabled
                      ? "rgba(249,228,160,0.08)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${state.quietModeEnabled ? "rgba(249,228,160,0.25)" : "rgba(201,184,232,0.10)"}`,
                  }}
                >
                  <ToggleRow
                    id="quiet-mode"
                    label="Quiet Mode"
                    description={
                      state.quietModeEnabled
                        ? "Only essential moments — inner circle alerts, support received, scheduled deliveries"
                        : "Veil reaches out with the moments that matter most"
                    }
                    checked={state.quietModeEnabled}
                    onChange={setQuietMode}
                  />
                </div>

                {/* Per-type toggles */}
                <p
                  className="text-xs font-medium uppercase tracking-widest mb-3 px-1"
                  style={{ color: "rgba(201,184,232,0.45)" }}
                >
                  Notification types
                </p>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(201,184,232,0.10)" }}
                >
                  {allTypes.map((type, idx) => {
                    const config = NOTIFICATION_CONFIGS[type];
                    return (
                      <div
                        key={type}
                        className="px-4"
                        style={{
                          borderBottom:
                            idx < allTypes.length - 1
                              ? "1px solid rgba(201,184,232,0.07)"
                              : "none",
                          opacity:
                            state.quietModeEnabled &&
                            type !== "emotional_pending" &&
                            type !== "follow_up_state" &&
                            type !== "journal_milestone"
                              ? 0.45
                              : 1,
                          transition: "opacity 0.25s",
                        }}
                        data-ocid={`notification_settings.${type}.row`}
                      >
                        <ToggleRow
                          id={`type-${type}`}
                          label={config.label}
                          checked={
                            isTypeEnabled(type) &&
                            (!state.quietModeEnabled ||
                              type === "emotional_pending" ||
                              type === "follow_up_state" ||
                              type === "journal_milestone")
                          }
                          onChange={(v) => setTypeToggle(type, v)}
                          badge={config.isInApp ? "In-app only" : undefined}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Footer note */}
                <p
                  className="text-xs italic text-center pt-6 pb-2 px-4 leading-relaxed"
                  style={{ color: "rgba(201,184,232,0.40)" }}
                >
                  Veil sends at most one notification per day. Never at night.
                  Never when you are here.
                </p>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
