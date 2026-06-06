# Task: Standardise terminology and extend the glossary, without breaking exports

## Goal

Use one term per concept across README, copy, and UI, and extend the existing Step 0
glossary to cover the project's full vocabulary — without silently renaming any
exported column.

## Scope

Terminology in README, `src/steps.ts`, and UI labels; the Step 0 glossary (extended in
place); and documentation of export field names. No export schema break.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — whether a glossary already
   exists and the current export field names.
2. `src/steps.ts` (Step 0 glossary), the export code, and the UI labels using
   "tracking"/"quality".

## Dependencies

Assumes `057` (audit) and follows `058`/`059` (status and wording corrected). If the
audit did not record the export field names, document them here first.

## Rationale

One term per concept reduces reader confusion; reusing the repository's existing
candidate-event vocabulary verbatim avoids coining competing names; and documenting
export fields before any label change protects downstream consumers.

## Required changes

1. Replace "iris/pupil proxy" with "iris-centre proxy" everywhere.
2. If a glossary already exists (Step 0 currently defines eye-local signal, screen-gaze
   estimate, and content-mapped coordinate), EXTEND it in place rather than adding a
   second glossary.
3. Cover at least: iris-centre proxy, screen-gaze estimate, content-mapped coordinate,
   candidate fixation, candidate saccade, calibration, validation error, rVFC, saccade,
   fixation, the One Euro filter (one sentence), the tracking subtypes (face tracking,
   eye-region tracking, gaze estimation), the quality subtypes (detection, signal,
   calibration, validation quality, event confidence), and the I-VT
   (velocity-threshold) and I-DT (dispersion-threshold) rules the project's hybrid
   event detector combines.
4. Define the candidate-event labels using the repository's existing vocabulary
   verbatim (fixation_candidate, saccade_candidate, saccade_head_still,
   saccade_during_head_movement, uncertain_head_motion, blink, tracking_lost,
   smooth_pursuit_candidate); do not coin new names.
5. Use those specific terms in UI labels instead of bare "tracking" or "quality"; fix
   capitalisation/hyphenation.
6. Do not silently rename exported columns: document current field names first; if a
   change touches a column, keep backward compatibility or version the schema with a
   migration note, and prefer display-label changes over field renames.

## Do not implement

Do not:
- add a second glossary;
- coin new event names;
- rename exported columns without a documented migration / backward-compatibility note.

## Acceptance criteria

Terminology is uniform; one glossary (extended, not duplicated) covers all listed terms
including the subtypes; no "iris/pupil proxy" remains; export columns are documented and
none silently renamed.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the Step 0 glossary lists every required term once, UI labels use the precise
  subtypes, and an export still parses with its documented field names.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`060_standardise_terminology_glossary.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
