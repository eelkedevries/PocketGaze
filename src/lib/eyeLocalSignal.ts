// Eye-local signal estimation (specification §3.4, §4.3, §6.2, §7.2).
//
// The eye-local signal is the iris-centre proxy normalised within each detected
// eye region. It is calibration-light, available when eye-region and iris
// detection succeed with sufficient quality, and reflects iris
// movement relative to the head — but it is NOT screen gaze. Screen gaze (§3.4,
// `018`/`019`) requires a calibrated mapping or trained model; this module must
// never be presented as producing screen-gaze coordinates (Domain rule §6.2).
//
// NORMALISATION FRAME. Each eye's frame is anchored to its two eye-corner
// landmarks (the inner and outer canthus) — the most stable points of the eye,
// unaffected by blinks or squints. The x axis runs along the corner-to-corner
// line and the y axis perpendicular to it, both scaled by the corner distance,
// so the signal is invariant to face scale (camera distance), head roll, and
// eyelid aperture. The earlier eyelid-bounding-box normalisation used here was
// contaminated by eyelid movement: the box's vertical extent shrank during
// squints and partial blinks, inflating the vertical signal exactly when the
// eye was least readable. Corner anchoring is the documented practice in
// landmark-based gaze estimation (normalised iris-centre–eye-corner vectors).
//
// Pure and framework-agnostic: no DOM, no MediaPipe import, so it is fully
// unit-testable. It consumes plain numbers (an iris-proxy point, the two
// eye-corner points, and a per-eye quality) and produces normalised coordinates
// plus the model field subset, so any caller (e.g. the Step 4 demo, `020`) can
// feed it from the Step 2 features without this module depending on the
// feature library.

import type { EyeLocalSignalFields, SignalType } from '../types/session';
// The .ts extension keeps this runtime import resolvable under `node --test`
// (type stripping), matching the convention in frameTiming.ts/livePrecision.ts.
import { LEFT_EYE_CORNER_IDX, RIGHT_EYE_CORNER_IDX, type LandmarkLike } from './eyeGeometry.ts';

/** A 2-D point in the normalised eye-local coordinate space. */
export interface Point2 {
  x: number;
  y: number;
}

/**
 * Half-height of the eye frame as a fraction of its half-width. The visible
 * eye opening is roughly half as tall as the eye is wide, so 0.5 keeps the
 * vertical signal usefully spread over [-1, 1] without tying its scale to the
 * (blink-dependent) eyelid aperture.
 */
export const EYE_FRAME_ASPECT = 0.5;

/** Per-eye input: the iris-proxy centre, the two eye corners, and a 0-1 quality. */
export interface EyeInput {
  /** Iris-proxy centre (e.g. normalised camera-frame coords from Step 2). */
  iris: { x: number; y: number };
  /** The eye's two corner landmarks, in the same coordinate space as `iris`.
   *  Order does not matter — the frame orients itself to the image axes. */
  cornerA: { x: number; y: number };
  cornerB: { x: number; y: number };
  /** Per-eye tracking quality, 0-1. */
  quality: number;
}

/** The eye-local signal: per-eye and combined coordinates plus a quality. */
export interface EyeLocalSignal {
  /** Left-eye coordinate, normalised within the left eye's corner frame. */
  left: Point2;
  /** Right-eye coordinate, normalised within the right eye's corner frame. */
  right: Point2;
  /** Mean of the two eyes — the combined eye-local coordinate. */
  combined: Point2;
  /**
   * Quality of the selected (eye-local) signal, 0-1: the mean of the per-eye
   * qualities. Low when either eye is poorly tracked.
   */
  quality: number;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Normalise an iris-proxy point in its eye's CORNER FRAME: origin at the
 * midpoint of the two eye corners, x along the corner-to-corner axis (oriented
 * to match the image's +x so both eyes agree), y perpendicular to it
 * (image-down positive at zero roll). x is scaled by half the corner distance
 * (a corner maps to ±1) and y by `aspect` times that, so both axes are roughly
 * in [-1, 1] and invariant to face scale, head roll, and eyelid aperture.
 *
 * Coordinates must be ISOTROPIC (one unit spans the same physical distance on
 * both axes — e.g. pixels), or the projection mixes the axes. MediaPipe's
 * normalised landmarks are NOT isotropic (x is divided by image width, y by
 * height); `eyeLocalSignalFromFeatures` rescales them before calling this.
 *
 * Degenerate input (coincident corners) maps to (0, 0) rather than producing
 * NaN/Infinity, so a collapsed detection reads as "centred/unknown".
 */
export function normaliseInCornerFrame(
  iris: { x: number; y: number },
  cornerA: { x: number; y: number },
  cornerB: { x: number; y: number },
  aspect = EYE_FRAME_ASPECT,
): Point2 {
  let ax = cornerB.x - cornerA.x;
  let ay = cornerB.y - cornerA.y;
  const len = Math.hypot(ax, ay);
  if (len < 1e-9 || aspect <= 0) return { x: 0, y: 0 };
  ax /= len;
  ay /= len;
  // Orient the axis along the image's +x (faces are upright far before the
  // ±90° roll where this flips), so left/right eyes and frames agree.
  if (ax < 0) {
    ax = -ax;
    ay = -ay;
  }
  const halfW = len / 2;
  const dx = iris.x - (cornerA.x + cornerB.x) / 2;
  const dy = iris.y - (cornerA.y + cornerB.y) / 2;
  return {
    x: (dx * ax + dy * ay) / halfW,
    y: (dy * ax - dx * ay) / (halfW * aspect),
  };
}

/**
 * Compute the eye-local signal from the two eyes' inputs: per-eye normalised
 * coordinates, their mean (combined), and the selected-signal quality.
 */
export function computeEyeLocalSignal(left: EyeInput, right: EyeInput): EyeLocalSignal {
  const l = normaliseInCornerFrame(left.iris, left.cornerA, left.cornerB);
  const r = normaliseInCornerFrame(right.iris, right.cornerA, right.cornerB);
  return {
    left: l,
    right: r,
    combined: { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 },
    quality: clamp01((clamp01(left.quality) + clamp01(right.quality)) / 2),
  };
}

/**
 * The minimal feature shape needed to derive the eye-local signal — matches
 * the Step 2 extractor's `FaceFeatures` structurally, so callers can pass it
 * straight in without this module importing the feature library.
 */
export interface EyeFeatureSource {
  leftEye: { irisProxy: { x: number; y: number }; quality: number };
  rightEye: { irisProxy: { x: number; y: number }; quality: number };
  landmarks: LandmarkLike[];
}

/**
 * Build the eye-local signal directly from Step 2 features: looks up each
 * eye's corner landmarks and normalises its iris proxy in the corner frame.
 *
 * `imageAspect` is the source image's width/height ratio; the normalised
 * landmark x coordinates are multiplied by it so the corner-frame geometry
 * runs in an isotropic space (see `normaliseInCornerFrame`). The result is
 * scale-free either way, but without the correction a head roll would leak
 * between the axes on non-square frames.
 *
 * Returns null when a corner landmark is missing (no usable detection).
 */
export function eyeLocalSignalFromFeatures(
  features: EyeFeatureSource,
  imageAspect = 1,
): EyeLocalSignal | null {
  const lm = features.landmarks;
  const lA = lm[LEFT_EYE_CORNER_IDX[0]];
  const lB = lm[LEFT_EYE_CORNER_IDX[1]];
  const rA = lm[RIGHT_EYE_CORNER_IDX[0]];
  const rB = lm[RIGHT_EYE_CORNER_IDX[1]];
  if (!lA || !lB || !rA || !rB) return null;
  const s = imageAspect > 0 ? imageAspect : 1;
  const iso = (p: { x: number; y: number }) => ({ x: p.x * s, y: p.y });
  return computeEyeLocalSignal(
    {
      iris: iso(features.leftEye.irisProxy),
      cornerA: iso(lA),
      cornerB: iso(lB),
      quality: features.leftEye.quality,
    },
    {
      iris: iso(features.rightEye.irisProxy),
      cornerA: iso(rA),
      cornerB: iso(rB),
      quality: features.rightEye.quality,
    },
  );
}

/**
 * Map an eye-local signal to the §4 session-model field subset for a `sample`
 * row. The `signal_type` is fixed to `eye_local` so the model never conflates
 * this with screen gaze or content-mapped coordinates (Domain rule §6.2).
 */
export function eyeLocalSampleFields(
  signal: EyeLocalSignal,
): EyeLocalSignalFields & { selected_signal_quality: number; signal_type: SignalType } {
  return {
    left_eye_x: signal.left.x,
    left_eye_y: signal.left.y,
    right_eye_x: signal.right.x,
    right_eye_y: signal.right.y,
    combined_eye_x: signal.combined.x,
    combined_eye_y: signal.combined.y,
    selected_signal_quality: signal.quality,
    signal_type: 'eye_local',
  };
}
