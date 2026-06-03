// Pure geometry utilities for eye/iris feature extraction.
// No DOM or MediaPipe dependencies — fully unit-testable.

/** Landmark indices for 6-point EAR contour in the 478-point MediaPipe mesh. */
export const RIGHT_EYE_EAR_IDX = [33, 160, 158, 133, 153, 144] as const;
export const LEFT_EYE_EAR_IDX = [362, 385, 387, 263, 373, 380] as const;

/** Iris ring indices (5 points each; first is treated as centre for the proxy). */
export const RIGHT_IRIS_IDX = [468, 469, 470, 471, 472] as const;
export const LEFT_IRIS_IDX = [473, 474, 475, 476, 477] as const;

/** Spread of well-distributed face landmarks used for overall quality. */
export const FACE_QUALITY_IDX = [1, 4, 33, 61, 133, 152, 199, 263, 291] as const;

/** EAR value at which the eye is considered fully closed. */
export const EAR_CLOSED = 0.15;
/** EAR value at which the eye is considered fully open. */
export const EAR_OPEN = 0.35;
/** EAR threshold below which the eye is classified as closed/blinking. */
export const EAR_BLINK_THRESHOLD = 0.2;

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** Minimal landmark interface compatible with MediaPipe NormalizedLandmark. */
export interface LandmarkLike {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

function dist2(a: LandmarkLike, b: LandmarkLike): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Eye Aspect Ratio from 6 contour landmarks.
 * Indices order: [outer-corner, upper-outer, upper-inner, inner-corner, lower-inner, lower-outer].
 * Returns 0 when any landmark is missing.
 */
export function computeEAR(landmarks: LandmarkLike[], indices: readonly number[]): number {
  const pts = indices.map((i) => landmarks[i]);
  if (pts.some((p) => p == null)) return 0;
  const [p1, p2, p3, p4, p5, p6] = pts as LandmarkLike[];
  const vertical = (dist2(p2, p6) + dist2(p3, p5)) / 2;
  const horizontal = dist2(p1, p4);
  if (horizontal < 1e-6) return 0;
  return vertical / horizontal;
}

/** Map an EAR value to a 0–1 openness score using a clamped linear ramp. */
export function earToOpenness(ear: number): number {
  return Math.max(0, Math.min(1, (ear - EAR_CLOSED) / (EAR_OPEN - EAR_CLOSED)));
}

/** Return true when the EAR indicates the eye is open (not blinking). */
export function isEyeOpen(ear: number): boolean {
  return ear > EAR_BLINK_THRESHOLD;
}

/** Centroid of landmark positions at the given indices. */
export function landmarkCentroid(landmarks: LandmarkLike[], indices: readonly number[]): Point3 {
  let x = 0, y = 0, z = 0;
  for (const i of indices) {
    x += landmarks[i].x;
    y += landmarks[i].y;
    z += landmarks[i].z;
  }
  const n = indices.length;
  return { x: x / n, y: y / n, z: z / n };
}

/**
 * Mean visibility of landmarks at the given indices.
 * Undefined `visibility` (not supplied by the library) is treated as 1.
 */
export function averageVisibility(landmarks: LandmarkLike[], indices: readonly number[]): number {
  let sum = 0;
  for (const i of indices) {
    sum += landmarks[i].visibility ?? 1;
  }
  return sum / indices.length;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Axis-aligned bounding box of landmark positions at the given indices, with an
 * optional padding (in the same normalised units) applied on every side.
 */
export function landmarkBounds(
  landmarks: LandmarkLike[],
  indices: readonly number[],
  padding = 0,
): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const i of indices) {
    const p = landmarks[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}
