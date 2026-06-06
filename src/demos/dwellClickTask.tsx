// Dwell-click interaction demo (076e). Resting the pointer (a clearly-labelled gaze
// stand-in) on a target for a dwell threshold "selects" it — the classic gaze-input
// interaction. A progress ring shows the accumulating continuous dwell. No accuracy
// is claimed: this is a pointer stand-in, and dwell selection deliberately needs the
// pointer only to stay roughly within a generous target (§6.2/§6.3).

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Aoi } from '../lib/aoiMetrics';

const DWELL_MS = 900;

const TARGETS: Aoi[] = [
  { id: 'Yes', x: 0.05, y: 0.3, width: 0.26, height: 0.4 },
  { id: 'No', x: 0.37, y: 0.3, width: 0.26, height: 0.4 },
  { id: 'Maybe', x: 0.69, y: 0.3, width: 0.26, height: 0.4 },
];

function hitTest(cx: number, cy: number): string | null {
  if (cx < 0 || cx > 1 || cy < 0 || cy > 1) return null;
  const a = TARGETS.find((t) => cx >= t.x && cx <= t.x + t.width && cy >= t.y && cy <= t.y + t.height);
  return a?.id ?? null;
}

export default function DwellClickTask() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<string | null>(null);
  const entryRef = useRef<number>(0);
  const selectedRef = useRef<string | null>(null);
  const armedRef = useRef(true);

  const [currentAoiId, setCurrentAoiId] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0); // 0-1
  const [selected, setSelected] = useState<string | null>(null);
  const [armed, setArmed] = useState(true);

  // Keep an "armed" ref in sync so the rAF loop reads the latest value.
  useEffect(() => {
    armedRef.current = armed;
  }, [armed]);

  // rAF loop drives the continuous-dwell progress and the selection trigger.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const cur = currentRef.current;
      if (cur && armedRef.current) {
        const held = performance.now() - entryRef.current;
        const p = Math.min(1, held / DWELL_MS);
        setDwellProgress(p);
        if (p >= 1 && selectedRef.current !== cur) {
          selectedRef.current = cur;
          setSelected(cur);
          setArmed(false); // require leaving the target before re-selecting
        }
      } else {
        setDwellProgress(0);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerMove = (e: ReactPointerEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    const id = hitTest(cx, cy);
    if (id !== currentRef.current) {
      currentRef.current = id;
      entryRef.current = performance.now();
      setCurrentAoiId(id);
      if (id === null) setArmed(true); // re-arm once the pointer leaves all targets
    }
  };

  const onPointerLeave = () => {
    currentRef.current = null;
    setCurrentAoiId(null);
    setArmed(true);
    setDwellProgress(0);
  };

  return (
    <div className="aoi">
      <p className="timing-demo__note">
        Rest the pointer (a gaze stand-in) on a button for ~{DWELL_MS} ms to select it — dwell-to-click,
        the standard gaze interaction. Targets are deliberately large; this shows the interaction, not
        pointing accuracy (§6.3).
      </p>

      <div className="aoi__controls">
        <span className="demo-input-mode demo-input-mode--pointer">
          Input mode: pointer (simulated gaze)
        </span>
        <span className="calibration__progress" aria-live="polite">
          {selected ? `Selected: ${selected}` : currentAoiId ? `Dwelling on ${currentAoiId}…` : 'Hover a button.'}
        </span>
      </div>

      <div
        className="aoi__panel dwell-panel"
        ref={panelRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {TARGETS.map((t) => {
          const active = currentAoiId === t.id;
          const isSelected = selected === t.id;
          return (
            <div
              key={t.id}
              className={`dwell-target${active ? ' dwell-target--active' : ''}${
                isSelected ? ' dwell-target--selected' : ''
              }`}
              style={{
                left: `${t.x * 100}%`,
                top: `${t.y * 100}%`,
                width: `${t.width * 100}%`,
                height: `${t.height * 100}%`,
              }}
            >
              <span>{t.id}</span>
              {active && armed && (
                <span className="dwell-target__bar" style={{ width: `${dwellProgress * 100}%` }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
