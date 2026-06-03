// MediaPipe FaceLandmarker feature-extraction module (specification §3.2, §7.3).
// Framework-agnostic: no React, no DOM except HTMLVideoElement.
//
// Model assets (WASM + face_landmarker.task) are served from the site's own origin —
// no external CDN at runtime (spec §2.7, locked decision §8.14).
//
// Outputs written to the session model per spec §4:
//   left/right_eye_quality, face_quality, left/right_eye_open, blink_state,
//   left/right_eye_x/y_raw (iris-proxy coordinates, normalised 0-1).

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { SessionStore } from './sessionStore';
import type { BlinkState } from '../types/session';
import {
  RIGHT_EYE_EAR_IDX,
  LEFT_EYE_EAR_IDX,
  RIGHT_IRIS_IDX,
  LEFT_IRIS_IDX,
  FACE_QUALITY_IDX,
  computeEAR,
  earToOpenness,
  isEyeOpen,
  landmarkCentroid,
  averageVisibility,
  type Point3,
  type LandmarkLike,
} from './eyeGeometry';

const BASE = import.meta.env.BASE_URL;
const WASM_PATH = `${BASE}mediapipe-vision/wasm`;
const MODEL_PATH = `${BASE}models/face_landmarker.task`;

export const MODEL_NAME = 'mediapipe-face-landmarker';

export type FaceExtractorState = 'uninitialised' | 'loading' | 'ready' | 'error';

export interface EyeFeatures {
  /** Iris proxy: centroid of the 5-point iris ring, normalised 0-1. */
  irisProxy: Point3;
  /** Raw Eye Aspect Ratio. */
  ear: number;
  /** EAR mapped to 0-1 openness. */
  openness: number;
  /** True when EAR is above the blink threshold. */
  isOpen: boolean;
  /** Mean landmark visibility for the eye contour (0-1). */
  quality: number;
}

export interface FaceFeatures {
  leftEye: EyeFeatures;
  rightEye: EyeFeatures;
  /** Mean visibility across a spread of face landmarks (0-1). */
  faceQuality: number;
}

export class FaceFeatureExtractor {
  private landmarker: FaceLandmarker | null = null;
  private initPromise: Promise<void> | null = null;
  private _state: FaceExtractorState = 'uninitialised';

  get state(): FaceExtractorState {
    return this._state;
  }

  /**
   * Initialise the FaceLandmarker. Safe to call multiple times; returns the
   * same promise on concurrent calls. Tries the GPU delegate first, falls
   * back to CPU if the GPU path is unavailable.
   */
  async init(): Promise<void> {
    if (this._state === 'ready') return;
    if (this.initPromise) return this.initPromise;
    this._state = 'loading';
    this.initPromise = this._doInit().catch((err) => {
      this._state = 'error';
      this.initPromise = null;
      throw err;
    });
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
    const shared = {
      baseOptions: { modelAssetPath: MODEL_PATH },
      runningMode: 'VIDEO' as const,
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    };
    try {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...shared,
        baseOptions: { ...shared.baseOptions, delegate: 'GPU' },
      });
    } catch {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...shared,
        baseOptions: { ...shared.baseOptions, delegate: 'CPU' },
      });
    }
    this._state = 'ready';
  }

  /**
   * Process one video frame and write results to the session store.
   *
   * `timestampMs` must be monotonically increasing across calls (use the
   * frame timestamp from requestVideoFrameCallback or performance.now()).
   *
   * Returns null when the landmarker is not ready or no face is detected.
   * Always writes a sample row — with face_quality: 0 when detection fails.
   */
  processFrame(
    video: HTMLVideoElement,
    timestampMs: number,
    store: SessionStore,
    frameId?: number,
  ): FaceFeatures | null {
    if (!this.landmarker || this._state !== 'ready') return null;

    let rawLandmarks: NormalizedLandmark[][] | undefined;
    try {
      const result = this.landmarker.detectForVideo(video, timestampMs);
      rawLandmarks = result.faceLandmarks;
    } catch {
      return null;
    }

    if (!rawLandmarks || rawLandmarks.length === 0) {
      store.addSample({
        frame_id: frameId,
        face_quality: 0,
        left_eye_quality: 0,
        right_eye_quality: 0,
        model_name: MODEL_NAME,
        processing_location: 'browser_local',
      });
      return null;
    }

    const landmarks = rawLandmarks[0] as LandmarkLike[];
    const features = extractFeatures(landmarks);

    const blinkState: BlinkState =
      features.leftEye.isOpen && features.rightEye.isOpen ? 'open' : 'closed';

    store.addSample({
      frame_id: frameId,
      left_eye_x_raw: features.leftEye.irisProxy.x,
      left_eye_y_raw: features.leftEye.irisProxy.y,
      right_eye_x_raw: features.rightEye.irisProxy.x,
      right_eye_y_raw: features.rightEye.irisProxy.y,
      left_eye_quality: features.leftEye.quality,
      right_eye_quality: features.rightEye.quality,
      face_quality: features.faceQuality,
      left_eye_open: features.leftEye.isOpen,
      right_eye_open: features.rightEye.isOpen,
      blink_state: blinkState,
      model_name: MODEL_NAME,
      processing_location: 'browser_local',
    });

    return features;
  }

  /** Release the underlying landmarker and reset state. */
  close(): void {
    try {
      this.landmarker?.close();
    } catch {
      // Ignore errors on close
    }
    this.landmarker = null;
    this._state = 'uninitialised';
    this.initPromise = null;
  }
}

function extractFeatures(landmarks: LandmarkLike[]): FaceFeatures {
  const leftEar = computeEAR(landmarks, LEFT_EYE_EAR_IDX);
  const rightEar = computeEAR(landmarks, RIGHT_EYE_EAR_IDX);

  return {
    leftEye: {
      irisProxy: landmarkCentroid(landmarks, LEFT_IRIS_IDX),
      ear: leftEar,
      openness: earToOpenness(leftEar),
      isOpen: isEyeOpen(leftEar),
      quality: averageVisibility(landmarks, LEFT_EYE_EAR_IDX),
    },
    rightEye: {
      irisProxy: landmarkCentroid(landmarks, RIGHT_IRIS_IDX),
      ear: rightEar,
      openness: earToOpenness(rightEar),
      isOpen: isEyeOpen(rightEar),
      quality: averageVisibility(landmarks, RIGHT_EYE_EAR_IDX),
    },
    faceQuality: averageVisibility(landmarks, FACE_QUALITY_IDX),
  };
}
