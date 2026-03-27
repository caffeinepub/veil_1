import type React from "react";
import { createContext, useContext, useState } from "react";

export type PendingItemType =
  | "unsent_apology"
  | "scheduled_apology"
  | "cancelled_apology"
  | "unread_received_apology"
  | "apology_read_no_response"
  | "unsent_love_letter"
  | "love_letter_sent_no_reaction"
  | "unsent_confession"
  | "future_self_letter_approaching";

export interface RetentionUserState {
  userId: string;
  hasUnsentApology: boolean;
  unsentApologyCreatedAt: Date | null;
  hasScheduledApology: boolean;
  scheduledDeliveryAt: Date | null;
  hasCancelledApology: boolean;
  cancelledApologyAt: Date | null;
  hasUnreadReceivedApology: boolean;
  receivedApologyAt: Date | null;
  apologyReadNoResponse: boolean;
  apologyReadAt: Date | null;
  hasUnsentLoveLetter: boolean;
  unsentLoveLetterAt: Date | null;
  loveletterSentNoReaction: boolean;
  loveletterSentAt: Date | null;
  unsentConfessionAbandoned: boolean;
  confessionAbandonedAt: Date | null;
  hasFutureSelfLetterApproaching: boolean;
  futureLetterDeliveryAt: Date | null;
  lastNotificationSentAt: Date | null;
  lastNotificationType: string | null;
  daysSinceLastSession: number;
  lastEmotionCategory: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | null;
  patternDetected: string | null;
  patternDetectedAt: Date | null;
  crisisInLast24h: boolean;
  updatedAt: Date;
}

const now = new Date();
const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

export const defaultRetentionState: RetentionUserState = {
  userId: "demo-user-001",
  hasUnsentApology: true,
  unsentApologyCreatedAt: eightHoursAgo,
  hasScheduledApology: false,
  scheduledDeliveryAt: null,
  hasCancelledApology: false,
  cancelledApologyAt: null,
  hasUnreadReceivedApology: false,
  receivedApologyAt: null,
  apologyReadNoResponse: false,
  apologyReadAt: null,
  hasUnsentLoveLetter: false,
  unsentLoveLetterAt: null,
  loveletterSentNoReaction: false,
  loveletterSentAt: null,
  unsentConfessionAbandoned: false,
  confessionAbandonedAt: null,
  hasFutureSelfLetterApproaching: false,
  futureLetterDeliveryAt: null,
  lastNotificationSentAt: null,
  lastNotificationType: null,
  daysSinceLastSession: 1,
  lastEmotionCategory: "NEGATIVE",
  patternDetected: null,
  patternDetectedAt: null,
  crisisInLast24h: false,
  updatedAt: now,
};

export function getHighestPriorityPendingItem(
  state: RetentionUserState,
): PendingItemType | null {
  // 1. Scheduled apology with delivery within 24h
  if (state.hasScheduledApology && state.scheduledDeliveryAt) {
    const msUntil = state.scheduledDeliveryAt.getTime() - Date.now();
    if (msUntil > 0 && msUntil <= 24 * 60 * 60 * 1000) {
      return "scheduled_apology";
    }
  }
  // 2. Unread received apology
  if (state.hasUnreadReceivedApology) return "unread_received_apology";
  // 3. Unsent apology
  if (state.hasUnsentApology) return "unsent_apology";
  // 4. Apology read, no response
  if (state.apologyReadNoResponse) return "apology_read_no_response";
  // 5. Cancelled apology
  if (state.hasCancelledApology) return "cancelled_apology";
  // 6. Unsent love letter
  if (state.hasUnsentLoveLetter) return "unsent_love_letter";
  // 7. Love letter sent, no reaction
  if (state.loveletterSentNoReaction) return "love_letter_sent_no_reaction";
  // 8. Unsent confession (abandoned)
  if (state.unsentConfessionAbandoned) return "unsent_confession";
  // 9. Future self-letter approaching
  if (state.hasFutureSelfLetterApproaching)
    return "future_self_letter_approaching";
  return null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

type RetentionStateContextValue = [
  RetentionUserState,
  React.Dispatch<React.SetStateAction<RetentionUserState>>,
];

const RetentionStateContext = createContext<RetentionStateContextValue | null>(
  null,
);

export function RetentionStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<RetentionUserState>(defaultRetentionState);
  return (
    <RetentionStateContext.Provider value={[state, setState]}>
      {children}
    </RetentionStateContext.Provider>
  );
}

export function useRetentionState(): RetentionStateContextValue {
  const ctx = useContext(RetentionStateContext);
  if (!ctx) {
    throw new Error(
      "useRetentionState must be used within RetentionStateProvider",
    );
  }
  return ctx;
}
