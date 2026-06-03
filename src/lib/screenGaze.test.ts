import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ScreenGazeRegistry,
  screenGazeSampleFields,
  type ScreenGazeProvider,
  type ScreenGazeEstimate,
} from './screenGaze.ts';

function stubProvider(id: string): ScreenGazeProvider {
  return {
    id,
    label: id,
    requiresCalibration: false,
    estimate: () => ({ gaze_available: false }),
  };
}

describe('screenGazeSampleFields', () => {
  it('writes raw coords + availability + confidence and tags screen_gaze when available', () => {
    const estimate: ScreenGazeEstimate = {
      gaze_x: 0.4,
      gaze_y: 0.6,
      gaze_available: true,
      gaze_confidence: 0.8,
    };
    const fields = screenGazeSampleFields(estimate);
    assert.equal(fields.gaze_x_raw, 0.4);
    assert.equal(fields.gaze_y_raw, 0.6);
    assert.equal(fields.gaze_available, true);
    assert.equal(fields.gaze_confidence, 0.8);
    assert.equal(fields.signal_type, 'screen_gaze');
  });

  it('leaves coordinates blank (not 0) when unavailable', () => {
    const fields = screenGazeSampleFields({ gaze_available: false });
    assert.equal(fields.gaze_available, false);
    assert.equal(fields.signal_type, 'screen_gaze');
    assert.equal(fields.gaze_x_raw, undefined);
    assert.equal(fields.gaze_y_raw, undefined);
    assert.equal(fields.gaze_confidence, undefined);
  });
});

describe('ScreenGazeRegistry', () => {
  it('has no selection when empty', () => {
    const reg = new ScreenGazeRegistry();
    assert.equal(reg.selected, null);
    assert.deepEqual(reg.list(), []);
  });

  it('defaults the selection to the first registered provider', () => {
    const reg = new ScreenGazeRegistry();
    reg.register(stubProvider('regression'));
    reg.register(stubProvider('webeyetrack'));
    const selected = reg.selected;
    assert.equal(selected?.id, 'regression');
    assert.deepEqual(
      reg.list().map((p) => p.id),
      ['regression', 'webeyetrack'],
    );
  });

  it('switches the selected provider by id', () => {
    const reg = new ScreenGazeRegistry();
    reg.register(stubProvider('regression'));
    reg.register(stubProvider('webeyetrack'));
    reg.select('webeyetrack');
    const selected = reg.selected;
    assert.equal(selected?.id, 'webeyetrack');
  });

  it('throws on an unknown id and on duplicate registration', () => {
    const reg = new ScreenGazeRegistry();
    reg.register(stubProvider('regression'));
    assert.throws(() => reg.select('nope'), /Unknown screen-gaze provider/);
    assert.throws(() => reg.register(stubProvider('regression')), /Duplicate screen-gaze provider/);
  });
});
