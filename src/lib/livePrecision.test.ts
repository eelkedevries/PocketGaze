import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RollingPrecision, DEFAULT_PRECISION_WINDOW } from './livePrecision.ts';

describe('RollingPrecision', () => {
  it('reports zero precision for a held-still (constant) signal', () => {
    const rp = new RollingPrecision(10);
    for (let i = 0; i < 10; i++) rp.push({ x: 0.5, y: 0.5 });
    const v = rp.value();
    assert.equal(v.rmsS2S, 0);
    assert.equal(v.bcea, 0);
    assert.equal(v.full, true);
    assert.equal(v.count, 10);
  });

  it('computes a known rolling RMS-S2S', () => {
    const rp = new RollingPrecision(5);
    // Consecutive distances all 0.1 -> RMS-S2S = 0.1.
    [0, 0.1, 0.2, 0.3].forEach((x) => rp.push({ x, y: 0 }));
    assert.ok(Math.abs(rp.value().rmsS2S - 0.1) < 1e-9);
  });

  it('drops the oldest sample once the window is full', () => {
    const rp = new RollingPrecision(3);
    for (let i = 0; i < 10; i++) rp.push({ x: i, y: 0 });
    assert.equal(rp.size, 3);
    assert.equal(rp.value().full, true);
  });

  it('reports a finite zero before two samples arrive', () => {
    const rp = new RollingPrecision(8);
    assert.equal(rp.value().rmsS2S, 0);
    rp.push({ x: 0.2, y: 0.2 });
    assert.equal(rp.value().rmsS2S, 0);
    assert.equal(rp.value().full, false);
  });

  it('reset clears the window', () => {
    const rp = new RollingPrecision();
    rp.push({ x: 0, y: 0 });
    rp.push({ x: 1, y: 1 });
    rp.reset();
    assert.equal(rp.size, 0);
    assert.equal(rp.windowLength, DEFAULT_PRECISION_WINDOW);
  });
});
