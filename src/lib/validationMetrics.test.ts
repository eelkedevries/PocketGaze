import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracy,
  precisionRmsS2S,
  bcea,
  perTargetMetrics,
  type Point,
  type ValidationSample,
  type TargetSamples,
} from './validationMetrics.ts';

describe('accuracy', () => {
  it('computes a known mean/median Euclidean offset', () => {
    // Each estimate is offset from its target by exactly 0.3 (3-4-5 triangle).
    const samples: ValidationSample[] = [
      { target: { x: 0.0, y: 0.0 }, estimate: { x: 0.18, y: 0.24 } },
      { target: { x: 0.5, y: 0.5 }, estimate: { x: 0.68, y: 0.74 } },
    ];
    const r = accuracy(samples);
    assert.ok(Math.abs(r.meanOffset - 0.3) < 1e-9);
    assert.ok(Math.abs(r.medianOffset - 0.3) < 1e-9);
    assert.equal(r.count, 2);
  });

  it('takes the median, not the mean, for an odd count', () => {
    const samples: ValidationSample[] = [
      { target: { x: 0, y: 0 }, estimate: { x: 0.1, y: 0 } },
      { target: { x: 0, y: 0 }, estimate: { x: 0.2, y: 0 } },
      { target: { x: 0, y: 0 }, estimate: { x: 0.9, y: 0 } },
    ];
    const r = accuracy(samples);
    assert.ok(Math.abs(r.medianOffset - 0.2) < 1e-9);
    assert.ok(Math.abs(r.meanOffset - 0.4) < 1e-9);
  });

  it('returns finite zeros for empty input (not NaN)', () => {
    const r = accuracy([]);
    assert.equal(r.meanOffset, 0);
    assert.equal(r.medianOffset, 0);
    assert.equal(r.count, 0);
    assert.ok(Number.isFinite(r.meanOffset));
  });
});

describe('precisionRmsS2S', () => {
  it('is exactly 0 for a constant series', () => {
    const constant: Point[] = Array.from({ length: 5 }, () => ({ x: 0.4, y: 0.6 }));
    assert.equal(precisionRmsS2S(constant), 0);
  });

  it('computes a known RMS of inter-sample distances', () => {
    // Consecutive distances: 0.2, 0.2, 0.2 -> RMS = 0.2.
    const series: Point[] = [
      { x: 0, y: 0 },
      { x: 0.2, y: 0 },
      { x: 0.4, y: 0 },
      { x: 0.6, y: 0 },
    ];
    assert.ok(Math.abs(precisionRmsS2S(series) - 0.2) < 1e-9);
  });

  it('uses RMS (not mean) so a single large jump dominates', () => {
    // Distances 0 and 0.4 -> RMS = sqrt((0 + 0.16) / 1)? No: divisor is N-1 = 2.
    // sqrt(0.16 / 2) = sqrt(0.08) ~= 0.28284271.
    const series: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0.4, y: 0 },
    ];
    assert.ok(Math.abs(precisionRmsS2S(series) - Math.sqrt(0.08)) < 1e-9);
  });

  it('returns 0 for fewer than two samples (finite, not NaN)', () => {
    assert.equal(precisionRmsS2S([]), 0);
    assert.equal(precisionRmsS2S([{ x: 0.5, y: 0.5 }]), 0);
  });
});

describe('bcea', () => {
  it('matches a hand-checked value on a small symmetric cloud', () => {
    // Cloud (0,0),(2,0),(0,2),(2,2): centroid (1,1), population var = 1 on each
    // axis (sigma = 1), covariance 0 -> rho = 0.
    // BCEA = 2*k*pi*1*1*sqrt(1) = 2*k*pi, k = -ln(1 - 0.68) = -ln(0.32).
    const cloud: Point[] = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
    ];
    const expected = 2 * -Math.log(0.32) * Math.PI;
    assert.ok(Math.abs(bcea(cloud) - expected) < 1e-9, `bcea=${bcea(cloud)}`);
  });

  it('honours a custom probability p', () => {
    const cloud: Point[] = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
    ];
    const expected = 2 * -Math.log(1 - 0.95) * Math.PI;
    assert.ok(Math.abs(bcea(cloud, 0.95) - expected) < 1e-9);
  });

  it('returns 0 for a degenerate (zero-variance) cloud, not NaN', () => {
    const constant: Point[] = Array.from({ length: 4 }, () => ({ x: 0.5, y: 0.5 }));
    assert.equal(bcea(constant), 0);
  });

  it('returns 0 for a perfectly collinear cloud (|rho| -> 1), not NaN', () => {
    // All points on y = x: rho = 1, so sqrt(1 - rho^2) = 0 -> area 0.
    const collinear: Point[] = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 },
      { x: 0.3, y: 0.3 },
    ];
    const a = bcea(collinear);
    assert.ok(Number.isFinite(a));
    assert.ok(Math.abs(a) < 1e-12, `bcea=${a}`);
  });

  it('returns 0 for fewer than two samples', () => {
    assert.equal(bcea([]), 0);
    assert.equal(bcea([{ x: 0.5, y: 0.5 }]), 0);
  });
});

describe('perTargetMetrics', () => {
  it('computes per-target accuracy as the centroid offset and aggregates', () => {
    const targets: TargetSamples[] = [
      {
        target: { x: 0, y: 0 },
        // Centroid (0.1, 0) -> accuracy 0.1; consecutive distance 0.2 RMS.
        estimates: [
          { x: 0, y: 0 },
          { x: 0.2, y: 0 },
        ],
      },
      {
        target: { x: 1, y: 1 },
        // Centroid (1, 0.7) -> accuracy 0.3; consecutive distance 0.4 RMS.
        estimates: [
          { x: 1, y: 0.5 },
          { x: 1, y: 0.9 },
        ],
      },
    ];
    const s = perTargetMetrics(targets);
    assert.equal(s.targetCount, 2);
    assert.ok(Math.abs(s.perTarget[0].accuracy - 0.1) < 1e-9);
    assert.ok(Math.abs(s.perTarget[1].accuracy - 0.3) < 1e-9);
    assert.ok(Math.abs(s.meanAccuracy - 0.2) < 1e-9);
    assert.ok(Math.abs(s.perTarget[0].precisionRmsS2S - 0.2) < 1e-9);
    assert.ok(Math.abs(s.perTarget[1].precisionRmsS2S - 0.4) < 1e-9);
    assert.equal(s.perTarget[0].sampleCount, 2);
  });

  it('returns a finite, zeroed summary for empty input', () => {
    const s = perTargetMetrics([]);
    assert.equal(s.targetCount, 0);
    assert.equal(s.meanAccuracy, 0);
    assert.equal(s.medianAccuracy, 0);
    assert.equal(s.meanPrecisionRmsS2S, 0);
    assert.equal(s.meanBcea, 0);
    assert.deepEqual(s.perTarget, []);
  });

  it('handles a target with no estimates without producing NaN', () => {
    const s = perTargetMetrics([{ target: { x: 0.5, y: 0.5 }, estimates: [] }]);
    assert.equal(s.perTarget[0].accuracy, 0);
    assert.equal(s.perTarget[0].precisionRmsS2S, 0);
    assert.equal(s.perTarget[0].bcea, 0);
    assert.ok(Number.isFinite(s.meanBcea));
  });
});
