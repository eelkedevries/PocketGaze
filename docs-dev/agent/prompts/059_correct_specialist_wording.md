# Task: Correct specialist technical wording (no modelling changes)

## Goal

Fix the statements a domain reader would catch — the Nyquist/main-sequence framing,
the gimbal-lock claim, the calibration-mapping label, the rank-deficiency note, the
"always available" overclaim, and the per-eye iris labelling — without changing any
modelling.

## Scope

Copy in `src/steps.ts` (the `disclosure.maths` tiers) and
`src/components/LimitationPanels.tsx` (the Step 1 sampling-rate panel), plus UI labels
where the calibration mapping or per-eye labels appear. No new polynomial terms, no
modelling changes.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. `src/steps.ts` (Step 1 and Step 3 `disclosure.maths`; Step 5 methods prose).
3. `src/components/LimitationPanels.tsx` (Step 1 `SamplingRatePanel`).
4. The gaze-calibration module and the Step 4 maths tier (to confirm the mapping is
   linear/affine) and the iris-landmark / camera-mirroring convention.

## Dependencies

Assumes `057` (audit). If the named files have moved, locate them via the audit before
editing.

## Rationale

These are correctness fixes, not modelling changes: the copy currently conflates a
temporal-frequency bound with movement speed, overstates numerical robustness at a
singularity, may mislabel a linear fit as polynomial, and asserts signals are "always"
available.

## Required changes

1. Step 1 — stop conflating the Nyquist limit (a temporal-frequency bound) with
   movement speed. Explain that at 30 Hz a 30–80 ms saccade spans roughly one to three
   frames, so its duration, onset/offset, and peak velocity are poorly recoverable, and
   that microsaccades are out of reach because of spatial resolution and sub-frame
   duration, not because of Nyquist. Also fix "the main sequence unfolds in tens of
   milliseconds": the individual saccade unfolds in tens of milliseconds; the main
   sequence is the cross-saccade amplitude–peak-velocity (and amplitude–duration)
   relationship, which therefore cannot be characterised at this rate.
2. Step 3 — replace "robust at the gimbal-lock singularity" with accurate wording, e.g.
   "computed with atan2, which is numerically stable across the full ±180° range and
   avoids domain errors; the Euler decomposition itself still degenerates at the
   gimbal-lock singularity (middle-axis angle near ±90°), where yaw and roll are no
   longer separable — though in practice the face is lost before that pose is reached".
3. Step 5 label — inspect the implementation; if the mapping is linear/affine, relabel
   copy and UI accordingly (the Step 4 maths tier and the gaze-calibration module
   indicate a linear least-squares fit, while the Step 5 methods prose still lists
   "polynomial"). Do not implement polynomial terms here; if desirable, record a
   separate recommendation.
4. Step 5 — state that the calibration design matrix is rank-deficient (the
   combined-eye feature columns are exact averages of the per-eye columns), so ridge
   regularisation is required for a well-posed solve.
5. Qualify "eye-local signal is always available" (and "always computable") to
   "available only when eye-region and iris detection succeed with sufficient quality".
6. Step 2 — the per-eye (left/right) labelling of the MediaPipe iris landmarks depends
   on the mirroring convention of the camera feed, so the copy's left/right eye labels
   can be inverted relative to the subject. Verify the labels in copy and UI against the
   implementation's convention and make them consistent; resolve this monocular
   eye-label question once and apply it uniformly.

Verified strings (`src/steps.ts` at commit `692327c`, both in `disclosure.maths`;
confirm before editing):

- Step 1 maths currently ends: "At ~30 Hz the Nyquist limit is ~15 Hz, so movements
  faster than that (peak saccade velocity, microsaccades) cannot be reconstructed."
  Suggested replacement: "At ~30 Hz each frame is ~33 ms apart, so a 30–80 ms saccade
  spans only one to three samples: its onset, offset, duration, and peak velocity
  cannot be recovered, even though the displacement itself is visible. Microsaccades are
  out of reach because of their sub-degree amplitude and sub-frame duration, not because
  of a Nyquist frequency bound."
- Step 3 maths currently reads: "(a Tait–Bryan/Euler decomposition, robust at the
  gimbal-lock singularity)". Suggested replacement: "(a Tait–Bryan/Euler decomposition;
  atan2 keeps it numerically stable across the full ±180° range, but the decomposition
  itself still degenerates at the gimbal-lock singularity near ±90° of the middle axis,
  where yaw and roll are no longer separable — in practice the face is lost before that
  pose is reached)".
- The related "main sequence unfolds in tens of milliseconds" wording is in
  `src/components/LimitationPanels.tsx` (the Step 1 `SamplingRatePanel`), not
  `steps.ts`; correct it there in the same prompt.

## Do not implement

Do not:
- add polynomial calibration terms or change any modelling;
- alter the calibration solve beyond labelling and the rank-deficiency note.

## Acceptance criteria

Each statement is corrected; the calibration label matches the implementation; the
per-eye labels match the implementation's mirroring convention; no polynomial terms
were added.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Read the Step 1, Step 3, and Step 5 maths tiers and the Step 1 sampling-rate panel,
  and confirm each corrected statement reads accurately and the eye labels are
  consistent with the demo.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`059_correct_specialist_wording.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
