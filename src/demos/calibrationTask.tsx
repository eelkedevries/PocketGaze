import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_CALIBRATION_DOTS,
  CALIBRATION_TARGET_PX,
  placeDots,
  type CalibrationDot,
  type PlacedDot,
} from '../lib/calibrationLayout';
import { gazeFeatures, type HeadPoseAngles } from '../lib/regressionGaze';
import type { GazeCalibrationSample } from '../lib/gazeCalibration';
import type { EyeLocalSignal } from '../lib/eyeLocalSignal';
import type { SessionStore } from '../lib/sessionStore';

// Follow-the-dots calibration task (specification §3.5, §6.2, §2.8).
//
// Presents targets at known positions with safe margins and phone-suitable
// sizes, and captures the concurrent eye-local signal (plus head pose) at
// each. Capture is QUALITY-GATED: frames during blinks or with low signal
// quality are skipped, so they never contaminate the fit; a tick budget per
// dot keeps the task moving even when quality stays poor. It writes
// `calibration` rows (target in CSS px AND normalised, plus the eye-local
// signal) and `calibration_target` events to the shared session model, and
// hands the collected (features → target) pairs to `onComplete` for the fit
// (`022`). It does not fit the mapping itself (that is `022`/`023`).

const SETTLE_MS = 700;
const SAMPLE_INTERVAL_MS = 70;
/** Valid samples wanted per dot. More samples per target make the per-target
 *  outlier trimming and the least-squares fit meaningfully more robust. */
const SAMPLES_PER_DOT = 12;
/** Capture attempts allowed per dot before moving on with what was caught. */
const MAX_TICKS_PER_DOT = 24;
/** Eye-local signal quality below which a capture frame is skipped. */
const MIN_CAPTURE_QUALITY = 0.4;

type Phase = 'settle' | 'capture';
type Status = 'idle' | 'running' | 'done';

/** Per-frame inputs the task samples from the host demo's camera loop. */
export interface CalibrationCapture {
  signal: EyeLocalSignal;
  /** Head-pose angles for the same frame (folded into the features), or null. */
  headPose: HeadPoseAngles | null;
  /** False during a blink — such frames are skipped. */
  eyesOpen: boolean;
}

interface CalibrationTaskProps {
  store: SessionStore;
  /** Latest capture inputs from the host's camera loop (null when no face). */
  getCapture: () => CalibrationCapture | null;
  /** Receives the collected feature→target pairs when the sequence completes. */
  onComplete: (samples: GazeCalibrationSample[]) => void;
  /** Called when the user stops the task before completion. */
  onCancel?: () => void;
  dots?: CalibrationDot[];
}

export default function CalibrationTask({
  store,
  getCapture,
  onComplete,
  onCancel,
  dots = DEFAULT_CALIBRATION_DOTS,
}: CalibrationTaskProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const samplesRef = useRef<GazeCalibrationSample[]>([]);

  const [status, setStatus] = useState<Status>('idle');
  const [placed, setPlaced] = useState<PlacedDot[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('settle');

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Log viewport / orientation changes during the task (§3.5).
  useEffect(() => {
    if (status !== 'running') return;
    const onResize = () => {
      const el = stageRef.current;
      if (!el) return;
      store.addStimulus({
        task_phase: 'viewport_change',
        target_x: el.clientWidth,
        target_y: el.clientHeight,
      });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [status, store]);

  const finish = useCallback(() => {
    clearTimer();
    setStatus('done');
    onComplete(samplesRef.current);
  }, [clearTimer, onComplete]);

  // Drive the sequence: for each dot, settle then capture a few samples.
  useEffect(() => {
    if (status !== 'running') return;
    if (index >= placed.length) {
      finish();
      return;
    }
    const dot = placed[index];

    if (phase === 'settle') {
      store.addEvent({
        event_type: 'calibration_target',
        event_start_ms: store.elapsedMs(),
      });
      timerRef.current = setTimeout(() => setPhase('capture'), SETTLE_MS);
      return () => clearTimer();
    }

    // capture phase: take quality-gated samples, then advance. Blink frames
    // and low-quality detections are skipped rather than recorded; the tick
    // budget ensures a dot never blocks the sequence when quality stays poor.
    let taken = 0;
    let ticks = 0;
    const tick = () => {
      const capture = getCapture();
      ticks += 1;
      if (capture && capture.eyesOpen && capture.signal.quality >= MIN_CAPTURE_QUALITY) {
        const { signal, headPose } = capture;
        samplesRef.current.push({
          features: gazeFeatures(signal, headPose),
          target: { x: dot.nx, y: dot.ny },
        });
        store.addCalibration({
          target_x: dot.px,
          target_y: dot.py,
          target_nx: dot.nx,
          target_ny: dot.ny,
          target_id: dot.id,
          task_phase: 'calibration',
          left_eye_x: signal.left.x,
          left_eye_y: signal.left.y,
          right_eye_x: signal.right.x,
          right_eye_y: signal.right.y,
          combined_eye_x: signal.combined.x,
          combined_eye_y: signal.combined.y,
          signal_type: 'eye_local',
        });
        taken += 1;
      }
      if (taken >= SAMPLES_PER_DOT || ticks >= MAX_TICKS_PER_DOT) {
        setPhase('settle');
        setIndex((i) => i + 1);
      } else {
        timerRef.current = setTimeout(tick, SAMPLE_INTERVAL_MS);
      }
    };
    timerRef.current = setTimeout(tick, SAMPLE_INTERVAL_MS);
    return () => clearTimer();
  }, [status, index, phase, placed, store, getCapture, finish, clearTimer]);

  const start = useCallback(() => {
    const el = stageRef.current;
    const viewport = el
      ? { width: el.clientWidth, height: el.clientHeight }
      : { width: window.innerWidth, height: window.innerHeight };
    samplesRef.current = [];
    setPlaced(placeDots(dots, viewport));
    setIndex(0);
    setPhase('settle');
    setStatus('running');
  }, [dots]);

  const stop = useCallback(() => {
    clearTimer();
    setStatus('idle');
    setIndex(0);
    setPhase('settle');
    samplesRef.current = [];
    onCancel?.();
  }, [clearTimer, onCancel]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const active = status === 'running' ? placed[index] : undefined;

  return (
    <div className="calibration">
      <div className="calibration__controls">
        {status !== 'running' ? (
          <button type="button" className="button" onClick={start}>
            {status === 'done' ? 'Recalibrate' : 'Start calibration'}
          </button>
        ) : (
          <button type="button" className="button" onClick={stop}>
            Stop / reset
          </button>
        )}
        <span className="calibration__progress" aria-live="polite">
          {status === 'running' && `Target ${index + 1} of ${placed.length}`}
          {status === 'done' && 'Calibration complete.'}
          {status === 'idle' && 'Look at each dot as it appears.'}
        </span>
      </div>

      <div ref={stageRef} className="calibration__stage">
        {active && (
          <span
            className={`calibration__dot calibration__dot--${phase}`}
            style={{
              left: `${active.px}px`,
              top: `${active.py}px`,
              width: `${CALIBRATION_TARGET_PX}px`,
              height: `${CALIBRATION_TARGET_PX}px`,
            }}
            aria-label={`Calibration target ${active.id}`}
          />
        )}
      </div>
    </div>
  );
}
