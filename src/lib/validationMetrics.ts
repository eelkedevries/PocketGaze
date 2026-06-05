// Validation data-quality metrics (specification §3.5, §6.3, §4.3).
//
// Computes the data-quality metrics the eye-tracking field actually reports —
// ACCURACY (mean target-to-estimate offset), PRECISION (sample-to-sample RMS,
// "RMS-S2S"), and BCEA (bivariate contour ellipse area) — from fixations on
// known validation targets. These describe internal consistency and dispersion
// of the on-screen estimate; per §6.3 they must NOT be presented as a measured
// device accuracy figure for this site.
//
// Pure and framework-agnostic (no DOM, no RNG), so it is fully unit-testable.
// All outputs are in NORMALISED screen units (0–1). Conversion to degrees of
// visual angle is layered on separately in `040`; this module stays unit-free.
//
// Distinct from calibration RMS (`gazeCalibration.ts`/`022`): that measures the
// internal fit consistency of the regression mapping, NOT on-screen accuracy or
// precision against held-out validation targets. These two are reported apart.

/** A 2-D point in normalised screen coordinates (0–1). */
export interface Point {
  x: number;
  y: number;
}

/** A validation observation: a known target paired with an estimate. */
export interface ValidationSample {
  target: Point;
  estimate: Point;
}

/** Accuracy summary over a set of target/estimate pairs (normalised units). */
export interface AccuracyResult {
  /** Mean Euclidean target-to-estimate offset. */
  meanOffset: number;
  /** Median Euclidean target-to-estimate offset (robust to outliers). */
  medianOffset: number;
  /** Number of pairs the summary is computed over. */
  count: number;
}

/** Per-target metrics plus an aggregate summary across all targets. */
export interface TargetMetrics {
  target: Point;
  /** Centroid (mean) of the estimate samples for this target. */
  meanEstimate: Point;
  /** Accuracy: offset of the estimate centroid from the target. */
  accuracy: number;
  /** Precision: RMS sample-to-sample distance of the estimates. */
  precisionRmsS2S: number;
  /** BCEA of the estimate cloud (default P = 0.68). */
  bcea: number;
  /** Number of estimate samples for this target. */
  sampleCount: number;
}

/** A target with the estimate samples collected while it was shown. */
export interface TargetSamples {
  target: Point;
  estimates: Point[];
}

export interface ValidationSummary {
  perTarget: TargetMetrics[];
  /** Mean of the per-target accuracies (normalised units). */
  meanAccuracy: number;
  /** Median of the per-target accuracies (normalised units). */
  medianAccuracy: number;
  /** Mean of the per-target RMS-S2S precisions (normalised units). */
  meanPrecisionRmsS2S: number;
  /** Mean of the per-target BCEA values. */
  meanBcea: number;
  targetCount: number;
}

// --- Small numeric helpers --------------------------------------------------

function euclidean(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}

/** Median of a list; returns 0 for an empty list (documented, finite). */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

// --- Public metrics ---------------------------------------------------------

/**
 * Accuracy: mean and median Euclidean offset between targets and estimates,
 * in normalised screen units.
 *
 * Degenerate input (empty array) returns finite zeros with `count = 0`.
 */
export function accuracy(samples: ValidationSample[]): AccuracyResult {
  const offsets = samples.map((s) => euclidean(s.target, s.estimate));
  return {
    meanOffset: mean(offsets),
    medianOffset: median(offsets),
    count: samples.length,
  };
}

/**
 * Precision as sample-to-sample RMS ("RMS-S2S"): the root-mean-square distance
 * between consecutive estimate samples. A constant series yields exactly 0.
 *
 * Fewer than two samples have no inter-sample distance, so the result is 0
 * (documented, finite — not NaN).
 */
export function precisionRmsS2S(samples: Point[]): number {
  if (samples.length < 2) return 0;
  let sumSq = 0;
  for (let i = 1; i < samples.length; i++) {
    const d = euclidean(samples[i - 1], samples[i]);
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / (samples.length - 1));
}

/**
 * BCEA — bivariate contour ellipse area — the area of the ellipse expected to
 * contain a proportion `p` of the estimate samples, in normalised-unit² area.
 *
 *   BCEA = 2·k·π·σx·σy·√(1 − ρ²),   k = −ln(1 − p)
 *
 * with population standard deviations (÷N) and Pearson correlation ρ. Smaller
 * is tighter (better precision). The default `p = 0.68` matches the common
 * one-standard-deviation reporting convention.
 *
 * Degenerate clouds (fewer than two samples, zero variance on either axis, or a
 * perfectly collinear cloud where |ρ| → 1) return 0 — a finite, documented
 * value rather than NaN. Floating-point overshoot in √(1 − ρ²) is clamped.
 */
export function bcea(samples: Point[], p = 0.68): number {
  const n = samples.length;
  if (n < 2) return 0;
  const c = centroid(samples);
  let varX = 0;
  let varY = 0;
  let covXY = 0;
  for (const s of samples) {
    const dx = s.x - c.x;
    const dy = s.y - c.y;
    varX += dx * dx;
    varY += dy * dy;
    covXY += dx * dy;
  }
  varX /= n;
  varY /= n;
  covXY /= n;
  const sigmaX = Math.sqrt(varX);
  const sigmaY = Math.sqrt(varY);
  if (sigmaX === 0 || sigmaY === 0) return 0;
  const rho = covXY / (sigmaX * sigmaY);
  const oneMinusRhoSq = Math.max(0, 1 - rho * rho);
  const k = -Math.log(1 - p);
  return 2 * k * Math.PI * sigmaX * sigmaY * Math.sqrt(oneMinusRhoSq);
}

/**
 * Per-target accuracy / precision / BCEA plus an aggregate summary.
 *
 * Per target: accuracy is the offset of the estimate centroid from the target;
 * precision is RMS-S2S of the estimates; BCEA is over the estimate cloud. The
 * aggregate reports the mean/median across targets. Empty input returns a
 * finite, zeroed summary.
 */
export function perTargetMetrics(
  targets: TargetSamples[],
  p = 0.68,
): ValidationSummary {
  const perTarget: TargetMetrics[] = targets.map((t) => {
    const meanEstimate = centroid(t.estimates);
    return {
      target: t.target,
      meanEstimate,
      accuracy: t.estimates.length === 0 ? 0 : euclidean(meanEstimate, t.target),
      precisionRmsS2S: precisionRmsS2S(t.estimates),
      bcea: bcea(t.estimates, p),
      sampleCount: t.estimates.length,
    };
  });
  return {
    perTarget,
    meanAccuracy: mean(perTarget.map((m) => m.accuracy)),
    medianAccuracy: median(perTarget.map((m) => m.accuracy)),
    meanPrecisionRmsS2S: mean(perTarget.map((m) => m.precisionRmsS2S)),
    meanBcea: mean(perTarget.map((m) => m.bcea)),
    targetCount: targets.length,
  };
}
