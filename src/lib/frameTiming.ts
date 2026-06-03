// DOM-driven per-frame timing on top of the camera module (specification §3.1,
// §4 timing fields, §4.1 `time_ms` convention).
//
// FrameTimer drives a per-frame callback via
// HTMLVideoElement.requestVideoFrameCallback where available, falling back to
// requestAnimationFrame, and writes the §4 timing fields into the shared session
// store. `time_ms` stays milliseconds from session start (§4.1), stamped from the
// store's clock so it is shared with other subsystems. The pure frame-quality
// logic (effective FPS, dropped/repeated detection) lives in `frameStats.ts`.
//
// No feature extraction, head pose, or gaze here; no frame is stored or uploaded.

import { FrameStatsTracker } from './frameStats.ts';
import type { SessionStore } from './sessionStore.ts';

/** One per-frame update emitted to the demo UI. */
export interface FrameTick {
  frameId: number;
  /** Milliseconds from session start (shared session clock). */
  timeMs: number;
  /** Media-timeline position of the frame in seconds (blank on the fallback path). */
  videoFrameTime?: number;
  /** Browser presentation timestamp in ms (performance timebase). */
  captureTime?: number;
  /** Delay from frame presentation to our processing, in ms. */
  processingLatencyMs?: number;
  effectiveFps: number;
  /** Camera's reported nominal frame rate, when the track exposes it. */
  nominalFps?: number;
  droppedFrames: number;
  repeatedFrames: number;
  frameDropped: boolean;
  frameRepeated: boolean;
  /** True when the requestAnimationFrame fallback is driving the loop. */
  usedFallback: boolean;
}

export interface FrameTimerOptions {
  video: HTMLVideoElement;
  store: SessionStore;
  onTick?: (tick: FrameTick) => void;
  /** Force the requestAnimationFrame fallback (e.g. to exercise it deliberately). */
  forceFallback?: boolean;
}

/** Metadata passed to a requestVideoFrameCallback callback. */
interface VideoFrameMetadata {
  presentationTime: number;
  expectedDisplayTime: number;
  width: number;
  height: number;
  mediaTime: number;
  presentedFrames: number;
  processingDuration?: number;
}

type VideoFrameRequestCallback = (now: number, metadata: VideoFrameMetadata) => void;

/** The rVFC methods, declared locally so the module does not depend on lib support. */
interface RVFCMethods {
  requestVideoFrameCallback(callback: VideoFrameRequestCallback): number;
  cancelVideoFrameCallback(handle: number): void;
}

/** True when the video element supports requestVideoFrameCallback. */
export function supportsVideoFrameCallback(video: HTMLVideoElement): boolean {
  return 'requestVideoFrameCallback' in video;
}

export class FrameTimer {
  private readonly video: HTMLVideoElement;
  private readonly store: SessionStore;
  private readonly onTick?: (tick: FrameTick) => void;
  private readonly useFallback: boolean;
  private readonly stats = new FrameStatsTracker();

  private isRunning = false;
  private frameId = 0;
  private nominalFps?: number;
  private rvfcHandle?: number;
  private rafHandle?: number;

  constructor(options: FrameTimerOptions) {
    this.video = options.video;
    this.store = options.store;
    this.onTick = options.onTick;
    this.useFallback =
      options.forceFallback === true || !supportsVideoFrameCallback(options.video);
  }

  get running(): boolean {
    return this.isRunning;
  }

  start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.frameId = 0;
    this.stats.reset();
    this.nominalFps = readNominalFps(this.video);

    if (this.useFallback) {
      this.scheduleFallback();
    } else {
      this.scheduleRvfc();
    }
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    if (this.rvfcHandle !== undefined) {
      (this.video as unknown as RVFCMethods).cancelVideoFrameCallback(this.rvfcHandle);
      this.rvfcHandle = undefined;
    }
    if (this.rafHandle !== undefined) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = undefined;
    }
  }

  private scheduleRvfc(): void {
    const rvfc = this.video as unknown as RVFCMethods;
    const callback: VideoFrameRequestCallback = (_now, metadata) => {
      if (!this.isRunning) {
        return;
      }
      this.handleFrame(metadata.presentationTime, metadata.mediaTime, metadata.presentedFrames);
      if (this.isRunning) {
        this.rvfcHandle = rvfc.requestVideoFrameCallback(callback);
      }
    };
    this.rvfcHandle = rvfc.requestVideoFrameCallback(callback);
  }

  private scheduleFallback(): void {
    const callback = (now: number) => {
      if (!this.isRunning) {
        return;
      }
      // No media time or compositor counts are available on this path.
      this.handleFrame(now, undefined, undefined);
      if (this.isRunning) {
        this.rafHandle = requestAnimationFrame(callback);
      }
    };
    this.rafHandle = requestAnimationFrame(callback);
  }

  private handleFrame(
    captureTime: number | undefined,
    mediaTime: number | undefined,
    presentedFrames: number | undefined,
  ): void {
    const processingTime = performance.now();
    this.frameId += 1;

    const stats = this.stats.update({ processingTime, mediaTime, presentedFrames });

    const timeMs = this.store.elapsedMs();
    const processingLatencyMs =
      captureTime !== undefined ? Math.max(0, processingTime - captureTime) : undefined;

    // Write the §4 timing fields into the shared session model. Fields that do
    // not apply on the fallback path are left blank (undefined), never 0.
    this.store.addSample({
      time_ms: timeMs,
      frame_id: this.frameId,
      video_frame_time: mediaTime,
      capture_time: captureTime,
      processing_latency_ms: processingLatencyMs,
    });

    this.onTick?.({
      frameId: this.frameId,
      timeMs,
      videoFrameTime: mediaTime,
      captureTime,
      processingLatencyMs,
      effectiveFps: stats.effectiveFps,
      nominalFps: this.nominalFps,
      droppedFrames: stats.droppedFrames,
      repeatedFrames: stats.repeatedFrames,
      frameDropped: stats.frameDropped,
      frameRepeated: stats.frameRepeated,
      usedFallback: this.useFallback,
    });
  }
}

/** Read the camera track's reported nominal frame rate, if exposed. */
function readNominalFps(video: HTMLVideoElement): number | undefined {
  const source = video.srcObject;
  if (source && typeof (source as MediaStream).getVideoTracks === 'function') {
    const [track] = (source as MediaStream).getVideoTracks();
    const rate = track?.getSettings().frameRate;
    if (typeof rate === 'number' && rate > 0) {
      return rate;
    }
  }
  return undefined;
}
