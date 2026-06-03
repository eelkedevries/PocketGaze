// Pure, deterministic frame-quality logic (specification §3.1).
//
// Effective frame rate and dropped/repeated-frame detection, with no DOM or
// clock dependency of its own — the caller passes timestamps and metadata — so
// it is directly unit-testable (`frameStats.test.ts`). The DOM-driven FrameTimer
// in `frameTiming.ts` feeds this tracker.

/** Per-frame metadata fed to the tracker. Times are in milliseconds. */
export interface FrameMetaInput {
  /** When our code processed this frame (monotonic clock, e.g. performance.now). */
  processingTime: number;
  /** Media-timeline position of the frame, in seconds, when available. */
  mediaTime?: number;
  /** Compositor's cumulative presented-frame count, when available. */
  presentedFrames?: number;
}

/** Live frame-quality statistics derived from the stream so far. */
export interface FrameStats {
  /** Smoothed processing/callback rate, in frames per second. */
  effectiveFps: number;
  /** Cumulative frames the compositor presented but we never processed. */
  droppedFrames: number;
  /** Cumulative frames that repeated the previous source frame. */
  repeatedFrames: number;
  /** True when one or more frames were dropped immediately before this one. */
  frameDropped: boolean;
  /** True when this frame repeats the previous source frame. */
  frameRepeated: boolean;
}

/**
 * Deterministic tracker for effective frame rate and dropped/repeated frames.
 * Feed it one {@link FrameMetaInput} per processed frame; it keeps no wall-clock
 * or DOM state of its own, which makes it directly unit-testable.
 */
export class FrameStatsTracker {
  private lastProcessingTime?: number;
  private emaInterval?: number;
  private lastMediaTime?: number;
  private lastPresentedFrames?: number;
  private dropped = 0;
  private repeated = 0;
  private readonly smoothing: number;

  /** @param smoothing EMA weight for the newest interval (0–1]. */
  constructor(smoothing = 0.2) {
    this.smoothing = smoothing;
  }

  update(input: FrameMetaInput): FrameStats {
    let frameDropped = false;
    let frameRepeated = false;

    // A repeated source frame presents the same media timestamp twice.
    if (
      input.mediaTime !== undefined &&
      this.lastMediaTime !== undefined &&
      input.mediaTime === this.lastMediaTime
    ) {
      frameRepeated = true;
      this.repeated += 1;
    }

    // The compositor advancing by more than one means we missed frames.
    if (input.presentedFrames !== undefined && this.lastPresentedFrames !== undefined) {
      const delta = input.presentedFrames - this.lastPresentedFrames;
      if (delta > 1) {
        this.dropped += delta - 1;
        frameDropped = true;
      }
    }

    let effectiveFps = 0;
    if (this.lastProcessingTime !== undefined) {
      const interval = input.processingTime - this.lastProcessingTime;
      if (interval > 0) {
        this.emaInterval =
          this.emaInterval === undefined
            ? interval
            : (1 - this.smoothing) * this.emaInterval + this.smoothing * interval;
      }
      if (this.emaInterval !== undefined && this.emaInterval > 0) {
        effectiveFps = 1000 / this.emaInterval;
      }
    }

    this.lastProcessingTime = input.processingTime;
    if (input.mediaTime !== undefined) {
      this.lastMediaTime = input.mediaTime;
    }
    if (input.presentedFrames !== undefined) {
      this.lastPresentedFrames = input.presentedFrames;
    }

    return {
      effectiveFps,
      droppedFrames: this.dropped,
      repeatedFrames: this.repeated,
      frameDropped,
      frameRepeated,
    };
  }

  reset(): void {
    this.lastProcessingTime = undefined;
    this.emaInterval = undefined;
    this.lastMediaTime = undefined;
    this.lastPresentedFrames = undefined;
    this.dropped = 0;
    this.repeated = 0;
  }
}
