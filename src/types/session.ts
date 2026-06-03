// Shared data/session model for the whole PocketGaze pipeline.
//
// This is the single source of truth for the internal data shape (spec §2.3).
// Capture, feature extraction, head pose, eye-local/gaze signals, calibration,
// filtering/events, and content mapping all write rows to this model rather
// than inventing their own. The derived-data export (prompt 031) serialises
// this model; it does not define new shapes.
//
// The model mirrors the locked export schema in specification §4:
//   - five row types (§4.2): sample, event, calibration, stimulus, quality;
//   - the §4.3 field groups, with raw and filtered signals as SEPARATE fields
//     (§4.1) so the data stays reanalysable;
//   - optional fields represent "not applicable" (blank), which is distinct
//     from a real 0 (§4.1);
//   - `time_ms` is milliseconds from session start, shared across subsystems.

/** The five row types (specification §4.2). */
export type RowType = 'sample' | 'event' | 'calibration' | 'stimulus' | 'quality';

/**
 * Candidate event vocabulary (specification §5). Events are labelled cautiously
 * as candidates when reference validation is unavailable.
 */
export type EventType =
  | 'blink'
  | 'tracking_lost'
  | 'fixation_candidate'
  | 'saccade_candidate'
  | 'saccade_head_still'
  | 'saccade_during_head_movement'
  | 'uncertain_head_motion'
  | 'calibration_target'
  | 'stimulus_event';

/** Head-motion quality label attached to events/samples (specification §3.3). */
export type HeadMotionLabel = 'low' | 'moderate' | 'uncertain';

/**
 * Which signal is selected/active for a sample (specification §6.2, §7.2).
 * Kept distinct so eye-local movement is never conflated with screen gaze.
 */
export type SignalType = 'eye_local' | 'screen_gaze' | 'content_mapped';

/** Where processing happened (specification §2.7). Only browser-local is implemented here. */
export type ProcessingLocation = 'browser_local' | 'android_local' | 'cloud';

/** Coarse eyelid state for a sample. */
export type BlinkState = 'open' | 'closed';

// --- §4.3 field groups -------------------------------------------------------

/** Timing fields. `time_ms` is required on every row (ms from session start). */
export interface TimingFields {
  time_ms: number;
  frame_id?: number;
  video_frame_time?: number;
  capture_time?: number;
  processing_latency_ms?: number;
}

/** Eye-local signal — raw (minimally processed), normalised within the eye region. */
export interface EyeLocalRawFields {
  left_eye_x_raw?: number;
  left_eye_y_raw?: number;
  right_eye_x_raw?: number;
  right_eye_y_raw?: number;
  combined_eye_x_raw?: number;
  combined_eye_y_raw?: number;
}

/** Eye-local signal — filtered counterpart (kept in separate columns, §4.1). */
export interface EyeLocalFilteredFields {
  left_eye_x_filtered?: number;
  left_eye_y_filtered?: number;
  right_eye_x_filtered?: number;
  right_eye_y_filtered?: number;
  combined_eye_x_filtered?: number;
  combined_eye_y_filtered?: number;
}

/** Screen-gaze signal — raw and filtered coordinates plus availability/confidence. */
export interface ScreenGazeFields {
  gaze_x_raw?: number;
  gaze_y_raw?: number;
  gaze_x_filtered?: number;
  gaze_y_filtered?: number;
  gaze_available?: boolean;
  gaze_confidence?: number;
}

/** Content-mapped signal — screen gaze transformed into content/stimulus space. */
export interface ContentMappedFields {
  content_x?: number;
  content_y?: number;
  content_mapping_available?: boolean;
}

/** Head pose — rotation and translation. */
export interface HeadPoseFields {
  head_yaw?: number;
  head_pitch?: number;
  head_roll?: number;
  head_tx?: number;
  head_ty?: number;
  head_tz?: number;
}

/** Tracking-quality scores. */
export interface TrackingQualityFields {
  left_eye_quality?: number;
  right_eye_quality?: number;
  face_quality?: number;
  head_pose_quality?: number;
  selected_signal_quality?: number;
}

/** Blink / eye-state fields. */
export interface BlinkEyeStateFields {
  left_eye_open?: boolean;
  right_eye_open?: boolean;
  blink_state?: BlinkState;
}

/** Event fields (only meaningful on `event` rows). */
export interface EventFields {
  event_type?: EventType;
  event_start_ms?: number;
  event_end_ms?: number;
  event_confidence?: number;
  head_motion_label?: HeadMotionLabel;
}

/** Task / stimulus fields (calibration and stimulus rows). */
export interface TaskStimulusFields {
  target_x?: number;
  target_y?: number;
  target_id?: string;
  task_phase?: string;
}

/** Processing / data-flow metadata for reproducibility (specification §4.1). */
export interface ProcessingMetadataFields {
  pipeline_id?: string;
  model_name?: string;
  signal_type?: SignalType;
  filter_name?: string;
  mapping_model_id?: string;
  processing_location?: ProcessingLocation;
  uploaded_data_type?: string;
  raw_video_saved?: boolean;
}

// --- Row types (specification §4.2) -----------------------------------------

/** A time-series sample: the main per-frame signal row. */
export interface SampleRow
  extends TimingFields,
    EyeLocalRawFields,
    EyeLocalFilteredFields,
    ScreenGazeFields,
    ContentMappedFields,
    HeadPoseFields,
    TrackingQualityFields,
    BlinkEyeStateFields,
    ProcessingMetadataFields {
  row_type: 'sample';
}

/** A detected candidate event (blink, fixation/saccade candidate, tracking loss, ...). */
export interface EventRow extends TimingFields, EventFields, ProcessingMetadataFields {
  row_type: 'event';
  /** Events always carry a label from the §5 vocabulary. */
  event_type: EventType;
}

/** A calibration dot/click target used to fit a mapping. */
export interface CalibrationRow
  extends TimingFields,
    TaskStimulusFields,
    EyeLocalRawFields,
    ScreenGazeFields,
    ProcessingMetadataFields {
  row_type: 'calibration';
}

/** A task or display (stimulus) event aligned with the tracking stream. */
export interface StimulusRow
  extends TimingFields,
    TaskStimulusFields,
    ProcessingMetadataFields {
  row_type: 'stimulus';
}

/** An optional signal-quality summary row. */
export interface QualityRow
  extends TimingFields,
    TrackingQualityFields,
    ProcessingMetadataFields {
  row_type: 'quality';
}

/** Any row that can be stored in a session. */
export type SessionRow = SampleRow | EventRow | CalibrationRow | StimulusRow | QualityRow;

/** A row of a specific `row_type`. */
export type RowOfType<T extends RowType> = Extract<SessionRow, { row_type: T }>;

/**
 * Input accepted by the session store's add methods: the row body without the
 * fixed `row_type` discriminant, with `time_ms` optional (stamped by the store
 * from session start when omitted).
 */
export type RowInput<T extends SessionRow> = Omit<T, 'row_type' | 'time_ms'> & {
  time_ms?: number;
};
