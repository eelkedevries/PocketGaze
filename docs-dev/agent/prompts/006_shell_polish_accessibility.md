# Task: Polish the shell, master control, and accessibility

## Goal

Improve the site shell: navigation, the master "Show implementation details" control
(including persistence), styling, responsive/mobile layout, and accessibility — without
adding any tracking functionality.

## Scope

Shell, layout, and the master control only. No camera or step-demo logic.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §2.4, §2.5, §2.8.
2. `docs-dev/reviews/runtime_qa_checklist.md`.
3. Source: `src/components/Layout.tsx`, `src/context/ImplementationDetailsContext.tsx`,
   `src/index.css`.

## Dependencies

This prompt assumes the scaffold shell and the master-control context from `001_setup.md`.
If they are missing, stop and report.

## Context

Master-control state lives in the React context under `src/context/`.

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
- the control and nav are keyboard-accessible and labelled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Toggle the control, navigate, and reload; confirm the setting persists.
- Emulate a ~360–414px viewport; confirm no overflow and tappable nav.
- Tab through the page; confirm focus order, visible focus, and skip-to-content.
- See `docs-dev/reviews/runtime_qa_checklist.md` (shell rows; mobile; toggle).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`006_shell_polish_accessibility.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
