import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SessionStore } from './sessionStore.ts';

/** A controllable monotonic clock for deterministic time_ms assertions. */
function fakeClock(start = 1000) {
  let value = start;
  return {
    now: () => value,
    advance(ms: number) {
      value += ms;
    },
  };
}

test('accumulates rows of every row type and queries them by type', () => {
  const store = new SessionStore({ now: () => 0 });

  store.addSample({ left_eye_x_raw: 0.1 });
  store.addEvent({ event_type: 'blink' });
  store.addCalibration({ target_id: 't1', target_x: 10, target_y: 20 });
  store.addStimulus({ task_phase: 'intro' });
  store.addQuality({ face_quality: 0.9 });

  assert.equal(store.count(), 5);
  assert.equal(store.byType('sample').length, 1);
  assert.equal(store.byType('event').length, 1);
  assert.equal(store.byType('calibration').length, 1);
  assert.equal(store.byType('stimulus').length, 1);
  assert.equal(store.byType('quality').length, 1);

  // byType narrows to the row shape: discriminant is correct.
  assert.equal(store.byType('event')[0].event_type, 'blink');
  assert.equal(store.byType('calibration')[0].target_id, 't1');
});

test('preserves raw and filtered signals as separate fields', () => {
  const store = new SessionStore({ now: () => 0 });

  store.addSample({
    left_eye_x_raw: 0.42,
    left_eye_x_filtered: 0.40,
    gaze_x_raw: 100,
    gaze_x_filtered: 98,
  });

  const [sample] = store.byType('sample');
  // Raw and filtered live in distinct columns and are not merged.
  assert.equal(sample.left_eye_x_raw, 0.42);
  assert.equal(sample.left_eye_x_filtered, 0.40);
  assert.notEqual(sample.left_eye_x_raw, sample.left_eye_x_filtered);
  assert.equal(sample.gaze_x_raw, 100);
  assert.equal(sample.gaze_x_filtered, 98);
});

test('distinguishes a blank (not applicable) field from a real zero', () => {
  const store = new SessionStore({ now: () => 0 });

  // gaze_x_raw is an explicit 0; gaze_y_raw is left blank (not applicable).
  store.addSample({ gaze_x_raw: 0 });

  const [sample] = store.byType('sample');
  assert.equal(sample.gaze_x_raw, 0);
  assert.ok(Object.prototype.hasOwnProperty.call(sample, 'gaze_x_raw'));

  // A blank field is absent, not coerced to 0.
  assert.equal(sample.gaze_y_raw, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(sample, 'gaze_y_raw'), false);
});

test('stamps session-relative time_ms from a shared monotonic clock', () => {
  const clock = fakeClock(5000);
  const store = new SessionStore({ now: clock.now });

  // Time is measured from session start, not absolute clock value.
  clock.advance(40);
  const first = store.addSample({});
  clock.advance(60);
  const second = store.addSample({});

  assert.equal(first.time_ms, 40);
  assert.equal(second.time_ms, 100);
});

test('respects an explicitly provided time_ms', () => {
  const store = new SessionStore({ now: () => 999 });
  const row = store.addEvent({ event_type: 'fixation_candidate', time_ms: 1234 });
  assert.equal(row.time_ms, 1234);
});

test('clear() empties the store', () => {
  const store = new SessionStore({ now: () => 0 });
  store.addSample({});
  store.addSample({});
  assert.equal(store.count(), 2);
  store.clear();
  assert.equal(store.count(), 0);
  assert.equal(store.all().length, 0);
});
