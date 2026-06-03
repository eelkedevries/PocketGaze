import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  angularSpeedDegPerSec,
  labelFromSpeedAndQuality,
  headMotionExcluded,
  HeadMotionLabeller,
  DEFAULT_MOTION_QUALITY_THRESHOLDS,
} from './motionQuality.ts';
import type { HeadPose } from './headPose.ts';

function pose(yaw: number, pitch = 0, roll = 0, quality = 1): HeadPose {
  return { yaw, pitch, roll, tx: 0, ty: 0, tz: 0, quality };
}

// angularSpeedDegPerSec -----------------------------------------------------

describe('angularSpeedDegPerSec', () => {
  it('returns undefined without a previous pose', () => {
    assert.strictEqual(angularSpeedDegPerSec(null, pose(10), 100), undefined);
  });

  it('returns undefined for non-positive dt', () => {
    assert.strictEqual(angularSpeedDegPerSec(pose(0), pose(10), 0), undefined);
  });

  it('computes deg/s from the combined angle change', () => {
    // 10° yaw change over 100 ms = 100 deg/s.
    const speed = angularSpeedDegPerSec(pose(0), pose(10), 100);
    assert.ok(speed !== undefined && Math.abs(speed - 100) < 1e-6, `speed ${speed}`);
  });

  it('combines all three axes via the Euclidean norm', () => {
    // 3-4-5: sqrt(3^2 + 4^2) = 5° over 1000 ms = 5 deg/s.
    const speed = angularSpeedDegPerSec(pose(0, 0, 0), pose(3, 4, 0), 1000);
    assert.ok(speed !== undefined && Math.abs(speed - 5) < 1e-6, `speed ${speed}`);
  });
});

// labelFromSpeedAndQuality --------------------------------------------------

describe('labelFromSpeedAndQuality', () => {
  const t = DEFAULT_MOTION_QUALITY_THRESHOLDS;

  it('labels low for slow motion and good quality', () => {
    assert.strictEqual(labelFromSpeedAndQuality(5, 0.9), 'low');
  });

  it('labels moderate above the moderate threshold', () => {
    assert.strictEqual(labelFromSpeedAndQuality(t.moderateSpeedDegPerSec + 1, 0.9), 'moderate');
  });

  it('labels uncertain above the uncertain threshold', () => {
    assert.strictEqual(labelFromSpeedAndQuality(t.uncertainSpeedDegPerSec + 1, 0.9), 'uncertain');
  });

  it('labels uncertain when pose quality is below the floor, regardless of speed', () => {
    assert.strictEqual(labelFromSpeedAndQuality(0, t.minPoseQuality - 0.01), 'uncertain');
  });

  it('falls back to low when speed is unknown but quality is good', () => {
    assert.strictEqual(labelFromSpeedAndQuality(undefined, 0.9), 'low');
  });

  it('is uncertain when speed is unknown and quality is poor', () => {
    assert.strictEqual(labelFromSpeedAndQuality(undefined, 0.1), 'uncertain');
  });

  it('honours custom thresholds', () => {
    const custom = { moderateSpeedDegPerSec: 5, uncertainSpeedDegPerSec: 10, minPoseQuality: 0.2 };
    assert.strictEqual(labelFromSpeedAndQuality(7, 0.9, custom), 'moderate');
    assert.strictEqual(labelFromSpeedAndQuality(12, 0.9, custom), 'uncertain');
  });
});

// headMotionExcluded --------------------------------------------------------

describe('headMotionExcluded', () => {
  it('excludes only uncertain intervals', () => {
    assert.strictEqual(headMotionExcluded('uncertain'), true);
    assert.strictEqual(headMotionExcluded('moderate'), false);
    assert.strictEqual(headMotionExcluded('low'), false);
  });
});

// HeadMotionLabeller --------------------------------------------------------

describe('HeadMotionLabeller', () => {
  it('labels the first pose low (no motion baseline) when quality is good', () => {
    const lab = new HeadMotionLabeller();
    assert.strictEqual(lab.label(pose(0, 0, 0, 0.9), 0), 'low');
  });

  it('labels a still, well-tracked sequence low throughout', () => {
    const lab = new HeadMotionLabeller();
    lab.label(pose(0, 0, 0, 0.9), 0);
    assert.strictEqual(lab.label(pose(0.2, 0, 0, 0.9), 100), 'low');
    assert.strictEqual(lab.label(pose(0.4, 0, 0, 0.9), 200), 'low');
  });

  it('shifts low → moderate → uncertain as motion increases', () => {
    const lab = new HeadMotionLabeller();
    lab.label(pose(0, 0, 0, 0.9), 0);
    // +1° in 100 ms = 10 deg/s → low
    assert.strictEqual(lab.label(pose(1, 0, 0, 0.9), 100), 'low');
    // +3° in 100 ms = 30 deg/s → moderate
    assert.strictEqual(lab.label(pose(4, 0, 0, 0.9), 200), 'moderate');
    // +10° in 100 ms = 100 deg/s → uncertain
    assert.strictEqual(lab.label(pose(14, 0, 0, 0.9), 300), 'uncertain');
  });

  it('labels a null pose uncertain and resets the baseline', () => {
    const lab = new HeadMotionLabeller();
    lab.label(pose(0, 0, 0, 0.9), 0);
    assert.strictEqual(lab.label(null, 100), 'uncertain');
    // After a gap, the next pose has no baseline → low (quality good).
    assert.strictEqual(lab.label(pose(50, 0, 0, 0.9), 200), 'low');
  });

  it('reset() forgets the previous pose', () => {
    const lab = new HeadMotionLabeller();
    lab.label(pose(0, 0, 0, 0.9), 0);
    lab.reset();
    // Big jump but no baseline after reset → low.
    assert.strictEqual(lab.label(pose(100, 0, 0, 0.9), 100), 'low');
  });
});
