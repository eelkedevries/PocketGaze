# Task: Add the method-comparison table

## Goal

Add a compact comparison table situating this browser pipeline against
research-grade trackers (e.g. EyeLink/Tobii) and commercial webcam tools (e.g.
RealEye, Eyedid/SeeSo) across accuracy, precision, sampling rate, calibration
burden, and head-motion robustness — with units stated and ranges rather than point
claims.

## Scope

One static comparison table plus brief framing. No tracking code; no benchmarking.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §1.1, §6.3, §7.1.
2. `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md`
   §2, §4 (tool assessment, commercial comparison points), §8.
3. Source: `src/steps.ts`, `src/components/StepPage.tsx`,
   `src/components/AboutPage.tsx`.

## Dependencies

Assumes the step shell / about page exists. No tracking modules required. If the
shell is missing, stop and report.

## Rationale

A like-for-like comparison (with stated units and ranges) situates the work for a
reader and demonstrates familiarity with the landscape — without overclaiming.

## Required changes

1. Add a comparison table (on the about page, Step 0, or a dedicated section)
   covering at least: this browser pipeline, research-grade video-oculography, and
   a commercial webcam tool, across accuracy (dva), precision (dva), sampling rate
   (Hz), calibration burden, and head-motion robustness.
2. Use **ranges**, not point claims; state units; cite the background document's
   tool assessment for context and explicitly note that figures across tools are
   not directly comparable (different datasets/conditions, §6.3).
3. British English; cautious wording; no invented precise figures for any tool.

## Do not implement

Do not:
- invent exact accuracy numbers or imply measured equivalence;
- add tracking or benchmarking code;
- add a second master show/hide control.

## Acceptance criteria

- a comparison table renders with the three tool classes and the five dimensions,
  using ranges and stated units;
- a caveat notes cross-tool figures are not directly comparable.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open the comparison location; confirm the table renders with ranges, units, and
  the non-comparability caveat.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`049_method_comparison_table.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
