# Task: Live latency budget on Step 1

## Goal

Add a live end-to-end latency budget on Step 1 across camera capture, browser frame
callback, model inference, filtering, and rendering.

## Scope

A live latency-budget readout on Step 1. No change to the tracking pipeline itself beyond
the instrumentation needed to time its stages.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) and the Phase 4 readiness note
   (`072`).
2. The Step 1 demo and the frame-timing / pipeline code.

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Pairs with `073a` on Step 1.

## Rationale

A live latency budget makes the end-to-end cost of each pipeline stage concrete and
teaches where delay accumulates.

## Required changes

1. Add a live end-to-end latency budget across camera capture, browser frame callback,
   model inference, filtering, and rendering.

## Do not implement

Do not:
- fabricate timings — measure real stage durations;
- alter the pipeline's behaviour beyond timing instrumentation.

## Acceptance criteria

The latency budget is present and updates live on Step 1.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 1, confirm the latency budget displays per-stage times and updates live while
  the demo runs.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`073b_step1_latency_budget.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
