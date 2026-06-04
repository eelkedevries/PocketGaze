// Stimulus and viewport/screen logging (specification §3.7, §4).
//
// To interpret a screen coordinate you must know the context it was captured in:
// which stimulus was shown, where, and under what viewport size, orientation,
// and device-pixel ratio. This module logs both into the shared session model
// (`007b`) as `stimulus` rows, on the shared session clock, using ONE documented
// coordinate system so later content mapping (`029`) and export (`031`) stay
// consistent.
//
// Coordinate systems (documented, consistent):
//   - `target_x` / `target_y`   — CSS pixels, relative to the viewport's
//     top-left (the same space as `getBoundingClientRect`).
//   - `target_nx` / `target_ny` — normalised 0-1 across the viewport
//     (resolution/orientation-independent). Derived from the CSS-pixel target
//     and the current viewport when not supplied, and vice versa.
//
// The DOM reads (viewport size, DPR) are injected so the core logic is pure and
// unit-testable; only `start()/stop()` touch real `window` events.

import type { SessionStore } from './sessionStore';
import type {
  ScreenOrientationLabel,
  StimulusRow,
  ViewportContextFields,
} from '../types/session';

/** `task_phase` markers distinguishing the two kinds of logged stimulus row. */
export const STIMULUS_PHASE = 'stimulus';
export const VIEWPORT_PHASE = 'viewport';

/** A snapshot of the viewport/screen context (specification §3.7). */
export interface ViewportSnapshot {
  width: number;
  height: number;
  devicePixelRatio: number;
  orientation: ScreenOrientationLabel;
}

/**
 * The minimal `window` surface this module uses. Structural (not the DOM
 * `Window` type) so the module type-checks under both the DOM-aware app config
 * and the Node-only test config.
 */
export interface WindowLike {
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/** The ambient `window`, if present (browser), else undefined (e.g. Node tests). */
function ambientWindow(): WindowLike | undefined {
  return (globalThis as { window?: WindowLike }).window;
}

/** Orientation from a viewport's aspect ratio (square counts as landscape). */
export function orientationFor(width: number, height: number): ScreenOrientationLabel {
  return height > width ? 'portrait' : 'landscape';
}

/** Read the current viewport/screen context from a `window`-like object. */
export function readViewport(win: WindowLike): ViewportSnapshot {
  const width = win.innerWidth;
  const height = win.innerHeight;
  return {
    width,
    height,
    devicePixelRatio: win.devicePixelRatio || 1,
    orientation: orientationFor(width, height),
  };
}

/** True when two snapshots differ in any logged field. */
export function viewportChanged(a: ViewportSnapshot, b: ViewportSnapshot): boolean {
  return (
    a.width !== b.width ||
    a.height !== b.height ||
    a.devicePixelRatio !== b.devicePixelRatio ||
    a.orientation !== b.orientation
  );
}

/** Map a snapshot to the §4 viewport-context field subset. */
export function viewportFields(v: ViewportSnapshot): ViewportContextFields {
  return {
    viewport_width: v.width,
    viewport_height: v.height,
    device_pixel_ratio: v.devicePixelRatio,
    screen_orientation: v.orientation,
  };
}

/** Position of a stimulus, in either coordinate system (at least one of each pair). */
export interface StimulusPosition {
  /** CSS-pixel position, viewport top-left origin. */
  x?: number;
  y?: number;
  /** Normalised 0-1 position across the viewport. */
  nx?: number;
  ny?: number;
}

/** A stimulus/task event to log. */
export interface StimulusEvent {
  target_id?: string;
  position?: StimulusPosition;
  /** Defaults to `STIMULUS_PHASE`; pass a custom phase to label task state. */
  task_phase?: string;
}

/**
 * Fill in whichever coordinate system is missing from the other, using the
 * viewport. Returns the §4 task-position fields. A zero-extent viewport leaves
 * the normalised values undefined (cannot divide), keeping blanks honest (§4.1).
 */
export function resolveTargetFields(
  position: StimulusPosition | undefined,
  v: ViewportSnapshot,
): Pick<StimulusRow, 'target_x' | 'target_y' | 'target_nx' | 'target_ny'> {
  if (!position) return {};
  let { x, y, nx, ny } = position;
  if (x !== undefined && nx === undefined && v.width > 0) nx = x / v.width;
  if (y !== undefined && ny === undefined && v.height > 0) ny = y / v.height;
  if (nx !== undefined && x === undefined) x = nx * v.width;
  if (ny !== undefined && y === undefined) y = ny * v.height;
  return { target_x: x, target_y: y, target_nx: nx, target_ny: ny };
}

export interface StimulusLoggerOptions {
  /** Injectable viewport reader (defaults to reading the real `window`). */
  readViewport?: () => ViewportSnapshot;
  /** Injectable event target for resize/orientation listeners (defaults to `window`). */
  win?: WindowLike;
}

/**
 * Logs stimulus events and viewport context into a `SessionStore`. It records a
 * viewport row at start and again whenever the viewport changes, and tags every
 * stimulus event with the current viewport context so screen coordinates remain
 * interpretable. Pure logic is exposed above; this class wires it to the store
 * and (optionally) to live resize/orientation events.
 */
export class StimulusLogger {
  private readonly store: SessionStore;
  private readonly read: () => ViewportSnapshot;
  private readonly win: WindowLike | undefined;
  private last: ViewportSnapshot | null = null;
  private readonly onResize = () => this.logViewport();

  constructor(store: SessionStore, options: StimulusLoggerOptions = {}) {
    this.store = store;
    this.win = options.win ?? ambientWindow();
    const win = this.win;
    this.read =
      options.readViewport ??
      (() => {
        if (!win) throw new Error('StimulusLogger: no window available; provide readViewport');
        return readViewport(win);
      });
  }

  /** Current viewport snapshot. */
  viewport(): ViewportSnapshot {
    return this.read();
  }

  /**
   * Log the current viewport context as a `stimulus` row if it has changed since
   * the last logged snapshot (or if none has been logged yet). Returns the row,
   * or null when nothing changed.
   */
  logViewport(): StimulusRow | null {
    const snapshot = this.read();
    if (this.last && !viewportChanged(this.last, snapshot)) return null;
    this.last = snapshot;
    return this.store.addStimulus({
      task_phase: VIEWPORT_PHASE,
      ...viewportFields(snapshot),
    });
  }

  /**
   * Log a stimulus/task event with id, position (both coordinate systems), and
   * the current viewport context, on the shared session clock.
   */
  logStimulus(event: StimulusEvent): StimulusRow {
    const snapshot = this.read();
    this.last = snapshot;
    return this.store.addStimulus({
      target_id: event.target_id,
      task_phase: event.task_phase ?? STIMULUS_PHASE,
      ...resolveTargetFields(event.position, snapshot),
      ...viewportFields(snapshot),
    });
  }

  /** Begin logging viewport changes; logs the initial viewport immediately. */
  start(): void {
    this.logViewport();
    if (!this.win) return;
    this.win.addEventListener('resize', this.onResize);
    this.win.addEventListener('orientationchange', this.onResize);
  }

  /** Stop listening for viewport changes. */
  stop(): void {
    if (!this.win) return;
    this.win.removeEventListener('resize', this.onResize);
    this.win.removeEventListener('orientationchange', this.onResize);
  }
}
