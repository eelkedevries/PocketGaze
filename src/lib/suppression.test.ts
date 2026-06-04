import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bothEyesClosed,
  isInvalidTracking,
  detectBlinkIntervals,
  detectTrackingLostIntervals,
  SampleSuppressor,
  DEFAULT_SUPPRESSION_THRESHOLDS,
  type BlinkSampleInput,
  type QualitySampleInput,
} from './suppression.ts';

// bothEyesClosed ------------------------------------------------------------

describe('bothEyesClosed', () => {
  it('is true only when both eyes are closed', () => {
    assert.strictEqual(bothEyesClosed(false, false), true);
    assert.strictEqual(bothEyesClosed(true, false), false); // wink
    assert.strictEqual(bothEyesClosed(false, true), false); // wink
    assert.strictEqual(bothEyesClosed(true, true), false);
  });
});

// isInvalidTracking ---------------------------------------------------------

describe('isInvalidTracking', () => {
  const t = DEFAULT_SUPPRESSION_THRESHOLDS;
  it('is invalid when no face is detected', () => {
    assert.strictEqual(isInvalidTracking(false, 1.0), true);
  });
  it('is invalid when quality is below the floor', () => {
    assert.strictEqual(isInvalidTracking(true, t.minValidQuality - 0.01), true);
  });
  it('is valid with a face and adequate quality', () => {
    assert.strictEqual(isInvalidTracking(true, t.minValidQuality), false);
  });
});

// detectBlinkIntervals ------------------------------------------------------

function blinkSeries(closedFrames: boolean[], stepMs = 33): BlinkSampleInput[] {
  return closedFrames.map((closed, i) => ({
    timeMs: i * stepMs,
    leftEyeOpen: !closed,
    rightEyeOpen: !closed,
  }));
}

describe('detectBlinkIntervals', () => {
  it('detects a blink that meets the minimum duration', () => {
    // 5 closed frames @33ms span = 132 ms >= 50 ms.
    const samples = blinkSeries([false, false, true, true, true, true, true, false, false]);
    const intervals = detectBlinkIntervals(samples);
    assert.strictEqual(intervals.length, 1);
    assert.strictEqual(intervals[0].startMs, 2 * 33);
    assert.strictEqual(intervals[0].endMs, 6 * 33);
  });

  it('ignores a single-frame closure shorter than minBlinkMs', () => {
    // One closed frame → span 0 ms < 50 ms.
    const samples = blinkSeries([false, true, false]);
    assert.deepStrictEqual(detectBlinkIntervals(samples), []);
  });

  it('ignores a wink (only one eye closed)', () => {
    const samples: BlinkSampleInput[] = [0, 33, 66, 99].map((timeMs) => ({
      timeMs,
      leftEyeOpen: false,
      rightEyeOpen: true,
    }));
    assert.deepStrictEqual(detectBlinkIntervals(samples), []);
  });

  it('detects two separate blinks', () => {
    const samples = blinkSeries([
      true, true, true, false, false, true, true, true, false,
    ]);
    const intervals = detectBlinkIntervals(samples);
    assert.strictEqual(intervals.length, 2);
  });

  it('closes an open blink run at the end of the series', () => {
    const samples = blinkSeries([false, true, true, true]);
    const intervals = detectBlinkIntervals(samples);
    assert.strictEqual(intervals.length, 1);
    assert.strictEqual(intervals[0].endMs, 3 * 33);
  });
});

// detectTrackingLostIntervals -----------------------------------------------

describe('detectTrackingLostIntervals', () => {
  it('emits an interval when invalid tracking persists past the threshold', () => {
    // 6 invalid frames @33ms span = 165 ms >= 150 ms.
    const samples: QualitySampleInput[] = Array.from({ length: 8 }, (_, i) => ({
      timeMs: i * 33,
      faceDetected: i >= 1 && i <= 6 ? false : true,
      quality: 1,
    }));
    const intervals = detectTrackingLostIntervals(samples);
    assert.strictEqual(intervals.length, 1);
    assert.strictEqual(intervals[0].startMs, 33);
    assert.strictEqual(intervals[0].endMs, 6 * 33);
  });

  it('tolerates a brief dropout shorter than trackingLostMs', () => {
    // 2 invalid frames span = 33 ms < 150 ms.
    const samples: QualitySampleInput[] = Array.from({ length: 5 }, (_, i) => ({
      timeMs: i * 33,
      faceDetected: true,
      quality: i === 2 || i === 3 ? 0.1 : 0.9,
    }));
    assert.deepStrictEqual(detectTrackingLostIntervals(samples), []);
  });

  it('triggers on sustained low quality as well as lost face', () => {
    const samples: QualitySampleInput[] = Array.from({ length: 8 }, (_, i) => ({
      timeMs: i * 50,
      faceDetected: true,
      quality: i < 6 ? 0.1 : 0.9,
    }));
    const intervals = detectTrackingLostIntervals(samples);
    assert.strictEqual(intervals.length, 1);
  });
});

// SampleSuppressor (streaming) ----------------------------------------------

describe('SampleSuppressor', () => {
  it('marks a blink frame closed and invalid', () => {
    const s = new SampleSuppressor();
    const r = s.process({
      timeMs: 0,
      leftEyeOpen: false,
      rightEyeOpen: false,
      faceDetected: true,
      quality: 0.9,
    });
    assert.strictEqual(r.blink_state, 'closed');
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'blink');
  });

  it('marks a clean frame open and valid', () => {
    const s = new SampleSuppressor();
    const r = s.process({
      timeMs: 0,
      leftEyeOpen: true,
      rightEyeOpen: true,
      faceDetected: true,
      quality: 0.9,
    });
    assert.strictEqual(r.blink_state, 'open');
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.reason, 'ok');
  });

  it('reports no_face and low_quality reasons', () => {
    const s = new SampleSuppressor();
    const noFace = s.process({
      timeMs: 0, leftEyeOpen: true, rightEyeOpen: true, faceDetected: false, quality: 0.9,
    });
    assert.strictEqual(noFace.reason, 'no_face');
    assert.strictEqual(noFace.valid, false);

    const lowQ = s.process({
      timeMs: 33, leftEyeOpen: true, rightEyeOpen: true, faceDetected: true, quality: 0.1,
    });
    assert.strictEqual(lowQ.reason, 'low_quality');
    assert.strictEqual(lowQ.valid, false);
  });

  it('raises trackingLost only after the sustained threshold', () => {
    const s = new SampleSuppressor();
    const base = { leftEyeOpen: true, rightEyeOpen: true, faceDetected: false, quality: 0.9 };
    assert.strictEqual(s.process({ timeMs: 0, ...base }).trackingLost, false);
    assert.strictEqual(s.process({ timeMs: 100, ...base }).trackingLost, false);
    // 150 ms continuous invalid → tracking lost.
    assert.strictEqual(s.process({ timeMs: 150, ...base }).trackingLost, true);
  });

  it('resets the tracking-loss timer when tracking recovers', () => {
    const s = new SampleSuppressor();
    const lost = { leftEyeOpen: true, rightEyeOpen: true, faceDetected: false, quality: 0.9 };
    const ok = { leftEyeOpen: true, rightEyeOpen: true, faceDetected: true, quality: 0.9 };
    s.process({ timeMs: 0, ...lost });
    s.process({ timeMs: 200, ...ok }); // recovery resets the timer
    assert.strictEqual(s.process({ timeMs: 260, ...lost }).trackingLost, false);
  });

  it('does not count a blink toward tracking loss', () => {
    const s = new SampleSuppressor();
    const blink = { leftEyeOpen: false, rightEyeOpen: false, faceDetected: true, quality: 0.9 };
    s.process({ timeMs: 0, ...blink });
    s.process({ timeMs: 200, ...blink });
    assert.strictEqual(s.process({ timeMs: 400, ...blink }).trackingLost, false);
  });
});
