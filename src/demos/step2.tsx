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
import { IlluminationFailurePanel } from '../components/LimitationPanels';
import { FaceFeatureExtractor, type FaceFeatures } from '../lib/featureExtraction';
import {
  LEFT_EYE_EAR_IDX,
  RIGHT_EYE_EAR_IDX,
  LEFT_EYE_CORNER_IDX,
  RIGHT_EYE_CORNER_IDX,
  LEFT_IRIS_IDX,
  RIGHT_IRIS_IDX,
  EAR_CLOSE_THRESHOLD,
  EAR_REOPEN_THRESHOLD,
  landmarkBounds,
  type LandmarkLike,
} from '../lib/eyeGeometry';
import { EYE_FRAME_ASPECT } from '../lib/eyeLocalSignal';
import { SessionStore } from '../lib/sessionStore';
import type { StepDemo } from './registry';

// Step 2 live demo: a camera preview with a live overlay of face landmarks,
// per-eye regions, and the iris-centre proxy as the main demo, plus feature
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
  registerCropCanvas: (canvas: HTMLCanvasElement | null) => void;
  registerEarCanvas: (canvas: HTMLCanvasElement | null) => void;
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

// --- Zoomed eye-region crop (052) -------------------------------------------

const EAR_TRACE_MAX = 150;

/**
 * Draw a magnified crop of one eye region from the current frame, with the iris
 * ring, the iris-proxy centre, and the eye-local normalisation frame overlaid so
 * the centred −1…1 mapping (the Step 4 eye-local signal) is previewed. The frame
 * is anchored to the eye-corner landmarks — the same corner frame the eye-local
 * signal uses — so it stays put during blinks and tilts with head roll. Reuses
 * the existing geometry; no new maths.
 */
function drawEyeCrop(canvas: HTMLCanvasElement, video: HTMLVideoElement, features: FaceFeatures | null): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cw = canvas.width;
  const ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, cw, ch);

  const srcW = video.videoWidth;
  const srcH = video.videoHeight;
  if (!features || !srcW || !srcH) {
    ctx.fillStyle = 'rgba(155,172,196,0.7)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('no eye', cw / 2, ch / 2);
    ctx.textAlign = 'start';
    return;
  }

  // Choose the higher-quality eye for the crop.
  const useLeft = features.leftEye.quality >= features.rightEye.quality;
  const cornerIdx = useLeft ? LEFT_EYE_CORNER_IDX : RIGHT_EYE_CORNER_IDX;
  const irisIdx = useLeft ? LEFT_IRIS_IDX : RIGHT_IRIS_IDX;
  const proxy = useLeft ? features.leftEye.irisProxy : features.rightEye.irisProxy;

  const ca = features.landmarks[cornerIdx[0]];
  const cb = features.landmarks[cornerIdx[1]];
  if (!ca || !cb) return;

  // Corner-frame geometry in source pixels (isotropic, like the signal maths):
  // origin at the corner midpoint, x along the corner-to-corner axis, y
  // perpendicular, half-height = EYE_FRAME_ASPECT x half-width.
  const axPx = ca.x * srcW;
  const ayPx = ca.y * srcH;
  const bxPx = cb.x * srcW;
  const byPx = cb.y * srcH;
  const cxPx = (axPx + bxPx) / 2;
  const cyPx = (ayPx + byPx) / 2;
  let ux = bxPx - axPx;
  let uy = byPx - ayPx;
  const cornerDist = Math.hypot(ux, uy);
  if (cornerDist < 1) return;
  ux /= cornerDist;
  uy /= cornerDist;
  if (ux < 0) {
    ux = -ux;
    uy = -uy;
  }
  const halfW = cornerDist / 2;
  const halfH = halfW * EYE_FRAME_ASPECT;

  // Crop source rectangle centred on the frame, preserving the canvas aspect
  // ratio so the eye is not stretched. Corner-anchored, so it does not pulse
  // when the eyelids move.
  let sw = cornerDist * 2.2;
  let sh = sw * (ch / cw);
  let sx0 = cxPx - sw / 2;
  let sy0 = cyPx - sh / 2;
  sx0 = Math.max(0, Math.min(sx0, srcW - 1));
  sy0 = Math.max(0, Math.min(sy0, srcH - 1));
  sw = Math.max(1, Math.min(sw, srcW - sx0));
  sh = Math.max(1, Math.min(sh, srcH - sy0));

  try {
    ctx.drawImage(video, sx0, sy0, sw, sh, 0, 0, cw, ch);
  } catch {
    return; // frame not ready
  }

  const mapX = (nx: number) => ((nx * srcW - sx0) / sw) * cw;
  const mapY = (ny: number) => ((ny * srcH - sy0) / sh) * ch;
  const mapPx = (px: number, py: number): [number, number] => [
    ((px - sx0) / sw) * cw,
    ((py - sy0) / sh) * ch,
  ];

  // The corner-anchored frame (tilts with head roll) and its axes.
  const rect: Array<[number, number]> = [
    mapPx(cxPx + ux * halfW - uy * halfH, cyPx + uy * halfW + ux * halfH),
    mapPx(cxPx + ux * halfW + uy * halfH, cyPx + uy * halfW - ux * halfH),
    mapPx(cxPx - ux * halfW + uy * halfH, cyPx - uy * halfW - ux * halfH),
    mapPx(cxPx - ux * halfW - uy * halfH, cyPx - uy * halfW + ux * halfH),
  ];
  ctx.strokeStyle = '#9b8cff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  rect.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.stroke();

  // Frame axes through the origin (the 0,0 of the −1…1 mapping).
  const [axisX0, axisY0] = mapPx(cxPx - ux * halfW, cyPx - uy * halfW);
  const [axisX1, axisY1] = mapPx(cxPx + ux * halfW, cyPx + uy * halfW);
  const [perpX0, perpY0] = mapPx(cxPx + uy * halfH, cyPx - ux * halfH);
  const [perpX1, perpY1] = mapPx(cxPx - uy * halfH, cyPx + ux * halfH);
  ctx.strokeStyle = 'rgba(155,140,255,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(axisX0, axisY0);
  ctx.lineTo(axisX1, axisY1);
  ctx.moveTo(perpX0, perpY0);
  ctx.lineTo(perpX1, perpY1);
  ctx.stroke();

  // Corner anchors.
  ctx.fillStyle = '#9b8cff';
  for (const [px, py] of [
    [axPx, ayPx],
    [bxPx, byPx],
  ]) {
    const [x, y] = mapPx(px, py);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Iris ring landmarks and the iris-proxy centre.
  ctx.fillStyle = '#ffd166';
  for (const i of irisIdx) {
    const lm = features.landmarks[i];
    if (lm) ctx.fillRect(mapX(lm.x) - 1.5, mapY(lm.y) - 1.5, 3, 3);
  }
  ctx.fillStyle = '#ff7b54';
  ctx.beginPath();
  ctx.arc(mapX(proxy.x), mapY(proxy.y), 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(229,233,240,0.85)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`${useLeft ? 'left' : 'right'} eye · corner-anchored frame`, 6, ch - 8);
}

/** Draw a rolling EAR trace with the blink hysteresis thresholds as reference lines. */
function drawEarTrace(canvas: HTMLCanvasElement, trace: number[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  const EAR_MAX = 0.45;
  const toY = (ear: number) => h - (Math.min(EAR_MAX, Math.max(0, ear)) / EAR_MAX) * h;

  // Hysteresis thresholds: close below the lower line, reopen above the upper.
  ctx.font = '10px monospace';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  const closeY = toY(EAR_CLOSE_THRESHOLD);
  ctx.strokeStyle = 'rgba(255,180,180,0.9)';
  ctx.beginPath();
  ctx.moveTo(0, closeY);
  ctx.lineTo(w, closeY);
  ctx.stroke();
  const reopenY = toY(EAR_REOPEN_THRESHOLD);
  ctx.strokeStyle = 'rgba(91,227,155,0.7)';
  ctx.beginPath();
  ctx.moveTo(0, reopenY);
  ctx.lineTo(w, reopenY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(91,227,155,0.85)';
  ctx.fillText(`reopen > ${EAR_REOPEN_THRESHOLD}`, 6, reopenY - 4);
  ctx.fillStyle = 'rgba(255,180,180,0.9)';
  ctx.fillText(`close < ${EAR_CLOSE_THRESHOLD}`, 6, closeY + 11);

  if (trace.length >= 2) {
    ctx.strokeStyle = '#5be39b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    trace.forEach((ear, i) => {
      const x = (i / (trace.length - 1)) * w;
      const y = toY(ear);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
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
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const earCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const earTraceRef = useRef<number[]>([]);
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
    if (cropCanvasRef.current) {
      drawEyeCrop(cropCanvasRef.current, video, result);
    }
    if (result) {
      const combinedEar = (result.leftEye.ear + result.rightEye.ear) / 2;
      const trace = earTraceRef.current;
      trace.push(combinedEar);
      if (trace.length > EAR_TRACE_MAX) trace.shift();
    }
    if (earCanvasRef.current) {
      drawEarTrace(earCanvasRef.current, earTraceRef.current);
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
      earTraceRef.current = [];
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

  const registerCropCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    cropCanvasRef.current = canvas;
  }, []);

  const registerEarCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    earCanvasRef.current = canvas;
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
      registerCropCanvas,
      registerEarCanvas,
    }),
    [
      store,
      features,
      state,
      errorMessage,
      frameCount,
      onStreamChange,
      onVideoElement,
      registerCanvas,
      registerCropCanvas,
      registerEarCanvas,
    ],
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
  const {
    features,
    state,
    errorMessage,
    onStreamChange,
    onVideoElement,
    registerCanvas,
    registerCropCanvas,
    registerEarCanvas,
  } = useStep2Demo();

  const overlay = (
    <canvas ref={registerCanvas} className="feature-overlay" />
  );
  const cameraReady = state === 'tracking' || state === 'no-face';

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

      {/* Actionable unstable-landmarks warning (071): detectable from the live face quality. */}
      {state === 'tracking' && features && features.faceQuality < 0.5 && (
        <p className="demo-warning" role="alert">
          Landmark detection is unstable (low face quality). Face the camera straight on, improve
          and even out the lighting, remove glasses glare, and clear hair or hands from your face —
          unstable landmarks propagate noise into the eye-local signal and head pose.
        </p>
      )}

      {cameraReady && (
        <div className="eye-detail">
          <figure className="eye-detail__item">
            <canvas
              ref={registerCropCanvas}
              width={200}
              height={150}
              className="eye-detail__canvas"
              role="img"
              aria-label="Zoomed eye-region crop with iris ring, iris-proxy centre, and the corner-anchored normalisation frame"
            />
            <figcaption className="eye-detail__caption">
              Zoomed eye region. The purple frame is the eye-local{' '}
              <strong>normalisation frame</strong>, anchored to the two eye corners (purple dots)
              so it ignores eyelid movement and tilts with head roll; the iris proxy (orange) is
              mapped to −1…1 within it — a preview of the Step 4 eye-local signal.
            </figcaption>
          </figure>
          <figure className="eye-detail__item">
            <canvas
              ref={registerEarCanvas}
              width={260}
              height={120}
              className="eye-detail__canvas"
              role="img"
              aria-label="Live eye-aspect-ratio trace with the blink threshold line"
            />
            <figcaption className="eye-detail__caption">
              Live <strong>EAR</strong> (eye-aspect-ratio, combined). Blink and watch the trace dip
              below the red close threshold; the eye only counts as open again above the green
              reopen line. The gap between the two (hysteresis) stops half-closed frames from
              flickering between open and closed.
            </figcaption>
          </figure>
        </div>
      )}

      <IlluminationFailurePanel />
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
