import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  placeDots,
  safeMarginPx,
  DEFAULT_CALIBRATION_DOTS,
  type ViewportSize,
} from './calibrationLayout.ts';

const phone: ViewportSize = { width: 390, height: 844 };

describe('safeMarginPx', () => {
  it('uses the fraction of the smaller dimension when it exceeds the minimum', () => {
    // 8% of 390 = 31.2 > 28 minimum.
    assert.ok(Math.abs(safeMarginPx(phone) - 31.2) < 1e-9);
  });

  it('falls back to the minimum on tiny viewports', () => {
    assert.equal(safeMarginPx({ width: 200, height: 200 }, 28, 0.08), 28); // 16 < 28
  });
});

describe('placeDots', () => {
  it('keeps every dot within the safe margins', () => {
    const margin = safeMarginPx(phone);
    const placed = placeDots(DEFAULT_CALIBRATION_DOTS, phone);
    assert.equal(placed.length, 9);
    for (const d of placed) {
      assert.ok(d.px >= margin - 1e-9 && d.px <= phone.width - margin + 1e-9, `px ${d.px}`);
      assert.ok(d.py >= margin - 1e-9 && d.py <= phone.height - margin + 1e-9, `py ${d.py}`);
    }
  });

  it('maps grid corners to the margin box and centre to the middle', () => {
    const margin = 30;
    const placed = placeDots(DEFAULT_CALIBRATION_DOTS, { width: 400, height: 800 }, margin);
    const tl = placed.find((d) => d.id === 'tl')!;
    const br = placed.find((d) => d.id === 'br')!;
    const mc = placed.find((d) => d.id === 'mc')!;
    assert.deepEqual([tl.px, tl.py], [30, 30]);
    assert.deepEqual([br.px, br.py], [370, 770]);
    assert.deepEqual([mc.px, mc.py], [200, 400]);
  });

  it('derives normalised coordinates from the CSS-pixel positions', () => {
    const placed = placeDots(DEFAULT_CALIBRATION_DOTS, { width: 400, height: 800 }, 30);
    const mc = placed.find((d) => d.id === 'mc')!;
    assert.ok(Math.abs(mc.nx - 0.5) < 1e-9);
    assert.ok(Math.abs(mc.ny - 0.5) < 1e-9);
  });
});
