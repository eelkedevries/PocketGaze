import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ContentMapper, type ContentRect } from '../lib/contentCoordinates';
import { StimulusLogger } from '../lib/stimulusLog';
import { SessionStore } from '../lib/sessionStore';
import type { ContentMappedFields, StimulusRow } from '../types/session';
import type { StepDemo } from './registry';

// Step 7 live demo: contrast SCREEN coordinates with CONTENT-relative
// coordinates for content that scrolls and zooms (specification §3.7, §6.2,
// §2.5, §2.6). A pointer position stands in for a gaze point (real screen gaze
// needs calibration, §6.2) so the screen↔content distinction is visible without
// the camera: the same content target keeps a fixed content coordinate while its
// screen coordinate changes under scroll/zoom — the "screen coordinates can
// mislead" point made concrete.
//
// Reuses the content-mapping maths (029) via ContentMapper and the
// stimulus/viewport logging (028) via StimulusLogger; this demo owns no new
// coordinate logic.

// The fixed content target's position, normalised within the scrollable content.
const TARGET_CONTENT_X = 0.5;
const TARGET_CONTENT_Y = 0.62;

interface ScreenPoint {
  /** Normalised within the viewport (0-1). */
  nx: number;
  ny: number;
  /** CSS pixels, viewport top-left origin. */
  cssX: number;
  cssY: number;
}

interface TransformLogEntry {
  timeMs: number;
  kind: 'scroll' | 'zoom' | 'resize';
  detail: string;
}

interface Step7DemoContextValue {
  store: SessionStore;
  zoom: number;
  setZoom: (z: number) => void;
  pointer: ScreenPoint | null;
  content: ContentMappedFields | null;
  targetScreen: ScreenPoint | null;
  viewport: { width: number; height: number };
  containerRect: ContentRect | null;
  scroll: { scrollLeft: number; scrollTop: number };
  transformLog: TransformLogEntry[];
  stimulusRows: readonly StimulusRow[];
  registerContainer: (el: HTMLDivElement | null) => void;
  registerTarget: (el: HTMLDivElement | null) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerLeave: () => void;
  onScroll: () => void;
}

const Step7DemoContext = createContext<Step7DemoContextValue | undefined>(undefined);

function useStep7Demo(): Step7DemoContextValue {
  const ctx = useContext(Step7DemoContext);
  if (ctx === undefined) {
    throw new Error('Step 7 demo components must be used within Step7DemoProvider');
  }
  return ctx;
}

function readViewport(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

function Step7DemoProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SessionStore | null>(null);
  if (storeRef.current === null) storeRef.current = new SessionStore();
  const store = storeRef.current;

  const loggerRef = useRef<StimulusLogger | null>(null);
  if (loggerRef.current === null) loggerRef.current = new StimulusLogger(store);
  const logger = loggerRef.current;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const mapperRef = useRef<ContentMapper | null>(null);

  const [zoom, setZoomState] = useState(1);
  const [pointer, setPointer] = useState<ScreenPoint | null>(null);
  const [content, setContent] = useState<ContentMappedFields | null>(null);
  const [targetScreen, setTargetScreen] = useState<ScreenPoint | null>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() =>
    typeof window !== 'undefined' ? readViewport() : { width: 0, height: 0 },
  );
  const [containerRect, setContainerRect] = useState<ContentRect | null>(null);
  const [scroll, setScroll] = useState({ scrollLeft: 0, scrollTop: 0 });
  const [transformLog, setTransformLog] = useState<TransformLogEntry[]>([]);
  const [stimulusRows, setStimulusRows] = useState<readonly StimulusRow[]>([]);

  const pushLog = useCallback(
    (kind: TransformLogEntry['kind'], detail: string) => {
      setTransformLog((prev) => [...prev, { timeMs: store.elapsedMs(), kind, detail }].slice(-8));
    },
    [store],
  );

  // Recompute the fixed target's current screen position and viewport/rect
  // snapshots — these change with scroll, zoom, and resize.
  const recomputeTarget = useCallback(() => {
    const vp = readViewport();
    setViewport(vp);
    const container = containerRef.current;
    if (container) {
      const r = container.getBoundingClientRect();
      setContainerRect({ left: r.left, top: r.top, width: r.width, height: r.height });
      setScroll({ scrollLeft: container.scrollLeft, scrollTop: container.scrollTop });
    }
    const target = targetRef.current;
    if (target && vp.width > 0 && vp.height > 0) {
      const r = target.getBoundingClientRect();
      const cssX = r.left + r.width / 2;
      const cssY = r.top + r.height / 2;
      setTargetScreen({ nx: cssX / vp.width, ny: cssY / vp.height, cssX, cssY });
    }
  }, []);

  const registerContainer = useCallback(
    (el: HTMLDivElement | null) => {
      mapperRef.current?.stop();
      containerRef.current = el;
      if (!el) {
        mapperRef.current = null;
        return;
      }
      const mapper = new ContentMapper(el, {
        onTransformChange: () => {
          pushLog('resize', `viewport ${window.innerWidth}×${window.innerHeight}`);
          logger.logViewport();
          setStimulusRows([...store.byType('stimulus')]);
          recomputeTarget();
        },
      });
      mapper.start();
      mapperRef.current = mapper;
      // Log the initial viewport and the fixed target as a stimulus.
      logger.logViewport();
      logger.logStimulus({
        target_id: 'content-target',
        position: { nx: TARGET_CONTENT_X, ny: TARGET_CONTENT_Y },
        task_phase: 'content-target',
      });
      setStimulusRows([...store.byType('stimulus')]);
      recomputeTarget();
    },
    [logger, pushLog, recomputeTarget, store],
  );

  const registerTarget = useCallback((el: HTMLDivElement | null) => {
    targetRef.current = el;
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const mapper = mapperRef.current;
    if (!mapper) return;
    const vp = readViewport();
    const gaze = { x: e.clientX / vp.width, y: e.clientY / vp.height };
    setPointer({ nx: gaze.x, ny: gaze.y, cssX: e.clientX, cssY: e.clientY });
    setContent(mapper.map(gaze, vp, true));
  }, []);

  const onPointerLeave = useCallback(() => {
    setPointer(null);
    setContent(null);
  }, []);

  const onScroll = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      pushLog('scroll', `scrollTop ${Math.round(container.scrollTop)} px`);
    }
    recomputeTarget();
  }, [pushLog, recomputeTarget]);

  const setZoom = useCallback(
    (z: number) => {
      setZoomState(z);
      pushLog('zoom', `scale ${z.toFixed(2)}×`);
      // Defer the snapshot until the DOM has applied the new transform.
      requestAnimationFrame(() => recomputeTarget());
    },
    [pushLog, recomputeTarget],
  );

  useEffect(() => () => mapperRef.current?.stop(), []);

  const value = useMemo<Step7DemoContextValue>(
    () => ({
      store,
      zoom,
      setZoom,
      pointer,
      content,
      targetScreen,
      viewport,
      containerRect,
      scroll,
      transformLog,
      stimulusRows,
      registerContainer,
      registerTarget,
      onPointerMove,
      onPointerLeave,
      onScroll,
    }),
    [
      store,
      zoom,
      setZoom,
      pointer,
      content,
      targetScreen,
      viewport,
      containerRect,
      scroll,
      transformLog,
      stimulusRows,
      registerContainer,
      registerTarget,
      onPointerMove,
      onPointerLeave,
      onScroll,
    ],
  );

  return <Step7DemoContext.Provider value={value}>{children}</Step7DemoContext.Provider>;
}

// --- Formatting -------------------------------------------------------------

function fmt(value: number | undefined, digits = 3): string {
  return value === undefined ? '—' : value.toFixed(digits);
}

// --- Live demo --------------------------------------------------------------

function Step7LiveDemo() {
  const {
    zoom,
    setZoom,
    pointer,
    content,
    targetScreen,
    registerContainer,
    registerTarget,
    onPointerMove,
    onPointerLeave,
    onScroll,
  } = useStep7Demo();

  return (
    <div className="content-demo">
      <p className="timing-demo__note">
        Move the pointer over the panel below (it stands in for a gaze point — real screen gaze
        needs calibration). Then <strong>scroll</strong> the panel or change the <strong>zoom</strong>:
        the <em>screen</em> coordinate of the fixed target moves, but its <em>content</em> coordinate
        stays put. That is why a screen x/y alone can mislead once content scrolls or transforms.
      </p>

      <div className="content-demo__controls">
        <label className="content-demo__zoom">
          Zoom
          <input
            type="range"
            min={1}
            max={2}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <span className="content-demo__zoom-value">{zoom.toFixed(1)}×</span>
        </label>
      </div>

      <div
        className="content-demo__viewport"
        ref={registerContainer}
        onScroll={onScroll}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div className="content-demo__content" style={{ transform: `scale(${zoom})` }}>
          <p className="content-demo__filler">Scrollable content — scroll down to find the target.</p>
          <div className="content-demo__target" ref={registerTarget}>
            <span>Fixed content target</span>
            <small>content ({TARGET_CONTENT_X.toFixed(2)}, {TARGET_CONTENT_Y.toFixed(2)})</small>
          </div>
          <p className="content-demo__filler content-demo__filler--tall">
            More content below the target so the panel scrolls.
          </p>
        </div>
        {pointer && (
          <span
            className="content-demo__pointer-dot"
            style={{ left: pointer.cssX, top: pointer.cssY, position: 'fixed' }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="content-demo__readouts">
        <div className="readout__item">
          <p className="readout__label">Pointer — screen (normalised)</p>
          <p className="readout__value">
            {pointer ? `${fmt(pointer.nx, 3)}, ${fmt(pointer.ny, 3)}` : '—'}
          </p>
        </div>
        <div className="readout__item">
          <p className="readout__label">Pointer — content</p>
          <p className="readout__value">
            {content?.content_mapping_available
              ? `${fmt(content.content_x, 3)}, ${fmt(content.content_y, 3)}`
              : 'unavailable'}
          </p>
        </div>
        <div className="readout__item">
          <p className="readout__label">Fixed target — screen (normalised)</p>
          <p className="readout__value">
            {targetScreen ? `${fmt(targetScreen.nx, 3)}, ${fmt(targetScreen.ny, 3)}` : '—'}
          </p>
        </div>
        <div className="readout__item">
          <p className="readout__label">Fixed target — content</p>
          <p className="readout__value">
            {TARGET_CONTENT_X.toFixed(3)}, {TARGET_CONTENT_Y.toFixed(3)} <small>(constant)</small>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Subprocess panels ------------------------------------------------------

function Step7DetailsPanels() {
  const { viewport, containerRect, scroll, transformLog, stimulusRows, content, targetScreen } =
    useStep7Demo();

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const orientation = viewport.height > viewport.width ? 'portrait' : 'landscape';

  return (
    <div className="panels">
      <section className="panel">
        <h3 className="panel__title">Viewport / DPR / orientation</h3>
        <ul className="panel__list">
          <li>
            Viewport: <strong>{viewport.width} × {viewport.height}</strong> CSS px
          </li>
          <li>
            Device-pixel ratio: <strong>{dpr}</strong>
          </li>
          <li>
            Orientation: <strong>{orientation}</strong>
          </li>
        </ul>
        <p className="panel__note">
          The same CSS-pixel coordinate means a different physical position under a different
          viewport size, DPR, or orientation — so these are logged alongside every stimulus.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Element coordinates (getBoundingClientRect)</h3>
        <ul className="panel__list">
          <li>
            Container rect:{' '}
            <strong>
              {containerRect
                ? `left ${Math.round(containerRect.left)}, top ${Math.round(containerRect.top)}, ${Math.round(containerRect.width)} × ${Math.round(containerRect.height)}`
                : '—'}
            </strong>
          </li>
          <li>
            Scroll: <strong>left {Math.round(scroll.scrollLeft)}, top {Math.round(scroll.scrollTop)}</strong> px
          </li>
          <li>
            Current pointer content mapping available:{' '}
            <strong>{content ? String(content.content_mapping_available) : '—'}</strong>
          </li>
          <li>
            Fixed target screen position:{' '}
            <strong>
              {targetScreen ? `${fmt(targetScreen.nx, 3)}, ${fmt(targetScreen.ny, 3)}` : '—'}
            </strong>{' '}
            — changes with scroll/zoom while its content coordinate stays fixed.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h3 className="panel__title">Scroll / zoom / transform log</h3>
        {transformLog.length === 0 ? (
          <p className="panel__note">Scroll or change the zoom to log transform changes.</p>
        ) : (
          <div className="panel__table-wrap">
            <table className="panel__table">
              <thead>
                <tr>
                  <th scope="col">time_ms</th>
                  <th scope="col">kind</th>
                  <th scope="col">detail</th>
                </tr>
              </thead>
              <tbody>
                {[...transformLog].reverse().map((e, i) => (
                  <tr key={i}>
                    <td>{Math.round(e.timeMs)}</td>
                    <td>{e.kind}</td>
                    <td>{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="panel__title">Logged stimulus identity / position / time</h3>
        {stimulusRows.length === 0 ? (
          <p className="panel__note">No stimulus rows logged yet.</p>
        ) : (
          <div className="panel__table-wrap">
            <table className="panel__table">
              <thead>
                <tr>
                  <th scope="col">time_ms</th>
                  <th scope="col">task_phase</th>
                  <th scope="col">target_id</th>
                  <th scope="col">target (nx, ny)</th>
                </tr>
              </thead>
              <tbody>
                {stimulusRows.slice(-6).map((row, i) => (
                  <tr key={i}>
                    <td>{Math.round(row.time_ms)}</td>
                    <td>{row.task_phase ?? '—'}</td>
                    <td>{row.target_id ?? '—'}</td>
                    <td>
                      {row.target_nx != null && row.target_ny != null
                        ? `${fmt(row.target_nx, 2)}, ${fmt(row.target_ny, 2)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="panel__note">
          Stimulus rows carry the viewport context so a logged screen position stays interpretable
          later (§3.7, §4).
        </p>
      </section>
    </div>
  );
}

export const step7Demo: StepDemo = {
  Provider: Step7DemoProvider,
  LiveDemo: Step7LiveDemo,
  DetailsPanels: Step7DetailsPanels,
};
