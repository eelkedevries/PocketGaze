// Shared coordinate-system schematic (066): traces a single point through the
// pipeline's coordinate chain — camera frame -> landmarks -> eye-region-local ->
// screen -> viewport -> content/AOI. Minimalist, labelled, landscape inline SVG.
// Reused on Steps 0, 4, 5, and 7 via the `coordinateFigure` flag in steps.ts.

interface Stage {
  name: string;
  coords: string;
}

const STAGES: Stage[] = [
  { name: 'Camera frame', coords: 'pixel (u, v)' },
  { name: 'Landmarks', coords: 'face points' },
  { name: 'Eye-region-local', coords: 'iris −1…1' },
  { name: 'Screen-gaze', coords: 'x/y 0…1' },
  { name: 'Viewport', coords: 'CSS px' },
  { name: 'Content / AOI', coords: 'content x/y' },
];

const ALT_TEXT =
  'A point is traced left to right through six coordinate systems, each an arrow on from the last: ' +
  'the camera frame in pixels, the detected face landmarks, the eye-region-local frame where the ' +
  'iris centre is normalised to roughly minus one to one, the screen-gaze estimate in normalised ' +
  'zero-to-one screen coordinates, the browser viewport in CSS pixels, and finally the content or ' +
  'area-of-interest coordinates after scrolling and zooming.';

const BOX_W = 104;
const BOX_H = 52;
const GAP = 18;
const MARGIN_X = 12;
const TOP = 40;
const VIEW_W = MARGIN_X * 2 + STAGES.length * BOX_W + (STAGES.length - 1) * GAP;
const VIEW_H = 132;

export default function CoordinateChainFigure() {
  return (
    <figure className="coord-figure">
      <svg
        className="coord-figure__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        role="img"
        aria-label={ALT_TEXT}
      >
        <title>Coordinate chain from camera frame to content/AOI coordinates</title>
        <desc>{ALT_TEXT}</desc>
        {STAGES.map((stage, i) => {
          const x = MARGIN_X + i * (BOX_W + GAP);
          const cx = x + BOX_W / 2;
          return (
            <g key={stage.name}>
              <rect
                x={x}
                y={TOP}
                width={BOX_W}
                height={BOX_H}
                rx={6}
                fill="#1b2330"
                stroke="#4c9aff"
                strokeWidth={1.25}
              />
              {/* the traced point, in the same relative spot in each box */}
              <circle cx={x + BOX_W * 0.66} cy={TOP + BOX_H * 0.4} r={4} fill="#f0b429" />
              <text x={cx} y={TOP + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="#e6edf3">
                {stage.name}
              </text>
              <text x={cx} y={TOP + 40} textAnchor="middle" fontSize="10" fill="#9bacc4">
                {stage.coords}
              </text>
              {i > 0 && (
                <line
                  x1={x - GAP}
                  y1={TOP + BOX_H / 2}
                  x2={x}
                  y2={TOP + BOX_H / 2}
                  stroke="#9bacc4"
                  strokeWidth={1.25}
                  markerEnd="url(#coord-arrow)"
                />
              )}
            </g>
          );
        })}
        <defs>
          <marker
            id="coord-arrow"
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="#9bacc4" />
          </marker>
        </defs>
        <text x={MARGIN_X} y={VIEW_H - 10} fontSize="10" fill="#9bacc4">
          The same point, re-expressed at each stage. Calibration is needed before the screen-gaze
          stage; scroll/zoom is accounted for at the content stage.
        </text>
      </svg>
      <figcaption className="coord-figure__caption">
        Coordinate chain: camera frame → landmarks → eye-region-local → screen-gaze → viewport →
        content/AOI.
      </figcaption>
    </figure>
  );
}
