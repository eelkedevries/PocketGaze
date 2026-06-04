# Cross-device performance and graceful-degradation QA results

Results of the `032_cross_device_performance_qa.md` QA pass. This records the
**code-level graceful-degradation audit** (verifiable without hardware) and the
**residual limitations**. Live multi-device runs (Android Chrome/Firefox, iOS
Safari) must be performed by a human on real devices and ticked off against
`runtime_qa_checklist.md`; they cannot be executed in the CI/agent environment.

## Scope of this pass

- ✅ Code-level audit of every camera/inference demo for missing-capability and
  denied-permission handling (performed; results below).
- ⏳ Physical mid-range-Android frame-rate / responsiveness runs — **require a
  human on real hardware** (not done here; see "Human actions required").

## Graceful-degradation audit (verified in code)

| Failure mode | Handling | Where |
|---|---|---|
| Camera API absent / insecure (non-HTTPS) context | `isCameraSupported()` false → clear "Camera unavailable" message, explanatory content still shown, no crash | `CameraPreview.tsx` |
| Camera permission **denied** / unavailable | `startFrontCamera()` throws `CameraError` → "error" state with message + "Try again"; page stays usable | `CameraPreview.tsx`, `camera.ts` |
| `requestVideoFrameCallback` missing | Per-demo `scheduleNext()` falls back to `requestAnimationFrame`; Step 1 surfaces a "fallback" note and disables drop/repeat stats | all camera demos; `frameTiming.ts` |
| WebGL/GPU delegate unavailable | `FaceFeatureExtractor.init()` tries GPU then falls back to CPU delegate | `featureExtraction.ts` |
| WASM/model fails to load | `init()` rejects → demo `.catch()` sets "error" state: "The face-tracking model could not be loaded… the explanatory content above still applies." | step 2/3/4/6 demos |
| Per-frame inference throws | `detectForVideo` wrapped in try/catch → returns null, loop continues | `featureExtraction.ts` |
| No face in frame | A `sample` row with `face_quality: 0` is still written; UI shows "no-face" | `featureExtraction.ts`, demos |
| WebEyeTrack (optional provider B) fails to load | Isolated `providerBStatus: 'error'` → provider marked "unavailable" in the selector; provider A (regression) still works | step 4 demo |
| Navigation away mid-tracking | `useEffect` cleanup calls `stopLoop()` + `extractor.close()`; `CameraPreview` releases the `MediaStream` on unmount (camera indicator turns off) | all camera demos, `CameraPreview.tsx` |
| Camera auto-start on load | Never — the stream is requested only on an explicit "Start camera" click | `CameraPreview.tsx` |

## Shared-pipeline / resource posture (§2.8)

- Routing mounts **one step page at a time**; each camera demo owns a single
  `FaceFeatureExtractor` and a single camera stream, both released on unmount, so
  at most one capture+inference pipeline is active concurrently.
- UI re-renders are throttled (~10 Hz) while the session store still records every
  frame, reducing main-thread/render pressure on mid-range hardware
  (Step 1/5/6 demos).

## Residual limitations

- **No measured device benchmarks.** Effective frame rate and thermal/battery
  behaviour on specific mid-range Android phones have not been measured here;
  Step 1's live readout is the in-app way to observe effective FPS per device.
- **iOS Safari: later consideration (§2.8).** `requestVideoFrameCallback` and
  MediaPipe WASM/WebGL support vary by iOS version; the rAF fallback and
  load-failure messaging keep the page from breaking, but iOS is not a primary
  target and is not verified.
- **Monocular head-pose translation** (`tx/ty/tz`) remains approximate/unscaled
  (documented in `headPose.ts`); unaffected by this pass.
- **Front-camera mirroring** is a CSS preview convention; derived coordinates are
  in the model's own space and are not mirror-corrected for screen gaze beyond
  what calibration fits.

## Conclusion

The graceful-degradation requirements of §2.8 are met in code: every audited
failure mode shows a clear message and never a broken page, and the camera is
always released. No code changes were required by this pass; the outstanding work
is human-run multi-device verification.
