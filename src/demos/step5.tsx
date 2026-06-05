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
import CalibrationTask from './calibrationTask';
import ValidationTask from './validationTask';
import PursuitTask from './pursuitTask';
import GazeContingentTask from './gazeContingentTask';
import { FaceFeatureExtractor } from '../lib/featureExtraction';
import { LEFT_EYE_EAR_IDX, RIGHT_EYE_EAR_IDX, landmarkBounds } from '../lib/eyeGeometry';
import { computeEyeLocalSignal, type EyeLocalSignal } from '../lib/eyeLocalSignal';
import { RegressionGazeProvider, applyMapping } from '../lib/regressionGaze';
import {
  fitGazeMapping,
  type GazeCalibrationResult,
  type GazeCalibrationSample,
} from '../lib/gazeCalibration';
import type { ScreenGazeEstimate } from '../lib/screenGaze';
import {
  accuracy,
  perTargetMetrics,
  type AccuracyResult,
  type TargetSamples,
  type ValidationSummary,
} from '../lib/validationMetrics';
import { precisionEllipse, validationInputsFromRows } from '../lib/validationErrorMap';
import { meanDegreesPerNormalised } from '../lib/visualAngle';
import { SessionStore } from '../lib/sessionStore';
import type { StepDemo } from './registry';

/** Aggregated held-out validation result for the Step 5 readout and error map. */
interface ValidationResult {
  summary: ValidationSummary;
  overall: AccuracyResult;
  /** Per-target estimate clouds, index-aligned with `summary.perTarget`. */
  targets: TargetSamples[];
  /**
   * Representative angular scale (estimated degrees per normalised unit) over the
   * session's samples, for showing accuracy/precision in approximate degrees
   * (`040`). Null when no sample carried a visual-angle estimate.
   */
  degPerNorm: number | null;
}

// Step 5 live demo: run the follow-the-dots calibration task (021), fit the
// regression mapping (022), install it into provider A, and show the resulting
// calibrated screen-gaze estimate with a validation/error readout (spec §3.5,
// §6.3; §2.5/§2.6 for the master-controlled panels).
//
// Self-contained, like the other step demos: it owns its own camera loop,
// session store, and a RegressionGazeProvider whose mapping it fits here.

type DemoState = 'idle' | 'loading' | 'tracking' | 'no-face' | 'error';

interface Step5DemoContextValue {
  store: SessionStore;
  state: DemoState;
  errorMessage: string | null;
  getSignal: () => EyeLocalSignal | null;
  /** Latest fitted screen-gaze estimate, for the held-out validation task (035). */
  getEstimate: () => ScreenGazeEstimate;
  result: GazeCalibrationResult | null;
  samples: GazeCalibrationSample[];
  gaze: ScreenGazeEstimate;
  validation: ValidationResult | null;
  onValidationComplete: () => void;
  /** Number of distinct calibration targets used for the current fit, and total available. */
  pointsUsed: number | 'all';
  distinctPointCount: number;
  refitWithPoints: (k: number | 'all') => void;
  onCalibrationComplete: (samples: GazeCalibrationSample[]) => void;
  onCalibrationCancel: () => void;
  onStreamChange: (stream: MediaStream | null) => void;
  onVideoElement: (video: HTMLVideoElement | null) => void;
}

const Step5DemoContext = createContext<Step5DemoContextValue | undefined>(undefined);

function useStep5Demo(): Step5DemoContextValue {
  const ctx = useContext(Step5DemoContext);
  if (ctx === undefined) {
    throw new Error('Step 5 demo components must be used within Step5DemoProvider');
  }
  return ctx;
}

function Step5DemoProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SessionStore | null>(null);
  if (storeRef.current === null) storeRef.current = new SessionStore();
  const store = storeRef.current;

  const extractorRef = useRef<FaceFeatureExtractor | null>(null);
  if (extractorRef.current === null) extractorRef.current = new FaceFeatureExtractor();
  const extractor = extractorRef.current;

  const providerRef = useRef<RegressionGazeProvider | null>(null);
  if (providerRef.current === null) providerRef.current = new RegressionGazeProvider();
  const provider = providerRef.current;

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rvfcRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastUiUpdateRef = useRef(0);
  const frameCountRef = useRef(0);
  const signalRef = useRef<EyeLocalSignal | null>(null);
  const estimateRef = useRef<ScreenGazeEstimate>({ gaze_available: false });

  const [state, setState] = useState<DemoState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GazeCalibrationResult | null>(null);
  const [samples, setSamples] = useState<GazeCalibrationSample[]>([]);
  const [gaze, setGaze] = useState<ScreenGazeEstimate>({ gaze_available: false });
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [pointsUsed, setPointsUsed] = useState<number | 'all'>('all');

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
    const features = extractor.processFrame(video, ts, store, frameCountRef.current);

    let signal: EyeLocalSignal | null = null;
    if (features) {
      signal = computeEyeLocalSignal(
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
    }
    signalRef.current = signal;

    const estimate = provider.estimate({ timeMs: ts, eyeLocal: signal });
    estimateRef.current = estimate;

    if (ts - lastUiUpdateRef.current >= 100) {
      lastUiUpdateRef.current = ts;
      setGaze(estimate);
      setState(features ? 'tracking' : 'no-face');
    }
  }, [extractor, store, provider]);

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
      lastUiUpdateRef.current = 0;
      signalRef.current = null;
      setValidation(null);
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

  const onCalibrationComplete = useCallback(
    (collected: GazeCalibrationSample[]) => {
      if (collected.length === 0) {
        setErrorMessage(
          'No calibration samples were captured — make sure the camera is running and your face is tracked, then recalibrate.',
        );
        setResult(null);
        setSamples([]);
        provider.setMapping(null);
        return;
      }
      setErrorMessage(null);
      const fitted = fitGazeMapping(collected);
      provider.setMapping(fitted.mapping);
      setResult(fitted);
      setSamples(collected);
      setPointsUsed('all');
      // A fresh calibration invalidates any previous validation result.
      setValidation(null);
    },
    [provider],
  );

  // Group collected calibration samples by distinct target, preserving order.
  const targetGroups = useMemo(() => {
    const groups = new Map<string, GazeCalibrationSample[]>();
    for (const s of samples) {
      const key = `${s.target.x},${s.target.y}`;
      const g = groups.get(key);
      if (g) g.push(s);
      else groups.set(key, [s]);
    }
    return [...groups.values()];
  }, [samples]);

  // 051 demo control: refit on a reduced number of calibration points so the
  // error rises as points are dropped (reuses the existing fit; no new maths).
  const refitWithPoints = useCallback(
    (k: number | 'all') => {
      const used = k === 'all' ? targetGroups : targetGroups.slice(0, k);
      const subset = used.flat();
      if (subset.length === 0) return;
      const fitted = fitGazeMapping(subset);
      provider.setMapping(fitted.mapping);
      setResult(fitted);
      setPointsUsed(k);
      // Refit invalidates any prior validation captured against the old mapping.
      setValidation(null);
    },
    [targetGroups, provider],
  );

  const onCalibrationCancel = useCallback(() => {
    provider.setMapping(null);
    setResult(null);
    setSamples([]);
    setGaze({ gaze_available: false });
    setValidation(null);
  }, [provider]);

  // When the validation task finishes, read its held-out `quality` rows and
  // compute per-target and aggregate accuracy / precision (RMS-S2S) / BCEA (034).
  const onValidationComplete = useCallback(() => {
    const inputs = validationInputsFromRows(store.byType('quality'));
    if (inputs.targets.length === 0) {
      setValidation(null);
      return;
    }
    setValidation({
      summary: perTargetMetrics(inputs.targets),
      overall: accuracy(inputs.pairs),
      targets: inputs.targets,
      degPerNorm: meanDegreesPerNormalised(store.byType('sample')),
    });
  }, [store]);

  const getSignal = useCallback(() => signalRef.current, []);
  const getEstimate = useCallback(() => estimateRef.current, []);

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

  const value = useMemo<Step5DemoContextValue>(
    () => ({
      store,
      state,
      errorMessage,
      getSignal,
      getEstimate,
      result,
      samples,
      gaze,
      validation,
      onValidationComplete,
      pointsUsed,
      distinctPointCount: targetGroups.length,
      refitWithPoints,
      onCalibrationComplete,
      onCalibrationCancel,
      onStreamChange,
      onVideoElement,
    }),
    [
      store,
      state,
      errorMessage,
      getSignal,
      getEstimate,
      result,
      samples,
      gaze,
      validation,
      onValidationComplete,
      pointsUsed,
      targetGroups.length,
      refitWithPoints,
      onCalibrationComplete,
      onCalibrationCancel,
      onStreamChange,
      onVideoElement,
    ],
  );

  return <Step5DemoContext.Provider value={value}>{children}</Step5DemoContext.Provider>;
}

// --- Formatting -------------------------------------------------------------

function fmt(value: number | undefined, digits = 3): string {
  return value === undefined ? '—' : value.toFixed(digits);
}

const QUALITY_TEXT: Record<GazeCalibrationResult['quality'], string> = {
  good: 'Good',
  moderate: 'Moderate',
  poor: 'Poor — recalibrate',
};

// --- Live demo --------------------------------------------------------------

function Step5LiveDemo() {
  const {
    state,
    errorMessage,
    getSignal,
    getEstimate,
    store,
    result,
    gaze,
    validation,
    onValidationComplete,
    pointsUsed,
    distinctPointCount,
    refitWithPoints,
    onCalibrationComplete,
    onCalibrationCancel,
    onStreamChange,
    onVideoElement,
  } = useStep5Demo();

  const cameraReady = state === 'tracking' || state === 'no-face';
  const dropoutOptions = [distinctPointCount, 5, 3].filter(
    (k, i, arr) => k > 0 && k <= distinctPointCount && arr.indexOf(k) === i,
  );

  return (
    <div className="feature-demo">
      <CameraPreview onStreamChange={onStreamChange} onVideoElement={onVideoElement} />

      <p className="timing-demo__note" role="status">
        {state === 'idle' &&
          'Start the camera first, then run the calibration. Processing stays on your device.'}
        {state === 'loading' && 'Loading the face-tracking model (served from this site)…'}
        {(state === 'tracking' || state === 'no-face') &&
          'Camera running. Start the calibration and look at each dot as it lights up green.'}
        {state === 'error' && (errorMessage ?? 'The face-tracking model could not be loaded.')}
      </p>

      {cameraReady && (
        <CalibrationTask
          store={store}
          getSignal={getSignal}
          onComplete={onCalibrationComplete}
          onCancel={onCalibrationCancel}
        />
      )}

      {errorMessage && cameraReady && (
        <p className="timing-demo__note" role="alert">
          {errorMessage}
        </p>
      )}

      {result && (
        <div
          className={`motion-label${
            result.quality === 'poor' ? ' motion-label--uncertain' : ' motion-label--low'
          }`}
          aria-live="polite"
        >
          <span className="motion-label__caption">Calibration quality</span>
          <span className="motion-label__value">
            {QUALITY_TEXT[result.quality]} · RMS {fmt(result.rmsError, 3)} (normalised)
          </span>
        </div>
      )}

      {result && distinctPointCount > 0 && (
        <div className="dropout-control">
          <span className="dropout-control__label">Calibration points used:</span>
          {dropoutOptions.map((k) => {
            const active = pointsUsed === 'all' ? k === distinctPointCount : pointsUsed === k;
            return (
              <button
                key={k}
                type="button"
                className={`button${active ? '' : ' button--ghost'}`}
                aria-pressed={active}
                onClick={() => refitWithPoints(k === distinctPointCount ? 'all' : k)}
              >
                {k}
              </button>
            );
          })}
          <span className="live-precision__hint">
            Fewer points → a looser fit and higher error. Watch the RMS above rise as you drop
            points (demo control; the recorded calibration data is unchanged).
          </span>
        </div>
      )}

      {result ? (
        <CalibrationWarpGrid mapping={result.mapping} />
      ) : (
        cameraReady && (
          <p className="panel__empty">
            Run the calibration to see the fitted mapping drawn as a warped grid (a deformation
            field from eye-local input to screen position).
          </p>
        )
      )}

      {result && (
        <>
          <div className="gaze-box" aria-label="Calibrated screen-gaze estimate">
            {gaze.gaze_available && gaze.gaze_x != null && gaze.gaze_y != null && (
              <span
                className="gaze-box__dot"
                style={{ left: `${gaze.gaze_x * 100}%`, top: `${gaze.gaze_y * 100}%` }}
              />
            )}
          </div>
          <p className="timing-demo__note">
            This is a <strong>calibrated screen-gaze estimate</strong> — distinct from the
            eye-local signal, and only as good as the calibration above. Move your eyes and watch
            the dot follow.{' '}
            {result.recalibrationSuggested &&
              'Quality is low or there were too few points — consider recalibrating in better lighting.'}
          </p>

          <p className="timing-demo__note">
            Now <strong>validate</strong> on fresh targets the calibration never saw. These
            held-out points are recorded so accuracy and precision can be reported separately from
            the calibration fit.
          </p>
          <ValidationTask
            store={store}
            getEstimate={getEstimate}
            onComplete={onValidationComplete}
          />

          {validation && <ValidationReadout validation={validation} />}

          <PursuitTask getEstimate={getEstimate} />

          <GazeContingentTask getEstimate={getEstimate} />
        </>
      )}
    </div>
  );
}

// --- Calibration warped grid (054) ------------------------------------------

// Visualise the fitted mapping as a deformation field: a regular grid in the
// eye-local INPUT space (combined x/y in −1…1) mapped FORWARD through the fitted
// mapping to screen positions. The deformation shows what calibration does; edge
// cells that stretch most foreshadow the larger edge/corner validation error
// (§6.3 — qualitative, not a measured accuracy field). Reuses `applyMapping`.
const WARP_GRID = 7;
const WARP_SIZE = 220;
const WARP_MARGIN = 20;

function CalibrationWarpGrid({ mapping }: { mapping: GazeCalibrationResult['mapping'] }) {
  const side = WARP_SIZE + 2 * WARP_MARGIN;
  const axis = Array.from({ length: WARP_GRID }, (_, i) => -1 + (2 * i) / (WARP_GRID - 1));
  // node[row][col] = screen position for eye-local (cx, cy).
  const nodes = axis.map((cy) =>
    axis.map((cx) => {
      const p = applyMapping(mapping, [1, cx, cy, cx, cy, cx, cy]);
      return { x: WARP_MARGIN + p.x * WARP_SIZE, y: WARP_MARGIN + p.y * WARP_SIZE };
    }),
  );

  const lines: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
  for (let r = 0; r < WARP_GRID; r++) {
    for (let c = 0; c < WARP_GRID; c++) {
      if (c + 1 < WARP_GRID) lines.push([nodes[r][c], nodes[r][c + 1]]);
      if (r + 1 < WARP_GRID) lines.push([nodes[r][c], nodes[r + 1][c]]);
    }
  }

  return (
    <figure className="warp-grid">
      <svg
        viewBox={`0 0 ${side} ${side}`}
        width={side}
        height={side}
        role="img"
        aria-label="Warped calibration grid: a regular eye-local grid mapped to screen positions"
      >
        <rect
          x={WARP_MARGIN}
          y={WARP_MARGIN}
          width={WARP_SIZE}
          height={WARP_SIZE}
          fill="none"
          stroke="#cbd5e1"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        {lines.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2563eb" strokeWidth={1} />
        ))}
        {nodes.flat().map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={2} fill="#1d4ed8" />
        ))}
      </svg>
      <figcaption className="error-map__caption">
        The dashed square is the screen. The blue mesh is a regular grid of eye-local inputs
        (−1…1) mapped <strong>forward</strong> through your fitted calibration to screen positions —
        the deformation calibration applies. The mapping is linear, so the mesh is an affine
        (scaled/sheared) grid; where it stretches most, a small eye-local change moves the estimate
        most, and edge/corner targets tend to show the largest validation error (§6.3, qualitative).
      </figcaption>
    </figure>
  );
}

// --- Validation readout + error map -----------------------------------------

function ValidationReadout({ validation }: { validation: ValidationResult }) {
  const { summary, overall, degPerNorm } = validation;
  const deg = (norm: number) => (degPerNorm != null ? `≈ ${fmt(norm * degPerNorm, 2)}°` : null);
  const accuracyDeg = deg(summary.meanAccuracy);
  const precisionDeg = deg(summary.meanPrecisionRmsS2S);
  return (
    <div className="validation-result">
      <div className="validation-result__figures">
        <div className="motion-label motion-label--low">
          <span className="motion-label__caption">Accuracy (on target?)</span>
          <span className="motion-label__value">
            {fmt(summary.meanAccuracy, 3)} mean · {fmt(summary.medianAccuracy, 3)} median
          </span>
          {accuracyDeg && (
            <span className="live-precision__hint">{accuracyDeg} estimated (visual angle)</span>
          )}
        </div>
        <div className="motion-label motion-label--low">
          <span className="motion-label__caption">Precision (steady?)</span>
          <span className="motion-label__value">
            RMS-S2S {fmt(summary.meanPrecisionRmsS2S, 3)} · BCEA {fmt(summary.meanBcea, 4)}
          </span>
          {precisionDeg && (
            <span className="live-precision__hint">{precisionDeg} estimated (visual angle)</span>
          )}
        </div>
      </div>
      <p className="timing-demo__note">
        Accuracy and precision answer <em>different</em> questions and are reported separately, in
        normalised screen units (0–1) over {summary.targetCount} held-out targets (
        {overall.count} samples)
        {degPerNorm != null
          ? ', with an estimated degrees-of-visual-angle figure alongside.'
          : '.'}{' '}
        These are not measured device-accuracy figures for any particular phone, and the degree
        values are estimates built on an assumed IPD, camera FOV, and screen size (§6.3).
      </p>
      <ValidationErrorMap validation={validation} />
    </div>
  );
}

// Screen-schematic error map: each validation target, an offset vector to its
// mean estimate (accuracy), and the precision/BCEA ellipse (steadiness). Drawn
// in a square normalised (0–1) frame so the ellipse shape/orientation is honest.
const MAP_SIZE = 220;
const MAP_MARGIN = 16;

function mapX(nx: number): number {
  return MAP_MARGIN + nx * MAP_SIZE;
}
function mapY(ny: number): number {
  return MAP_MARGIN + ny * MAP_SIZE;
}

function ValidationErrorMap({ validation }: { validation: ValidationResult }) {
  const { summary, targets } = validation;
  const side = MAP_SIZE + 2 * MAP_MARGIN;
  return (
    <figure className="error-map">
      <svg
        className="error-map__svg"
        viewBox={`0 0 ${side} ${side}`}
        width={side}
        height={side}
        role="img"
        aria-label="Validation error map: offset vectors and precision ellipses per target"
      >
        <rect
          x={MAP_MARGIN}
          y={MAP_MARGIN}
          width={MAP_SIZE}
          height={MAP_SIZE}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        {summary.perTarget.map((m, i) => {
          const ell = precisionEllipse(targets[i]?.estimates ?? []);
          const tx = mapX(m.target.x);
          const ty = mapY(m.target.y);
          const ex = mapX(m.meanEstimate.x);
          const ey = mapY(m.meanEstimate.y);
          return (
            <g key={m.target.x + ':' + m.target.y + ':' + i}>
              {(ell.rx > 0 || ell.ry > 0) && (
                <ellipse
                  cx={mapX(ell.cx)}
                  cy={mapY(ell.cy)}
                  rx={ell.rx * MAP_SIZE}
                  ry={ell.ry * MAP_SIZE}
                  transform={`rotate(${ell.angleDeg} ${mapX(ell.cx)} ${mapY(ell.cy)})`}
                  fill="rgba(37, 99, 235, 0.12)"
                  stroke="#2563eb"
                  strokeWidth={1}
                />
              )}
              <line x1={tx} y1={ty} x2={ex} y2={ey} stroke="#dc2626" strokeWidth={1.5} />
              <circle cx={ex} cy={ey} r={2.5} fill="#dc2626" />
              <circle cx={tx} cy={ty} r={3} fill="none" stroke="#1f2937" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
      <figcaption className="error-map__caption">
        Black ring = validation target. Red arrow = accuracy offset to the mean estimate. Blue
        ellipse = 68% precision/BCEA region. Axes are normalised screen coordinates (0–1); error
        often grows toward the edges and corners.
      </figcaption>
    </figure>
  );
}

// --- Subprocess panels ------------------------------------------------------

function Step5DetailsPanels() {
  const { result, samples, validation } = useStep5Demo();

  if (!result) {
    return (
      <p className="panel__empty">
        Run the calibration to populate the mapping and validation panels.
      </p>
    );
  }

  const preview = samples.slice(0, 5).map((s) => ({
    target: s.target,
    estimate: applyMapping(result.mapping, s.features),
  }));

  return (
    <div className="panels">
      {validation && (
        <section className="panel">
          <h3 className="panel__title">Validation: per-target accuracy / precision</h3>
          <div className="panel__table-wrap">
            <table className="panel__table">
              <thead>
                <tr>
                  <th scope="col">target</th>
                  <th scope="col">target (x, y)</th>
                  <th scope="col">accuracy</th>
                  <th scope="col">precision (RMS-S2S)</th>
                  <th scope="col">BCEA</th>
                  <th scope="col">n</th>
                </tr>
              </thead>
              <tbody>
                {validation.summary.perTarget.map((m, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {fmt(m.target.x, 2)}, {fmt(m.target.y, 2)}
                    </td>
                    <td>{fmt(m.accuracy, 3)}</td>
                    <td>{fmt(m.precisionRmsS2S, 3)}</td>
                    <td>{fmt(m.bcea, 4)}</td>
                    <td>{m.sampleCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="panel__note">
            Held-out targets the calibration never saw, in normalised screen units. Accuracy (offset
            of the mean estimate from the target) and precision (sample-to-sample RMS) are reported
            separately; BCEA is the 68% bivariate contour ellipse area. Not a measured device
            accuracy figure (§6.3).
          </p>
        </section>
      )}
      <section className="panel">
        <h3 className="panel__title">Why degrees of visual angle (and why it is only estimated)</h3>
        <p className="panel__note">
          Eye tracking is normally reported in <strong>degrees of visual angle</strong> (dva) — how
          far the eye rotated — rather than pixels, because a degree means the same thing regardless
          of screen size or how far away the screen is. One degree is roughly the width of a
          thumbnail held at arm's length.
        </p>
        <ul className="panel__list">
          <li>
            We estimate your <strong>viewing distance</strong> from the separation between your eyes
            in the camera image, assuming an average inter-pupillary distance (~63&nbsp;mm) and an
            approximate camera field of view.
          </li>
          <li>
            From that distance and an assumed screen size we derive an <strong>angular scale</strong>{' '}
            (degrees per normalised unit) and convert accuracy, precision, and saccade amplitude into
            approximate degrees.
          </li>
          <li>
            A browser cannot read the true pixel pitch, real IPD, or exact camera FOV, so every
            degree figure here is an <strong>estimate</strong>, not a measurement (§6.3). Research-grade
            systems fix the geometry with a chin-rest and a calibrated camera.
          </li>
        </ul>
      </section>
      <section className="panel">
        <h3 className="panel__title">Calibration quality</h3>
        <ul className="panel__list">
          <li>
            Samples: <strong>{result.sampleCount}</strong>
          </li>
          <li>
            RMS error (x / y): <strong>{fmt(result.rmsX, 3)} / {fmt(result.rmsY, 3)}</strong>{' '}
            normalised
          </li>
          <li>
            Combined RMS: <strong>{fmt(result.rmsError, 3)}</strong> · quality{' '}
            <strong>{result.quality}</strong>
          </li>
          <li>
            Recalibration suggested: <strong>{result.recalibrationSuggested ? 'yes' : 'no'}</strong>
          </li>
        </ul>
        <p className="panel__note">
          Error is estimated by k-fold cross-validation on held-out targets, in normalised screen
          units. Thresholds are documented defaults, not device-calibrated — do not read these as
          measured accuracy (§6.3).
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Samples: target vs estimate</h3>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">target (x, y)</th>
                <th scope="col">estimate (x, y)</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p, i) => (
                <tr key={i}>
                  <td>
                    {fmt(p.target.x, 2)}, {fmt(p.target.y, 2)}
                  </td>
                  <td>
                    {fmt(p.estimate.x, 2)}, {fmt(p.estimate.y, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel__note">
          The fitted mapping applied back to the first few calibration samples — closer pairs mean
          a better in-sample fit (not a guarantee of held-out accuracy).
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Fitted mapping</h3>
        <p className="panel__note">
          Model: <code>{result.mappingModelId}</code>. A linear least-squares map from the
          eye-local feature vector <code>[1, cx, cy, lx, ly, rx, ry]</code> to screen x/y.
        </p>
        <div className="panel__table-wrap">
          <table className="panel__table">
            <thead>
              <tr>
                <th scope="col">axis</th>
                <th scope="col">coefficients</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>x</td>
                <td>{result.mapping.cx.map((c) => c.toFixed(2)).join(', ')}</td>
              </tr>
              <tr>
                <td>y</td>
                <td>{result.mapping.cy.map((c) => c.toFixed(2)).join(', ')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export const step5Demo: StepDemo = {
  Provider: Step5DemoProvider,
  LiveDemo: Step5LiveDemo,
  DetailsPanels: Step5DetailsPanels,
};
