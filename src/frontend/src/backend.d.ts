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
export interface JournalEntry {
    id: string;
    title: string;
    body: string;
    mood: string;
    timestamp: Time;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addJournalEntry(title: string, body: string, mood: string): Promise<string>;
    addReflection(prompt: string, response: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteJournalEntry(id: string): Promise<void>;
    getAllJournalEntries(): Promise<Array<JournalEntry>>;
    getAllReflections(): Promise<Array<Reflection>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanionDumps(): Promise<Array<CompanionDump>>;
    getProfile(): Promise<UserProfile | null>;
    getStats(): Promise<Stats>;
    getTodaysDump(): Promise<CompanionDump | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCompanionDump(contentType: string, textContent: string | null, voiceDurationSeconds: bigint | null, crisisSignalDetected: boolean, crisisResourcesShown: boolean, exhaleMessageShown: string, streakDay: bigint): Promise<string>;
    updateProfile(displayName: string): Promise<void>;
}
