// Head-pose estimation from the MediaPipe facial transformation matrix
// (specification §3.3, §7.3 locked method, §8.15). Pure maths — no DOM, no
// MediaPipe import — so it is fully unit-testable.
//
// The locked method reads the 4x4 facial transformation matrix that the
// FaceLandmarker already produces (no extra model or inference pass) and
// decomposes it into head rotation (yaw/pitch/roll) and an approximate
// translation.
//
// MONOCULAR-TRANSLATION CAVEAT (spec §7.3, Domain rules §6.3/§6.4): with a
// single RGB camera and no metric calibration, the translation — especially
// depth/distance (tz) — is approximate and unscaled. It indicates relative
// change, not true metric distance. Yaw/pitch/roll are more reliable.

export interface HeadPose {
  /** Rotation about the vertical axis (left/right turn), degrees. */
  yaw: number;
  /** Rotation about the horizontal axis (nod up/down), degrees. */
  pitch: number;
  /** Rotation about the view axis (head tilt), degrees. */
  roll: number;
  /** Approximate, unscaled translation (monocular — see caveat). */
  tx: number;
  ty: number;
  tz: number;
  /** Pose-quality proxy in 0-1 (derived from landmark visibility). */
  quality: number;
}

export interface EulerAngles {
  yaw: number;
  pitch: number;
  roll: number;
}

const RAD_TO_DEG = 180 / Math.PI;

/**
 * The MediaPipe facial transformation matrix: a 4x4 matrix in COLUMN-MAJOR
 * order (16-element `data`), mapping the canonical face to the camera.
 */
export interface TransformMatrix {
  rows: number;
  columns: number;
  data: number[];
}

/** Column-major accessor: element at (row, col) of a 4x4 matrix. */
function at(data: number[], row: number, col: number): number {
  return data[col * 4 + row];
}

/**
 * Decompose the rotation part of a 4x4 column-major transform matrix into
 * Tait-Bryan yaw/pitch/roll in degrees (the classic R = Rz·Ry·Rx extraction,
 * robust at the gimbal-lock singularity). Returns zeros for a non-4x4 input.
 */
export function matrixToEulerAngles(data: number[]): EulerAngles {
  if (data.length < 16) return { yaw: 0, pitch: 0, roll: 0 };

  const r00 = at(data, 0, 0);
  const r10 = at(data, 1, 0);
  const r20 = at(data, 2, 0);
  const r21 = at(data, 2, 1);
  const r22 = at(data, 2, 2);
  const r11 = at(data, 1, 1);
  const r12 = at(data, 1, 2);

  const sy = Math.sqrt(r00 * r00 + r10 * r10);
  const singular = sy < 1e-6;

  let pitch: number;
  let yaw: number;
  let roll: number;
  if (!singular) {
    pitch = Math.atan2(r21, r22);
    yaw = Math.atan2(-r20, sy);
    roll = Math.atan2(r10, r00);
  } else {
    pitch = Math.atan2(-r12, r11);
    yaw = Math.atan2(-r20, sy);
    roll = 0;
  }

  return {
    yaw: yaw * RAD_TO_DEG,
    pitch: pitch * RAD_TO_DEG,
    roll: roll * RAD_TO_DEG,
  };
}

/** Translation (last column) of a 4x4 column-major transform matrix. */
export function matrixTranslation(data: number[]): { tx: number; ty: number; tz: number } {
  if (data.length < 16) return { tx: 0, ty: 0, tz: 0 };
  return { tx: at(data, 0, 3), ty: at(data, 1, 3), tz: at(data, 2, 3) };
}

/**
 * Decompose a transform matrix into a full HeadPose.
 *
 * `quality` is a 0-1 pose-quality proxy supplied by the caller (typically the
 * mean landmark visibility), since pose is derived from the landmarks.
 */
export function decomposeHeadPose(matrix: TransformMatrix, quality: number): HeadPose {
  const angles = matrixToEulerAngles(matrix.data);
  const t = matrixTranslation(matrix.data);
  return {
    yaw: angles.yaw,
    pitch: angles.pitch,
    roll: angles.roll,
    tx: t.tx,
    ty: t.ty,
    tz: t.tz,
    quality: Math.max(0, Math.min(1, quality)),
  };
}
