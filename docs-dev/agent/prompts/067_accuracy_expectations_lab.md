# Task: State accuracy expectations against laboratory trackers (extend, do not duplicate)

## Goal

Present a single, consistent, cautiously phrased comparison of webcam/smartphone accuracy
against laboratory infrared systems where accuracy expectations are first set —
extending any existing comparison rather than adding a second, and leaving no unsourced
number.

## Scope

The accuracy comparison copy/table and its placement; reconciliation of figures across
the site. Distinct from the device/browser performance table in Prompt 12 (`069`).

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — whether a lab-versus-webcam
   comparison already exists (the project likely has a `MethodComparisonTable` on the
   About page).
2. The About page and wherever accuracy expectations are first set.

## Dependencies

Assumes `057` (audit). If an existing comparison is found, extend/relocate it; do not
create a second.

## Rationale

The figures already on the site (~0.25–0.5° research, ~1–2.5° webcam) are an unsourced
synthesis, so the most likely correct outcome is to keep the qualitative contrast and
either source or drop the exact numbers rather than introduce more.

## Required changes

1. If a lab-versus-webcam comparison exists, do NOT add a second table: verify it, add
   or relocate it to where accuracy expectations are first set if that is more useful,
   reconcile its figures so a single consistent range is used sitewide (do not introduce
   a conflicting "1.5–3°" if the table already says "1–2.5°"), and ensure each number
   carries a real, checkable source.
2. Only if no such comparison exists, create one: an order-of-magnitude comparison of
   webcam/smartphone accuracy against laboratory infrared corneal-reflection systems,
   noting dependence on lighting, resolution, viewing distance, and head pose, in
   cautious wording ("often", "roughly").
3. Prefer qualitative framing by default: any numerical figure must carry a real,
   checkable source cited in this same prompt; if you cannot source it, use qualitative
   wording only and leave no unsourced number in the copy.

## Do not implement

Do not:
- create a second comparison table if one already exists;
- leave any unsourced numerical accuracy figure in the copy;
- introduce a conflicting numeric range.

## Acceptance criteria

A single, consistent, cautiously phrased comparison appears where expectations are set;
it is not a fixed constant; every number carries a source or has been removed; no second
table was created.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm one comparison appears where expectations are first set, every number has a
  cited source (or is qualitative), and no duplicate or conflicting table remains.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`067_accuracy_expectations_lab.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
