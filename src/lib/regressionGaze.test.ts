import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RegressionGazeProvider,
  gazeFeatures,
  applyMapping,
  GAZE_FEATURE_LENGTH,
  HEAD_ANGLE_SCALE_DEG,
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

/** A coefficient vector selecting one feature, padded to the full length. */
function selector(index: number, scale = 1): number[] {
  const c = new Array<number>(GAZE_FEATURE_LENGTH).fill(0);
  c[index] = scale;
  return c;
}

describe('gazeFeatures', () => {
  it('produces bias, combined, per-eye, and scaled head-pose terms', () => {
    const f = gazeFeatures(
      {
        left: { x: 0.1, y: 0.2 },
        right: { x: 0.3, y: 0.4 },
        combined: { x: 0.5, y: 0.6 },
        quality: 1,
      },
      { yaw: 15, pitch: -30, roll: 7.5 },
    );
    assert.equal(f.length, GAZE_FEATURE_LENGTH);
    assert.deepEqual(f, [1, 0.5, 0.6, 0.1, 0.2, 0.3, 0.4, 0.5, -1, 0.25]);
  });

  it('treats a missing head pose as neutral (zero angle terms)', () => {
    const f = gazeFeatures(signal(0.5, 0.6));
    assert.deepEqual(f.slice(7), [0, 0, 0]);
    assert.deepEqual(f, gazeFeatures(signal(0.5, 0.6), null));
  });

  it('scales the angles by the documented constant', () => {
    const f = gazeFeatures(signal(0, 0), { yaw: HEAD_ANGLE_SCALE_DEG, pitch: 0, roll: 0 });
    assert.equal(f[7], 1);
  });
});

describe('applyMapping', () => {
  it('computes the dot product per axis', () => {
    const mapping: LinearGazeMapping = {
      cx: selector(1), // x = combined.x
      cy: selector(2), // y = combined.y
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
    p.setMapping({ cx: selector(1), cy: selector(2) });
    assert.deepEqual(p.estimate({ timeMs: 0, eyeLocal: null }), { gaze_available: false });
  });

  it('applies the mapping and reports availability + confidence once set', () => {
    const p = new RegressionGazeProvider();
    // x = 0.5*combined.x + 0.5, y = 0.5*combined.y + 0.5 (centres a [-1,1] signal into [0,1]).
    const cx = selector(0, 0.5);
    cx[1] = 0.5;
    const cy = selector(0, 0.5);
    cy[2] = 0.5;
    p.setMapping({ cx, cy });
    const est = p.estimate({ timeMs: 0, eyeLocal: signal(1, -1, 0.9) });
    assert.equal(est.gaze_available, true);
    assert.ok(Math.abs((est.gaze_x ?? -1) - 1) < 1e-9); // 0.5*1+0.5 = 1
    assert.ok(Math.abs((est.gaze_y ?? -1) - 0) < 1e-9); // 0.5*-1+0.5 = 0
    assert.equal(est.gaze_confidence, 0.9);
  });

  it('feeds the head pose into the features so the mapping can compensate it', () => {
    const p = new RegressionGazeProvider();
    // x = 0.5 + yaw' (the scaled yaw feature at index 7).
    const cx = selector(0, 0.5);
    cx[7] = 1;
    p.setMapping({ cx, cy: selector(0, 0.5) });
    const neutral = p.estimate({ timeMs: 0, eyeLocal: signal(0, 0) });
    const turned = p.estimate({
      timeMs: 0,
      eyeLocal: signal(0, 0),
      headPose: { yaw: HEAD_ANGLE_SCALE_DEG / 2, pitch: 0, roll: 0 },
    });
    assert.equal(neutral.gaze_x, 0.5);
    assert.equal(turned.gaze_x, 1); // 0.5 + 0.5
  });

  it('clamps estimates outside the [0,1] viewport range', () => {
    const p = new RegressionGazeProvider();
    p.setMapping({ cx: selector(0, 2), cy: selector(0, -1) });
    const est = p.estimate({ timeMs: 0, eyeLocal: signal(0, 0) });
    assert.equal(est.gaze_x, 1); // 2 -> clamped to 1
    assert.equal(est.gaze_y, 0); // -1 -> clamped to 0
  });

  it('rejects a mapping with the wrong coefficient length', () => {
    const p = new RegressionGazeProvider();
    assert.throws(() => p.setMapping({ cx: [1, 2], cy: [1, 2] }), /coefficient length/);
  });
});
