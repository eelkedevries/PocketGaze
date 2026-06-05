# Task: Add the honesty / limitation panels

## Goal

Add three explanatory panels that state plainly what smartphone-camera eye tracking
**cannot** do: the consequences of a low sampling rate (Step 1), the absence of a
corneal reflection and why that makes head motion contaminate gaze directly
(Step 3), and why microsaccades and pupillometry are out of reach (a limitations
section). For an expert audience these are stronger credibility signals than
another feature.

## Scope

Static explanatory content plus one small illustrative figure (a saccade sampled
coarsely vs finely). No tracking maths; no fake detectors.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.1, §3.3, §6.3,
   §6.4, §7.1 (voice).
2. `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md`
   §3, §5, §6.
3. Source: `src/steps.ts`, `src/demos/step1.tsx`, `src/demos/step3.tsx`,
   `src/components/StepPage.tsx`, `src/components/AboutPage.tsx`.

## Dependencies

Assumes the step shell, Step 1 timing demo, and Step 3 pose demo exist. No tracking
modules required. If the step shell is missing, stop and report.

## Rationale

Honesty about limits distinguishes an eye-tracking specialist. The sampling-rate
figure connects Step 1's effective-FPS readout to its analytical consequences; the
no-corneal-reflection point is the deep reason Step 3 exists.

## Required changes

1. **Sampling-rate panel (Step 1):** explain what ~30 Hz supports (fixations, large
   saccades) and does not (peak velocity, the main sequence, saccade dynamics,
   microsaccades). Include a small static figure contrasting a saccade sampled
   coarsely vs finely (a Nyquist-style point). Reference the live effective-FPS
   readout.
2. **No-corneal-reflection panel (Step 3):** explain that research-grade
   video-oculography uses pupil–CR to be robust to head movement, whereas an RGB
   camera has only the iris/pupil, so head motion contaminates gaze directly —
   "why your phone drifts when you move and a research tracker does not".
3. **Out-of-reach panel (limitations / about):** microsaccades (sub-degree, below
   spatial/temporal resolution) and pupillometry (confounded by visible-light
   changes and iris occlusion without IR) cannot be measured here; explicitly note
   that no fake detector is provided.
4. British English; cautious, accurate wording (§6.3). Wire any optional subprocess
   detail into the existing master control (no second toggle).

## Do not implement

Do not:
- add any tracking, detector, or measurement code;
- imply these limits are surmountable in-browser;
- add a second master show/hide control.

## Acceptance criteria

- Step 1 shows the sampling-rate panel with the coarse-vs-fine saccade figure;
- Step 3 shows the no-corneal-reflection explanation tied to head-motion drift;
- a limitations/about panel states why microsaccades and pupillometry are out of
  reach and that no fake detector is offered.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Visit Step 1, Step 3, and the limitations/about location; confirm each panel
  renders with the stated content and the figure displays.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`048_honesty_limitation_panels.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
