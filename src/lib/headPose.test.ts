import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  matrixToEulerAngles,
  matrixTranslation,
  decomposeHeadPose,
} from './headPose.ts';

// Build a 4x4 column-major matrix from a row-major 3x3 rotation and a
// translation vector, so the test data reads naturally.
function makeMatrix(
  r: [number, number, number, number, number, number, number, number, number],
  t: [number, number, number] = [0, 0, 0],
): number[] {
  // r is row-major: [r00,r01,r02, r10,r11,r12, r20,r21,r22]
  const [r00, r01, r02, r10, r11, r12, r20, r21, r22] = r;
  const [tx, ty, tz] = t;
  // Column-major 16-element array.
  return [
    r00, r10, r20, 0,
    r01, r11, r21, 0,
    r02, r12, r22, 0,
    tx, ty, tz, 1,
  ];
}

const IDENTITY = makeMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1]);

describe('matrixToEulerAngles', () => {
  it('returns zero angles for the identity rotation', () => {
    const e = matrixToEulerAngles(IDENTITY);
    assert.ok(Math.abs(e.yaw) < 1e-6, `yaw ${e.yaw}`);
    assert.ok(Math.abs(e.pitch) < 1e-6, `pitch ${e.pitch}`);
    assert.ok(Math.abs(e.roll) < 1e-6, `roll ${e.roll}`);
  });

  it('recovers a pure roll (rotation about the view/Z axis)', () => {
    const a = (30 * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    // Rz(30°), row-major.
    const m = makeMatrix([c, -s, 0, s, c, 0, 0, 0, 1]);
    const e = matrixToEulerAngles(m);
    assert.ok(Math.abs(e.roll - 30) < 1e-3, `roll ${e.roll}`);
    assert.ok(Math.abs(e.yaw) < 1e-3, `yaw ${e.yaw}`);
    assert.ok(Math.abs(e.pitch) < 1e-3, `pitch ${e.pitch}`);
  });

  it('recovers a pure pitch (rotation about the X axis)', () => {
    const a = (20 * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    // Rx(20°), row-major.
    const m = makeMatrix([1, 0, 0, 0, c, -s, 0, s, c]);
    const e = matrixToEulerAngles(m);
    assert.ok(Math.abs(e.pitch - 20) < 1e-3, `pitch ${e.pitch}`);
    assert.ok(Math.abs(e.yaw) < 1e-3, `yaw ${e.yaw}`);
    assert.ok(Math.abs(e.roll) < 1e-3, `roll ${e.roll}`);
  });

  it('recovers a pure yaw (rotation about the Y axis)', () => {
    const a = (45 * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    // Ry(45°), row-major.
    const m = makeMatrix([c, 0, s, 0, 1, 0, -s, 0, c]);
    const e = matrixToEulerAngles(m);
    assert.ok(Math.abs(e.yaw - 45) < 1e-3, `yaw ${e.yaw}`);
    assert.ok(Math.abs(e.pitch) < 1e-3, `pitch ${e.pitch}`);
    assert.ok(Math.abs(e.roll) < 1e-3, `roll ${e.roll}`);
  });

  it('returns zeros for a malformed (too-short) matrix', () => {
    const e = matrixToEulerAngles([1, 0, 0]);
    assert.deepStrictEqual(e, { yaw: 0, pitch: 0, roll: 0 });
  });

  it('avoids NaN at the gimbal-lock singularity (yaw = 90°)', () => {
    const a = Math.PI / 2;
    const c = Math.cos(a), s = Math.sin(a); // c ~ 0
    const m = makeMatrix([c, 0, s, 0, 1, 0, -s, 0, c]);
    const e = matrixToEulerAngles(m);
    assert.ok(Number.isFinite(e.yaw) && Number.isFinite(e.pitch) && Number.isFinite(e.roll));
    assert.ok(Math.abs(Math.abs(e.yaw) - 90) < 1e-3, `yaw ${e.yaw}`);
  });
});

describe('matrixTranslation', () => {
  it('reads the translation column', () => {
    const m = makeMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1], [3, -2, 50]);
    assert.deepStrictEqual(matrixTranslation(m), { tx: 3, ty: -2, tz: 50 });
  });

  it('returns zeros for a malformed matrix', () => {
    assert.deepStrictEqual(matrixTranslation([0, 0]), { tx: 0, ty: 0, tz: 0 });
  });
});

describe('decomposeHeadPose', () => {
  it('combines rotation, translation, and a clamped quality', () => {
    const m = makeMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1], [1, 2, 3]);
    const pose = decomposeHeadPose({ rows: 4, columns: 4, data: m }, 0.8);
    assert.ok(Math.abs(pose.yaw) < 1e-6);
    assert.strictEqual(pose.tx, 1);
    assert.strictEqual(pose.tz, 3);
    assert.strictEqual(pose.quality, 0.8);
  });

  it('clamps quality into 0-1', () => {
    const m = makeMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    assert.strictEqual(decomposeHeadPose({ rows: 4, columns: 4, data: m }, 1.5).quality, 1);
    assert.strictEqual(decomposeHeadPose({ rows: 4, columns: 4, data: m }, -0.2).quality, 0);
  });
});
