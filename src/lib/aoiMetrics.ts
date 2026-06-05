// Area-of-interest (AOI) dwell metrics (specification §3.7, §6.2, §6.3, §4).
//
// Closes the loop from "where on the content" (Step 7 content mapping, `029`) to
// the standard reading/UX deliverables: per-AOI DWELL TIME, FIXATION COUNT, and
// TIME-TO-FIRST-FIXATION (TTFF). Pure over supplied content-mapped fixations and
// AOI rectangles, so it is fully unit-testable. These are candidate measures over
// an approximate gaze signal, never validated attention (§6.3); the demo/overlay
// is `046`.

/** A named area of interest, a rectangle in CONTENT-relative coordinates. */
export interface Aoi {
  id: string;
  /** Top-left corner and size in content coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A fixation in content space, with onset for TTFF and a mapping-availability flag. */
export interface AoiFixation {
  content_x: number;
  content_y: number;
  /** Fixation duration, ms. */
  durationMs: number;
  /** Fixation onset relative to task start, ms (used for TTFF). */
  onsetMs: number;
  /**
   * Whether the content mapping was available for this fixation (§4). When
   * false, the fixation is treated as UNASSIGNED (blank ≠ a real position).
   * Defaults to true when omitted.
   */
  content_mapping_available?: boolean;
}

/** True when a content coordinate lies within an AOI rectangle (inclusive edges). */
export function aoiContains(aoi: Aoi, x: number, y: number): boolean {
  return x >= aoi.x && x <= aoi.x + aoi.width && y >= aoi.y && y <= aoi.y + aoi.height;
}

/**
 * Assign each fixation to the FIRST AOI (in array order) that contains its
 * content coordinate, returning an array of AOI ids aligned with `fixations`
 * (null when unassigned). Overlap handling is documented as first-match-wins, so
 * AOI order is significant. Fixations with `content_mapping_available === false`
 * are left unassigned (null).
 */
export function assignFixationsToAois(
  fixations: readonly AoiFixation[],
  aois: readonly Aoi[],
): Array<string | null> {
  return fixations.map((f) => {
    if (f.content_mapping_available === false) return null;
    const hit = aois.find((a) => aoiContains(a, f.content_x, f.content_y));
    return hit ? hit.id : null;
  });
}

export interface AoiResult {
  id: string;
  /** Total dwell across fixations assigned to this AOI, ms. */
  dwellMs: number;
  fixationCount: number;
  /** Onset of the earliest fixation assigned to this AOI, ms; null if none. */
  ttffMs: number | null;
}

export interface AoiMetricsSummary {
  perAoi: AoiResult[];
  /** Dwell assigned to any AOI, ms. */
  totalDwellMs: number;
  /** Number of fixations assigned to any AOI. */
  totalFixations: number;
  /** Fixations not assigned to any AOI (out-of-AOI or unmapped). */
  unassignedCount: number;
}

/**
 * Per-AOI dwell, fixation count, and TTFF (relative to task start), plus totals.
 * Each fixation is assigned to at most one AOI (first match). Empty inputs return
 * documented zeros and null TTFFs.
 */
export function aoiMetrics(
  fixations: readonly AoiFixation[],
  aois: readonly Aoi[],
): AoiMetricsSummary {
  const assignment = assignFixationsToAois(fixations, aois);
  const perAoi: AoiResult[] = aois.map((a) => ({
    id: a.id,
    dwellMs: 0,
    fixationCount: 0,
    ttffMs: null,
  }));
  const indexById = new Map(perAoi.map((r, i) => [r.id, i]));

  let totalDwellMs = 0;
  let totalFixations = 0;
  let unassignedCount = 0;

  fixations.forEach((f, i) => {
    const aoiId = assignment[i];
    if (aoiId == null) {
      unassignedCount += 1;
      return;
    }
    const r = perAoi[indexById.get(aoiId)!];
    r.dwellMs += f.durationMs;
    r.fixationCount += 1;
    r.ttffMs = r.ttffMs == null ? f.onsetMs : Math.min(r.ttffMs, f.onsetMs);
    totalDwellMs += f.durationMs;
    totalFixations += 1;
  });

  return { perAoi, totalDwellMs, totalFixations, unassignedCount };
}
