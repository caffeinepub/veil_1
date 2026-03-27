import type { PendingItemType, RetentionUserState } from "./retentionState";
import { getHighestPriorityPendingItem } from "./retentionState";

export interface NotificationCandidate {
  type: string;
  priority: number;
}

export type ReEntryState = "active" | "paused" | "gentle_reentry" | "silence";

// Minimum gap between notifications in milliseconds (18 hours)
const MIN_GAP_MS = 18 * 60 * 60 * 1000;
// Dismissal cooldown in milliseconds (48 hours)
const DISMISS_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export function canSendNotification(
  state: RetentionUserState,
  userLocalHour: number,
): boolean {
  // Never during 10pm–7am
  if (userLocalHour >= 22 || userLocalHour < 7) return false;
  // Never if crisis in last 24h
  if (state.crisisInLast24h) return false;
  // Minimum 18h gap since last notification
  if (state.lastNotificationSentAt) {
    const elapsed = Date.now() - state.lastNotificationSentAt.getTime();
    if (elapsed < MIN_GAP_MS) return false;
  }
  // Same type dismissed within 48h
  if (state.lastNotificationSentAt && state.lastNotificationType) {
    const elapsed = Date.now() - state.lastNotificationSentAt.getTime();
    const pendingType = getHighestPriorityPendingItem(state);
    if (
      elapsed < DISMISS_COOLDOWN_MS &&
      pendingType === state.lastNotificationType
    ) {
      return false;
    }
  }
  return true;
}

export function getNotificationForToday(
  state: RetentionUserState,
  userLocalHour: number,
): NotificationCandidate | null {
  if (!canSendNotification(state, userLocalHour)) return null;

  // 1. Crisis-related — handled externally; skip here
  // 2. Scheduled delivery reminder (10–15 min before)
  if (state.hasScheduledApology && state.scheduledDeliveryAt) {
    const msUntil = state.scheduledDeliveryAt.getTime() - Date.now();
    if (msUntil > 0 && msUntil <= 15 * 60 * 1000) {
      return { type: "scheduled_delivery_reminder", priority: 2 };
    }
  }
  // 3. Write Tab emotional pending
  const pendingItem = getHighestPriorityPendingItem(state);
  if (pendingItem) {
    return { type: "write_tab_emotional_pending", priority: 3 };
  }
  // 4. Follow-Up State (morning after difficult emotion)
  if (
    state.lastEmotionCategory === "NEGATIVE" &&
    state.daysSinceLastSession === 1 &&
    userLocalHour >= 7 &&
    userLocalHour <= 10
  ) {
    return { type: "follow_up_state", priority: 4 };
  }
  // 5. Carrying awareness
  if (state.patternDetected === "RECURRING") {
    return { type: "carrying_awareness", priority: 5 };
  }
  // 6. Growth notification
  if (state.patternDetected === "IMPROVEMENT") {
    return { type: "growth_notification", priority: 6 };
  }
  // 7. Memory resurfacing
  if (state.patternDetected === "ANNIVERSARY") {
    return { type: "memory_resurfacing", priority: 7 };
  }
  // 8–11: lower priority defaults omitted for brevity — extend as needed
  // 12. Gentle re-entry
  if (state.daysSinceLastSession >= 5) {
    return { type: "gentle_reentry", priority: 12 };
  }
  return null;
}

export function getReEntryState(state: RetentionUserState): ReEntryState {
  const days = state.daysSinceLastSession;
  if (days < 3) return "active";
  if (days >= 3 && days < 7) return "paused";
  if (days === 7) return "gentle_reentry";
  return "silence";
}

const NOTIFICATION_COPY: Record<string, { title: string; body: string }> = {
  unsent_apology: {
    title: "Something you wrote",
    body: "You wrote something meaningful. It will be here whenever you are ready.",
  },
  scheduled_apology: {
    title: "On its way",
    body: "Your apology is about to be delivered. Do you still want to send it?",
  },
  cancelled_apology: {
    title: "Some words stay with us",
    body: "Some words stay with us. Yours are still here.",
  },
  unread_received_apology: {
    title: "Something is here for you",
    body: "Something is here for you. No rush. It will be here.",
  },
  apology_read_no_response: {
    title: "No rush",
    body: "You don't have to decide now. You can come back whenever you are ready.",
  },
  unsent_love_letter: {
    title: "Something beautiful",
    body: "You wrote something beautiful. It is still here.",
  },
  love_letter_sent_no_reaction: {
    title: "Your letter was delivered",
    body: "Your letter reached them. That is something.",
  },
  unsent_confession: {
    title: "Veil is here",
    body: "Veil is here when you are ready.",
  },
  future_self_letter_approaching: {
    title: "Something you wrote for yourself",
    body: "You wrote yourself something. It arrives tomorrow.",
  },
  follow_up_state: {
    title: "Good morning",
    body: "Veil is here when you are ready.",
  },
  carrying_awareness: {
    title: "Something worth noticing",
    body: "You have been carrying something for a while. That is worth noticing.",
  },
  growth_notification: {
    title: "Something has shifted",
    body: "Something has been shifting. The last few days have felt lighter.",
  },
  memory_resurfacing: {
    title: "A moment from your past",
    body: "A year ago, you wrote something real. Veil remembered.",
  },
  gentle_reentry: {
    title: "Veil is here",
    body: "Veil is here when you are ready.",
  },
};

export function getNotificationCopy(
  type: PendingItemType | string,
): { title: string; body: string } | null {
  return NOTIFICATION_COPY[type] ?? null;
}
