import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normaliseWithinRegion,
  computeEyeLocalSignal,
  eyeLocalSampleFields,
  type EyeInput,
  type EyeRegion,
} from './eyeLocalSignal.ts';

// Binary-exact coordinates (powers of two) so normalised values are exact and
// strict equality is safe: centre (0.375, 0.625), half-extents (0.125, 0.125).
const region: EyeRegion = { minX: 0.25, minY: 0.5, maxX: 0.5, maxY: 0.75 };

describe('normaliseWithinRegion', () => {
  it('maps the region centre to the origin', () => {
    const p = normaliseWithinRegion({ x: 0.375, y: 0.625 }, region);
    assert.equal(p.x, 0);
    assert.equal(p.y, 0);
  });

  it('maps the region edges to ±1', () => {
    assert.deepEqual(normaliseWithinRegion({ x: 0.5, y: 0.625 }, region), { x: 1, y: 0 });
    assert.deepEqual(normaliseWithinRegion({ x: 0.25, y: 0.625 }, region), { x: -1, y: 0 });
    assert.deepEqual(normaliseWithinRegion({ x: 0.375, y: 0.75 }, region), { x: 0, y: 1 });
    assert.deepEqual(normaliseWithinRegion({ x: 0.375, y: 0.5 }, region), { x: 0, y: -1 });
  });

  it('is scale-invariant: a doubled region gives the same normalised position', () => {
    const small: EyeRegion = { minX: 0, minY: 0, maxX: 0.125, maxY: 0.125 };
    const big: EyeRegion = { minX: 0, minY: 0, maxX: 0.25, maxY: 0.25 };
    // Iris a quarter of the way from centre to the positive edge in each.
    const a = normaliseWithinRegion({ x: 0.09375, y: 0.09375 }, small);
    const b = normaliseWithinRegion({ x: 0.1875, y: 0.1875 }, big);
    assert.deepEqual(a, b);
    assert.deepEqual(a, { x: 0.5, y: 0.5 });
  });

  it('returns the origin for a degenerate (zero-extent) region, never NaN', () => {
    const degenerate: EyeRegion = { minX: 0.3, minY: 0.3, maxX: 0.3, maxY: 0.3 };
    const p = normaliseWithinRegion({ x: 0.5, y: 0.5 }, degenerate);
    assert.deepEqual(p, { x: 0, y: 0 });
    assert.ok(!Number.isNaN(p.x) && !Number.isNaN(p.y));
  });
});

describe('computeEyeLocalSignal', () => {
  const left: EyeInput = {
    iris: { x: 0.5, y: 0.625 }, // right edge of region -> x = +1
    region,
    quality: 0.8,
  };
  const right: EyeInput = {
    iris: { x: 0.25, y: 0.625 }, // left edge of region -> x = -1
    region,
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

describe('eyeLocalSampleFields', () => {
  it('maps to the §4 model fields and tags the signal as eye_local', () => {
    const signal = computeEyeLocalSignal(
      { iris: { x: 0.5, y: 0.75 }, region, quality: 1 },
      { iris: { x: 0.25, y: 0.5 }, region, quality: 1 },
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
