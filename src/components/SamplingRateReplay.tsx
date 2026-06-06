// Synthetic sampling-rate replay (073a). Extends the static coarse-vs-fine figure
// in the SamplingRatePanel with an INTERACTIVE multi-rate replay: one synthetic
// saccade, sampled at 30 / 60 / 250 / 1000 Hz, showing how onset/offset, duration,
// and peak velocity degrade at lower rates.
//
// The saccade is generated from a plausible, parameterised model consistent with
// the MAIN SEQUENCE: duration grows with amplitude (D = 2.2·A + 21 ms, a common
// linear approximation) and a minimum-jerk position profile whose peak velocity
// therefore rises with amplitude. It is clearly labelled synthetic — not measured.

import { useMemo, useState } from 'react';

const RATES = [30, 60, 250, 1000] as const;
const PRE_MS = 12; // quiet baseline before the saccade
const POST_MS = 18; // quiet baseline after

/** Main-sequence-style duration (ms) for a saccade of amplitude A degrees. */
function durationMs(amplitudeDeg: number): number {
  return 2.2 * amplitudeDeg + 21;
}

/** Minimum-jerk saccade position (degrees) at time t ms, onset at 0, amplitude A. */
function positionDeg(tMs: number, amplitudeDeg: number, dMs: number): number {
  if (tMs <= 0) return 0;
  if (tMs >= dMs) return amplitudeDeg;
  const tau = tMs / dMs;
  return amplitudeDeg * (10 * tau ** 3 - 15 * tau ** 4 + 6 * tau ** 5);
}

/** Analytic true peak velocity (deg/s): 1.875·A/D, at the midpoint of a min-jerk saccade. */
function truePeakVelocity(amplitudeDeg: number, dMs: number): number {
  return (1.875 * amplitudeDeg) / (dMs / 1000);
}

interface RateResult {
  rate: number;
  samples: { t: number; x: number }[];
  measuredPeak: number;
  samplesInSaccade: number;
}

function sampleAtRate(rate: number, amplitudeDeg: number, dMs: number): RateResult {
  const stepMs = 1000 / rate;
  const start = -PRE_MS;
  const end = dMs + POST_MS;
  const samples: { t: number; x: number }[] = [];
  for (let t = start; t <= end + 1e-6; t += stepMs) {
    samples.push({ t, x: positionDeg(t, amplitudeDeg, dMs) });
  }
  let measuredPeak = 0;
  for (let i = 1; i < samples.length; i++) {
    const dv = Math.abs(samples[i].x - samples[i - 1].x) / (stepMs / 1000);
    if (dv > measuredPeak) measuredPeak = dv;
  }
  const samplesInSaccade = samples.filter((s) => s.t >= 0 && s.t <= dMs).length;
  return { rate, samples, measuredPeak, samplesInSaccade };
}

const PLOT_W = 240;
const PLOT_H = 120;
const PAD = 8;

export default function SamplingRateReplay() {
  const [amplitude, setAmplitude] = useState(10);
  const dMs = durationMs(amplitude);
  const truePeak = truePeakVelocity(amplitude, dMs);

  const results = useMemo(
    () => RATES.map((r) => sampleAtRate(r, amplitude, dMs)),
    [amplitude, dMs],
  );

  // Dense ground-truth curve for the faint background trace.
  const dense = useMemo(() => {
    const pts: { t: number; x: number }[] = [];
    for (let t = -PRE_MS; t <= dMs + POST_MS; t += 0.5) {
      pts.push({ t, x: positionDeg(t, amplitude, dMs) });
    }
    return pts;
  }, [amplitude, dMs]);

  const tMin = -PRE_MS;
  const tMax = dMs + POST_MS;
  const mapX = (t: number) => PAD + ((t - tMin) / (tMax - tMin)) * (PLOT_W - 2 * PAD);
  const mapY = (x: number) => PLOT_H - PAD - (x / amplitude) * (PLOT_H - 2 * PAD);
  const densePath = dense.map((p, i) => `${i === 0 ? 'M' : 'L'}${mapX(p.t).toFixed(1)},${mapY(p.x).toFixed(1)}`).join(' ');

  return (
    <div className="rate-replay">
      <h4 className="rate-replay__title">Interactive: the same saccade at four sampling rates</h4>
      <p className="rate-replay__intro">
        A single <strong>synthetic</strong> saccade (a minimum-jerk profile whose duration follows a
        main-sequence rule, <em>not</em> recorded data), sampled at four rates. Watch how the coarse
        rates miss the peak velocity and blur the onset and offset.
      </p>

      <label className="rate-replay__control">
        Saccade amplitude: <strong>{amplitude}°</strong>
        <input
          type="range"
          min={2}
          max={20}
          step={1}
          value={amplitude}
          onChange={(e) => setAmplitude(Number(e.target.value))}
          aria-label="Saccade amplitude in degrees"
        />
      </label>
      <p className="rate-replay__truth">
        Model: duration ≈ {dMs.toFixed(0)} ms, true peak velocity ≈ {truePeak.toFixed(0)} °/s.
      </p>

      <div className="rate-replay__grid">
        {results.map((res) => {
          const pct = Math.round((res.measuredPeak / truePeak) * 100);
          return (
            <figure className="rate-replay__cell" key={res.rate}>
              <svg
                viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
                width="100%"
                role="img"
                aria-label={`Saccade sampled at ${res.rate} hertz: ${res.samplesInSaccade} samples span the saccade; measured peak velocity ${res.measuredPeak.toFixed(0)} degrees per second, about ${pct} percent of the true peak.`}
              >
                <rect x={0} y={0} width={PLOT_W} height={PLOT_H} fill="#111827" rx={4} />
                <path d={densePath} fill="none" stroke="#33405480" strokeWidth={2} />
                <path
                  d={res.samples
                    .map((p, i) => `${i === 0 ? 'M' : 'L'}${mapX(p.t).toFixed(1)},${mapY(p.x).toFixed(1)}`)
                    .join(' ')}
                  fill="none"
                  stroke="#4c9aff"
                  strokeWidth={1.5}
                />
                {res.samples.map((p, i) => (
                  <circle key={i} cx={mapX(p.t)} cy={mapY(p.x)} r={2.2} fill="#f0b429" />
                ))}
              </svg>
              <figcaption className="rate-replay__caption">
                <strong>{res.rate} Hz</strong> · {res.samplesInSaccade} sample
                {res.samplesInSaccade === 1 ? '' : 's'} in the saccade · peak {res.measuredPeak.toFixed(0)}{' '}
                °/s ({pct}% of true)
              </figcaption>
            </figure>
          );
        })}
      </div>
      <p className="rate-replay__note">
        At 30 Hz only a sample or two land within the movement, so the recovered peak velocity is a
        large under-estimate and the onset/offset are ambiguous — the limitation made interactive.
      </p>
    </div>
  );
}
