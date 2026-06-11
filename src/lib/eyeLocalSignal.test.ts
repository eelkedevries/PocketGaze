import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normaliseInCornerFrame,
  computeEyeLocalSignal,
  eyeLocalSignalFromFeatures,
  eyeLocalSampleFields,
  EYE_FRAME_ASPECT,
  type EyeInput,
  type EyeFeatureSource,
} from './eyeLocalSignal.ts';
import {
  LEFT_EYE_CORNER_IDX,
  RIGHT_EYE_CORNER_IDX,
  type LandmarkLike,
} from './eyeGeometry.ts';

// Binary-exact coordinates (powers of two) so normalised values are exact and
// strict equality is safe. Corners (0,0)-(2,0): midpoint (1,0), half-width 1,
// half-height EYE_FRAME_ASPECT (0.5).
const cornerA = { x: 0, y: 0 };
const cornerB = { x: 2, y: 0 };

function rotate(p: { x: number; y: number }, deg: number): { x: number; y: number } {
  const t = (deg * Math.PI) / 180;
  return {
    x: p.x * Math.cos(t) - p.y * Math.sin(t),
    y: p.x * Math.sin(t) + p.y * Math.cos(t),
  };
}

describe('normaliseInCornerFrame', () => {
  it('maps the corner midpoint to the origin', () => {
    assert.deepEqual(normaliseInCornerFrame({ x: 1, y: 0 }, cornerA, cornerB), { x: 0, y: 0 });
  });

  it('maps the corners to x = ±1 and a half-height offset to y = ±1', () => {
    assert.deepEqual(normaliseInCornerFrame({ x: 2, y: 0 }, cornerA, cornerB), { x: 1, y: 0 });
    assert.deepEqual(normaliseInCornerFrame({ x: 0, y: 0 }, cornerA, cornerB), { x: -1, y: 0 });
    // y is scaled by aspect x half-width = 0.5; image-down is positive.
    assert.deepEqual(normaliseInCornerFrame({ x: 1, y: 0.5 }, cornerA, cornerB), { x: 0, y: 1 });
    assert.deepEqual(normaliseInCornerFrame({ x: 1, y: -0.5 }, cornerA, cornerB), { x: 0, y: -1 });
  });

  it('is independent of the corner argument order', () => {
    const iris = { x: 1.5, y: 0.25 };
    assert.deepEqual(
      normaliseInCornerFrame(iris, cornerA, cornerB),
      normaliseInCornerFrame(iris, cornerB, cornerA),
    );
  });

  it('is invariant to scale (camera distance)', () => {
    const a = normaliseInCornerFrame({ x: 1.5, y: 0.25 }, cornerA, cornerB);
    const b = normaliseInCornerFrame({ x: 0.75, y: 0.125 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    assert.deepEqual(a, b);
  });

  it('is invariant to rotation (head roll) in an isotropic space', () => {
    const iris = { x: 1.5, y: 0.25 };
    const flat = normaliseInCornerFrame(iris, cornerA, cornerB);
    for (const deg of [15, 30, -25]) {
      const rolled = normaliseInCornerFrame(rotate(iris, deg), rotate(cornerA, deg), rotate(cornerB, deg));
      assert.ok(Math.abs(rolled.x - flat.x) < 1e-12, `x at ${deg} deg roll`);
      assert.ok(Math.abs(rolled.y - flat.y) < 1e-12, `y at ${deg} deg roll`);
    }
  });

  it('returns the origin for coincident corners (degenerate), never NaN', () => {
    const p = normaliseInCornerFrame({ x: 0.5, y: 0.5 }, { x: 0.3, y: 0.3 }, { x: 0.3, y: 0.3 });
    assert.deepEqual(p, { x: 0, y: 0 });
    assert.ok(!Number.isNaN(p.x) && !Number.isNaN(p.y));
  });
});

describe('computeEyeLocalSignal', () => {
  const left: EyeInput = {
    iris: { x: 2, y: 0 }, // at corner B -> x = +1
    cornerA,
    cornerB,
    quality: 0.8,
  };
  const right: EyeInput = {
    iris: { x: 0, y: 0 }, // at corner A -> x = -1
    cornerA,
    cornerB,
    quality: 0.6,
  };

  it('produces per-eye coordinates', () => {
    const s = computeEyeLocalSignal(left, right);
    assert.deepEqual(s.left, { x: 1, y: 0 });
    assert.deepEqual(s.right, { x: -1, y: 0 });
  });

  it('combines as the mean of the two eyes', () => {
    const s = computeEyeLocalSignal(left, right);
    assert.deepEqual(s.combined, { x: 0, y: 0 });
  });

  it('quality is the mean of the per-eye qualities', () => {
    const s = computeEyeLocalSignal(left, right);
    assert.ok(Math.abs(s.quality - 0.7) < 1e-9);
  });

  it('clamps out-of-range per-eye qualities into 0-1', () => {
    const s = computeEyeLocalSignal(
      { ...left, quality: 2 }, // clamps to 1
      { ...right, quality: -1 }, // clamps to 0
    );
    assert.equal(s.quality, 0.5);
  });
});

describe('eyeLocalSignalFromFeatures', () => {
  /** A landmark array with only the eye corners populated. */
  function landmarksWithCorners(): LandmarkLike[] {
    const lm: LandmarkLike[] = [];
    const place = (idx: number, x: number, y: number) => {
      lm[idx] = { x, y, z: 0 };
    };
    // Left eye corners at y = 0.5, spanning x 0.5..0.625 (width 0.125).
    place(LEFT_EYE_CORNER_IDX[0], 0.625, 0.5);
    place(LEFT_EYE_CORNER_IDX[1], 0.5, 0.5);
    // Right eye corners at y = 0.5, spanning x 0.25..0.375.
    place(RIGHT_EYE_CORNER_IDX[0], 0.25, 0.5);
    place(RIGHT_EYE_CORNER_IDX[1], 0.375, 0.5);
    return lm;
  }

  function features(overrides: Partial<EyeFeatureSource> = {}): EyeFeatureSource {
    return {
      leftEye: { irisProxy: { x: 0.59375, y: 0.5 }, quality: 1 }, // halfway to the outer corner
      rightEye: { irisProxy: { x: 0.3125, y: 0.5 }, quality: 1 }, // centred
      landmarks: landmarksWithCorners(),
      ...overrides,
    };
  }

  it('normalises each iris proxy in its own corner frame', () => {
    const s = eyeLocalSignalFromFeatures(features());
    assert.ok(s);
    assert.deepEqual(s.left, { x: 0.5, y: 0 });
    assert.deepEqual(s.right, { x: 0, y: 0 });
    assert.deepEqual(s.combined, { x: 0.25, y: 0 });
  });

  it('scales vertical offsets by the physical corner distance via imageAspect', () => {
    const f = features({
      leftEye: { irisProxy: { x: 0.5625, y: 0.53125 }, quality: 1 },
    });
    // With a square image (aspect 1): half-width 0.0625, dy 0.03125
    //   -> y = 0.03125 / (0.0625 x 0.5) = 1.
    const square = eyeLocalSignalFromFeatures(f, 1);
    assert.ok(square);
    assert.equal(square.left.y, 1);
    // A 2:1 image doubles the physical horizontal span: half-width 0.125
    //   -> y = 0.03125 / (0.125 x 0.5) = 0.5.
    const wide = eyeLocalSignalFromFeatures(f, 2);
    assert.ok(wide);
    assert.equal(wide.left.y, 0.5);
  });

  it('returns null when a corner landmark is missing', () => {
    const f = features();
    delete f.landmarks[LEFT_EYE_CORNER_IDX[0]];
    assert.equal(eyeLocalSignalFromFeatures(f), null);
  });
});

describe('eyeLocalSampleFields', () => {
  it('maps to the §4 model fields and tags the signal as eye_local', () => {
    const signal = computeEyeLocalSignal(
      { iris: { x: 1.5, y: 0.25 }, cornerA, cornerB, quality: 1 },
      { iris: { x: 0.5, y: -0.25 }, cornerA, cornerB, quality: 1 },
    );
    const fields = eyeLocalSampleFields(signal);
    assert.equal(fields.left_eye_x, signal.left.x);
    assert.equal(fields.left_eye_y, signal.left.y);
    assert.equal(fields.right_eye_x, signal.right.x);
    assert.equal(fields.right_eye_y, signal.right.y);
    assert.equal(fields.combined_eye_x, signal.combined.x);
    assert.equal(fields.combined_eye_y, signal.combined.y);
    assert.equal(fields.selected_signal_quality, signal.quality);
    assert.equal(fields.signal_type, 'eye_local');
  });
});

describe('EYE_FRAME_ASPECT', () => {
  it('is a positive fraction (half-height relative to half-width)', () => {
    assert.ok(EYE_FRAME_ASPECT > 0 && EYE_FRAME_ASPECT <= 1);
  });
});
