// Pure geometry utilities for eye/iris feature extraction.
// No DOM or MediaPipe dependencies — fully unit-testable.

/** Landmark indices for 6-point EAR contour in the 478-point MediaPipe mesh. */
export const RIGHT_EYE_EAR_IDX = [33, 160, 158, 133, 153, 144] as const;
export const LEFT_EYE_EAR_IDX = [362, 385, 387, 263, 373, 380] as const;

/** Iris ring indices (5 points each; first is treated as centre for the proxy). */
export const RIGHT_IRIS_IDX = [468, 469, 470, 471, 472] as const;
export const LEFT_IRIS_IDX = [473, 474, 475, 476, 477] as const;

/**
 * Eye-corner (canthus) landmark indices, [outer/temporal, inner/nasal] per eye.
 * The corners are the most stable eye landmarks — they do not move with blinks
 * or squints — so they anchor the eye-local normalisation frame
 * (`eyeLocalSignal.ts`).
 */
export const RIGHT_EYE_CORNER_IDX = [33, 133] as const;
export const LEFT_EYE_CORNER_IDX = [263, 362] as const;

/** Spread of well-distributed face landmarks used for overall quality. */
export const FACE_QUALITY_IDX = [1, 4, 33, 61, 133, 152, 199, 263, 291] as const;

/** EAR value at which the eye is considered fully closed. */
export const EAR_CLOSED = 0.15;
/** EAR value at which the eye is considered fully open. */
export const EAR_OPEN = 0.35;
/** EAR threshold below which the eye is classified as closed/blinking. */
export const EAR_BLINK_THRESHOLD = 0.2;
/** Hysteresis: an open eye closes when EAR falls below this... */
export const EAR_CLOSE_THRESHOLD = 0.18;
/** ...and a closed eye reopens only once EAR rises above this. */
export const EAR_REOPEN_THRESHOLD = 0.24;

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

/** Return true when the EAR indicates the eye is open (not blinking).
 *  Stateless single-threshold check; the live pipeline uses the stateful
 *  {@link EyelidStateTracker}, whose hysteresis suppresses flicker when the
 *  EAR hovers near one threshold. */
export function isEyeOpen(ear: number): boolean {
  return ear > EAR_BLINK_THRESHOLD;
}

/**
 * Stateful per-eye open/closed tracker with hysteresis (a Schmitt trigger):
 * an open eye closes when EAR drops below `closeBelow`, and only reopens once
 * EAR rises above `reopenAbove`. A single threshold flickers open/closed for
 * frames where the EAR hovers around it — half-blinks, squints, landmark
 * jitter — and every false transition both pollutes `blink_state` and punches
 * spurious gaps into event detection. The dual threshold is the standard fix
 * in the EAR blink-detection literature.
 */
export class EyelidStateTracker {
  private open = true;
  private readonly closeBelow: number;
  private readonly reopenAbove: number;

  constructor(closeBelow = EAR_CLOSE_THRESHOLD, reopenAbove = EAR_REOPEN_THRESHOLD) {
    this.closeBelow = closeBelow;
    this.reopenAbove = reopenAbove;
  }

  /** Feed one EAR sample; returns the (hysteresis-stabilised) open state. */
  update(ear: number): boolean {
    if (this.open) {
      if (ear < this.closeBelow) this.open = false;
    } else if (ear > this.reopenAbove) {
      this.open = true;
    }
    return this.open;
  }

  /** True while the eye is considered open. */
  get isOpen(): boolean {
    return this.open;
  }

  reset(): void {
    this.open = true;
  }
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
