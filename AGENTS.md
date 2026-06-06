# Agent instructions

Concise root rules for Claude Code and Codex. Detailed procedures live in the guides under `docs-dev/agent/` — start with `docs-dev/agent/how_to_use.md`. These rules guide behaviour but do not enforce it; safety also relies on checks, hooks, and review.

## Core principles

- One prompt = one reviewable unit. Do only what the prompt or request says; prefer the smallest correct change. No unrequested features, frameworks, tests, or architecture.
- Before editing, briefly state intended files, planned changes, and out-of-scope items.

## Turning intent into prompts

Prompts need not be hand-written. When the user describes a task in plain language, draft the prompt file for them, show the draft, and run it only on approval. For a large or vague goal, first propose a numbered sequence of small prompts and get approval before running any. `scripts/new-prompt.sh <short_name>` scaffolds a prompt manually if preferred.

## Where things live

- `docs-dev/agent/prompts/` — numbered prompt files (work queue and audit trail).
- `docs-dev/agent/` — guides: `how_to_use`, `prompt_authoring_guide`, `prompt_execution_guide`, `prompt_iteration_guide`, `document_contract`, `gpt_author_instructions`.
- `docs-dev/reference/primary_authoritative/specification.md` — binding canon (ground truth).
- `docs-dev/reference/secondary_background/` — non-binding context and examples.
- `docs-dev/planning/current_state.md` — living "where we are"; read at session start.
- `docs/` — user-facing, publishable docs.

If the repository is public, everything in it — including `docs-dev/` — is publicly visible. Never put secrets, tokens, or `.env*` files in the repository. `docs-dev/` must never reach the deployed build output (see `scripts/check-public-build.sh`).

## Ground truth

Treat `primary_authoritative/specification.md` as correct. Never contradict it; if a change would conflict, stop and flag it. Empty or stubbed sections mean "not yet decided" — no constraint. When a decision changes, update the spec and bump its version. `secondary_background/` is informational only.

Update `current_state.md` when a prompt adds a system or a key decision — for genuinely useful orientation, not after routine commits.

## Running and committing (commit-to-`main`)

Default workflow (see `prompt_execution_guide.md` for the full steps):

- Run a prompt: clean tree on `main` → make only that change → run the verify command (Project conventions) and the prompt's checks → if they pass, commit to `main` and push. One commit per prompt; no branch, no PR.
- **Commit messages:** prompt work uses the exact prompt filename; any other commit uses a conventional prefix (`feat:`, `fix:`, `docs:`, `refactor:`).
- Do not commit partial or failing work unless a WIP commit is requested. Do not rewrite history or force-push.

## Project conventions

Recorded at setup; these override the defaults above where they differ. Leave blank to keep the default.

- **Language / locale:** British English for all user-facing text. Code identifiers may use the conventional American spellings of their libraries.
- **Workflow:** Commit directly to `main`. One prompt = one reviewable unit. One commit per prompt. Prompt work uses the exact prompt filename as the commit message. No branches, no PRs unless explicitly requested.
- **Verify command:** `npm run build` (and `npm run check` for a type-only pass).
- **Testing policy:** UI and content stay test-light. Pure, deterministic pipeline logic
  (filtering, calibration mapping, blink/quality suppression, event detection,
  content-coordinate mapping, export serialisation) is unit-tested with Node's built-in
  runner via `npm run test` (`node --test`). No other tests unless a prompt asks.
- **Deploy base path:** `/PocketGaze/` (set in `vite.config.ts`).

### Project-specific reference rules

- Treat `docs-dev/reference/primary_authoritative/specification.md` as binding canon.
- Treat `docs-dev/reference/secondary_background/overview.md` as non-binding background.
- Treat `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md` as non-binding background.
- Keep `docs-dev/` out of the deployed build output (`dist/`).
- Never commit secrets, tokens, or `.env*` files.
- The site supports a single master “Show implementation details” control that reveals or hides optional implementation/subprocess panels on each step page; keep this pattern when adding new step content.

### Additional working rules

These were folded in from the revision-7 external-driver prompt batch (`docs-dev/agent/prompts/057`–`078`). They add to, and do not replace, the rules above.

- **Available checks.** The real checks in this repository are `npm run build` (verify command), `npm run check` (typecheck-only pass), and `npm run test` (`node --test`). **There is no lint script; do not assume one.** Run the available checks before every commit. If a script is missing or fails for a pre-existing reason, say so rather than inventing a result.
- **Anti-fabrication.** Do not invent benchmark values, citations, accuracy figures, or runtime test results. Any numeric empirical claim in user-facing copy must carry a real, checkable source or be removed.
- **Verification deferral.** Only if a runtime check genuinely cannot run here (no camera, browser, or network) may a task be marked "implemented; verification deferred". This covers runtime/browser verification only — never implementation scope, and never the toolchain checks, which must always run and pass. List each deferred check and add it to the manual verification checklist. Deferral may not be used to end an unfinished implementation.
- **Raw-signal distinction.** "Raw derived signal samples" (the unfiltered eye-local signal trace) are distinct from "raw video frames" and "raw landmark data". The signal trace may be surfaced and exported; raw frames and raw landmarks must stay out of the default export (an explicitly labelled, off-by-default advanced mode aside).
- **Do not duplicate.** Before creating any panel, table, glossary, figure, or demo, check the current-state audit (`docs-dev/reviews/current-state-audit.md`). If the artefact already exists, extend, relocate, or cite it; do not create a second one. Create from scratch only when the audit confirms absence.
- **Orientation notes are development-only.** Write audit and orientation notes under `docs-dev/`, never under `docs/` and never into the build output (`scripts/check-public-build.sh` enforces this).
- **External-driver commit messages.** External-driver prompts use conventional-commit prefixes (`feat:`, `fix:`, `docs:`, `refactor:`) unless they have been scaffolded as numbered prompt files under `docs-dev/agent/prompts/`, in which case the "commit message = prompt filename" rule applies (as it does for the `057`–`078` batch).

## Supporting guides

`how_to_use.md` (map + daily loop), `prompt_authoring_guide.md` (writing prompts), `prompt_execution_guide.md` (running them), `prompt_iteration_guide.md` (supersede/revert), `document_contract.md` (what documents the project expects), `reviews/code_review_guide.md` (reviews).

## Final response

Every response must end with this five-section report:

### 1. Work done
`Completed successfully`, `Partially completed`, or `Not completed` — and whether all acceptance criteria were met. Cite the commit hash and the result of the verify command / checks as evidence.

### 2. Files changed
Every file added, modified, or deleted, one line each. `None.` if no changes.

### 3. Scope deviations
Any work outside the prompt's `Required changes`, with a reason. `None.` if scope was followed exactly.

### 4. Open issues
List issues, or `None.`

### 5. Human actions required
List required actions, or `None. You can proceed to the next prompt.`
