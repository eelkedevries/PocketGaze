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
  | 'smooth_pursuit_candidate'
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

/** Screen/viewport orientation (specification §3.7). */
export type ScreenOrientationLabel = 'portrait' | 'landscape';

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

/**
 * Eye-local SIGNAL (specification §3.4, §4.3 "Eye-local signal", glossary §7.2,
 * Domain rule §6.2): the iris/pupil proxy normalised WITHIN each detected eye
 * region. Calibration-light and available when eye-region and iris detection
 * succeed with sufficient quality — but **not** screen gaze.
 *
 * Kept in its own field group, separate from `ScreenGazeFields` and
 * `ContentMappedFields`, so the three signal kinds are never conflated
 * (§6.2). These are the unfiltered eye-local coordinates; their filtered
 * counterparts live in `EyeLocalFilteredFields`, and the raw iris-proxy feature
 * coordinates (camera-frame) live in `EyeLocalRawFields`.
 */
export interface EyeLocalSignalFields {
  left_eye_x?: number;
  left_eye_y?: number;
  right_eye_x?: number;
  right_eye_y?: number;
  combined_eye_x?: number;
  combined_eye_y?: number;
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

/**
 * Head-pose translation in APPROXIMATE millimetres (specification §3.3, §6.3),
 * derived from the raw `head_tx/ty/tz` and the IOD-based viewing-distance
 * estimate (`038`/`039`). Monocular and assumption-bound — an estimate, not a
 * measurement. The raw `HeadPoseFields` translation is preserved separately.
 */
export interface HeadTranslationMmFields {
  head_tx_mm?: number;
  head_ty_mm?: number;
  head_tz_mm?: number;
}

/**
 * Visual-angle estimate per sample (specification §3.3, §3.4, §6.3). Derived from
 * the image inter-ocular separation plus assumptions (`038`/`039`): a selfie
 * camera can only approximate degrees of visual angle, so `angular_scale_is_estimate`
 * is set whenever these are written. Blank (not 0) when no face is detected.
 */
export interface VisualAngleFields {
  viewing_distance_mm?: number;
  deg_per_norm_x?: number;
  deg_per_norm_y?: number;
  angular_scale_is_estimate?: boolean;
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

/**
 * Head-motion contamination label (specification §3.3, §5). Attached to both
 * samples and events so uncertain intervals can be excluded from later event
 * detection.
 */
export interface HeadMotionFields {
  head_motion_label?: HeadMotionLabel;
}

/** Event fields (only meaningful on `event` rows). */
export interface EventFields {
  event_type?: EventType;
  event_start_ms?: number;
  event_end_ms?: number;
  event_confidence?: number;
}

/** Task / stimulus fields (calibration and stimulus rows). */
export interface TaskStimulusFields {
  /** Target position in CSS pixels (device-specific). */
  target_x?: number;
  target_y?: number;
  /**
   * Target position in NORMALISED screen coordinates (0–1), resolution- and
   * orientation-independent — kept alongside the CSS-pixel target so a
   * calibration stays interpretable across viewports (`021`).
   */
  target_nx?: number;
  target_ny?: number;
  target_id?: string;
  task_phase?: string;
}

/**
 * Viewport / screen context (specification §3.7). Needed to interpret screen
 * coordinates: the same CSS-pixel target means a different physical/normalised
 * position under a different viewport size, orientation, or device-pixel ratio.
 * Logged on `stimulus` rows and refreshed whenever the context changes.
 */
export interface ViewportContextFields {
  /** Viewport (layout) width in CSS pixels. */
  viewport_width?: number;
  /** Viewport (layout) height in CSS pixels. */
  viewport_height?: number;
  /** Device-pixel ratio (CSS px → device px). */
  device_pixel_ratio?: number;
  /** Coarse orientation derived from the viewport aspect ratio. */
  screen_orientation?: ScreenOrientationLabel;
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
    EyeLocalSignalFields,
    EyeLocalFilteredFields,
    ScreenGazeFields,
    ContentMappedFields,
    HeadPoseFields,
    HeadTranslationMmFields,
    VisualAngleFields,
    TrackingQualityFields,
    BlinkEyeStateFields,
    HeadMotionFields,
    ProcessingMetadataFields {
  row_type: 'sample';
}

/** A detected candidate event (blink, fixation/saccade candidate, tracking loss, ...). */
export interface EventRow
  extends TimingFields,
    EventFields,
    HeadMotionFields,
    ProcessingMetadataFields {
  row_type: 'event';
  /** Events always carry a label from the §5 vocabulary. */
  event_type: EventType;
}

/** A calibration dot/click target used to fit a mapping. */
export interface CalibrationRow
  extends TimingFields,
    TaskStimulusFields,
    EyeLocalRawFields,
    EyeLocalSignalFields,
    ScreenGazeFields,
    ProcessingMetadataFields {
  row_type: 'calibration';
}

/** A task or display (stimulus) event aligned with the tracking stream. */
export interface StimulusRow
  extends TimingFields,
    TaskStimulusFields,
    ViewportContextFields,
    ProcessingMetadataFields {
  row_type: 'stimulus';
}

/**
 * An optional signal-quality summary row. Also used to record held-out
 * VALIDATION samples (`035`): a `quality` row tagged `task_phase: 'validation'`
 * carries the validation target (CSS px + normalised, via `TaskStimulusFields`)
 * and the concurrent screen-gaze estimate (via `ScreenGazeFields`) so accuracy
 * and precision can be measured on points the calibration never saw (§3.5, §6.3).
 * Validation rows stay distinct from `calibration` rows through `task_phase`.
 */
export interface QualityRow
  extends TimingFields,
    TaskStimulusFields,
    ScreenGazeFields,
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
