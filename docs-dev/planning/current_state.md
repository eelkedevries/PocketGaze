# Current state

Living, high-level orientation for the project: what exists now, key architectural
decisions, and what is in progress. Read it at the start of a session to orient quickly.

This file records what *is* (current reality). The binding design canon is
`docs-dev/reference/primary_authoritative/`; when the two conflict, the canon wins and the
gap is work still to be done.

## Systems

- **Static site scaffold** — React + TypeScript + Vite. Builds to `dist/`, base path
  `/PocketGaze/`.
- **Top navigation across Step 0–7** — Step 0 (Overview) through Step 7 (Content and
  stimulus mapping), routed with `react-router-dom` (`HashRouter` for GitHub Pages).
- **Shared step-page structure** — every step uses the same sections: introduction,
  options/methods, implementation on this page, live demo area, optional
  implementation/subprocess area, outputs, limitations.
- **Master "Show implementation details" control** — a single site-wide toggle in the
  header (React context) that reveals or hides the optional implementation/subprocess
  placeholder panels on each step page.
- **eek-a-dev workflow** — `AGENTS.md`/`CLAUDE.md`, agent guides, prompt files, scripts
  (`validate-prompts.sh`, `check-public-build.sh`, `new-prompt.sh`), and GitHub Actions
  (`check-build.yml`, `deploy-pages.yml`).

## Key decisions

- Stack: React + TypeScript + Vite; public GitHub Pages static site.
- Deploy base path `/PocketGaze/`; `docs-dev/` is never included in the build.
- Commit-to-`main`, one commit per prompt, prompt filename as commit message,
  British English for user-facing text (see `AGENTS.md`).
- `validate-prompts.sh` extended to allow an optional uppercase `DRAFT_` marker in prompt
  filenames so draft prompts pass validation.
- **Full binding specification exists** at
  `docs-dev/reference/primary_authoritative/specification.md` (v1.0). It covers Scope,
  Architecture (stack/deploy, routing, source layout, app shell, the single master control,
  the repeated page contract, privacy posture, device targets), **per-step designs for
  Step 0–7** (goal, methods, live demo, subprocess panels, outputs, limitations), the
  derived-data **export schema** (row types + field groups) and **event vocabulary**,
  domain rules, naming/voice + glossary, and **technology decisions** (candidate libraries
  with locked-vs-open status). Locked decisions and an Open-decisions list are recorded.
  Genuinely open items (primary feature library, WebEyeTrack integration, export file
  format/field names, head-pose method, control persistence) are explicitly deferred.
- Workflow updated: commit and push directly to `main`; GitHub Pages auto-deploys on push
  to `main`.

## In progress / next

- **Prompts 002 and 003 are now finalised, runnable prompts** (the `DRAFT_` markers were
  removed): `002_create_specification.md` was expanded to generate the *full* binding
  specification (architecture, per-step Step 0–7 designs, data-export schema, event
  vocabulary, domain rules, naming/voice, technology decisions), and
  `003_plan_project_prompt_queue.md` generates the *full ordered* implementation prompt
  queue (Phases A–I, browser-local, incremental).
- **Implementation prompt queue generated:** prompts `004`–`033` now exist, covering
  Phases A–I (content & shell; capture & timing; features; head/phone motion; eye-local &
  gaze; calibration; filtering & events; content mapping; export & hardening). They are the
  ordered work queue for building the site in full, browser-local and incremental, and have
  **not been run yet**.
- **Next planned prompt:** run `004_step0_overview_content.md`, then proceed in order.

## Important caveats

- The site currently contains **simple placeholders only**.
- There is **no real camera, frame timing, face/eye tracking, calibration, filtering,
  event detection, or data export**, and no Android or backend code.
- The intended later site behaviour includes the master control for showing/hiding
  implementation-detail panels (already scaffolded at placeholder level).

## Prompts run

- `001_setup.md` — initial PocketGaze scaffold and eek-a-dev workflow.
- `002_create_specification.md` — created the binding v1 specification (run twice:
  conservative v1.0, then expanded to the full v1.0).
- `003_plan_project_prompt_queue.md` — generated the implementation prompt queue (`004`–`033`).
