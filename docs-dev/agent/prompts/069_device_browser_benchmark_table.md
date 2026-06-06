# Task: Add device/browser variability with a benchmark table

## Goal

Provide a device/browser performance benchmark table with a manual measurement protocol,
fabricating nothing — leaving unmeasured cells as "not yet measured" and labelling the
table a template when largely unmeasured.

## Scope

One benchmark table (distinct from the accuracy comparison in Prompt 10 / `067`), a short
manual benchmark protocol, and optionally a live device-capability readout.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. The About / performance page where the table belongs.

## Dependencies

Assumes `057` (audit). Distinct from `067` (accuracy comparison).

## Rationale

Honest device variability data — or an explicit measurement template — informs readers
without fabricating results.

## Required changes

1. Provide a benchmark table with columns: device, browser, camera FPS, effective FPS,
   model load, inference time, data loss, calibration usable, notes. This is the
   device/browser performance table, distinct from the accuracy comparison in `067`.
2. Do not invent values: leave unmeasured cells as "not yet measured".
3. Add a short manual benchmark protocol, and optionally a live device-capability
   readout.
4. If most cells are unmeasured, visibly label the table a measurement template, not
   project results.

## Do not implement

Do not:
- invent any measured value;
- merge this with the accuracy comparison table.

## Acceptance criteria

The table exists with real or "not yet measured" entries, is labelled a template when
largely unmeasured, includes a manual protocol, and fabricates nothing.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the table renders with the listed columns, unmeasured cells read "not yet
  measured", the template label is visible when largely unmeasured, and a manual protocol
  is present.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`069_device_browser_benchmark_table.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
