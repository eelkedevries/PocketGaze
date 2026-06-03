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
