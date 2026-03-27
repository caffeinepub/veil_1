import {
  NOTIFICATION_CONFIGS,
  type NotificationState,
  type NotificationType,
  QUIET_MODE_ALLOWED_TYPES,
} from "./notificationTypes";
import type { PendingItemType, RetentionUserState } from "./retentionState";
import { getHighestPriorityPendingItem } from "./retentionState";

export interface RetentionSurface {
  showStillWithYou: boolean;
  pendingItemType: PendingItemType | null;
  showPeaceMessage: boolean;
}

export function evaluateRetentionSurface(
  state: RetentionUserState,
): RetentionSurface {
  const pendingItemType = getHighestPriorityPendingItem(state);
  const showStillWithYou = pendingItemType !== null && !state.crisisInLast24h;
  return {
    showStillWithYou,
    pendingItemType,
    showPeaceMessage: false,
  };
}

export function markItemDismissed(
  state: RetentionUserState,
  itemType: PendingItemType,
): RetentionUserState {
  const next: RetentionUserState = { ...state, updatedAt: new Date() };
  switch (itemType) {
    case "unsent_apology":
      next.hasUnsentApology = false;
      next.unsentApologyCreatedAt = null;
      break;
    case "scheduled_apology":
      next.hasScheduledApology = false;
      next.scheduledDeliveryAt = null;
      break;
    case "cancelled_apology":
      next.hasCancelledApology = false;
      next.cancelledApologyAt = null;
      break;
    case "unread_received_apology":
      next.hasUnreadReceivedApology = false;
      next.receivedApologyAt = null;
      break;
    case "apology_read_no_response":
      next.apologyReadNoResponse = false;
      next.apologyReadAt = null;
      break;
    case "unsent_love_letter":
      next.hasUnsentLoveLetter = false;
      next.unsentLoveLetterAt = null;
      break;
    case "love_letter_sent_no_reaction":
      next.loveletterSentNoReaction = false;
      next.loveletterSentAt = null;
      break;
    case "unsent_confession":
      next.unsentConfessionAbandoned = false;
      next.confessionAbandonedAt = null;
      break;
    case "future_self_letter_approaching":
      next.hasFutureSelfLetterApproaching = false;
      next.futureLetterDeliveryAt = null;
      break;
  }
  return next;
}

// ─── V2.0: Notification Gate ────────────────────────────────────────────────────
//
// Rule 1: Max 1 per day
// Rule 2: Never 10PM – 7AM
// Rule 3: Never if user is active (isSessionActive)
// Rule 4: 48-hour same-type gap
// Rule 5: No manufactured urgency (enforced by copy library)
// Rule 6: No guilt (enforced by copy library)
// Rule 7: Crisis blocks all retention notifications

export function canSendNotification(
  type: NotificationType,
  state: NotificationState,
): boolean {
  // Rule 3: Never if session is active
  if (state.isSessionActive) return false;

  // Rule 7: Crisis blocks all retention types
  if (state.crisisInLast24h) return false;

  // Rule 2: Never between 10PM–10PM (22:00) and 7AM (07:00)
  const hour = new Date().getHours();
  if (hour < 7 || hour >= 22) return false;

  // Quiet mode gate
  if (state.quietModeEnabled && !QUIET_MODE_ALLOWED_TYPES.includes(type)) {
    return false;
  }

  // Rule 4: 48-hour same-type gap
  const lastSent = state.lastSentAtByType[type];
  if (lastSent && Date.now() - lastSent < 48 * 60 * 60 * 1000) return false;

  // Time window check
  const config = NOTIFICATION_CONFIGS[type];
  if (config.timeWindowStart < config.timeWindowEnd) {
    // normal window e.g. 9–12
    if (hour < config.timeWindowStart || hour >= config.timeWindowEnd)
      return false;
  }
  // carrying_awareness has 0–24 (always in-app, no window restriction)

  return true;
}

export function markNotificationSent(
  state: NotificationState,
  type: NotificationType,
): NotificationState {
  return {
    ...state,
    lastSentAtByType: {
      ...state.lastSentAtByType,
      [type]: Date.now(),
    },
  };
}
