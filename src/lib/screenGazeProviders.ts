// Assembles the screen-gaze provider registry (specification §3.4, §7.3 `018b`).
//
// Registration order sets the default: provider A (custom regression) is
// registered first and is therefore the default selection; provider B
// (WebEyeTrack) is the opt-in alternative. Importing the WebEyeTrack provider
// here does NOT pull in its TensorFlow.js runtime — that package is only loaded
// when the provider's `init()` runs its dynamic import.

import { ScreenGazeRegistry } from './screenGaze';
import { RegressionGazeProvider } from './regressionGaze';
import { WebEyeTrackGazeProvider } from './webEyeTrackGaze';

export interface ScreenGazeProviders {
  registry: ScreenGazeRegistry;
  /** Provider A (default) — exposed so calibration (`022`) can install its mapping. */
  regression: RegressionGazeProvider;
  /** Provider B (opt-in). */
  webEyeTrack: WebEyeTrackGazeProvider;
}

/** Build a registry with provider A as the default and provider B opt-in. */
export function createScreenGazeProviders(): ScreenGazeProviders {
  const regression = new RegressionGazeProvider();
  const webEyeTrack = new WebEyeTrackGazeProvider();
  const registry = new ScreenGazeRegistry();
  registry.register(regression); // first → default
  registry.register(webEyeTrack);
  return { registry, regression, webEyeTrack };
}
