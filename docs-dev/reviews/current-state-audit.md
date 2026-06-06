# Current-state audit (Prompt 057 / driver Prompt 0)

Establishes verified ground truth for the revision-7 prompt batch (`057`–`078`). Every
later prompt anchors to this note rather than to the planning documents or the
deployment. Where the code and a planning document disagree, the code is treated as
correct.

**Verification method.** This container has no camera and no browser automation, so the
Step 1–7 live demos were verified by source inspection only, not by running them in a
browser. Runtime/browser confirmation is deferred and captured in the manual checklist
below. The toolchain checks were run for real.

## 1. Toolchain baseline

Scripts in `package.json`: `dev` (vite), `build` (`tsc -b && vite build`), `preview`
(`vite preview`), `check` (`tsc -b --noEmit`), `test` (`node --test`), `postinstall`
(`copy-wasm.js`). **There is no lint script** — none is defined; do not assume one.

Results on `main` at the time of this audit (deps installed with `npm ci`):

- `npm run build` — **pass** (vite build succeeds; emits a >500 kB chunk-size warning only).
- `npm run check` — **pass** (no type errors).
- `npm run test` — **pass**: 234 tests, 73 suites, 0 fail, 0 skipped, 0 todo.

No pre-existing failures. Note: a clean container has no `node_modules`; `npm ci` must run
before the checks, and `npm run build` will otherwise fail with "Cannot find module"
errors that are environmental, not code faults.

## 2. Per-step demo status

All demos are registered in `src/demos/registry.ts` and, by source inspection, are fully
implemented (contradicting the stale "not yet implemented" copy in `src/steps.ts`; see §5).
Steps 1–6 require a camera; Step 7 is pointer-driven.

| Step | Demo file | What it does | Input mode | Camera |
|---|---|---|---|---|
| 1 | `demos/step1.tsx` | Camera preview + live frame-rate readout, per-frame timing, drop/repeat indicators | camera frames | yes |
| 2 | `demos/step2.tsx` | Landmark/eye-region/iris-proxy overlay, per-eye open/closed + quality, zoomed iris crop, live EAR trace | camera → landmarks | yes |
| 3 | `demos/step3.tsx` | Head-pose readout (yaw/pitch/roll, rotation speed), 3-axis gizmo, motion-quality label | camera → head pose | yes |
| 4 | `demos/step4.tsx` | Eye-local trace + optional screen-gaze overlay; provider selector (regression / WebEyeTrack); live RMS-S2S; head-compensation toggle | eye-local / calibrated gaze | yes |
| 5 | `demos/step5.tsx` | Follow-the-dots calibration (9 dots) → fitted linear mapping → held-out validation (8 offset dots), accuracy/precision/BCEA, error map, warped grid | eye-local → calibrated gaze | yes |
| 6 | `demos/step6.tsx` | Raw vs One Euro-filtered trace, blink + tracking-loss shading, candidate-event stream, live scanpath, threshold visualisation | eye-local (raw) → filter → events | yes |
| 7 | `demos/step7.tsx` | Screen vs content-relative coordinate contrast under scroll/zoom | pointer (gaze stand-in) | no |

Task components reused by the steps: `calibrationTask.tsx` (eye-local capture),
`validationTask.tsx` (held-out, writes `quality` rows tagged `task_phase: 'validation'`),
`pursuitTask.tsx` (moving target + pursuit gain, calibrated gaze),
`gazeContingentTask.tsx` (spotlight; dynamic indicator "Signal source: calibrated gaze /
pointer stand-in (not gaze) / none"), `scanpathHeatmap.tsx` (scanpath + toggleable
heatmap from fixations), `aoiTask.tsx` (4 AOIs; per-AOI dwell, fixation count, TTFF;
pointer-driven).

Input-mode indicators are mostly dynamic (Step 4 provider/availability text; Step 1
timing source; `gazeContingentTask` signal-source line). Step 3's motion label and Step 7's
pointer caveat are present; per-demo consistency of an explicit mode indicator is the
subject of Prompt 5 (`062`).

## 3. Capability inventory (exists / surfaced / implementing file)

| Capability | Exists | Surfaced | Implementing file(s) |
|---|---|---|---|
| Held-out validation | yes | yes (Step 5) | `demos/validationTask.tsx`, `lib/validationMetrics.ts`, `lib/validationErrorMap.ts`, `demos/step5.tsx` |
| Precision metrics RMS-S2S, BCEA | yes | yes (Step 4 live RMS-S2S; Step 5 BCEA + per-target) | `lib/validationMetrics.ts`, `lib/livePrecision.ts`, `components/LivePrecision.tsx` |
| Degrees-of-visual-angle estimate | yes | partial (shown in Step 5 readout, labelled "estimated") | `lib/visualAngle.ts` (consumed by Step 5 and Step 6 demos) |
| Raw-plus-filtered retention | yes — retained raw is the **unfiltered eye-local SIGNAL samples** (e.g. `gaze_x_raw` vs `gaze_x_filtered`), not video frames or landmarks | yes (Step 6 shows both traces; CSV has both columns) | `types/session.ts`, `lib/sessionStore.ts`, `lib/exportCsv.ts` |
| CSV / session export | yes | yes (export button in Step 1 implementation panel; reachable from Step 6) | `lib/exportCsv.ts`, `components/ExportButton.tsx` |
| Lab-vs-webcam comparison table | yes | yes (About page) | `components/MethodComparisonTable.tsx` |
| Step 0 glossary | yes (3 terms: eye-local signal, screen-gaze estimate, content-mapped coordinate) | yes (Step 0) | `src/steps.ts` |
| AOI demo | yes | yes | `demos/aoiTask.tsx`, `lib/aoiMetrics.ts` |
| Heatmap + scanpath | yes | yes | `demos/scanpathHeatmap.tsx`, `lib/fixationAggregation.ts` |
| Gaze-contingent demo | yes | yes | `demos/gazeContingentTask.tsx` |
| Smooth-pursuit demo | yes | yes | `demos/pursuitTask.tsx`, `lib/smoothPursuit.ts` |
| Event detection (hybrid I-VT/I-DT) | yes | yes (Step 6) | `lib/eventDetection.ts` |

**Consequences for the do-not-duplicate rule:** Prompts 8b (`065b`), 18a (`076a`), and
18d (`076d`) target capabilities that already exist — they should be recorded as skipped or
reduced to surface/extend, not rebuilt. The glossary (Prompt 3 / `060`), method-comparison
table (Prompt 10 / `067`), privacy section (Prompt 13 / `070`), and limitation panels
(Prompt 11 / `068`) all already exist and must be **extended in place**.

## 4. Existing panels / tables / figures (do not duplicate)

- Limitation panels in `components/LimitationPanels.tsx`: `SamplingRatePanel` (Step 1),
  `NoCornealReflectionPanel` (Step 3), `OutOfReachPanel` (About). Reuse this pattern for
  Prompt 11 (`068`).
- `MethodComparisonTable` rendered on the About page; states research ~0.25–0.5°
  accuracy / ~0.01–0.05° precision vs webcam ~1–2.5° / ~0.5–1.5°, sampling ~250–2000 Hz vs
  ~30 Hz, with a "not directly comparable" caption. Figures are attributed to
  `secondary_background/smartphone_eye_tracking_background.md` but are an unsourced synthesis
  (no external citation). Relevant to Prompt 10 (`067`).
- Privacy: About page has a "Processing and privacy" section and a "What this site does not
  do" list (no upload of frames/landmarks/gaze; no raw-video storage by default). Extend for
  Prompt 13 (`070`).
- No dedicated coordinate-system figure exists (Step 2 draws a normalisation box; Step 7
  contrasts coordinates interactively). Prompt 9 (`066`) creates one.

## 5. Code / doc disagreements (trust the code)

1. **Stale scaffold wording in `src/steps.ts`** (the central finding; Prompt 1 / `058`):
   - File header comment: "This is scaffold content only: short, placeholder-level
     descriptions that establish the navigation and the repeated page structure."
   - Step 0 `detailsContent`: "Processing is browser-local: **when the demos are added,**
     frames are analysed …" and "What can be exported **later** is derived data …".
   - Step 0 `limitations`: a scaffold line "This is an early scaffold: the per-step live
     demos are still placeholders and are being added incrementally." (Note: only one
     scaffold limitation line was found, not three — Prompt 1's "replace all three" should be
     read as "replace the scaffold limitation(s) with the real ones"; confirm the array
     contents when editing.)
   - Steps 1–7 `implementationOnThisPage`: each carries a full, accurate description of the
     demo followed by "— is not yet implemented. The placeholder below marks where it will
     appear." The description is correct; only the scaffold framing/sentence must be dropped.

2. **`current_state.md` understates demo status**: it still describes the per-step live
   demos as placeholders being added incrementally, while all Step 1–7 demos are implemented.
   Reconciled in Prompt 20 (`078`).

3. **Specialist wording to correct (Prompt 2 / `059`)**:
   - Step 1 `disclosure.maths`: "At ~30 Hz the Nyquist limit is ~15 Hz, so movements faster
     than that (peak saccade velocity, microsaccades) cannot be reconstructed." (conflates
     Nyquist with movement speed).
   - Step 3 `disclosure.maths`: "…robust at the gimbal-lock singularity…".
   - `components/LimitationPanels.tsx` `SamplingRatePanel`: "…the *main sequence* (the
     velocity–amplitude relationship)…unfold in tens of milliseconds…".
   - Calibration mapping is **linear least-squares with ridge regularisation** (confirmed in
     `lib/gazeCalibration.ts`: `(AᵀA + ridge·I)·c = Aᵀ·t`; `regressionGaze.ts` builds a
     bias + combined + per-eye 7-feature vector). Step 5 prose already says
     "ridge-regularised"/"linear least-squares" and does **not** say "polynomial" — so the
     "relabel polynomial→linear" part of Prompt 2 may already be satisfied; confirm there is
     no stray "polynomial" before editing.

4. **Specification (`specification.md`) v1.6 (2026-06-03)**: changelog flags additive fields
   (`viewing_distance_mm`, `deg_per_norm_x/y`, `angular_scale_is_estimate`, `head_*_mm`;
   quality-row validation fields) and the `smooth_pursuit_candidate` event value as present in
   code but **pending a spec update if adopted**. Reconciled in Prompt 20 (`078`).

## 6. Manual verification checklist (runtime/browser, deferred here)

Run on a real device with a camera, in a Chromium-based browser:

- [ ] Steps 1–6: grant camera; confirm each demo renders and updates live (frame rate, overlay,
      head pose, eye-local/gaze trace, calibration+validation, filtered trace + events).
- [ ] Step 7: confirm pointer-driven coordinate contrast under scroll/zoom.
- [ ] Step 5: complete calibration then validation; confirm accuracy/precision/BCEA and error map.
- [ ] Export: trigger CSV export; confirm it contains derived signal + events + metadata and
      **no** raw frames or raw landmarks.
- [ ] Confirm the deployed GitHub Pages build matches source (could not be checked from here).

## Conclusion

The pipeline and demos are substantially complete. The revision-7 batch is therefore mostly
reconciliation, correctness, surfacing, and education — not new pipeline construction. The
do-not-duplicate rule is load-bearing for this batch (see §3–§4).
