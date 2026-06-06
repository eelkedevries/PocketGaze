# Task: Replace silent failures with actionable, detectable messages

## Goal

For each detectable failure, show a specific, actionable message — but only when the
condition is genuinely detectable; conditions that cannot yet be detected reliably become
non-blocking TODOs, not guesses.

## Scope

Failure messaging across the demos for conditions that are detectable from existing state
or a newly added explicit detector. No fabricated inference of failures.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — which conditions are currently
   detectable and which are not.
2. The demo and tracking-quality code that holds the relevant state.

## Dependencies

Assumes `057` (audit). Drift detection may depend on validation (`065`/`065b`); if
validation is pending, treat drift as a TODO.

## Rationale

Silent failures leave users unable to act; but inventing a failure message from weak
evidence is as misleading as silence. Messages must be earned by a real detector.

## Required changes

1. For each detectable failure (no face, unstable landmarks, low frame rate, high
   calibration error, validation drift, unstable candidate events), show a specific
   actionable message.
2. Show a message only when the condition is genuinely detectable from existing state or a
   newly added explicit detector; do not infer failures from weak evidence.
3. If a condition cannot yet be detected reliably (for example, drift while validation is
   pending), document the missing signal as a non-blocking TODO instead of guessing.

## Do not implement

Do not:
- infer a failure from weak evidence;
- show a message for a condition with no reliable detector (make it a TODO instead).

## Acceptance criteria

Each detectable condition produces a specific actionable message; undetectable ones are
TODOs, not guesses.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Trigger each detectable condition where possible and confirm a specific actionable
  message appears; confirm undetectable conditions are recorded as TODOs rather than
  shown as messages.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`071_actionable_failure_messages.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
