# Usage

How to use the PocketGaze site.

## Basic usage

PocketGaze is a seven-step explainer for smartphone-camera eye tracking. The top
navigation provides one page per step:

- Step 0: Overview
- Step 1: Capture and timing
- Step 2: Face and eye features
- Step 3: Head and phone motion
- Step 4: Eye-local and gaze signals
- Step 5: Calibration and personalisation
- Step 6: Filtering and events
- Step 7: Content and stimulus mapping

Each step page follows the same structure: a brief introduction, the options/methods, a
note on what the page implements, a live demo area, an optional implementation/subprocess
area, the outputs, and the limitations.

## Live demos

Each step page has a working live demo:

- **Step 1** — Click **Start camera** to begin capture. The demo shows per-frame timing
  (using `requestVideoFrameCallback` where available, falling back to
  `requestAnimationFrame`), live FPS, and capture latency.
- **Step 2** — After starting the camera, MediaPipe FaceLandmarker draws face landmarks,
  eye-region boxes, and iris-proxy markers over the video preview in real time.
- **Step 3** — Head-pose angles (yaw/pitch/roll) and head-motion quality labels are
  derived from the MediaPipe facial transformation matrix and shown live.
- **Step 4** — Eye-local gaze signals are computed and filtered. A provider selector
  lets you compare the custom regression signal against the optional WebEyeTrack provider.
- **Step 5** — A 9-point calibration sequence collects fixations; a ridge-regularised
  linear-regression model is fitted and residuals are visualised on a grid.
- **Step 6** — A scrolling canvas shows the raw vs One Euro–filtered eye-local signal,
  with blue shading for blinks and red for tracking loss. Candidate fixation and saccade
  events are listed in real time.
- **Step 7** — A pointer-driven (honest gaze stand-in) scrollable and zoomable content
  panel demonstrates content-coordinate mapping: a fixed target keeps a constant content
  coordinate while its screen coordinate shifts under scroll and zoom.

### Camera permission

The camera is never requested automatically. Click **Start camera** on any demo page to
begin; the browser's standard permission prompt will appear. All video processing happens
locally — no frames are uploaded. The demo requires HTTPS (or `localhost`); see
[Troubleshooting](troubleshooting.md) if the camera option is unavailable.

## Show implementation details

The header contains a single master **”Show implementation details”** control. When it is
off, each step page shows only the live demo area and the core explanatory content. When
it is on, the additional implementation/subprocess panels are revealed, showing filter
parameters, quality thresholds, event-detection logic, coordinate transforms, and more.

## Exporting session data

The **Export session data** panel (Step 1 → Show implementation details → Export session
data) downloads a combined CSV of all rows accumulated during the current session:
sample rows, event rows, calibration rows, stimulus rows, and quality rows. Raw and
filtered signals occupy separate columns; non-applicable fields are blank (not zero).
The file is saved to your machine; nothing is uploaded.

## Build

```bash
npm run build
npm run preview
```

The build output is written to `dist/` and can be previewed locally before deployment.
