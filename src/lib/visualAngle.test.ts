import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateViewingDistanceMm,
  degreesPerPixel,
  degreesPerNormalised,
  estimateAngularScale,
  iodPixels,
  translationToApproxMm,
  meanDegreesPerNormalised,
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

describe('iodPixels', () => {
  it('de-normalises the horizontal separation by image width', () => {
    const iod = iodPixels({ x: 0.6, y: 0.5 }, { x: 0.4, y: 0.5 }, 1000, 1000);
    assert.ok(Math.abs(iod - 200) < 1e-9);
  });

  it('combines x and y components by image dimensions', () => {
    const iod = iodPixels({ x: 0.5, y: 0.6 }, { x: 0.5, y: 0.5 }, 800, 600);
    assert.ok(Math.abs(iod - 60) < 1e-9); // 0.1 * 600
  });
});

describe('translationToApproxMm', () => {
  it('anchors |tz| to the viewing distance and scales laterals by the same factor', () => {
    const mm = translationToApproxMm({ tx: 0.5, ty: -0.5, tz: -2 }, 600);
    assert.ok(mm);
    assert.ok(Math.abs(mm!.tz_mm + 600) < 1e-9); // sign preserved, magnitude = distance
    assert.ok(Math.abs(mm!.tx_mm - 150) < 1e-9); // 0.5 * (600/2)
    assert.ok(Math.abs(mm!.ty_mm + 150) < 1e-9);
  });

  it('returns null for a degenerate depth or non-positive distance', () => {
    assert.equal(translationToApproxMm({ tx: 1, ty: 1, tz: 0 }, 600), null);
    assert.equal(translationToApproxMm({ tx: 1, ty: 1, tz: 2 }, 0), null);
  });
});

describe('meanDegreesPerNormalised', () => {
  it('averages the x/y factors across samples that carry a scale', () => {
    const samples = [
      { deg_per_norm_x: 8, deg_per_norm_y: 12 }, // mean 10
      { deg_per_norm_x: 10, deg_per_norm_y: 10 }, // mean 10
      { face_quality: 0 }, // no scale -> skipped
    ];
    assert.equal(meanDegreesPerNormalised(samples), 10);
  });

  it('returns null when no sample carries an angular scale', () => {
    assert.equal(meanDegreesPerNormalised([{}, { deg_per_norm_x: 5 }]), null);
  });
});
