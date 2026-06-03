import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FrameStatsTracker } from './frameStats.ts';

test('computes a plausible effective FPS for a steady stream', () => {
  const tracker = new FrameStatsTracker();
  const interval = 1000 / 60; // ~16.67 ms per frame at 60 fps

  let stats = tracker.update({ processingTime: 0, mediaTime: 0, presentedFrames: 0 });
  assert.equal(stats.effectiveFps, 0); // no interval yet on the first frame

  for (let i = 1; i <= 10; i += 1) {
    stats = tracker.update({
      processingTime: i * interval,
      mediaTime: i * interval,
      presentedFrames: i,
    });
  }

  assert.ok(Math.abs(stats.effectiveFps - 60) < 0.5, `fps ~60, got ${stats.effectiveFps}`);
  assert.equal(stats.droppedFrames, 0);
  assert.equal(stats.repeatedFrames, 0);
});

test('detects dropped frames when the compositor count jumps', () => {
  const tracker = new FrameStatsTracker();
  tracker.update({ processingTime: 0, presentedFrames: 0 });
  tracker.update({ processingTime: 16, presentedFrames: 1 });

  // Compositor advanced by 3 since we last observed it: two frames were dropped.
  const stats = tracker.update({ processingTime: 32, presentedFrames: 4 });

  assert.equal(stats.frameDropped, true);
  assert.equal(stats.droppedFrames, 2);
});

test('detects a repeated frame from an unchanged media time', () => {
  const tracker = new FrameStatsTracker();
  tracker.update({ processingTime: 0, mediaTime: 1.0, presentedFrames: 0 });

  const stats = tracker.update({ processingTime: 16, mediaTime: 1.0, presentedFrames: 1 });

  assert.equal(stats.frameRepeated, true);
  assert.equal(stats.repeatedFrames, 1);
});

test('reset() clears cumulative counters', () => {
  const tracker = new FrameStatsTracker();
  tracker.update({ processingTime: 0, mediaTime: 0, presentedFrames: 0 });
  tracker.update({ processingTime: 16, mediaTime: 0, presentedFrames: 3 });

  tracker.reset();
  const stats = tracker.update({ processingTime: 32, mediaTime: 5, presentedFrames: 10 });

  assert.equal(stats.droppedFrames, 0);
  assert.equal(stats.repeatedFrames, 0);
  assert.equal(stats.frameDropped, false);
  assert.equal(stats.effectiveFps, 0); // first frame after reset has no interval
});
