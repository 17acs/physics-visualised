"use client";

import { useMemo, useState } from "react";
import { SimpsonsRuleFormula, SimpsonsWorkedExample } from "./SimpsonFormula";

const WIDTH = 900;
const HEIGHT = 420;

type View = { xMin: number; xMax: number; yMin: number; yMax: number };

const VIEW: View = { xMin: -0.2, xMax: 2.4, yMin: -0.95, yMax: 4.5 };
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

function quadAt(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x: number) {
  const L0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
  const L1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
  const L2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
  return y0 * L0 + y1 * L1 + y2 * L2;
}

function panelFillPath(x0: number, x1: number, x2: number, y0: number, y1: number, y2: number) {
  const baseY = toSvgY(0);
  let top = "";
  const samples = 48;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = x0 + t * (x2 - x0);
    const y = quadAt(x0, y0, x1, y1, x2, y2, x);
    const px = toSvgX(x);
    const py = toSvgY(y);
    top += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
  }
  return `${top} L ${toSvgX(x2)} ${baseY} L ${toSvgX(x0)} ${baseY} Z`;
}

function parabolaStrokePath(x0: number, x1: number, x2: number, y0: number, y1: number, y2: number) {
  let d = "";
  const samples = 48;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = x0 + t * (x2 - x0);
    const y = quadAt(x0, y0, x1, y1, x2, y2, x);
    const px = toSvgX(x);
    const py = toSvgY(y);
    d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
  }
  return d;
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
    title: "Start with an integral",
    body: "We want the signed area under f(x) = x² from x = 0 to x = 2. The exact value is 8/3 ≈ 2.667.",
  },
  {
    title: "Split [a, b] into n equal pieces",
    body: "Choose an even n. Here n = 4, so h = (b − a)/n = 0.5 (half a unit). That gives five x-values: 0, 0.5, 1, 1.5, 2.",
  },
  {
    title: "Evaluate f at each sample",
    body: "Place a dot on the curve at every sample point. These heights are the only f-values Simpson’s rule needs.",
  },
  {
    title: "Fit a parabola on the first pair of strips",
    body: "On [x₀, x₂] use the three points (x₀, f(x₀)), (x₁, f(x₁)), (x₂, f(x₂)). Exactly one parabola passes through them.",
  },
  {
    title: "Integrate that parabola",
    body: "Replace the curve on that double-interval by the parabola and shade the area underneath it. That panel contributes (h⁄3)[f(x₀) + 4f(x₁) + f(x₂)].",
  },
  {
    title: "Repeat on the next pair of strips",
    body: "Do the same on [x₂, x₄] with x₂, x₃, x₄. Points like x₂ sit on the border of two panels, so they appear in both parabola sums.",
  },
  {
    title: "All parabolic panels",
    body: "Stack every panel. The shaded region approximates the true area under the curve.",
  },
  {
    title: "Ends, odds, evens",
    body: "When you collect all the f(xᵢ) into one sum, it’s handy to group them as ends (x₀ and xₙ), odd indices, and even indices - that’s the second line in the formula.",
  },
  {
    title: "Add the pieces",
    body: "Plug in the heights, multiply by h⁄3, and you’re done. For this example you get 8⁄3, which is the exact answer for x² on [0, 2].",
  },
];

export default function HowItWorks() {
  const [step, setStep] = useState(0);

  const h = (B - A) / N;
  const xs = useMemo(() => Array.from({ length: N + 1 }, (_, i) => A + i * h), [h]);
  const ys = useMemo(() => xs.map((x) => f(x)), [xs]);

  const panel0 = useMemo(
    () => panelFillPath(xs[0], xs[1], xs[2], ys[0], ys[1], ys[2]),
    [xs, ys]
  );
  const panel1 = useMemo(
    () => panelFillPath(xs[2], xs[3], xs[4], ys[2], ys[3], ys[4]),
    [xs, ys]
  );
  const para0 = useMemo(
    () => parabolaStrokePath(xs[0], xs[1], xs[2], ys[0], ys[1], ys[2]),
    [xs, ys]
  );
  const para1 = useMemo(
    () => parabolaStrokePath(xs[2], xs[3], xs[4], ys[2], ys[3], ys[4]),
    [xs, ys]
  );

  const s = step;
  const showGrid = s >= 1;
  const showDots = s >= 2;
  const showPara0 = s >= 3;
  const fillPanel0 = s >= 4;
  const showPara1 = s >= 5;
  const fillPanel1 = s >= 5;
  const allPanels = s >= 6;
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

              {(allPanels || fillPanel0) && (
                <path
                  d={panel0}
                  fill="rgba(125,211,252,0.28)"
                  stroke="rgba(125,211,252,0.45)"
                  strokeWidth={1}
                  style={{ opacity: allPanels || fillPanel0 ? 1 : 0.4 }}
                />
              )}

              {(allPanels || fillPanel1) && (
                <path
                  d={panel1}
                  fill="rgba(125,211,252,0.28)"
                  stroke="rgba(125,211,252,0.45)"
                  strokeWidth={1}
                  style={{ opacity: allPanels ? 1 : 0.85 }}
                />
              )}

              {showPara0 && !allPanels && (
                <path d={para0} fill="none" stroke="rgba(236,72,153,0.95)" strokeWidth={2.5} strokeDasharray="8 6" />
              )}

              {showPara1 && !allPanels && (
                <path d={para1} fill="none" stroke="rgba(236,72,153,0.75)" strokeWidth={2.5} strokeDasharray="8 6" />
              )}

              {showDots &&
                xs.map((x, i) => {
                  const y = ys[i];
                  const cx = toSvgX(x);
                  const cy = toSvgY(y);
                  const group =
                    s === 7 ? (i === 0 || i === N ? "end" : i % 2 === 1 ? "odd" : "even") : null;
                  const highlight =
                    !group &&
                    !allPanels &&
                    (((s === 3 || s === 4) && i <= 2) || (s === 5 && i >= 2));
                  const fill =
                    group === "odd"
                      ? "var(--accent3)"
                      : group === "even"
                        ? "var(--accent)"
                        : group === "end"
                          ? "#f2f5ff"
                          : highlight
                            ? "var(--accent3)"
                            : "var(--accent2)";
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
                      <circle cx={cx} cy={cy} r={group || highlight ? 7 : 5} fill={fill} />
                      {group && (
                        <text
                          x={cx}
                          y={xAxisY + 32}
                          textAnchor="middle"
                          fill={fill}
                          fontSize={16}
                          fontWeight={700}
                        >
                          {group}
                        </text>
                      )}
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
            <SimpsonsRuleFormula />
            <SimpsonsWorkedExample />
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
          Over each pair of strips, replace the curve with a parabola through three heights and add
          the area under that parabola.
        </p>
        <p className="para" style={{ marginBottom: 0 }}>
          The <b>Use the rule</b> tab is for trying your own function and interval - crank n up and
          see how close Simpson gets to the exact integral (trapezium rule is there for comparison).
        </p>
      </div>
    </div>
  );
}
