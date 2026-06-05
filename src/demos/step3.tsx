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
import { NoCornealReflectionPanel } from '../components/LimitationPanels';
import { FaceFeatureExtractor, type FaceFeatures } from '../lib/featureExtraction';
import type { HeadPose } from '../lib/headPose';
import {
  DEFAULT_MOTION_QUALITY_THRESHOLDS,
  angularSpeedDegPerSec,
  labelFromSpeedAndQuality,
} from '../lib/motionQuality';
import { SessionStore } from '../lib/sessionStore';
import type { HeadMotionLabel } from '../types/session';
import type { StepDemo } from './registry';

// Step 3 live demo: a camera preview with a live head-pose readout and a small
// head-orientation gizmo as the main demo, a head-motion quality label
// (low / moderate / uncertain), plus pose subprocess panels revealed by the
// master control (specification §3.3, §2.5, §2.6; Domain rule §6.4).
//
// Reuse: the feature-extraction module (012) already decomposes head pose from
// the MediaPipe facial transformation matrix (014b) on each frame, and the
// motion-quality module (015) provides the pure speed/label functions. This
// demo wires them into the page; it owns no new pose or labelling logic.

type DemoState = 'idle' | 'loading' | 'tracking' | 'no-face' | 'error';

interface PoseSample {
  pose: HeadPose;
  /** Combined rotational speed (deg/s); undefined on the first pose. */
  speed: number | undefined;
  label: HeadMotionLabel;
}

interface Step3DemoContextValue {
  store: SessionStore;
  sample: PoseSample | null;
  state: DemoState;
  errorMessage: string | null;
  frameCount: number;
  onStreamChange: (stream: MediaStream | null) => void;
  onVideoElement: (video: HTMLVideoElement | null) => void;
  registerCanvas: (canvas: HTMLCanvasElement | null) => void;
}

const Step3DemoContext = createContext<Step3DemoContextValue | undefined>(undefined);

function useStep3Demo(): Step3DemoContextValue {
  const context = useContext(Step3DemoContext);
  if (context === undefined) {
    throw new Error('Step 3 demo components must be used within Step3DemoProvider');
  }
  return context;
}

// --- Head-orientation gizmo -------------------------------------------------

const DEG_TO_RAD = Math.PI / 180;

/**
 * The three head-local axes (columns of the rotation matrix) projected to 2-D,
 * for the same yaw/pitch/roll convention `headPose.ts` decomposes
 * (R = Rz(roll)·Ry(yaw)·Rx(pitch)). Only the x/y screen components are used.
 */
function headAxes(pose: HeadPose): {
  x: [number, number];
  y: [number, number];
  z: [number, number];
} {
  const cy = Math.cos(pose.yaw * DEG_TO_RAD);
  const sy = Math.sin(pose.yaw * DEG_TO_RAD);
  const cp = Math.cos(pose.pitch * DEG_TO_RAD);
  const sp = Math.sin(pose.pitch * DEG_TO_RAD);
  const cr = Math.cos(pose.roll * DEG_TO_RAD);
  const sr = Math.sin(pose.roll * DEG_TO_RAD);
  return {
    x: [cr * cy, sr * cy],
    y: [cr * sy * sp - sr * cp, sr * sy * sp + cr * cp],
    z: [cr * sy * cp + sr * sp, sr * sy * cp - cr * sp],
  };
}

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

function drawGizmo(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  features: FaceFeatures | null,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  if (!features || !features.headPose) return;

  const srcW = video.videoWidth || w;
  const srcH = video.videoHeight || h;
  // Anchor the gizmo at the nose tip (landmark index 1).
  const nose = features.landmarks[1];
  if (!nose) return;
  const [ox, oy] = coverMap(nose.x, nose.y, srcW, srcH, w, h);

  const arm = Math.min(w, h) * 0.22;
  const axes = headAxes(features.headPose);
  // Screen y grows downward, so negate the projected y component.
  const draw = (vec: [number, number], colour: string, label: string) => {
    const ex = ox + vec[0] * arm;
    const ey = oy - vec[1] * arm;
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(label, ex + 4, ey - 4);
  };

  // Z (forward) drawn last so it sits on top.
  draw(axes.y, '#5be39b', 'up');
  draw(axes.x, '#ff7b54', 'right');
  draw(axes.z, '#4c9aff', 'fwd');
}

// --- Provider ---------------------------------------------------------------

function Step3DemoProvider({ children }: { children: ReactNode }) {
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
  // Previous pose/time for the reused angular-speed calculation (015).
  const prevPoseRef = useRef<HeadPose | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  const [sample, setSample] = useState<PoseSample | null>(null);
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
      drawGizmo(canvasRef.current, video, result);
    }

    // Label this sample by reusing the pure motion-quality functions (015).
    const pose = result?.headPose ?? null;
    let poseSample: PoseSample | null = null;
    if (pose) {
      const dtMs = prevTimeRef.current === null ? 0 : ts - prevTimeRef.current;
      const speed = angularSpeedDegPerSec(prevPoseRef.current, pose, dtMs);
      const label = labelFromSpeedAndQuality(speed, pose.quality);
      prevPoseRef.current = pose;
      prevTimeRef.current = ts;
      poseSample = { pose, speed, label };
    } else {
      prevPoseRef.current = null;
      prevTimeRef.current = null;
    }

    // Throttle React updates to ~10 Hz; the gizmo itself draws every frame.
    if (ts - lastUiUpdateRef.current >= 100) {
      lastUiUpdateRef.current = ts;
      setSample(poseSample);
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
        setSample(null);
        return;
      }
      store.clear();
      frameCountRef.current = 0;
      lastUiUpdateRef.current = 0;
      prevPoseRef.current = null;
      prevTimeRef.current = null;
      setSample(null);
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

  const value = useMemo<Step3DemoContextValue>(
    () => ({
      store,
      sample,
      state,
      errorMessage,
      frameCount,
      onStreamChange,
      onVideoElement,
      registerCanvas,
    }),
    [store, sample, state, errorMessage, frameCount, onStreamChange, onVideoElement, registerCanvas],
  );

  return <Step3DemoContext.Provider value={value}>{children}</Step3DemoContext.Provider>;
}

// --- Formatting helpers -----------------------------------------------------

function formatDegrees(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(1)}°`;
}

function formatNumber(value: number | undefined, digits = 3): string {
  return value === undefined ? '—' : value.toFixed(digits);
}

function formatSpeed(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(1)}°/s`;
}

const MOTION_LABEL_TEXT: Record<HeadMotionLabel, string> = {
  low: 'Low head motion',
  moderate: 'Moderate head motion',
  uncertain: 'Uncertain — rejected',
};

// --- Live demo --------------------------------------------------------------

function Step3LiveDemo() {
  const { sample, state, errorMessage, onStreamChange, onVideoElement, registerCanvas } =
    useStep3Demo();

  const overlay = <canvas ref={registerCanvas} className="feature-overlay" />;
  const label = sample?.label;

  return (
    <div className="feature-demo">
      <CameraPreview
        onStreamChange={onStreamChange}
        onVideoElement={onVideoElement}
        overlay={overlay}
      />

      <div
        className={`motion-label${label ? ` motion-label--${label}` : ''}`}
        aria-live="polite"
      >
        <span className="motion-label__caption">Head-motion quality</span>
        <span className="motion-label__value">
          {label ? MOTION_LABEL_TEXT[label] : '—'}
        </span>
      </div>

      <dl className="readout" aria-live="polite">
        <div className="readout__item">
          <dt className="readout__label">Yaw (turn)</dt>
          <dd className="readout__value">{formatDegrees(sample?.pose.yaw)}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Pitch (nod)</dt>
          <dd className="readout__value">{formatDegrees(sample?.pose.pitch)}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Roll (tilt)</dt>
          <dd className="readout__value">{formatDegrees(sample?.pose.roll)}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Rotation speed</dt>
          <dd className="readout__value">{formatSpeed(sample?.speed)}</dd>
        </div>
      </dl>

      <p className="timing-demo__note" role="status">
        {state === 'idle' &&
          'Start the camera to estimate your head pose. The coloured gizmo points along your head’s axes. Processing stays on your device.'}
        {state === 'loading' && 'Loading the face-tracking model (served from this site)…'}
        {state === 'tracking' &&
          'Tracking head pose. Turn, nod, or tilt your head and watch the gizmo and the motion-quality label respond.'}
        {state === 'no-face' &&
          'No face detected — move into frame and ensure your face is well lit. The motion label reads “uncertain” until a face is found.'}
        {state === 'error' && (errorMessage ?? 'The face-tracking model could not be loaded.')}
      </p>

      <p className="timing-demo__note">
        Why this step matters: a moving phone or a turning head shifts where the iris sits
        in the frame, so head and phone motion can <strong>masquerade as eye movement</strong>.
        Samples labelled <strong>uncertain</strong> are too head-motion-affected to trust and
        are rejected by later event detection rather than mislabelled as gaze shifts.
      </p>

      <NoCornealReflectionPanel />
    </div>
  );
}

// --- Subprocess panels ------------------------------------------------------

function Step3DetailsPanels() {
  const { sample, state, frameCount } = useStep3Demo();

  if (state !== 'tracking' || !sample) {
    return (
      <p className="panel__empty">
        Start the camera and look into it to populate the head-pose panels.
        {state === 'no-face' && ' (No face is currently detected.)'}
      </p>
    );
  }

  const { pose, speed, label } = sample;
  const t = DEFAULT_MOTION_QUALITY_THRESHOLDS;

  return (
    <div className="panels">
      <section className="panel">
        <h3 className="panel__title">Rotation and translation</h3>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">component</th>
                <th scope="col">rotation (°)</th>
                <th scope="col">translation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>yaw / tx</td>
                <td>{formatNumber(pose.yaw, 1)}</td>
                <td>{formatNumber(pose.tx)}</td>
              </tr>
              <tr>
                <td>pitch / ty</td>
                <td>{formatNumber(pose.pitch, 1)}</td>
                <td>{formatNumber(pose.ty)}</td>
              </tr>
              <tr>
                <td>roll / tz</td>
                <td>{formatNumber(pose.roll, 1)}</td>
                <td>{formatNumber(pose.tz)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="panel__note">
          Frame {frameCount}. Translation is monocular and unscaled — especially depth (tz):
          it indicates relative change, not true distance. Yaw/pitch/roll are more reliable.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Derivation</h3>
        <ul className="panel__list">
          <li>
            Pose quality (proxy): <strong>{formatNumber(pose.quality, 2)}</strong>
          </li>
        </ul>
        <p className="panel__note">
          The face-landmark model produces a 4×4 facial transformation matrix alongside
          detection (no extra model or solvePnP pass). Its rotation block is decomposed into
          Tait-Bryan yaw/pitch/roll and its last column gives the approximate translation.
          Pose quality is proxied by mean landmark visibility, since pose is derived from the
          landmarks.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Motion-quality thresholding</h3>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">quantity</th>
                <th scope="col">value</th>
                <th scope="col">threshold</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>rotation speed</td>
                <td>{formatSpeed(speed)}</td>
                <td>
                  ≥ {t.moderateSpeedDegPerSec} → moderate; ≥ {t.uncertainSpeedDegPerSec} →
                  uncertain
                </td>
              </tr>
              <tr>
                <td>pose quality</td>
                <td>{formatNumber(pose.quality, 2)}</td>
                <td>&lt; {t.minPoseQuality} → uncertain</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="panel__note">
          Current label: <strong>{MOTION_LABEL_TEXT[label]}</strong>. Thresholds are
          documented defaults, not device-calibrated; tune them empirically per device and
          lighting.
        </p>
      </section>
    </div>
  );
}

export const step3Demo: StepDemo = {
  Provider: Step3DemoProvider,
  LiveDemo: Step3LiveDemo,
  DetailsPanels: Step3DetailsPanels,
};
