// Shared pointer -> AOI visit accumulation (076b/c/e). Generalises the logic the
// AOI dwell demo uses so the reading-passage, visual-search, and dwell-click demos
// reuse one implementation rather than copying it. Pointer position (content-space,
// 0-1 within the panel) is accumulated into content-space fixations per AOI and
// scored with the shared `aoiMetrics`. Pointer stands in for gaze (real screen gaze
// needs calibration, §6.2/§6.3).

import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { aoiMetrics, type Aoi, type AoiFixation } from '../lib/aoiMetrics';

interface OpenVisit {
  aoiId: string;
  entryMs: number;
  sumX: number;
  sumY: number;
  n: number;
}

export interface AoiVisits {
  panelRef: React.MutableRefObject<HTMLDivElement | null>;
  fixations: AoiFixation[];
  currentAoiId: string | null;
  metrics: ReturnType<typeof aoiMetrics>;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerLeave: () => void;
  reset: () => void;
}

export function useAoiVisits(aois: Aoi[]): AoiVisits {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const taskStartRef = useRef<number | null>(null);
  const closedRef = useRef<AoiFixation[]>([]);
  const openRef = useRef<OpenVisit | null>(null);

  const [fixations, setFixations] = useState<AoiFixation[]>([]);
  const [currentAoiId, setCurrentAoiId] = useState<string | null>(null);

  const toFixation = (v: OpenVisit, now: number): AoiFixation => ({
    content_x: v.sumX / v.n,
    content_y: v.sumY / v.n,
    durationMs: now - v.entryMs,
    onsetMs: v.entryMs - (taskStartRef.current ?? v.entryMs),
    content_mapping_available: true,
  });

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      const now = performance.now();
      if (taskStartRef.current === null) taskStartRef.current = now;
      const rect = panel.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width;
      const cy = (e.clientY - rect.top) / rect.height;
      const inside = cx >= 0 && cx <= 1 && cy >= 0 && cy <= 1;
      const aoi = inside
        ? aois.find((a) => cx >= a.x && cx <= a.x + a.width && cy >= a.y && cy <= a.y + a.height)
        : undefined;
      const aoiId = aoi?.id ?? null;

      const open = openRef.current;
      if (open && open.aoiId === aoiId && aoiId != null) {
        open.sumX += cx;
        open.sumY += cy;
        open.n += 1;
      } else {
        if (open) closedRef.current.push(toFixation(open, now));
        openRef.current = aoiId != null ? { aoiId, entryMs: now, sumX: cx, sumY: cy, n: 1 } : null;
      }
      setCurrentAoiId(aoiId);
      const list = [...closedRef.current];
      if (openRef.current) list.push(toFixation(openRef.current, now));
      setFixations(list);
    },
    [aois],
  );

  const onPointerLeave = useCallback(() => {
    const now = performance.now();
    if (openRef.current) {
      closedRef.current.push(toFixation(openRef.current, now));
      openRef.current = null;
    }
    setCurrentAoiId(null);
    setFixations([...closedRef.current]);
  }, []);

  const reset = useCallback(() => {
    closedRef.current = [];
    openRef.current = null;
    taskStartRef.current = null;
    setFixations([]);
    setCurrentAoiId(null);
  }, []);

  const metrics = useMemo(() => aoiMetrics(fixations, aois), [fixations, aois]);

  return { panelRef, fixations, currentAoiId, metrics, onPointerMove, onPointerLeave, reset };
}
