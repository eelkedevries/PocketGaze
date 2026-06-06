# Task: Surface already-built capabilities

## Goal

For each capability the audit found present but hidden, make it visible and explained on
the relevant page, without reimplementing anything that already exists.

## Scope

Step pages and their disclosure/affordances for capabilities the audit confirmed
present-but-hidden; export discoverability. No reimplementation of existing logic.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — the present-but-hidden list
   and the implementing files.
2. The relevant step page components and the export entry points.

## Dependencies

Assumes `057` (audit). Surface only what the audit confirms exists.

## Rationale

A capability that a user cannot reach from the page, or that the page does not explain,
is effectively absent; surfacing existing work is higher-value and lower-risk than
building more.

## Required changes

1. For each capability the audit found present but hidden, make it visible and explained
   on the relevant page. Do not reimplement anything present.
2. Treat a capability as "surfaced" only if a normal user can reach it from the step
   page without reading source and the page explains what it means.
3. Per the raw-signal distinction, the raw derived signal trace may be surfaced; raw
   frames and landmarks may not.
4. Improve export discoverability.

## Do not implement

Do not:
- reimplement any capability that already exists;
- surface raw frames or raw landmark data.

## Acceptance criteria

Each confirmed-existing capability is reachable and explained by that standard; export
discoverability is improved.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- For each surfaced capability, confirm a user can reach it from the step page without
  reading source and the page explains what it means.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`063_surface_built_capabilities.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
