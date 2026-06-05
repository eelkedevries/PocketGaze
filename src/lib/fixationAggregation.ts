// Fixation aggregation: scanpath and heatmap density (specification §3.6, §3.7,
// §6.3).
//
// Aggregates detected FIXATION candidates into the data structures behind the two
// iconic gaze visualisations: an ordered, duration-weighted SCANPATH (where the
// gaze went, in order, and for how long) and a HEATMAP density field (where it
// dwelt most). Pure and deterministic over supplied fixations — no rendering, no
// DOM — so it is fully unit-testable. Rendering and the over-interpretation
// caveat are `044`. Coordinates are normalised screen units (0–1).

export interface Fixation {
  /** Fixation centre, normalised screen coordinates (0–1). */
  x: number;
  y: number;
  /** Fixation duration, ms. */
  durationMs: number;
}

export interface ScanpathNode extends Fixation {
  /** Zero-based order of this fixation in the scanpath. */
  order: number;
}

export interface ScanpathSegment {
  from: ScanpathNode;
  to: ScanpathNode;
  /** Straight-line length between the two nodes (normalised units). */
  length: number;
}

export interface Scanpath {
  nodes: ScanpathNode[];
  /** Inter-node saccade segments (n − 1 of them). */
  segments: ScanpathSegment[];
  totalDwellMs: number;
}

/** Total dwell across fixations (ms). */
export function totalDwellMs(fixations: readonly Fixation[]): number {
  let s = 0;
  for (const f of fixations) s += f.durationMs;
  return s;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Bounding box of the fixation centres, or null for empty input. */
export function fixationBounds(fixations: readonly Fixation[]): Bounds | null {
  if (fixations.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const f of fixations) {
    minX = Math.min(minX, f.x);
    maxX = Math.max(maxX, f.x);
    minY = Math.min(minY, f.y);
    maxY = Math.max(maxY, f.y);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Build an ordered, duration-carrying scanpath plus its inter-node segments.
 * Order and durations are preserved exactly. Empty input returns empty arrays.
 */
export function scanpath(fixations: readonly Fixation[]): Scanpath {
  const nodes: ScanpathNode[] = fixations.map((f, i) => ({
    x: f.x,
    y: f.y,
    durationMs: f.durationMs,
    order: i,
  }));
  const segments: ScanpathSegment[] = [];
  for (let i = 1; i < nodes.length; i++) {
    const from = nodes[i - 1];
    const to = nodes[i];
    segments.push({ from, to, length: Math.hypot(to.x - from.x, to.y - from.y) });
  }
  return { nodes, segments, totalDwellMs: totalDwellMs(fixations) };
}

export type HeatmapWeight = 'duration' | 'count';

export interface HeatmapGrid {
  width: number;
  height: number;
  /** Row-major density values, normalised to [0, 1] by the peak cell. */
  values: number[];
  /** Peak density before normalisation (0 when empty). */
  max: number;
}

/**
 * Accumulate fixations into a normalised density grid via a documented Gaussian
 * splat. Each fixation contributes `exp(−d²/(2σ²)) · w` to every cell, where `d`
 * is the distance (normalised units) from the fixation to the cell centre and
 * `w` is the fixation duration (`'duration'`) or 1 (`'count'`). `sigma` is the
 * Gaussian spread in normalised units. The grid is normalised to [0, 1] by its
 * peak cell; empty input (or non-positive grid/sigma) returns an all-zero grid.
 */
export function heatmap(
  fixations: readonly Fixation[],
  grid: { width: number; height: number },
  sigma: number,
  weight: HeatmapWeight = 'duration',
): HeatmapGrid {
  const width = Math.max(0, Math.floor(grid.width));
  const height = Math.max(0, Math.floor(grid.height));
  const values = new Array<number>(width * height).fill(0);
  if (width === 0 || height === 0 || !(sigma > 0) || fixations.length === 0) {
    return { width, height, values, max: 0 };
  }
  const twoSigmaSq = 2 * sigma * sigma;
  for (let row = 0; row < height; row++) {
    const cy = (row + 0.5) / height;
    for (let col = 0; col < width; col++) {
      const cx = (col + 0.5) / width;
      let acc = 0;
      for (const f of fixations) {
        const w = weight === 'duration' ? f.durationMs : 1;
        const dx = cx - f.x;
        const dy = cy - f.y;
        acc += w * Math.exp(-(dx * dx + dy * dy) / twoSigmaSq);
      }
      values[row * width + col] = acc;
    }
  }
  let max = 0;
  for (const v of values) max = Math.max(max, v);
  if (max > 0) {
    for (let i = 0; i < values.length; i++) values[i] /= max;
  }
  return { width, height, values, max };
}
