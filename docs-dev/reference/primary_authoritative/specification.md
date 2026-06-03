# Specification

**Version:** 1.0 · **Last updated:** 2026-06-03

The authoritative design canon for PocketGaze. **Only the sections actually filled below
are binding.** A section (or sub-item) marked _Not yet decided_ imposes no constraint and
is open for a future decision.

When the codebase and this document conflict, this document is correct. When a decision is
made or revised, update the relevant section here and bump the version above (noting what
changed).

Non-binding background informs this document but never overrides it:
`docs-dev/reference/secondary_background/overview.md` and
`docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md`.

---

## Scope

### What PocketGaze is

PocketGaze is a **static, browser-based explainer and live-demo site** for the seven-step
smartphone-camera eye-tracking pipeline. It is **primarily a portfolio project**: its
purpose is to show potential employers, collaborators, and customers that the author
understands how smartphone-camera eye tracking can be implemented in practice.

To serve that purpose, the site does two things for each step:

1. presents the **main concept and (eventually) a live demo** for that step; and
2. makes the **implementation process understandable** through optional
   implementation/subprocess panels that explain what is happening internally.

### What is in scope

- A public, static site covering **Step 0 (Overview) through Step 7**, one page per step.
- A consistent, repeated structure on every step page.
- A single, site-wide **"Show implementation details"** control governing the optional
  implementation/subprocess panels.
- Browser-local processing (the recommended first route) when real functionality is added.

### What is out of scope (for this site)

- Native Android or iOS application code.
- Server-side / cloud processing backends.
- Storing or uploading raw video by default.

The Android-local and Android-cloud routes may be **described as explanatory content**, but
this repository implements the browser-local route only.

### Current state vs target

The site currently contains **placeholders only** — no real camera access or tracking.
Real functionality is introduced incrementally by later prompts. `current_state.md` records
what actually exists at any time; this specification records the intended design.

---

## Architecture

### Application shape

- **Stack:** React + TypeScript + Vite. Single-page static site.
- **Deployment:** public GitHub Pages, base path `/PocketGaze/`, built output in `dist/`.
- **Routing:** client-side routing across the Step 0–7 pages. Routing must keep deep links
  and refreshes working on GitHub Pages without server-side rewrites (the scaffold uses a
  hash-based router to satisfy this; the mechanism may change as long as the constraint
  holds).
- **Development-only material:** everything under `docs-dev/` is excluded from the deployed
  build (`dist/`) and is verified by `scripts/check-public-build.sh`.

### The seven-step pipeline

The site is organised around these pages:

| Page | Title |
|---|---|
| Step 0 | Overview |
| Step 1 | Capture and timing |
| Step 2 | Face and eye features |
| Step 3 | Head and phone motion |
| Step 4 | Eye-local and gaze signals |
| Step 5 | Calibration and personalisation |
| Step 6 | Filtering and events |
| Step 7 | Content and stimulus mapping |

### Repeated step-page structure

Every step page (Step 1–7, and Step 0 as far as it applies) must present its content in
this order:

1. **Introduction** — brief framing of the step.
2. **Options / methods** — the main approaches.
3. **Implementation on this page** — what this page actually does.
4. **Live demo** — the main demo area for the step.
5. **Implementation details (optional)** — implementation/subprocess panels, shown only
   when the master control is enabled.
6. **Outputs** — what the step produces.
7. **Limitations** — cautions and known weaknesses.

### Master "Show implementation details" control

- There is **exactly one** site-wide control that reveals or hides the optional
  implementation/subprocess panels across all step pages.
- When **disabled**, each step page shows only the main live-demo area and the core
  explanatory content; the implementation/subprocess panels are hidden.
- When **enabled**, the additional implementation/subprocess panels for each step are
  revealed.
- This is a single shared piece of state for the whole site (the scaffold implements it
  with a React context); new step content must hook into this same control rather than
  introducing a second, independent toggle.

### Processing and privacy posture

When real functionality is added, the binding default is:

- **Process locally in the browser**; do not send camera frames to a server by default.
- **Do not store raw video by default.** Prefer derived-data export (signals, events,
  task metadata) over raw frames.
- If a cloud route is ever explored, prefer **feature upload over frame upload**, and treat
  landmarks, gaze, head pose, and task-linked eye data as sensitive. (Note: cloud
  processing is out of scope for this repository per **Scope**.)

### Implementation libraries

The specific libraries for camera capture, feature extraction, gaze estimation, filtering,
and calibration are **_Not yet decided_**. Candidates and trade-offs are discussed in the
non-binding background. No library is binding until recorded under **Locked decisions**.

---

## Data schemas

_Not yet decided._

A derived-data export format will be defined when data export is implemented. The
non-binding background proposes a row-typed schema (sample / event / calibration /
stimulus / quality rows) and a separation of raw versus filtered signal columns; that is a
**candidate**, not yet binding. Until a schema is recorded here, none is mandated.

---

## Domain rules

These conceptual rules are binding for any content and any future implementation:

1. **Eye tracking is a pipeline, not a single model.** The site must present the seven
   steps as distinct stages, not collapse them into one black box.
2. **Keep signal types distinct.** Eye-local signals, screen-gaze estimates, and
   content-mapped coordinates are different things and must be labelled and described as
   such. Eye-local movement must **not** be presented as precise screen gaze unless a
   validated mapping has been fitted and checked.
3. **Do not overclaim accuracy or events.** Event labels are **candidates** unless
   validated; describe smartphone-camera tracking cautiously.
4. **Head and phone motion can masquerade as eye movement.** Content must not imply
   apparent eye movement is necessarily real eye movement.
5. **Placeholders must read as placeholders.** Scaffold/demo placeholders must never imply
   that functionality already exists.

---

## Naming and voice

- **Language/locale:** British English for all user-facing text (e.g. "personalisation",
  "behaviour"). Code identifiers may follow the conventional American spellings of their
  libraries.
- **Voice:** clear, honest, and technically credible — appropriate to a portfolio piece.
  Explain mechanisms plainly; prefer cautious, accurate wording over marketing claims.
- **Step labelling:** steps are referred to as "Step 0"–"Step 7" with the titles in the
  Architecture table.
- **Master control label:** "Show implementation details".

---

## Locked decisions

Settled decisions that must not be re-litigated without an explicit change here (and a
version bump):

1. PocketGaze is a **portfolio-oriented**, static, browser-based explainer and live-demo
   site for the seven-step smartphone-camera eye-tracking pipeline.
2. Stack is **React + TypeScript + Vite**; deployment is **public GitHub Pages** with base
   path **`/PocketGaze/`**.
3. The site covers **Step 0–7**, one page per step, with the **repeated step-page
   structure** defined in Architecture.
4. There is a **single site-wide "Show implementation details" control** governing the
   optional implementation/subprocess panels; new content must reuse it.
5. The implemented processing route is **browser-local**; native-app and cloud backends are
   **out of scope** for this repository (they may be described as content only).
6. **No raw video is stored by default**; local processing and derived-data export are the
   default posture.
7. Real functionality is added **incrementally** via narrow prompts; the site stays useful
   at placeholder stage and must not overclaim.
8. User-facing text uses **British English**.

_Open (not yet locked): specific implementation libraries, the derived-data export schema,
and the concrete design of each step's live demo._
