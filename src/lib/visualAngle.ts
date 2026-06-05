// Visual-angle (IPD-based) estimation (specification §3.3, §3.4, §6.3).
//
// Eye tracking is expressed in DEGREES OF VISUAL ANGLE, but a browser cannot read
// the camera's physical pixel pitch or the true viewing distance. This module
// turns the inter-ocular separation measured in the image (in pixels), an assumed
// mean inter-pupillary distance (~63 mm), and an approximate camera horizontal
// field of view into an ESTIMATE of viewing distance and an angular scale.
//
// Every output is an estimate built on stated assumptions (§6.3): a selfie camera
// can only approximate dva. Pure and framework-agnostic (no DOM), so the maths is
// unit-tested. This module does NOT write to the session model (`039`) or render
// degrees (`040`).

const DEG = 180 / Math.PI;

/** Assumed mean inter-pupillary distance, mm (population average). */
export const DEFAULT_ASSUMED_IPD_MM = 63;

/** Documented default camera horizontal field of view, degrees (typical selfie cam). */
export const DEFAULT_HFOV_DEG = 60;

/** Documented default CSS-pixel pitch, mm — the 96 CSS-ppi reference (25.4 / 96). */
export const DEFAULT_CSS_PX_PITCH_MM = 25.4 / 96;

/** Documented default screen dimension spanned by one normalised unit, mm (typical phone width). */
export const DEFAULT_SCREEN_DIM_MM = 70;

/** Documented fallback viewing distance, mm, used when inputs are degenerate. */
export const FALLBACK_DISTANCE_MM = 350;

export interface ViewingDistanceInput {
  /** Inter-ocular separation measured in the image, pixels. */
  iod_px: number;
  /** Image (frame) width, pixels. */
  image_width_px: number;
  /** Assumed real inter-pupillary distance, mm. */
  assumed_ipd_mm?: number;
  /** Assumed camera horizontal field of view, degrees. */
  hfov_deg?: number;
}

/**
 * Estimate viewing distance (mm) from the image inter-ocular separation using the
 * pinhole relation. The focal length in pixels is
 *   f_px = image_width_px / (2·tan(hfov/2)),
 * and similar triangles give
 *   distance = f_px · assumed_ipd_mm / iod_px.
 *
 * Degenerate inputs (non-positive IOD or image width, or a degenerate FOV) return
 * the documented `FALLBACK_DISTANCE_MM` — finite, never NaN.
 */
export function estimateViewingDistanceMm(input: ViewingDistanceInput): number {
  const ipd = input.assumed_ipd_mm ?? DEFAULT_ASSUMED_IPD_MM;
  const hfov = input.hfov_deg ?? DEFAULT_HFOV_DEG;
  if (
    !(input.iod_px > 0) ||
    !(input.image_width_px > 0) ||
    !(hfov > 0 && hfov < 180) ||
    !(ipd > 0)
  ) {
    return FALLBACK_DISTANCE_MM;
  }
  const focalPx = input.image_width_px / (2 * Math.tan((hfov / 2) / DEG));
  return (focalPx * ipd) / input.iod_px;
}

/**
 * Degrees of visual angle subtended by one screen pixel at `distance_mm`, given
 * an assumed physical pixel pitch (mm). The pitch defaults to the 96 CSS-ppi
 * reference because the true device pitch is unknown in the browser (an explicit
 * assumption, §6.3). Non-positive distance falls back to `FALLBACK_DISTANCE_MM`.
 */
export function degreesPerPixel(distance_mm: number, px_pitch_mm = DEFAULT_CSS_PX_PITCH_MM): number {
  const d = distance_mm > 0 ? distance_mm : FALLBACK_DISTANCE_MM;
  return 2 * Math.atan(px_pitch_mm / 2 / d) * DEG;
}

/**
 * Degrees of visual angle spanned by one NORMALISED screen unit (a full screen
 * dimension) at `distance_mm`, given an assumed screen dimension (mm). The
 * dimension defaults to a typical phone width because it is unknown in the
 * browser (an explicit assumption, §6.3). Non-positive distance falls back.
 */
export function degreesPerNormalised(
  distance_mm: number,
  screen_dim_mm = DEFAULT_SCREEN_DIM_MM,
): number {
  const d = distance_mm > 0 ? distance_mm : FALLBACK_DISTANCE_MM;
  return 2 * Math.atan(screen_dim_mm / 2 / d) * DEG;
}

export interface AngularScaleInput extends ViewingDistanceInput {
  /** Assumed physical pixel pitch, mm (default: 96 CSS-ppi reference). */
  px_pitch_mm?: number;
  /** Assumed screen dimension spanned by one normalised unit, mm. */
  screen_dim_mm?: number;
}

export interface AngularScaleAssumptions {
  assumed_ipd_mm: number;
  hfov_deg: number;
  px_pitch_mm: number;
  screen_dim_mm: number;
  /** True when the viewing distance fell back (degenerate IOD/image width). */
  distance_is_fallback: boolean;
}

export interface AngularScale {
  /** Estimated viewing distance, mm. */
  viewing_distance_mm: number;
  /** Degrees of visual angle per screen pixel. */
  degrees_per_pixel: number;
  /** Degrees of visual angle per normalised screen unit. */
  degrees_per_normalised: number;
  /** Always true: these are estimates built on the recorded assumptions (§6.3). */
  is_estimate: true;
  assumptions: AngularScaleAssumptions;
}

/**
 * Estimate the viewing distance and the angular conversion factors in one call,
 * returning the factors alongside the assumptions they rest on and an
 * `is_estimate: true` flag so callers cannot present them as measured (§6.3).
 */
export function estimateAngularScale(input: AngularScaleInput): AngularScale {
  const assumed_ipd_mm = input.assumed_ipd_mm ?? DEFAULT_ASSUMED_IPD_MM;
  const hfov_deg = input.hfov_deg ?? DEFAULT_HFOV_DEG;
  const px_pitch_mm = input.px_pitch_mm ?? DEFAULT_CSS_PX_PITCH_MM;
  const screen_dim_mm = input.screen_dim_mm ?? DEFAULT_SCREEN_DIM_MM;

  const viewing_distance_mm = estimateViewingDistanceMm({
    iod_px: input.iod_px,
    image_width_px: input.image_width_px,
    assumed_ipd_mm,
    hfov_deg,
  });
  const distance_is_fallback = viewing_distance_mm === FALLBACK_DISTANCE_MM;

  return {
    viewing_distance_mm,
    degrees_per_pixel: degreesPerPixel(viewing_distance_mm, px_pitch_mm),
    degrees_per_normalised: degreesPerNormalised(viewing_distance_mm, screen_dim_mm),
    is_estimate: true,
    assumptions: { assumed_ipd_mm, hfov_deg, px_pitch_mm, screen_dim_mm, distance_is_fallback },
  };
}
