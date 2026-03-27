# Veil — Seasonal Navigation Architecture (Version 1.1)

## Current State

My Journal (Version 1.0) is live with:
- Full book metaphor: leather cover, page-turn animations, royal signature
- All page types auto-populated from Home + Write tabs
- Table of Contents, Timeline Spine, Search, On This Day
- Monthly Letters, Milestone Pages, Settings panel
- `journalData.ts` builds `JournalPage[]` sorted chronologically
- `MyJournalTab.tsx` manages views: cover | signature_reveal | pages | settings | empty

## Requested Changes (Diff)

### Add
- `seasonalData.ts` — utility library: getSeason(), getWeekOfYear(), buildSeasonalIndex(), getSeasonalCoverData(), generateSeasonalReflection()
- `SeasonalNavigator.tsx` — full 6-level seasonal navigation hierarchy:
  - Year View (year cards with seasonal color bars, dominant emotion, density opacity)
  - Season View (expands within year card — 4 season cards, emotion dot strips, first-line previews, empty season acknowledgment)
  - Month View (3 month cards per season, week indicator blocks, emotion dots)
  - Week View (week cards with 7 day-circles M–S, pie-split multi-emotion circles)
  - Day View (full date header, entry thumbnails, day emotional summary)
  - Season Cover Page (full-richness season backgrounds, epigraph, signature, entry count)
  - Quick Jump bar (season + year pickers, 0.8s page-flutter animation)
  - Seasonal Reflection (generated witness letter from Veil, per season)
- Hemisphere setting in Journal Settings panel
- "Browse by season →" button on Journal Cover below stats
- `season`, `seasonYear`, `weekOfYear` enrichment on JournalPage objects

### Modify
- `journalData.ts` — add `season`, `seasonYear`, `weekOfYear` fields to `JournalPage` type; export `enrichPagesWithSeasonalData()`
- `MyJournalTab.tsx` — add `'seasonal_navigator'` to `JournalView` type; wire "Browse by season →" button; render SeasonalNavigator; handle `onOpenPage` callback; add hemisphere to settings

### Remove
- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/lib/seasonalData.ts` with all seasonal utilities
2. Create `src/frontend/src/components/SeasonalNavigator.tsx` with full hierarchy UI
3. Update `src/frontend/src/lib/journalData.ts` — add seasonal fields to JournalPage type
4. Update `src/frontend/src/components/MyJournalTab.tsx` — integrate navigator, hemisphere setting, browse button
5. Validate and deploy
