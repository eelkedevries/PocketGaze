// Provider A — custom regression screen-gaze mapping (specification §3.4, §7.3 `018b`).
//
// A lightweight, fully self-hosted WebGazer-style baseline: a linear least-squares
// mapping from the eye-local signal (`017`) to normalised screen coordinates. This
// module owns the mapping REPRESENTATION and its application; FITTING the mapping
// from a calibration set is `022`. With no mapping set, the provider reports
// `gaze_available: false` so screen gaze degrades cleanly before calibration (§6.2).
//
// Pure and framework-agnostic (no DOM), so it is unit-testable.

import type { EyeLocalSignal } from './eyeLocalSignal';
import type { ScreenGazeProvider, ScreenGazeInput, ScreenGazeEstimate } from './screenGaze';

/** The head-pose angles consumed by the gaze features (degrees). */
export interface HeadPoseAngles {
  yaw: number;
  pitch: number;
  roll: number;
}

/**
 * Scale (degrees) that maps head-pose angles into roughly [-1, 1] so they sit
 * on the same footing as the eye-local features under one ridge term.
 */
export const HEAD_ANGLE_SCALE_DEG = 30;

/**
 * Feature vector fed to the linear mapping. A bias term, the combined and
 * per-eye eye-local coordinates, and the scaled head-pose angles:
 * `[1, cx, cy, lx, ly, rx, ry, yaw', pitch', roll']`. Keeping the bias first
 * lets a mapping encode a constant offset.
 *
 * The head-pose terms matter because the iris-in-eye position alone is
 * ambiguous: turning the head while fixating one point shifts the eye-local
 * signal exactly like a gaze shift would. Including the (scaled) angles lets
 * the fitted mapping compensate linearly for the head poses seen during
 * calibration — the standard practice in landmark-based webcam gaze
 * estimation. With little head movement in the calibration set, the ridge
 * term keeps these coefficients near zero, so the features degrade
 * gracefully instead of overfitting. When no head pose is available the
 * terms are zero (neutral pose).
 */
export function gazeFeatures(eyeLocal: EyeLocalSignal, headPose?: HeadPoseAngles | null): number[] {
  return [
    1,
    eyeLocal.combined.x,
    eyeLocal.combined.y,
    eyeLocal.left.x,
    eyeLocal.left.y,
    eyeLocal.right.x,
    eyeLocal.right.y,
    (headPose?.yaw ?? 0) / HEAD_ANGLE_SCALE_DEG,
    (headPose?.pitch ?? 0) / HEAD_ANGLE_SCALE_DEG,
    (headPose?.roll ?? 0) / HEAD_ANGLE_SCALE_DEG,
  ];
}

/** Number of features produced by `gazeFeatures` (bias + 3 × {x,y} + 3 angles). */
export const GAZE_FEATURE_LENGTH = 10;

/**
 * A fitted linear mapping: one coefficient vector per output axis. Each vector
 * has length `GAZE_FEATURE_LENGTH`; `x = cx · f`, `y = cy · f`.
 */
export interface LinearGazeMapping {
  cx: number[];
  cy: number[];
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Apply a fitted mapping to a feature vector, returning normalised screen
 * coordinates (unclamped — callers decide whether to clamp to the viewport).
 */
export function applyMapping(mapping: LinearGazeMapping, features: number[]): {
  x: number;
  y: number;
} {
  return { x: dot(mapping.cx, features), y: dot(mapping.cy, features) };
}

/**
 * Provider A: applies a fitted eye-local → screen mapping. The default screen-gaze
 * provider (`018b`). Requires calibration (`requiresCalibration: true`): until a
 * mapping is set it returns `gaze_available: false`.
 */
export class RegressionGazeProvider implements ScreenGazeProvider {
  readonly id = 'regression';
  readonly label = 'Custom regression (calibrated)';
  readonly requiresCalibration = true;

  private mapping: LinearGazeMapping | null = null;

  /** Install or clear the fitted mapping (fitting happens in `022`). */
  setMapping(mapping: LinearGazeMapping | null): void {
    if (mapping && (mapping.cx.length !== GAZE_FEATURE_LENGTH || mapping.cy.length !== GAZE_FEATURE_LENGTH)) {
      throw new Error(
        `Mapping coefficient length must be ${GAZE_FEATURE_LENGTH} (got cx=${mapping.cx.length}, cy=${mapping.cy.length})`,
      );
    }
    this.mapping = mapping;
  }

  /** Whether a mapping has been fitted/installed. */
  get hasMapping(): boolean {
    return this.mapping !== null;
  }

  estimate(input: ScreenGazeInput): ScreenGazeEstimate {
    if (!this.mapping || !input.eyeLocal) {
      return { gaze_available: false };
    }
    // Pass the head pose through so estimation matches the calibration-time
    // feature construction (a mapping fitted with head-pose terms must see
    // them here too, or the learned compensation would read as a bias).
    const { x, y } = applyMapping(this.mapping, gazeFeatures(input.eyeLocal, input.headPose));
    return {
      gaze_x: clamp01(x),
      gaze_y: clamp01(y),
      gaze_available: true,
      // Confidence is bounded by how well the eye-local signal itself is tracked.
      gaze_confidence: clamp01(input.eyeLocal.quality),
    };
  }
}
