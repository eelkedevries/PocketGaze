import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SessionStore } from './sessionStore.ts';
import {
  orientationFor,
  viewportChanged,
  viewportFields,
  resolveTargetFields,
  StimulusLogger,
  STIMULUS_PHASE,
  VIEWPORT_PHASE,
  type ViewportSnapshot,
} from './stimulusLog.ts';

const VP: ViewportSnapshot = { width: 400, height: 800, devicePixelRatio: 2, orientation: 'portrait' };

// orientationFor ------------------------------------------------------------

describe('orientationFor', () => {
  it('is portrait when taller than wide, else landscape', () => {
    assert.strictEqual(orientationFor(400, 800), 'portrait');
    assert.strictEqual(orientationFor(800, 400), 'landscape');
    assert.strictEqual(orientationFor(500, 500), 'landscape'); // square → landscape
  });
});

// viewportChanged -----------------------------------------------------------

describe('viewportChanged', () => {
  it('detects a change in any logged field', () => {
    assert.strictEqual(viewportChanged(VP, { ...VP }), false);
    assert.strictEqual(viewportChanged(VP, { ...VP, width: 401 }), true);
    assert.strictEqual(viewportChanged(VP, { ...VP, devicePixelRatio: 3 }), true);
    assert.strictEqual(viewportChanged(VP, { ...VP, orientation: 'landscape' }), true);
  });
});

// viewportFields ------------------------------------------------------------

describe('viewportFields', () => {
  it('maps a snapshot to the §4 field subset', () => {
    assert.deepStrictEqual(viewportFields(VP), {
      viewport_width: 400,
      viewport_height: 800,
      device_pixel_ratio: 2,
      screen_orientation: 'portrait',
    });
  });
});

// resolveTargetFields -------------------------------------------------------

describe('resolveTargetFields', () => {
  it('derives normalised coordinates from CSS pixels', () => {
    const f = resolveTargetFields({ x: 200, y: 400 }, VP);
    assert.deepStrictEqual(f, { target_x: 200, target_y: 400, target_nx: 0.5, target_ny: 0.5 });
  });

  it('derives CSS pixels from normalised coordinates', () => {
    const f = resolveTargetFields({ nx: 0.25, ny: 0.75 }, VP);
    assert.deepStrictEqual(f, { target_x: 100, target_y: 600, target_nx: 0.25, target_ny: 0.75 });
  });

  it('returns nothing for a missing position', () => {
    assert.deepStrictEqual(resolveTargetFields(undefined, VP), {});
  });

  it('leaves normalised values undefined for a zero-extent viewport', () => {
    const f = resolveTargetFields({ x: 10, y: 10 }, { ...VP, width: 0, height: 0 });
    assert.strictEqual(f.target_nx, undefined);
    assert.strictEqual(f.target_ny, undefined);
  });
});

// StimulusLogger ------------------------------------------------------------

function loggerWith(snapshots: ViewportSnapshot[]) {
  let i = 0;
  const store = new SessionStore({ now: () => 0 });
  const logger = new StimulusLogger(store, {
    readViewport: () => snapshots[Math.min(i, snapshots.length - 1)],
  });
  const advance = () => {
    i += 1;
  };
  return { store, logger, advance };
}

describe('StimulusLogger', () => {
  it('logs a stimulus row with id, both coordinate systems, and viewport context', () => {
    const { store, logger } = loggerWith([VP]);
    const row = logger.logStimulus({ target_id: 'dot-1', position: { x: 200, y: 400 } });
    assert.strictEqual(row.row_type, 'stimulus');
    assert.strictEqual(row.target_id, 'dot-1');
    assert.strictEqual(row.task_phase, STIMULUS_PHASE);
    assert.strictEqual(row.target_nx, 0.5);
    assert.strictEqual(row.viewport_width, 400);
    assert.strictEqual(row.device_pixel_ratio, 2);
    assert.strictEqual(store.byType('stimulus').length, 1);
  });

  it('logs the initial viewport and only re-logs on change', () => {
    const changed: ViewportSnapshot = { ...VP, width: 900, orientation: 'landscape' };
    const { store, logger, advance } = loggerWith([VP, VP, changed]);
    assert.notStrictEqual(logger.logViewport(), null); // first: logs
    assert.strictEqual(logger.logViewport(), null); // unchanged: skipped
    advance(); // still VP (index 1)
    assert.strictEqual(logger.logViewport(), null);
    advance(); // now `changed` (index 2)
    const row = logger.logViewport();
    assert.notStrictEqual(row, null);
    assert.strictEqual(row?.task_phase, VIEWPORT_PHASE);
    assert.strictEqual(row?.screen_orientation, 'landscape');
    assert.strictEqual(store.byType('stimulus').length, 2);
  });
});
