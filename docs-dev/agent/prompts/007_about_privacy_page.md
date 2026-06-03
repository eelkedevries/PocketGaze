# Task: Add an about/privacy page

## Goal

Add a single about/privacy page explaining PocketGaze's portfolio purpose and its
privacy-by-default posture (local processing, no raw video stored by default).

## Scope

One static page plus a navigation entry. No camera or tracking.

## Context

Implements specification §1.1 (purpose), §2.7 (processing and privacy posture), §6.6
(privacy domain rule).

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
- it accurately states the local-processing, no-raw-video posture;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`007_about_privacy_page.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
