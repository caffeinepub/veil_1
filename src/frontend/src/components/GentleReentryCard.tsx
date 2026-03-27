import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useState } from "react";

interface Props {
  copy?: string;
  inline?: boolean; // when embedded in NotificationCenter, skip outer card shell
  onDismiss?: () => void;
  onNavigateHome?: () => void;
}

const DEFAULT_COPY =
  "It has been a quiet week. Veil is here whenever you need it.";

export function GentleReentryCard({
  copy = DEFAULT_COPY,
  inline = false,
  onDismiss,
  onNavigateHome,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function handleOkay() {
    // Snooze for 14 days
    const until = Date.now() + 14 * 24 * 60 * 60 * 1000;
    try {
      const raw = localStorage.getItem("veil_notification_state");
      const state = raw ? JSON.parse(raw) : {};
      state.reentrySnoozedUntil = until;
      localStorage.setItem("veil_notification_state", JSON.stringify(state));
    } catch {
      // ignore
    }
    setConfirmed(true);
    setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, 1500);
  }

  function handleNeedVeil() {
    setDismissed(true);
    onDismiss?.();
    onNavigateHome?.();
  }

  if (dismissed) return null;

  const actions = (
    <AnimatePresence mode="wait">
      {confirmed ? (
        <motion.p
          key="confirmed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm italic text-center py-1"
          style={{ color: "rgba(201,184,232,0.70)" }}
        >
          Veil will be here when you need it.
        </motion.p>
      ) : (
        <motion.div
          key="actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-2"
        >
          <button
            type="button"
            data-ocid="gentle_reentry.secondary_button"
            onClick={handleOkay}
            className="w-full py-3 rounded-xl text-sm transition-all text-left px-4"
            style={{
              background: "rgba(184,196,212,0.12)",
              color: "rgba(184,196,212,0.85)",
              border: "1px solid rgba(184,196,212,0.20)",
              minHeight: 48,
            }}
          >
            I'm okay — just busy
          </button>
          <button
            type="button"
            data-ocid="gentle_reentry.primary_button"
            onClick={handleNeedVeil}
            className="w-full py-3 rounded-xl text-sm transition-all text-left px-4"
            style={{
              background: "rgba(249,228,160,0.12)",
              color: "rgba(249,228,160,0.85)",
              border: "1px solid rgba(249,228,160,0.20)",
              minHeight: 48,
            }}
          >
            I need Veil today
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (inline) {
    return <div>{actions}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl px-5 py-6"
      style={{
        background: "linear-gradient(160deg, #1A1720 0%, #12101A 100%)",
        border: "1px solid rgba(184,196,212,0.18)",
      }}
      data-ocid="gentle_reentry.card"
    >
      <p
        className="text-sm leading-relaxed mb-5 italic"
        style={{ color: "rgba(220,210,240,0.80)" }}
      >
        {copy}
      </p>
      {actions}
    </motion.div>
  );
}
