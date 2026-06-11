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
import { eyeLocalSignalFromFeatures } from '../lib/eyeLocalSignal';
import { SignalFilterSet, DEFAULT_ONE_EURO_PARAMS } from '../lib/oneEuroFilter';
import { SampleSuppressor, DEFAULT_SUPPRESSION_THRESHOLDS } from '../lib/suppression';
import {
  detectEvents,
  sampleSpeedPerSec,
  DEFAULT_EVENT_DETECTION_THRESHOLDS,
  type DetectedEvent,
  type EventSampleInput,
} from '../lib/eventDetection';
import { meanDegreesPerNormalised } from '../lib/visualAngle';
import type { Fixation } from '../lib/fixationAggregation';
import ScanpathHeatmap from './scanpathHeatmap';
import { SessionStore } from '../lib/sessionStore';
import ExportButton from '../components/ExportButton';
import EventDetectionLab from '../components/EventDetectionLab';
import type { StepDemo } from './registry';

// Step 6 live demo: wire One Euro filtering (024), blink/quality suppression
// (025), and candidate event detection (026) into a live pipeline, showing raw
// vs filtered eye-local traces together and cautiously-labelled candidate
// events (specification §3.6, §2.5, §2.6; Domain rules §6.3, §6.4).

type DemoState = 'idle' | 'loading' | 'tracking' | 'no-face' | 'error';

const TRACE_CAPACITY = 180; // ~6 s at 30 fps
const EVENT_DETECT_INTERVAL_MS = 500; // re-run detection at most every 500 ms

interface TraceSample {
  timeMs: number;
  rawX: number;
  filtX: number;
  valid: boolean;
  blink: boolean;
}

interface Step6DemoContextValue {
  store: SessionStore;
  state: DemoState;
  errorMessage: string | null;
  traceSamples: TraceSample[];
  recentEvents: DetectedEvent[];
  /** Live One Euro parameters and a setter (051 demo control). */
  filterParams: { minCutoff: number; beta: number };
  setFilterParams: (next: { minCutoff: number; beta: number }) => void;
  /** Representative angular scale (estimated degrees per normalised unit), or null. */
  degPerNorm: number | null;
  /** Accumulated fixation centroids (eye-local mapped to 0–1), for scanpath/heatmap (044). */
  fixations: Fixation[];
  /** Rolling eye-local velocity (units/s) of the filtered signal, for the threshold trace (053). */
  velocitySamples: Array<{ speed: number; valid: boolean }>;
  onStreamChange: (stream: MediaStream | null) => void;
  onVideoElement: (video: HTMLVideoElement | null) => void;
}

const Step6DemoContext = createContext<Step6DemoContextValue | undefined>(undefined);

function useStep6Demo(): Step6DemoContextValue {
  const ctx = useContext(Step6DemoContext);
  if (ctx === undefined) {
    throw new Error('Step 6 demo components must be used within Step6DemoProvider');
  }
  return ctx;
}

function Step6DemoProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SessionStore | null>(null);
  if (storeRef.current === null) storeRef.current = new SessionStore();
  const store = storeRef.current;

  const extractorRef = useRef<FaceFeatureExtractor | null>(null);
  if (extractorRef.current === null) extractorRef.current = new FaceFeatureExtractor();
  const extractor = extractorRef.current;

  const filterRef = useRef<SignalFilterSet | null>(null);
  if (filterRef.current === null) filterRef.current = new SignalFilterSet();

  const [filterParams, setFilterParamsState] = useState<{ minCutoff: number; beta: number }>({
    minCutoff: DEFAULT_ONE_EURO_PARAMS.minCutoff,
    beta: DEFAULT_ONE_EURO_PARAMS.beta,
  });
  const setFilterParams = useCallback((next: { minCutoff: number; beta: number }) => {
    // Recreate the filter with the new parameters (reuses the existing maths).
    filterRef.current = new SignalFilterSet({ ...DEFAULT_ONE_EURO_PARAMS, ...next });
    setFilterParamsState(next);
  }, []);

  const suppressorRef = useRef<SampleSuppressor | null>(null);
  if (suppressorRef.current === null) suppressorRef.current = new SampleSuppressor();

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rvfcRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const frameCountRef = useRef(0);
  const prevTsRef = useRef<number | null>(null);
  const lastUiRef = useRef(0);
  const lastDetectRef = useRef(0);

  // Ring buffers kept in refs — updated every frame, flushed to state at ~10 Hz.
  const traceRef = useRef<TraceSample[]>([]);
  // Accumulate valid event-detection inputs (used by detectEvents).
  const eventInputsRef = useRef<EventSampleInput[]>([]);
  // Accumulated fixation centroids and the start times already collected.
  const fixationsRef = useRef<Fixation[]>([]);
  const seenFixationStartsRef = useRef<Set<number>>(new Set());
  // Rolling eye-local velocity of the filtered signal + the previous filtered point.
  const velocityRef = useRef<Array<{ speed: number; valid: boolean }>>([]);
  const prevFilteredRef = useRef<{ timeMs: number; x: number; y: number } | null>(null);

  const [state, setState] = useState<DemoState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [traceSamples, setTraceSamples] = useState<TraceSample[]>([]);
  const [recentEvents, setRecentEvents] = useState<DetectedEvent[]>([]);
  const [degPerNorm, setDegPerNorm] = useState<number | null>(null);
  const [fixations, setFixations] = useState<Fixation[]>([]);
  const [velocitySamples, setVelocitySamples] = useState<Array<{ speed: number; valid: boolean }>>(
    [],
  );

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    const video = videoElRef.current;
    if (rvfcRef.current !== null && video && 'cancelVideoFrameCallback' in video) {
      (video as HTMLVideoElement & { cancelVideoFrameCallback: (h: number) => void }).cancelVideoFrameCallback(
        rvfcRef.current,
      );
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
    const features = extractor.processFrame(video, ts, store, frameCountRef.current);

    const dtSec = prevTsRef.current === null ? 1 / 30 : (ts - prevTsRef.current) / 1000;
    prevTsRef.current = ts;

    const filter = filterRef.current!;
    const suppressor = suppressorRef.current!;

    let rawX = 0;
    let filtX = 0;
    let valid = false;
    let blink = false;

    const imageAspect = video.videoHeight > 0 ? video.videoWidth / video.videoHeight : 1;
    const signal = features ? eyeLocalSignalFromFeatures(features, imageAspect) : null;
    if (features && signal) {
      const filtered = filter.filterEyeLocal(signal, dtSec);
      const sup = suppressor.process({
        timeMs: ts,
        leftEyeOpen: features.leftEye.isOpen,
        rightEyeOpen: features.rightEye.isOpen,
        faceDetected: true,
        quality: signal.quality,
      });

      rawX = signal.combined.x;
      filtX = filtered.combined_eye_x_filtered ?? signal.combined.x;
      const filtY = filtered.combined_eye_y_filtered ?? signal.combined.y;
      valid = sup.valid;
      blink = sup.blink_state === 'closed';

      if (valid) {
        eventInputsRef.current.push({
          timeMs: ts,
          x: filtX,
          y: filtY,
          valid: true,
          headMotionLabel: features.headPose?.quality != null && features.headPose.quality >= 0.4
            ? 'low'
            : 'uncertain',
        });
        // Keep the buffer from growing unboundedly.
        if (eventInputsRef.current.length > TRACE_CAPACITY) {
          eventInputsRef.current = eventInputsRef.current.slice(-TRACE_CAPACITY);
        }
        // Rolling velocity of the filtered signal, reusing the detection speed
        // (sampleSpeedPerSec only reads timeMs/x/y, so the cast is safe).
        const cur = { timeMs: ts, x: filtX, y: filtY };
        const prev = prevFilteredRef.current;
        const speed = prev
          ? sampleSpeedPerSec(prev as EventSampleInput, cur as EventSampleInput) ?? 0
          : 0;
        velocityRef.current.push({ speed, valid: true });
        prevFilteredRef.current = cur;
      } else {
        velocityRef.current.push({ speed: 0, valid: false });
        prevFilteredRef.current = null; // invalid samples break the velocity run
      }
      if (velocityRef.current.length > TRACE_CAPACITY) {
        velocityRef.current = velocityRef.current.slice(-TRACE_CAPACITY);
      }
    } else {
      velocityRef.current.push({ speed: 0, valid: false });
      prevFilteredRef.current = null;
      if (velocityRef.current.length > TRACE_CAPACITY) {
        velocityRef.current = velocityRef.current.slice(-TRACE_CAPACITY);
      }
      suppressor.process({
        timeMs: ts,
        leftEyeOpen: true,
        rightEyeOpen: true,
        faceDetected: false,
        quality: 0,
      });
    }

    // Append to rolling trace buffer.
    const buf = traceRef.current;
    buf.push({ timeMs: ts, rawX, filtX, valid, blink });
    if (buf.length > TRACE_CAPACITY) buf.splice(0, buf.length - TRACE_CAPACITY);

    // Throttle UI updates to ~10 Hz.
    if (ts - lastUiRef.current >= 100) {
      lastUiRef.current = ts;
      setTraceSamples([...traceRef.current]);
      setVelocitySamples([...velocityRef.current]);
      setState(features ? 'tracking' : 'no-face');

      // Re-run event detection periodically.
      if (ts - lastDetectRef.current >= EVENT_DETECT_INTERVAL_MS) {
        lastDetectRef.current = ts;
        const detected = detectEvents(eventInputsRef.current);
        if (detected.length > 0) {
          setRecentEvents((prev) => {
            const merged = [...prev, ...detected];
            // Keep last 8 events.
            return merged.slice(-8);
          });
          // Accumulate fixation centroids (new fixations only) for scanpath/heatmap (044).
          // The eye-local signal is ~[-1, 1]; map it into a 0–1 display space.
          const toUnit = (v: number) => Math.min(1, Math.max(0, (v + 1) / 2));
          let added = false;
          for (const ev of detected) {
            if (ev.event_type !== 'fixation_candidate') continue;
            if (seenFixationStartsRef.current.has(ev.event_start_ms)) continue;
            const within = eventInputsRef.current.filter(
              (s) => s.timeMs >= ev.event_start_ms && s.timeMs <= ev.event_end_ms,
            );
            if (within.length === 0) continue;
            const cx = within.reduce((a, s) => a + s.x, 0) / within.length;
            const cy = within.reduce((a, s) => a + s.y, 0) / within.length;
            seenFixationStartsRef.current.add(ev.event_start_ms);
            fixationsRef.current.push({
              x: toUnit(cx),
              y: toUnit(cy),
              durationMs: ev.event_end_ms - ev.event_start_ms,
            });
            added = true;
          }
          if (added) {
            // Keep the most recent fixations for a manageable visualisation.
            fixationsRef.current = fixationsRef.current.slice(-40);
            setFixations([...fixationsRef.current]);
          }
        }
        // Representative angular scale from recent samples, for estimated
        // saccade amplitude in degrees (040). Bounded scan over the last samples.
        setDegPerNorm(meanDegreesPerNormalised(store.byType('sample').slice(-TRACE_CAPACITY)));
      }
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
        return;
      }
      store.clear();
      frameCountRef.current = 0;
      prevTsRef.current = null;
      lastUiRef.current = 0;
      lastDetectRef.current = 0;
      traceRef.current = [];
      eventInputsRef.current = [];
      velocityRef.current = [];
      prevFilteredRef.current = null;
      fixationsRef.current = [];
      seenFixationStartsRef.current = new Set();
      filterRef.current!.reset();
      suppressorRef.current!.reset();
      setTraceSamples([]);
      setRecentEvents([]);
      setDegPerNorm(null);
      setFixations([]);
      setVelocitySamples([]);
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

  useEffect(
    () => () => {
      stopLoop();
      extractor.close();
    },
    [extractor, stopLoop],
  );

  const value = useMemo<Step6DemoContextValue>(
    () => ({
      store,
      state,
      errorMessage,
      traceSamples,
      recentEvents,
      filterParams,
      setFilterParams,
      degPerNorm,
      fixations,
      velocitySamples,
      onStreamChange,
      onVideoElement,
    }),
    [
      store,
      state,
      errorMessage,
      traceSamples,
      recentEvents,
      filterParams,
      setFilterParams,
      degPerNorm,
      fixations,
      velocitySamples,
      onStreamChange,
      onVideoElement,
    ],
  );

  return <Step6DemoContext.Provider value={value}>{children}</Step6DemoContext.Provider>;
}

// --- Trace canvas -----------------------------------------------------------

const TRACE_HEIGHT = 120;

function SignalTrace({ samples }: { samples: TraceSample[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background.
    ctx.fillStyle = '#1b2330';
    ctx.fillRect(0, 0, W, H);

    if (samples.length < 2) return;

    // Map value in [-1, 1] to canvas y.
    const toY = (v: number) => H / 2 - (v / 2) * (H * 0.42);
    // Map sample index to canvas x.
    const toX = (i: number) => (i / (samples.length - 1)) * W;

    // Shade blink/invalid intervals.
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.blink || !s.valid) {
        ctx.fillStyle = s.blink ? 'rgba(76,154,255,0.12)' : 'rgba(255,100,80,0.12)';
        const x = toX(i);
        const nextX = i + 1 < samples.length ? toX(i + 1) : W;
        ctx.fillRect(x, 0, nextX - x + 1, H);
      }
    }

    // Zero line.
    ctx.strokeStyle = 'rgba(155,172,196,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Draw a polyline from an array of [x, y] pairs.
    function drawLine(points: Array<[number, number]>, color: string, width: number) {
      if (!ctx || points.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let k = 1; k < points.length; k++) {
        ctx.lineTo(points[k][0], points[k][1]);
      }
      ctx.stroke();
    }

    // Raw trace — break on invalid segments.
    let rawSeg: Array<[number, number]> = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.valid || s.blink) {
        rawSeg.push([toX(i), toY(s.rawX)]);
      } else {
        drawLine(rawSeg, 'rgba(155,172,196,0.55)', 1.5);
        rawSeg = [];
      }
    }
    drawLine(rawSeg, 'rgba(155,172,196,0.55)', 1.5);

    // Filtered trace — break on invalid (non-blink) segments.
    let filtSeg: Array<[number, number]> = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.valid) {
        filtSeg.push([toX(i), toY(s.filtX)]);
      } else {
        drawLine(filtSeg, '#4c9aff', 2);
        filtSeg = [];
      }
    }
    drawLine(filtSeg, '#4c9aff', 2);

    // Legend in top-left.
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(155,172,196,0.8)';
    ctx.fillText('raw', 6, 14);
    ctx.fillStyle = '#4c9aff';
    ctx.fillText('filtered', 6, 28);
  }, [samples]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={TRACE_HEIGHT}
      className="signal-trace"
      aria-label="Raw and filtered combined eye-local signal (horizontal)"
    />
  );
}

// --- Velocity trace with the detection threshold (053) ----------------------

function VelocityTrace({
  samples,
  threshold,
}: {
  samples: Array<{ speed: number; valid: boolean }>;
  threshold: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b2330';
    ctx.fillRect(0, 0, W, H);

    // Scale so the threshold sits at ~45% height, with headroom for spikes.
    const vMax = Math.max(threshold * 2.2, ...samples.map((s) => s.speed), 1);
    const toY = (v: number) => H - (Math.min(vMax, Math.max(0, v)) / vMax) * H;

    // Shade where the velocity crosses the threshold (saccade candidates arise).
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].valid && samples[i].speed >= threshold) {
        const x = (i / Math.max(1, samples.length - 1)) * W;
        const nextX = i + 1 < samples.length ? ((i + 1) / (samples.length - 1)) * W : W;
        ctx.fillStyle = 'rgba(255,123,84,0.18)';
        ctx.fillRect(x, 0, nextX - x + 1, H);
      }
    }

    // Threshold line.
    const ty = toY(threshold);
    ctx.strokeStyle = 'rgba(255,123,84,0.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(W, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,123,84,0.95)';
    ctx.font = '10px monospace';
    ctx.fillText(`saccade ≥ ${threshold} units/s`, 6, ty - 4);

    // Velocity trace (break on invalid samples).
    ctx.strokeStyle = '#4c9aff';
    ctx.lineWidth = 1.6;
    let started = false;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = (i / Math.max(1, samples.length - 1)) * W;
      const y = toY(s.speed);
      if (!s.valid) {
        started = false;
        return;
      }
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }, [samples, threshold]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={120}
      className="signal-trace"
      aria-label="Eye-local velocity trace with the saccade-detection threshold line"
    />
  );
}

// --- Event label formatting --------------------------------------------------

const EVENT_LABELS: Record<string, string> = {
  fixation_candidate: 'Fixation candidate',
  saccade_head_still: 'Saccade (head still)',
  saccade_during_head_movement: 'Saccade (head moving)',
  saccade_candidate: 'Saccade candidate',
  uncertain_head_motion: 'Uncertain (head motion)',
  blink: 'Blink',
  tracking_lost: 'Tracking lost',
};

function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}

function eventClass(type: string): string {
  if (type === 'fixation_candidate') return 'event-tag event-tag--fixation';
  if (type.startsWith('saccade')) return 'event-tag event-tag--saccade';
  if (type === 'uncertain_head_motion') return 'event-tag event-tag--uncertain';
  return 'event-tag';
}

// --- Live demo ---------------------------------------------------------------

function Step6LiveDemo() {
  const {
    state,
    errorMessage,
    traceSamples,
    recentEvents,
    filterParams,
    setFilterParams,
    degPerNorm,
    fixations,
    onStreamChange,
    onVideoElement,
  } = useStep6Demo();
  const running = state === 'tracking' || state === 'no-face';

  return (
    <div className="timing-demo">
      <CameraPreview onStreamChange={onStreamChange} onVideoElement={onVideoElement} />

      <p className="timing-demo__note" role="status">
        {state === 'idle' &&
          'Start the camera to see the raw and filtered eye-local signal together with candidate events. Processing stays on your device.'}
        {state === 'loading' && 'Loading the face-tracking model (served from this site)…'}
        {state === 'tracking' &&
          'Camera running. The blue trace is One Euro–filtered; the faint trace is raw. Blink or look away to see suppression in action.'}
        {state === 'no-face' && 'No face detected — move into the frame.'}
        {state === 'error' &&
          (errorMessage ?? 'The face-tracking model could not be loaded.')}
      </p>

      {running && (
        <>
          <div className="signal-trace-wrap" aria-label="Eye-local signal trace">
            <SignalTrace samples={traceSamples} />
            <p className="timing-demo__note">
              Horizontal eye-local signal (combined, normalised). Blue shading = blink; red shading = tracking lost.
            </p>
          </div>

          <div className="filter-sliders">
            <label className="content-demo__zoom">
              One Euro β (speed coefficient)
              <input
                type="range"
                min={0}
                max={0.1}
                step={0.001}
                value={filterParams.beta}
                onChange={(e) =>
                  setFilterParams({ ...filterParams, beta: Number(e.target.value) })
                }
              />
              <span className="content-demo__zoom-value">{filterParams.beta.toFixed(3)}</span>
            </label>
            <label className="content-demo__zoom">
              Min cutoff (Hz)
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={filterParams.minCutoff}
                onChange={(e) =>
                  setFilterParams({ ...filterParams, minCutoff: Number(e.target.value) })
                }
              />
              <span className="content-demo__zoom-value">{filterParams.minCutoff.toFixed(1)}</span>
            </label>
            <p className="timing-demo__note">
              The trade-off, made felt: a <strong>lower β / lower cutoff</strong> smooths jitter at
              rest but adds <strong>lag</strong>; a <strong>higher β</strong> cuts lag during fast
              movement but lets more <strong>jitter</strong> through. Demo control only — the
              recorded data is unchanged.
            </p>
          </div>

          <div className="event-stream" aria-live="polite" aria-label="Candidate event stream">
            <p className="event-stream__label">Candidate events (most recent first):</p>
            {recentEvents.length === 0 ? (
              <p className="timing-demo__note">No candidate events yet — fixate or make a quick eye movement.</p>
            ) : (
              <ul className="event-stream__list">
                {[...recentEvents].reverse().map((e, i) => {
                  const isSaccade =
                    (e.event_type as string).startsWith('saccade') ||
                    e.event_type === 'uncertain_head_motion';
                  const ampDeg =
                    isSaccade && degPerNorm != null
                      ? ` · ≈ ${(e.amplitude * degPerNorm).toFixed(1)}° (estimated)`
                      : '';
                  return (
                    <li key={i} className={eventClass(e.event_type as string)}>
                      <span className="event-tag__type">{eventLabel(e.event_type as string)}</span>
                      <span className="event-tag__meta">
                        {e.event_end_ms - e.event_start_ms} ms · confidence{' '}
                        {e.event_confidence.toFixed(2)}
                        {ampDeg}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="timing-demo__note">
              Events are cautious <strong>candidates</strong> only — they are not validated detections (§6.3).
              Any saccade amplitude in degrees is a rough <strong>estimate</strong> from the
              IPD-based angular scale (assumed IPD, camera FOV, and screen size), not a measurement.
            </p>
          </div>

          <ScanpathHeatmap fixations={fixations} />
        </>
      )}

      <EventDetectionLab />
    </div>
  );
}

// --- Subprocess panels -------------------------------------------------------

// TODO (071): "unstable candidate events" (events flickering near the thresholds)
// is not yet a distinct, reliable detector — per-event confidence exists, but a
// stability signal across consecutive events does not. We surface per-event
// confidence rather than guessing an instability warning from weak evidence.
function Step6DetailsPanels() {
  const { state, recentEvents, filterParams, velocitySamples, store } = useStep6Demo();
  const running = state === 'tracking' || state === 'no-face';
  const p = { ...DEFAULT_ONE_EURO_PARAMS, ...filterParams };
  const s = DEFAULT_SUPPRESSION_THRESHOLDS;
  const e = DEFAULT_EVENT_DETECTION_THRESHOLDS;

  if (!running) {
    return (
      <p className="panel__empty">
        Start the camera in the demo above to populate the filtering and event panels.
      </p>
    );
  }

  return (
    <div className="panels">
      <section className="panel">
        <h3 className="panel__title">Export session data</h3>
        <p className="panel__note">
          Download this step’s accumulated rows (samples, candidate events, and quality) as a
          single CSV. Derived signals only — never raw frames or landmarks. Nothing is uploaded.
        </p>
        <ExportButton store={store} />
      </section>
      <section className="panel">
        <h3 className="panel__title">Velocity vs the saccade threshold</h3>
        <VelocityTrace
          samples={velocitySamples}
          threshold={DEFAULT_EVENT_DETECTION_THRESHOLDS.saccadeSpeedPerSec}
        />
        <p className="panel__note">
          The eye-local speed of the filtered signal (units/s), with the{' '}
          <code>saccadeSpeedPerSec</code> ={' '}
          {DEFAULT_EVENT_DETECTION_THRESHOLDS.saccadeSpeedPerSec} threshold as the dashed line. Where
          the trace crosses above it (shaded), inter-sample segments are classified saccade-like —
          the detection criterion made visible. Invalid (blink/tracking-lost) samples break the
          trace.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">One Euro filter parameters</h3>
        <ul className="panel__list">
          <li>
            Filter name: <strong>one-euro</strong>
          </li>
          <li>
            Minimum cutoff (<code>minCutoff</code>): <strong>{p.minCutoff} Hz</strong> — lower = smoother at rest, more
            lag
          </li>
          <li>
            Speed coefficient (<code>beta</code>): <strong>{p.beta}</strong> — higher = less lag during fast movement
          </li>
          <li>
            Derivative cutoff (<code>dCutoff</code>): <strong>{p.dCutoff} Hz</strong>
          </li>
        </ul>
        <p className="panel__note">
          The filter raises its cutoff during fast movement (reducing lag) and lowers it during slow movement
          (reducing jitter). These are documented defaults — not device-calibrated. Over-smoothing erases rapid
          movements; under-smoothing passes through noise as false events.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Blink suppression &amp; quality thresholds</h3>
        <ul className="panel__list">
          <li>
            Minimum blink duration: <strong>{s.minBlinkMs} ms</strong> — shorter closures treated as landmark noise
          </li>
          <li>
            Minimum valid quality: <strong>{s.minValidQuality}</strong> — samples below are excluded from event
            detection
          </li>
          <li>
            Tracking-lost threshold: <strong>{s.trackingLostMs} ms</strong> — continuous invalid tracking at/above this
            is a <code>tracking_lost</code> event
          </li>
        </ul>
        <p className="panel__note">
          Blinks (both eyes closed) and low-quality samples are marked invalid so they do not reach event detection as
          false eye-movement signals. The raw signal columns are preserved regardless.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Velocity / displacement event logic</h3>
        <ul className="panel__list">
          <li>
            Saccade speed threshold: <strong>{e.saccadeSpeedPerSec} eye-local units/s</strong> — segments at/above
            become saccade-like
          </li>
          <li>
            Minimum fixation duration: <strong>{e.minFixationMs} ms</strong>
          </li>
          <li>
            Maximum fixation dispersion: <strong>{e.maxFixationDispersion} units</strong> — wider low-speed runs are
            treated as drift
          </li>
          <li>
            Head-motion context: saccades re-labelled as <code>saccade_head_still</code>,{' '}
            <code>saccade_during_head_movement</code>, or <code>uncertain_head_motion</code> (§6.4)
          </li>
        </ul>
        <p className="panel__note">
          These thresholds are documented defaults — not device-calibrated. All events are candidates, not validated
          detections (§6.3).
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Recent event confidences</h3>
        {recentEvents.length === 0 ? (
          <p className="panel__note">No candidate events yet.</p>
        ) : (
          <div className="panel__table-wrap">
            <table className="panel__table">
              <thead>
                <tr>
                  <th scope="col">type</th>
                  <th scope="col">duration (ms)</th>
                  <th scope="col">confidence</th>
                  <th scope="col">head motion</th>
                </tr>
              </thead>
              <tbody>
                {[...recentEvents].reverse().map((ev, i) => (
                  <tr key={i}>
                    <td>{ev.event_type}</td>
                    <td>{Math.round(ev.event_end_ms - ev.event_start_ms)}</td>
                    <td>{ev.event_confidence.toFixed(2)}</td>
                    <td>{ev.head_motion_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="panel__note">
          Confidence falls under head-motion contamination (§6.4) and for fixations near the dispersion limit.
        </p>
      </section>
    </div>
  );
}

export const step6Demo: StepDemo = {
  Provider: Step6DemoProvider,
  LiveDemo: Step6LiveDemo,
  DetailsPanels: Step6DetailsPanels,
};
