# Task: Build the validation demo with accuracy/precision readout and error map

## Goal

Wire the validation task (`035`) and metrics library (`034`) into the Step 5 page:
run validation after calibration, report **accuracy** and **precision** (distinct,
not merged), and render a **spatial error map** showing the offset vector and a
precision ellipse at each validation target.

## Scope

Step 5 validation demo UI only. Reuse `034` and `035`. No degree units yet (that
is `040`).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §6.3, §2.5,
   §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (mobile; camera rows).
3. Source: `src/demos/step5.tsx`, `src/lib/validationMetrics.ts`,
   `src/demos/validationTask.tsx`.

## Dependencies

Assumes `034` (metrics) and `035` (validation task) are complete. If either is
missing, stop and report.

## Rationale

Accuracy and precision answer different questions ("is it on target?" vs "is it
steady?") and are reported separately in the field. An error map makes the
expected edge/corner degradation visible and teaches the geometry.

## Required changes

1. After calibration, offer **Run validation**; on completion compute per-target
   and aggregate accuracy, precision (RMS-S2S), and BCEA via `034`.
2. Show a readout with accuracy and precision as **separate** figures (normalised
   units for now), plus the aggregate quality wording (avoid implying measured
   device accuracy, §6.3).
3. Render a small screen-schematic **error map**: each target as a point, an
   offset vector to the mean estimate, and a precision/BCEA ellipse; scale clearly
   labelled.
4. Add subprocess panels (per-target accuracy/precision/BCEA table) under the
   master control.

## Do not implement

Do not:
- convert to degrees (that is `040`);
- refit calibration here;
- add a second master show/hide control.

## Acceptance criteria

- validation runs on held-out targets and reports accuracy and precision as
  distinct figures plus BCEA;
- the error map shows per-target offset vectors and precision ellipses;
- per-target metrics appear only when "Show implementation details" is enabled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Calibrate then validate; confirm distinct accuracy and precision readouts and a
  plausible error map (often larger error toward edges/corners).
- Toggle the master control; confirm the per-target table shows/hides.
- See `docs-dev/reviews/runtime_qa_checklist.md` (mobile; camera; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`036_validation_demo.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
