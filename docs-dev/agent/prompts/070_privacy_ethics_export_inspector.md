# Task: Add a privacy/ethics passage and export inspector

## Goal

State that derived gaze data remain sensitive, present on-device processing as privacy by
design, and add an export inspector listing each exported data type — with the default
export excluding raw frames and raw landmark data unless an explicitly labelled advanced
mode is enabled.

## Scope

A privacy/ethics passage (extended on the About page if one exists), an export
inspector, and the default-export gating of raw frames/landmarks. The raw derived signal
trace stays where it already is.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — existing privacy section and
   export field types.
2. The About page privacy section and the export code.

## Dependencies

Assumes `057` (audit). If a privacy section exists, extend it rather than adding a
parallel one.

## Rationale

Derived gaze data exposes reading behaviour, attention, strategy, fatigue, and interest;
the project should treat it as sensitive, make consent explicit, and keep raw imagery out
of the default export.

## Required changes

1. State that derived gaze data remain sensitive (reading behaviour, attention, strategy,
   fatigue, interest), address consent, and present on-device processing as privacy by
   design. If the About page already has a privacy section, extend it rather than adding a
   parallel one.
2. Add an inspector listing each exported data type, whether it is exported, whether it
   contains a raw image, and its sensitivity.
3. Per the raw-signal distinction, the default export must exclude raw frames and raw
   landmark data unless an explicitly labelled advanced mode (off by default) is enabled;
   the raw derived signal trace may stay where it already is.

## Do not implement

Do not:
- add a parallel privacy section if one exists;
- include raw frames or raw landmarks in the default export;
- change the raw derived signal trace handling.

## Acceptance criteria

A privacy/ethics section exists (extended, not duplicated); the inspector lists the
fields; the default export has no raw frames or raw landmarks without opt-in; raw derived
signal handling is unaffected.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the privacy passage reads coherently, the inspector lists each export field
  with its sensitivity, and a default export contains no raw frames or landmarks unless
  the advanced mode is explicitly enabled.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`070_privacy_ethics_export_inspector.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
