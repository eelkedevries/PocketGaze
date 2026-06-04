import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCell, serialiseToCsv, CSV_HEADERS } from './exportCsv.ts';
import { SessionStore } from './sessionStore.ts';

// formatCell ----------------------------------------------------------------

describe('formatCell', () => {
  it('returns empty string for undefined and null (blank, not zero — §4.1)', () => {
    assert.strictEqual(formatCell(undefined), '');
    assert.strictEqual(formatCell(null), '');
  });

  it('serialises booleans as "true" / "false"', () => {
    assert.strictEqual(formatCell(true), 'true');
    assert.strictEqual(formatCell(false), 'false');
  });

  it('serialises numbers as decimal strings', () => {
    assert.strictEqual(formatCell(1.23), '1.23');
    assert.strictEqual(formatCell(0), '0');
    assert.strictEqual(formatCell(-5), '-5');
  });

  it('quotes strings that contain commas', () => {
    assert.strictEqual(formatCell('a,b'), '"a,b"');
  });

  it('doubles internal quotes', () => {
    assert.strictEqual(formatCell('say "hi"'), '"say ""hi"""');
  });

  it('leaves plain strings unquoted', () => {
    assert.strictEqual(formatCell('sample'), 'sample');
    assert.strictEqual(formatCell('fixation_candidate'), 'fixation_candidate');
  });
});

// serialiseToCsv ------------------------------------------------------------

describe('serialiseToCsv', () => {
  function makeStore() {
    return new SessionStore({ now: () => 100 });
  }

  it('produces a header-only CSV for an empty store', () => {
    const csv = serialiseToCsv([]);
    const lines = csv.split('\r\n');
    assert.strictEqual(lines.length, 1);
    assert.ok(lines[0].startsWith('row_type,'));
  });

  it('row_type column is first and present on every data row', () => {
    const store = makeStore();
    store.addSample({ time_ms: 100 });
    store.addEvent({ event_type: 'blink', time_ms: 200 });
    const csv = serialiseToCsv(store.all());
    const [header, sampleLine, eventLine] = csv.split('\r\n');
    const cols = header.split(',');
    assert.strictEqual(cols[0], 'row_type');
    assert.ok(sampleLine.startsWith('sample,'));
    assert.ok(eventLine.startsWith('event,'));
  });

  it('non-applicable fields are blank (not zero)', () => {
    const store = makeStore();
    // A sample row has no event_type; it should be blank.
    store.addSample({ time_ms: 100, left_eye_quality: 0.9 });
    const csv = serialiseToCsv(store.all());
    const [header, row] = csv.split('\r\n');
    const cols = header.split(',');
    const cells = row.split(',');
    const eventTypeIdx = cols.indexOf('event_type');
    assert.ok(eventTypeIdx >= 0);
    assert.strictEqual(cells[eventTypeIdx], ''); // blank, not 'undefined' or '0'
  });

  it('raw and filtered columns are distinct and not aliased', () => {
    const store = makeStore();
    store.addSample({
      time_ms: 100,
      left_eye_x_raw: 0.11,
      left_eye_x_filtered: 0.12,
    });
    const csv = serialiseToCsv(store.all());
    const [header, row] = csv.split('\r\n');
    const cols = header.split(',');
    const cells = row.split(',');
    const rawIdx = cols.indexOf('left_eye_x_raw');
    const filtIdx = cols.indexOf('left_eye_x_filtered');
    assert.ok(rawIdx >= 0);
    assert.ok(filtIdx >= 0);
    assert.notStrictEqual(rawIdx, filtIdx);
    assert.strictEqual(cells[rawIdx], '0.11');
    assert.strictEqual(cells[filtIdx], '0.12');
  });

  it('header is stable — same column order every time', () => {
    const csv1 = serialiseToCsv([]);
    const csv2 = serialiseToCsv([]);
    assert.strictEqual(csv1, csv2);
    assert.strictEqual(csv1.split('\r\n')[0], CSV_HEADERS.join(','));
  });

  it('includes all five row types in one CSV', () => {
    const store = makeStore();
    store.addSample({ time_ms: 1 });
    store.addEvent({ event_type: 'blink', time_ms: 2 });
    store.addCalibration({ time_ms: 3 });
    store.addStimulus({ time_ms: 4 });
    store.addQuality({ time_ms: 5 });
    const csv = serialiseToCsv(store.all());
    const lines = csv.split('\r\n');
    assert.strictEqual(lines.length, 6); // header + 5 rows
    const rowTypes = lines.slice(1).map((l) => l.split(',')[0]);
    assert.deepStrictEqual(rowTypes, ['sample', 'event', 'calibration', 'stimulus', 'quality']);
  });

  it('writes raw_video_saved = false when set', () => {
    const store = makeStore();
    store.addSample({ time_ms: 1, raw_video_saved: false });
    const csv = serialiseToCsv(store.all());
    assert.ok(csv.includes('false'));
    // Verify raw_video_saved is never true in any exported row.
    const [header, row] = csv.split('\r\n');
    const cols = header.split(',');
    const cells = row.split(',');
    const idx = cols.indexOf('raw_video_saved');
    assert.notStrictEqual(cells[idx], 'true');
  });

  it('processing metadata columns are present in the header', () => {
    const header = serialiseToCsv([]).split('\r\n')[0];
    for (const col of ['pipeline_id', 'model_name', 'signal_type', 'filter_name', 'processing_location', 'raw_video_saved']) {
      assert.ok(header.includes(col), `Missing metadata column: ${col}`);
    }
  });
});
