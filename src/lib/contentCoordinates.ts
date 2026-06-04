// Content coordinate mapping (specification §3.7, §6.2).
//
// Screen gaze and content coordinates are DIFFERENT things (Domain rule §6.2).
// A screen x/y tells you where on the *viewport* the user is looking; a content
// x/y tells you where on the *element* (accounting for scroll, zoom, layout
// shifts) the user is looking. The difference matters whenever the element can
// scroll, resize, or move — any of those transforms invalidates a screen-only
// position.
//
// The transform is computed per-frame from the element's current
// `getBoundingClientRect()` (viewport-relative bounding box, already accounting
// for page scroll and CSS transforms) and the current viewport dimensions.
// Internal element scroll (`scrollLeft`/`scrollTop`) is applied on top when
// computing scroll-corrected ("document space") coordinates.
//
// The PURE helper functions below are unit-testable without the DOM; only the
// `ContentMapper` class touches live DOM APIs. Structural interfaces replace the
// DOM built-in types so this module compiles under the Node-only test config as
// well as the browser-DOM app config.

import type { ContentMappedFields } from '../types/session';

// ---------------------------------------------------------------------------
// Pure helpers (unit-testable)
// ---------------------------------------------------------------------------

/** An element's bounding box in the current viewport (from `getBoundingClientRect()`). */
export interface ContentRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A point in two representations: CSS-pixel offset from the element and normalised 0-1. */
export interface ContentPoint {
  /** CSS-pixel horizontal offset from the element's left edge. */
  x: number;
  /** CSS-pixel vertical offset from the element's top edge. */
  y: number;
  /** `x / rect.width` — normalised within the element's *visible* width. */
  nx: number;
  /** `y / rect.height` — normalised within the element's *visible* height. */
  ny: number;
}

/** Element scroll state from `scrollLeft` / `scrollTop`. */
export interface ScrollState {
  scrollLeft: number;
  scrollTop: number;
}

/**
 * Map a normalised screen-gaze point (0-1) to a content-relative point using
 * the element's bounding rect and the current viewport dimensions. Returns null
 * when the rect or viewport has zero extent (element not visible, or viewport
 * size unknown) so callers can set `content_mapping_available = false` rather
 * than silently emitting a bad coordinate (§4.1).
 *
 * `getBoundingClientRect()` already accounts for page scroll and CSS transforms
 * (translate, scale, rotate), so screen→content is just:
 *   x = gaze_x * viewport_width - rect.left
 *   y = gaze_y * viewport_height - rect.top
 */
export function screenToContent(
  gaze: { x: number; y: number },
  rect: ContentRect,
  viewport: { width: number; height: number },
): ContentPoint | null {
  if (rect.width <= 0 || rect.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }
  const x = gaze.x * viewport.width - rect.left;
  const y = gaze.y * viewport.height - rect.top;
  return { x, y, nx: x / rect.width, ny: y / rect.height };
}

/**
 * Apply the element's internal scroll offset to a viewport-space content point,
 * producing "document space" coordinates — i.e. the position within the element's
 * full scrollable content, not just the visible slice. Use this for content that
 * scrolls internally (overflow: scroll/auto).
 *
 * Normalised values are clamped to 0-1 (scroll-content-width / scroll-content-height)
 * when scroll extents are provided; undefined otherwise.
 */
export function applyElementScroll(
  point: ContentPoint,
  scroll: ScrollState,
  scrollExtent?: { scrollWidth: number; scrollHeight: number },
): ContentPoint {
  const x = point.x + scroll.scrollLeft;
  const y = point.y + scroll.scrollTop;
  const nx =
    scrollExtent && scrollExtent.scrollWidth > 0 ? x / scrollExtent.scrollWidth : point.nx;
  const ny =
    scrollExtent && scrollExtent.scrollHeight > 0 ? y / scrollExtent.scrollHeight : point.ny;
  return { x, y, nx, ny };
}

/**
 * Map a content point to the §4 session-model content-mapped field subset.
 * When `point` is null the mapping was unavailable; only `content_mapping_available`
 * is written (blank, not zero — §4.1).
 */
export function contentMappedFields(point: ContentPoint | null): ContentMappedFields {
  if (point === null) return { content_mapping_available: false };
  return {
    content_x: point.nx,
    content_y: point.ny,
    content_mapping_available: true,
  };
}

// ---------------------------------------------------------------------------
// DOM-wired ContentMapper (structural types — not imported by tests)
// ---------------------------------------------------------------------------

/**
 * The minimal DOM-element surface this module needs. Structural (not the DOM
 * `Element` type) so the module compiles under the Node-only test config.
 */
export interface ContentElementLike {
  getBoundingClientRect(): ContentRect;
  readonly scrollLeft: number;
  readonly scrollTop: number;
  readonly scrollWidth: number;
  readonly scrollHeight: number;
  addEventListener(type: string, listener: () => void, opts?: { passive?: boolean }): void;
  removeEventListener(type: string, listener: () => void): void;
}

/**
 * A minimal `window` surface for scroll/resize listeners. Structural so this
 * module compiles under the Node-only test config.
 */
export interface WindowLike {
  addEventListener(type: string, listener: () => void, opts?: { passive?: boolean }): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface ContentMapperOptions {
  /**
   * Called whenever the element's scroll or size changes enough to affect the
   * screen↔content transform. Wire this up to re-emit `stimulus` rows or update
   * the session (§3.7).
   */
  onTransformChange?: () => void;
  /** Injectable `window` for tests; defaults to the real `window`. */
  win?: WindowLike;
}

/**
 * Tracks a DOM element's viewport-relative position and scroll state so that
 * screen-gaze coordinates can be mapped to content coordinates on every frame.
 * The element's `getBoundingClientRect()` is re-read on each `map()` call
 * (already accounts for page scroll, CSS transforms, and layout shifts).
 * Internal scroll is tracked via a `scroll` listener on the element itself.
 *
 * Call `start()` to begin listening and `stop()` to release all listeners.
 * The mapper is safe to use without calling `start()` — `map()` will always
 * produce a result, just without the scroll-change callbacks.
 */
export class ContentMapper {
  private readonly el: ContentElementLike;
  private readonly onTransformChange: (() => void) | undefined;
  private readonly win: WindowLike | undefined;
  private started = false;

  private readonly onScroll = () => this.onTransformChange?.();
  private readonly onResize = () => this.onTransformChange?.();

  constructor(el: ContentElementLike, options: ContentMapperOptions = {}) {
    this.el = el;
    this.onTransformChange = options.onTransformChange;
    this.win = options.win ?? (globalThis as { window?: WindowLike }).window;
  }

  /**
   * Map a normalised screen-gaze point to content coordinates for this frame.
   * Reads the element's current bounding rect and scroll state. Always
   * returns a `ContentMappedFields` — availability is false when the element
   * has zero extent.
   */
  map(
    gaze: { x: number; y: number },
    viewport: { width: number; height: number },
    applyScroll = false,
  ): ContentMappedFields {
    const rect = this.el.getBoundingClientRect();
    let point = screenToContent(gaze, rect, viewport);
    if (point && applyScroll) {
      point = applyElementScroll(point, {
        scrollLeft: this.el.scrollLeft,
        scrollTop: this.el.scrollTop,
      }, {
        scrollWidth: this.el.scrollWidth,
        scrollHeight: this.el.scrollHeight,
      });
    }
    return contentMappedFields(point);
  }

  /** Current element rect (fresh read). */
  rect(): ContentRect {
    return this.el.getBoundingClientRect();
  }

  /** Current scroll state. */
  scroll(): ScrollState {
    return { scrollLeft: this.el.scrollLeft, scrollTop: this.el.scrollTop };
  }

  /** Begin listening for transform changes (scroll on the element, resize on the window). */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.el.addEventListener('scroll', this.onScroll, { passive: true });
    this.win?.addEventListener('resize', this.onResize, { passive: true });
  }

  /** Stop all transform-change listeners. */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.el.removeEventListener('scroll', this.onScroll);
    this.win?.removeEventListener('resize', this.onResize);
  }
}
