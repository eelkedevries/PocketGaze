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
import { FaceFeatureExtractor, type FaceFeatures } from '../lib/featureExtraction';
import {
  LEFT_EYE_EAR_IDX,
  RIGHT_EYE_EAR_IDX,
  LEFT_IRIS_IDX,
  RIGHT_IRIS_IDX,
  landmarkBounds,
  type LandmarkLike,
} from '../lib/eyeGeometry';
import { SessionStore } from '../lib/sessionStore';
import type { StepDemo } from './registry';

// Step 2 live demo: a camera preview with a live overlay of face landmarks,
// per-eye regions, and the iris/pupil proxy as the main demo, plus feature
// subprocess panels revealed by the master control (specification §3.2, §2.5,
// §2.6).
//
// The feature-extraction module (012) is reused as-is: the extractor loads the
// self-hosted MediaPipe model/WASM, processes each frame on the camera's video
// element, and writes the §4 feature fields into a session store. The provider
// owns the extractor, the per-frame loop, and the overlay drawing; state is
// shared with the panels (a separate page section) via this context.

type DemoState = 'idle' | 'loading' | 'tracking' | 'no-face' | 'error';

interface Step2DemoContextValue {
  store: SessionStore;
  features: FaceFeatures | null;
  state: DemoState;
  errorMessage: string | null;
  frameCount: number;
  onStreamChange: (stream: MediaStream | null) => void;
  onVideoElement: (video: HTMLVideoElement | null) => void;
  registerCanvas: (canvas: HTMLCanvasElement | null) => void;
}

const Step2DemoContext = createContext<Step2DemoContextValue | undefined>(undefined);

function useStep2Demo(): Step2DemoContextValue {
  const context = useContext(Step2DemoContext);
  if (context === undefined) {
    throw new Error('Step 2 demo components must be used within Step2DemoProvider');
  }
  return context;
}

// --- Overlay drawing (object-fit: cover mapping) ----------------------------

/** Map a normalised landmark to canvas pixels, matching the video's cover-fit. */
function coverMap(
  nx: number,
  ny: number,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): [number, number] {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const dispW = srcW * scale;
  const dispH = srcH * scale;
  const offX = (dstW - dispW) / 2;
  const offY = (dstH - dispH) / 2;
  return [nx * dispW + offX, ny * dispH + offY];
}

function drawOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  features: FaceFeatures | null,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Match the drawing buffer to the displayed size for crisp output.
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  if (!features) return;

  const srcW = video.videoWidth || w;
  const srcH = video.videoHeight || h;
  const map = (lm: LandmarkLike): [number, number] =>
    coverMap(lm.x, lm.y, srcW, srcH, w, h);

  // 1. All landmarks as a faint mesh.
  ctx.fillStyle = 'rgba(76, 154, 255, 0.45)';
  for (const lm of features.landmarks) {
    const [x, y] = map(lm);
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // 2. Per-eye region rectangles, coloured by open/closed.
  const eyes: Array<[readonly number[], boolean]> = [
    [LEFT_EYE_EAR_IDX, features.leftEye.isOpen],
    [RIGHT_EYE_EAR_IDX, features.rightEye.isOpen],
  ];
  ctx.lineWidth = 2;
  for (const [idx, isOpen] of eyes) {
    const b = landmarkBounds(features.landmarks, idx, 0.015);
    const [x0, y0] = coverMap(b.minX, b.minY, srcW, srcH, w, h);
    const [x1, y1] = coverMap(b.maxX, b.maxY, srcW, srcH, w, h);
    ctx.strokeStyle = isOpen ? '#5be39b' : '#ffb4b4';
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }

  // 3. Iris rings and the iris-proxy centre point per eye.
  const irises: Array<[readonly number[], { x: number; y: number }]> = [
    [LEFT_IRIS_IDX, features.leftEye.irisProxy],
    [RIGHT_IRIS_IDX, features.rightEye.irisProxy],
  ];
  for (const [idx, proxy] of irises) {
    ctx.fillStyle = '#ffd166';
    for (const i of idx) {
      const [x, y] = map(features.landmarks[i]);
      ctx.fillRect(x - 1, y - 1, 2.5, 2.5);
    }
    const [cx, cy] = coverMap(proxy.x, proxy.y, srcW, srcH, w, h);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff7b54';
    ctx.fill();
  }
}

// --- Provider ---------------------------------------------------------------

function Step2DemoProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SessionStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new SessionStore();
  }
  const store = storeRef.current;

  const extractorRef = useRef<FaceFeatureExtractor | null>(null);
  if (extractorRef.current === null) {
    extractorRef.current = new FaceFeatureExtractor();
  }
  const extractor = extractorRef.current;

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rvfcRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastUiUpdateRef = useRef(0);
  const frameCountRef = useRef(0);

  const [features, setFeatures] = useState<FaceFeatures | null>(null);
  const [state, setState] = useState<DemoState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

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

  const processOneFrame = useCallback(() => {
    const video = videoElRef.current;
    if (!runningRef.current || !video) return;

    frameCountRef.current += 1;
    const ts = performance.now();
    const result = extractor.processFrame(video, ts, store, frameCountRef.current);

    if (canvasRef.current) {
      drawOverlay(canvasRef.current, video, result);
    }

    // Throttle React updates to ~10 Hz; the overlay itself draws every frame.
    if (ts - lastUiUpdateRef.current >= 100) {
      lastUiUpdateRef.current = ts;
      setFeatures(result);
      setFrameCount(frameCountRef.current);
      setState(result ? 'tracking' : 'no-face');
    }
  }, [extractor, store]);

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
        setFeatures(null);
        return;
      }
      store.clear();
      frameCountRef.current = 0;
      lastUiUpdateRef.current = 0;
      setFeatures(null);
      setFrameCount(0);
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

  const onVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoElRef.current = video;
  }, []);

  const registerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  // Release the loop and the extractor when the page unmounts.
  useEffect(
    () => () => {
      stopLoop();
      extractor.close();
    },
    [extractor, stopLoop],
  );

  const value = useMemo<Step2DemoContextValue>(
    () => ({
      store,
      features,
      state,
      errorMessage,
      frameCount,
      onStreamChange,
      onVideoElement,
      registerCanvas,
    }),
    [store, features, state, errorMessage, frameCount, onStreamChange, onVideoElement, registerCanvas],
  );

  return <Step2DemoContext.Provider value={value}>{children}</Step2DemoContext.Provider>;
}

// --- Formatting helpers -----------------------------------------------------

function formatPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | undefined, digits = 3): string {
  return value === undefined ? '—' : value.toFixed(digits);
}

// --- Live demo --------------------------------------------------------------

function Step2LiveDemo() {
  const { features, state, errorMessage, onStreamChange, onVideoElement, registerCanvas } =
    useStep2Demo();

  const overlay = (
    <canvas ref={registerCanvas} className="feature-overlay" />
  );

  return (
    <div className="feature-demo">
      <CameraPreview
        onStreamChange={onStreamChange}
        onVideoElement={onVideoElement}
        overlay={overlay}
      />

      <dl className="readout" aria-live="polite">
        <div className="readout__item">
          <dt className="readout__label">Left eye</dt>
          <dd className="readout__value">
            {features ? (features.leftEye.isOpen ? 'Open' : 'Closed') : '—'}
          </dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Right eye</dt>
          <dd className="readout__value">
            {features ? (features.rightEye.isOpen ? 'Open' : 'Closed') : '—'}
          </dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Face quality</dt>
          <dd className="readout__value">{formatPercent(features?.faceQuality)}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Per-eye quality</dt>
          <dd className="readout__value">
            {features
              ? `${formatPercent(features.leftEye.quality)} / ${formatPercent(features.rightEye.quality)}`
              : '—'}
          </dd>
        </div>
      </dl>

      <p className="timing-demo__note" role="status">
        {state === 'idle' &&
          'Start the camera to see live face, eye-region, and iris-proxy overlays. Processing stays on your device.'}
        {state === 'loading' && 'Loading the face-tracking model (served from this site)…'}
        {state === 'tracking' &&
          'Tracking. The green/red boxes mark each eye region; the orange dots mark the iris-proxy centres.'}
        {state === 'no-face' &&
          'No face detected — move into frame and ensure your face is well lit. Quality indicators read low until a face is found.'}
        {state === 'error' && (errorMessage ?? 'The face-tracking model could not be loaded.')}
      </p>
    </div>
  );
}

// --- Subprocess panels ------------------------------------------------------

function Step2DetailsPanels() {
  const { features, state, frameCount } = useStep2Demo();

  if (state !== 'tracking' || !features) {
    return (
      <p className="panel__empty">
        Start the camera and look into it to populate the feature panels.
        {state === 'no-face' && ' (No face is currently detected.)'}
      </p>
    );
  }

  const { leftEye, rightEye, landmarks } = features;

  return (
    <div className="panels">
      <section className="panel">
        <h3 className="panel__title">Raw landmark set</h3>
        <ul className="panel__list">
          <li>
            Landmarks detected: <strong>{landmarks.length}</strong> (frame {frameCount})
          </li>
          <li>
            Nose tip (idx 1):{' '}
            <strong>
              ({formatNumber(landmarks[1]?.x)}, {formatNumber(landmarks[1]?.y)})
            </strong>
          </li>
        </ul>
        <p className="panel__note">
          Coordinates are normalised (0–1) in the camera frame. Only derived features are
          written to the session model — never the raw video.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Per-eye region markers</h3>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">eye</th>
                <th scope="col">iris_x</th>
                <th scope="col">iris_y</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>left</td>
                <td>{formatNumber(leftEye.irisProxy.x)}</td>
                <td>{formatNumber(leftEye.irisProxy.y)}</td>
              </tr>
              <tr>
                <td>right</td>
                <td>{formatNumber(rightEye.irisProxy.x)}</td>
                <td>{formatNumber(rightEye.irisProxy.y)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="panel__note">Iris-proxy centre = centroid of the 5-point iris ring.</p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Eye-aspect-ratio / openness</h3>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">eye</th>
                <th scope="col">EAR</th>
                <th scope="col">openness</th>
                <th scope="col">state</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>left</td>
                <td>{formatNumber(leftEye.ear)}</td>
                <td>{formatPercent(leftEye.openness)}</td>
                <td>{leftEye.isOpen ? 'open' : 'closed'}</td>
              </tr>
              <tr>
                <td>right</td>
                <td>{formatNumber(rightEye.ear)}</td>
                <td>{formatPercent(rightEye.openness)}</td>
                <td>{rightEye.isOpen ? 'open' : 'closed'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel__title">Per-eye quality</h3>
        <ul className="panel__list">
          <li>
            Left eye quality: <strong>{formatPercent(leftEye.quality)}</strong>
          </li>
          <li>
            Right eye quality: <strong>{formatPercent(rightEye.quality)}</strong>
          </li>
          <li>
            Face quality: <strong>{formatPercent(features.faceQuality)}</strong>
          </li>
        </ul>
        <p className="panel__note">
          Quality is the mean landmark visibility for the region; low values flag occlusion,
          glasses, extreme pose, or poor lighting, and propagate downstream.
        </p>
      </section>
    </div>
  );
}

export const step2Demo: StepDemo = {
  Provider: Step2DemoProvider,
  LiveDemo: Step2LiveDemo,
  DetailsPanels: Step2DetailsPanels,
};
