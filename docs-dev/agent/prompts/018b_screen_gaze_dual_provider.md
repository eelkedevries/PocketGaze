# Task: Revise the screen-gaze decision to dual, user-selectable providers

Supersedes: 018_webeyetrack_spike.md

## Goal

Revise the `018` screen-gaze decision from no-go to **go with two user-selectable providers**
(custom regression baseline as default; WebEyeTrack opt-in), and record it in the
specification.

## Scope

Specification edit only — the recorded decision and its rationale. No provider code, no npm
install, no WebEyeTrack assets (those are `019`/`020`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.4, §7.3, §8.
2. The prior `018` decision recorded in §7.3 (the no-go being superseded).

## Dependencies

This prompt assumes:
- `017_eye_local_signal.md` is complete (the eye-local features the baseline maps from).
- A published, MIT-licensed `webeyetrack` npm package exists (verified: `webeyetrack@0.0.2`).
If either is missing, stop and report.

## Context

The user has chosen to offer both screen-gaze methods with a runtime switch. A published npm
package removes the earlier self-hosting/release blocker; WebEyeTrack's TensorFlow.js cost is
accepted as the price of an opt-in option. Default is the lightweight custom regression.

## Required changes

1. Bump the spec version and add a changelog entry recording the revised decision.
2. Update §7.3: the Screen-gaze table row and the spike subsection now record **go — two
   user-selectable providers** (A: custom calibration + JS regression baseline, default;
   B: WebEyeTrack adapter, opt-in), both behind one `ScreenGazeProvider` interface writing the
   same §4 `gaze_*` fields. Note the self-hosting requirement and the TensorFlow.js cost.
3. Update §3.4 to describe the implemented screen-gaze layer as offering both providers.
4. Update the §8 locked decision for screen gaze to the dual-provider form.

## Do not implement

Do not:
- install `webeyetrack`, add TensorFlow.js, or add any WebEyeTrack assets;
- write the provider interface or either provider (`019`);
- build the Step 4 demo or its selector (`020`);
- present screen gaze as precise without a validated mapping (Domain rule §6.2).

## Acceptance criteria

The task is complete when:
- the spec records go with two user-selectable screen-gaze providers (default: custom
  regression), version bumped, §3.4/§7.3/§8 consistent;
- no provider code or third-party assets are added.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the spec change is decision-only: no dependency or asset was added to the build.
- Confirm §3.4, §7.3, and §8 agree on the dual-provider decision and the default.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using this
file's exact filename (`018b_screen_gaze_dual_provider.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
