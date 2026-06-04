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

/** Stable id recorded as `mapping_model_id` in the session model (§4). */
export const REGRESSION_MAPPING_MODEL_ID = 'regression-leastsquares-v1';

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

/**
 * Fit a calibration mapping and estimate its quality.
 *
 * Quality is estimated by deterministic k-fold cross-validation (folds assigned
 * by index, so the result is reproducible). With too few samples for folding,
 * the training-set RMS is used and a recalibration is suggested.
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

  // Cross-validate when there are enough points to hold some out.
  const folds = Math.min(options.folds ?? 5, n);
  let rmsX: number;
  let rmsY: number;
  const tooFew = n < featureLen + 1 || folds < 2;
  if (tooFew) {
    ({ rmsX, rmsY } = axisRms(samples, mapping));
  } else {
    let sx = 0;
    let sy = 0;
    for (let fold = 0; fold < folds; fold++) {
      const train = samples.filter((_, i) => i % folds !== fold);
      const test = samples.filter((_, i) => i % folds === fold);
      if (train.length < featureLen || test.length === 0) continue;
      const foldMapping = fitMapping(train, ridge);
      for (const s of test) {
        sx += (dot(foldMapping.cx, s.features) - s.target.x) ** 2;
        sy += (dot(foldMapping.cy, s.features) - s.target.y) ** 2;
      }
    }
    rmsX = Math.sqrt(sx / n);
    rmsY = Math.sqrt(sy / n);
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
