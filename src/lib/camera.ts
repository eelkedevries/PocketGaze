// Shared, framework-agnostic camera-access module (specification §3.1, §2.7, §2.8).
//
// Responsibilities are deliberately narrow: request the front camera via
// getUserMedia, hand back the MediaStream, and release it on stop. There is no
// frame-timing, feature extraction, or tracking here (those are later prompts),
// and no frame is ever stored or uploaded — processing stays local (§2.7).

/** Why a camera request failed, mapped to a clear user-facing category. */
export type CameraErrorKind =
  | 'unsupported' // the browser has no getUserMedia (or insecure context)
  | 'denied' // the user (or policy) refused permission
  | 'unavailable' // no camera matched the request
  | 'in_use' // a camera exists but could not be read (busy/hardware)
  | 'unknown';

/** A categorised camera failure, carrying the original error as `cause`. */
export class CameraError extends Error {
  readonly kind: CameraErrorKind;
  readonly cause?: unknown;

  constructor(kind: CameraErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'CameraError';
    this.kind = kind;
    this.cause = cause;
  }
}

/** True when the browser exposes a usable getUserMedia in a secure context. */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Request the front-facing camera. Resolves with a live MediaStream or throws a
 * {@link CameraError}. Caller is responsible for releasing the stream via
 * {@link stopStream} when finished.
 */
export async function startFrontCamera(): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new CameraError(
      'unsupported',
      'Camera capture is not available in this browser. A secure (HTTPS) context and getUserMedia support are required.',
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    });
  } catch (error) {
    throw toCameraError(error);
  }
}

/** Stop every track on a stream, releasing the camera (the indicator turns off). */
export function stopStream(stream: MediaStream | null | undefined): void {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/** Map a getUserMedia rejection onto a {@link CameraError} category. */
function toCameraError(error: unknown): CameraError {
  const name = error instanceof DOMException ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return new CameraError(
        'denied',
        'Camera access was denied. Grant camera permission in your browser and try again.',
        error,
      );
    case 'NotFoundError':
    case 'OverconstrainedError':
      return new CameraError(
        'unavailable',
        'No suitable front camera was found on this device.',
        error,
      );
    case 'NotReadableError':
    case 'AbortError':
      return new CameraError(
        'in_use',
        'The camera could not be started. It may be in use by another application.',
        error,
      );
    default:
      return new CameraError('unknown', 'The camera could not be started.', error);
  }
}
