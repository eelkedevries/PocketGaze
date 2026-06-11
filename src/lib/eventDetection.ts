// Candidate event detection (specification §3.6, §5, §6.3).
//
// Turns the filtered, quality-checked eye-local trace into interpretable
// CANDIDATE events: low-velocity intervals become `fixation_candidate`s and
// rapid movements become saccade-like events. Per Domain rule §6.3 events are
// always candidates — never presented as validated — and per §6.4 head/phone
// motion can masquerade as eye movement, so each saccade is re-labelled with its
// head-motion context (`saccade_head_still` / `saccade_during_head_movement` /
// `uncertain_head_motion`).
//
// Invalid samples (blink / `tracking_lost`, flagged upstream by `025`) are hard
// gaps: they break runs and are never classified. Uncertain head motion (`015`)
// does not break detection but downgrades the resulting label, so a saccade made
// while the head was moving too much is reported as `uncertain_head_motion`
// rather than mislabelled as a clean eye movement.
//
// Pure and deterministic (timestamps and coordinates are passed in, no clock),
// so it is fully unit-testable over synthetic traces. Wiring it into the live
// per-frame pipeline is the Step 6 demo (`027`); this module is the logic only.

import type { EventType, HeadMotionLabel } from '../types/session';

export interface EventDetectionThresholds {
  /**
   * Eye-local speed (normalised units per second) at/above which an inter-sample
   * segment is saccade-like rather than part of a fixation. The eye-local signal
   * is roughly in [-1, 1] within each eye region (`eyeLocalSignal.ts`).
   */
  saccadeSpeedPerSec: number;
  /** A fixation candidate must last at least this long (ms). */
  minFixationMs: number;
  /**
   * A fixation candidate's spatial spread (bounding-box width + height, in
   * eye-local units) must not exceed this; wider low-speed runs are drift, not a
   * fixation.
   */
  maxFixationDispersion: number;
  /**
   * A saccade-like run whose first-to-last displacement is below this (eye-local
   * units) went nowhere: a single-frame landmark glitch can clear the speed
   * threshold out-and-back without the eye moving. Such runs are folded back
   * into the surrounding fixation instead of being reported as saccades —
   * provided their own spread also fits inside `maxFixationDispersion`.
   */
  minSaccadeAmplitude: number;
}

/**
 * Documented default thresholds (portfolio demo, not device-calibrated; tune per
 * §3.6 limitations — they depend on device, distance, and lighting):
 *  - 6 units/s: a deliberate saccade sweeps a large fraction of the eye region in
 *    a few frames; slow drift/jitter stays well below this.
 *  - 100 ms: shorter low-speed runs are not yet a confident fixation.
 *  - 0.5 units: a genuine fixation stays within a small patch of the eye region.
 *  - 0.03 units: a real saccade lands somewhere new; an out-and-back spike of
 *    less than this is landmark noise, not an eye movement.
 */
export const DEFAULT_EVENT_DETECTION_THRESHOLDS: EventDetectionThresholds = {
  saccadeSpeedPerSec: 6,
  minFixationMs: 100,
  maxFixationDispersion: 0.5,
  minSaccadeAmplitude: 0.03,
};

/** Per-frame input to detection: a filtered, suppression-checked sample. */
export interface EventSampleInput {
  timeMs: number;
  /** Filtered combined eye-local x (normalised within the eye region). */
  x: number;
  /** Filtered combined eye-local y (normalised within the eye region). */
  y: number;
  /** False during blink / `tracking_lost` (from `025`); such samples are gaps. */
  valid: boolean;
  /** Head-motion contamination label for this sample (from `015`). */
  headMotionLabel: HeadMotionLabel;
}

/** A detected candidate event, ready to become an `event` row (§4.3, §5). */
export interface DetectedEvent {
  event_type: EventType;
  event_start_ms: number;
  event_end_ms: number;
  /** 0-1 confidence; lower under head-motion contamination or weak criteria. */
  event_confidence: number;
  /** Aggregate head-motion label over the event interval (§5). */
  head_motion_label: HeadMotionLabel;
  /**
   * Spatial amplitude of the event: the straight-line eye-local displacement
   * (normalised units) from the first to the last sample of the run. Most
   * meaningful for saccades; an estimated degree amplitude is layered on at
   * display time using the angular scale (`040`).
   */
  amplitude: number;
}

const MOTION_ORDER: Record<HeadMotionLabel, number> = { low: 0, moderate: 1, uncertain: 2 };

/** The more-uncertain of two head-motion labels (low < moderate < uncertain). */
function moreUncertain(a: HeadMotionLabel, b: HeadMotionLabel): HeadMotionLabel {
  return MOTION_ORDER[a] >= MOTION_ORDER[b] ? a : b;
}

/** Confidence multiplier from head-motion contamination (Domain rule §6.4). */
function headConfidenceFactor(label: HeadMotionLabel): number {
  switch (label) {
    case 'low':
      return 1.0;
    case 'moderate':
      return 0.6;
    case 'uncertain':
      return 0.3;
  }
}

/**
 * Map a saccade-like run to its §5 label from the head-motion context: clean
 * head → `saccade_head_still`; moderate head motion → `saccade_during_head_movement`;
 * too much head motion to trust → `uncertain_head_motion` (§6.4).
 */
export function labelSaccadeByHeadMotion(label: HeadMotionLabel): EventType {
  switch (label) {
    case 'low':
      return 'saccade_head_still';
    case 'moderate':
      return 'saccade_during_head_movement';
    case 'uncertain':
      return 'uncertain_head_motion';
  }
}

/** Eye-local speed (units/s) between two samples; Infinity guarded by dt > 0. */
export function sampleSpeedPerSec(a: EventSampleInput, b: EventSampleInput): number | undefined {
  const dtMs = b.timeMs - a.timeMs;
  if (dtMs <= 0) return undefined;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return (dist / dtMs) * 1000;
}

type SegmentClass = 'fixation' | 'saccade';

interface Segment {
  class: SegmentClass;
  startMs: number;
  endMs: number;
  headLabel: HeadMotionLabel;
  /** Indices into the sample array spanned by this segment (inclusive). */
  startIndex: number;
  endIndex: number;
}

/**
 * Detect candidate fixation and saccade-like events from a filtered, quality-
 * checked eye-local trace. Invalid samples break runs (never classified); each
 * saccade is labelled by its head-motion context. Returns events in time order.
 */
export function detectEvents(
  samples: EventSampleInput[],
  thresholds: EventDetectionThresholds = DEFAULT_EVENT_DETECTION_THRESHOLDS,
): DetectedEvent[] {
  // 1. Classify each segment between two consecutive VALID samples.
  const segments: Segment[] = [];
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (!a.valid || !b.valid) continue; // blink / tracking_lost gap
    const speed = sampleSpeedPerSec(a, b);
    if (speed === undefined) continue;
    const segClass: SegmentClass = speed >= thresholds.saccadeSpeedPerSec ? 'saccade' : 'fixation';
    const last = segments[segments.length - 1];
    const headLabel = moreUncertain(a.headMotionLabel, b.headMotionLabel);
    // Merge into the previous run when it is the same class and contiguous.
    if (last && last.class === segClass && last.endIndex === i - 1) {
      last.endMs = b.timeMs;
      last.endIndex = i;
      last.headLabel = moreUncertain(last.headLabel, headLabel);
    } else {
      segments.push({
        class: segClass,
        startMs: a.timeMs,
        endMs: b.timeMs,
        headLabel,
        startIndex: i - 1,
        endIndex: i,
      });
    }
  }

  // 2. Suppress noise spikes: a "saccade" that returns to (almost) where it
  // started, within a fixation-sized patch, is a landmark glitch rather than
  // an eye movement — real saccades land somewhere new. Reclassify such runs
  // as fixation segments so the surrounding fixation is not fragmented and no
  // phantom saccade is reported. Invalid-sample gaps are untouched: they
  // remain hard breaks (§5 — never bridged).
  for (const seg of segments) {
    if (
      seg.class === 'saccade' &&
      amplitudeOf(samples, seg.startIndex, seg.endIndex) < thresholds.minSaccadeAmplitude &&
      dispersionOf(samples, seg.startIndex, seg.endIndex) <= thresholds.maxFixationDispersion
    ) {
      seg.class = 'fixation';
    }
  }

  // 3. Re-merge contiguous same-class runs after the reclassification (two
  // adjacent segments share their boundary sample index).
  const runs: Segment[] = [];
  for (const seg of segments) {
    const last = runs[runs.length - 1];
    if (last && last.class === seg.class && last.endIndex === seg.startIndex) {
      last.endMs = seg.endMs;
      last.endIndex = seg.endIndex;
      last.headLabel = moreUncertain(last.headLabel, seg.headLabel);
    } else {
      runs.push({ ...seg });
    }
  }

  // 4. Turn runs into candidate events.
  const events: DetectedEvent[] = [];
  for (const seg of runs) {
    if (seg.class === 'fixation') {
      const durationMs = seg.endMs - seg.startMs;
      if (durationMs < thresholds.minFixationMs) continue;
      // A fixation must be confident: exclude runs swamped by head motion (§6.4).
      if (seg.headLabel === 'uncertain') continue;
      const dispersion = dispersionOf(samples, seg.startIndex, seg.endIndex);
      if (dispersion > thresholds.maxFixationDispersion) continue;
      const tightness = 1 - dispersion / thresholds.maxFixationDispersion; // 0-1
      events.push({
        event_type: 'fixation_candidate',
        event_start_ms: seg.startMs,
        event_end_ms: seg.endMs,
        event_confidence: clamp01(headConfidenceFactor(seg.headLabel) * tightness),
        head_motion_label: seg.headLabel,
        amplitude: amplitudeOf(samples, seg.startIndex, seg.endIndex),
      });
    } else {
      const peakSpeed = peakSpeedOf(samples, seg.startIndex, seg.endIndex);
      // Confidence rises with how far the speed clears the threshold, capped.
      const margin = clamp01(peakSpeed / (2 * thresholds.saccadeSpeedPerSec));
      events.push({
        event_type: labelSaccadeByHeadMotion(seg.headLabel),
        event_start_ms: seg.startMs,
        event_end_ms: seg.endMs,
        event_confidence: clamp01(headConfidenceFactor(seg.headLabel) * margin),
        head_motion_label: seg.headLabel,
        amplitude: amplitudeOf(samples, seg.startIndex, seg.endIndex),
      });
    }
  }
  return events;
}

/** Bounding-box spread (width + height) of an inclusive sample range. */
function dispersionOf(samples: EventSampleInput[], start: number, end: number): number {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = start; i <= end; i++) {
    minX = Math.min(minX, samples[i].x);
    maxX = Math.max(maxX, samples[i].x);
    minY = Math.min(minY, samples[i].y);
    maxY = Math.max(maxY, samples[i].y);
  }
  return maxX - minX + (maxY - minY);
}

/** Straight-line eye-local displacement (units) from the first to last sample. */
function amplitudeOf(samples: EventSampleInput[], start: number, end: number): number {
  const a = samples[start];
  const b = samples[end];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Peak inter-sample speed (units/s) across an inclusive sample range. */
function peakSpeedOf(samples: EventSampleInput[], start: number, end: number): number {
  let peak = 0;
  for (let i = start + 1; i <= end; i++) {
    const speed = sampleSpeedPerSec(samples[i - 1], samples[i]);
    if (speed !== undefined) peak = Math.max(peak, speed);
  }
  return peak;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
