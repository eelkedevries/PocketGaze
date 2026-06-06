# Task: Reconcile implementation status across README, copy, and site

## Goal

Remove the contradiction between the README (which claims full implementation) and the
step copy (which still carries scaffold/"not yet implemented" wording), so the three
public surfaces describe the demos that actually exist.

## Scope

Copy in `src/steps.ts`, the README, and a consistency pass over `current_state.md`
(full reconciliation of `current_state.md` is Prompt 20 / `078`; here only avoid
contradiction). No demo or logic changes.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — the verified demo status.
2. `src/steps.ts` (the `implementationOnThisPage`, `limitations`, and `detailsContent`
   fields and the file header comment).
3. `README.md`.

## Dependencies

Assumes `057` (audit) is complete so each demo's real status is known. If the audit is
missing, stop and report.

## Rationale

The revision-4 evaluation confirmed `src/steps.ts` still carries scaffold wording in
the per-step `implementationOnThisPage` fields and in Step 0's `limitations` and
`detailsContent`, even though the demos work and the README describes them as working.
Copy must be anchored to the verified implementation, not to the deployment.

## Required changes

For every step whose demo the audit verified, the page must describe the demo that
exists, with none of the scaffold/placeholder/"not yet implemented" wording. Rewrite
Step 0's limitations to the real ones. Anchor README, source copy, and site to the
verified implementation; if the deployed site is stale and cannot be updated here,
document the mismatch and the required deployment action rather than rewriting copy to
match stale behaviour.

Verified anchors (`src/steps.ts` at commit `692327c` — confirm they still match the
audit before editing):

1. File header comment: remove the "This is scaffold content only: short,
   placeholder-level descriptions … final copy will be set by a later prompt" note;
   the copy is now final.
2. Step 0 `detailsContent`: "Processing is browser-local: when the demos are added,
   frames are analysed …" — drop "when the demos are added,"; "What can be exported
   later is derived data …" becomes "What can be exported is derived data …".
3. Step 0 `limitations`: replace all three scaffold lines with real ones. Suggested
   copy:
   - "Smartphone-camera eye tracking is inherently approximate: screen-gaze accuracy
     is modest and depends on calibration, lighting, viewing distance, and head pose."
   - "The effective frame rate is low (typically around 30 Hz), so fine saccade
     dynamics and microsaccades cannot be recovered, and movement events are labelled
     cautiously as candidates."
   - "There is no inertial sensing in the browser, so head and phone motion are
     inferred from face geometry alone; performance varies considerably across devices
     and browsers."
4. Steps 1–7 `implementationOnThisPage`: each currently reads, in effect, "The live
   demo for this step — [the step's description] — is not yet implemented. The
   placeholder below marks where it will appear." Rewrite each to present tense
   describing the demo that exists, e.g. "The live demo for this step is [the step's
   description]." Keep the existing per-step description text; only drop the em-dash
   framing and the scaffold sentence. Verify each description still matches its demo
   against the audit before committing (some panels were added by later prompts).
5. Treat README and `current_state.md` the same way: here only ensure they do not
   contradict the status this prompt sets.

## Do not implement

Do not:
- change demo or logic behaviour;
- fully reconcile `current_state.md` (that is Prompt 20 / `078`);
- rewrite copy to match a stale deployment — document the mismatch instead.

## Acceptance criteria

No working step page says scaffold/placeholder/"not yet implemented"; Step 0
limitations are real; README, source copy, and site agree with the verified
implementation, or a deployment mismatch is documented.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open each step page and confirm it describes the existing demo with no scaffold
  wording, and that Step 0's limitations read as the real ones.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`058_reconcile_implementation_status.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
