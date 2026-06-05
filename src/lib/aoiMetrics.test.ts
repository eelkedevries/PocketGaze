import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aoiContains,
  assignFixationsToAois,
  aoiMetrics,
  type Aoi,
  type AoiFixation,
} from './aoiMetrics.ts';

const AOIS: Aoi[] = [
  { id: 'headline', x: 0, y: 0, width: 0.5, height: 0.5 },
  { id: 'image', x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
];

function fix(content_x: number, content_y: number, durationMs: number, onsetMs: number): AoiFixation {
  return { content_x, content_y, durationMs, onsetMs };
}

describe('aoiContains / assignFixationsToAois', () => {
  it('detects containment with inclusive edges', () => {
    assert.equal(aoiContains(AOIS[0], 0.25, 0.25), true);
    assert.equal(aoiContains(AOIS[0], 0.5, 0.5), true); // edge
    assert.equal(aoiContains(AOIS[0], 0.6, 0.6), false);
  });

  it('assigns to the first matching AOI (overlap = first wins)', () => {
    const overlapping: Aoi[] = [
      { id: 'a', x: 0, y: 0, width: 1, height: 1 },
      { id: 'b', x: 0, y: 0, width: 1, height: 1 },
    ];
    assert.deepEqual(assignFixationsToAois([fix(0.5, 0.5, 100, 0)], overlapping), ['a']);
  });

  it('leaves unmapped fixations unassigned', () => {
    const f: AoiFixation = { content_x: 0.2, content_y: 0.2, durationMs: 100, onsetMs: 0, content_mapping_available: false };
    assert.deepEqual(assignFixationsToAois([f], AOIS), [null]);
  });
});

describe('aoiMetrics', () => {
  it('sums dwell and count and takes the earliest onset as TTFF', () => {
    const fixations = [
      fix(0.1, 0.1, 200, 500), // headline, onset 500
      fix(0.2, 0.2, 150, 1200), // headline, later
      fix(0.8, 0.8, 300, 800), // image
    ];
    const m = aoiMetrics(fixations, AOIS);
    const headline = m.perAoi.find((r) => r.id === 'headline')!;
    const image = m.perAoi.find((r) => r.id === 'image')!;
    assert.equal(headline.dwellMs, 350);
    assert.equal(headline.fixationCount, 2);
    assert.equal(headline.ttffMs, 500); // earliest onset
    assert.equal(image.dwellMs, 300);
    assert.equal(image.ttffMs, 800);
    assert.equal(m.totalDwellMs, 650);
    assert.equal(m.totalFixations, 3);
    assert.equal(m.unassignedCount, 0);
  });

  it('excludes fixations outside all AOIs and unmapped fixations', () => {
    const fixations: AoiFixation[] = [
      fix(0.1, 0.1, 100, 0), // headline
      fix(0.9, 0.1, 100, 100), // outside both
      { content_x: 0.1, content_y: 0.1, durationMs: 100, onsetMs: 200, content_mapping_available: false },
    ];
    const m = aoiMetrics(fixations, AOIS);
    assert.equal(m.totalFixations, 1);
    assert.equal(m.unassignedCount, 2);
  });

  it('returns documented zeros / null TTFF for empty inputs', () => {
    const m = aoiMetrics([], AOIS);
    assert.equal(m.totalDwellMs, 0);
    assert.equal(m.totalFixations, 0);
    assert.deepEqual(
      m.perAoi.map((r) => r.ttffMs),
      [null, null],
    );
    const noAoi = aoiMetrics([fix(0.1, 0.1, 100, 0)], []);
    assert.deepEqual(noAoi.perAoi, []);
    assert.equal(noAoi.unassignedCount, 1);
  });
});
