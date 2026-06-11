import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeEAR,
  earToOpenness,
  isEyeOpen,
  EyelidStateTracker,
  landmarkCentroid,
  averageVisibility,
  landmarkBounds,
  EAR_BLINK_THRESHOLD,
  EAR_CLOSE_THRESHOLD,
  EAR_REOPEN_THRESHOLD,
  EAR_CLOSED,
  EAR_OPEN,
  RIGHT_EYE_EAR_IDX,
  type LandmarkLike,
} from './eyeGeometry.ts';

// Helpers ------------------------------------------------------------------

function pt(x: number, y: number, z = 0, visibility?: number): LandmarkLike {
  return visibility !== undefined ? { x, y, z, visibility } : { x, y, z };
}

/** Build a sparse landmark array where only the specified positions are set. */
function makeLandmarks(
  entries: Array<[number, LandmarkLike]>,
  size = 500,
): LandmarkLike[] {
  const arr: LandmarkLike[] = new Array(size).fill(null);
  for (const [i, lm] of entries) arr[i] = lm;
  return arr;
}

// Enough to exercise the right-eye EAR indices [33,160,158,133,153,144].
// We lay out a simple ellipse: horizontal span = 0.2, vertical span = 0.1
//   outer-corner (33)  at (-0.1, 0)
//   upper-outer  (160) at (-0.05, 0.05)
//   upper-inner  (158) at ( 0.05, 0.05)
//   inner-corner (133) at ( 0.1, 0)
//   lower-inner  (153) at ( 0.05, -0.05)
//   lower-outer  (144) at (-0.05, -0.05)
//
// EAR = (|upper-outer - lower-outer| + |upper-inner - lower-inner|) / (2 * |outer - inner|)
//     = (0.1 + 0.1) / (2 * 0.2) = 0.2 / 0.4 = 0.5
const OPEN_LANDMARKS = makeLandmarks([
  [33,  pt(-0.1,  0)],
  [160, pt(-0.05, 0.05)],
  [158, pt( 0.05, 0.05)],
  [133, pt( 0.1,  0)],
  [153, pt( 0.05, -0.05)],
  [144, pt(-0.05, -0.05)],
]);

// Closed eye: vertical span ≈ 0 → EAR ≈ 0
const CLOSED_LANDMARKS = makeLandmarks([
  [33,  pt(-0.1,  0)],
  [160, pt(-0.05, 0.001)],
  [158, pt( 0.05, 0.001)],
  [133, pt( 0.1,  0)],
  [153, pt( 0.05, -0.001)],
  [144, pt(-0.05, -0.001)],
]);

// computeEAR ---------------------------------------------------------------

describe('computeEAR', () => {
  it('returns approximately 0.5 for a symmetric open-eye ellipse', () => {
    const ear = computeEAR(OPEN_LANDMARKS, RIGHT_EYE_EAR_IDX);
    assert.ok(Math.abs(ear - 0.5) < 0.001, `expected ~0.5, got ${ear}`);
  });

  it('returns a near-zero value for a nearly-closed eye', () => {
    const ear = computeEAR(CLOSED_LANDMARKS, RIGHT_EYE_EAR_IDX);
    assert.ok(ear < 0.02, `expected < 0.02, got ${ear}`);
  });

  it('returns 0 when a required landmark is missing', () => {
    const sparse = makeLandmarks([[33, pt(0, 0)]]); // only one point set
    assert.strictEqual(computeEAR(sparse, RIGHT_EYE_EAR_IDX), 0);
  });
});

// earToOpenness ------------------------------------------------------------

describe('earToOpenness', () => {
  it('returns 0 at or below EAR_CLOSED', () => {
    assert.strictEqual(earToOpenness(EAR_CLOSED), 0);
    assert.strictEqual(earToOpenness(0), 0);
  });

  it('returns 1 at or above EAR_OPEN', () => {
    assert.strictEqual(earToOpenness(EAR_OPEN), 1);
    assert.strictEqual(earToOpenness(1), 1);
  });

  it('returns 0.5 at the midpoint', () => {
    const mid = (EAR_CLOSED + EAR_OPEN) / 2;
    assert.ok(Math.abs(earToOpenness(mid) - 0.5) < 1e-6);
  });
});

// isEyeOpen ----------------------------------------------------------------

describe('isEyeOpen', () => {
  it('returns true above the blink threshold', () => {
    assert.ok(isEyeOpen(EAR_BLINK_THRESHOLD + 0.01));
  });

  it('returns false at or below the blink threshold', () => {
    assert.ok(!isEyeOpen(EAR_BLINK_THRESHOLD));
    assert.ok(!isEyeOpen(0));
  });
});

// EyelidStateTracker ---------------------------------------------------------

describe('EyelidStateTracker', () => {
  it('starts open and closes only below the close threshold', () => {
    const t = new EyelidStateTracker();
    assert.ok(t.isOpen);
    assert.ok(t.update(EAR_CLOSE_THRESHOLD)); // at, not below -> still open
    assert.ok(!t.update(EAR_CLOSE_THRESHOLD - 0.01));
  });

  it('reopens only above the reopen threshold', () => {
    const t = new EyelidStateTracker();
    t.update(0.05); // closed
    assert.ok(!t.update(EAR_REOPEN_THRESHOLD)); // at, not above -> still closed
    assert.ok(t.update(EAR_REOPEN_THRESHOLD + 0.01));
  });

  it('does not flicker for values inside the hysteresis band', () => {
    const inBand = (EAR_CLOSE_THRESHOLD + EAR_REOPEN_THRESHOLD) / 2;
    const open = new EyelidStateTracker();
    assert.ok(open.update(inBand)); // open eye stays open
    assert.ok(open.update(inBand));
    const closed = new EyelidStateTracker();
    closed.update(0.05); // close it
    assert.ok(!closed.update(inBand)); // closed eye stays closed
    assert.ok(!closed.update(inBand));
  });

  it('tracks a full blink sequence', () => {
    const t = new EyelidStateTracker();
    const ears = [0.3, 0.28, 0.16, 0.08, 0.1, 0.2, 0.3];
    const states = ears.map((e) => t.update(e));
    assert.deepEqual(states, [true, true, false, false, false, false, true]);
  });

  it('reset returns to the open state', () => {
    const t = new EyelidStateTracker();
    t.update(0.05);
    assert.ok(!t.isOpen);
    t.reset();
    assert.ok(t.isOpen);
  });
});

// landmarkCentroid ---------------------------------------------------------

describe('landmarkCentroid', () => {
  it('returns the exact midpoint of two landmarks', () => {
    const lms = makeLandmarks([
      [0, pt(0, 0)],
      [1, pt(1, 1)],
    ]);
    const c = landmarkCentroid(lms, [0, 1]);
    assert.ok(Math.abs(c.x - 0.5) < 1e-9);
    assert.ok(Math.abs(c.y - 0.5) < 1e-9);
  });

  it('returns the single point for a singleton index', () => {
    const lms = makeLandmarks([[5, pt(3, 7, 2)]]);
    const c = landmarkCentroid(lms, [5]);
    assert.strictEqual(c.x, 3);
    assert.strictEqual(c.y, 7);
    assert.strictEqual(c.z, 2);
  });
});

// averageVisibility --------------------------------------------------------

describe('averageVisibility', () => {
  it('returns the mean of explicit visibility values', () => {
    const lms = makeLandmarks([
      [0, pt(0, 0, 0, 0.2)],
      [1, pt(0, 0, 0, 0.8)],
    ]);
    assert.ok(Math.abs(averageVisibility(lms, [0, 1]) - 0.5) < 1e-9);
  });

  it('treats undefined visibility as 1.0', () => {
    const lms = makeLandmarks([
      [0, pt(0, 0, 0, 0.0)],
      [1, pt(0, 0)], // no visibility
    ]);
    assert.ok(Math.abs(averageVisibility(lms, [0, 1]) - 0.5) < 1e-9);
  });
});

// landmarkBounds -----------------------------------------------------------

describe('landmarkBounds', () => {
  it('returns the tight bounding box of the given landmarks', () => {
    const lms = makeLandmarks([
      [0, pt(0.2, 0.3)],
      [1, pt(0.6, 0.1)],
      [2, pt(0.4, 0.5)],
    ]);
    const b = landmarkBounds(lms, [0, 1, 2]);
    assert.ok(Math.abs(b.minX - 0.2) < 1e-9);
    assert.ok(Math.abs(b.maxX - 0.6) < 1e-9);
    assert.ok(Math.abs(b.minY - 0.1) < 1e-9);
    assert.ok(Math.abs(b.maxY - 0.5) < 1e-9);
  });

  it('applies padding on every side', () => {
    const lms = makeLandmarks([
      [0, pt(0.4, 0.4)],
      [1, pt(0.6, 0.6)],
    ]);
    const b = landmarkBounds(lms, [0, 1], 0.1);
    assert.ok(Math.abs(b.minX - 0.3) < 1e-9);
    assert.ok(Math.abs(b.maxX - 0.7) < 1e-9);
    assert.ok(Math.abs(b.minY - 0.3) < 1e-9);
    assert.ok(Math.abs(b.maxY - 0.7) < 1e-9);
  });
});
