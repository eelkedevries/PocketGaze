# Task: Create the full binding PocketGaze specification

## Goal

Replace `docs-dev/reference/primary_authoritative/specification.md` with a complete,
binding v1 specification that is detailed enough to drive the full implementation of
PocketGaze without further design guesswork — covering the architecture, every step page
(Step 0–7), the derived-data export schema, the event vocabulary, the domain rules, the
naming/voice, and the candidate-versus-locked technology decisions.

## Scope

Author the binding specification only. Do not change application source code, add features,
or write the implementation prompt queue (that is `003`).

## Context

Read these before writing (non-binding background — informs, never overrides):

- `docs-dev/reference/secondary_background/overview.md` — the seven-step framework
  (§1.1–1.7), recommended pipelines (§2), development order (§3), data export (§4), event
  labels (§5), verification checklist (§6), tool index (§7).
- `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md` — tool
  assessment, browser/mobile constraints, and privacy guidance.
- `AGENTS.md` — project conventions. `docs-dev/planning/current_state.md` — what exists.

Anchor decisions already made: PocketGaze is a portfolio-oriented, static, browser-local
React + TypeScript + Vite site for Step 0–7, deployed to public GitHub Pages at base
`/PocketGaze/`, with a single master "Show implementation details" control. Native-app and
cloud routes are out of scope for this repository (they may be described as content).

## Required changes

Rewrite `specification.md` as a binding document, **version 1.0**, with the sections below.
Lock what is genuinely settled; mark anything still open as `_Not yet decided_` with a
one-line note. Do not invent specific numbers, accuracy claims, or third-party licences.

1. **Scope** — what PocketGaze is and is not; in-scope vs out-of-scope; current
   placeholder state vs the target browser-local demo site.
2. **Architecture**
   - Stack, build/deploy, base path, `dist/` output, `docs-dev/` exclusion from the build.
   - Routing approach and the GitHub-Pages deep-link constraint.
   - Source-code organisation conventions (where step data, components, contexts, demos,
     and shared signal/types code live).
   - App shell and navigation across Step 0–7.
   - The master "Show implementation details" control: single shared state, hidden vs
     revealed behaviour, and the rule that all step content reuses this one control.
   - The repeated step-page contract (the seven on-page sections, in order).
   - Processing and privacy posture (browser-local; no raw video stored by default;
     derived-data export; feature-over-frame if cloud were ever considered).
   - Performance and device targets (mid-range phones; Android Chrome/Firefox; degrade
     gracefully when a capability or library is unavailable).
3. **Per-step specifications (Step 0–7).** For **each** step give: its goal; the
   methods/options the page must explain; the intended live-demo behaviour; the
   implementation/subprocess panels to expose under the master control; the outputs; and
   the limitations. Derive the substance from `overview.md` §1.1–1.7 and §2.1; do not copy
   the tables verbatim — distil them into binding requirements for this site.
4. **Data schemas.** Define the derived-data export contract: the row types
   (`sample`, `event`, `calibration`, `stimulus`, `quality`) and the field groups (timing,
   eye-local signal, screen-gaze signal, content-mapped signal, head pose, tracking
   quality, blink/eye state, events, task/stimulus, processing/data-flow metadata), based
   on `overview.md` §4. State the file format(s) and the rule that raw and filtered signals
   are kept distinct. Where exact field names are not yet settled, mark them as a candidate
   schema, not binding.
5. **Event vocabulary.** Define the candidate event labels (`blink`, `tracking_lost`,
   `fixation_candidate`, `saccade_candidate`, `saccade_head_still`,
   `saccade_during_head_movement`, `uncertain_head_motion`, `calibration_target`,
   `stimulus_event`) and the rule that events are labelled cautiously as candidates, per
   `overview.md` §5.
6. **Domain rules.** Pipeline-not-a-single-model; strict separation of eye-local vs
   screen-gaze vs content-mapped signals; no overclaiming of accuracy or events;
   head/phone motion can masquerade as eye movement; placeholders must read as
   placeholders; privacy-by-default.
7. **Naming and voice.** British English for user-facing text; honest, technically
   credible portfolio voice; step labels; the master-control label; and a short glossary
   defining eye-local signal, screen-gaze estimate, and content-mapped coordinate.
8. **Technology decisions.** For each pipeline concern (capture/timing, feature
   extraction, head pose, eye-local signal, screen gaze, calibration, filtering/events,
   content mapping), list the candidate browser tools from the background (e.g.
   `getUserMedia`/`requestVideoFrameCallback`, Human, MediaPipe FaceLandmarker,
   WebEyeTrack, WebGazer baseline, OpenCV.js `solvePnP`, One Euro filter, DOM geometry
   APIs) with the criteria for choosing, and state which (if any) are locked versus open.
   Flag integrations needing a technical spike (notably WebEyeTrack).
9. **Locked decisions** and a closing **Open decisions** list.

Then update `docs-dev/planning/current_state.md` to record that the full binding
specification exists (version 1.0) and summarise what it locks.

## Do not implement

Do not:
- change application source code, components, or styling;
- invent binding library choices, exact schema field names, accuracy figures, or licence
  claims that are not settled — mark these as candidates/open;
- write the implementation prompt queue (that is `003`).

## Acceptance criteria

The task is complete when:
- `specification.md` is a binding v1.0 document containing every section listed above;
- each of Step 0–7 has an explicit per-step specification;
- the data-export schema, event vocabulary, domain rules, naming/voice, and technology
  decisions are present, with open items clearly marked;
- the portfolio purpose and the master show/hide control are recorded as locked decisions;
- `current_state.md` reflects the full specification;
- `npm run build`, `scripts/check-public-build.sh dist`, and `scripts/validate-prompts.sh`
  pass.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`002_create_specification.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
