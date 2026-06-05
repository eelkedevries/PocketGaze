// Validation error-map geometry (specification §3.5, §6.3).
//
// Pure helpers that turn the held-out VALIDATION rows written by `035` into the
// inputs the metrics library (`034`) consumes, and compute the precision/BCEA
// ellipse drawn on the Step 5 error map. Kept framework-agnostic (no DOM) so the
// grouping and the covariance eigen-decomposition are unit-tested; the React/SVG
// rendering lives in `src/demos/step5.tsx`.

import type { QualityRow } from '../types/session';
import type { Point, TargetSamples, ValidationSample } from './validationMetrics';

export interface ValidationInputs {
  /** Per-target estimate clouds, for `perTargetMetrics` and the ellipses. */
  targets: TargetSamples[];
  /** Flat target/estimate pairs, for the overall `accuracy` summary. */
  pairs: ValidationSample[];
}

/**
 * Group the `quality` rows tagged `task_phase: 'validation'` (`035`) into metric
 * inputs. Rows missing the normalised target or a usable estimate are skipped
 * (blank ≠ 0, §4.1). Estimates are grouped by `target_id` (falling back to the
 * normalised target position when no id is present), preserving first-seen order.
 */
export function validationInputsFromRows(rows: readonly QualityRow[]): ValidationInputs {
  const byTarget = new Map<string, TargetSamples>();
  const order: string[] = [];
  const pairs: ValidationSample[] = [];
  for (const r of rows) {
    if (r.task_phase !== 'validation') continue;
    if (r.target_nx == null || r.target_ny == null) continue;
    if (r.gaze_available !== true || r.gaze_x_raw == null || r.gaze_y_raw == null) continue;
    const target: Point = { x: r.target_nx, y: r.target_ny };
    const estimate: Point = { x: r.gaze_x_raw, y: r.gaze_y_raw };
    pairs.push({ target, estimate });
    const key = r.target_id ?? `${r.target_nx},${r.target_ny}`;
    const existing = byTarget.get(key);
    if (existing) {
      existing.estimates.push(estimate);
    } else {
      byTarget.set(key, { target, estimates: [estimate] });
      order.push(key);
    }
  }
  return { targets: order.map((k) => byTarget.get(k)!), pairs };
}

/** A precision/BCEA ellipse in normalised screen units. */
export interface Ellipse {
  /** Centre (the estimate centroid). */
  cx: number;
  cy: number;
  /** Semi-axis lengths (major `rx`, minor `ry`). */
  rx: number;
  ry: number;
  /** Rotation of the major axis, in degrees (SVG convention, +y downward). */
  angleDeg: number;
}

/**
 * The precision / BCEA ellipse for an estimate cloud at confidence `p` (default
 * 0.68): centred on the mean, axes along the eigenvectors of the population
 * covariance, with semi-axis lengths √(2k·λ) where k = −ln(1 − p). Its area
 * π·rx·ry equals `bcea(points, p)` from `034`, so the drawn ellipse and the
 * reported BCEA agree.
 *
 * Degenerate clouds (fewer than two samples, or zero spread) yield a zero-size
 * ellipse — finite, never NaN.
 */
export function precisionEllipse(points: Point[], p = 0.68): Ellipse {
  const n = points.length;
  if (n === 0) return { cx: 0, cy: 0, rx: 0, ry: 0, angleDeg: 0 };
  let mx = 0;
  let my = 0;
  for (const q of points) {
    mx += q.x;
    my += q.y;
  }
  mx /= n;
  my /= n;
  if (n < 2) return { cx: mx, cy: my, rx: 0, ry: 0, angleDeg: 0 };

  let vx = 0;
  let vy = 0;
  let cxy = 0;
  for (const q of points) {
    const dx = q.x - mx;
    const dy = q.y - my;
    vx += dx * dx;
    vy += dy * dy;
    cxy += dx * dy;
  }
  vx /= n;
  vy /= n;
  cxy /= n;

  // Eigenvalues of the symmetric covariance [[vx, cxy], [cxy, vy]].
  const tr = vx + vy;
  const det = vx * vy - cxy * cxy;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc; // major
  const l2 = Math.max(0, tr / 2 - disc); // minor (clamp tiny negatives)

  const s = 2 * -Math.log(1 - p);
  const rx = Math.sqrt(s * l1);
  const ry = Math.sqrt(s * l2);
  // Major-eigenvector direction: (cxy, l1 − vx); handles the diagonal case too.
  const angleDeg = (Math.atan2(l1 - vx, cxy) * 180) / Math.PI;
  return { cx: mx, cy: my, rx, ry, angleDeg };
}
