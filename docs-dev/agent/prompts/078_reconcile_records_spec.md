# Task: Update the planning note and the specification

## Goal

Reconcile the project's own records with the code: update `current_state.md` to match what
exists, fold the additive schema/event changes into the specification, record the Phase 1
terminology/labelling decisions, and bump the spec version — without unilaterally deciding
genuine open design questions.

## Scope

`docs-dev/planning/current_state.md` and
`docs-dev/reference/primary_authoritative/specification.md`. No code or copy changes.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) and the work completed in
   Phases 1–4 (`058`–`077`).
2. `docs-dev/planning/current_state.md` and the specification, including its changelog.

## Dependencies

Runs last, after all Phase 1–4 work, so it reconciles the records against the finished
work.

## Rationale

The records drifted from the code (notably the false claim that scaffold wording was
removed); reconciling them last, against verified work, keeps the binding canon trustworthy.

## Required changes

1. Update `docs-dev/planning/current_state.md` so it accurately describes what exists,
   correcting in particular any claim that scaffold wording was removed when it was not, and
   recording the surfaced capabilities and new educational extensions.
2. Reconcile `docs-dev/reference/primary_authoritative/specification.md`: fold in the
   additive schema fields and event values its own changelog flags as not yet reconciled,
   record any terminology or labelling decisions made in Phase 1 (e.g. the Step 3 rename,
   the linear-mapping label), and bump the spec version with a changelog entry.
3. Do not change binding decisions beyond what the completed work actually established;
   where the code and spec still disagree and the resolution is a genuine design choice,
   list it rather than deciding it unilaterally.

## Do not implement

Do not:
- change code or copy;
- alter binding decisions beyond what the completed work established;
- silently resolve a genuine open design question.

## Acceptance criteria

`current_state.md` matches the verified code; the specification is reconciled and
version-bumped with a changelog entry; remaining genuine design questions are listed, not
silently resolved.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Read `current_state.md` and the specification changelog and confirm they match the
  verified code, the version is bumped, and open design questions are listed.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`078_reconcile_records_spec.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
