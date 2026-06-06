// Export inspector (070): lists each exported data type, whether it is in the
// default export, whether it contains a raw image, and its sensitivity. Documents
// the raw-signal distinction — the unfiltered derived SIGNAL trace is exported, but
// raw video frames and raw landmark data are NEVER exported (stronger than the
// "off-by-default advanced mode" minimum). Sourced from the locked §4 schema
// (lib/exportCsv.ts CSV_HEADERS).

interface InspectorRow {
  dataType: string;
  exported: 'Yes' | 'No (never)';
  rawImage: 'No' | 'Yes';
  sensitivity: 'Low' | 'Medium' | 'High' | 'Highest';
}

const ROWS: InspectorRow[] = [
  { dataType: 'Frame timing (time, frame ids, latency)', exported: 'Yes', rawImage: 'No', sensitivity: 'Low' },
  { dataType: 'Eye-local signal (raw + filtered, normalised)', exported: 'Yes', rawImage: 'No', sensitivity: 'Medium' },
  { dataType: 'Screen-gaze estimate (raw + filtered)', exported: 'Yes', rawImage: 'No', sensitivity: 'High' },
  { dataType: 'Content-mapped coordinate', exported: 'Yes', rawImage: 'No', sensitivity: 'High' },
  { dataType: 'Head pose and motion label', exported: 'Yes', rawImage: 'No', sensitivity: 'Medium' },
  { dataType: 'Visual-angle estimate', exported: 'Yes', rawImage: 'No', sensitivity: 'Low' },
  { dataType: 'Tracking / detection quality', exported: 'Yes', rawImage: 'No', sensitivity: 'Low' },
  { dataType: 'Blink / eye-state', exported: 'Yes', rawImage: 'No', sensitivity: 'Medium' },
  { dataType: 'Candidate events (fixation/saccade/blink…)', exported: 'Yes', rawImage: 'No', sensitivity: 'High' },
  { dataType: 'Task / stimulus metadata', exported: 'Yes', rawImage: 'No', sensitivity: 'Medium' },
  { dataType: 'Viewport context (size, DPR, orientation)', exported: 'Yes', rawImage: 'No', sensitivity: 'Low' },
  { dataType: 'Processing metadata (model, pipeline ids)', exported: 'Yes', rawImage: 'No', sensitivity: 'Low' },
  { dataType: 'Raw video frames', exported: 'No (never)', rawImage: 'Yes', sensitivity: 'Highest' },
  { dataType: 'Raw face landmarks (full 478-point mesh)', exported: 'No (never)', rawImage: 'No', sensitivity: 'High' },
];

export default function ExportInspector() {
  return (
    <section className="step-section" aria-label="Export inspector">
      <h2>What the export contains (and what it never does)</h2>
      <p>
        The CSV export carries derived data only. The unfiltered derived <em>signal</em> trace (the
        “raw” signal columns) is included so the data is re-analysable, but raw video frames and the
        full raw landmark mesh are <strong>never</strong> exported — there is no advanced mode that
        turns them on. Each exported row records that no raw video was saved.
      </p>
      <div className="panel__table-wrap">
        <table className="panel__table claims-table">
          <thead>
            <tr>
              <th scope="col">Data type</th>
              <th scope="col">In default export?</th>
              <th scope="col">Contains a raw image?</th>
              <th scope="col">Sensitivity</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.dataType}>
                <th scope="row">{r.dataType}</th>
                <td>{r.exported}</td>
                <td>{r.rawImage}</td>
                <td>{r.sensitivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="limitation-panel__caption">
        “Raw” signal columns are the unfiltered derived signal, not pixels — distinct from raw video
        frames and raw landmark data, which stay out of the export entirely (§2.7, §4.1).
      </p>
    </section>
  );
}
