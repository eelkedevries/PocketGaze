import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateViewingDistanceMm,
  degreesPerPixel,
  degreesPerNormalised,
  estimateAngularScale,
  FALLBACK_DISTANCE_MM,
  DEFAULT_ASSUMED_IPD_MM,
} from './visualAngle.ts';

describe('estimateViewingDistanceMm', () => {
  it('matches a hand-computed pinhole distance', () => {
    // hfov 90deg -> tan(45) = 1 -> f_px = 2000 / (2*1) = 1000.
    // distance = f_px * ipd / iod = 1000 * 63 / 125 = 504 mm.
    const d = estimateViewingDistanceMm({
      iod_px: 125,
      image_width_px: 2000,
      assumed_ipd_mm: 63,
      hfov_deg: 90,
    });
    assert.ok(Math.abs(d - 504) < 1e-6, `distance=${d}`);
  });

  it('is monotonic: a larger image IOD means a closer (smaller) distance', () => {
    const near = estimateViewingDistanceMm({ iod_px: 200, image_width_px: 2000 });
    const far = estimateViewingDistanceMm({ iod_px: 100, image_width_px: 2000 });
    assert.ok(near < far);
  });

  it('falls back to a documented finite distance for degenerate inputs', () => {
    assert.equal(estimateViewingDistanceMm({ iod_px: 0, image_width_px: 2000 }), FALLBACK_DISTANCE_MM);
    assert.equal(estimateViewingDistanceMm({ iod_px: 100, image_width_px: 0 }), FALLBACK_DISTANCE_MM);
    assert.ok(Number.isFinite(estimateViewingDistanceMm({ iod_px: 0, image_width_px: 0 })));
  });
});

describe('degreesPerPixel / degreesPerNormalised', () => {
  it('decrease monotonically as viewing distance grows', () => {
    assert.ok(degreesPerPixel(300) > degreesPerPixel(600));
    assert.ok(degreesPerNormalised(300) > degreesPerNormalised(600));
  });

  it('a full normalised unit subtends far more than a single pixel', () => {
    assert.ok(degreesPerNormalised(500) > degreesPerPixel(500));
  });

  it('guards non-positive distance with the fallback (finite, not NaN)', () => {
    assert.ok(Number.isFinite(degreesPerPixel(0)));
    assert.equal(degreesPerPixel(0), degreesPerPixel(FALLBACK_DISTANCE_MM));
  });
});

describe('estimateAngularScale', () => {
  it('returns distance, factors, the is_estimate flag and assumptions', () => {
    const s = estimateAngularScale({ iod_px: 125, image_width_px: 2000, hfov_deg: 90 });
    assert.ok(Math.abs(s.viewing_distance_mm - 504) < 1e-6);
    assert.equal(s.is_estimate, true);
    assert.equal(s.assumptions.assumed_ipd_mm, DEFAULT_ASSUMED_IPD_MM);
    assert.equal(s.assumptions.hfov_deg, 90);
    assert.equal(s.assumptions.distance_is_fallback, false);
    assert.ok(s.degrees_per_pixel > 0);
    assert.ok(s.degrees_per_normalised > s.degrees_per_pixel);
  });

  it('flags the fallback distance in the assumptions for degenerate inputs', () => {
    const s = estimateAngularScale({ iod_px: 0, image_width_px: 0 });
    assert.equal(s.viewing_distance_mm, FALLBACK_DISTANCE_MM);
    assert.equal(s.assumptions.distance_is_fallback, true);
    assert.equal(s.is_estimate, true);
  });
});
