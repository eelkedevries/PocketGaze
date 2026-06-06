// Device/browser performance benchmark TEMPLATE (069).
//
// Distinct from the accuracy comparison (MethodComparisonTable): this records
// per-device throughput, not accuracy. No values are invented — every performance
// cell reads "not yet measured" and the table is explicitly labelled a measurement
// template. A live device-capability readout shows real, measured properties of the
// current browser/device to help a tester fill the template in.

import { useEffect, useState } from 'react';

interface Row {
  device: string;
  browser: string;
  notes: string;
}

// Template rows. The performance columns (camera FPS, effective FPS, model load,
// inference, data loss, calibration usable) are deliberately the same
// "not yet measured" placeholder for every row until a human measures them.
const NM = 'not yet measured';

const ROWS: Row[] = [
  { device: 'Mid-range Android phone', browser: 'Chrome', notes: 'Primary target; measure under normal indoor light.' },
  { device: 'Recent iPhone', browser: 'Safari', notes: 'rVFC / WASM support varies by iOS version (secondary target).' },
  { device: 'Desktop / laptop', browser: 'Chrome or Firefox', notes: 'External or built-in webcam.' },
];

interface Capabilities {
  viewport: string;
  dpr: string;
  cores: string;
  rvfc: string;
  getUserMedia: string;
}

function readCapabilities(): Capabilities {
  if (typeof window === 'undefined') {
    return { viewport: '—', dpr: '—', cores: '—', rvfc: '—', getUserMedia: '—' };
  }
  const nav = window.navigator;
  const rvfc =
    typeof HTMLVideoElement !== 'undefined' &&
    'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  const gum = !!(nav.mediaDevices && nav.mediaDevices.getUserMedia);
  return {
    viewport: `${window.innerWidth} × ${window.innerHeight} CSS px`,
    dpr: String(window.devicePixelRatio || 1),
    cores: nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : 'unknown',
    rvfc: rvfc ? 'supported' : 'fallback (requestAnimationFrame)',
    getUserMedia: gum ? 'available' : 'unavailable',
  };
}

export default function DeviceBenchmarkTable() {
  const [caps, setCaps] = useState<Capabilities | null>(null);

  useEffect(() => {
    setCaps(readCapabilities());
  }, []);

  return (
    <section className="step-section" aria-label="Device and browser performance">
      <h2>Device and browser performance</h2>
      <p>
        Performance varies widely across devices and browsers. The table below is a{' '}
        <strong>measurement template</strong>, not project results: no throughput figure has been
        measured here, so every performance cell reads “{NM}”. Fill it in per device using the
        protocol underneath; the live readout shows what can be detected automatically right now.
      </p>

      <div className="device-caps" aria-label="Live device capability readout">
        <h3 className="limitation-panel__title">This device, right now (measured live)</h3>
        <dl className="readout">
          <div className="readout__item">
            <dt className="readout__label">Viewport</dt>
            <dd className="readout__value">{caps?.viewport ?? '—'}</dd>
          </div>
          <div className="readout__item">
            <dt className="readout__label">Device-pixel ratio</dt>
            <dd className="readout__value">{caps?.dpr ?? '—'}</dd>
          </div>
          <div className="readout__item">
            <dt className="readout__label">Logical CPU cores</dt>
            <dd className="readout__value">{caps?.cores ?? '—'}</dd>
          </div>
          <div className="readout__item">
            <dt className="readout__label">Per-frame video callback</dt>
            <dd className="readout__value">{caps?.rvfc ?? '—'}</dd>
          </div>
          <div className="readout__item">
            <dt className="readout__label">Camera API</dt>
            <dd className="readout__value">{caps?.getUserMedia ?? '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="panel__table-wrap">
        <table className="panel__table comparison-table">
          <caption className="claims-table__caption">
            Measurement template — every performance cell is “{NM}” until filled in by hand.
          </caption>
          <thead>
            <tr>
              <th scope="col">Device</th>
              <th scope="col">Browser</th>
              <th scope="col">Camera FPS</th>
              <th scope="col">Effective FPS</th>
              <th scope="col">Model load</th>
              <th scope="col">Inference time</th>
              <th scope="col">Data loss</th>
              <th scope="col">Calibration usable</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.device + r.browser}>
                <th scope="row">{r.device}</th>
                <td>{r.browser}</td>
                <td>{NM}</td>
                <td>{NM}</td>
                <td>{NM}</td>
                <td>{NM}</td>
                <td>{NM}</td>
                <td>{NM}</td>
                <td>{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="disclosure__level">
        <summary className="disclosure__summary">Manual benchmark protocol</summary>
        <ol className="device-protocol">
          <li>
            <strong>Camera FPS:</strong> note the camera’s nominal rate (from its specification or
            the “nominal rate” readout on Step 1).
          </li>
          <li>
            <strong>Effective FPS:</strong> run Step 1 for ~30 s in normal light and record the
            steady-state effective frame rate.
          </li>
          <li>
            <strong>Model load:</strong> on Step 2, time from “Start camera” to the first tracked
            frame (the loading note clearing).
          </li>
          <li>
            <strong>Inference time:</strong> read the live latency budget on Step 1 (model-inference
            stage) once it is implemented, or estimate from the effective FPS.
          </li>
          <li>
            <strong>Data loss:</strong> on Step 5/6, record the proportion of dropped or
            invalid/blink-suppressed samples over a fixed task.
          </li>
          <li>
            <strong>Calibration usable:</strong> run Step 5 calibration + validation and record the
            usable/marginal/poor verdict.
          </li>
          <li>
            Repeat per device/browser and replace the “{NM}” cells. State the lighting and posture
            used, since they materially affect the numbers.
          </li>
        </ol>
      </details>
    </section>
  );
}
