# Task: Update docs and verify deployment

## Goal

Bring the public and development documentation in line with the now-functional site, and
verify the GitHub Pages deployment and public-build hygiene.

## Scope

Documentation updates and deployment verification only. No feature code changes.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §1.4, §2.1.
2. `docs-dev/reviews/runtime_qa_checklist.md` (shell; privacy/build-hygiene rows).
3. Source: `README.md`, `docs/`, `docs-dev/planning/current_state.md`.

## Dependencies

This prompt assumes:
- The implementation queue (`004`–`032`) is complete (the site is functional).
If major features are missing, stop and report.

## Context

Closes the build queue; aligns docs with reality.

## Required changes

1. Update `README.md` and `docs/` (installation, usage, troubleshooting) to describe the
   real, working demos and the CSV data export, replacing scaffold-only wording.
2. Update `docs-dev/planning/current_state.md` to reflect that the pipeline is implemented.
3. Verify the deployed site loads at the Pages URL with the correct base path, and that
   `scripts/check-public-build.sh dist` confirms `docs-dev/` and private material are
   absent from the build.

## Do not implement

Do not:
- change feature/demo behaviour;
- add new tracking functionality;
- expose any development-only material in the build.

## Data contracts touched

Adds: none.
Preserves: all data shapes and the export format.
Does not: change behaviour.

## Acceptance criteria

The task is complete when:
- the README and `docs/` describe the working site and export accurately;
- `current_state.md` reflects the implemented pipeline;
- the deployed site loads correctly and the public-build check passes.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Load the deployed GitHub Pages URL; confirm it loads with the `/PocketGaze/` base path and
  Step 0–7 work.
- Confirm `bash scripts/check-public-build.sh dist` reports no `docs-dev/`/source-map/
  private references.
- See `docs-dev/reviews/runtime_qa_checklist.md` (shell; build-hygiene rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`033_docs_and_deploy_verification.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
