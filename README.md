# PocketGaze

PocketGaze is a static browser explainer and live-demo site for the seven-step
smartphone-camera eye-tracking pipeline.

It is primarily a **portfolio project**. Its goal is to show potential employers,
collaborators, and customers how smartphone-camera eye tracking can be implemented
in practice — not only by presenting demos, but by making the implementation process
understandable. Each step is intended to eventually pair a main live demo with optional
implementation panels that explain what is happening internally.

The pipeline is presented as eight pages (Step 0–7):

- **Step 0:** Overview
- **Step 1:** Capture and timing
- **Step 2:** Face and eye features
- **Step 3:** Head pose and motion quality
- **Step 4:** Eye-local and gaze signals
- **Step 5:** Calibration and personalisation
- **Step 6:** Filtering and events
- **Step 7:** Content and stimulus mapping

## Current status

The pipeline is fully implemented. Each step page has a working live demo; no
placeholders remain.

| Step | What the demo does |
|------|-------------------|
| Step 1 | Camera capture with per-frame timing (rVFC/rAF), live FPS and latency readout |
| Step 2 | Face-landmark and eye-feature overlay in real time (MediaPipe FaceLandmarker) |
| Step 3 | Head-pose estimation (yaw/pitch/roll) and head-motion quality labelling |
| Step 4 | Eye-local gaze signal extraction, One Euro filtering, per-provider comparison |
| Step 5 | Calibration: 9-point capture, ridge-regularised linear regression, residual visualisation |
| Step 6 | Signal filtering and event detection: filtered vs raw trace, blink shading, candidate fixations and saccades |
| Step 7 | Content-coordinate mapping: pointer-driven scrollable/zoomable panel showing screen vs content coordinates |

All processing happens locally in the browser — no camera frames are uploaded or stored.

A single master **”Show implementation details”** control in the header reveals or hides
the optional implementation/subprocess panels on each step page.

### Data export

After running any demo that accumulates session data, the **Export session data** panel
(Step 1 → Show implementation details) downloads a CSV file of all accumulated rows:
sample, event, calibration, stimulus, and quality rows in a single combined file, with
raw and filtered signals in separate columns and blank (not zero) for non-applicable
fields. Nothing is uploaded; the download is entirely local.

## Tech stack

React + TypeScript + Vite.

## Install, run, and build locally

Requires Node.js 22+ and npm.

```bash
git clone https://github.com/eelkedevries/PocketGaze.git
cd PocketGaze
npm install
```

Start the local development server:

```bash
npm run dev
```

Type-check (the verify command):

```bash
npm run check
```

Build the production site and preview it:

```bash
npm run build
npm run preview
```

The build output is written to `dist/`. Installs are reproducible via the committed
lockfile (`npm ci`), which is what CI uses.

## How it builds and deploys

- **Verify command:** `npm run build` (CI also runs `npm run check`).
- **Build output:** `dist/`.
- **Deploy target:** GitHub Pages, served from `https://eelkedevries.github.io/PocketGaze/`.
- **Base path:** `/PocketGaze/` (configured in `vite.config.ts`).

Deployment uses the `Deploy to GitHub Pages` GitHub Actions workflow
(`.github/workflows/deploy-pages.yml`). It runs **automatically on every push to
`main`** (and can also be triggered manually via `workflow_dispatch`), and
publishes only the built `dist/` output. A separate `Check build` workflow runs
on every push to build the site, run the public-build safety check, validate the
prompt files, and scan for secrets.

To enable Pages once: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. The repository must be public for GitHub Pages on the free plan.

## Development workflow and documentation

PocketGaze follows the `eek-a-dev` single-repository workflow. Development
documentation, agent instructions, prompt files, and reference material live under
`docs-dev/`. User-facing documentation lives under `docs/`. The `docs-dev/` directory is
development-only and is never included in the deployed build.
