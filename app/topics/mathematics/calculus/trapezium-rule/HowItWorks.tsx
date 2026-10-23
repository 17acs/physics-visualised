"use client";

import { useMemo, useState } from "react";
import { TrapeziumRuleFormula, TrapeziumWorkedExample } from "./TrapeziumFormula";

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

function trapFillPath(x0: number, x1: number, y0: number, y1: number) {
  const baseY = toSvgY(0);
  const px0 = toSvgX(x0);
  const px1 = toSvgX(x1);
  const py0 = toSvgY(y0);
  const py1 = toSvgY(y1);
  return `M ${px0} ${baseY} L ${px0} ${py0} L ${px1} ${py1} L ${px1} ${baseY} Z`;
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
    title: "Area under the curve",
    body: "Same setup as Simpson’s: we want ∫₀² x² dx. Exact answer is 8/3.",
  },
  {
    title: "Equal strips",
    body: "Pick n strips. Here n = 4 so h = 0.5. Mark the ends: 0, 0.5, 1, 1.5, 2.",
  },
  {
    title: "Heights at the ends",
    body: "Read f off the curve at each vertical line. Those are the only numbers you need.",
  },
  {
    title: "One trapezium",
    body: "On the first strip, join the two heights with a straight line. The bit under that line is a trapezium - not a rectangle, because the top is slanted.",
  },
  {
    title: "Area of that trapezium",
    body: "Average the two heights, multiply by width: (h/2)(y₀ + y₁). Shade it so you can see what we’re counting.",
  },
  {
    title: "Next strip",
    body: "Do the same between x₁ and x₂. The inner points get used twice once you add everything (hence the 2s in the formula).",
  },
  {
    title: "All strips",
    body: "Stack them. You’ve replaced the curve by a piecewise straight roof. The shaded area is the trapezium-rule estimate.",
  },
  {
    title: "Add up",
    body: "For x² on [0, 2] with n = 4 you get 2.75 - a bit above 8/3. More strips usually pulls it closer (unless the curve is really awkward).",
  },
];

export default function HowItWorks() {
  const [step, setStep] = useState(0);

  const h = (B - A) / N;
  const xs = useMemo(() => Array.from({ length: N + 1 }, (_, i) => A + i * h), [h]);
  const ys = useMemo(() => xs.map((x) => f(x)), [xs]);

  const traps = useMemo(
    () =>
      Array.from({ length: N }, (_, i) =>
        trapFillPath(xs[i], xs[i + 1], ys[i], ys[i + 1])
      ),
    [xs, ys]
  );

  const s = step;
  const showGrid = s >= 1;
  const showDots = s >= 2;
  const showTrap0Line = s >= 3 && s < 5;
  const fillTrap0 = s >= 4;
  const fillTrap1 = s >= 5;
  const allTraps = s >= 6;
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

              {(allTraps || fillTrap0) && (
                <path
                  d={traps[0]}
                  fill="rgba(125,211,252,0.28)"
                  stroke="rgba(125,211,252,0.45)"
                  strokeWidth={1}
                />
              )}

              {(allTraps || fillTrap1) && (
                <path
                  d={traps[1]}
                  fill="rgba(125,211,252,0.28)"
                  stroke="rgba(125,211,252,0.45)"
                  strokeWidth={1}
                  style={{ opacity: allTraps ? 1 : 0.85 }}
                />
              )}

              {allTraps &&
                traps.slice(2).map((d, i) => (
                  <path
                    key={`t-${i + 2}`}
                    d={d}
                    fill="rgba(125,211,252,0.28)"
                    stroke="rgba(125,211,252,0.45)"
                    strokeWidth={1}
                  />
                ))}

              {showTrap0Line && !allTraps && (
                <line
                  x1={toSvgX(xs[0])}
                  y1={toSvgY(ys[0])}
                  x2={toSvgX(xs[1])}
                  y2={toSvgY(ys[1])}
                  stroke="rgba(236,72,153,0.95)"
                  strokeWidth={2.5}
                  strokeDasharray="8 6"
                />
              )}

              {s === 5 && (
                <line
                  x1={toSvgX(xs[1])}
                  y1={toSvgY(ys[1])}
                  x2={toSvgX(xs[2])}
                  y2={toSvgY(ys[2])}
                  stroke="rgba(236,72,153,0.95)"
                  strokeWidth={2.5}
                  strokeDasharray="8 6"
                />
              )}

              {showDots &&
                xs.map((x, i) => {
                  const y = ys[i];
                  const cx = toSvgX(x);
                  const cy = toSvgY(y);
                  const highlight =
                    !allTraps &&
                    (((s === 3 || s === 4) && i <= 1) || (s === 5 && i >= 1 && i <= 2));
                  return (
                    <g key={`pt-${i}`}>
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
            <TrapeziumRuleFormula />
            <TrapeziumWorkedExample />
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
          Trapezium rule = straight lines between sample heights. It’s the one Simpson’s page compares against when n is even.
        </p>
        <p className="para" style={{ marginBottom: 0 }}>
          Mid-ordinate rule is the rectangle version where you only measure the middle of each strip - different page, same h.
        </p>
      </div>
    </div>
  );
}
