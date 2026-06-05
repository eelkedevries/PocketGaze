import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scanpath,
  heatmap,
  totalDwellMs,
  fixationBounds,
  type Fixation,
} from './fixationAggregation.ts';

const FIX: Fixation[] = [
  { x: 0.2, y: 0.2, durationMs: 200 },
  { x: 0.8, y: 0.2, durationMs: 300 },
  { x: 0.5, y: 0.8, durationMs: 100 },
];

describe('scanpath', () => {
  it('preserves order and durations and builds n-1 segments', () => {
    const sp = scanpath(FIX);
    assert.deepEqual(
      sp.nodes.map((n) => n.order),
      [0, 1, 2],
    );
    assert.deepEqual(
      sp.nodes.map((n) => n.durationMs),
      [200, 300, 100],
    );
    assert.equal(sp.segments.length, 2);
    assert.equal(sp.totalDwellMs, 600);
  });

  it('computes segment lengths between consecutive nodes', () => {
    const sp = scanpath([
      { x: 0, y: 0, durationMs: 100 },
      { x: 0.3, y: 0.4, durationMs: 100 },
    ]);
    assert.ok(Math.abs(sp.segments[0].length - 0.5) < 1e-9);
  });

  it('returns empty structures for empty input', () => {
    const sp = scanpath([]);
    assert.deepEqual(sp.nodes, []);
    assert.deepEqual(sp.segments, []);
    assert.equal(sp.totalDwellMs, 0);
  });
});

describe('heatmap', () => {
  it('peaks at a clustered set of fixations', () => {
    // Three fixations clustered near (0.75, 0.75); one far away.
    const fixations: Fixation[] = [
      { x: 0.75, y: 0.75, durationMs: 300 },
      { x: 0.76, y: 0.74, durationMs: 300 },
      { x: 0.74, y: 0.76, durationMs: 300 },
      { x: 0.1, y: 0.1, durationMs: 50 },
    ];
    const grid = heatmap(fixations, { width: 10, height: 10 }, 0.05);
    // Find the peak cell and confirm it sits in the clustered region.
    let peak = 0;
    let peakIdx = 0;
    grid.values.forEach((v, i) => {
      if (v > peak) {
        peak = v;
        peakIdx = i;
      }
    });
    assert.equal(peak, 1); // normalised to its own max
    const col = peakIdx % grid.width;
    const row = Math.floor(peakIdx / grid.width);
    assert.ok(col >= 6 && row >= 6, `peak at col=${col} row=${row}`);
  });

  it('weights by duration vs count differently', () => {
    const fixations: Fixation[] = [
      { x: 0.25, y: 0.5, durationMs: 1000 }, // long dwell
      { x: 0.75, y: 0.5, durationMs: 50 }, // brief
    ];
    const byDuration = heatmap(fixations, { width: 8, height: 4 }, 0.08, 'duration');
    const byCount = heatmap(fixations, { width: 8, height: 4 }, 0.08, 'count');
    // The left (long-dwell) side dominates under duration weighting.
    const leftCol = 1;
    const rightCol = 6;
    const row = 2;
    const dLeft = byDuration.values[row * 8 + leftCol];
    const dRight = byDuration.values[row * 8 + rightCol];
    assert.ok(dLeft > dRight);
    // Under count weighting the two single fixations are roughly symmetric.
    const cLeft = byCount.values[row * 8 + leftCol];
    const cRight = byCount.values[row * 8 + rightCol];
    assert.ok(Math.abs(cLeft - cRight) < 1e-6);
  });

  it('returns an all-zero grid for empty input or degenerate parameters', () => {
    const empty = heatmap([], { width: 4, height: 4 }, 0.1);
    assert.equal(empty.max, 0);
    assert.ok(empty.values.every((v) => v === 0));
    const noSigma = heatmap(FIX, { width: 4, height: 4 }, 0);
    assert.equal(noSigma.max, 0);
  });
});

describe('helpers', () => {
  it('totals dwell and computes bounds', () => {
    assert.equal(totalDwellMs(FIX), 600);
    assert.deepEqual(fixationBounds(FIX), { minX: 0.2, maxX: 0.8, minY: 0.2, maxY: 0.8 });
    assert.equal(fixationBounds([]), null);
  });
});
