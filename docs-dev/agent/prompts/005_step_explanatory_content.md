# Task: Write the explanatory content for Steps 1–7

## Goal

Replace the placeholder copy on Steps 1–7 with real explanatory content (introduction,
options/methods, outputs, limitations) drawn from the specification, while leaving the
live-demo and subprocess areas as placeholders for later prompts.

## Scope

Text content for Steps 1–7 only. Do not implement demos, camera, or tracking.

## Context

Implements specification §3.1–§3.7. Content model is `src/steps.ts`. Keep the §2.6 page
structure and the master-control behaviour (§2.5).

## Required changes

1. For each of Steps 1–7, write: an introduction; the options/methods the step explains;
   the outputs; and the limitations — faithful to the per-step specification.
2. Keep the eye-local / screen-gaze / content-mapped distinction accurate where relevant
   (§6.2, §7.2) and label events cautiously as candidates where mentioned (§5).
3. Leave the live-demo and implementation/subprocess areas as clearly-labelled
   placeholders.
4. Use British English throughout.

## Do not implement

Do not:
- add camera access, feature extraction, or any demo logic;
- introduce accuracy claims not supported by the spec;
- add a second show/hide control.

## Acceptance criteria

The task is complete when:
- Steps 1–7 show real introduction/methods/outputs/limitations content;
- demo and subprocess areas remain labelled placeholders;
- content matches the spec and uses British English;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`005_step_explanatory_content.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
