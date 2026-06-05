# Task: Add the smooth-pursuit target path and pursuit-gain metric

## Goal

Add a pure module for a smooth-pursuit task: generate a moving target along a
defined path, and compute **pursuit gain** (eye velocity / target velocity) and a
tracking-error summary from paired target/gaze samples, with deterministic unit
tests.

## Scope

The pursuit path generator and pursuit metrics only (pure logic). No demo wiring
(that is `042`).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.4, §3.6, §5,
   §6.3.
2. Source: `src/lib/eventDetection.ts` (speed conventions), `src/types/session.ts`.

## Dependencies

Assumes `007b` (session model) exists; pure logic over supplied samples, testable
in isolation. If the session model is missing, stop and report.

## Rationale

Fixations and saccades are covered, but smooth pursuit is a distinct, demonstrable
eye-movement type. Pursuit can only be evoked by a moving target, and pursuit gain
is its canonical measure — a clear competence signal and a compelling demo basis.

## Required changes

1. Add `src/lib/smoothPursuit.ts`:
   - `pursuitTarget(t_ms, params)` returning the target position along a path
     (e.g. horizontal sinusoid and/or circular), parameters documented;
   - `pursuitGain(samples)` over `{ t_ms, target:{x,y}, gaze:{x,y} }` pairs,
     computing eye vs target velocity and their ratio (overall and optionally
     windowed), plus mean tracking error;
   - cautious labelling helpers (a `smooth_pursuit_candidate` marker), consistent
     with the candidate-only convention (§5/§6.3).
2. Guard degenerate inputs (zero target velocity, gaps) with documented finite
   values.
3. Add `node --test` tests: unit gain when gaze equals target; reduced gain for a
   lagging/under-shooting gaze; tracking error computed correctly.

## Do not implement

Do not:
- build the demo or render anything (that is `042`);
- present pursuit metrics as validated;
- add new export columns beyond a clearly-flagged candidate label.

## Data contracts touched

Adds: pure functions; optionally a `smooth_pursuit_candidate` event-type value
(additive to the event vocabulary) — flag it in `current_state.md`. No other
schema change.

## Acceptance criteria

- a moving target path and pursuit-gain + tracking-error metrics are computed;
- degenerate inputs are handled with documented values;
- `npm run test` covers the metrics and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the pursuit unit tests run (not zero tests) and pass.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`041_smooth_pursuit_lib.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
