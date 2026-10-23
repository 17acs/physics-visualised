"use client";

import { useMemo, useState, type ReactNode } from "react";
import HowItWorks from "./HowItWorks";
import { Frac, MidOrdinateRuleFormula } from "./MidOrdinateFormula";

type PageTab = "how" | "use";

type PresetKey = "x2" | "sin" | "exp" | "sqrt";

type View = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type Preset = {
  label: string;
  f: (x: number) => number;
  exact: (a: number, b: number) => number;
  view: View;
  aDefault: number;
  bDefault: number;
};

const WIDTH = 900;
const HEIGHT = 420;

const PRESETS: Record<PresetKey, Preset> = {
  x2: {
    label: "x²",
    f: (x) => x * x,
    exact: (a, b) => (b ** 3 - a ** 3) / 3,
    view: { xMin: -0.5, xMax: 3.5, yMin: -0.5, yMax: 13.5 },
    aDefault: 0,
    bDefault: 2,
  },
  sin: {
    label: "sin x",
    f: (x) => Math.sin(x),
    exact: (a, b) => -Math.cos(b) + Math.cos(a),
    view: { xMin: -0.5, xMax: Math.PI + 0.5, yMin: -0.75, yMax: 1.35 },
    aDefault: 0,
    bDefault: Math.PI,
  },
  exp: {
    label: "e^x",
    f: (x) => Math.exp(x),
    exact: (a, b) => Math.exp(b) - Math.exp(a),
    view: { xMin: -0.5, xMax: 2.5, yMin: -0.5, yMax: 14 },
    aDefault: 0,
    bDefault: 2,
  },
  sqrt: {
    label: "√x",
    f: (x) => (x >= 0 ? Math.sqrt(x) : NaN),
    exact: (a, b) => (2 / 3) * (b ** 1.5 - a ** 1.5),
    view: { xMin: -0.2, xMax: 4.5, yMin: -0.2, yMax: 2.5 },
    aDefault: 0,
    bDefault: 4,
  },
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function toSvgX(x: number, view: View) {
  return ((x - view.xMin) / (view.xMax - view.xMin)) * WIDTH;
}

function toSvgY(y: number, view: View) {
  return HEIGHT - ((y - view.yMin) / (view.yMax - view.yMin)) * HEIGHT;
}

function buildCurvePath(fn: (x: number) => number, view: View, xLo: number, xHi: number, samples = 400) {
  let d = "";
  let penDown = false;

  for (let i = 0; i <= samples; i++) {
    const x = xLo + (i / samples) * (xHi - xLo);
    const y = fn(x);

    if (!Number.isFinite(y)) {
      penDown = false;
      continue;
    }

    const px = toSvgX(x, view);
    const py = toSvgY(y, view);

    if (!penDown) {
      d += `M ${px} ${py}`;
      penDown = true;
    } else {
      d += ` L ${px} ${py}`;
    }
  }

  return d;
}

function stripNodes(a: number, b: number, n: number) {
  const h = (b - a) / n;
  const xs: number[] = [];
  for (let i = 0; i <= n; i++) xs.push(a + i * h);
  return { h, xs };
}

function trapezoidSum(f: (x: number) => number, a: number, b: number, n: number) {
  if (n < 1) return NaN;
  const { h, xs } = stripNodes(a, b, n);
  let sum = 0.5 * (f(xs[0]) + f(xs[n]));
  for (let i = 1; i < n; i++) sum += f(xs[i]);
  return h * sum;
}

function midOrdinateSum(f: (x: number) => number, a: number, b: number, n: number) {
  if (n < 1) return NaN;
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += f(a + (i + 0.5) * h);
  return h * sum;
}

function rectFillPath(view: View, x0: number, x1: number, yMid: number) {
  const baseY = toSvgY(0, view);
  const px0 = toSvgX(x0, view);
  const px1 = toSvgX(x1, view);
  const py = toSvgY(yMid, view);
  return `M ${px0} ${baseY} L ${px0} ${py} L ${px1} ${py} L ${px1} ${baseY} Z`;
}

function fmt(n: number, digits = 4) {
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(digits);
}

function TabButton(props: { active: boolean; onClick: () => void; children: ReactNode }) {
  const { active, onClick, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid rgba(125,211,252,0.45)" : "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(125,211,252,0.10)" : "rgba(255,255,255,0.04)",
        color: "var(--text)",
        padding: "10px 16px",
        borderRadius: 12,
        fontWeight: 800,
        cursor: "pointer",
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </button>
  );
}

export default function MidOrdinateRulePage() {
  const [tab, setTab] = useState<PageTab>("how");
  const [preset, setPreset] = useState<PresetKey>("x2");
  const [a, setA] = useState(0);
  const [b, setB] = useState(2);
  const [n, setN] = useState(8);

  const cfg = PRESETS[preset];
  const view = cfg.view;

  const xLo = preset === "sqrt" ? 0 : view.xMin;
  const xHi = view.xMax;
  const minSpan = 0.05;

  const aClamped = clamp(Math.min(a, b - minSpan), xLo, xHi - minSpan);
  const bClamped = clamp(Math.max(b, aClamped + minSpan), xLo + minSpan, xHi);
  const nClamped = clamp(Math.round(n), 1, 48);

  const { h, xs } = useMemo(
    () => stripNodes(aClamped, bClamped, nClamped),
    [aClamped, bClamped, nClamped]
  );

  const mids = useMemo(
    () => Array.from({ length: nClamped }, (_, i) => aClamped + (i + 0.5) * h),
    [aClamped, h, nClamped]
  );

  const midYs = useMemo(() => mids.map((x) => cfg.f(x)), [mids, preset]);

  const midOrd = useMemo(
    () => midOrdinateSum(cfg.f, aClamped, bClamped, nClamped),
    [preset, aClamped, bClamped, nClamped]
  );

  const trap = useMemo(
    () => trapezoidSum(cfg.f, aClamped, bClamped, nClamped),
    [preset, aClamped, bClamped, nClamped]
  );

  const exact = useMemo(
    () => cfg.exact(aClamped, bClamped),
    [preset, aClamped, bClamped]
  );

  const curvePath = useMemo(
    () => buildCurvePath(cfg.f, view, aClamped, bClamped),
    [preset, aClamped, bClamped]
  );

  const rects = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < nClamped; i++) {
      out.push(rectFillPath(view, xs[i], xs[i + 1], midYs[i]));
    }
    return out;
  }, [nClamped, xs, midYs, view]);

  const xAxisY = toSvgY(0, view);
  const showXAxis = view.yMin <= 0 && 0 <= view.yMax;

  const handlePresetChange = (value: PresetKey) => {
    const next = PRESETS[value];
    setPreset(value);
    setA(next.aDefault);
    setB(next.bDefault);
  };

  const midErr = Math.abs(midOrd - exact);
  const trapErr = Math.abs(trap - exact);

  return (
    <main className="page">
      <a href="/topics/mathematics/calculus" className="backLink">
        ← Back to Calculus
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Mid-ordinate rule</h1>
        <div className="topicHeaderSub">
          Rectangle rule, but the height comes from the middle of each strip - not the left or right edge.
        </div>
      </div>

      <div
        className="card cardStrong"
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}
      >
        <TabButton active={tab === "how"} onClick={() => setTab("how")}>
          How it works
        </TabButton>
        <TabButton active={tab === "use"} onClick={() => setTab("use")}>
          Use the rule
        </TabButton>
      </div>

      {tab === "how" && <HowItWorks />}

      {tab === "use" && (
        <>
          <div className="card">
            <MidOrdinateRuleFormula />
            <p className="muted" style={{ marginTop: 10 }}>
              <span style={{ fontFamily: "ui-serif, 'Times New Roman', serif", fontSize: "1.05rem" }}>
                h = <Frac num={<>b − a</>} den="n" />
              </span>{" "}
              - one sample per strip, always at the midpoint.
            </p>
          </div>

          <div className="topicGrid" style={{ marginTop: 18 }}>
            <div className="stack">
              <div className="card">
                <div className="graphHeader">
                  <div>Approximation on [a, b]</div>
                  <div className="graphHint">
                    Blue = f(x), shaded = mid-ordinate rectangles, dots = f at strip midpoints
                  </div>
                </div>

                <div style={{ height: 420 }}>
                  <div
                    className="canvasCard"
                    style={{ height: "100%", padding: 0, overflow: "hidden" }}
                  >
                    <svg
                      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                      style={{ width: "100%", height: "100%", display: "block" }}
                      aria-label={`Mid-ordinate rule approximation for ${cfg.label}`}
                    >
                      {[...Array(9)].map((_, i) => {
                        const px = (i / 8) * WIDTH;
                        return (
                          <line
                            key={`vx-${i}`}
                            x1={px}
                            y1={0}
                            x2={px}
                            y2={HEIGHT}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                          />
                        );
                      })}

                      {[...Array(7)].map((_, i) => {
                        const py = (i / 6) * HEIGHT;
                        return (
                          <line
                            key={`hy-${i}`}
                            x1={0}
                            y1={py}
                            x2={WIDTH}
                            y2={py}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                          />
                        );
                      })}

                      {showXAxis && (
                        <line
                          x1={toSvgX(aClamped, view)}
                          y1={xAxisY}
                          x2={toSvgX(bClamped, view)}
                          y2={xAxisY}
                          stroke="rgba(255,255,255,0.18)"
                          strokeWidth={2}
                        />
                      )}

                      {rects.map((d, i) => (
                        <path
                          key={`rect-${i}`}
                          d={d}
                          fill="rgba(125,211,252,0.22)"
                          stroke="rgba(125,211,252,0.35)"
                          strokeWidth={1}
                        />
                      ))}

                      <path
                        d={curvePath}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth={3}
                        strokeLinecap="round"
                      />

                      {xs.map((x) => (
                        <line
                          key={`bound-${x}`}
                          x1={toSvgX(x, view)}
                          y1={0}
                          x2={toSvgX(x, view)}
                          y2={HEIGHT}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth={1}
                          strokeDasharray="4 6"
                        />
                      ))}

                      {mids.map((x, i) => {
                        const y = midYs[i];
                        if (!Number.isFinite(y)) return null;
                        const cx = toSvgX(x, view);
                        const cy = toSvgY(y, view);
                        return (
                          <g key={`mid-${i}`}>
                            <line
                              x1={cx}
                              y1={cy}
                              x2={cx}
                              y2={showXAxis ? xAxisY : HEIGHT}
                              stroke="rgba(236,72,153,0.25)"
                              strokeWidth={1}
                              strokeDasharray="4 5"
                            />
                            <circle cx={cx} cy={cy} r={5} fill="var(--accent2)" />
                          </g>
                        );
                      })}

                      <line
                        x1={toSvgX(aClamped, view)}
                        y1={0}
                        x2={toSvgX(aClamped, view)}
                        y2={HEIGHT}
                        stroke="rgba(236,72,153,0.55)"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                      <line
                        x1={toSvgX(bClamped, view)}
                        y1={0}
                        x2={toSvgX(bClamped, view)}
                        y2={HEIGHT}
                        stroke="rgba(236,72,153,0.55)"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                    </svg>
                  </div>
                </div>

                <div className="row" style={{ gap: 14, flexWrap: "wrap", marginTop: 14 }}>
                  <div className="monoBlock">n = {nClamped} strips</div>
                  <div className="monoBlock">h = {fmt(h, 4)}</div>
                </div>
              </div>

              <div className="card">
                <div className="h2" style={{ marginBottom: 12 }}>
                  Estimates
                </div>

                <div className="monoBlock">
                  Exact ∫<sub>a</sub><sup>b</sup> f(x) dx = {fmt(exact)}
                  <br />
                  Mid-ordinate ≈ {fmt(midOrd)}
                  <br />
                  Trapezium (same n) ≈ {fmt(trap)}
                  <br />
                  |Mid-ordinate − exact| = {fmt(midErr)}
                  <br />
                  |Trapezium − exact| = {fmt(trapErr)}
                </div>
              </div>
            </div>

            <div className="stickyCol stack">
              <div className="card cardStrong">
                <div className="h2" style={{ marginBottom: 12 }}>
                  Function
                </div>

                <label className="control">
                  <div className="controlLabel">Preset</div>
                  <select
                    className="numInput"
                    value={preset}
                    onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
                    onWheel={(e) => e.currentTarget.blur()}
                  >
                    <option value="x2">x²</option>
                    <option value="sin">sin x</option>
                    <option value="exp">e^x</option>
                    <option value="sqrt">√x</option>
                  </select>
                </label>

                <div className="monoBlock" style={{ marginTop: 12 }}>
                  f(x) = {cfg.label}
                </div>
              </div>

              <div className="card cardStrong">
                <div className="h2" style={{ marginBottom: 12 }}>
                  Interval
                </div>

                <label className="control">
                  <div className="controlRow">
                    <span className="controlLabel">a</span>
                    <span className="rowValue">{fmt(aClamped)}</span>
                  </div>
                  <input
                    className="range"
                    type="range"
                    min={xLo}
                    max={Math.max(xLo, bClamped - minSpan)}
                    step={0.01}
                    value={aClamped}
                    onChange={(e) => setA(clamp(Number(e.target.value), xLo, bClamped - minSpan))}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </label>

                <label className="control">
                  <div className="controlRow">
                    <span className="controlLabel">b</span>
                    <span className="rowValue">{fmt(bClamped)}</span>
                  </div>
                  <input
                    className="range"
                    type="range"
                    min={Math.min(xHi, aClamped + minSpan)}
                    max={xHi}
                    step={0.01}
                    value={bClamped}
                    onChange={(e) => setB(clamp(Number(e.target.value), aClamped + minSpan, xHi))}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </label>

                <label className="control">
                  <div className="controlRow">
                    <span className="controlLabel">n</span>
                    <span className="rowValue">{nClamped}</span>
                  </div>
                  <input
                    className="range"
                    type="range"
                    min={1}
                    max={32}
                    step={1}
                    value={nClamped}
                    onChange={(e) => setN(Number(e.target.value))}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </label>

                <div className="row" style={{ gap: 10, marginTop: 12 }}>
                  <button
                    className="backLink"
                    type="button"
                    onClick={() => {
                      setA(cfg.aDefault);
                      setB(cfg.bDefault);
                      setN(8);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
