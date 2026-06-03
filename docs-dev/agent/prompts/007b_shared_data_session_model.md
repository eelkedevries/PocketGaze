# Task: Define the shared data/session model

## Goal

Define the shared TypeScript types and an in-memory session store for the whole pipeline —
before any camera/tracking module exists — so that capture, features, head pose, signals,
calibration, events, and content mapping all write to one agreed shape rather than inventing
their own. Do not implement export yet.

## Scope

Shared types and the session store only. No camera, tracking, demos, or file export.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §2.3, §4 (row types and
   field groups), §5 (event vocabulary).
2. `docs-dev/planning/current_state.md`.
3. Source: `src/steps.ts` (existing conventions), `src/` layout.

## Dependencies

This prompt assumes the scaffold from `001_setup.md` and the locked schema in
specification §4. It must run **before** `008_camera_access.md`. If the spec §4 schema is
absent, stop and report.

## Context

This is the single source of truth for the internal data model. Later modules extend it via
the "Data contracts touched" section of their prompts; they must not redefine shapes.

## Required changes

1. Add shared types under `src/types/` for the row types (`sample`, `event`,
   `calibration`, `stimulus`, `quality`) and the §4 field groups: timing, eye-local,
   screen-gaze, content-mapped, head-pose, tracking-quality, blink/eye-state, events,
   task/stimulus, and processing/data-flow metadata.
2. Keep raw vs filtered signals as **separate fields** (per §4.1) and represent
   non-applicable fields as optional/blank (not `0`).
3. Add an in-memory session store (`src/lib/`) that accumulates rows and exposes typed
   add/query methods; it holds session-relative `time_ms` (ms from session start).
4. Add minimal `node --test` unit tests for the store (adding rows of each type; preserving
   raw/filtered separation; blank vs zero distinction) and wire `npm run test`.

## Do not implement

Do not:
- implement file export/serialisation (that is `031`);
- add camera, tracking, or any demo;
- store raw video.

## Data contracts touched

Defines (authoritative): all §4 row types and field groups; raw-vs-filtered separation;
processing/data-flow metadata; the session-relative `time_ms` convention.
Does not: serialise/export data; add raw-video storage.

## Acceptance criteria

The task is complete when:
- shared types exist for all five row types and every §4 field group;
- the session store accumulates and returns typed rows with raw/filtered separation;
- `npm run test` runs the store unit tests and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm `npm run test` executes the store tests (not zero tests) and they pass.
- Confirm no UI/behaviour change in the running site.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`007b_shared_data_session_model.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
