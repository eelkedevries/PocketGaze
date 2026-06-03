// Head-motion quality labelling (specification §3.3, §5). Pure, deterministic
// logic — no DOM — so it is fully unit-testable.
//
// Apparent eye movement can be contaminated by head/phone motion (Domain rule
// §6.4). This module labels each sample by how much head motion is present,
// using the head pose from `headPose.ts`, so later event detection (§6) can
// exclude uncertain intervals rather than mislabel them as eye movement.
//
// A sample is labelled:
//   - `uncertain` — pose missing or low quality, OR rotational speed so high
//     the signal cannot be trusted (also used to reject the interval);
//   - `moderate`  — noticeable head rotation (saccade-like events should be
//     labelled `saccade_during_head_movement` downstream);
//   - `low`       — little head rotation and good pose quality.
//
// Thresholds are documented defaults, configurable per call. They are not
// device-calibrated; tune empirically per §3.6 limitations.

import type { HeadMotionLabel } from '../types/session';
import type { HeadPose } from './headPose';

export interface MotionQualityThresholds {
  /** Rotational speed (deg/s) at/above which motion is at least `moderate`. */
  moderateSpeedDegPerSec: number;
  /** Rotational speed (deg/s) at/above which motion is `uncertain`. */
  uncertainSpeedDegPerSec: number;
  /** Pose quality (0-1) below which a sample is `uncertain` regardless of speed. */
  minPoseQuality: number;
}

/**
 * Documented default thresholds. Rationale (portfolio demo, not device-tuned):
 *  - ~15 deg/s: a deliberate head turn is clearly above slow drift/jitter.
 *  - ~60 deg/s: fast head motion that swamps eye-local movement.
 *  - 0.4 quality: below this the landmarks (and thus pose) are unreliable.
 */
export const DEFAULT_MOTION_QUALITY_THRESHOLDS: MotionQualityThresholds = {
  moderateSpeedDegPerSec: 15,
  uncertainSpeedDegPerSec: 60,
  minPoseQuality: 0.4,
};

/**
 * Combined rotational speed (deg/s) between two poses over `dtMs`.
 * Returns `undefined` when speed cannot be measured (no previous pose, or
 * non-positive dt) so callers can fall back to quality-only labelling.
 */
export function angularSpeedDegPerSec(
  prev: HeadPose | null,
  curr: HeadPose,
  dtMs: number,
): number | undefined {
  if (!prev || dtMs <= 0) return undefined;
  const dyaw = curr.yaw - prev.yaw;
  const dpitch = curr.pitch - prev.pitch;
  const droll = curr.roll - prev.roll;
  const magnitudeDeg = Math.sqrt(dyaw * dyaw + dpitch * dpitch + droll * droll);
  return (magnitudeDeg / dtMs) * 1000;
}

/**
 * Label a sample from its rotational speed and pose quality.
 *
 * `speed` is `undefined` when it cannot be measured: motion is then unknown, so
 * the label is decided by pose quality alone (good quality → `low`).
 */
export function labelFromSpeedAndQuality(
  speed: number | undefined,
  quality: number,
  thresholds: MotionQualityThresholds = DEFAULT_MOTION_QUALITY_THRESHOLDS,
): HeadMotionLabel {
  if (quality < thresholds.minPoseQuality) return 'uncertain';
  if (speed === undefined) return 'low';
  if (speed >= thresholds.uncertainSpeedDegPerSec) return 'uncertain';
  if (speed >= thresholds.moderateSpeedDegPerSec) return 'moderate';
  return 'low';
}

/** True when a sample/interval is too head-motion-affected to use for events. */
export function headMotionExcluded(label: HeadMotionLabel): boolean {
  return label === 'uncertain';
}

/**
 * Stateful per-frame labeller: remembers the previous pose so the live pipeline
 * can label each incoming sample. Deterministic given its inputs.
 */
export class HeadMotionLabeller {
  private prevPose: HeadPose | null = null;
  private prevTimeMs: number | null = null;
  private readonly thresholds: MotionQualityThresholds;

  constructor(thresholds: MotionQualityThresholds = DEFAULT_MOTION_QUALITY_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Label the sample at `timeMs`. A null pose (no face / no matrix) is always
   * `uncertain` and resets the motion baseline.
   */
  label(pose: HeadPose | null, timeMs: number): HeadMotionLabel {
    if (!pose) {
      this.prevPose = null;
      this.prevTimeMs = null;
      return 'uncertain';
    }
    const dtMs = this.prevTimeMs === null ? 0 : timeMs - this.prevTimeMs;
    const speed = angularSpeedDegPerSec(this.prevPose, pose, dtMs);
    const result = labelFromSpeedAndQuality(speed, pose.quality, this.thresholds);
    this.prevPose = pose;
    this.prevTimeMs = timeMs;
    return result;
  }

  /** Forget the previous pose (e.g. on a new session or tracking loss). */
  reset(): void {
    this.prevPose = null;
    this.prevTimeMs = null;
  }
}
