# Veil — Quiet Moment

## Current State
Veil has: Companion Card, Emotion Check-In (5 stages with exhale screen), Emotion Feed, EmotionCard (4 variants), AuraWrapper (Emotion Aura). All live in App.tsx with tab navigation.

## Requested Changes (Diff)

### Add
- `QuietMomentScreen` component: full-screen post-emotion reflection screen
- Triggers after successful emotion post (source = emotion_checkin or write_tab), but NOT for companion_card source or when crisis_signal_detected = true
- Full message library per emotion type (4+ messages per emotion), visibility-aware variants
- Soft background using Emotion Aura color map at higher opacity (0.15–0.20 light, 0.20–0.25 dark)
- Animation sequence: background fade → emoji → label → divider → primary message → secondary message → "Stay here" link
- Auto-dismiss after 3.5s from secondary message appearance
- "Stay here a moment longer" → cancels timer, replaces with "I'm ready"
- Tap anywhere to dismiss (except Stay here link)
- Always navigates to Home Feed on dismiss
- Accessibility: screen reader announcements, min 16px text, WCAG AA contrast, auto-dismiss pauses for screen readers, reduce motion support

### Modify
- App.tsx: wire QuietMomentScreen into the post-emotion flow with source/crisis checks
- EmotionCheckIn.tsx: on successful post, signal source and crisis flag to trigger QuietMomentScreen

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/utils/quietMomentMessages.ts` — full message library keyed by emotion_type + visibility
2. Create `src/frontend/src/components/QuietMomentScreen.tsx` — full screen component with all animation, stay-here, accessibility logic
3. Wire into App.tsx: add state for quietMoment (emotion entry data), render QuietMomentScreen when active, dismiss → home feed
4. Update EmotionCheckIn.tsx to call back with source + crisis_signal_detected on successful post
