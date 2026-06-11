// Calibration regression fit for screen gaze (specification §3.5, §6.3).
//
// Fits a transparent linear least-squares mapping from the eye-local feature
// vector (`regressionGaze.ts`) to normalised screen coordinates, using the
// calibration samples collected by the follow-the-dots task (`021`). It also
// estimates calibration quality by k-fold cross-validation and flags poor
// calibrations so the UI can prompt a recalibration (§6.3 — do not overclaim).
//
// Pure and deterministic (no DOM, no RNG), so it is fully unit-testable. The
// fitted `LinearGazeMapping` plugs straight into `RegressionGazeProvider.setMapping`.

import type { LinearGazeMapping } from './regressionGaze';

/** Stable id recorded as `mapping_model_id` in the session model (§4).
 *  v2: the feature vector gained scaled head-pose angles (`gazeFeatures`),
 *  capture is blink/quality-gated with per-target outlier trimming, and fit
 *  quality is estimated by leave-targets-out cross-validation. */
export const REGRESSION_MAPPING_MODEL_ID = 'regression-leastsquares-v2';

/** A calibration observation: a feature vector paired with its known target. */
export interface GazeCalibrationSample {
  /** Feature vector, length `GAZE_FEATURE_LENGTH` (from `gazeFeatures`). */
  features: number[];
  /** Known target in normalised screen coordinates (0–1). */
  target: { x: number; y: number };
}

export type CalibrationQuality = 'good' | 'moderate' | 'poor';

export interface GazeCalibrationThresholds {
  /** RMS error (normalised units) at/under which calibration is "good". */
  goodRms: number;
  /** RMS error (normalised units) at/under which calibration is "moderate". */
  moderateRms: number;
}

/** Heuristic, documented defaults — not device-calibrated (§6.3). */
export const DEFAULT_CALIBRATION_THRESHOLDS: GazeCalibrationThresholds = {
  goodRms: 0.08,
  moderateRms: 0.15,
};

export interface GazeCalibrationResult {
  mapping: LinearGazeMapping;
  mappingModelId: string;
  /** Combined RMS error (normalised units), cross-validated when possible. */
  rmsError: number;
  rmsX: number;
  rmsY: number;
  quality: CalibrationQuality;
  /** True when a recalibration should be suggested (quality poor or too few points). */
  recalibrationSuggested: boolean;
  sampleCount: number;
}

export interface FitOptions {
  /** Ridge (L2) regularisation added to the normal equations. */
  ridge?: number;
  /** Number of cross-validation folds (clamped to the sample count). */
  folds?: number;
  thresholds?: GazeCalibrationThresholds;
}

// --- Linear algebra (small, dependency-free) --------------------------------

/** Solve `A x = b` for a square matrix via Gaussian elimination with pivoting. */
export function solveLinearSystem(a: number[][], b: number[]): number[] {
  const n = b.length;
  // Work on copies so the inputs are not mutated.
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    // Partial pivot: move the largest-magnitude row into place.
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) {
      throw new Error('Singular matrix in calibration fit (need more varied targets).');
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const pv = m[col][col];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r][col] / pv;
      for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c];
    }
  }
  // After full elimination each row is diagonal: x[i] = m[i][n] / m[i][i].
  const x = new Array<number>(n);
  for (let i = 0; i < n; i++) x[i] = m[i][n] / m[i][i];
  return x;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Fit one axis: solve `(AᵀA + ridge·I) c = Aᵀt`. */
function fitAxis(samples: GazeCalibrationSample[], targets: number[], ridge: number): number[] {
  const f = samples[0].features.length;
  const ata: number[][] = Array.from({ length: f }, () => new Array(f).fill(0));
  const atb: number[] = new Array(f).fill(0);
  for (let k = 0; k < samples.length; k++) {
    const x = samples[k].features;
    for (let i = 0; i < f; i++) {
      atb[i] += x[i] * targets[k];
      for (let j = 0; j < f; j++) ata[i][j] += x[i] * x[j];
    }
  }
  for (let i = 0; i < f; i++) ata[i][i] += ridge;
  return solveLinearSystem(ata, atb);
}

function fitMapping(samples: GazeCalibrationSample[], ridge: number): LinearGazeMapping {
  return {
    cx: fitAxis(samples, samples.map((s) => s.target.x), ridge),
    cy: fitAxis(samples, samples.map((s) => s.target.y), ridge),
  };
}

function axisRms(
  samples: GazeCalibrationSample[],
  mapping: LinearGazeMapping,
): { rmsX: number; rmsY: number } {
  let sx = 0;
  let sy = 0;
  for (const s of samples) {
    sx += (dot(mapping.cx, s.features) - s.target.x) ** 2;
    sy += (dot(mapping.cy, s.features) - s.target.y) ** 2;
  }
  const n = samples.length || 1;
  return { rmsX: Math.sqrt(sx / n), rmsY: Math.sqrt(sy / n) };
}

function classify(rms: number, t: GazeCalibrationThresholds): CalibrationQuality {
  if (rms <= t.goodRms) return 'good';
  if (rms <= t.moderateRms) return 'moderate';
  return 'poor';
}

/** Group sample indices by identical target, preserving first-seen order. */
function groupByTarget(samples: GazeCalibrationSample[]): number[][] {
  const groups = new Map<string, number[]>();
  samples.forEach((s, i) => {
    const key = `${s.target.x},${s.target.y}`;
    const g = groups.get(key);
    if (g) g.push(i);
    else groups.set(key, [i]);
  });
  return [...groups.values()];
}

/**
 * Fit a calibration mapping and estimate its quality.
 *
 * Quality is estimated by deterministic LEAVE-TARGETS-OUT cross-validation:
 * folds are assigned per calibration target (not per sample), so every test
 * sample belongs to a dot the fold's fit never saw. Per-sample folding would
 * leak — each dot's remaining samples sit in the training set, so the model
 * is only asked to reproduce a dot it has effectively memorised — and read
 * optimistically; per-target folding reports interpolation to unseen screen
 * positions, which is what the mapping is for. With too few samples or only
 * one distinct target, the training-set RMS is used and a recalibration is
 * suggested.
 */
export function fitGazeMapping(
  samples: GazeCalibrationSample[],
  options: FitOptions = {},
): GazeCalibrationResult {
  const ridge = options.ridge ?? 1e-4;
  const thresholds = options.thresholds ?? DEFAULT_CALIBRATION_THRESHOLDS;
  const n = samples.length;
  if (n === 0) throw new Error('No calibration samples provided.');
  const featureLen = samples[0].features.length;

  const mapping = fitMapping(samples, ridge);

  // Cross-validate per target when there are enough targets to hold some out.
  const groups = groupByTarget(samples);
  const folds = Math.min(options.folds ?? groups.length, groups.length);
  let rmsX = 0;
  let rmsY = 0;
  let tooFew = n < featureLen + 1 || folds < 2;
  if (!tooFew) {
    const foldOfSample = new Array<number>(n);
    groups.forEach((indices, g) => {
      for (const i of indices) foldOfSample[i] = g % folds;
    });
    let sx = 0;
    let sy = 0;
    let evaluated = 0;
    for (let fold = 0; fold < folds; fold++) {
      const train = samples.filter((_, i) => foldOfSample[i] !== fold);
      const test = samples.filter((_, i) => foldOfSample[i] === fold);
      // A fold whose training set is smaller than the feature count cannot be
      // fitted meaningfully; skip it rather than report a fantasy error.
      if (train.length < featureLen || test.length === 0) continue;
      const foldMapping = fitMapping(train, ridge);
      for (const s of test) {
        sx += (dot(foldMapping.cx, s.features) - s.target.x) ** 2;
        sy += (dot(foldMapping.cy, s.features) - s.target.y) ** 2;
      }
      evaluated += test.length;
    }
    if (evaluated === 0) {
      // Every fold was skipped — there is no held-out evidence at all.
      tooFew = true;
    } else {
      rmsX = Math.sqrt(sx / evaluated);
      rmsY = Math.sqrt(sy / evaluated);
    }
  }
  if (tooFew) {
    ({ rmsX, rmsY } = axisRms(samples, mapping));
  }

  const rmsError = Math.sqrt(rmsX * rmsX + rmsY * rmsY);
  const quality = classify(rmsError, thresholds);
  return {
    mapping,
    mappingModelId: REGRESSION_MAPPING_MODEL_ID,
    rmsError,
    rmsX,
    rmsY,
    quality,
    recalibrationSuggested: quality === 'poor' || tooFew,
    sampleCount: n,
  };
}

// --- Per-target outlier trimming ---------------------------------------------

export interface TrimOptions {
  /** Multiplier on the per-target median absolute deviation. */
  madFactor?: number;
  /** Deviation floor (eye-local units) below which samples are never dropped. */
  minRadius?: number;
}

/** Documented defaults: generous, so only clear outliers are removed. */
export const DEFAULT_TRIM_OPTIONS: Required<TrimOptions> = {
  madFactor: 3,
  minRadius: 0.08,
};

export interface TrimResult {
  kept: GazeCalibrationSample[];
  rejectedCount: number;
}

// The eye-coordinate slice of the `gazeFeatures` vector (indices 1-6:
// combined and per-eye x/y). Outliers show up here — a glance away, a missed
// blink, a landmark glitch — not in the bias or head-pose terms.
const EYE_FEATURE_START = 1;
const EYE_FEATURE_END = 7;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Remove per-target outlier samples before fitting: within each target's
 * samples, compute the component-wise median of the eye-coordinate features
 * and drop samples whose distance from it exceeds
 * `max(minRadius, madFactor x median distance)`. A glance away from the dot,
 * an undetected blink, or a landmark glitch otherwise drags the least-squares
 * fit; the median centre is robust to exactly those samples.
 *
 * Conservative by construction: targets with fewer than 4 samples are kept
 * whole, and if trimming would leave fewer than 2 samples for a target, that
 * target is kept whole instead. Order is preserved.
 */
export function trimCalibrationSamples(
  samples: GazeCalibrationSample[],
  options: TrimOptions = {},
): TrimResult {
  const { madFactor, minRadius } = { ...DEFAULT_TRIM_OPTIONS, ...options };
  const keep = new Array<boolean>(samples.length).fill(true);

  for (const indices of groupByTarget(samples)) {
    if (indices.length < 4) continue;
    const centre: number[] = [];
    for (let d = EYE_FEATURE_START; d < EYE_FEATURE_END; d++) {
      centre.push(median(indices.map((i) => samples[i].features[d] ?? 0)));
    }
    const dists = indices.map((i) => {
      let sum = 0;
      for (let d = EYE_FEATURE_START; d < EYE_FEATURE_END; d++) {
        const diff = (samples[i].features[d] ?? 0) - centre[d - EYE_FEATURE_START];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    });
    const threshold = Math.max(minRadius, madFactor * median(dists));
    const flags = dists.map((dist) => dist <= threshold);
    if (flags.filter(Boolean).length < 2) continue; // safety: keep the target whole
    indices.forEach((sampleIndex, j) => {
      if (!flags[j]) keep[sampleIndex] = false;
    });
  }

  const kept = samples.filter((_, i) => keep[i]);
  return { kept, rejectedCount: samples.length - kept.length };
}
