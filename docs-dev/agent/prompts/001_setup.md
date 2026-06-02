# Task: Initialise the PocketGaze scaffold

## Goal

Initialise PocketGaze as an `eek-a-dev`-style single-repository project: a clean static
React/TypeScript/Vite site with Step 0–7 navigation, placeholder pages, the master
"Show implementation details" control (placeholder-level), the standard `eek-a-dev`
workflow, documentation stubs, and GitHub Pages build/check/deploy infrastructure.

## Scope

Scaffold/setup only. Implement only the work described in this prompt. Do not implement
adjacent systems, real demos, or future prompts.

## Context

- Background (non-binding): `docs-dev/reference/secondary_background/overview.md` and
  `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md`.
- The binding specification does not exist yet; it is planned in
  `002_DRAFT_create_specification.md`.

## Required changes

1. Install the `eek-a-dev` workflow: `AGENTS.md`, `CLAUDE.md`, `.gitignore`,
   `.pre-commit-config.yaml`, `docs-dev/` (agent guides, reference, planning, reviews,
   archive), `docs/`, `scripts/` (`validate-prompts.sh`, `check-public-build.sh`,
   `new-prompt.sh`), and `.github/workflows/` (`check-build.yml`, `deploy-pages.yml`).
2. Create a React + TypeScript + Vite scaffold with base path `/PocketGaze/`.
3. Add top navigation and placeholder pages for Step 0–7, each using the repeated
   structure: introduction, options/methods, implementation on this page, live demo area,
   optional implementation/subprocess area, outputs, limitations.
4. Add a single master "Show implementation details" control that reveals/hides the
   optional implementation/subprocess placeholder panels across all step pages.
5. Place the two background documents at the required paths and label them non-binding.
6. Add a minimal placeholder `specification.md`, update `current_state.md`, write the
   public README and `docs/` stubs, and record project conventions in `AGENTS.md`.
7. Add the draft prompt files `002_DRAFT_create_specification.md` and
   `003_DRAFT_plan_project_prompt_queue.md` as draft placeholders only.

## Do not implement

Do not implement:
- real camera access, frame timing, or face/eye tracking;
- MediaPipe, Human, WebEyeTrack, or WebGazer integration;
- calibration, filtering, event detection, or data export;
- Android app or backend/cloud code;
- elaborate simulated demos or detailed subprocess visualisations.

All demo and implementation/subprocess areas must be simple placeholders only.

## Acceptance criteria

The task is complete when:
- the static site builds successfully (`npm run build`);
- Step 0–7 pages are reachable from the top navigation and share the repeated structure;
- all demo and implementation/subprocess areas are simple placeholders only;
- the master "Show implementation details" control reveals/hides the subprocess
  placeholders;
- public and development documentation stubs exist;
- `specification.md` exists as a minimal placeholder only;
- both background documents are present at the required paths, labelled non-binding;
- the three prompt files (`001_setup.md`, `002_DRAFT_*`, `003_DRAFT_*`) exist;
- the public build does not include `docs-dev/` or development-only material;
- no secrets, tokens, or `.env*` files are committed.

## Checks

```bash
npm install
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`001_setup.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
