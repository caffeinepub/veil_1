// ─── Journal Extensions — localStorage data layer for v1.2 ──────────────────

export interface Bookmark {
  pageId: string;
  bookmarkedAt: string;
}

export interface TurningPoint {
  pageId: string;
  markedAt: string;
  note?: string;
}

export interface DedicationEntry {
  text: string;
  writtenAt: string;
}

export interface JournalDedication {
  dedications: DedicationEntry[];
}

export interface PersonLabel {
  id: string;
  labelName: string;
  firstEntryDate: string;
  lastEntryDate: string;
  entryCount: number;
  dominantEmotion: string;
}

export interface JournalVolume {
  id: string;
  name: string;
  dateStarted: string;
  dateClosed?: string;
  isCurrent: boolean;
  dominantEmotion: string;
  totalPages: number;
}

export interface TuckedLetterMeta {
  id: string;
  pageId: string;
  recipient: string;
  deliveryCondition:
    | "SPECIFIC_DATE"
    | "ON_DEMAND"
    | "LEGACY"
    | "PRIVATE_FOREVER";
  deliveryDate?: string;
  writtenAt: string;
}

export interface VoiceJournalEntry {
  id: string;
  title?: string;
  duration: number;
  emotionType: string;
  audioDataUrl?: string;
  waveformPoints: number[];
  createdAt: string;
}

export interface SoundSettings {
  pageTurnEnabled: boolean;
  ambientEnabled: boolean;
  ambientVolume: number;
}

export const BOOKMARKS_KEY = "journal_bookmarks";
export const TURNING_POINTS_KEY = "journal_turning_points";
export const DEDICATION_KEY = "journal_dedication";
export const PERSON_LABELS_KEY = "journal_person_labels";
export const PAGE_PEOPLE_KEY = "journal_page_people";
export const VOLUMES_KEY = "journal_volumes";
export const TUCKED_LETTERS_KEY = "journal_tucked_letters";
export const VOICE_ENTRIES_KEY = "journal_voice_entries";
export const SOUND_SETTINGS_KEY = "journal_sound_settings";
export const LEGACY_CONTACT_KEY = "journal_legacy_contact";
export const DEDICATION_PROMPT_SEEN_KEY = "journal_dedication_prompt_seen";

function load<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* */
  }
  return def;
}

function save(key: string, val: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* */
  }
}

export function loadBookmarks(): Record<string, boolean> {
  return load<Record<string, boolean>>(BOOKMARKS_KEY, {});
}

export function toggleBookmark(pageId: string): Record<string, boolean> {
  const current = loadBookmarks();
  if (current[pageId]) {
    delete current[pageId];
  } else {
    current[pageId] = true;
  }
  save(BOOKMARKS_KEY, current);
  return current;
}

export function loadTurningPoints(): Record<string, TurningPoint> {
  return load<Record<string, TurningPoint>>(TURNING_POINTS_KEY, {});
}

export function saveTurningPoint(
  pageId: string,
  note?: string,
): Record<string, TurningPoint> {
  const current = loadTurningPoints();
  current[pageId] = { pageId, markedAt: new Date().toISOString(), note };
  save(TURNING_POINTS_KEY, current);
  return current;
}

export function removeTurningPoint(
  pageId: string,
): Record<string, TurningPoint> {
  const current = loadTurningPoints();
  delete current[pageId];
  save(TURNING_POINTS_KEY, current);
  return current;
}

export function loadDedication(): JournalDedication {
  return load<JournalDedication>(DEDICATION_KEY, { dedications: [] });
}

export function saveDedicationEntry(text: string): JournalDedication {
  const current = loadDedication();
  current.dedications.push({ text, writtenAt: new Date().toISOString() });
  save(DEDICATION_KEY, current);
  return current;
}

export function loadPersonLabels(): PersonLabel[] {
  return load<PersonLabel[]>(PERSON_LABELS_KEY, []);
}

export function savePersonLabels(labels: PersonLabel[]): void {
  save(PERSON_LABELS_KEY, labels);
}

export function loadPagePeople(): Record<string, string[]> {
  return load<Record<string, string[]>>(PAGE_PEOPLE_KEY, {});
}

export function savePagePeople(data: Record<string, string[]>): void {
  save(PAGE_PEOPLE_KEY, data);
}

export function loadVolumes(): JournalVolume[] {
  return load<JournalVolume[]>(VOLUMES_KEY, []);
}

export function saveVolumes(volumes: JournalVolume[]): void {
  save(VOLUMES_KEY, volumes);
}

export function loadTuckedLetters(): TuckedLetterMeta[] {
  return load<TuckedLetterMeta[]>(TUCKED_LETTERS_KEY, []);
}

export function saveTuckedLetters(letters: TuckedLetterMeta[]): void {
  save(TUCKED_LETTERS_KEY, letters);
}

export function loadVoiceEntries(): VoiceJournalEntry[] {
  return load<VoiceJournalEntry[]>(VOICE_ENTRIES_KEY, []);
}

export function saveVoiceEntries(entries: VoiceJournalEntry[]): void {
  save(VOICE_ENTRIES_KEY, entries);
}

export function loadSoundSettings(): SoundSettings {
  return load<SoundSettings>(SOUND_SETTINGS_KEY, {
    pageTurnEnabled: false,
    ambientEnabled: false,
    ambientVolume: 0.1,
  });
}

export function saveSoundSettings(settings: SoundSettings): void {
  save(SOUND_SETTINGS_KEY, settings);
}

export function loadLegacyContact(): string {
  return load<string>(LEGACY_CONTACT_KEY, "");
}

export function saveLegacyContact(contact: string): void {
  save(LEGACY_CONTACT_KEY, contact);
}

/** Generate a visually pleasing waveform from seed (not real audio analysis) */
export function generateWaveformPoints(seed: string, count = 60): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  const points: number[] = [];
  let cur = 0.5;
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    const rnd = (h >>> 0) / 0xffffffff - 0.5;
    cur = Math.max(0.05, Math.min(0.95, cur + rnd * 0.25));
    points.push(cur);
  }
  return points;
}
