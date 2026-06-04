import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  screenToContent,
  applyElementScroll,
  contentMappedFields,
  type ContentRect,
} from './contentCoordinates.ts';

const VP = { width: 400, height: 800 };

// screenToContent -----------------------------------------------------------

describe('screenToContent', () => {
  it('maps the centre of the viewport to the centre of a full-viewport element', () => {
    const rect: ContentRect = { left: 0, top: 0, width: 400, height: 800 };
    const pt = screenToContent({ x: 0.5, y: 0.5 }, rect, VP);
    assert.ok(pt);
    assert.strictEqual(pt.x, 200);
    assert.strictEqual(pt.y, 400);
    assert.strictEqual(pt.nx, 0.5);
    assert.strictEqual(pt.ny, 0.5);
  });

  it('correctly maps through an offset element (simulating scroll)', () => {
    // Element sits at left=100, top=200 (e.g. after page scroll or layout).
    const rect: ContentRect = { left: 100, top: 200, width: 200, height: 400 };
    const pt = screenToContent({ x: 0.5, y: 0.5 }, rect, VP);
    // Gaze CSS px = (200, 400); offset from element top-left = (100, 200).
    assert.ok(pt);
    assert.strictEqual(pt.x, 100);
    assert.strictEqual(pt.y, 200);
    // Normalised within the element: 100/200 = 0.5, 200/400 = 0.5.
    assert.strictEqual(pt.nx, 0.5);
    assert.strictEqual(pt.ny, 0.5);
  });

  it('handles gaze outside the element (negative normalised coords)', () => {
    const rect: ContentRect = { left: 200, top: 200, width: 200, height: 400 };
    // Gaze at x=0.1 → CSS 40px; element left=200; x offset = -160 < 0.
    const pt = screenToContent({ x: 0.1, y: 0.5 }, rect, VP);
    assert.ok(pt);
    assert.ok(pt.nx < 0);
  });

  it('returns null for zero-extent rect (element not visible)', () => {
    const rect: ContentRect = { left: 0, top: 0, width: 0, height: 400 };
    assert.strictEqual(screenToContent({ x: 0.5, y: 0.5 }, rect, VP), null);
  });

  it('returns null for zero-extent viewport', () => {
    const rect: ContentRect = { left: 0, top: 0, width: 400, height: 800 };
    assert.strictEqual(screenToContent({ x: 0.5, y: 0.5 }, rect, { width: 0, height: 800 }), null);
  });

  it('recovers a known scroll offset via the rect (getBoundingClientRect accounts for page scroll)', () => {
    // Page has scrolled 300 px down — element now sits at top = -100 (above fold).
    const rect: ContentRect = { left: 0, top: -100, width: 400, height: 800 };
    const pt = screenToContent({ x: 0.5, y: 0.0 }, rect, VP);
    // Gaze at y=0 (top of viewport) → CSS y=0; element top=-100 → y offset = 100.
    assert.ok(pt);
    assert.strictEqual(pt.y, 100);
    // Normalised: 100 / 800 = 0.125.
    assert.strictEqual(pt.ny, 0.125);
  });

  it('recovers a known CSS zoom via scaled rect dimensions', () => {
    // Browser zoom at 2×: element occupies twice as many CSS pixels on screen.
    // getBoundingClientRect reports the *layout* rect, which under CSS zoom is scaled.
    // (After CSS zoom 2× an element with CSS width 100 reports width 200 in the rect.)
    const rect: ContentRect = { left: 0, top: 0, width: 800, height: 1600 }; // 2× viewport
    const pt = screenToContent({ x: 0.5, y: 0.5 }, rect, VP);
    assert.ok(pt);
    // Gaze at viewport centre → CSS (200, 400); rect starts at (0,0) of size 800×1600.
    // nx = 200/800 = 0.25; ny = 400/1600 = 0.25.
    assert.strictEqual(pt.nx, 0.25);
    assert.strictEqual(pt.ny, 0.25);
  });
});

// applyElementScroll --------------------------------------------------------

describe('applyElementScroll', () => {
  it('adds scroll offset to the CSS-pixel position', () => {
    const pt = screenToContent({ x: 0.5, y: 0.5 }, { left: 0, top: 0, width: 400, height: 800 }, VP)!;
    const scrolled = applyElementScroll(pt, { scrollLeft: 50, scrollTop: 100 });
    assert.strictEqual(scrolled.x, 250); // 200 + 50
    assert.strictEqual(scrolled.y, 500); // 400 + 100
  });

  it('normalises to scroll extent when provided', () => {
    const pt = screenToContent({ x: 0.5, y: 0.5 }, { left: 0, top: 0, width: 400, height: 800 }, VP)!;
    // scrollLeft=200, scrollWidth=800 → total x = 200+200 = 400; nx = 400/800 = 0.5.
    const scrolled = applyElementScroll(
      pt,
      { scrollLeft: 200, scrollTop: 0 },
      { scrollWidth: 800, scrollHeight: 800 },
    );
    assert.strictEqual(scrolled.nx, 0.5);
  });

  it('falls back to rect-normalised nx/ny when scroll extent is absent', () => {
    const pt = screenToContent({ x: 0.5, y: 0.5 }, { left: 0, top: 0, width: 400, height: 800 }, VP)!;
    const scrolled = applyElementScroll(pt, { scrollLeft: 0, scrollTop: 0 });
    // Without scrollExtent, nx/ny are from the original point (rect-normalised).
    assert.strictEqual(scrolled.nx, pt.nx);
  });
});

// contentMappedFields -------------------------------------------------------

describe('contentMappedFields', () => {
  it('emits coordinates and available=true when mapping succeeded', () => {
    const pt = screenToContent({ x: 0.5, y: 0.5 }, { left: 0, top: 0, width: 400, height: 800 }, VP)!;
    const f = contentMappedFields(pt);
    assert.strictEqual(f.content_mapping_available, true);
    assert.strictEqual(f.content_x, 0.5);
    assert.strictEqual(f.content_y, 0.5);
  });

  it('emits only available=false (blank, not zero) when mapping unavailable', () => {
    const f = contentMappedFields(null);
    assert.strictEqual(f.content_mapping_available, false);
    assert.strictEqual(f.content_x, undefined);
    assert.strictEqual(f.content_y, undefined);
  });
});
