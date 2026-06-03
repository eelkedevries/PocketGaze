// In-memory session store for the PocketGaze pipeline (specification §2.3).
//
// Accumulates typed rows (the §4 row types) in the order they are produced and
// exposes typed add/query methods. It owns the session clock: `time_ms` on each
// row is milliseconds from session start, on one monotonic clock shared by every
// subsystem. The store holds derived data only — never raw video (§2.7).
//
// This module deliberately does NOT serialise or export data; that is prompt 031.

import type {
  CalibrationRow,
  EventRow,
  QualityRow,
  RowInput,
  RowOfType,
  RowType,
  SampleRow,
  SessionRow,
  StimulusRow,
} from '../types/session.ts';

export interface SessionStoreOptions {
  /**
   * Monotonic clock returning milliseconds. Defaults to `performance.now`
   * (available in browsers and Node). Injectable so tests are deterministic.
   */
  now?: () => number;
}

export class SessionStore {
  private readonly rows: SessionRow[] = [];
  private readonly clock: () => number;
  private readonly startTime: number;

  constructor(options: SessionStoreOptions = {}) {
    this.clock = options.now ?? (() => performance.now());
    this.startTime = this.clock();
  }

  /** Milliseconds elapsed since the session (store) was created. */
  elapsedMs(): number {
    return this.clock() - this.startTime;
  }

  /** Add a time-series sample. `time_ms` is stamped from session start if omitted. */
  addSample(input: RowInput<SampleRow>): SampleRow {
    const { time_ms, ...rest } = input;
    const row: SampleRow = {
      row_type: 'sample',
      time_ms: time_ms ?? this.elapsedMs(),
      ...rest,
    };
    this.rows.push(row);
    return row;
  }

  /** Add a candidate event row (§5 vocabulary). */
  addEvent(input: RowInput<EventRow>): EventRow {
    const { time_ms, ...rest } = input;
    const row: EventRow = {
      row_type: 'event',
      time_ms: time_ms ?? this.elapsedMs(),
      ...rest,
    };
    this.rows.push(row);
    return row;
  }

  /** Add a calibration target row. */
  addCalibration(input: RowInput<CalibrationRow>): CalibrationRow {
    const { time_ms, ...rest } = input;
    const row: CalibrationRow = {
      row_type: 'calibration',
      time_ms: time_ms ?? this.elapsedMs(),
      ...rest,
    };
    this.rows.push(row);
    return row;
  }

  /** Add a stimulus / task event row. */
  addStimulus(input: RowInput<StimulusRow>): StimulusRow {
    const { time_ms, ...rest } = input;
    const row: StimulusRow = {
      row_type: 'stimulus',
      time_ms: time_ms ?? this.elapsedMs(),
      ...rest,
    };
    this.rows.push(row);
    return row;
  }

  /** Add a signal-quality summary row. */
  addQuality(input: RowInput<QualityRow>): QualityRow {
    const { time_ms, ...rest } = input;
    const row: QualityRow = {
      row_type: 'quality',
      time_ms: time_ms ?? this.elapsedMs(),
      ...rest,
    };
    this.rows.push(row);
    return row;
  }

  /** All rows, in insertion order. */
  all(): readonly SessionRow[] {
    return this.rows;
  }

  /** Rows of a single type, narrowed to that row's shape. */
  byType<T extends RowType>(type: T): ReadonlyArray<RowOfType<T>> {
    return this.rows.filter((row): row is RowOfType<T> => row.row_type === type);
  }

  /** Total number of rows held. */
  count(): number {
    return this.rows.length;
  }

  /** Remove all rows (e.g. when starting a fresh session). */
  clear(): void {
    this.rows.length = 0;
  }
}
