# Task: Add the zoomed eye-region crop and live EAR trace

## Goal

Make the eye computation tangible on Step 2: a **zoomed eye-region crop** with the
iris ring, iris-proxy centroid, and the normalisation box drawn on it, and a **live
EAR trace** that visibly collapses during a blink — turning "iris proxy" and "eye
aspect ratio" from terms into observable signals.

## Scope

Step 2 visualisation only (same demo/file). Reuse the feature extractor and eye
geometry; no new tracking maths.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.2, §3.4, §6.2,
   §2.5, §2.6.
2. Source: `src/demos/step2.tsx`, `src/lib/eyeGeometry.ts`,
   `src/lib/featureExtraction.ts`, `src/lib/eyeLocalSignal.ts`.

## Dependencies

Assumes `012` (feature extraction) and `013` (Step 2 demo) are complete. If the
Step 2 demo is missing, stop and report.

## Rationale

Showing the computation on the live image is the project's strongest pedagogical
device. A zoomed crop with the normalisation box previews the eye-local signal
(Step 4); a live EAR trace makes blink detection self-evident.

## Required changes

1. Add a magnified crop of one (or both) eye region(s) drawn from the current
   frame, with the iris ring, the iris-proxy centre, and the eye-local
   **normalisation box** overlaid so the centred −1…1 mapping is visible.
2. Add a live rolling **EAR trace** (per eye or combined) with the blink threshold
   drawn as a reference line; the trace should visibly dip below the line on a
   blink.
3. Place both in the Step 2 demo without disturbing the existing overlay; surface
   any extra detail through the existing master control (no second toggle).
4. Handle no-face/occluded states gracefully.

## Do not implement

Do not:
- add new feature or geometry maths (reuse existing modules);
- add a second master show/hide control;
- alter the exported schema.

## Data contracts touched

Adds: none (live visualisation only). Preserves the session model.

## Acceptance criteria

- a zoomed eye crop shows the iris ring, iris-proxy centre, and the normalisation
  box;
- a live EAR trace dips below the drawn blink threshold on a blink;
- both handle no-face gracefully.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Start the camera on Step 2; confirm the zoomed crop with overlays and a live EAR
  trace; blink and confirm the trace crosses below the threshold.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`052_eye_region_crop_and_ear_trace.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
