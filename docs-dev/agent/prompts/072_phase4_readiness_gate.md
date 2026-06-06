# Task: Phase 4 readiness gate

## Goal

Confirm Phases 1–3 are complete and the build is green, and record — in a development-only
note — whether Phase 4 (the educational extensions) may begin.

## Scope

A short readiness note under `docs-dev/`. No behavioural or content change. This is a gate:
do not start Phase 4 until the note says so.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. The outcomes of Prompts 1–14 (`058`–`071`) and `065b` if it ran.

## Dependencies

Assumes Prompts 1–14 (`058`–`071`) have run. Confirms whether `065b` (Prompt 8b) was
completed or correctly skipped, since Prompt 17 (`075`) depends on it.

## Rationale

Feature work should not begin on top of unresolved correctness, validity, or robustness
issues, or a red build; the gate forces an explicit go/no-go.

## Required changes

1. Confirm Phase 1–3 are complete: status reconciled; specialist wording corrected;
   terminology standardised without export breakage; input mode explicit; hidden
   capabilities surfaced; validity framing in place (claims table, Step 5 structure,
   coordinate figure, sourced accuracy bounds); robustness and ethics done (failure modes,
   variability, privacy/export inspector, actionable messages).
2. Confirm no duplicate panels, tables, or glossaries were introduced.
3. If Prompt 0 found no validation task, confirm whether Prompt 8b (`065b`) has been
   completed (or correctly skipped), since Prompt 17 (`075`) depends on it.
4. Confirm the toolchain checks pass on `main`.
5. Write a short readiness note under `docs-dev/` recording the go/no-go.

## Do not implement

Do not:
- make any behavioural or content change;
- begin Phase 4 work in this prompt.

## Acceptance criteria

A short readiness note (under `docs-dev/`) says whether Phase 4 may begin, lists
unresolved Phase 1–3 issues (including pending validation and any duplication) with
priorities, and confirms a green build. Phase 4 does not start until it says so.

## Automated checks

```bash
npm run build
npm run check
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the readiness note exists under `docs-dev/`, states the go/no-go, lists
  unresolved issues with priorities, and records the build result.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`072_phase4_readiness_gate.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
