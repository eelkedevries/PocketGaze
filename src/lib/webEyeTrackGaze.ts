// Provider B — WebEyeTrack adapter (specification §3.4, §7.3 `018b`).
//
// An OPT-IN, model-based screen-gaze provider wrapping the `webeyetrack` package
// (MIT). Per the `018b` decision and its documented self-hosting carve-out
// (spec §2.7 note), WebEyeTrack fetches its MediaPipe model + WASM and BlazeGaze
// weights from third-party CDNs at runtime; raw camera frames still never leave
// the device. The package is loaded with a DYNAMIC import inside `init`, so
// neither WebEyeTrack nor its TensorFlow.js runtime is pulled into the default
// bundle — only when a user actually selects this provider.
//
// WebEyeTrack's `step(frame, ts)` is async; our `ScreenGazeProvider.estimate` is
// synchronous. The adapter therefore kicks off `step` for each frame and returns
// the most recent completed result, which is the right behaviour for a live demo
// reading the latest gaze each animation frame.

import type { GazeResult } from 'webeyetrack';
import type { ScreenGazeProvider, ScreenGazeInput, ScreenGazeEstimate } from './screenGaze';
import { webEyeTrackGazeEstimate } from './webEyeTrackGazeMap';

/** The minimal WebEyeTrack surface this adapter drives. */
interface WebEyeTrackEngine {
  initialize(): Promise<void>;
  step(frame: ImageData, timestamp: number): Promise<GazeResult>;
}

export class WebEyeTrackGazeProvider implements ScreenGazeProvider {
  readonly id = 'webeyetrack';
  readonly label = 'WebEyeTrack (model-based)';
  readonly requiresCalibration = true;

  private engine: WebEyeTrackEngine | null = null;
  private latest: ScreenGazeEstimate = { gaze_available: false };
  private inFlight = false;

  /** Dynamically load and initialise WebEyeTrack (fetches its models from CDN). */
  async init(): Promise<void> {
    if (this.engine) return;
    const mod = await import('webeyetrack');
    const engine = new mod.WebEyeTrack() as unknown as WebEyeTrackEngine;
    await engine.initialize();
    this.engine = engine;
  }

  estimate(input: ScreenGazeInput): ScreenGazeEstimate {
    const frame = input.frame;
    if (this.engine && !this.inFlight && typeof ImageData !== 'undefined' && frame instanceof ImageData) {
      this.inFlight = true;
      this.engine
        .step(frame, input.timeMs)
        .then((result) => {
          this.latest = webEyeTrackGazeEstimate(result);
        })
        .catch(() => {
          this.latest = { gaze_available: false };
        })
        .finally(() => {
          this.inFlight = false;
        });
    }
    return this.latest;
  }

  dispose(): void {
    this.engine = null;
    this.latest = { gaze_available: false };
    this.inFlight = false;
  }
}
