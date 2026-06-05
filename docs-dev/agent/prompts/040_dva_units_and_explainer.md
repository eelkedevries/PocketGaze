# Task: Show metrics in degrees and add the visual-angle explainer

## Goal

Express the key eye-tracking quantities in **degrees of visual angle** wherever
they are shown — validation accuracy and precision, and saccade amplitude — using
the estimated angular scale (`039`), each labelled as an estimate; and add a short
explainer panel covering why dva matters and why a selfie camera can only
approximate it.

## Scope

Degree display in existing readouts plus one explainer panel. No new tracking
maths (reuse `038`/`039`).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.4, §3.5, §6.3,
   §7.1 (voice), §2.5, §2.6.
2. Source: `src/demos/step5.tsx` (validation, `036`), `src/lib/validationMetrics.ts`,
   `src/lib/eventDetection.ts`, `src/lib/visualAngle.ts`.

## Dependencies

Assumes `036` (validation demo), `038`/`039` (angular scale), and `026`
(events) are complete. If the angular scale is unavailable, stop and report.

## Rationale

Degrees of visual angle are the field's native unit; showing accuracy, precision,
and saccade amplitude in degrees (estimated, caveated) is what an eye-tracking
audience expects, and the limits of a webcam dva estimate are themselves
instructive.

## Required changes

1. Add a degrees view to the validation readout (`036`): accuracy and precision in
   approximate degrees alongside (or toggled from) normalised units, each marked
   "estimated".
2. Add an estimated saccade-amplitude-in-degrees figure to detected saccade events
   (using the per-event angular scale), surfaced in the Step 6 event readout.
3. Add a concise explainer panel (a step or about-page section) covering: what dva
   is and why it is used; how the IPD-based estimate works; and why a browser/selfie
   camera can only approximate it (unknown pixel pitch, assumed IPD, FOV variance).
4. Use British English; do not present any degree figure as measured (§6.3).

## Do not implement

Do not:
- recompute angular scale (reuse `038`/`039`);
- claim measured accuracy/amplitude;
- add a second master show/hide control.

## Data contracts touched

Optionally adds `event_amplitude_deg` (estimated) to saccade events; otherwise
display-only. Preserves the existing schema. Record any field addition in
`current_state.md`.

## Acceptance criteria

- validation accuracy and precision are shown in estimated degrees as well as
  normalised units, labelled as estimates;
- saccade amplitude is shown in estimated degrees;
- an explainer panel states why dva matters and why the webcam estimate is
  approximate.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- After validation, confirm degree figures appear and are labelled "estimated".
- In Step 6, make a saccade and confirm an estimated amplitude in degrees.
- Read the explainer and confirm the approximation caveats are explicit.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`040_dva_units_and_explainer.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
