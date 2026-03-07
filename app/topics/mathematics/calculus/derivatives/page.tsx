"use client";

import { useMemo, useState } from "react";

type PresetKey = "x2" | "x3" | "sin" | "cos" | "exp";

type View = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type Preset = {
  label: string;
  f: (x: number) => number;
  df: (x: number) => number;
  view: View;
  xDefault: number;
  hDefault: number;
};

const WIDTH = 900;
const HEIGHT = 420;

const PRESETS: Record<PresetKey, Preset> = {
  x2: {
    label: "x²",
    f: (x) => x * x,
    df: (x) => 2 * x,
    view: { xMin: -4, xMax: 4, yMin: -2, yMax: 16 },
    xDefault: 1,
    hDefault: 0.5,
  },
  x3: {
    label: "x³",
    f: (x) => x * x * x,
    df: (x) => 3 * x * x,
    view: { xMin: -4, xMax: 4, yMin: -20, yMax: 20 },
    xDefault: 1,
    hDefault: 0.5,
  },
  sin: {
    label: "sin x",
    f: (x) => Math.sin(x),
    df: (x) => Math.cos(x),
    view: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -1.6, yMax: 1.6 },
    xDefault: 1,
    hDefault: 0.5,
  },
  cos: {
    label: "cos x",
    f: (x) => Math.cos(x),
    df: (x) => -Math.sin(x),
    view: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -1.6, yMax: 1.6 },
    xDefault: 1,
    hDefault: 0.5,
  },
  exp: {
    label: "e^x",
    f: (x) => Math.exp(x),
    df: (x) => Math.exp(x),
    view: { xMin: -3, xMax: 3, yMin: -1, yMax: 22 },
    xDefault: 0.7,
    hDefault: 0.4,
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

function buildCurvePath(fn: (x: number) => number, view: View, samples = 500) {
  let d = "";
  let penDown = false;

  for (let i = 0; i <= samples; i++) {
    const x = view.xMin + (i / samples) * (view.xMax - view.xMin);
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

function lineAcrossView(
  m: number,
  x0: number,
  y0: number,
  view: View
): { x1: number; y1: number; x2: number; y2: number } {
  const x1 = view.xMin;
  const y1 = y0 + m * (x1 - x0);
  const x2 = view.xMax;
  const y2 = y0 + m * (x2 - x0);

  return { x1, y1, x2, y2 };
}

function fmt(n: number, digits = 3) {
  if (!Number.isFinite(n)) return "undefined";
  return n.toFixed(digits);
}

function fmtExpForm(exponent: number) {
  if (!Number.isFinite(exponent)) return "undefined";
  return `e^(${fmt(exponent)})`;
}

function blurFocusedControl() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return;

  if (el.tagName === "INPUT" || el.tagName === "SELECT") {
    el.blur();
  }
}

export default function DerivativesPage() {
  const [preset, setPreset] = useState<PresetKey>("x2");
  const [x, setX] = useState(1);
  const [h, setH] = useState(0.5);

  const cfg = PRESETS[preset];
  const view = cfg.view;

  const xMin = view.xMin;
  const xMax = view.xMax;
  const hMax = Math.max((view.xMax - view.xMin) / 4, 0.5);

  const curvePath = useMemo(() => {
    return buildCurvePath(cfg.f, view);
  }, [preset]);

  const fx = cfg.f(x);
  const xh = x + h;
  const fxh = cfg.f(xh);

  const tangentSlope = cfg.df(x);
  const secantSlope = Math.abs(h) < 1e-10 ? NaN : (fxh - fx) / h;

  const tangentGradientText =
    preset === "exp" ? fmtExpForm(x) : fmt(tangentSlope);

  const secantGradientText =
    preset === "exp"
      ? Number.isFinite(secantSlope) && secantSlope > 0
        ? fmtExpForm(Math.log(secantSlope))
        : "undefined"
      : fmt(secantSlope);

  const pSvgX = toSvgX(x, view);
  const pSvgY = toSvgY(fx, view);
  const qSvgX = toSvgX(xh, view);
  const qSvgY = toSvgY(fxh, view);

  const tangentLine = lineAcrossView(tangentSlope, x, fx, view);
  const secantLine =
    Number.isFinite(secantSlope) ? lineAcrossView(secantSlope, x, fx, view) : null;

  const xAxisY = toSvgY(0, view);
  const yAxisX = toSvgX(0, view);

  const showXAxis = view.yMin <= 0 && 0 <= view.yMax;
  const showYAxis = view.xMin <= 0 && 0 <= view.xMax;

  const handlePresetChange = (value: PresetKey) => {
    const next = PRESETS[value];
    setPreset(value);
    setX(next.xDefault);
    setH(next.hDefault);
  };

  const guideY0 = toSvgY(0, view);

  return (
    <main
      className="page"
      onWheelCapture={() => {
        blurFocusedControl();
      }}
    >
      <a href="/topics/mathematics/calculus" className="backLink">
        ← Back to Calculus
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Derivatives</h1>
        <div className="topicHeaderSub">
          See how a secant line becomes a tangent as the second point moves closer.
        </div>
      </div>

      <div className="card">
        <div className="eq">Gradient of secant line = [f(x+h) - f(x)] / h</div>
        <p className="muted" style={{ marginTop: 10 }}>
          Average rate of change over an interval that you can change by adjusting h.
        </p>
      </div>

      <div className="topicGrid" style={{ marginTop: 18 }}>
        <div className="stack">
          <div className="card">
            <div className="graphHeader">
              <div>Function graph</div>
              <div className="graphHint">Purple = point at x, pink = point at x+h</div>
            </div>

            <div style={{ height: 420 }}>
              <div
                className="canvasCard"
                style={{ height: "100%", padding: 0, overflow: "hidden" }}
              >
                <svg
                  viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                  style={{ width: "100%", height: "100%", display: "block" }}
                  aria-label={`Graph of ${cfg.label} with secant and tangent lines`}
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
                      x1={0}
                      y1={xAxisY}
                      x2={WIDTH}
                      y2={xAxisY}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth={2}
                    />
                  )}

                  {showYAxis && (
                    <line
                      x1={yAxisX}
                      y1={0}
                      x2={yAxisX}
                      y2={HEIGHT}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth={2}
                    />
                  )}

                  <path
                    d={curvePath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />

                  {secantLine && (
                    <line
                      x1={toSvgX(secantLine.x1, view)}
                      y1={toSvgY(secantLine.y1, view)}
                      x2={toSvgX(secantLine.x2, view)}
                      y2={toSvgY(secantLine.y2, view)}
                      stroke="var(--accent3)"
                      strokeWidth={2.5}
                      strokeDasharray="10 8"
                    />
                  )}

                  <line
                    x1={toSvgX(tangentLine.x1, view)}
                    y1={toSvgY(tangentLine.y1, view)}
                    x2={toSvgX(tangentLine.x2, view)}
                    y2={toSvgY(tangentLine.y2, view)}
                    stroke="var(--accent2)"
                    strokeWidth={2.5}
                  />

                  {showXAxis && (
                    <>
                      <line
                        x1={pSvgX}
                        y1={pSvgY}
                        x2={pSvgX}
                        y2={guideY0}
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={1.5}
                        strokeDasharray="5 6"
                      />
                      <line
                        x1={qSvgX}
                        y1={qSvgY}
                        x2={qSvgX}
                        y2={guideY0}
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1.5}
                        strokeDasharray="5 6"
                      />
                    </>
                  )}

                  <circle cx={pSvgX} cy={pSvgY} r={7} fill="var(--accent2)" />
                  <circle cx={qSvgX} cy={qSvgY} r={7} fill="var(--accent3)" />

                  <text
                    x={pSvgX + 10}
                    y={pSvgY - 10}
                    fill="rgba(255,255,255,0.82)"
                    fontSize="16"
                    fontFamily="var(--font-mono)"
                  >
                    x
                  </text>

                  <text
                    x={qSvgX + 10}
                    y={qSvgY - 10}
                    fill="rgba(255,255,255,0.82)"
                    fontSize="16"
                    fontFamily="var(--font-mono)"
                  >
                    x+h
                  </text>
                </svg>
              </div>
            </div>

            <div className="row" style={{ gap: 14, flexWrap: "wrap", marginTop: 14 }}>
              <div className="monoBlock">Curve: {cfg.label}</div>
              <div className="monoBlock">Tangent: purple</div>
              <div className="monoBlock">Secant: dotted pink</div>
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{ marginBottom: 12 }}>
              Values
            </div>

            <div className="monoBlock">
              x = {fmt(x)}
              <br />
              h = {fmt(h)}
              <br />
              x+h = {fmt(xh)}
              <br />
              f(x) = {fmt(fx)}
              <br />
              f(x+h) = {fmt(fxh)}
              <br />
              secant gradient = {secantGradientText}
              <br />
              tangent gradient = {tangentGradientText}
            </div>

            <div className="eq" style={{ marginTop: 14 }}>
              {Math.abs(h) < 1e-10
                ? "[f(x+h) - f(x)] / h is undefined at h = 0"
                : `[${fmt(fxh)} - ${fmt(fx)}] / ${fmt(h)} = ${fmt(secantSlope)}`}
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
                <option value="x3">x³</option>
                <option value="sin">sin x</option>
                <option value="cos">cos x</option>
                <option value="exp">e^x</option>
              </select>
            </label>

            <div className="monoBlock" style={{ marginTop: 12 }}>
              f(x) = {cfg.label}
            </div>
          </div>

          <div className="card cardStrong">
            <div className="h2" style={{ marginBottom: 12 }}>
              Point controls
            </div>

            <label className="control">
              <div className="controlRow">
                <span className="controlLabel">x</span>
                <span className="rowValue">{fmt(x)}</span>
              </div>
              <input
                className="range"
                type="range"
                min={xMin}
                max={xMax}
                step={0.01}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </label>

            <label className="control">
              <div className="controlRow">
                <span className="controlLabel">h</span>
                <span className="rowValue">{fmt(h)}</span>
              </div>
              <input
                className="range"
                type="range"
                min={-hMax}
                max={hMax}
                step={0.01}
                value={h}
                onChange={(e) => setH(Number(e.target.value))}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </label>

            <div className="row" style={{ gap: 10, marginTop: 12 }}>
              <button
                className="backLink"
                type="button"
                onClick={() => {
                  setX(cfg.xDefault);
                  setH(cfg.hDefault);
                }}
              >
                Reset
              </button>

              <button
                className="backLink"
                type="button"
                onClick={() => setH((prev) => clamp(-prev, -hMax, hMax))}
              >
                Flip h
              </button>
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{ marginBottom: 12 }}>
              Concept
            </div>

            <p className="para">
              The secant slope measures the average rate of change from x to x+h.
            </p>
            <p className="para">
              As h gets closer to 0, the secant approaches the tangent.
            </p>
            <p className="para" style={{ marginBottom: 0 }}>
              This page is basic currently but I'm stuck on what else to add.
              Possibly a little guide on differentiation from first principles.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}