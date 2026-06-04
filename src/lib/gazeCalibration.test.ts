import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fitGazeMapping,
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

// Build a varied, full-rank set of feature vectors (bias + 6 independent signal
// dims). Independent frequencies keep the design matrix full rank, so a clean
// least-squares fit recovers the generating mapping exactly.
function syntheticFeatures(): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < 12; i++) {
    rows.push([
      1,
      Math.sin(i * 0.7),
      Math.cos(i * 0.9),
      Math.sin(i * 1.3 + 1),
      Math.cos(i * 0.5 + 2),
      Math.sin(i * 2.1),
      Math.cos(i * 1.7 + 0.5),
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
    cx: [0.5, 0.3, 0.0, 0.1, 0.0, -0.05, 0.0],
    cy: [0.5, 0.0, 0.4, 0.0, 0.1, 0.0, 0.07],
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

  it('suggests recalibration when there are too few samples to cross-validate', () => {
    const rows = syntheticFeatures().slice(0, 3);
    const samples = samplesFromMapping(rows, trueMapping);
    const result = fitGazeMapping(samples);
    assert.equal(result.recalibrationSuggested, true);
    assert.equal(result.sampleCount, 3);
  });

  it('throws when given no samples', () => {
    assert.throws(() => fitGazeMapping([]), /No calibration samples/);
  });
});
