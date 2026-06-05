// Illustrative head-pose compensation for the eye-local signal (specification
// §3.3, §3.4, §6.2, §6.4).
//
// A DELIBERATELY SIMPLE, illustrative term that removes a head-pose contribution
// from the eye-local coordinate so a demo can switch it on/off and show the
// estimate drift when the head moves. It is NOT a rigorous geometric correction
// (§6.3): with a single RGB camera and no metric calibration, true compensation
// needs the full pose geometry. Pure and framework-agnostic, so it is unit-tested.

export interface HeadPoseLike {
  /** Yaw (left/right turn), degrees. */
  yaw: number;
  /** Pitch (up/down nod), degrees. */
  pitch: number;
}

export interface Point2 {
  x: number;
  y: number;
}

/**
 * Default illustrative gain: eye-local units removed per degree of head rotation.
 * Small and documented — chosen so a visible head turn nudges the eye-local point
 * by a fraction of its range, not calibrated to any device.
 */
export const DEFAULT_COMPENSATION_GAIN = 0.012;

/**
 * Subtract a linear head-pose contribution from an eye-local point. Yaw shifts
 * the horizontal coordinate; pitch the vertical. With `head` null (no face) the
 * point is returned unchanged. Returns a new point; never mutates the input.
 */
export function compensateEyeLocal(
  point: Point2,
  head: HeadPoseLike | null,
  gain: number = DEFAULT_COMPENSATION_GAIN,
): Point2 {
  if (!head) return { x: point.x, y: point.y };
  return { x: point.x - head.yaw * gain, y: point.y - head.pitch * gain };
}
