# Task: Plan and generate the PocketGaze implementation prompt queue

## Goal

Turn the binding specification into the **full ordered sequence of numbered prompt files**
that, run one after another, build PocketGaze end-to-end as a browser-local site — from
finished explanatory content through real camera capture, feature extraction, head-pose
handling, gaze signals, calibration, filtering/events, content mapping, and derived-data
export. Each generated prompt must be a single narrow, reviewable unit.

## Scope

Author prompt files only. Do **not** implement any application feature here, and do not run
the prompts you create. The deliverable is the queue itself plus a short plan.

## Context

Read before planning:

- `docs-dev/reference/primary_authoritative/specification.md` — **binding**; the queue must
  implement this and nothing outside it. If the spec is still a placeholder, stop and ask
  for `002_create_specification.md` to be run first.
- `docs-dev/reference/secondary_background/overview.md` — §3 recommended development order
  (browser-first, incremental) and §2.1 Pipeline 1 implementations; §6.1 verification.
- `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md` — §6
  browser/mobile constraints, §7 privacy, §8.1 first-route steps, §9 pre-use checks.
- `docs-dev/agent/prompt_authoring_guide.md` — the required shape and naming of prompts.

## Method

1. **Read the spec and derive the plan from it** (not from the background, which is
   non-binding context only).
2. **Propose the plan first.** Output a numbered list of the prompts you intend to create —
   filename + one-line goal each — grouped into phases. Stop and get approval before
   writing the files. Do not create prompt files until the plan is approved.
3. **On approval, create one prompt file per planned item**, continuing the existing
   numbering from `004` upward, named `NNN_short_name.md` (lowercase, underscores) per the
   authoring guide. Do not renumber or edit `001`–`003`.
4. Update `docs-dev/planning/current_state.md` to record that the implementation queue
   exists and list the phases.

## Required properties of every generated prompt

- One reviewable unit of work; completable in a single agent session.
- Follows the authoring-guide structure exactly: `Goal`, `Scope`, optional `Context`,
  `Required changes`, `Do not implement`, `Acceptance criteria`, `Checks`,
  `Commit and push`, `Final report`.
- Cites the specific `specification.md` section(s) it implements.
- Has observable acceptance criteria (what can be seen or run), not only "build passes".
- Keeps the site **useful and shippable at every stage** — earlier prompts must not depend
  on later ones.
- Browser-local only; no native-app or cloud work (out of scope per the spec).
- Real camera/tracking code replaces placeholders **incrementally**; until a step's real
  demo lands, its placeholder stays and must still read as a placeholder.
- Wires every new implementation/subprocess panel into the **single existing master
  "Show implementation details" control** — never a second toggle.
- For risky third-party integrations (notably WebEyeTrack screen gaze), create a dedicated
  **technical-spike** prompt first (verify licence, self-hosting, browser support,
  timestamp/export fields per background §9) before any integration prompt.

## Suggested phase ordering (adapt to the spec; this is guidance, not binding)

- **Phase A — Content & shell:** finish Step 0 overview and the explanatory content for
  every step; polish navigation, the master control, styling, accessibility, and mobile
  layout; add an about/privacy page.
- **Phase B — Capture & timing (Step 1):** `getUserMedia` camera access with a permission
  flow; frame timing via `requestVideoFrameCallback` with fallback; dropped/repeated-frame
  checks; Step 1 live demo + timing subprocess panels.
- **Phase C — Face & eye features (Step 2):** landmark-library spike, then integration;
  face/eye/iris/eyelid overlays; per-eye quality and blink/eye-state; Step 2 demo + panels.
- **Phase D — Head & phone motion (Step 3):** head-pose estimation; motion-quality
  labelling; Step 3 demo + panels.
- **Phase E — Eye-local & gaze signals (Step 4):** eye-local signal; WebEyeTrack spike then
  optional screen-gaze integration; visible eye-local vs screen-gaze separation; demo +
  panels.
- **Phase F — Calibration (Step 5):** follow-the-dots task; regression mapping;
  calibration-quality checks; demo + panels.
- **Phase G — Filtering & events (Step 6):** One Euro filter; blink suppression and
  quality thresholding; candidate fixation/saccade detection; raw-vs-filtered traces;
  demo + panels.
- **Phase H — Content & stimulus mapping (Step 7):** DOM geometry / AOI logging;
  scroll/zoom/transform logging; screen-vs-content coordinates; demo + panels.
- **Phase I — Export & hardening:** derived-data export per the spec's schema with
  processing metadata; cross-device/performance QA; docs and deployment verification.

## Do not implement

Do not:
- implement any application feature or demo (only author prompt files);
- run any of the prompts you create;
- add native-app or cloud-backend prompts (out of scope per the spec);
- create prompt files before the proposed plan is approved.

## Acceptance criteria

The task is complete when:
- a phased, numbered plan was proposed and approved;
- one well-formed prompt file exists per approved item, numbered from `004` upward and
  passing `scripts/validate-prompts.sh`;
- each generated prompt is narrow, cites the spec, and follows the authoring-guide shape;
- the sequence builds PocketGaze in full, incrementally, browser-local, keeping the site
  shippable at each stage;
- `current_state.md` records the queue and its phases;
- `npm run build` and the repository checks pass.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed, the plan was approved, and checks pass, create one
commit on `main` using this file's exact filename (`003_plan_project_prompt_queue.md`) as
the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
