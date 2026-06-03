import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import CameraPreview from '../components/CameraPreview';
import { FrameTimer, type FrameTick } from '../lib/frameTiming';
import { SessionStore } from '../lib/sessionStore';
import type { StepDemo } from './registry';

// Step 1 live demo: a camera preview with a live frame-rate / timing readout as
// the main demo, plus timing subprocess panels revealed by the master control
// (specification §3.1, §2.5, §2.6).
//
// The camera (008) and timing (009) modules are reused: CameraPreview owns the
// consent/stream lifecycle, FrameTimer drives per-frame timing on its video
// element and writes the §4 timing fields into a session store. State is shared
// between the main readout and the subprocess panels (which live in separate
// page sections) via this context.

interface Step1DemoContextValue {
  store: SessionStore;
  tick: FrameTick | null;
  running: boolean;
  onStreamChange: (stream: MediaStream | null) => void;
  onVideoElement: (video: HTMLVideoElement | null) => void;
}

const Step1DemoContext = createContext<Step1DemoContextValue | undefined>(undefined);

function useStep1Demo(): Step1DemoContextValue {
  const context = useContext(Step1DemoContext);
  if (context === undefined) {
    throw new Error('Step 1 demo components must be used within Step1DemoProvider');
  }
  return context;
}

function Step1DemoProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SessionStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new SessionStore();
  }
  const store = storeRef.current;

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<FrameTimer | null>(null);
  const lastUiUpdateRef = useRef(0);

  const [tick, setTick] = useState<FrameTick | null>(null);
  const [running, setRunning] = useState(false);

  // Throttle the visible readout to ~10 Hz while the store still records every
  // frame, so the UI stays responsive without re-rendering on every frame.
  const handleTick = useCallback((next: FrameTick) => {
    if (next.timeMs - lastUiUpdateRef.current >= 100 || next.frameId === 1) {
      lastUiUpdateRef.current = next.timeMs;
      setTick(next);
    }
  }, []);

  const stopTimer = useCallback(() => {
    timerRef.current?.stop();
    timerRef.current = null;
    setRunning(false);
  }, []);

  const onStreamChange = useCallback(
    (stream: MediaStream | null) => {
      stopTimer();
      if (stream && videoElRef.current) {
        store.clear();
        lastUiUpdateRef.current = 0;
        setTick(null);
        const timer = new FrameTimer({
          video: videoElRef.current,
          store,
          onTick: handleTick,
        });
        timerRef.current = timer;
        timer.start();
        setRunning(true);
      } else {
        setTick(null);
      }
    },
    [store, handleTick, stopTimer],
  );

  const onVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoElRef.current = video;
  }, []);

  // Release the timer when the page unmounts.
  useEffect(() => () => stopTimer(), [stopTimer]);

  const value = useMemo<Step1DemoContextValue>(
    () => ({ store, tick, running, onStreamChange, onVideoElement }),
    [store, tick, running, onStreamChange, onVideoElement],
  );

  return <Step1DemoContext.Provider value={value}>{children}</Step1DemoContext.Provider>;
}

function formatMs(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(1)} ms`;
}

function formatSeconds(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(3)} s`;
}

function formatFps(value: number | undefined): string {
  return value === undefined || value <= 0 ? '—' : `${value.toFixed(1)} fps`;
}

function Step1LiveDemo() {
  const { tick, running, onStreamChange, onVideoElement } = useStep1Demo();

  return (
    <div className="timing-demo">
      <CameraPreview onStreamChange={onStreamChange} onVideoElement={onVideoElement} />

      <dl className="readout" aria-live="polite">
        <div className="readout__item">
          <dt className="readout__label">Effective rate</dt>
          <dd className="readout__value">{tick ? formatFps(tick.effectiveFps) : '—'}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Nominal rate</dt>
          <dd className="readout__value">{formatFps(tick?.nominalFps)}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Frames</dt>
          <dd className="readout__value">{tick ? tick.frameId : '—'}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Session time</dt>
          <dd className="readout__value">{tick ? formatMs(tick.timeMs) : '—'}</dd>
        </div>
      </dl>

      <p className="timing-demo__note">
        {running
          ? tick?.usedFallback
            ? 'Timing via the requestAnimationFrame fallback (this browser lacks requestVideoFrameCallback).'
            : 'Timing via requestVideoFrameCallback.'
          : 'Start the camera to see the effective frame rate and per-frame timing. Processing stays on your device.'}
      </p>
    </div>
  );
}

function Step1DetailsPanels() {
  const { store, tick, running } = useStep1Demo();

  if (!running || !tick) {
    return (
      <p className="panel__empty">
        Start the camera in the demo above to populate the timing panels.
      </p>
    );
  }

  const recent = store.byType('sample').slice(-8);

  return (
    <div className="panels">
      <section className="panel">
        <h3 className="panel__title">Frame timeline (most recent)</h3>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">frame_id</th>
                <th scope="col">time_ms</th>
                <th scope="col">video_frame_time</th>
                <th scope="col">capture_time</th>
                <th scope="col">processing_latency_ms</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.frame_id}>
                  <td>{row.frame_id}</td>
                  <td>{formatMs(row.time_ms)}</td>
                  <td>{formatSeconds(row.video_frame_time)}</td>
                  <td>{formatMs(row.capture_time)}</td>
                  <td>{formatMs(row.processing_latency_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel__note">
          Blank cells (—) mark fields that do not apply on the current path, distinct from a
          real zero.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Capture vs processing</h3>
        <ul className="panel__list">
          <li>
            Presentation timestamp (capture): <strong>{formatMs(tick.captureTime)}</strong>
          </li>
          <li>
            Processing latency: <strong>{formatMs(tick.processingLatencyMs)}</strong>
          </li>
          <li>
            Effective vs nominal: <strong>{formatFps(tick.effectiveFps)}</strong> vs{' '}
            <strong>{formatFps(tick.nominalFps)}</strong>
          </li>
        </ul>
      </section>

      <section className="panel">
        <h3 className="panel__title">Dropped / repeated frames</h3>
        <ul className="panel__list">
          <li>
            Dropped (cumulative): <strong>{tick.droppedFrames}</strong>
            {tick.frameDropped ? ' — drop just now' : ''}
          </li>
          <li>
            Repeated (cumulative): <strong>{tick.repeatedFrames}</strong>
            {tick.frameRepeated ? ' — repeat just now' : ''}
          </li>
        </ul>
        {tick.usedFallback && (
          <p className="panel__note">
            The requestAnimationFrame fallback cannot observe the compositor, so dropped and
            repeated frames are not detected on this path.
          </p>
        )}
      </section>
    </div>
  );
}

export const step1Demo: StepDemo = {
  Provider: Step1DemoProvider,
  LiveDemo: Step1LiveDemo,
  DetailsPanels: Step1DetailsPanels,
};
