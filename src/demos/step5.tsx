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
import { SessionStore } from '../lib/sessionStore';
import type { StepDemo } from './registry';

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
  result: GazeCalibrationResult | null;
  samples: GazeCalibrationSample[];
  gaze: ScreenGazeEstimate;
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

  const [state, setState] = useState<DemoState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GazeCalibrationResult | null>(null);
  const [samples, setSamples] = useState<GazeCalibrationSample[]>([]);
  const [gaze, setGaze] = useState<ScreenGazeEstimate>({ gaze_available: false });

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
    },
    [provider],
  );

  const onCalibrationCancel = useCallback(() => {
    provider.setMapping(null);
    setResult(null);
    setSamples([]);
    setGaze({ gaze_available: false });
  }, [provider]);

  const getSignal = useCallback(() => signalRef.current, []);

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
      result,
      samples,
      gaze,
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
      result,
      samples,
      gaze,
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
    store,
    result,
    gaze,
    onCalibrationComplete,
    onCalibrationCancel,
    onStreamChange,
    onVideoElement,
  } = useStep5Demo();

  const cameraReady = state === 'tracking' || state === 'no-face';

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
        </>
      )}
    </div>
  );
}

// --- Subprocess panels ------------------------------------------------------

function Step5DetailsPanels() {
  const { result, samples } = useStep5Demo();

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
