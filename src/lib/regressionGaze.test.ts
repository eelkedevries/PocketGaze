import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RegressionGazeProvider,
  gazeFeatures,
  applyMapping,
  GAZE_FEATURE_LENGTH,
  type LinearGazeMapping,
} from './regressionGaze.ts';
import type { EyeLocalSignal } from './eyeLocalSignal.ts';

function signal(cx: number, cy: number, quality = 1): EyeLocalSignal {
  // Per-eye values are not exercised by these mappings; mirror the combined value.
  return {
    left: { x: cx, y: cy },
    right: { x: cx, y: cy },
    combined: { x: cx, y: cy },
    quality,
  };
}

describe('gazeFeatures', () => {
  it('produces a bias term followed by combined and per-eye coordinates', () => {
    const f = gazeFeatures({
      left: { x: 0.1, y: 0.2 },
      right: { x: 0.3, y: 0.4 },
      combined: { x: 0.5, y: 0.6 },
      quality: 1,
    });
    assert.equal(f.length, GAZE_FEATURE_LENGTH);
    assert.deepEqual(f, [1, 0.5, 0.6, 0.1, 0.2, 0.3, 0.4]);
  });
});

describe('applyMapping', () => {
  it('computes the dot product per axis', () => {
    const mapping: LinearGazeMapping = {
      cx: [0, 1, 0, 0, 0, 0, 0], // x = combined.x
      cy: [0, 0, 1, 0, 0, 0, 0], // y = combined.y
    };
    assert.deepEqual(applyMapping(mapping, gazeFeatures(signal(0.25, 0.75))), {
      x: 0.25,
      y: 0.75,
    });
  });
});

describe('RegressionGazeProvider', () => {
  it('is the default-style provider that requires calibration', () => {
    const p = new RegressionGazeProvider();
    assert.equal(p.id, 'regression');
    assert.equal(p.requiresCalibration, true);
    assert.equal(p.hasMapping, false);
  });

  it('reports unavailable until a mapping is set', () => {
    const p = new RegressionGazeProvider();
    assert.deepEqual(p.estimate({ timeMs: 0, eyeLocal: signal(0.2, 0.2) }), {
      gaze_available: false,
    });
  });

  it('reports unavailable when a mapping exists but there is no eye-local input', () => {
    const p = new RegressionGazeProvider();
    p.setMapping({ cx: [0, 1, 0, 0, 0, 0, 0], cy: [0, 0, 1, 0, 0, 0, 0] });
    assert.deepEqual(p.estimate({ timeMs: 0, eyeLocal: null }), { gaze_available: false });
  });

  it('applies the mapping and reports availability + confidence once set', () => {
    const p = new RegressionGazeProvider();
    // x = 0.5*combined.x + 0.5, y = 0.5*combined.y + 0.5 (centres a [-1,1] signal into [0,1]).
    p.setMapping({ cx: [0.5, 0.5, 0, 0, 0, 0, 0], cy: [0.5, 0, 0.5, 0, 0, 0, 0] });
    const est = p.estimate({ timeMs: 0, eyeLocal: signal(1, -1, 0.9) });
    assert.equal(est.gaze_available, true);
    assert.ok(Math.abs((est.gaze_x ?? -1) - 1) < 1e-9); // 0.5*1+0.5 = 1
    assert.ok(Math.abs((est.gaze_y ?? -1) - 0) < 1e-9); // 0.5*-1+0.5 = 0
    assert.equal(est.gaze_confidence, 0.9);
  });

  it('clamps estimates outside the [0,1] viewport range', () => {
    const p = new RegressionGazeProvider();
    p.setMapping({ cx: [2, 0, 0, 0, 0, 0, 0], cy: [-1, 0, 0, 0, 0, 0, 0] });
    const est = p.estimate({ timeMs: 0, eyeLocal: signal(0, 0) });
    assert.equal(est.gaze_x, 1); // 2 -> clamped to 1
    assert.equal(est.gaze_y, 0); // -1 -> clamped to 0
  });

  it('rejects a mapping with the wrong coefficient length', () => {
    const p = new RegressionGazeProvider();
    assert.throws(() => p.setMapping({ cx: [1, 2], cy: [1, 2] }), /coefficient length/);
  });
});
