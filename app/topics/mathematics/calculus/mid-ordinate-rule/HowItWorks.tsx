"use client";

import { useMemo, useState } from "react";
import { MidOrdinateRuleFormula, MidOrdinateWorkedExample } from "./MidOrdinateFormula";

const WIDTH = 900;
const HEIGHT = 420;

type View = { xMin: number; xMax: number; yMin: number; yMax: number };

const VIEW: View = { xMin: -0.2, xMax: 2.4, yMin: -0.3, yMax: 4.5 };
const A = 0;
const B = 2;
const N = 4;

const f = (x: number) => x * x;

function toSvgX(x: number) {
  return ((x - VIEW.xMin) / (VIEW.xMax - VIEW.xMin)) * WIDTH;
}

function toSvgY(y: number) {
  return HEIGHT - ((y - VIEW.yMin) / (VIEW.yMax - VIEW.yMin)) * HEIGHT;
}

function rectFillPath(x0: number, x1: number, yMid: number) {
  const baseY = toSvgY(0);
  const px0 = toSvgX(x0);
  const px1 = toSvgX(x1);
  const py = toSvgY(yMid);
  return `M ${px0} ${baseY} L ${px0} ${py} L ${px1} ${py} L ${px1} ${baseY} Z`;
}

function curvePath(xLo: number, xHi: number) {
  let d = "";
  const samples = 200;
  for (let i = 0; i <= samples; i++) {
    const x = xLo + (i / samples) * (xHi - xLo);
    const y = f(x);
    const px = toSvgX(x);
    const py = toSvgY(y);
    d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
  }
  return d;
}

const STEPS: { title: string; body: string }[] = [
  {
    title: "Still an area problem",
    body: "∫₀² x² dx again. Exact value 8/3 - we’re just approximating because that’s what numerical integration pages are for.",
  },
  {
    title: "Split the interval",
    body: "n = 4 strips, h = 0.5. Vertical lines at 0, 0.5, 1, 1.5, 2 mark the strip boundaries.",
  },
  {
    title: "Midpoints",
    body: "For each strip, take the x halfway along: 0.25, 0.75, 1.25, 1.75. You don’t use the endpoints for the height (that would be a different rectangle rule).",
  },
  {
    title: "Height at the middle",
    body: "Evaluate f at the midpoint. That’s how tall the rectangle is - flat across the whole strip.",
  },
  {
    title: "One rectangle",
    body: "First strip: width h, height f(0.25). Area = h × f(m₁). The curve might poke above or below the bar; that’s the error.",
  },
  {
    title: "Second strip",
    body: "Same on [0.5, 1] with m₂ = 0.75. Each strip gets its own bar; they don’t share corners like trapeziums do.",
  },
  {
    title: "All bars",
    body: "Four rectangles. Looks like a histogram hugging the curve from the middle of each bin.",
  },
  {
    title: "Sum",
    body: "h times the sum of the four mid-heights gives 2.625 for this example - slightly under 8/3. Crank n on the other tab and see it move.",
  },
];

export default function HowItWorks() {
  const [step, setStep] = useState(0);

  const h = (B - A) / N;
  const xs = useMemo(() => Array.from({ length: N + 1 }, (_, i) => A + i * h), [h]);
  const mids = useMemo(
    () => Array.from({ length: N }, (_, i) => A + (i + 0.5) * h),
    [h]
  );
  const midYs = useMemo(() => mids.map((x) => f(x)), [mids]);

  const rects = useMemo(
    () =>
      Array.from({ length: N }, (_, i) =>
        rectFillPath(xs[i], xs[i + 1], midYs[i])
      ),
    [xs, midYs]
  );

  const s = step;
  const showGrid = s >= 1;
  const showMids = s >= 2;
  const showMidDot = s >= 3;
  const fillRect0 = s >= 4;
  const fillRect1 = s >= 5;
  const allRects = s >= 6;
  const xAxisY = toSvgY(0);

  return (
    <div className="stack" style={{ marginTop: 18 }}>
      <div className="card">
        <div className="graphHeader">
          <div>Walkthrough (f(x) = x², a = 0, b = 2, n = 4)</div>
          <div className="graphHint">
            Step {s + 1} of {STEPS.length}: {STEPS[s].title}
          </div>
        </div>

        <div style={{ height: 420 }}>
          <div className="canvasCard" style={{ height: "100%", padding: 0, overflow: "hidden" }}>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: "100%", display: "block" }}>
              <line x1={0} y1={xAxisY} x2={WIDTH} y2={xAxisY} stroke="rgba(255,255,255,0.18)" strokeWidth={2} />

              <path d={curvePath(A, B)} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />

              {showGrid &&
                xs.map((x) => (
                  <line
                    key={`v-${x}`}
                    x1={toSvgX(x)}
                    y1={0}
                    x2={toSvgX(x)}
                    y2={HEIGHT}
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth={1.5}
                    strokeDasharray="5 6"
                  />
                ))}

              {showMids &&
                mids.map((x) => (
                  <line
                    key={`m-${x}`}
                    x1={toSvgX(x)}
                    y1={0}
                    x2={toSvgX(x)}
                    y2={HEIGHT}
                    stroke="rgba(236,72,153,0.35)"
                    strokeWidth={1.5}
                    strokeDasharray="4 8"
                  />
                ))}

              {(allRects || fillRect0) && (
                <path
                  d={rects[0]}
                  fill="rgba(125,211,252,0.28)"
                  stroke="rgba(125,211,252,0.45)"
                  strokeWidth={1}
                />
              )}

              {(allRects || fillRect1) && (
                <path
                  d={rects[1]}
                  fill="rgba(125,211,252,0.28)"
                  stroke="rgba(125,211,252,0.45)"
                  strokeWidth={1}
                  style={{ opacity: allRects ? 1 : 0.85 }}
                />
              )}

              {allRects &&
                rects.slice(2).map((d, i) => (
                  <path
                    key={`r-${i + 2}`}
                    d={d}
                    fill="rgba(125,211,252,0.28)"
                    stroke="rgba(125,211,252,0.45)"
                    strokeWidth={1}
                  />
                ))}

              {showMidDot &&
                mids.map((x, i) => {
                  const y = midYs[i];
                  const cx = toSvgX(x);
                  const cy = toSvgY(y);
                  const highlight =
                    !allRects && (((s === 3 || s === 4) && i === 0) || (s === 5 && i === 1));
                  const showThis = allRects || s < 4 || i <= (s >= 5 ? 1 : 0);
                  if (!showThis && s >= 3 && s < 6) return null;
                  if (s === 3 && i > 0) return null;
                  if (s === 4 && i > 0) return null;
                  if (s === 5 && i > 1) return null;
                  return (
                    <g key={`mid-${i}`}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={cx}
                        y2={xAxisY}
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1}
                        strokeDasharray="4 5"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={highlight ? 7 : 5}
                        fill={highlight ? "var(--accent3)" : "var(--accent2)"}
                      />
                    </g>
                  );
                })}

              {allRects &&
                mids.map((x, i) => {
                  const y = midYs[i];
                  return (
                    <circle key={`all-mid-${i}`} cx={toSvgX(x)} cy={toSvgY(y)} r={5} fill="var(--accent2)" />
                  );
                })}

              <line
                x1={toSvgX(A)}
                y1={0}
                x2={toSvgX(A)}
                y2={HEIGHT}
                stroke="rgba(236,72,153,0.55)"
                strokeWidth={2}
                strokeDasharray="6 6"
              />
              <line
                x1={toSvgX(B)}
                y1={0}
                x2={toSvgX(B)}
                y2={HEIGHT}
                stroke="rgba(236,72,153,0.55)"
                strokeWidth={2}
                strokeDasharray="6 6"
              />
            </svg>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 14,
            alignItems: "center",
          }}
        >
          <button type="button" className="backLink" onClick={() => setStep((x) => Math.max(0, x - 1))}>
            ← Prev
          </button>
          <button
            type="button"
            className="backLink"
            onClick={() => setStep((x) => Math.min(STEPS.length - 1, x + 1))}
          >
            Next →
          </button>
        </div>

        <div className="divider" />

        <div className="h2" style={{ marginBottom: 8 }}>
          {STEPS[s].title}
        </div>
        <p className="para" style={{ marginBottom: 0 }}>
          {STEPS[s].body}
        </p>

        {s === STEPS.length - 1 && (
          <div style={{ marginTop: 14 }}>
            <MidOrdinateRuleFormula />
            <MidOrdinateWorkedExample />
          </div>
        )}
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            aria-label={`Go to step ${i + 1}`}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: i === s ? "rgba(125,211,252,0.95)" : "rgba(255,255,255,0.22)",
            }}
          />
        ))}
      </div>

      <div className="card">
        <div className="h2" style={{ marginBottom: 12 }}>
          In short
        </div>
        <p className="para">
          Textbooks call this the mid-ordinate rule. Same strips as trapezium rule, but each contribution is a rectangle from the strip midpoint.
        </p>
        <p className="para" style={{ marginBottom: 0 }}>
          If your teacher says “rectangle rule” they might mean left/right endpoints instead - this page is specifically the midpoint version.
        </p>
      </div>
    </div>
  );
}
