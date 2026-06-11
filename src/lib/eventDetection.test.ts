import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectEvents,
  labelSaccadeByHeadMotion,
  sampleSpeedPerSec,
  DEFAULT_EVENT_DETECTION_THRESHOLDS,
  type EventSampleInput,
} from './eventDetection.ts';
import type { HeadMotionLabel } from '../types/session';

// Build a trace at a fixed frame step. `points` are [x, y]; all valid/low unless
// overridden per-sample via the optional decorators.
function trace(
  points: Array<[number, number]>,
  opts: {
    stepMs?: number;
    valid?: (i: number) => boolean;
    head?: (i: number) => HeadMotionLabel;
  } = {},
): EventSampleInput[] {
  const stepMs = opts.stepMs ?? 33;
  return points.map(([x, y], i) => ({
    timeMs: i * stepMs,
    x,
    y,
    valid: opts.valid ? opts.valid(i) : true,
    headMotionLabel: opts.head ? opts.head(i) : 'low',
  }));
}

// sampleSpeedPerSec ---------------------------------------------------------

describe('sampleSpeedPerSec', () => {
  it('computes Euclidean speed per second', () => {
    const a: EventSampleInput = { timeMs: 0, x: 0, y: 0, valid: true, headMotionLabel: 'low' };
    const b: EventSampleInput = { timeMs: 100, x: 0.3, y: 0.4, valid: true, headMotionLabel: 'low' };
    // distance 0.5 over 0.1 s = 5 units/s.
    assert.strictEqual(sampleSpeedPerSec(a, b), 5);
  });

  it('returns undefined for non-positive dt', () => {
    const a: EventSampleInput = { timeMs: 50, x: 0, y: 0, valid: true, headMotionLabel: 'low' };
    const b: EventSampleInput = { timeMs: 50, x: 1, y: 0, valid: true, headMotionLabel: 'low' };
    assert.strictEqual(sampleSpeedPerSec(a, b), undefined);
  });
});

// labelSaccadeByHeadMotion --------------------------------------------------

describe('labelSaccadeByHeadMotion', () => {
  it('maps head-motion context to the §5 saccade vocabulary', () => {
    assert.strictEqual(labelSaccadeByHeadMotion('low'), 'saccade_head_still');
    assert.strictEqual(labelSaccadeByHeadMotion('moderate'), 'saccade_during_head_movement');
    assert.strictEqual(labelSaccadeByHeadMotion('uncertain'), 'uncertain_head_motion');
  });
});

// detectEvents: fixations ---------------------------------------------------

describe('detectEvents — fixations', () => {
  it('detects a steady low-velocity interval as a fixation candidate', () => {
    // 8 frames @33ms ≈ 231 ms, tiny jitter — well under the saccade speed.
    const samples = trace([
      [0.0, 0.0],
      [0.01, 0.0],
      [0.0, 0.01],
      [0.01, 0.01],
      [0.0, 0.0],
      [0.01, 0.0],
      [0.0, 0.01],
      [0.01, 0.01],
    ]);
    const events = detectEvents(samples);
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].event_type, 'fixation_candidate');
    assert.strictEqual(events[0].event_start_ms, 0);
    assert.strictEqual(events[0].event_end_ms, 7 * 33);
    assert.ok(events[0].event_confidence > 0.8);
  });

  it('ignores a low-velocity run shorter than minFixationMs', () => {
    // 2 frames @33ms = 33 ms < 100 ms.
    const samples = trace([
      [0.0, 0.0],
      [0.01, 0.0],
    ]);
    assert.deepStrictEqual(detectEvents(samples), []);
  });

  it('rejects a slow but spatially dispersed drift as a fixation', () => {
    // Slow steady slide across a wide span: low speed, large dispersion.
    const samples = trace(
      Array.from({ length: 12 }, (_, i): [number, number] => [i * 0.1, 0]),
      { stepMs: 100 },
    );
    // Each step 0.1 units over 0.1 s = 1 unit/s (< 6), so not saccades; but the
    // bounding box spans 1.1 units >> 0.5 dispersion limit.
    assert.deepStrictEqual(detectEvents(samples), []);
  });
});

// detectEvents: saccades + head motion --------------------------------------

describe('detectEvents — saccades and head-motion labelling', () => {
  it('labels a saccade with a still head as saccade_head_still', () => {
    // Fixation (≥100 ms), then a fast jump, then fixation again.
    const samples = trace([
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], // fixation, 5 frames ≈ 132 ms
      [0.6, 0], // jump: 0.6 units in 33 ms ≈ 18 units/s >= 6
      [0.6, 0], [0.6, 0], [0.6, 0], [0.6, 0], // fixation, 5 frames
    ]);
    const events = detectEvents(samples);
    const saccades = events.filter((e) => e.event_type.startsWith('saccade') || e.event_type === 'uncertain_head_motion');
    assert.strictEqual(saccades.length, 1);
    assert.strictEqual(saccades[0].event_type, 'saccade_head_still');
    assert.strictEqual(saccades[0].head_motion_label, 'low');
    // The saccade amplitude is the 0.6-unit eye-local displacement.
    assert.ok(Math.abs(saccades[0].amplitude - 0.6) < 1e-9, `amplitude=${saccades[0].amplitude}`);
    // Two fixations bracket the saccade.
    assert.strictEqual(events.filter((e) => e.event_type === 'fixation_candidate').length, 2);
  });

  it('labels a saccade during moderate head motion accordingly', () => {
    const samples = trace(
      [[0, 0], [0.6, 0], [0.6, 0]],
      { head: (i) => (i === 1 ? 'moderate' : 'low') },
    );
    const events = detectEvents(samples);
    const sacc = events.find((e) => e.event_start_ms === 0);
    assert.ok(sacc);
    assert.strictEqual(sacc.event_type, 'saccade_during_head_movement');
    assert.strictEqual(sacc.head_motion_label, 'moderate');
    assert.ok(sacc.event_confidence < 0.8); // contaminated → lower confidence
  });

  it('reports a saccade swamped by head motion as uncertain_head_motion', () => {
    const samples = trace(
      [[0, 0], [0.6, 0], [0.6, 0]],
      { head: (i) => (i === 1 ? 'uncertain' : 'low') },
    );
    const events = detectEvents(samples);
    const sacc = events.find((e) => e.event_start_ms === 0);
    assert.ok(sacc);
    assert.strictEqual(sacc.event_type, 'uncertain_head_motion');
  });
});

// detectEvents: noise-spike suppression --------------------------------------

describe('detectEvents — noise-spike suppression', () => {
  it('folds an out-and-back speed spike into the surrounding fixation', () => {
    // Steady fixation with one glitch frame that jumps 0.3 units and returns:
    // both glitch segments clear the speed threshold (0.3 / 33 ms ≈ 9 units/s),
    // but the run's first-to-last displacement is ~0 — no saccade happened.
    const samples = trace([
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
      [0.3, 0], // glitch frame
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
    ]);
    const events = detectEvents(samples);
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].event_type, 'fixation_candidate');
    assert.strictEqual(events[0].event_start_ms, 0);
    assert.strictEqual(events[0].event_end_ms, 10 * 33);
  });

  it('keeps a genuine saccade that lands somewhere new', () => {
    const samples = trace([
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
      [0.6, 0], // jump and STAY — a real saccade
      [0.6, 0], [0.6, 0], [0.6, 0], [0.6, 0],
    ]);
    const events = detectEvents(samples);
    assert.ok(events.some((e) => e.event_type === 'saccade_head_still'));
  });

  it('does not fold a spike whose own spread exceeds the dispersion limit', () => {
    // A huge out-and-back excursion (0.8 units) is not silently absorbed into
    // a fixation — its own bounding box fails the fixation dispersion bound.
    const samples = trace([
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
      [0.8, 0],
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
    ]);
    const events = detectEvents(samples);
    // The spike stays saccade-class; the two fixations remain separate.
    assert.strictEqual(events.filter((e) => e.event_type === 'fixation_candidate').length, 2);
  });

  it('can be disabled by setting minSaccadeAmplitude to zero', () => {
    const samples = trace([
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
      [0.3, 0],
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
    ]);
    const events = detectEvents(samples, {
      ...DEFAULT_EVENT_DETECTION_THRESHOLDS,
      minSaccadeAmplitude: 0,
    });
    assert.ok(events.some((e) => e.event_type.startsWith('saccade')));
  });
});

// detectEvents: invalid intervals -------------------------------------------

describe('detectEvents — invalid samples break runs', () => {
  it('does not bridge a fixation across a blink / tracking_lost gap', () => {
    // A long steady run, but a middle frame is invalid (blink).
    const samples = trace(
      Array.from({ length: 13 }, (): [number, number] => [0, 0]),
      { valid: (i) => i !== 6 },
    );
    const events = detectEvents(samples);
    // Two fixations either side of the gap, neither spanning it.
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events.every((e) => e.event_type === 'fixation_candidate'), true);
    for (const e of events) {
      assert.ok(!(e.event_start_ms < 6 * 33 && e.event_end_ms > 6 * 33));
    }
  });

  it('emits no events for an all-invalid trace', () => {
    const samples = trace(
      Array.from({ length: 6 }, (): [number, number] => [0, 0]),
      { valid: () => false },
    );
    assert.deepStrictEqual(detectEvents(samples), []);
  });
});

// thresholds ----------------------------------------------------------------

describe('DEFAULT_EVENT_DETECTION_THRESHOLDS', () => {
  it('exposes documented, overridable thresholds', () => {
    const samples = trace([
      [0, 0], [0.1, 0], [0.2, 0], [0.3, 0],
    ]);
    // With a very low saccade threshold, the same steady slide becomes saccades.
    const strict = detectEvents(samples, { ...DEFAULT_EVENT_DETECTION_THRESHOLDS, saccadeSpeedPerSec: 1 });
    assert.ok(strict.some((e) => e.event_type.startsWith('saccade')));
  });
});
