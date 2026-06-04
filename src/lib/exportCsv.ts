// Derived-data export: serialise the session model to the locked combined CSV
// format (specification §4.1). Export serialises the model only — it does not
// define new shapes (those are fixed in §4 / `007b`). Raw video is NEVER stored
// or exported (§2.7).
//
// Format (locked §4.1):
//   - Single combined CSV; first column is `row_type`.
//   - Non-applicable fields are left BLANK (empty cell), distinct from a real 0.
//   - Raw and filtered signals occupy SEPARATE columns.
//   - `time_ms` is ms from session start (shared monotonic clock).
//   - Processing metadata included for reproducibility (§4.3).
//
// The pure functions `serialiseToCsv` and `formatCell` are unit-testable without
// the DOM; `downloadSessionCsv` is the browser-only trigger.

import type { SessionRow } from '../types/session';
import type { SessionStore } from './sessionStore';

/**
 * All column headers in the locked §4 order. Kept as a `const` tuple so the
 * header row is stable across sessions and any added rows.
 */
export const CSV_HEADERS = [
  'row_type',
  // Timing (§4.3)
  'time_ms',
  'frame_id',
  'video_frame_time',
  'capture_time',
  'processing_latency_ms',
  // Eye-local raw
  'left_eye_x_raw',
  'left_eye_y_raw',
  'right_eye_x_raw',
  'right_eye_y_raw',
  'combined_eye_x_raw',
  'combined_eye_y_raw',
  // Eye-local signal (normalised within eye region)
  'left_eye_x',
  'left_eye_y',
  'right_eye_x',
  'right_eye_y',
  'combined_eye_x',
  'combined_eye_y',
  // Eye-local filtered (separate columns, §4.1)
  'left_eye_x_filtered',
  'left_eye_y_filtered',
  'right_eye_x_filtered',
  'right_eye_y_filtered',
  'combined_eye_x_filtered',
  'combined_eye_y_filtered',
  // Screen gaze
  'gaze_x_raw',
  'gaze_y_raw',
  'gaze_x_filtered',
  'gaze_y_filtered',
  'gaze_available',
  'gaze_confidence',
  // Content-mapped
  'content_x',
  'content_y',
  'content_mapping_available',
  // Head pose
  'head_yaw',
  'head_pitch',
  'head_roll',
  'head_tx',
  'head_ty',
  'head_tz',
  // Tracking quality
  'left_eye_quality',
  'right_eye_quality',
  'face_quality',
  'head_pose_quality',
  'selected_signal_quality',
  // Blink / eye state
  'left_eye_open',
  'right_eye_open',
  'blink_state',
  // Head motion
  'head_motion_label',
  // Events
  'event_type',
  'event_start_ms',
  'event_end_ms',
  'event_confidence',
  // Task / stimulus
  'target_x',
  'target_y',
  'target_nx',
  'target_ny',
  'target_id',
  'task_phase',
  // Viewport context (§3.7)
  'viewport_width',
  'viewport_height',
  'device_pixel_ratio',
  'screen_orientation',
  // Processing / data-flow metadata (§4.1, §4.3)
  'pipeline_id',
  'model_name',
  'signal_type',
  'filter_name',
  'mapping_model_id',
  'processing_location',
  'uploaded_data_type',
  'raw_video_saved',
] as const;

export type CsvHeader = (typeof CSV_HEADERS)[number];

/**
 * Format a single cell value for CSV output (RFC 4180):
 *   - `undefined` / `null` → empty string (blank, not zero — §4.1).
 *   - Boolean → 'true' / 'false'.
 *   - Number → decimal string (no quotes needed for well-formed numbers).
 *   - String → wrapped in double-quotes if it contains a comma, double-quote,
 *     or newline; internal double-quotes are doubled.
 */
export function formatCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Serialise an array of session rows to the locked combined CSV string. The
 * header row is always included; non-applicable columns are left blank.
 * Returns an empty CSV (header only) for an empty input.
 */
export function serialiseToCsv(rows: readonly SessionRow[]): string {
  const header = CSV_HEADERS.join(',');
  const dataRows = rows.map((row) => {
    const record = row as unknown as Record<string, unknown>;
    return CSV_HEADERS.map((col) => formatCell(record[col])).join(',');
  });
  return [header, ...dataRows].join('\r\n');
}

/**
 * Trigger a browser download of the session's derived data as a CSV file.
 * The filename defaults to `pocketgaze_<timestamp>.csv`. Nothing is uploaded;
 * the download is entirely local (§2.7).
 */
export function downloadSessionCsv(store: SessionStore, filename?: string): void {
  const csv = serialiseToCsv(store.all());
  interface MinimalDoc {
    createElement(tag: string): { href: string; download: string; click(): void };
    body: { appendChild(n: unknown): void; removeChild(n: unknown): void };
  }
  const doc = (globalThis as { document?: MinimalDoc }).document;
  if (!doc) throw new Error('downloadSessionCsv requires a browser environment');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = doc.createElement('a');
  link.href = url;
  link.download = filename ?? `pocketgaze_${Date.now()}.csv`;
  doc.body.appendChild(link);
  link.click();
  doc.body.removeChild(link);
  URL.revokeObjectURL(url);
}
