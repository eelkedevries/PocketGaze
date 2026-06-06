# Task: Rename and scope Step 3

## Goal

Unless direct phone inertial data are used, rename Step 3 to "head pose and motion
quality" and state which role head pose actually serves, removing any implication of
metric 3-D translation precision from a monocular camera.

## Scope

Step 3 title and copy in `src/steps.ts` (and any title reference in README or
navigation). No head-pose logic changes.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — whether any direct inertial
   data are used and what role head pose plays.
2. `src/steps.ts` (Step 3) and the head-pose module.

## Dependencies

Assumes `057` (audit) and `059` (Step 3 wording corrected). If Step 3 already uses
inertial data, do not rename — report that instead.

## Rationale

A monocular camera cannot recover metric 3-D translation precisely; the title and copy
should reflect head pose's real role (quality labelling, compensation, exclusion, or
interpretation) and make no unvalidated motion-sensing claim.

## Required changes

1. Unless direct phone inertial data are used, rename Step 3 to "head pose and motion
   quality".
2. State which role head pose serves: quality labelling, compensation, exclusion, or
   interpretation only.
3. Remove any implication of metric 3-D translation precision from a monocular camera.

## Do not implement

Do not:
- change head-pose estimation logic;
- claim direct phone-motion sensing or metric translation precision.

## Acceptance criteria

The title and copy reflect the real role and make no unvalidated claim of direct
phone-motion sensing or metric translation precision.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open Step 3 and confirm the title and copy state the head-pose role and avoid any
  metric-translation or inertial-sensing claim.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`061_rename_scope_step3.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
