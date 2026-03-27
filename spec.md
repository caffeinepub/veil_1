# Veil — Positive Emotion Celebration Flow

## Current State

Veil is a production-grade emotional wellbeing app (Version 14). The Emotional Intelligence Engine is live with a full Negative Emotion Transformation Arc (4 phases: Release, Calm, Ground, Rebuild). The emotion detection engine (`lib/emotionDetection.ts`) already returns `emotion_category: "POSITIVE"` with a generic `POSITIVE` emotion_type, but the `handleDumpComplete` in `App.tsx` only routes NEGATIVE detections to the TransformationArcFlow. POSITIVE and NEUTRAL both fall through with no adaptive response.

Key files:
- `src/frontend/src/lib/emotionDetection.ts` — detection engine (needs expanded positive type support)
- `src/frontend/src/App.tsx` — routes dump results to flows (needs positive routing)
- `src/frontend/src/components/TransformationArcFlow.tsx` — existing negative arc (must NOT be modified)
- `src/frontend/src/components/EIConsentModal.tsx` — existing consent (reuse, do NOT modify)
- `src/frontend/src/components/EISettingsPanel.tsx` — settings panel (extend with positive settings)

## Requested Changes (Diff)

### Add

1. **`lib/positiveEmotionDetection.ts`** — Extended positive detection layer:
   - Detects 12 specific positive emotion types: HAPPY, GRATEFUL, HOPEFUL, EXCITED, LOVED, CALM, PROMOTION, NEW_RELATIONSHIP, MARRIAGE, ENGAGEMENT, HONEYMOON, BIRTH_OF_CHILD, PERSONAL_ACHIEVEMENT
   - Assigns milestone_level: EVERYDAY | SIGNIFICANT | LIFE
   - Returns `PositiveDetectionResult { emotion_type, milestone_level, intensity, confidence }`
   - If base detection returns POSITIVE with confidence >= 0.65, run fine-grained classification
   - Keyword maps for each specific type (promotion/career, baby/born/child, married/wedding, etc.)
   - Falls back to HAPPY if positive but no specific type matched

2. **`components/CelebrationFlow.tsx`** — Full Positive Emotion Celebration Flow:
   - **Celebration Screen**: Replaces exhale — warm gold/amber background by milestone level, upward-moving particle animations (confetti for EVERYDAY, expanding rings for SIGNIFICANT, radiant sunrise for LIFE), emotion-specific voice messages, 5-8s duration
   - **Phase 1 — Feel It Fully**: 60-second presence timer (gentle, non-pressuring), warm ambient pulse, tap to pause, skip available (delayed 30s for LIFE milestones only)
   - **Phase 2 — Capture It**: Option to write a letter to self OR record voice OR skip. Writing opens a self-love letter composer with pre-filled opening line, warm prompts, and delivery scheduling (3 months / 6 months / 1 year / hard day / custom date). Voice capture saves privately with same delivery options.
   - **Life Milestone Marker**: Special full-screen moment BEFORE Phase 1 for LIFE emotions (birth, marriage, engagement, honeymoon) with name capture field
   - **Phase 3 — Multiply It**: Share with Inner Circle (opens Emotion Check-In pre-set to detected emotion) OR Write a love letter (opens LoveLetterFlow pre-set to letter type appropriate for emotion) OR keep private
   - **Final Screen**: Emotion/milestone-specific closing message, "Go live it" CTA button
   - **Wellbeing Measurement**: Post-flow slider "How full are you carrying now?" (😐 to 🌟), skip always available, stores delta privately
   - All phases skippable except LIFE Phase 1 first 30 seconds
   - AnimatePresence, framer-motion animations throughout

3. **"Joy I Captured" section in JournalTab** — Shows captured joy letters and voice notes (emotion_type: captured_joy_letter / captured_joy_voice, visibility: ONLY_ME)

4. **"Life Milestones" section in JournalTab** — Shows milestone markers (birth, marriage, etc.)

5. **"Your joy this month" insight in ReflectionsTab** — Shows positive session count, emotion types, average amplification delta, captured joy count. Balance view showing difficult vs positive ratio with warm non-judgmental copy.

6. **"Joy I Captured" in ProfileTab** — Surface captured joy items

7. **Hard Day Delivery UI** — When Carrying Awareness card triggers (3+ day difficult streak), surface any stored HARD_DAY delivery items in a warm gold full-screen moment before the CarryingThisCard

### Modify

1. **`lib/emotionDetection.ts`** — Expand POSITIVE keyword list to include: love, amazing, wonderful, happy, excited, grateful, promotion, baby, married, engagement, incredible, best day, finally, so happy, so grateful, honeymoon, pregnant, born, wedding, relationship, promoted, achievement, accomplished, proud

2. **`App.tsx`** — In `handleDumpComplete` and `handleEIAccept`, after detection:
   - If NEGATIVE + confidence >= 0.65 → TransformationArcFlow (existing, unchanged)
   - If POSITIVE + confidence >= 0.65 → Run positiveEmotionDetection, set celebrationData state → CelebrationFlow
   - Add `celebrationData` state and `setCelebrationData` alongside existing `eiArcData`
   - Render `<CelebrationFlow>` in AnimatePresence alongside `<TransformationArcFlow>` (never both at same time)

3. **`components/EISettingsPanel.tsx`** — Add "Celebration Flow" toggle section: master toggle for positive emotion celebration, individual toggles for Feel phase, Capture phase, Multiply phase

### Remove

Nothing removed.

## Implementation Plan

1. Expand `emotionDetection.ts` positive keywords
2. Create `lib/positiveEmotionDetection.ts` with fine-grained positive type classification
3. Create `components/CelebrationFlow.tsx` with all 6 sub-screens and full animation system
4. Update `App.tsx` to route POSITIVE detections to CelebrationFlow
5. Add "Joy I Captured" and "Life Milestones" to JournalTab
6. Add "Your joy this month" insight to ReflectionsTab
7. Add Hard Day Delivery surface before CarryingThisCard
8. Extend EISettingsPanel with celebration flow toggles
9. Validate, typecheck, fix errors
