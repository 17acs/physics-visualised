"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { IntegralFromTo, SimpsonsRuleFormula } from "./SimpsonFormula";

type View = { xMin: number; xMax: number; yMin: number; yMax: number };

const WIDTH = 900;
const HEIGHT = 420;
const PAD_X = 36;
const PAD_TOP = 22;
const PAD_B = 36;
const GAP_H = 200;
const GAP_PAD_L = 84;
const GAP_PAD_R = 18;
const GAP_PAD_T = 16;
const GAP_PAD_B = 28;

const A = 0;
const B = 1;
const VIEW: View = { xMin: -0.06, xMax: 1.08, yMin: -0.1, yMax: 1.28 };
// (√π / 2) · erf(1). This integral has no elementary antiderivative.
const EXACT = 0.7468241328124269;

function f(x: number) {
  return Math.exp(-x * x);
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a);
}

function xLabel(i: number, n: number) {
  if (i === 0) return "0";
  const g = gcd(i, n);
  const num = i / g;
  const den = n / g;
  if (den === 1) return String(num);
  return `${num}/${den}`;
}

function weightsFor(n: number) {
  return Array.from({ length: n + 1 }, (_, i) => (i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2));
}

function fmtApprox(n: number) {
  return n.toFixed(5);
}

function fmtPct(p: number) {
  if (p < 5e-5) return "0%";
  if (p >= 1) return `${p.toFixed(2)}%`;
  if (p >= 0.01) return `${p.toFixed(3)}%`;
  return `${p.toFixed(4)}%`;
}

function fmtGap(n: number) {
  const a = Math.abs(n);
  if (a < 5e-7) return "0";
  const decimals = Math.min(6, Math.max(2, 2 - Math.floor(Math.log10(a))));
  return n.toFixed(decimals).replace("-", "−");
}

function fmtArea(n: number) {
  const a = Math.abs(n);
  if (a < 5e-8) return "0";
  const decimals = Math.min(7, Math.max(5, 2 - Math.floor(Math.log10(a))));
  return (n < 0 ? "−" : "") + a.toFixed(decimals);
}

function gapAt(xs: number[], ys: number[], x: number) {
  const strips = xs.length - 1;
  const h = (B - A) / strips;
  let pair = Math.floor((x - A) / (2 * h) + 1e-9);
  if (pair < 0) pair = 0;
  if (pair > strips / 2 - 1) pair = strips / 2 - 1;
  const i = pair * 2;
  return quadAt(xs[i], ys[i], xs[i + 1], ys[i + 1], xs[i + 2], ys[i + 2], x) - f(x);
}

function toSvgX(x: number) {
  return PAD_X + ((x - VIEW.xMin) / (VIEW.xMax - VIEW.xMin)) * (WIDTH - 2 * PAD_X);
}

function toSvgY(y: number) {
  const bottom = HEIGHT - PAD_B;
  return bottom - ((y - VIEW.yMin) / (VIEW.yMax - VIEW.yMin)) * (bottom - PAD_TOP);
}

function quadAt(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x: number) {
  const L0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
  const L1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
  const L2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
  return y0 * L0 + y1 * L1 + y2 * L2;
}

function curvePath() {
  let d = "";
  const samples = 280;
  for (let i = 0; i <= samples; i++) {
    const x = A + (i / samples) * (B - A);
    d += `${i === 0 ? "M" : "L"} ${toSvgX(x)} ${toSvgY(f(x))} `;
  }
  return d;
}

function parabolaPath(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  let d = "";
  const samples = 48;
  for (let i = 0; i <= samples; i++) {
    const x = x0 + (i / samples) * (x2 - x0);
    const y = quadAt(x0, y0, x1, y1, x2, y2, x);
    d += `${i === 0 ? "M" : "L"} ${toSvgX(x)} ${toSvgY(y)} `;
  }
  return d;
}

function fillPath(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  const top = parabolaPath(x0, y0, x1, y1, x2, y2);
  const base = toSvgY(0);
  return `${top} L ${toSvgX(x2)} ${base} L ${toSvgX(x0)} ${base} Z`;
}

export default function SimpsonsRulePage() {
  const [n, setN] = useState(2);

  const xs = useMemo(() => Array.from({ length: n + 1 }, (_, i) => A + (i * (B - A)) / n), [n]);
  const ys = useMemo(() => xs.map((x) => f(x)), [xs]);
  const weights = useMemo(() => weightsFor(n), [n]);
  const estimate = ((B - A) / n / 3) * ys.reduce((sum, y, i) => sum + weights[i] * y, 0);
  const percent = (Math.abs(estimate - EXACT) / EXACT) * 100;

  return (
    <main className="page">
      <a href="/topics/mathematics/calculus" className="backLink">
        ← Back to Calculus
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Simpson&apos;s rule</h1>
        <p className="para" style={{ marginTop: 12 }}>
          Simpson&apos;s rule can be used to approximate integrals too difficult for us to solve. It works by
          first splitting the interval into strips of equal width, h. These strips are then split into pairs,
          each of which has three ordinates. A parabola is then drawn to pass through the three heights of the
          ordinates and the area under the parabola is used to estimate the area of the two strips. This is
          repeated for every strip.
        </p>
        <p className="para">
          Multiplications of the heights are due to repetitions of shared heights between pairs of strips.
        </p>
        <div style={{ marginTop: 14 }}>
          <SimpsonsRuleFormula />
        </div>
      </div>

      <div className="topicGrid" style={{ "--aside": "340px" } as CSSProperties}>
        <div style={{ minWidth: 0 }}>
          <div className="card">
            <div
              className="eq mathEq"
              style={{
                margin: "0 0 6px",
                minHeight: "auto",
                padding: 0,
                border: "none",
                background: "transparent",
                boxShadow: "none",
                backdropFilter: "none",
              }}
            >
              <span className="mathEqInner">
                <IntegralFromTo
                  a="0"
                  b="1"
                  integrand={
                    <span>
                      e<sup>−x²</sup> dx
                    </span>
                  }
                />
              </span>
            </div>

            <div className="graphBox simpsonPlot">
              <Graph n={n} xs={xs} ys={ys} weights={weights} />
            </div>

            <p className="para" style={{ margin: "10px 0 0" }}>
              The blue line represents the integral whilst the dashed purple line shows the parabolas formed
              by Simpson&apos;s rule, each spanning between three ordinates.
            </p>

          </div>
        </div>

        <div className="stickyCol" style={{ minWidth: 0 }}>
          <div className="card cardStrong">
            <div className="controlLabel">Strips</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[2, 4, 6, 8].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="choiceBtn"
                  aria-pressed={n === value}
                  onClick={() => setN(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="divider" />

            <div className="row">
              <div className="rowLabel">exact area</div>
              <div className="rowValue">{fmtApprox(EXACT)}</div>
            </div>
            <div className="row">
              <div className="rowLabel">approximation</div>
              <div className="rowValue">{fmtApprox(estimate)}</div>
            </div>
            <div className="row">
              <div className="rowLabel">percentage error</div>
              <div className="rowValue">{fmtPct(percent)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="para" style={{ margin: "0 0 8px" }}>
          Below you can see an image of the parabola Simpson&apos;s rule creates without the function. y = 0
          represents the curve&apos;s current y value. This shows how the parabolas fluctuate above and below
          the function.
        </p>
        <div className="graphBox simpsonGap">
          <GapGraph xs={xs} ys={ys} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="h2">Deeper Thought</div>
        <div className="deeperColumns">
          <p className="para" style={{ margin: 0 }}>
            Upon first inspection, it is quite easy to assume the two areas either side of y=0 are equal and
            would therefore cancel out, meaning Simpson&apos;s rule gives an exact answer. This however is not
            the case - which you can see when taking the second diagram in context of the first diagram. For
            example, when using two strips, you can see that the rule gives a parabola on one side of the
            turning point (which would be at x=0). Therefore the area between the function and the created
            parabolas would only be equal if the function was a straight line (just think about it.)
          </p>
          <p className="para" style={{ margin: 0 }}>
            For me, it was also essential to realise that the parabolas formed are the only possible
            parabolas - pulling parts of the parabola down to try and get the areas to cancel would not be
            possible as the second derivative of the parabola (the rate of change of the gradient) must be
            constant, so only one parabola is possible for three given points and you can not move the
            parabolas formed around to get the areas between them and the curve to cancel. This is why
            Simpson&apos;s rule is only an approximation. It&apos;s best to think about this for yourself,
            your brain is much more capable than my words.
          </p>
        </div>
      </div>
    </main>
  );
}

function Graph(props: { n: number; xs: number[]; ys: number[]; weights: number[] }) {
  const { n, xs, ys, weights } = props;

  const curve = useMemo(() => curvePath(), []);
  const panels = useMemo(() => {
    const out: { fill: string; stroke: string }[] = [];
    for (let p = 0; p < n / 2; p++) {
      const i = p * 2;
      out.push({
        fill: fillPath(xs[i], ys[i], xs[i + 1], ys[i + 1], xs[i + 2], ys[i + 2]),
        stroke: parabolaPath(xs[i], ys[i], xs[i + 1], ys[i + 1], xs[i + 2], ys[i + 2]),
      });
    }
    return out;
  }, [n, xs, ys]);

  const axisY = toSvgY(0);
  const plotBottom = HEIGHT - PAD_B;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Simpson's rule for e to the minus x squared from 0 to 1 with ${n} strips`}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <line
        x1={PAD_X}
        x2={WIDTH - PAD_X}
        y1={axisY}
        y2={axisY}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={1.5}
      />

      {xs.map((x, i) => (
        <line
          key={`v-${i}`}
          x1={toSvgX(x)}
          x2={toSvgX(x)}
          y1={PAD_TOP}
          y2={plotBottom}
          stroke="rgba(255,255,255,0.12)"
        />
      ))}

      {panels.map((panel, i) => (
        <path key={`fill-${i}`} d={panel.fill} fill="rgba(167,139,250,0.22)" />
      ))}

      <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2.5} />

      {panels.map((panel, i) => (
        <path
          key={`arc-${i}`}
          d={panel.stroke}
          fill="none"
          stroke="var(--accent2)"
          strokeWidth={2.5}
          strokeDasharray="7 5"
        />
      ))}

      {xs.map((x, i) => {
        const cx = toSvgX(x);
        const cy = toSvgY(ys[i]);
        return (
          <g key={`pt-${i}`}>
            <circle cx={cx} cy={cy} r={5} fill="var(--text)" />
            <text x={cx} y={Math.max(16, cy - 12)} textAnchor="middle" fill="var(--accent2)" fontSize={14} fontWeight={700}>
              {weights[i]}
            </text>
            <text x={cx} y={HEIGHT - 12} textAnchor="middle" fill="rgba(255,255,255,0.62)" fontSize={13}>
              {xLabel(i, n)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GapGraph({ xs, ys }: { xs: number[]; ys: number[] }) {
  const n = xs.length - 1;
  const drawn = useMemo(() => {
    const samples = 360;
    const pts: { x: number; g: number }[] = [];
    let max = 0;
    for (let i = 0; i <= samples; i++) {
      const x = A + (i / samples) * (B - A);
      const g = gapAt(xs, ys, x);
      pts.push({ x, g });
      max = Math.max(max, Math.abs(g));
    }
    const scale = (max || 1e-6) * 1.25;
    const yOf = (g: number) => {
      const bottom = GAP_H - GAP_PAD_B;
      return bottom - ((g + scale) / (2 * scale)) * (bottom - GAP_PAD_T);
    };
    const xOf = (x: number) => GAP_PAD_L + ((x - A) / (B - A)) * (WIDTH - GAP_PAD_L - GAP_PAD_R);
    let d = "";
    pts.forEach((p, i) => {
      d += `${i === 0 ? "M" : "L"} ${xOf(p.x)} ${yOf(p.g)} `;
    });
    const zero = yOf(0);
    const h = (B - A) / n;
    const lobes: { area: number; x: number; y: number }[] = [];
    for (let pair = 0; pair < n / 2; pair++) {
      const x0 = A + pair * 2 * h;
      for (const start of [x0, x0 + h]) {
        const steps = 160;
        let area = 0;
        let mass = 0;
        let momentX = 0;
        let momentY = 0;
        for (let i = 0; i < steps; i++) {
          const x = start + ((i + 0.5) / steps) * h;
          const g = gapAt(xs, ys, x);
          const dx = h / steps;
          area += g * dx;
          const weight = Math.abs(g) * dx;
          mass += weight;
          momentX += x * weight;
          momentY += (g / 2) * weight;
        }
        lobes.push({
          area,
          x: xOf(mass ? momentX / mass : start + h / 2),
          y: yOf(mass ? momentY / mass : 0),
        });
      }
    }
    return { d, fill: `${d} L ${xOf(B)} ${zero} L ${xOf(A)} ${zero} Z`, scale, xOf, yOf, zero, lobes };
  }, [xs, ys, n]);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${GAP_H}`}
      role="img"
      aria-label="Parabola minus the curve, scaled to the gap"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <line
        x1={GAP_PAD_L}
        x2={WIDTH - GAP_PAD_R}
        y1={drawn.zero}
        y2={drawn.zero}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.5}
      />
      {xs.map((x, i) => (
        <line
          key={`gv-${i}`}
          x1={drawn.xOf(x)}
          x2={drawn.xOf(x)}
          y1={GAP_PAD_T}
          y2={GAP_H - GAP_PAD_B}
          stroke="rgba(255,255,255,0.12)"
        />
      ))}
      <path d={drawn.fill} fill="rgba(167,139,250,0.28)" />
      <path d={drawn.d} fill="none" stroke="var(--accent2)" strokeWidth={2.5} />
      <text x={GAP_PAD_L - 8} y={drawn.yOf(drawn.scale) + 4} textAnchor="end" fill="rgba(255,255,255,0.72)" fontSize={12}>
        {fmtGap(drawn.scale)}
      </text>
      <text x={GAP_PAD_L - 8} y={drawn.zero + 4} textAnchor="end" fill="rgba(255,255,255,0.72)" fontSize={12}>
        0
      </text>
      <text x={GAP_PAD_L - 8} y={drawn.yOf(-drawn.scale) + 4} textAnchor="end" fill="rgba(255,255,255,0.72)" fontSize={12}>
        {fmtGap(-drawn.scale)}
      </text>
      {xs.map((x, i) => (
        <text
          key={`gl-${i}`}
          x={drawn.xOf(x)}
          y={GAP_H - 8}
          textAnchor="middle"
          fill="rgba(255,255,255,0.62)"
          fontSize={13}
        >
          {xLabel(i, n)}
        </text>
      ))}
      {drawn.lobes.map((lobe, i) => (
        <text
          key={`area-${i}`}
          x={lobe.x}
          y={lobe.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(242,245,255,0.95)"
          fontSize={n > 4 ? 12 : 14}
          fontWeight={700}
          stroke="rgba(8,10,22,0.9)"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {fmtArea(lobe.area)}
        </text>
      ))}
    </svg>
  );
}
