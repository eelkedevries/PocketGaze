# Installation

How to install and run PocketGaze locally.

## Prerequisites

- Node.js 22+ and npm.

## Install

```bash
git clone https://github.com/eelkedevries/PocketGaze.git
cd PocketGaze
npm install
```

## Run locally

```bash
npm run dev
```

Open the printed local URL in a browser. The site opens on Step 0 (Overview); use the
top navigation to move between Step 0–7.

The development server runs over HTTP on `localhost`, which counts as a secure context
for `getUserMedia`, so all camera demos work locally without HTTPS.

## Run tests

```bash
npm run test
```

Runs the unit tests for the pure pipeline logic (filtering, calibration, event detection,
export serialisation, and related modules) using Node's built-in test runner.
