// Pure mapping from a WebEyeTrack result to our screen-gaze estimate.
//
// Kept DOM-free and free of any `webeyetrack`/TensorFlow.js import so it is
// unit-testable under the node test runner. The provider that actually drives
// WebEyeTrack lives in `webEyeTrackGaze.ts` (DOM + dynamic import); it delegates
// the result→estimate conversion here.
//
// WebEyeTrack exposes the screen gaze as `normPog` — a normalised point-of-gaze
// `[x, y]` in 0–1 screen coordinates — and a `gazeState` of `open`/`closed`. It
// does not expose a confidence value, so `gaze_confidence` is left blank (§4.1).

import type { ScreenGazeEstimate } from './screenGaze';

/** The subset of WebEyeTrack's `GazeResult` we consume (structural, no import). */
export interface WebEyeTrackResultLike {
  normPog?: number[] | null;
  gazeState?: 'open' | 'closed' | string;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Convert a WebEyeTrack result to a `ScreenGazeEstimate`. Gaze is available only
 * when the eyes are open and `normPog` holds two finite numbers; otherwise the
 * estimate is `gaze_available: false` (e.g. during a blink or before a result).
 */
export function webEyeTrackGazeEstimate(
  result: WebEyeTrackResultLike | null | undefined,
): ScreenGazeEstimate {
  const pog = result?.normPog;
  const x = pog?.[0];
  const y = pog?.[1];
  const open = result?.gazeState !== 'closed';
  if (!open || x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) {
    return { gaze_available: false };
  }
  return { gaze_x: clamp01(x), gaze_y: clamp01(y), gaze_available: true };
}
