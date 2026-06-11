// Screen-gaze provider abstraction (specification §3.4, §6.2, §7.3 spike `018b`).
//
// Screen gaze is a SEPARATE signal from the eye-local signal (§6.2): it is an
// estimate of where on the screen the user is looking, valid only once a mapping
// or model has been calibrated and checked. The Step 4 layer ships two
// user-selectable providers behind this one interface (§7.3, decision `018b`):
//   A) a custom calibration + regression mapping (the default) — `regressionGaze.ts`;
//   B) a WebEyeTrack adapter (opt-in)                          — `webEyeTrackGaze.ts` (`019b`).
//
// This module is framework-agnostic: pure types + a registry + a field-mapping
// helper, so providers and the registry are unit-testable without the DOM. A
// provider that needs the DOM (e.g. WebEyeTrack) keeps that dependency inside its
// own module; the interface only passes plain inputs through.

import type { EyeLocalSignal } from './eyeLocalSignal';
import type { ScreenGazeFields, SignalType } from '../types/session';

/**
 * Per-frame input offered to every provider. Each provider uses only what it
 * needs: the regression provider reads `eyeLocal`; an image-based provider
 * (WebEyeTrack) reads `frame`. Unused fields may be omitted.
 */
export interface ScreenGazeInput {
  /** Milliseconds from session start (shared clock, §4.1). */
  timeMs: number;
  /** The eye-local signal for this frame (`017`), when available. */
  eyeLocal?: EyeLocalSignal | null;
  /**
   * Head-pose angles (degrees) for this frame, when available. The regression
   * provider folds them into its feature vector so the fitted mapping can
   * compensate head-pose changes; image-based providers may ignore them.
   */
  headPose?: { yaw: number; pitch: number; roll: number } | null;
  /**
   * The current video frame, for image-based providers (e.g. WebEyeTrack, `019b`).
   * Typed `unknown` so this shared module stays DOM-free and unit-testable; the
   * image-based provider narrows it (e.g. to a `CanvasImageSource`).
   */
  frame?: unknown;
  /** Viewport size in CSS pixels, for providers that need it. */
  viewport?: { width: number; height: number } | null;
}

/**
 * A screen-gaze estimate in NORMALISED screen coordinates (0–1, top-left origin).
 * When `gaze_available` is false the coordinates are meaningless and must be
 * treated as "not applicable" (§4.1), never as a real (0, 0).
 */
export interface ScreenGazeEstimate {
  gaze_x?: number;
  gaze_y?: number;
  gaze_available: boolean;
  gaze_confidence?: number;
}

/** A pluggable screen-gaze estimator. Implementations live in their own modules. */
export interface ScreenGazeProvider {
  /** Stable id used by the registry/selector (e.g. `regression`, `webeyetrack`). */
  readonly id: string;
  /** Human-readable label for the demo selector. */
  readonly label: string;
  /** Whether the provider needs calibration before it can produce gaze. */
  readonly requiresCalibration: boolean;
  /** Optional async setup (e.g. loading a model). */
  init?(): Promise<void>;
  /** Estimate screen gaze for one frame. Must degrade to `gaze_available: false`. */
  estimate(input: ScreenGazeInput): ScreenGazeEstimate;
  /** Optional teardown (e.g. freeing a model/worker). */
  dispose?(): void;
}

/**
 * Map an estimate to the §4 session-model screen-gaze fields for a `sample` row.
 * The raw (unfiltered) screen gaze occupies the `*_raw` columns (§4.1); the
 * filtered counterpart is added later (`024`). `signal_type` is fixed to
 * `screen_gaze` so it is never conflated with the eye-local signal (§6.2).
 *
 * When unavailable, coordinate fields are left undefined (blank = "not
 * applicable"), and only availability is written.
 */
export function screenGazeSampleFields(
  estimate: ScreenGazeEstimate,
): ScreenGazeFields & { signal_type: SignalType } {
  if (!estimate.gaze_available) {
    return { gaze_available: false, signal_type: 'screen_gaze' };
  }
  return {
    gaze_x_raw: estimate.gaze_x,
    gaze_y_raw: estimate.gaze_y,
    gaze_available: true,
    gaze_confidence: estimate.gaze_confidence,
    signal_type: 'screen_gaze',
  };
}

/**
 * A small registry of screen-gaze providers with one selected provider. Holds no
 * DOM state, so it is testable; the demo (`020`) drives `select()` from the UI.
 */
export class ScreenGazeRegistry {
  private readonly providers: ScreenGazeProvider[] = [];
  private selectedId: string | null = null;

  /** Register a provider; the first registered becomes the default selection. */
  register(provider: ScreenGazeProvider): void {
    if (this.providers.some((p) => p.id === provider.id)) {
      throw new Error(`Duplicate screen-gaze provider id: ${provider.id}`);
    }
    this.providers.push(provider);
    if (this.selectedId === null) this.selectedId = provider.id;
  }

  /** All registered providers, in registration order. */
  list(): readonly ScreenGazeProvider[] {
    return this.providers;
  }

  /** The currently selected provider, or null if none registered. */
  get selected(): ScreenGazeProvider | null {
    return this.providers.find((p) => p.id === this.selectedId) ?? null;
  }

  /** Select a provider by id. Throws if the id is unknown. */
  select(id: string): void {
    if (!this.providers.some((p) => p.id === id)) {
      throw new Error(`Unknown screen-gaze provider id: ${id}`);
    }
    this.selectedId = id;
  }
}
