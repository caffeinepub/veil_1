# Veil — Profile Tab v2.0

## Current State

The Profile tab currently exists as an inline `ProfileTab()` function inside `App.tsx`. It renders:
- Basic avatar + name edit
- Simple 3-column stats (Entries, Streak, Top Mood)
- Mood history bar chart
- Apology history (sent/received/unsent)
- Letters section (static placeholder UI)
- Private Confessions entry point
- EI Settings Panel
- Quick Release Settings
- Voice Settings Panel

This is the placeholder profile — not the full identity experience described in the spec.

## Requested Changes (Diff)

### Add
- `ProfileTab.tsx` as a standalone component (extracted from App.tsx + massively expanded)
- **Section 1 — Profile Header**: aura background (dominant emotion color at 15% opacity), circular avatar with monogram fallback, Playfair Display name, royal SVG signature in gold (#E8C060), emotional identity tags (3 words separated by · dots), dynamic/static tagline, gear icon (Settings), share icon (top left)
- **Section 2 — Emotional Stats**: 4 stat cards — Moments Captured, Inner Circle count, Support Given ("You have shown up X times"), Expressions Made
- **Section 3 — Becoming**: full-width card with aura bg at 12% opacity, italic gold serif generated line ("You have been becoming..."), "Updated quarterly" footer, private to owner only
- **Section 4 — Emotional Compass Preview**: compact card showing compass needle SVG (hand-drawn aesthetic), one narrative line, "See your full direction →" link that navigates to Reflections tab
- **Section 5 — Life Chapters Bookshelf**: horizontal scrollable shelf, each completed volume as a spine with vertical text, width proportional to page count, spine color = dominant emotion aura, current volume shown as open book at right end, tap spine navigates to Journal tab
- **Section 6 — Emotional Timeline**: view switcher (Daily/Weekly/Monthly), cards with left emotion aura color bar, visibility badges, voice playback button if applicable, monthly view has calendar grid + warm narrative, NO percentages ever
- **Section 7 — Support Given**: full-width warm card (owner only) showing "X times you sent support", love letters written, apologies made, times as witness
- **Section 8 — Inner Circle**: entry card with member count, tap opens full-screen Inner Circle Dashboard with 3 sections: Members (Cousins + Closest Friends horizontal scroll, Add Member button), Emotional Signals (sorted by distress first, support reaction buttons), Shared With You (count + open-each-one flow)
- **Section 9 — Settings**: full-screen settings panel (11 sections) with all toggles as specified: Profile, Account & Security, Quick Release, Notifications, Privacy & Visibility, Emotional Intelligence, Veil Voice, Journal, Reflections, Inner Circle, Support & Legal
- Profile data stored in localStorage keys: `veil-profile-data`, `veil-inner-circle`, `veil-emotional-timeline`, `veil-support-given`
- Voice System moments: first profile open, becoming line update, first volume completed

### Modify
- `App.tsx`: remove inline `ProfileTab()` function, import `ProfileTab` from `./components/ProfileTab`, pass `onNavigate` prop so compass preview can navigate to Reflections and bookshelf can navigate to Journal

### Remove
- Inline `ProfileTab` function from `App.tsx`
- Old mood history percentage bars from Profile (moved to Journal/Reflections)
- Streak counter from Profile stats (Rule 1 — NO GAMIFICATION)

## Implementation Plan

1. Create `src/frontend/src/components/ProfileTab.tsx` with all 9 sections as described
2. Use `generateSignature` from `../lib/signatureGenerator` for the royal signature SVG
3. Use `AURA_COLOR_MAP` from `../utils/auraColors` for emotion-based background colors
4. Use `buildCompassState` from `../lib/reflectionsEngine` for compass preview data
5. Read journal volumes from localStorage key `journal_volumes` (from journalExtensions)
6. Profile data persisted in localStorage (`veil-profile-data`)
7. Inner Circle data in localStorage (`veil-inner-circle`)
8. Timeline entries synthesized from existing journal/checkin data in localStorage
9. Settings panel rendered as a full-screen sheet over the profile
10. Inner Circle Dashboard rendered as a full-screen overlay
11. Update `App.tsx` to use the new `ProfileTab` component with `onNavigate` prop
