import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validationInputsFromRows, precisionEllipse } from './validationErrorMap.ts';
import { bcea, type Point } from './validationMetrics.ts';
import type { QualityRow } from '../types/session.ts';

function vRow(over: Partial<QualityRow>): QualityRow {
  return {
    row_type: 'quality',
    time_ms: 0,
    task_phase: 'validation',
    gaze_available: true,
    ...over,
  } as QualityRow;
}

describe('validationInputsFromRows', () => {
  it('groups validation rows by target_id and builds flat pairs', () => {
    const rows: QualityRow[] = [
      vRow({ target_id: 'a', target_nx: 0.2, target_ny: 0.2, gaze_x_raw: 0.25, gaze_y_raw: 0.18 }),
      vRow({ target_id: 'a', target_nx: 0.2, target_ny: 0.2, gaze_x_raw: 0.23, gaze_y_raw: 0.21 }),
      vRow({ target_id: 'b', target_nx: 0.8, target_ny: 0.8, gaze_x_raw: 0.78, gaze_y_raw: 0.82 }),
    ];
    const { targets, pairs } = validationInputsFromRows(rows);
    assert.equal(targets.length, 2);
    assert.equal(targets[0].estimates.length, 2);
    assert.equal(targets[1].estimates.length, 1);
    assert.deepEqual(targets[0].target, { x: 0.2, y: 0.2 });
    assert.equal(pairs.length, 3);
  });

  it('skips non-validation rows and rows without a usable estimate', () => {
    const rows: QualityRow[] = [
      vRow({ task_phase: 'calibration', target_nx: 0.5, target_ny: 0.5, gaze_x_raw: 0.5, gaze_y_raw: 0.5 }),
      vRow({ target_nx: 0.5, target_ny: 0.5, gaze_available: false }),
      vRow({ target_nx: 0.5, target_ny: 0.5, gaze_x_raw: 0.5, gaze_y_raw: 0.5 }),
      vRow({ gaze_x_raw: 0.5, gaze_y_raw: 0.5 }), // missing target
    ];
    const { targets, pairs } = validationInputsFromRows(rows);
    assert.equal(pairs.length, 1);
    assert.equal(targets.length, 1);
  });
});

describe('precisionEllipse', () => {
  it('returns a zero-size ellipse for a constant cloud (finite, not NaN)', () => {
    const constant: Point[] = Array.from({ length: 4 }, () => ({ x: 0.5, y: 0.5 }));
    const e = precisionEllipse(constant);
    assert.equal(e.rx, 0);
    assert.equal(e.ry, 0);
    assert.equal(e.cx, 0.5);
    assert.equal(e.cy, 0.5);
    assert.ok(Number.isFinite(e.angleDeg));
  });

  it('is axis-aligned for an axis-aligned cloud, with rx along the wider axis', () => {
    // Wider spread in x than y, zero covariance -> major axis horizontal.
    const cloud: Point[] = [
      { x: 0.1, y: 0.49 },
      { x: 0.9, y: 0.49 },
      { x: 0.1, y: 0.51 },
      { x: 0.9, y: 0.51 },
    ];
    const e = precisionEllipse(cloud);
    assert.ok(e.rx > e.ry);
    // angle ~ 0 degrees (horizontal major axis).
    assert.ok(Math.abs(e.angleDeg) < 1e-6, `angle=${e.angleDeg}`);
  });

  it('has area pi*rx*ry equal to the BCEA of the same cloud', () => {
    const cloud: Point[] = [
      { x: 0.0, y: 0.0 },
      { x: 0.2, y: 0.05 },
      { x: 0.05, y: 0.25 },
      { x: 0.22, y: 0.27 },
      { x: 0.1, y: 0.12 },
    ];
    const e = precisionEllipse(cloud);
    const ellipseArea = Math.PI * e.rx * e.ry;
    assert.ok(Math.abs(ellipseArea - bcea(cloud)) < 1e-9, `area=${ellipseArea} bcea=${bcea(cloud)}`);
  });

  it('returns a zero-size ellipse centred on the point for a single sample', () => {
    const e = precisionEllipse([{ x: 0.3, y: 0.7 }]);
    assert.deepEqual(e, { cx: 0.3, cy: 0.7, rx: 0, ry: 0, angleDeg: 0 });
  });
});
