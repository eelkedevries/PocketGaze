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
- **Binding specification now exists** at
  `docs-dev/reference/primary_authoritative/specification.md` (v1.0). It locks the
  portfolio purpose, stack/deployment, Step 0–7 structure, the single master "Show
  implementation details" control, the browser-local-only route (native/cloud out of
  scope), and the no-raw-video-by-default posture. Implementation libraries, the
  derived-data export schema, and per-step demo designs are explicitly left open.
- Workflow updated: commit and push directly to `main`; GitHub Pages auto-deploys on push
  to `main`.

## In progress / next

- **Next planned prompt:** `003_DRAFT_plan_project_prompt_queue.md` — create the ordered,
  numbered implementation prompt queue for building PocketGaze. Still a **draft, not ready
  to run**.

## Important caveats

- The site currently contains **simple placeholders only**.
- There is **no real camera, frame timing, face/eye tracking, calibration, filtering,
  event detection, or data export**, and no Android or backend code.
- The intended later site behaviour includes the master control for showing/hiding
  implementation-detail panels (already scaffolded at placeholder level).

## Prompts run

- `001_setup.md` — initial PocketGaze scaffold and eek-a-dev workflow.
- `002_create_specification.md` — created the binding v1 specification.
