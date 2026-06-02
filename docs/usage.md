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

## Show implementation details

The header contains a single master **“Show implementation details”** control. When it is
off, each step page shows only the live demo area and the core explanatory content. When
it is on, the additional implementation/subprocess panels are revealed.

> In the current scaffold, both the live demo and the implementation/subprocess areas are
> **simple placeholders**. No real camera access or eye tracking is implemented yet.

## Build

```bash
npm run build
npm run preview
```

The build output is written to `dist/` and can be previewed locally before deployment.
