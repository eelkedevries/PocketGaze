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
import { FaceFeatureExtractor } from '../lib/featureExtraction';
import { LEFT_EYE_EAR_IDX, RIGHT_EYE_EAR_IDX, landmarkBounds } from '../lib/eyeGeometry';
import { computeEyeLocalSignal, type EyeLocalSignal } from '../lib/eyeLocalSignal';
import {
  createScreenGazeProviders,
  type ScreenGazeProviders,
} from '../lib/screenGazeProviders';
import type { ScreenGazeEstimate } from '../lib/screenGaze';
import { SessionStore } from '../lib/sessionStore';
import type { StepDemo } from './registry';

// Step 4 live demo: the eye-local signal as the DEFAULT visualisation, plus an
// OPTIONAL screen-gaze estimate from a user-selectable provider — provider A
// (custom regression, default) or provider B (WebEyeTrack, opt-in). The two
// signal kinds are kept visibly and terminologically distinct (spec §3.4, §6.2;
// decision §7.3 `018b`/`019b`).
//
// Reuse: feature extraction (012) gives the iris proxy + eye landmarks; the
// eye-local module (017) normalises them within each eye region; the screen-gaze
// providers (019/019b) turn that (or the frame) into a screen estimate. This demo
// only wires those together and draws them — it owns no signal logic.

type DemoState = 'idle' | 'loading' | 'tracking' | 'no-face' | 'error';
type ProviderId = 'regression' | 'webeyetrack';
type ProviderBStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DemoSample {
  eyeLocal: EyeLocalSignal | null;
  gaze: ScreenGazeEstimate;
}

interface Step4DemoContextValue {
  store: SessionStore;
  sample: DemoSample | null;
  state: DemoState;
  errorMessage: string | null;
  providerId: ProviderId;
  providerBStatus: ProviderBStatus;
  selectProvider: (id: ProviderId) => void;
  onStreamChange: (stream: MediaStream | null) => void;
  onVideoElement: (video: HTMLVideoElement | null) => void;
  registerCanvas: (canvas: HTMLCanvasElement | null) => void;
}

const Step4DemoContext = createContext<Step4DemoContextValue | undefined>(undefined);

function useStep4Demo(): Step4DemoContextValue {
  const context = useContext(Step4DemoContext);
  if (context === undefined) {
    throw new Error('Step 4 demo components must be used within Step4DemoProvider');
  }
  return context;
}

const TRACE_MAX = 120;

// --- Drawing ----------------------------------------------------------------

/** Draw the eye-local trace (left) and the screen-gaze box (right). */
function drawSignals(
  canvas: HTMLCanvasElement,
  trace: ReadonlyArray<{ x: number; y: number }>,
  gaze: ScreenGazeEstimate,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  const gap = 12;
  const boxW = (w - gap) / 2;

  // Eye-local box (left). Eye-local coords are ~[-1,1]; map to the box.
  const elX = 0;
  drawBox(ctx, elX, 0, boxW, h, 'Eye-local signal', '#5be39b');
  const mapX = (v: number) => elX + ((v + 1) / 2) * boxW;
  const mapY = (v: number) => ((v + 1) / 2) * h;
  if (trace.length > 0) {
    ctx.strokeStyle = 'rgba(91,227,155,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    trace.forEach((p, i) => {
      const x = mapX(p.x);
      const y = mapY(p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const last = trace[trace.length - 1];
    ctx.fillStyle = '#5be39b';
    ctx.beginPath();
    ctx.arc(mapX(last.x), mapY(last.y), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Screen-gaze box (right) — a stand-in for the screen.
  const sgX = boxW + gap;
  drawBox(ctx, sgX, 0, boxW, h, 'Screen-gaze estimate', '#4c9aff');
  if (gaze.gaze_available && gaze.gaze_x != null && gaze.gaze_y != null) {
    ctx.fillStyle = '#4c9aff';
    ctx.beginPath();
    ctx.arc(sgX + gaze.gaze_x * boxW, gaze.gaze_y * h, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('no estimate', sgX + boxW / 2, h / 2);
    ctx.textAlign = 'start';
  }
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  colour: string,
): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = colour;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(label, x + 6, y + 14);
}

// --- Provider ---------------------------------------------------------------

function Step4DemoProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SessionStore | null>(null);
  if (storeRef.current === null) storeRef.current = new SessionStore();
  const store = storeRef.current;

  const extractorRef = useRef<FaceFeatureExtractor | null>(null);
  if (extractorRef.current === null) extractorRef.current = new FaceFeatureExtractor();
  const extractor = extractorRef.current;

  const providersRef = useRef<ScreenGazeProviders | null>(null);
  if (providersRef.current === null) providersRef.current = createScreenGazeProviders();
  const providers = providersRef.current;

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grabCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rvfcRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastUiUpdateRef = useRef(0);
  const frameCountRef = useRef(0);
  const traceRef = useRef<{ x: number; y: number }[]>([]);
  const providerIdRef = useRef<ProviderId>('regression');

  const [sample, setSample] = useState<DemoSample | null>(null);
  const [state, setState] = useState<DemoState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<ProviderId>('regression');
  const [providerBStatus, setProviderBStatus] = useState<ProviderBStatus>('idle');

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    const video = videoElRef.current;
    if (rvfcRef.current !== null && video && 'cancelVideoFrameCallback' in video) {
      (video as HTMLVideoElement & {
        cancelVideoFrameCallback: (h: number) => void;
      }).cancelVideoFrameCallback(rvfcRef.current);
    }
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rvfcRef.current = null;
    rafRef.current = null;
  }, []);

  const grabFrame = useCallback((video: HTMLVideoElement): ImageData | null => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    let c = grabCanvasRef.current;
    if (!c) {
      c = document.createElement('canvas');
      grabCanvasRef.current = c;
    }
    if (c.width !== vw) c.width = vw;
    if (c.height !== vh) c.height = vh;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, vw, vh);
    return ctx.getImageData(0, 0, vw, vh);
  }, []);

  const processOneFrame = useCallback(() => {
    const video = videoElRef.current;
    if (!runningRef.current || !video) return;

    frameCountRef.current += 1;
    const ts = performance.now();
    const features = extractor.processFrame(video, ts, store, frameCountRef.current);

    let eyeLocal: EyeLocalSignal | null = null;
    if (features) {
      eyeLocal = computeEyeLocalSignal(
        {
          iris: features.leftEye.irisProxy,
          region: landmarkBounds(features.landmarks, LEFT_EYE_EAR_IDX),
          quality: features.leftEye.quality,
        },
        {
          iris: features.rightEye.irisProxy,
          region: landmarkBounds(features.landmarks, RIGHT_EYE_EAR_IDX),
          quality: features.rightEye.quality,
        },
      );
      const trace = traceRef.current;
      trace.push({ x: eyeLocal.combined.x, y: eyeLocal.combined.y });
      if (trace.length > TRACE_MAX) trace.shift();
    }

    // Feed the selected provider. Provider B (image-based) needs the frame.
    const provider = providers.registry.selected;
    const useB = providerIdRef.current === 'webeyetrack';
    const frame = useB ? grabFrame(video) : null;
    const gaze: ScreenGazeEstimate = provider
      ? provider.estimate({
          timeMs: ts,
          eyeLocal,
          frame,
          viewport: { width: video.clientWidth, height: video.clientHeight },
        })
      : { gaze_available: false };

    if (canvasRef.current) drawSignals(canvasRef.current, traceRef.current, gaze);

    if (ts - lastUiUpdateRef.current >= 100) {
      lastUiUpdateRef.current = ts;
      setSample({ eyeLocal, gaze });
      setState(features ? 'tracking' : 'no-face');
    }
  }, [extractor, store, providers, grabFrame]);

  const scheduleNext = useCallback(() => {
    const video = videoElRef.current;
    if (!runningRef.current || !video) return;
    if ('requestVideoFrameCallback' in video) {
      rvfcRef.current = (video as HTMLVideoElement & {
        requestVideoFrameCallback: (cb: () => void) => number;
      }).requestVideoFrameCallback(() => {
        processOneFrame();
        scheduleNext();
      });
    } else {
      rafRef.current = requestAnimationFrame(() => {
        processOneFrame();
        scheduleNext();
      });
    }
  }, [processOneFrame]);

  const onStreamChange = useCallback(
    (stream: MediaStream | null) => {
      stopLoop();
      if (!stream || !videoElRef.current) {
        setState('idle');
        setSample(null);
        return;
      }
      store.clear();
      frameCountRef.current = 0;
      lastUiUpdateRef.current = 0;
      traceRef.current = [];
      setSample(null);
      setState('loading');
      setErrorMessage(null);

      extractor
        .init()
        .then(() => {
          if (!videoElRef.current) return;
          runningRef.current = true;
          setState('no-face');
          scheduleNext();
        })
        .catch(() => {
          setState('error');
          setErrorMessage(
            'The face-tracking model could not be loaded in this browser. The explanatory content above still applies.',
          );
        });
    },
    [extractor, scheduleNext, stopLoop, store],
  );

  const selectProvider = useCallback(
    (id: ProviderId) => {
      providers.registry.select(id);
      providerIdRef.current = id;
      setProviderId(id);
      if (id === 'webeyetrack' && providerBStatus === 'idle') {
        setProviderBStatus('loading');
        providers.webEyeTrack
          .init()
          .then(() => setProviderBStatus('ready'))
          .catch(() => setProviderBStatus('error'));
      }
    },
    [providers, providerBStatus],
  );

  const onVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoElRef.current = video;
  }, []);

  const registerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  useEffect(
    () => () => {
      stopLoop();
      extractor.close();
      providers.webEyeTrack.dispose();
    },
    [extractor, stopLoop, providers],
  );

  const value = useMemo<Step4DemoContextValue>(
    () => ({
      store,
      sample,
      state,
      errorMessage,
      providerId,
      providerBStatus,
      selectProvider,
      onStreamChange,
      onVideoElement,
      registerCanvas,
    }),
    [
      store,
      sample,
      state,
      errorMessage,
      providerId,
      providerBStatus,
      selectProvider,
      onStreamChange,
      onVideoElement,
      registerCanvas,
    ],
  );

  return <Step4DemoContext.Provider value={value}>{children}</Step4DemoContext.Provider>;
}

// --- Formatting -------------------------------------------------------------

function fmt(value: number | undefined, digits = 3): string {
  return value === undefined ? '—' : value.toFixed(digits);
}

function gazeStatusText(
  providerId: ProviderId,
  providerBStatus: ProviderBStatus,
  gaze: ScreenGazeEstimate | undefined,
): string {
  if (gaze?.gaze_available) {
    return 'Estimate available — uncalibrated, so treat the position as approximate.';
  }
  if (providerId === 'regression') {
    return 'Unavailable: the custom regression needs calibration (Step 5) before it can map eye-local movement to the screen.';
  }
  if (providerBStatus === 'loading') return 'Loading the WebEyeTrack model (fetched from its CDN)…';
  if (providerBStatus === 'error') return 'WebEyeTrack could not be loaded in this browser.';
  return 'Waiting for a gaze estimate — look towards the camera.';
}

// --- Live demo --------------------------------------------------------------

function Step4LiveDemo() {
  const {
    sample,
    state,
    errorMessage,
    providerId,
    providerBStatus,
    selectProvider,
    onStreamChange,
    onVideoElement,
    registerCanvas,
  } = useStep4Demo();

  const gaze = sample?.gaze;

  return (
    <div className="feature-demo">
      <CameraPreview onStreamChange={onStreamChange} onVideoElement={onVideoElement} />

      <fieldset className="gaze-selector">
        <legend className="gaze-selector__legend">Screen-gaze method</legend>
        <label className="gaze-selector__option">
          <input
            type="radio"
            name="screen-gaze-provider"
            value="regression"
            checked={providerId === 'regression'}
            onChange={() => selectProvider('regression')}
          />
          <span>Custom regression (default, self-hosted)</span>
        </label>
        <label className="gaze-selector__option">
          <input
            type="radio"
            name="screen-gaze-provider"
            value="webeyetrack"
            checked={providerId === 'webeyetrack'}
            onChange={() => selectProvider('webeyetrack')}
          />
          <span>
            WebEyeTrack (model-based, opt-in)
            {providerId === 'webeyetrack' && providerBStatus === 'loading' && ' — loading…'}
            {providerId === 'webeyetrack' && providerBStatus === 'error' && ' — unavailable'}
          </span>
        </label>
        <p className="gaze-selector__note">
          WebEyeTrack loads its model from a third-party CDN and adds a heavier runtime; the
          custom regression stays on this site. Either way, raw video never leaves your device.
        </p>
      </fieldset>

      <canvas
        ref={registerCanvas}
        className="signal-stage"
        role="img"
        aria-label="Eye-local signal trace and screen-gaze estimate"
      />

      <dl className="readout" aria-live="polite">
        <div className="readout__item">
          <dt className="readout__label">Eye-local x / y (combined)</dt>
          <dd className="readout__value">
            {fmt(sample?.eyeLocal?.combined.x, 2)} / {fmt(sample?.eyeLocal?.combined.y, 2)}
          </dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Screen-gaze x / y</dt>
          <dd className="readout__value">
            {gaze?.gaze_available ? `${fmt(gaze.gaze_x, 2)} / ${fmt(gaze.gaze_y, 2)}` : 'unavailable'}
          </dd>
        </div>
      </dl>

      <p className="timing-demo__note" role="status">
        {state === 'idle' &&
          'Start the camera to see your eye-local signal move. Screen gaze is an optional, separate estimate. Processing stays on your device.'}
        {state === 'loading' && 'Loading the face-tracking model (served from this site)…'}
        {state === 'tracking' && gazeStatusText(providerId, providerBStatus, gaze)}
        {state === 'no-face' && 'No face detected — move into frame and ensure good lighting.'}
        {state === 'error' && (errorMessage ?? 'The face-tracking model could not be loaded.')}
      </p>

      <p className="timing-demo__note">
        These are <strong>different signals</strong>: the <strong>eye-local signal</strong> is
        iris movement normalised within each eye — calibration-light, but <em>not</em> where you
        are looking on screen. A <strong>screen-gaze estimate</strong> requires a calibrated
        mapping or model and must not be read as precise gaze until it has been calibrated and
        checked.
      </p>
    </div>
  );
}

// --- Subprocess panels ------------------------------------------------------

function Step4DetailsPanels() {
  const { sample, state, providerId, providerBStatus } = useStep4Demo();

  if (state !== 'tracking' || !sample) {
    return (
      <p className="panel__empty">
        Start the camera and look into it to populate the eye-local and screen-gaze panels.
        {state === 'no-face' && ' (No face is currently detected.)'}
      </p>
    );
  }

  const el = sample.eyeLocal;
  const gaze = sample.gaze;

  return (
    <div className="panels">
      <section className="panel">
        <h3 className="panel__title">Eye-local coordinates (per eye and combined)</h3>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">signal</th>
                <th scope="col">x</th>
                <th scope="col">y</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>left eye</td>
                <td>{fmt(el?.left.x)}</td>
                <td>{fmt(el?.left.y)}</td>
              </tr>
              <tr>
                <td>right eye</td>
                <td>{fmt(el?.right.x)}</td>
                <td>{fmt(el?.right.y)}</td>
              </tr>
              <tr>
                <td>combined</td>
                <td>{fmt(el?.combined.x)}</td>
                <td>{fmt(el?.combined.y)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="panel__note">
          Each iris proxy is normalised within its own eye region, so the value is roughly −1…1
          and largely invariant to face scale. Selected-signal quality:{' '}
          <strong>{fmt(el?.quality, 2)}</strong>.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Screen-gaze coordinates and availability</h3>
        <ul className="panel__list">
          <li>
            Available: <strong>{gaze.gaze_available ? 'yes' : 'no'}</strong>
          </li>
          <li>
            x / y: <strong>{gaze.gaze_available ? `${fmt(gaze.gaze_x)} / ${fmt(gaze.gaze_y)}` : '— / —'}</strong>
          </li>
          <li>
            Confidence:{' '}
            <strong>{gaze.gaze_confidence === undefined ? '—' : fmt(gaze.gaze_confidence, 2)}</strong>
          </li>
        </ul>
        <p className="panel__note">
          Screen gaze is written to separate fields (<code>gaze_x_raw</code>,{' '}
          <code>gaze_y_raw</code>, <code>gaze_available</code>, <code>gaze_confidence</code>) from
          the eye-local fields — the two signal kinds never share columns (§6.2).
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Which signal is selected, and why</h3>
        <ul className="panel__list">
          <li>
            Selected provider: <strong>{providerId === 'regression' ? 'Custom regression (A)' : 'WebEyeTrack (B)'}</strong>
          </li>
          <li>
            Eye-local signal is always shown by default; screen gaze is optional and shown only
            when the selected provider can produce it.
          </li>
          {providerId === 'webeyetrack' && (
            <li>
              WebEyeTrack status: <strong>{providerBStatus}</strong> — its model is fetched from a
              third-party CDN (documented opt-in exception, §2.7).
            </li>
          )}
        </ul>
        <p className="panel__note">
          Provider A is fully self-hosted but needs calibration (Step 5) before it produces gaze;
          provider B is model-based and opt-in. Both write the same screen-gaze fields, so the
          choice never changes the data contract.
        </p>
      </section>
    </div>
  );
}

export const step4Demo: StepDemo = {
  Provider: Step4DemoProvider,
  LiveDemo: Step4LiveDemo,
  DetailsPanels: Step4DetailsPanels,
};
