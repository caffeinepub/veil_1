# Veil — My Journal Ten Depth Additions (Version 1.2)

## Current State

Veil has a fully implemented My Journal tab (v1.1) with:
- Leather cover with royal signature, page-turn animations, emotion aura tinting
- Full book experience: swipe navigation, Timeline Spine, Table of Contents
- Seasonal Navigation Architecture: Year → Season → Month → Week → Day → Entry hierarchy
- SeasonalNavigator.tsx component with Quick Jump, Seasonal Reflection
- journalData.ts aggregating entries from all backend sources
- seasonalData.ts with hierarchy building and reflection generation
- Voice system (VeilVoiceContext, VeilVoiceOverlay) with pre-rendered scripts
- Settings: font, font size, emotion colors, Journal Lock, screenshot warning, export, delete

## Requested Changes (Diff)

### Add

1. **Voice Journal Entries** — Dedicated voice recording mode within My Journal. Recordings saved permanently encrypted. Journal page shows waveform visualization in emotion aura color + play button. Entry point: Write Tab → Voice mode, or Journal → New Entry → Voice Journal. Recording UI: dark warm aesthetic, candle-flame animation responding to voice. After stop: Keep/Listen back/Add title/Discard. Page type: "Voice Journal Entry".

2. **Dedication Page** — First page of the Journal (page "i", Roman numeral). Appears after signature reveal on first open. Decorative gold ornamental border. Shows dedication text, written date, user's royal signature. Can be updated (all versions preserved with dates). Accessible from Journal Cover → Dedication anytime.

3. **Bookmarks** — Long-press any journal page → action menu with Bookmark. Gold ribbon visual at top-right corner. Bookmarked Pages collection in Table of Contents. Gold dots on Timeline Spine for bookmarked pages.

4. **People in the Journal** — Private person labels (not Veil usernames) added to entries. Person Library in Settings → Journal → People. "By Person" section in Table of Contents showing all entries per person as a mini-journal. Optional AI person detection (OFF by default).

5. **Physical Fullness of the Book** — Visual cover aging and spine thickening based on page count thresholds (0-50, 51-150, 151-300, 301-500, 500+). CSS/SVG filter overlays for leather wear marks at corners. Spine width grows imperceptibly with entries. Special notification at 500 pages.

6. **Turning Point Marker** — Long-press any page → "Mark as turning point". Gold star at top-left corner. Optional retrospective note (max 100 words) appended below original entry with ornamental separator. Turning Points collection in Table of Contents. Gold star dots on Timeline Spine. Veil voice moment on marking.

7. **Letters Tucked for the Future** — Special journal entry type with envelope visual/corner fold. Written for a specific person/future self. Delivery conditions: Specific date, On demand, Legacy (when I'm gone), Private forever. Legacy feature: designate one trusted Legacy Contact (Inner Circle member or email). Letters for the Future collection in Table of Contents.

8. **Journal Volumes** — Auto-suggest closing a volume after one year. User names the volume. Volume Shelf view showing completed volumes as physical books with spine color = dominant emotion. Current volume slightly taller/active. Completed volumes read-only (only turning point notes and bookmarks addable). Volume Cover Page auto-generated on close.

9. **Emotional Arc Context Per Entry** — Slim horizontal strip at bottom of every journal page showing 30 colored dots (15 days before/after current entry day). Current day dot slightly larger with triangle indicator. Tap strip to expand to 60 days, tappable dots jump to that day.

10. **Ambient Sound While Reading** — Optional: page turn sound (paper rustle on swipe). Optional: seasonal reading ambient (birdsong/breeze for Spring, warm afternoon for Summer, fireplace for Fall, quiet stillness for Winter). Season matches the ENTRY DATE season, not current season. Max volume 30%. All OFF by default. Settings → Journal → Ambient Sound.

**Updated Table of Contents sections**: Browse by Volume added; Bookmarked Pages, Turning Points, Letters for the Future collections added; By Person section added.

**New data structures**: is_bookmarked, is_turning_point, turning_point_note, is_tucked_letter, tucked_for, tucked_delivery_condition, is_voice_entry, voice_entry_duration, person_labels fields on journal_pages. New tables: journal_volumes, journal_person_labels, journal_legacy_contacts, journal_dedication.

**Three new voice moments**: D (Volume Closure), E (Turning Point Mark), F (Dedication Written).

**Updated journal settings**: DISPLAY (font, size, emotion colors, Book Aging, Spine Growth), SOUND (Page Turn Sound, Reading Ambient, Ambient Volume slider), PRIVACY (Journal Lock, Screenshot Warning, Legacy Contact), PEOPLE (Manage People Labels, AI Person Detection), VOLUMES (Current Volume name, Close this Volume, View all Volumes), NOTIFICATIONS, DATA.

### Modify

- **MyJournalTab.tsx**: Add volume shelf view, dedication page rendering, long-press menus on pages, ambient sound system, context strip on each page, volume management UI, updated settings panel.
- **journalData.ts**: Add fields for bookmarks, turning points, tucked letters, voice entries, person labels, volume assignment.
- **TableOfContentsDrawer.tsx** (or equivalent in MyJournalTab): Add new TOC sections: By Volume, Bookmarked Pages, Turning Points, Letters for the Future, By Person.
- **voiceScripts.ts**: Add three new voice moments (D, E, F).
- **seasonalData.ts**: Keep intact; no structural changes needed.

### Remove

- Nothing removed.

## Implementation Plan

1. Update `voiceScripts.ts` to add moments D, E, F.
2. Update `journalData.ts` to add new fields (bookmarks, turning points, tucked letters, voice entries, person labels, volume, dedication) and data structures.
3. Create `VolumeShelf.tsx` — the bookshelf view showing all volumes as physical books.
4. Create `DedicationPage.tsx` — the first page "i" with gold ornamental border, dedication text editor.
5. Create `JournalContextStrip.tsx` — 30-dot emotional arc strip rendered at bottom of each page.
6. Create `AmbientSoundSystem.tsx` or inline ambient sound logic — page turn sounds, seasonal ambient audio, settings controls.
7. Update `MyJournalTab.tsx` to wire all ten additions: voice recording mode, dedication page, bookmarks (long-press menu + ribbon), people labels, cover aging/spine growth CSS, turning point markers, tucked letter pages, volume shelf, context strip, ambient sound.
8. Update Table of Contents to include new collections and By Person section.
9. Validate and build.
