import { OutOfReachPanel } from './LimitationPanels';
import MethodComparisonTable from './MethodComparisonTable';
import DeviceBenchmarkTable from './DeviceBenchmarkTable';
import ExportInspector from './ExportInspector';
import ResourcesSection from './ResourcesSection';
import { usePageTitle } from './usePageTitle';

export default function AboutPage() {
  usePageTitle('About & Privacy');
  return (
    <article className="step-page">
      <h1 className="step-page__title">About &amp; Privacy</h1>

      <section className="step-section">
        <h2>What PocketGaze is</h2>
        <p>
          PocketGaze is a portfolio project that demonstrates how smartphone-camera eye
          tracking can be built in practice. It exists to show potential employers,
          collaborators, and customers that the author understands the seven-step pipeline
          — from camera capture and face-landmark detection, through head-pose estimation,
          eye-local signal extraction, calibrated gaze mapping, noise filtering, candidate
          event detection, and finally content-coordinate alignment. Each step has its own
          page with an explanation and a working live demo.
        </p>
        <p>
          The site is entirely static. It runs in your browser, is hosted on GitHub Pages,
          and has no server-side component. There is no backend, no database, and no
          account system.
        </p>
      </section>

      <section className="step-section">
        <h2>Processing and privacy</h2>
        <p>
          When the step demos are active, all processing happens locally on your device.
          Camera frames are analysed in the browser and are never sent to a remote server.
          Raw video is not stored or uploaded; the export feature produces only derived data —
          signals, events, and task metadata — not the video itself, and only when you choose to
          trigger it. Processing on-device, by default, is the privacy design of this project:
          the sensitive raw imagery never leaves the page.
        </p>
        <p>
          Derived gaze data is sensitive even though all computation stays on your device. Where
          someone looks, and for how long, can reveal <strong>reading behaviour, attention,
          interest, cognitive strategy, and fatigue</strong> — so gaze estimates, content-mapped
          coordinates, candidate events, landmarks, and head-pose values are all treated as
          sensitive personal data, not neutral telemetry. The camera is requested only when a
          step’s demo requires it, with a clear permission-and-consent flow, and the stream is
          released as soon as the demo stops. In a real study, informed consent covering what is
          recorded, why, and for how long would be essential.
        </p>
      </section>

      <ExportInspector />

      <section className="step-section">
        <h2>What this site does not do</h2>
        <ul>
          <li>Send camera frames, landmarks, or gaze data to any server.</li>
          <li>Store or upload raw video by default.</li>
          <li>Collect, log, or share any data you generate with third parties.</li>
          <li>
            Implement server-side or cloud processing — the browser-local route is the
            only one built here (cloud and native-app routes may be described as
            explanatory content but are not implemented).
          </li>
          <li>
            Claim regulatory compliance (GDPR, HIPAA, or otherwise). This is a portfolio
            and educational project, not a commercial product.
          </li>
        </ul>
      </section>

      <MethodComparisonTable />

      <DeviceBenchmarkTable />

      <OutOfReachPanel />

      <ResourcesSection />

      <section className="step-section">
        <h2>Source code</h2>
        <p>
          The source code is publicly available at{' '}
          <a href="https://github.com/eelkedevries/PocketGaze">
            github.com/eelkedevries/PocketGaze
          </a>
          . The repository includes development documentation that is never included in the
          deployed build output.
        </p>
      </section>
    </article>
  );
}
