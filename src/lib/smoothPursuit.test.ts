import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  pursuitTarget,
  pursuitGain,
  pursuitCandidate,
  SMOOTH_PURSUIT_CANDIDATE,
  type PursuitSample,
} from './smoothPursuit.ts';

describe('pursuitTarget', () => {
  it('moves horizontally as a sinusoid about the centre', () => {
    const params = { path: 'horizontal' as const, periodMs: 4000, amplitude: 0.3 };
    const t0 = pursuitTarget(0, params);
    assert.ok(Math.abs(t0.x - 0.5) < 1e-9); // sin(0) = 0
    assert.equal(t0.y, 0.5);
    const tQuarter = pursuitTarget(1000, params); // quarter period -> sin = 1
    assert.ok(Math.abs(tQuarter.x - 0.8) < 1e-9);
  });

  it('traces a circle for the circular path', () => {
    const params = { path: 'circular' as const, periodMs: 4000, amplitude: 0.2 };
    const t0 = pursuitTarget(0, params); // cos0=1, sin0=0
    assert.ok(Math.abs(t0.x - 0.7) < 1e-9);
    assert.ok(Math.abs(t0.y - 0.5) < 1e-9);
  });

  it('returns a stationary centre target for a non-positive period', () => {
    const t = pursuitTarget(500, { path: 'horizontal', periodMs: 0, amplitude: 0.3 });
    assert.deepEqual(t, { x: 0.5, y: 0.5 });
  });
});

function ramp(gazeFactor: number, offset = 0): PursuitSample[] {
  // Target moves +0.1 in x each 100 ms; gaze follows scaled by gazeFactor.
  return Array.from({ length: 6 }, (_, i) => ({
    t_ms: i * 100,
    target: { x: 0.2 + i * 0.1, y: 0.5 },
    gaze: { x: 0.2 + i * 0.1 * gazeFactor + offset, y: 0.5 },
  }));
}

describe('pursuitGain', () => {
  it('is 1.0 with zero error when gaze equals target', () => {
    const r = pursuitGain(ramp(1));
    assert.ok(Math.abs(r.gain - 1) < 1e-9);
    assert.ok(Math.abs(r.meanTrackingError) < 1e-9);
  });

  it('is below 1 for a lagging / under-shooting gaze', () => {
    const r = pursuitGain(ramp(0.5));
    assert.ok(Math.abs(r.gain - 0.5) < 1e-9, `gain=${r.gain}`);
    assert.ok(r.meanTrackingError > 0);
  });

  it('computes mean tracking error for a constant offset', () => {
    const r = pursuitGain(ramp(1, 0.05));
    assert.ok(Math.abs(r.meanTrackingError - 0.05) < 1e-9);
  });

  it('returns gain 0 for a stationary target (no NaN)', () => {
    const samples: PursuitSample[] = Array.from({ length: 4 }, (_, i) => ({
      t_ms: i * 100,
      target: { x: 0.5, y: 0.5 },
      gaze: { x: 0.4, y: 0.5 },
    }));
    const r = pursuitGain(samples);
    assert.equal(r.gain, 0);
    assert.ok(Number.isFinite(r.gain));
  });

  it('skips out-of-order / zero-dt segments', () => {
    const samples: PursuitSample[] = [
      { t_ms: 0, target: { x: 0.2, y: 0.5 }, gaze: { x: 0.2, y: 0.5 } },
      { t_ms: 0, target: { x: 0.9, y: 0.5 }, gaze: { x: 0.9, y: 0.5 } }, // dt=0 skipped
      { t_ms: 100, target: { x: 0.3, y: 0.5 }, gaze: { x: 0.3, y: 0.5 } },
    ];
    const r = pursuitGain(samples);
    assert.ok(Number.isFinite(r.gain));
  });
});

describe('pursuitCandidate', () => {
  it('labels a good-gain low-error run as a smooth_pursuit_candidate', () => {
    assert.equal(pursuitCandidate(pursuitGain(ramp(1))), SMOOTH_PURSUIT_CANDIDATE);
  });

  it('rejects a very low-gain run', () => {
    assert.equal(pursuitCandidate(pursuitGain(ramp(0.1))), null);
  });
});
