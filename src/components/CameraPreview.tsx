import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CameraError,
  isCameraSupported,
  startFrontCamera,
  stopStream,
} from '../lib/camera';

// Reusable camera consent-and-preview building block (specification §3.1, §2.7).
//
// It owns the consent flow and stream lifecycle so that later step demos can
// reuse it: the camera is requested only on an explicit user action, never on
// load, and the stream is released on stop and on unmount. Callers receive the
// active stream via `onStreamChange` to attach their own processing (e.g. the
// Step 1 frame-timing demo) without duplicating camera handling.

type Status = 'idle' | 'requesting' | 'active' | 'error';

interface CameraPreviewProps {
  /** Called with the live stream when it starts, and `null` when it stops. */
  onStreamChange?: (stream: MediaStream | null) => void;
}

export default function CameraPreview({ onStreamChange }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<CameraError | null>(null);

  const supported = isCameraSupported();

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
      onStreamChange?.(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [onStreamChange]);

  const handleStart = useCallback(async () => {
    setError(null);
    setStatus('requesting');
    try {
      const stream = await startFrontCamera();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      onStreamChange?.(stream);
      setStatus('active');
    } catch (err) {
      const cameraError =
        err instanceof CameraError
          ? err
          : new CameraError('unknown', 'The camera could not be started.', err);
      setError(cameraError);
      setStatus('error');
    }
  }, [onStreamChange]);

  const handleStop = useCallback(() => {
    releaseStream();
    setStatus('idle');
  }, [releaseStream]);

  // Always release the camera when the component unmounts.
  useEffect(() => releaseStream, [releaseStream]);

  if (!supported) {
    return (
      <div className="camera-preview camera-preview--message" role="alert">
        <p className="camera-preview__message-title">Camera unavailable</p>
        <p className="camera-preview__message-body">
          This browser does not support camera capture, or the page is not served over a
          secure (HTTPS) connection. The live demo cannot run here, but the explanatory
          content above still applies.
        </p>
      </div>
    );
  }

  return (
    <div className="camera-preview">
      <div className="camera-preview__stage">
        <video
          ref={videoRef}
          className="camera-preview__video"
          autoPlay
          muted
          playsInline
          aria-label="Front camera preview"
          hidden={status !== 'active'}
        />
        {status !== 'active' && (
          <div className="camera-preview__placeholder" aria-hidden={status === 'requesting'}>
            {status === 'requesting'
              ? 'Starting camera…'
              : 'The camera preview will appear here once you start it.'}
          </div>
        )}
      </div>

      {status === 'error' && error && (
        <p className="camera-preview__error" role="alert">
          {error.message}
        </p>
      )}

      {status === 'idle' || status === 'error' ? (
        <>
          <p className="camera-preview__consent">
            Starting the camera requests access to your front camera. All processing happens
            locally in your browser — no video is uploaded or stored.
          </p>
          <button type="button" className="button button--primary" onClick={handleStart}>
            {status === 'error' ? 'Try again' : 'Start camera'}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="button"
          onClick={handleStop}
          disabled={status === 'requesting'}
        >
          Stop camera
        </button>
      )}
    </div>
  );
}
