import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fitGazeMapping,
  trimCalibrationSamples,
  solveLinearSystem,
  REGRESSION_MAPPING_MODEL_ID,
  type GazeCalibrationSample,
} from './gazeCalibration.ts';
import { GAZE_FEATURE_LENGTH, applyMapping, type LinearGazeMapping } from './regressionGaze.ts';

describe('solveLinearSystem', () => {
  it('solves a simple 2x2 system', () => {
    // x + y = 3 ; x - y = 1  -> x = 2, y = 1
    const x = solveLinearSystem(
      [
        [1, 1],
        [1, -1],
      ],
      [3, 1],
    );
    assert.ok(Math.abs(x[0] - 2) < 1e-9);
    assert.ok(Math.abs(x[1] - 1) < 1e-9);
  });

  it('throws on a singular matrix', () => {
    assert.throws(
      () =>
        solveLinearSystem(
          [
            [1, 1],
            [2, 2],
          ],
          [1, 2],
        ),
      /Singular/,
    );
  });
});

// Build a varied, full-rank set of feature vectors (bias + 9 independent signal
// dims, matching GAZE_FEATURE_LENGTH). Independent frequencies keep the design
// matrix full rank, so a clean least-squares fit recovers the generating
// mapping exactly.
function syntheticFeatures(count = 24): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < count; i++) {
    rows.push([
      1,
      Math.sin(i * 0.7),
      Math.cos(i * 0.9),
      Math.sin(i * 1.3 + 1),
      Math.cos(i * 0.5 + 2),
      Math.sin(i * 2.1),
      Math.cos(i * 1.7 + 0.5),
      Math.sin(i * 0.3 + 1.1),
      Math.cos(i * 1.1 + 0.2),
      Math.sin(i * 1.9 + 2.3),
    ]);
  }
  return rows;
}

function samplesFromMapping(
  featureRows: number[][],
  mapping: LinearGazeMapping,
): GazeCalibrationSample[] {
  return featureRows.map((features) => ({
    features,
    target: applyMapping(mapping, features),
  }));
}

describe('fitGazeMapping', () => {
  const trueMapping: LinearGazeMapping = {
    cx: [0.5, 0.3, 0.0, 0.1, 0.0, -0.05, 0.0, 0.08, 0.0, 0.02],
    cy: [0.5, 0.0, 0.4, 0.0, 0.1, 0.0, 0.07, 0.0, -0.06, 0.0],
  };

  it('recovers a known linear mapping from clean samples', () => {
    const samples = samplesFromMapping(syntheticFeatures(), trueMapping);
    const result = fitGazeMapping(samples, { ridge: 0 });
    for (let i = 0; i < GAZE_FEATURE_LENGTH; i++) {
      assert.ok(Math.abs(result.mapping.cx[i] - trueMapping.cx[i]) < 1e-6, `cx[${i}]`);
      assert.ok(Math.abs(result.mapping.cy[i] - trueMapping.cy[i]) < 1e-6, `cy[${i}]`);
    }
    assert.ok(result.rmsError < 1e-6);
    assert.equal(result.quality, 'good');
    assert.equal(result.recalibrationSuggested, false);
    assert.equal(result.mappingModelId, REGRESSION_MAPPING_MODEL_ID);
    assert.equal(result.sampleCount, samples.length);
  });

  it('produces a mapping that predicts the targets it was fit on', () => {
    const samples = samplesFromMapping(syntheticFeatures(), trueMapping);
    const { mapping } = fitGazeMapping(samples, { ridge: 0 });
    for (const s of samples) {
      const p = applyMapping(mapping, s.features);
      assert.ok(Math.abs(p.x - s.target.x) < 1e-6);
      assert.ok(Math.abs(p.y - s.target.y) < 1e-6);
    }
  });

  it('reports a non-zero held-out error and flags poor calibration on noisy data', () => {
    const rows = syntheticFeatures();
    // Targets unrelated to features -> no linear mapping fits well.
    const noisy: GazeCalibrationSample[] = rows.map((features, i) => ({
      features,
      target: { x: i % 2 === 0 ? 0.1 : 0.9, y: i % 3 === 0 ? 0.2 : 0.8 },
    }));
    const result = fitGazeMapping(noisy);
    assert.ok(result.rmsError > 0.15, `rmsError=${result.rmsError}`);
    assert.equal(result.quality, 'poor');
    assert.equal(result.recalibrationSuggested, true);
  });

  it('assigns cross-validation folds per target, not per sample', () => {
    // Two distinct targets, many samples each. With per-target folds and only
    // two groups, each fold trains on the OTHER target alone — a deliberate
    // extrapolation, so the held-out error must be clearly non-zero even
    // though every sample is individually easy to memorise.
    const rows = syntheticFeatures(28);
    const samples: GazeCalibrationSample[] = rows.map((features, i) => ({
      features,
      target: i % 2 === 0 ? { x: 0.2, y: 0.2 } : { x: 0.8, y: 0.8 },
    }));
    const result = fitGazeMapping(samples);
    assert.ok(result.rmsError > 0.05, `rmsError=${result.rmsError}`);
  });

  it('suggests recalibration when there are too few samples to cross-validate', () => {
    const rows = syntheticFeatures().slice(0, 3);
    const samples = samplesFromMapping(rows, trueMapping);
    const result = fitGazeMapping(samples);
    assert.equal(result.recalibrationSuggested, true);
    assert.equal(result.sampleCount, 3);
  });

  it('suggests recalibration when all samples share one target', () => {
    const rows = syntheticFeatures(16);
    const samples: GazeCalibrationSample[] = rows.map((features) => ({
      features,
      target: { x: 0.5, y: 0.5 },
    }));
    const result = fitGazeMapping(samples);
    assert.equal(result.recalibrationSuggested, true);
  });

  it('throws when given no samples', () => {
    assert.throws(() => fitGazeMapping([]), /No calibration samples/);
  });
});

describe('trimCalibrationSamples', () => {
  /** A sample at a given combined/per-eye position (head pose neutral). */
  function sampleAt(x: number, y: number, target = { x: 0.5, y: 0.5 }): GazeCalibrationSample {
    return { features: [1, x, y, x, y, x, y, 0, 0, 0], target };
  }

  it('drops a clear per-target outlier and keeps the cluster', () => {
    const cluster = Array.from({ length: 11 }, (_, i) => sampleAt(0.1 + i * 0.001, 0.1));
    const outlier = sampleAt(0.9, 0.9);
    const { kept, rejectedCount } = trimCalibrationSamples([...cluster, outlier]);
    assert.equal(rejectedCount, 1);
    assert.equal(kept.length, 11);
    assert.ok(!kept.includes(outlier));
  });

  it('keeps tight clusters whole (deviation floor)', () => {
    const cluster = Array.from({ length: 12 }, () => sampleAt(0.1, 0.1));
    const { kept, rejectedCount } = trimCalibrationSamples(cluster);
    assert.equal(rejectedCount, 0);
    assert.equal(kept.length, 12);
  });

  it('keeps targets with fewer than 4 samples whole', () => {
    const samples = [sampleAt(0.1, 0.1), sampleAt(0.1, 0.1), sampleAt(0.9, 0.9)];
    const { kept, rejectedCount } = trimCalibrationSamples(samples);
    assert.equal(rejectedCount, 0);
    assert.equal(kept.length, 3);
  });

  it('trims per target independently and preserves order', () => {
    const a = { x: 0.2, y: 0.2 };
    const b = { x: 0.8, y: 0.8 };
    const groupA = Array.from({ length: 5 }, () => sampleAt(0.1, 0.1, a));
    const outlierA = sampleAt(0.9, 0.9, a);
    const groupB = Array.from({ length: 5 }, () => sampleAt(-0.1, -0.1, b));
    const input = [...groupA, outlierA, ...groupB];
    const { kept, rejectedCount } = trimCalibrationSamples(input);
    assert.equal(rejectedCount, 1);
    // Order preserved: all group-A samples before all group-B samples.
    const keptTargets = kept.map((s) => s.target);
    assert.deepEqual(keptTargets.slice(0, 5), Array.from({ length: 5 }, () => a));
    assert.deepEqual(keptTargets.slice(5), Array.from({ length: 5 }, () => b));
  });

  it('handles empty input', () => {
    const { kept, rejectedCount } = trimCalibrationSamples([]);
    assert.deepEqual(kept, []);
    assert.equal(rejectedCount, 0);
  });
});
