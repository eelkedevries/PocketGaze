import type { StepDefinition } from '../steps';
import { useImplementationDetails } from '../context/ImplementationDetailsContext';

// Repeated step-page structure shared by every step.
//
// Sections, in order:
//   1. brief introduction
//   2. options / methods
//   3. implementation on this page
//   4. live demo area (placeholder)
//   5. optional implementation/subprocess area (placeholder, master-controlled)
//   6. outputs
//   7. limitations
export default function StepPage({ step }: { step: StepDefinition }) {
  const { showDetails } = useImplementationDetails();

  return (
    <article className="step-page">
      <h1 className="step-page__title">{step.title}</h1>

      <section className="step-section">
        <h2>Introduction</h2>
        <p>{step.intro}</p>
      </section>

      <section className="step-section">
        <h2>Options / methods</h2>
        <ul>
          {step.methods.map((method) => (
            <li key={method}>{method}</li>
          ))}
        </ul>
      </section>

      <section className="step-section">
        <h2>Implementation on this page</h2>
        <p>{step.implementationOnThisPage}</p>
      </section>

      <section className="step-section">
        <h2>Live demo</h2>
        <div className="placeholder placeholder--demo" role="img" aria-label="Live demo placeholder">
          <p className="placeholder__label">Live demo placeholder</p>
          <p className="placeholder__hint">
            The interactive demo for this step will be added by a later prompt.
          </p>
        </div>
      </section>

      {showDetails && (
        <section className="step-section step-section--details">
          <h2>Implementation details</h2>
          <div
            className="placeholder placeholder--details"
            role="img"
            aria-label="Implementation details placeholder"
          >
            <p className="placeholder__label">Implementation / subprocess placeholder</p>
            <p className="placeholder__hint">
              Optional subprocess panels (such as intermediate signals, frame timing,
              landmarks, head pose, filtering stages, or calibration samples) will appear
              here once implemented. They are revealed by the master “Show implementation
              details” control.
            </p>
          </div>
        </section>
      )}

      <section className="step-section">
        <h2>Outputs</h2>
        <ul>
          {step.outputs.map((output) => (
            <li key={output}>{output}</li>
          ))}
        </ul>
      </section>

      <section className="step-section">
        <h2>Limitations</h2>
        <ul>
          {step.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
