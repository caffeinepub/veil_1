import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import {
  NOTIFICATION_TYPE_COLORS,
  type NotificationHistoryItem,
  type NotificationType,
} from "../lib/notificationTypes";
import { GentleReentryCard } from "./GentleReentryCard";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: NotificationHistoryItem[] = [
  {
    id: "1",
    type: "growth",
    copy: "Something has shifted in how you are carrying things. Veil noticed.",
    sentAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    isRead: true,
  },
  {
    id: "2",
    type: "memory_resurfacing",
    subType: "anniversary",
    copy: "On this day last year — you wrote something. Veil thought you might want to read it.",
    sentAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    isRead: true,
  },
  {
    id: "3",
    type: "reflection_prompt",
    copy: "Veil has a question for you — when you have a quiet moment.",
    sentAt: Date.now() - 3 * 60 * 60 * 1000,
    isRead: false,
  },
  {
    id: "4",
    type: "journal_milestone",
    subType: "on_this_day",
    copy: "On this day last year — you left something here. It is still yours.",
    sentAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    isRead: true,
  },
  {
    id: "5",
    type: "follow_up_state",
    copy: "Yesterday was heavy. Veil is here if you want to sit with it.",
    sentAt: Date.now() - 18 * 60 * 60 * 1000,
    isRead: false,
  },
  {
    id: "6",
    type: "seasonal_reflection",
    subType: "spring",
    copy: "Something is waking up. Veil has a question about what you want to grow toward.",
    sentAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    isRead: true,
  },
  {
    id: "7",
    type: "gentle_reentry",
    copy: "It has been a quiet week. Veil is here whenever you need it.",
    sentAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    isRead: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<NotificationType, string> = {
  follow_up_state: "Morning",
  carrying_awareness: "Carrying",
  emotional_pending: "Unfinished",
  growth: "Growth",
  memory_resurfacing: "Memory",
  journal_milestone: "Journal",
  reflection_prompt: "Reflection",
  seasonal_reflection: "Season",
  gentle_reentry: "Re-entry",
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return "just now";
  if (hours < 5) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (hours < 20) return "this morning";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigateHome?: () => void;
}

export function NotificationCenter({ open, onClose, onNavigateHome }: Props) {
  const [items, setItems] =
    useState<NotificationHistoryItem[]>(MOCK_NOTIFICATIONS);

  function handleReentryDismiss() {
    setItems((prev) => prev.filter((n) => n.type !== "gentle_reentry"));
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="nc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(13,13,15,0.65)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="nc-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
            style={{
              background: "linear-gradient(180deg, #1A1720 0%, #12101A 100%)",
              borderLeft: "1px solid rgba(201,184,232,0.12)",
            }}
            aria-label="Notification center"
            data-ocid="notification_center.panel"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-12 pb-5"
              style={{ borderBottom: "1px solid rgba(201,184,232,0.10)" }}
            >
              <h2
                className="font-serif text-lg"
                style={{ color: "#F9E4A0", fontStyle: "italic" }}
              >
                Moments Veil reached out
              </h2>
              <button
                type="button"
                data-ocid="notification_center.close_button"
                onClick={onClose}
                className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(201,184,232,0.10)",
                  color: "rgba(220,210,240,0.70)",
                }}
                aria-label="Close notification center"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
              <div
                className="px-5 py-4 space-y-3"
                data-ocid="notification_center.list"
              >
                {items.length === 0 ? (
                  <div
                    className="py-16 text-center"
                    data-ocid="notification_center.empty_state"
                  >
                    <p
                      className="text-sm italic"
                      style={{ color: "rgba(201,184,232,0.50)" }}
                    >
                      Veil has been quiet. That is by design.
                    </p>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      index={idx + 1}
                      onNavigateHome={onNavigateHome}
                      onReentryDismiss={handleReentryDismiss}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Single item ──────────────────────────────────────────────────────────────

function NotificationItem({
  item,
  index,
  onNavigateHome,
  onReentryDismiss,
}: {
  item: NotificationHistoryItem;
  index: number;
  onNavigateHome?: () => void;
  onReentryDismiss?: () => void;
}) {
  const color = NOTIFICATION_TYPE_COLORS[item.type];
  const label = TYPE_LABELS[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="rounded-2xl px-4 py-4"
      style={{
        background: item.isRead
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.06)",
        border: `1px solid ${item.isRead ? "rgba(201,184,232,0.08)" : "rgba(201,184,232,0.16)"}`,
      }}
      data-ocid={`notification_center.item.${index}`}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="pt-1 flex-shrink-0">
          {!item.isRead && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {item.isRead && <div className="w-2 h-2" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span
            className="inline-block text-xs font-medium rounded-full px-2.5 py-0.5 mb-2"
            style={{
              backgroundColor: `${color}28`,
              color: color,
              border: `1px solid ${color}40`,
            }}
          >
            {label}
          </span>

          {/* Copy */}
          <p
            className="text-sm leading-relaxed mb-2"
            style={{ color: "rgba(220,210,240,0.85)", fontStyle: "italic" }}
          >
            {item.copy}
          </p>

          {/* Timestamp */}
          <p className="text-xs" style={{ color: "rgba(201,184,232,0.40)" }}>
            {relativeTime(item.sentAt)}
          </p>

          {/* Gentle re-entry rich actions */}
          {item.type === "gentle_reentry" && (
            <div className="mt-3">
              <GentleReentryCard
                copy={item.copy}
                inline
                onDismiss={onReentryDismiss}
                onNavigateHome={onNavigateHome}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
