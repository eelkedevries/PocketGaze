import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CALIBRATION_TARGET_PX,
  placeDots,
  type CalibrationDot,
  type PlacedDot,
} from '../lib/calibrationLayout';
import { screenGazeSampleFields, type ScreenGazeEstimate } from '../lib/screenGaze';
import type { SessionStore } from '../lib/sessionStore';

// Follow-the-dots VALIDATION task (specification §3.5, §6.2, §6.3).
//
// Validation is deliberately SEPARATE from calibration (`021`). It presents a
// fresh grid of targets the calibration mapping never saw, holds each fixation
// steady, and records the concurrent FITTED screen-gaze estimate (provider A) so
// `036` can measure accuracy and precision on held-out points. Measuring error
// on the calibration targets would only reflect the fit, not on-screen accuracy
// (§6.3); a distinct validation phase is the field-standard way to report data
// quality.
//
// It writes the held-out samples into the shared session model as `quality` rows
// tagged `task_phase: 'validation'` (target in CSS px AND normalised, plus the
// estimate), and a `stimulus` marker per target — both kept distinct from the
// `calibration` rows and `calibration_target` events. It does NOT compute any
// metric or draw an error map (that is `036`), and never refits the mapping.

const SETTLE_MS = 800;
const SAMPLE_INTERVAL_MS = 80;
const SAMPLES_PER_TARGET = 8;
/** Capture attempts allowed per target before moving on with what was caught. */
const MAX_TICKS_PER_TARGET = 16;

/**
 * A validation grid OFFSET from the 9 calibration points. The default
 * calibration grid uses fractions in {0, 0.5, 1}; every validation target below
 * uses at least one fraction in {0.25, 0.75}, so none coincide with a
 * calibration target — an inner diagonal ring plus an offset cross of edge
 * midpoints.
 */
export const DEFAULT_VALIDATION_DOTS: CalibrationDot[] = [
  { id: 'v-tl', fx: 0.25, fy: 0.25 },
  { id: 'v-tr', fx: 0.75, fy: 0.25 },
  { id: 'v-bl', fx: 0.25, fy: 0.75 },
  { id: 'v-br', fx: 0.75, fy: 0.75 },
  { id: 'v-tc', fx: 0.5, fy: 0.25 },
  { id: 'v-bc', fx: 0.5, fy: 0.75 },
  { id: 'v-ml', fx: 0.25, fy: 0.5 },
  { id: 'v-mr', fx: 0.75, fy: 0.5 },
];

type Phase = 'settle' | 'capture';
type Status = 'idle' | 'running' | 'done';

interface ValidationTaskProps {
  store: SessionStore;
  /** Latest FITTED screen-gaze estimate from the host's camera loop (provider A). */
  getEstimate: () => ScreenGazeEstimate;
  /**
   * Optional capture gate: frames for which this returns false (e.g. blinks)
   * are skipped. Data-quality validation conventionally excludes blink frames
   * from accuracy/precision — they measure the eyelid, not the estimate.
   */
  isSampleValid?: () => boolean;
  /** Receives the number of held-out estimate samples captured when complete. */
  onComplete?: (capturedCount: number) => void;
  /** Called when the user stops the task before completion. */
  onCancel?: () => void;
  dots?: CalibrationDot[];
}

export default function ValidationTask({
  store,
  getEstimate,
  isSampleValid,
  onComplete,
  onCancel,
  dots = DEFAULT_VALIDATION_DOTS,
}: ValidationTaskProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedRef = useRef(0);

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

  const finish = useCallback(() => {
    clearTimer();
    setStatus('done');
    onComplete?.(capturedRef.current);
  }, [clearTimer, onComplete]);

  // Drive the sequence: for each target, settle then capture a few estimates.
  useEffect(() => {
    if (status !== 'running') return;
    if (index >= placed.length) {
      finish();
      return;
    }
    const dot = placed[index];

    if (phase === 'settle') {
      // Mark the validation target presentation — a `stimulus` row tagged
      // `validation`, distinct from the `calibration_target` event (`021`).
      store.addStimulus({
        task_phase: 'validation',
        target_x: dot.px,
        target_y: dot.py,
        target_nx: dot.nx,
        target_ny: dot.ny,
        target_id: dot.id,
      });
      timerRef.current = setTimeout(() => setPhase('capture'), SETTLE_MS);
      return () => clearTimer();
    }

    // capture phase: record quality-gated held-out estimates, then advance.
    // Frames without an estimate or failing the validity gate (blinks) are
    // skipped; the tick budget keeps the sequence moving regardless.
    let taken = 0;
    let ticks = 0;
    const tick = () => {
      const estimate = getEstimate();
      ticks += 1;
      if (estimate.gaze_available && (isSampleValid?.() ?? true)) {
        capturedRef.current += 1;
        // A `quality` row tagged `validation`: the held-out target (CSS px AND
        // normalised) paired with the concurrent fitted estimate. Not relabelled
        // as calibration; `036` reads these to compute accuracy/precision.
        store.addQuality({
          task_phase: 'validation',
          target_x: dot.px,
          target_y: dot.py,
          target_nx: dot.nx,
          target_ny: dot.ny,
          target_id: dot.id,
          ...screenGazeSampleFields(estimate),
        });
        taken += 1;
      }
      if (taken >= SAMPLES_PER_TARGET || ticks >= MAX_TICKS_PER_TARGET) {
        setPhase('settle');
        setIndex((i) => i + 1);
      } else {
        timerRef.current = setTimeout(tick, SAMPLE_INTERVAL_MS);
      }
    };
    timerRef.current = setTimeout(tick, SAMPLE_INTERVAL_MS);
    return () => clearTimer();
  }, [status, index, phase, placed, store, getEstimate, isSampleValid, finish, clearTimer]);

  const start = useCallback(() => {
    const el = stageRef.current;
    const viewport = el
      ? { width: el.clientWidth, height: el.clientHeight }
      : { width: window.innerWidth, height: window.innerHeight };
    capturedRef.current = 0;
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
    capturedRef.current = 0;
    onCancel?.();
  }, [clearTimer, onCancel]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const active = status === 'running' ? placed[index] : undefined;

  return (
    <div className="calibration validation">
      <div className="calibration__controls">
        {status !== 'running' ? (
          <button type="button" className="button" onClick={start}>
            {status === 'done' ? 'Re-run validation' : 'Start validation'}
          </button>
        ) : (
          <button type="button" className="button" onClick={stop}>
            Stop / reset
          </button>
        )}
        <span className="calibration__progress" aria-live="polite">
          {status === 'running' && `Validation target ${index + 1} of ${placed.length}`}
          {status === 'done' &&
            `Validation complete — ${capturedRef.current} held-out samples captured.`}
          {status === 'idle' && 'Validation uses fresh targets the calibration never saw.'}
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
            aria-label={`Validation target ${active.id}`}
          />
        )}
      </div>
    </div>
  );
}
