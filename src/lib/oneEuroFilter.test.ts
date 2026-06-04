import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OneEuroFilter,
  OneEuroVectorFilter,
  SignalFilterSet,
  smoothingAlpha,
  DEFAULT_ONE_EURO_PARAMS,
  ONE_EURO_FILTER_NAME,
} from './oneEuroFilter.ts';
import type { EyeLocalSignal } from './eyeLocalSignal.ts';

const DT = 1 / 30; // 30 fps

describe('smoothingAlpha', () => {
  it('returns a factor in (0, 1)', () => {
    const a = smoothingAlpha(1, DT);
    assert.ok(a > 0 && a < 1);
  });

  it('increases with the cutoff frequency (less smoothing)', () => {
    assert.ok(smoothingAlpha(5, DT) > smoothingAlpha(1, DT));
  });

  it('approaches 1 as the time step grows', () => {
    assert.ok(smoothingAlpha(1, 100) > 0.99);
  });
});

describe('OneEuroFilter', () => {
  it('returns the first sample unchanged', () => {
    const f = new OneEuroFilter();
    assert.equal(f.filter(0.5, DT), 0.5);
  });

  it('holds a constant signal constant', () => {
    const f = new OneEuroFilter();
    f.filter(5, DT);
    for (let i = 0; i < 20; i++) {
      assert.ok(Math.abs(f.filter(5, DT) - 5) < 1e-9);
    }
  });

  it('converges monotonically towards a step without overshoot', () => {
    const f = new OneEuroFilter();
    f.filter(0, DT); // settle at 0
    let prev = 0;
    let out = 0;
    for (let i = 0; i < 60; i++) {
      out = f.filter(1, DT);
      assert.ok(out >= prev - 1e-12, 'monotonic non-decreasing');
      assert.ok(out <= 1 + 1e-9, 'no overshoot above the target');
      prev = out;
    }
    assert.ok(out > 0.9, `did not converge close to 1 (got ${out})`);
  });

  it('reduces jitter: filtered variance is far below raw variance', () => {
    const f = new OneEuroFilter();
    const raw: number[] = [];
    const filt: number[] = [];
    for (let i = 0; i < 100; i++) {
      const x = i % 2 === 0 ? 0.5 : -0.5; // alternating noise around 0
      raw.push(x);
      filt.push(f.filter(x, DT));
    }
    const variance = (a: number[]) => {
      const m = a.reduce((s, v) => s + v, 0) / a.length;
      return a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length;
    };
    assert.ok(variance(filt) < variance(raw) * 0.25, 'filtered should be much smoother');
  });

  it('lags less with a higher beta on a moving signal', () => {
    const low = new OneEuroFilter({ ...DEFAULT_ONE_EURO_PARAMS, beta: 0.0 });
    const high = new OneEuroFilter({ ...DEFAULT_ONE_EURO_PARAMS, beta: 1.0 });
    let lo = 0;
    let hi = 0;
    for (let i = 0; i < 30; i++) {
      const x = i * 0.1; // rising ramp
      lo = low.filter(x, DT);
      hi = high.filter(x, DT);
    }
    // Higher beta raises the cutoff during motion, so it tracks the rising ramp
    // more closely (closer to the larger raw value).
    assert.ok(hi > lo, `expected high-beta (${hi}) to lead low-beta (${lo})`);
  });

  it('reset clears state so the next sample is returned unchanged', () => {
    const f = new OneEuroFilter();
    f.filter(1, DT);
    f.filter(2, DT);
    f.reset();
    assert.equal(f.filter(9, DT), 9);
  });
});

describe('OneEuroVectorFilter', () => {
  it('filters each channel independently', () => {
    const v = new OneEuroVectorFilter(3);
    const first = v.filter([1, 2, 3], DT);
    assert.deepEqual(first, [1, 2, 3]); // first sample unchanged per channel
    const second = v.filter([1, 2, 3], DT);
    for (const x of second) assert.ok(Math.abs(x - [1, 2, 3][second.indexOf(x)]) < 1);
  });
});

describe('SignalFilterSet', () => {
  const signal: EyeLocalSignal = {
    left: { x: 0.2, y: -0.2 },
    right: { x: -0.1, y: 0.3 },
    combined: { x: 0.05, y: 0.05 },
    quality: 1,
  };

  it('produces all six filtered eye-local fields and records the filter name', () => {
    const set = new SignalFilterSet();
    assert.equal(set.filterName, ONE_EURO_FILTER_NAME);
    const fields = set.filterEyeLocal(signal, DT);
    assert.equal(fields.left_eye_x_filtered, 0.2); // first sample unchanged
    assert.equal(fields.left_eye_y_filtered, -0.2);
    assert.equal(fields.right_eye_x_filtered, -0.1);
    assert.equal(fields.right_eye_y_filtered, 0.3);
    assert.equal(fields.combined_eye_x_filtered, 0.05);
    assert.equal(fields.combined_eye_y_filtered, 0.05);
  });

  it('produces the two filtered gaze fields', () => {
    const set = new SignalFilterSet();
    const g = set.filterGaze(0.4, 0.6, DT);
    assert.deepEqual(g, { gaze_x_filtered: 0.4, gaze_y_filtered: 0.6 });
  });
});
