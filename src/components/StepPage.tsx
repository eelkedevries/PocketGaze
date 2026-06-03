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
        {step.glossary && (
          <dl className="glossary">
            {step.glossary.map((entry) => (
              <div className="glossary__row" key={entry.term}>
                <dt className="glossary__term">{entry.term}</dt>
                <dd className="glossary__definition">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        )}
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
        {step.usageNote && <p>{step.usageNote}</p>}
      </section>

      <section className="step-section">
        <h2>{step.noLiveDemo ? 'The pipeline at a glance' : 'Live demo'}</h2>
        {step.noLiveDemo && step.pipelineStages ? (
          <ol className="pipeline-summary">
            {step.pipelineStages.map((stage) => (
              <li className="pipeline-summary__item" key={stage.label}>
                <span className="pipeline-summary__label">{stage.label}</span>
                <span className="pipeline-summary__title">{stage.title}</span>
                <span className="pipeline-summary__summary">{stage.summary}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="placeholder placeholder--demo" role="img" aria-label="Live demo placeholder">
            <p className="placeholder__label">Live demo placeholder</p>
            <p className="placeholder__hint">
              The interactive demo for this step will be added by a later prompt.
            </p>
          </div>
        )}
      </section>

      {showDetails && (
        <section className="step-section step-section--details">
          <h2>Implementation details</h2>
          {step.detailsContent ? (
            <ul className="details-content">
              {step.detailsContent.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
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
          )}
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
