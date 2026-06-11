# Runtime QA checklist

Manual runtime checks that `npm run build` cannot cover. Implementation prompts that change
the running site (camera, demos, navigation, deployment) should reference the relevant rows
here under their `## Manual verification` section.

Work through the rows that apply to the change. Record anything that fails in the prompt's
final report rather than committing past it.

## Shell, navigation, and content

- [ ] Local dev server loads (`npm run dev`) without console errors.
- [ ] Production preview loads (`npm run build && npm run preview`).
- [ ] The deployed GitHub Pages URL loads with the correct `/PocketGaze/` base path.
- [ ] Step 0–7 navigation works; the active step is indicated.
- [ ] Deep links and refresh work with `HashRouter` (e.g. reload on `#/step-3`).
- [ ] Unknown routes fall back to Step 0.
- [ ] Mobile viewport (~360–414px wide) is usable: no overflow, tappable nav.
- [ ] The master "Show implementation details" toggle reveals/hides subprocess panels on
      every step, and the setting persists across navigation and reload.

## Camera and tracking demos

- [ ] Camera permission **granted**: preview appears; the relevant signals/overlays render.
- [ ] Camera permission **denied**: a clear, non-breaking error state is shown.
- [ ] Camera **unsupported / unavailable**: graceful message, no crash.
- [ ] Stopping the demo **releases the camera** (OS/browser camera indicator turns off).
- [ ] Capability missing (e.g. `requestVideoFrameCallback`, WebGL/WASM): documented
      fallback or graceful message.
- [ ] Demo does not auto-start the camera on page load.

## Cross-browser

- [ ] Works on Android Chrome/Chromium.
- [ ] Works on Android Firefox.
- [ ] iOS Safari status noted (supported, degraded, or out of scope) — not required to pass.

## Privacy and build hygiene

- [ ] No raw video is stored or uploaded.
- [ ] `bash scripts/check-public-build.sh dist` passes: no `docs-dev/`, source maps, or
      private workflow references in `dist/`.

## Data export (when present)

- [ ] Export produces a single combined CSV with a `row_type` column (spec §4.1).
- [ ] Non-applicable fields are blank; raw and filtered values are in separate columns.
- [ ] `time_ms` is milliseconds from session start and consistent across subsystems.

## Tracking-robustness batch (2026-06-11) — deferred runtime checks

Added by the corner-frame / calibration / toolchain revision; these could not be run in
the agent environment (no camera or browser there).

- [ ] After the Vite 8 upgrade, the deployed site loads on Android Chrome and Firefox
      (new browser baseline: Chrome 111+/Firefox 114+/Safari 16.4+) and each step's lazy
      chunk loads on first visit (brief "Loading this step…" then the demo).
- [ ] The camera negotiates up to 1280×720 where supported and still starts on devices
      that cannot deliver it (best-effort constraints).
- [ ] Step 2: the purple corner-anchored frame stays put during blinks (no pulsing),
      tilts with head roll, and the corner anchor dots sit on the eye corners; the EAR
      trace shows both hysteresis lines and open/closed no longer flickers near them.
- [ ] Step 4: the eye-local trace no longer dips when squinting/blinking (eyelid
      invariance) and rotates cleanly under head roll.
- [ ] Step 5: calibration runs ~9 dots × (0.7 s settle + ~0.9 s capture) without
      stalling when quality is poor (tick budget); blinking during a dot visibly reduces
      "Samples used"; the quality panel reports rejected outliers when you glance away
      during a dot.
- [ ] Step 5: after calibrating, turning the head slightly while fixating a point moves
      the estimate less than it did before the head-pose features (qualitative check).
- [ ] Step 5: validation skips blink frames (blink through a target — captured count
      stays below 8 × targets) and still completes.
- [ ] Step 6: a fast head turn now yields saccade_during_head_movement /
      uncertain_head_motion labels (real labeller), and brief landmark spikes no longer
      appear as phantom micro-saccades.
- [ ] Browser tab/history titles change per step and on the About page.
