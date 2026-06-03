import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { webEyeTrackGazeEstimate } from './webEyeTrackGazeMap.ts';

describe('webEyeTrackGazeEstimate', () => {
  it('maps normPog to available gaze when eyes are open', () => {
    const est = webEyeTrackGazeEstimate({ normPog: [0.4, 0.7], gazeState: 'open' });
    assert.deepEqual(est, { gaze_x: 0.4, gaze_y: 0.7, gaze_available: true });
  });

  it('treats a missing gazeState as open (only an explicit "closed" blocks gaze)', () => {
    const est = webEyeTrackGazeEstimate({ normPog: [0.1, 0.2] });
    assert.equal(est.gaze_available, true);
  });

  it('reports unavailable when the eyes are closed (blink)', () => {
    assert.deepEqual(webEyeTrackGazeEstimate({ normPog: [0.4, 0.7], gazeState: 'closed' }), {
      gaze_available: false,
    });
  });

  it('reports unavailable for missing/short/non-finite normPog', () => {
    assert.equal(webEyeTrackGazeEstimate(null).gaze_available, false);
    assert.equal(webEyeTrackGazeEstimate({ gazeState: 'open' }).gaze_available, false);
    assert.equal(webEyeTrackGazeEstimate({ normPog: [0.5], gazeState: 'open' }).gaze_available, false);
    assert.equal(
      webEyeTrackGazeEstimate({ normPog: [NaN, 0.5], gazeState: 'open' }).gaze_available,
      false,
    );
  });

  it('clamps out-of-range coordinates into the [0,1] viewport', () => {
    const est = webEyeTrackGazeEstimate({ normPog: [1.5, -0.2], gazeState: 'open' });
    assert.deepEqual(est, { gaze_x: 1, gaze_y: 0, gaze_available: true });
  });
});
