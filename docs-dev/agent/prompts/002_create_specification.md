# Task: Create the binding PocketGaze specification

## Goal

Replace the minimal placeholder at
`docs-dev/reference/primary_authoritative/specification.md` with a real, binding v1
specification that records the project decisions settled so far, leaving genuinely
undecided items as explicit placeholders.

## Scope

Author the binding specification only. Implement only the work described in this prompt.
Do not change application source code, add features, or write later prompts.

## Context

- Non-binding background: `docs-dev/reference/secondary_background/overview.md` and
  `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md`.
- Project conventions are recorded in `AGENTS.md`.
- The current scaffold (Step 0–7 pages, repeated structure, master "Show implementation
  details" control) is described in `docs-dev/planning/current_state.md`.

## Required changes

1. Rewrite `docs-dev/reference/primary_authoritative/specification.md` as a binding v1
   document with the standard sections: Scope, Architecture, Data schemas, Domain rules,
   Naming and voice, Locked decisions. Bump the version to 1.0.
2. The specification must capture at least:
   - PocketGaze's **portfolio purpose** — showing how smartphone-camera eye tracking can
     be implemented in practice;
   - the **master "Show implementation details" control** for revealing/hiding the
     optional implementation/subprocess panels on each step page.
3. Lock only what is genuinely settled. Mark undecided items explicitly as
   "_Not yet decided_" rather than inventing design decisions, schemas, names, or numbers.
4. Update `docs-dev/planning/current_state.md` to note that the binding specification now
   exists.

## Do not implement

Do not:
- change application source code or styling;
- invent binding library choices, data-export schemas, or per-step demo designs that have
  not been decided;
- write the implementation prompt queue (that is `003`).

## Acceptance criteria

The task is complete when:
- `specification.md` is a binding v1 document (version 1.0) with all standard sections;
- it records the portfolio purpose and the master show/hide control;
- undecided items are clearly marked as not yet decided;
- `current_state.md` reflects that the binding specification exists;
- `npm run build` and the repository checks pass.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`002_create_specification.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
