# Task: Add an about/privacy page

## Goal

Add a single about/privacy page explaining PocketGaze's portfolio purpose and its
privacy-by-default posture (local processing, no raw video stored by default).

## Scope

One static page plus a navigation entry. No camera or tracking.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §1.1, §2.7, §6.6.
2. `docs-dev/planning/current_state.md`.
3. Source: `src/components/Layout.tsx`, `src/App.tsx` (routing), `src/steps.ts`.

## Dependencies

This prompt assumes the scaffold shell and routing from `001_setup.md`. If routing is
missing, stop and report.

## Context

Implements the portfolio purpose and privacy posture as a standalone page.

## Required changes

1. Add an about/privacy page describing: the portfolio intent; that all real processing is
   browser-local; that raw video is not stored by default; that derived data is treated as
   sensitive; and what the site does and does not do.
2. Link it from the shell (e.g. footer or nav) without disturbing the Step 0–7 ordering.
3. Use British English.

## Do not implement

Do not:
- claim regulatory compliance;
- add camera access or tracking;
- add a second show/hide control.

## Acceptance criteria

The task is complete when:
- the about/privacy page renders and is reachable from the shell;
- it accurately states the local-processing, no-raw-video posture.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open the about/privacy page from the shell link.
- Confirm the Step 0–7 navigation order is undisturbed.
- See `docs-dev/reviews/runtime_qa_checklist.md` (shell/navigation rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`007_about_privacy_page.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
