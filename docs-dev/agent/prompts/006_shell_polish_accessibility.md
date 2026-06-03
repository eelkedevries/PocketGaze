# Task: Polish the shell, master control, and accessibility

## Goal

Improve the site shell: navigation, the master "Show implementation details" control
(including persistence), styling, responsive/mobile layout, and accessibility — without
adding any tracking functionality.

## Scope

Shell, layout, and the master control only. No camera or step-demo logic.

## Context

Implements specification §2.4 (app shell), §2.5 (master control, optional persistence),
§2.8 (device targets). Master-control state lives in the React context under
`src/context/`.

## Required changes

1. Persist the master-control setting (e.g. `localStorage`) so it survives navigation and
   reload; default off.
2. Ensure the navigation and control are usable on mid-range phone widths (responsive
   layout, no overflow); verify Android Chrome/Firefox-style viewports.
3. Accessibility pass: keyboard focus, labels/roles for the control and nav, sensible
   contrast, and a skip-to-content affordance.

## Do not implement

Do not:
- add camera access or any step demo;
- add a second show/hide control;
- introduce a UI framework or design system.

## Acceptance criteria

The task is complete when:
- the master-control setting persists across reloads;
- the shell is usable and uncluttered at narrow widths;
- the control and nav are keyboard-accessible and labelled;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`006_shell_polish_accessibility.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
