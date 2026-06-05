import type { RollingPrecisionValue } from '../lib/livePrecision';

// Compact live-precision display (specification §3.6, §6.3). Shows the rolling
// sample-to-sample RMS of the current signal in normalised units, with the
// window length and a "lower is steadier" caption so the figure is interpretable
// in real time. It is a live derived readout, not a validated device-precision
// figure (§6.3); degree units are added later (`040`).

interface LivePrecisionProps {
  value: RollingPrecisionValue | null;
  windowLength: number;
  /** Optional label for the signal being measured (e.g. "eye-local"). */
  signalLabel?: string;
}

export default function LivePrecision({ value, windowLength, signalLabel }: LivePrecisionProps) {
  const ready = value != null && value.count >= 2;
  return (
    <div className="live-precision motion-label motion-label--low" aria-live="polite">
      <span className="motion-label__caption">
        Live precision — RMS-S2S{signalLabel ? ` (${signalLabel})` : ''}, normalised
      </span>
      <span className="motion-label__value">{ready ? value!.rmsS2S.toFixed(3) : '—'}</span>
      <span className="live-precision__hint">
        Rolling over the last {windowLength} samples · lower is steadier. A live data-quality cue,
        not a validated device-precision figure.
      </span>
    </div>
  );
}
