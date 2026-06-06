# Task: Reconcile the project conventions file

## Goal

Merge the revision-7 driver conventions into `AGENTS.md` (and the `CLAUDE.md`
wrapper) without overwriting the repository's existing working rules, so every later
prompt in this batch can rely on a single, consistent conventions layer.

## Scope

Editing `AGENTS.md` (and `CLAUDE.md` only if its wrapper text needs it). No code,
copy, or demo changes. Merge rather than replace.

## Required reading

1. `AGENTS.md` and `CLAUDE.md` as they stand.
2. `000b_index_revision7.md` (the conventions block this prompt folds in).

## Dependencies

Assumes `057` (the baseline audit) has run, so disagreements are known. If `AGENTS.md`
is missing, stop and report.

## Rationale

The repository already defines a working five-section final report, a commit-to-`main`
workflow, and a "commit message = prompt filename" rule for its numbered prompts. The
driver conventions must be folded in additively, not pasted over the top, or the
existing workflow breaks.

## Required changes

1. Do NOT overwrite `AGENTS.md` with the conventions block verbatim. Keep the existing
   five-section final report, the commit-to-`main` workflow, and the
   "commit message = prompt filename" rule for numbered prompts.
2. Add these rules from the driver conventions: the anti-fabrication rule (no invented
   benchmarks, citations, accuracy figures, or runtime results); the
   verification-deferral rule (runtime/browser checks only, never implementation scope
   or the toolchain checks); the raw-signal distinction (raw derived signal samples are
   distinct from raw video frames and raw landmark data; the signal trace may be
   surfaced/exported, frames and landmarks must not); the do-not-duplicate rule (check
   the Prompt 0 audit before creating any panel, table, glossary, figure, or demo); and
   the `docs-dev/`-only rule for audit and orientation notes.
3. Name the real checks — `npm run build`, `npm run check`, `npm run test` — and state
   that there is no lint script.
4. Record that these external-driver prompts use conventional-commit prefixes unless
   scaffolded as numbered prompt files, in which case the filename-as-commit-message
   rule applies (as it does for this batch).
5. Flag, but do not silently resolve, any place where these additions conflict with an
   existing rule; report the conflict in the final report.

## Do not implement

Do not:
- replace or remove the existing five-section report or commit convention;
- silently resolve a conflict between an added rule and an existing one;
- change any code, copy, or demo.

## Acceptance criteria

`AGENTS.md` contains the merged rules with no loss of the existing five-section report
or commit convention; the added rules are present; any conflict is flagged in the
final report rather than resolved silently.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Read `AGENTS.md` end to end and confirm the existing report/workflow rules survive
  intact and the added rules read coherently with them.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`057b_reconcile_conventions.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
