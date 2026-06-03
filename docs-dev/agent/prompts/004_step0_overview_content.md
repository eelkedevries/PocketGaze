# Task: Flesh out the Step 0 overview content

## Goal

Replace the Step 0 placeholder with real explanatory content that orients a visitor to
PocketGaze and the seven-step pipeline.

## Scope

Content and presentation for Step 0 only. Implement only the work described here. Do not
add camera, tracking, or any other step's content.

## Context

Implements specification §3.0 (Step 0 — Overview), §6 (domain rules), §7.2 (glossary).
Step content currently lives in `src/steps.ts`; Step 0 uses the shared step-page shell.

## Required changes

1. Write Step 0 copy covering: what PocketGaze is and its portfolio purpose; the pipeline
   presented as seven distinct stages (not one model); the eye-local vs screen-gaze vs
   content-mapped distinction; how to use the master "Show implementation details" control;
   and an honest statement of the current placeholder state.
2. Keep the repeated page-section order from §2.6; Step 0 needs no camera demo (a static
   pipeline summary is fine).
3. Use British English throughout.

## Do not implement

Do not:
- add camera access, tracking, or interactive demos;
- change other step pages;
- add a second show/hide control.

## Acceptance criteria

The task is complete when:
- Step 0 renders the new overview content with the §2.6 sections;
- the signal-type distinction and master-control usage are explained;
- no functional/tracking code was added;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`004_step0_overview_content.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
