import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  type NotificationPermissionState,
  loadNotificationState,
  saveNotificationState,
} from "../lib/notificationTypes";

interface Props {
  onGranted?: () => void;
  onDeferred?: () => void;
}

export function NotificationPermissionModal({ onGranted, onDeferred }: Props) {
  const [visible, setVisible] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    const ns = loadNotificationState();
    setDays(ns.daysSinceOnboarding);
    const shouldShow =
      ns.permissionState === "not_asked" && ns.daysSinceOnboarding >= 3;
    setVisible(shouldShow);
  }, []);

  function handleAllow() {
    const ns = loadNotificationState();
    ns.permissionState = "granted";
    saveNotificationState(ns);
    setVisible(false);
    onGranted?.();
  }

  function handleNotYet() {
    const ns = loadNotificationState();
    const newState: NotificationPermissionState =
      days >= 7 ? "permanently_deferred" : "deferred";
    ns.permissionState = newState;
    saveNotificationState(ns);
    setVisible(false);
    onDeferred?.();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="notif-permission-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(13,13,15,0.82)" }}
          aria-labelledby="notif-permission-title"
          data-ocid="notif_permission.modal"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-6 w-full max-w-sm rounded-3xl px-8 py-9"
            style={{
              background: "linear-gradient(160deg, #1A1720 0%, #12101A 100%)",
              border: "1px solid rgba(201,184,232,0.14)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.55)",
            }}
          >
            {/* Title */}
            <h2
              id="notif-permission-title"
              className="font-serif text-xl text-center mb-6"
              style={{
                color: "#F9E4A0",
                fontStyle: "italic",
                letterSpacing: "0.01em",
              }}
            >
              A quiet question.
            </h2>

            {/* Body copy */}
            <p
              className="text-center text-sm leading-relaxed mb-8"
              style={{ color: "rgba(220,210,240,0.80)", fontStyle: "italic" }}
            >
              Veil would like to reach you occasionally —<br />
              when something feels worth sharing with you.
              <br />
              <br />
              Never more than once a day.
              <br />
              Never at night.
              <br />
              Always about you — never about the app.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                data-ocid="notif_permission.confirm_button"
                onClick={handleAllow}
                className="w-full py-4 rounded-2xl text-sm font-medium transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, #F9E4A0 0%, #F4C28A 100%)",
                  color: "#1A1720",
                  minHeight: 48,
                }}
              >
                Allow notifications
              </button>
              <button
                type="button"
                data-ocid="notif_permission.cancel_button"
                onClick={handleNotYet}
                className="w-full py-4 rounded-2xl text-sm transition-all"
                style={{
                  background: "transparent",
                  color: "rgba(201,184,232,0.65)",
                  border: "1px solid rgba(201,184,232,0.18)",
                  minHeight: 48,
                }}
              >
                Not yet
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
