import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export type Time = bigint;
export interface LoveLetter {
    id: string;
    status: string;
    editLevel: string;
    nonVeilToken?: string;
    signature: string;
    deliveredAt?: bigint;
    aiVersionUsed: string;
    visualStyle: string;
    feltAt?: bigint;
    wordCount: bigint;
    journalEntryId?: string;
    createdAt: bigint;
    recipientContact?: string;
    aiAssisted: boolean;
    isAnonymous: boolean;
    openingLine: string;
    letterType: string;
    deliveryMethod: string;
    onThisDaySurfaced: boolean;
    deliveryTime?: bigint;
    recipientUserId?: Principal;
    crisisSignalDetected: boolean;
    closingLine: string;
    bodyText: string;
    visibility: string;
    recipientType: string;
    sharedWarmthTriggered: boolean;
    senderUserId: Principal;
    nonVeilTokenExpires?: bigint;
    openedAt?: bigint;
}
export interface Confession {
    id: string;
    apologyCreatedAfter: boolean;
    witnessResponseDelivered: boolean;
    content: string;
    deletionRequested: boolean;
    wordCount: bigint;
    userId: Principal;
    mode: string;
    createdAt: bigint;
    witnessOpened: boolean;
    onThisDaySurfaced: boolean;
    witnessResponse?: string;
    witnessUserId?: Principal;
    witnessNotified: boolean;
    crisisResourcesShown: boolean;
    crisisSignalDetected: boolean;
    hadVoiceComponent: boolean;
    apologyBridgeShown: boolean;
}
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
export interface SurfaceDelivery {
    id: string;
    deliveredAt?: Time;
    surfaceType: string;
    userId: Principal;
    createdAt: Time;
    deliveryStatus: string;
    scheduledForSessionAfter: Time;
    signalId: string;
    dismissed: boolean;
}
export interface SignificanceSignal {
    id: string;
    surfaceTypeUsed?: string;
    significanceScore: number;
    eligibleForReturnAfter: Time;
    userId: Principal;
    usedInSurface: boolean;
    rawEmotionIntensity: bigint;
    createdAt: Time;
    contextSnapshot: string;
    signalIntensity: number;
    rawEmotionType: string;
    returnedAt?: Time;
    signalType: string;
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
export interface QuickReleaseConfig {
    userId: Principal;
    platform: string;
    activationCount: bigint;
    setupDate?: bigint;
    setupCompleted: boolean;
    lastActivatedAt?: bigint;
    phrase: string;
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
export interface SignificantMomentsSettings {
    returnLetterEnabled: boolean;
    memoryMirrorEnabled: boolean;
    becomingMomentEnabled: boolean;
    userId: Principal;
    createdAt: Time;
    enabled: boolean;
    updatedAt: Time;
    milestoneHoldEnabled: boolean;
    frequency: string;
    whisperEnabled: boolean;
    peakSealEnabled: boolean;
}
export interface EmotionStreakRecord {
    acknowledgmentType?: string;
    emotionType: string;
    lastAwarenessShownAt?: bigint;
    updatedAt: bigint;
    crisisResourcesShown: boolean;
    lastAwarenessMilestone?: bigint;
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
export interface UserProfile {
    displayName: string;
}
export interface FutureLetterDelivery {
    id: string;
    writtenAt: Time;
    deliveredAt?: Time;
    deliveryTriggerJson: string;
    userId: Principal;
    deliveryStatus: string;
    overrideDate: Time;
    letterId: string;
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
    createConfession(mode: string, content: string, wordCount: bigint, hadVoiceComponent: boolean, witnessUserId: Principal | null, crisisSignalDetected: boolean, crisisResourcesShown: boolean): Promise<string>;
    createLoveLetter(letterType: string, openingLine: string, bodyText: string, closingLine: string, signature: string, wordCount: bigint, visualStyle: string, isAnonymous: boolean, aiAssisted: boolean, aiVersionUsed: string, editLevel: string, deliveryMethod: string, deliveryTime: bigint | null, recipientType: string, recipientContact: string | null, nonVeilToken: string | null, nonVeilTokenExpires: bigint | null, crisisSignalDetected: boolean): Promise<string>;
    deleteAllMyApologies(): Promise<boolean>;
    deleteAllMySignificanceData(): Promise<boolean>;
    deleteConfession(confessionId: string): Promise<boolean>;
    deleteJournalEntry(id: string): Promise<void>;
    deleteUnsentApology(apologyId: string): Promise<boolean>;
    dismissSurfaceDelivery(id: string): Promise<boolean>;
    getAllApologySenderIds(): Promise<Array<Principal>>;
    getAllJournalEntries(): Promise<Array<JournalEntry>>;
    getAllReflections(): Promise<Array<Reflection>>;
    getApologyById(apologyId: string): Promise<ApologyEntry | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanionDumps(): Promise<Array<CompanionDump>>;
    getConfessions(): Promise<Array<Confession>>;
    getEmotionEntries(): Promise<Array<EmotionEntry>>;
    getEmotionStreakRecord(emotionType: string): Promise<EmotionStreakRecord | null>;
    getFutureLetterDeliveries(): Promise<Array<FutureLetterDelivery>>;
    getInnerCircle(): Promise<Array<Principal>>;
    getLoveLettersBySender(): Promise<Array<LoveLetter>>;
    getMyApologies(): Promise<Array<ApologyEntry>>;
    getMyScheduledApologies(): Promise<Array<ApologySchedule>>;
    getMyUnsentApologies(): Promise<Array<ApologyEntry>>;
    getQuickReleaseConfig(platform: string): Promise<QuickReleaseConfig | null>;
    getReceivedApologies(): Promise<Array<ApologyEntry>>;
    getReceiverReflection(apologyId: string): Promise<ApologyReceiverReflection | null>;
    getSignificanceSignals(): Promise<Array<SignificanceSignal>>;
    getSignificantMomentsSettings(): Promise<SignificantMomentsSettings | null>;
    getStats(): Promise<Stats>;
    getSurfaceDeliveries(): Promise<Array<SurfaceDelivery>>;
    getTodaysDump(): Promise<CompanionDump | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVeilVoiceSettings(): Promise<VeilVoiceSettings | null>;
    isCallerAdmin(): Promise<boolean>;
    logQuickReleaseSession(platform: string, accessPoint: string, dumpType: string | null, dumpCompleted: boolean, sessionDuration: bigint | null, returnedTo: string): Promise<string>;
    markFutureLetterDelivered(id: string): Promise<boolean>;
    markSurfaceDelivered(id: string, surfaceType: string): Promise<boolean>;
    recordSignificanceSignal(signalType: string, signalIntensity: number, rawEmotionType: string, rawEmotionIntensity: bigint, contextSnapshot: string, eligibleForReturnAfterDays: bigint): Promise<string>;
    recordSurfaceDelivery(signalId: string, surfaceType: string, scheduledForSessionAfter: Time): Promise<string>;
    rescheduleApology(apologyId: string, newDeliveryTime: bigint): Promise<boolean>;
    saveApologyAsUnsent(apologyId: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCompanionDump(contentType: string, textContent: string | null, voiceDurationSeconds: bigint | null, crisisSignalDetected: boolean, crisisResourcesShown: boolean, exhaleMessageShown: string, streakDay: bigint): Promise<string>;
    saveEmotionEntry(emotionType: string, emotionLabel: string, emoji: string, customEmotionLabel: string | null, textReflection: string | null, voiceDurationSeconds: bigint | null, visibilityLevel: string, voiceOverrideApplied: boolean, aiPromptShown: boolean, aiPromptText: string | null, crisisSignalDetected: boolean, crisisResourcesShown: boolean, exhaleMessageShown: string): Promise<string>;
    saveEmotionStreakRecord(emotionType: string, lastAwarenessMilestone: bigint | null, acknowledgmentType: string | null, crisisResourcesShown: boolean): Promise<void>;
    saveFutureLetterDelivery(letterId: string, deliveryTriggerJson: string, overrideDays: bigint): Promise<string>;
    saveLoveLetterReaction(letterId: string, reactionType: string, replyLetterId: string | null): Promise<boolean>;
    saveQuickReleaseConfig(platform: string, phrase: string, setupCompleted: boolean): Promise<boolean>;
    saveReceiverReflection(apologyId: string, emotionSelected: string, privateReflectionText: string | null, actionTaken: string): Promise<boolean>;
    saveSignificantMomentsSettings(enabled: boolean, whisperEnabled: boolean, memoryMirrorEnabled: boolean, returnLetterEnabled: boolean, becomingMomentEnabled: boolean, milestoneHoldEnabled: boolean, peakSealEnabled: boolean, frequency: string): Promise<void>;
    saveVeilVoiceSettings(voice_enabled: boolean, after_voice_dump: boolean, after_text_dump: boolean, after_silent_dump: boolean, morning_follow_up: boolean, carrying_awareness: boolean, after_checkin: boolean, onboarding_completed: boolean): Promise<void>;
    saveWitnessResponse(confessionId: string, responseType: string): Promise<boolean>;
    scheduleApology(apologyId: string, recipientUserId: Principal | null, recipientType: string, recipientContact: string | null, deliveryTime: bigint): Promise<boolean>;
    scheduleLoveLetter(letterId: string, scheduledDeliveryTime: bigint, deliveryType: string): Promise<boolean>;
    sendApologyNow(apologyId: string, recipientUserId: Principal | null, recipientType: string, recipientContact: string | null): Promise<boolean>;
    updateApologyContent(apologyId: string, content: string, editLevel: string): Promise<boolean>;
    updateSignificanceScore(id: string, score: number): Promise<boolean>;
}
