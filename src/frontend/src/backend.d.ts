import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Stats {
    totalEntries: bigint;
    moodFrequency: Array<[string, bigint]>;
    currentStreak: bigint;
}
export interface Reflection {
    id: string;
    response: string;
    timestamp: Time;
    prompt: string;
}
export interface ApologyReceiverReflection {
    id: string;
    completedAt?: bigint;
    emotionSelected: string;
    receiverUserId: Principal;
    journalEntryId?: string;
    createdAt: bigint;
    privateReflectionText?: string;
    apologyId: string;
    actionTaken: string;
    reflectionComplete: boolean;
}
export interface VeilVoiceSettings {
    moments_enabled: VeilVoiceMomentsEnabled;
    onboarding_completed: boolean;
    voice_enabled: boolean;
}
export interface VeilVoiceMomentsEnabled {
    after_checkin: boolean;
    carrying_awareness: boolean;
    after_silent_dump: boolean;
    after_text_dump: boolean;
    after_voice_dump: boolean;
    morning_follow_up: boolean;
}
export interface JournalEntry {
    id: string;
    title: string;
    body: string;
    mood: string;
    timestamp: Time;
}
export interface ApologyEntry {
    id: string;
    status: string;
    editLevel: string;
    nonVeilToken?: string;
    signature: string;
    emotionType: string;
    sharedSilenceTriggered: boolean;
    content: string;
    deliveredAt?: bigint;
    acknowledgedAt?: bigint;
    aiVersionUsed: string;
    source: string;
    createdAt: bigint;
    recipientContact?: string;
    aiAssisted: boolean;
    isAnonymous: boolean;
    deliveryMethod: string;
    deliveryTime?: bigint;
    recipientUserId?: Principal;
    rescheduleCount: bigint;
    crisisSignalDetected: boolean;
    visibility: string;
    recipientType: string;
    senderUserId: Principal;
    nonVeilTokenExpires?: bigint;
    openedAt?: bigint;
}
export interface EmotionEntry {
    id: string;
    emotionType: string;
    aiPromptText?: string;
    customEmotionLabel?: string;
    voiceDurationSeconds?: bigint;
    source: string;
    emotionLabel: string;
    exhaleMessageShown: string;
    createdAt: Time;
    emoji: string;
    crisisResourcesShown: boolean;
    crisisSignalDetected: boolean;
    visibilityLevel: string;
    aiPromptShown: boolean;
    textReflection?: string;
    voiceOverrideApplied: boolean;
}
export interface CompanionDump {
    id: string;
    releasedPermanently: boolean;
    voiceDurationSeconds?: bigint;
    contentType: string;
    source: string;
    exhaleMessageShown: string;
    createdAt: Time;
    crisisResourcesShown: boolean;
    crisisSignalDetected: boolean;
    streakDay: bigint;
    visibility: string;
    audioStored: boolean;
    textContent?: string;
}
export interface EmotionStreakRecord {
    acknowledgmentType?: string;
    emotionType: string;
    lastAwarenessShownAt?: bigint;
    updatedAt: bigint;
    crisisResourcesShown: boolean;
    lastAwarenessMilestone?: bigint;
}
export interface UserProfile {
    displayName: string;
}
export interface ApologySchedule {
    id: string;
    status: string;
    deliveredAt?: bigint;
    apologyId: string;
    rescheduleCount: bigint;
    cancelledAt?: bigint;
    scheduledDeliveryTime: bigint;
    reminderSent: boolean;
    reminderSentAt?: bigint;
    senderUserId: Principal;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acknowledgeApologyOpened(apologyId: string): Promise<boolean>;
    addJournalEntry(title: string, body: string, mood: string): Promise<string>;
    addReflection(prompt: string, response: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelApologySchedule(apologyId: string): Promise<boolean>;
    createApology(content: string, signature: string, emotionType: string, isAnonymous: boolean, aiAssisted: boolean, aiVersionUsed: string, source: string, crisisSignalDetected: boolean): Promise<string>;
    deleteAllMyApologies(): Promise<boolean>;
    deleteJournalEntry(id: string): Promise<void>;
    deleteUnsentApology(apologyId: string): Promise<boolean>;
    getAllApologySenderIds(): Promise<Array<Principal>>;
    getAllJournalEntries(): Promise<Array<JournalEntry>>;
    getAllReflections(): Promise<Array<Reflection>>;
    getApologyById(apologyId: string): Promise<ApologyEntry | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanionDumps(): Promise<Array<CompanionDump>>;
    getEmotionEntries(): Promise<Array<EmotionEntry>>;
    getEmotionStreakRecord(emotionType: string): Promise<EmotionStreakRecord | null>;
    getInnerCircle(): Promise<Array<Principal>>;
    getMyApologies(): Promise<Array<ApologyEntry>>;
    getMyScheduledApologies(): Promise<Array<ApologySchedule>>;
    getMyUnsentApologies(): Promise<Array<ApologyEntry>>;
    getReceivedApologies(): Promise<Array<ApologyEntry>>;
    getReceiverReflection(apologyId: string): Promise<ApologyReceiverReflection | null>;
    getStats(): Promise<Stats>;
    getTodaysDump(): Promise<CompanionDump | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVeilVoiceSettings(): Promise<VeilVoiceSettings | null>;
    isCallerAdmin(): Promise<boolean>;
    rescheduleApology(apologyId: string, newDeliveryTime: bigint): Promise<boolean>;
    saveApologyAsUnsent(apologyId: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCompanionDump(contentType: string, textContent: string | null, voiceDurationSeconds: bigint | null, crisisSignalDetected: boolean, crisisResourcesShown: boolean, exhaleMessageShown: string, streakDay: bigint): Promise<string>;
    saveEmotionEntry(emotionType: string, emotionLabel: string, emoji: string, customEmotionLabel: string | null, textReflection: string | null, voiceDurationSeconds: bigint | null, visibilityLevel: string, voiceOverrideApplied: boolean, aiPromptShown: boolean, aiPromptText: string | null, crisisSignalDetected: boolean, crisisResourcesShown: boolean, exhaleMessageShown: string): Promise<string>;
    saveEmotionStreakRecord(emotionType: string, lastAwarenessMilestone: bigint | null, acknowledgmentType: string | null, crisisResourcesShown: boolean): Promise<void>;
    saveReceiverReflection(apologyId: string, emotionSelected: string, privateReflectionText: string | null, actionTaken: string): Promise<boolean>;
    saveVeilVoiceSettings(voice_enabled: boolean, after_voice_dump: boolean, after_text_dump: boolean, after_silent_dump: boolean, morning_follow_up: boolean, carrying_awareness: boolean, after_checkin: boolean, onboarding_completed: boolean): Promise<void>;
    scheduleApology(apologyId: string, recipientUserId: Principal | null, recipientType: string, recipientContact: string | null, deliveryTime: bigint): Promise<boolean>;
    sendApologyNow(apologyId: string, recipientUserId: Principal | null, recipientType: string, recipientContact: string | null): Promise<boolean>;
    updateApologyContent(apologyId: string, content: string, editLevel: string): Promise<boolean>;
}
