import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compensateEyeLocal, DEFAULT_COMPENSATION_GAIN } from './headCompensation.ts';

describe('compensateEyeLocal', () => {
  it('returns the point unchanged when there is no head pose', () => {
    const p = { x: 0.3, y: -0.2 };
    assert.deepEqual(compensateEyeLocal(p, null), p);
  });

  it('subtracts a yaw contribution from x and a pitch contribution from y', () => {
    const p = { x: 0.5, y: 0.5 };
    const out = compensateEyeLocal(p, { yaw: 10, pitch: -5 }, 0.01);
    assert.ok(Math.abs(out.x - (0.5 - 10 * 0.01)) < 1e-9);
    assert.ok(Math.abs(out.y - (0.5 + 5 * 0.01)) < 1e-9);
  });

  it('does not mutate the input and uses a documented default gain', () => {
    const p = { x: 0.2, y: 0.2 };
    const out = compensateEyeLocal(p, { yaw: 1, pitch: 1 });
    assert.deepEqual(p, { x: 0.2, y: 0.2 });
    assert.ok(Math.abs(out.x - (0.2 - DEFAULT_COMPENSATION_GAIN)) < 1e-9);
  });
});
