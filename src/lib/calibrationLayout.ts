// Follow-the-dots calibration layout (specification §3.5, §2.8).
//
// Pure geometry for placing calibration targets within a viewport, keeping a
// safe margin from the edges and a phone-suitable target size. No DOM, so it is
// unit-testable; the React task component (`calibrationTask.tsx`) renders these
// positions and captures the concurrent eye-local signal at each.

export interface ViewportSize {
  width: number;
  height: number;
}

/** A calibration target on the normalised grid (0–1, before margins). */
export interface CalibrationDot {
  id: string;
  /** Grid fraction across the usable area (0 = left/top, 1 = right/bottom). */
  fx: number;
  fy: number;
}

/** A calibration target placed in a concrete viewport. */
export interface PlacedDot extends CalibrationDot {
  /** Position in CSS pixels. */
  px: number;
  py: number;
  /** Position in normalised screen coordinates (0–1), including margins. */
  nx: number;
  ny: number;
}

/** A 3×3 grid: corners, edge midpoints, and centre — a common 9-point set. */
export const DEFAULT_CALIBRATION_DOTS: CalibrationDot[] = [
  { id: 'tl', fx: 0, fy: 0 },
  { id: 'tc', fx: 0.5, fy: 0 },
  { id: 'tr', fx: 1, fy: 0 },
  { id: 'ml', fx: 0, fy: 0.5 },
  { id: 'mc', fx: 0.5, fy: 0.5 },
  { id: 'mr', fx: 1, fy: 0.5 },
  { id: 'bl', fx: 0, fy: 1 },
  { id: 'bc', fx: 0.5, fy: 1 },
  { id: 'br', fx: 1, fy: 1 },
];

/** Recommended target diameter (CSS px) — comfortably tappable/fixatable on phones. */
export const CALIBRATION_TARGET_PX = 28;

/**
 * Safe margin (CSS px) for the given viewport: at least `minPx`, growing to a
 * fraction of the smaller dimension so corner dots never sit under the edge,
 * notch, or rounded corners on phones.
 */
export function safeMarginPx(viewport: ViewportSize, minPx = 28, fraction = 0.08): number {
  return Math.max(minPx, Math.min(viewport.width, viewport.height) * fraction);
}

/**
 * Place dots within the viewport, mapping each grid fraction into the usable
 * area `[margin, size - margin]`. Returns CSS-pixel and normalised positions.
 */
export function placeDots(
  dots: CalibrationDot[],
  viewport: ViewportSize,
  margin = safeMarginPx(viewport),
): PlacedDot[] {
  const usableW = Math.max(0, viewport.width - 2 * margin);
  const usableH = Math.max(0, viewport.height - 2 * margin);
  return dots.map((dot) => {
    const px = margin + dot.fx * usableW;
    const py = margin + dot.fy * usableH;
    return {
      ...dot,
      px,
      py,
      nx: viewport.width > 0 ? px / viewport.width : 0,
      ny: viewport.height > 0 ? py / viewport.height : 0,
    };
  });
}
