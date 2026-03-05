"use client";

import React, { useMemo, useState } from "react";

type Mode = "sin" | "cos" | "tan";

// sin/cos domain
const X_MIN_SC = -Math.PI / 2;
const X_MAX_SC = Math.PI / 2;

// tan domain (your request)
const X_MIN_T = -Math.PI / 3;
const X_MAX_T = Math.PI / 3;

// tan graph y-range (keeps it readable)
const TAN_Y = 4;

// tan undefined threshold (for display)
const TAN_UNDEF_EPS = 1e-5;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function tidy(n: number) {
  return Math.abs(n) < 1e-9 ? 0 : n;
}

/** format as N significant figures, no scientific notation (within reason) */
function fmtSig(n: number, sig = 3) {
  if (!Number.isFinite(n)) return String(n);
  const a = Math.abs(n);
  if (a < 1e-12) return "0";
  const p = Math.floor(Math.log10(a));
  const decimals = Math.max(0, Math.min(10, sig - 1 - p));
  return n.toFixed(decimals);
}

function fmtRad(x: number) {
  const pi = Math.PI;
  const tol = 6e-4;

  const table: Array<[number, string]> = [
    [-pi / 2, "−π/2"],
    [-pi / 3, "−π/3"],
    [-pi / 4, "−π/4"],
    [-pi / 6, "−π/6"],
    [0, "0"],
    [pi / 6, "π/6"],
    [pi / 4, "π/4"],
    [pi / 3, "π/3"],
    [pi / 2, "π/2"],
  ];

  for (const [v, s] of table) if (Math.abs(x - v) < tol) return s;
  return fmtSig(x, 3);
}

function snapAngle(x: number, mode: Mode) {
  const pi = Math.PI;
  const tol = 6e-4;

  const snaps =
    mode === "tan"
      ? [-pi / 3, -pi / 6, 0, pi / 6, pi / 3]
      : [-pi / 2, -pi / 3, -pi / 6, 0, pi / 6, pi / 3, pi / 2];

  for (const a of snaps) if (Math.abs(x - a) < tol) return a;
  return x;
}

function approxLabel(mode: Mode) {
  if (mode === "cos") return "cosθ ≈ 1 − θ²/2";
  if (mode === "tan") return "tanθ ≈ θ";
  return "sinθ ≈ θ";
}

function actual(mode: Mode, x: number) {
  if (mode === "sin") return Math.sin(x);
  if (mode === "cos") return Math.cos(x);
  return Math.tan(x);
}

function approx(mode: Mode, x: number) {
  if (mode === "cos") return 1 - (x * x) / 2;
  return x; // sin and tan
}

export default function SmallAnglePage() {
  const [mode, setMode] = useState<Mode>("sin");
  const [theta, setTheta] = useState(0.35); // radians

  const xMin = mode === "tan" ? X_MIN_T : X_MIN_SC;
  const xMax = mode === "tan" ? X_MAX_T : X_MAX_SC;

  const computed = useMemo(() => {
    const t = snapAngle(clamp(theta, xMin, xMax), mode);

    const aRaw = actual(mode, t);
    const pRaw = approx(mode, t);

    const a = tidy(aRaw);
    const p = tidy(pRaw);

    const absErr = Math.abs(a - p);
    const pctErr = Math.abs(a) > 1e-9 ? (absErr / Math.abs(a)) * 100 : 0;

    const N = 320;
    const pts: { x: number; yA: number; yP: number }[] = [];

    for (let i = 0; i <= N; i++) {
      const x = xMin + ((xMax - xMin) * i) / N;

      let yA = actual(mode, x);
      let yP = approx(mode, x);

      if (mode === "tan") {
        yA = clamp(yA, -TAN_Y, TAN_Y);
        yP = clamp(yP, -TAN_Y, TAN_Y);
      }

      pts.push({ x, yA, yP });
    }

    const yMin = mode === "tan" ? -TAN_Y : -1;
    const yMax = mode === "tan" ? TAN_Y : 1;

    const ux = tidy(Math.cos(t));
    const uy = tidy(Math.sin(t));

    const cosT = Math.cos(t);
    const tanVal = Math.abs(cosT) < TAN_UNDEF_EPS ? null : tidy(Math.tan(t));

    return { t, a, p, absErr, pctErr, pts, yMin, yMax, ux, uy, tanVal };
  }, [mode, theta, xMin, xMax]);

  // --- Graph layout ---
  const W = 760;
  const H = 360;
  const pad = 34;

  const xToSvg = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
  const yToSvg = (y: number) =>
    H - pad - ((y - computed.yMin) / (computed.yMax - computed.yMin)) * (H - 2 * pad);

  const pathActual = computed.pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xToSvg(p.x).toFixed(2)} ${yToSvg(p.yA).toFixed(2)}`)
    .join(" ");

  const pathApprox = computed.pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xToSvg(p.x).toFixed(2)} ${yToSvg(p.yP).toFixed(2)}`)
    .join(" ");

  const dotX = xToSvg(computed.t);
  const dotY = yToSvg(mode === "tan" ? clamp(computed.a, -TAN_Y, TAN_Y) : computed.a);

  // axes through origin
  const axisX = xToSvg(0); // y-axis at x=0
  const axisY = yToSvg(0); // x-axis at y=0

  const xTicks =
    mode === "tan"
      ? [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3]
      : [-Math.PI / 2, -Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3, Math.PI / 2];

  const yTicks =
    mode === "tan"
      ? [-TAN_Y, -TAN_Y / 2, 0, TAN_Y / 2, TAN_Y]
      : [-1, -0.5, 0, 0.5, 1];

  return (
    <main className="page" style={{ maxWidth: 1400 }}>
      <a href="/topics/mathematics" className="backLink">
        ← Back to Mathematics
      </a>

      <div className="stack12" style={{ marginTop: 12 }}>
        <h1 className="topicHeaderTitle" style={{ margin: 0 }}>
          Small-angle approximations
        </h1>

        <p className="heroText" style={{ margin: 0 }}>
          Everything is in <b>radians</b>.
          {mode === "tan" ? `  (Tan graph has smaller x-axis to avoid undefined values)` : ""}
        </p>
      </div>

      <div className="topicGrid" style={{ ["--aside" as any]: "560px" }}>
        {/* LEFT */}
        <div style={{ minWidth: 0 }}>
          {/* Controls */}
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
            }}
          >
            <div className="card cardStrong" style={{ minWidth: 0 }}>
              <div className="controlLabel">Function</div>
              <div className="controlRow" style={{ minWidth: 0 }}>
                <select
                  className="numInput"
                  value={mode}
                  onChange={(e) => {
                    const next = e.target.value as Mode;
                    const nextMin = next === "tan" ? X_MIN_T : X_MIN_SC;
                    const nextMax = next === "tan" ? X_MAX_T : X_MAX_SC;
                    setMode(next);
                    setTheta((prev) => clamp(prev, nextMin, nextMax));
                  }}
                  style={{ width: "100%" }}
                >
                  <option value="sin">sinθ</option>
                  <option value="cos">cosθ</option>
                  <option value="tan">tanθ</option>
                </select>
              </div>

              <div className="graphHint" style={{ marginTop: 8 }}>
                Approx: <b>{approxLabel(mode)}</b>
              </div>
            </div>

            <Control
              label="Angle θ (radians)"
              value={theta}
              min={xMin}
              max={xMax}
              step={0.001}
              onChange={setTheta}
              note={fmtRad(computed.t)}
            />
          </div>

          {/* Graph */}
          <div className="card cardStrong" style={{ marginTop: 18, minWidth: 0 }}>
            <div className="graphHeader">
              <div style={{ fontWeight: 900 }}>Actual vs approximation</div>
              <div className="graphHint">
                x: radians ({fmtRad(xMin)} → {fmtRad(xMax)}) • y: {mode === "tan" ? `clipped ±${TAN_Y}` : "−1 → 1"}
              </div>
            </div>

            <div className="graphBox" style={{ ["--ratio" as any]: `${W}/${H}` }}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                {/* grid + ticks (x) */}
                {xTicks.map((tx) => {
                  const X = xToSvg(tx);
                  return (
                    <g key={`xt-${tx}`}>
                      <line x1={X} y1={pad} x2={X} y2={H - pad} stroke="white" strokeOpacity="0.08" />
                      <line x1={X} y1={axisY - 4} x2={X} y2={axisY + 4} stroke="white" strokeOpacity="0.35" />
                      <text x={X} y={axisY + 18} textAnchor="middle" fontSize="12" fill="rgba(242,245,255,0.65)">
                        {fmtRad(tx)}
                      </text>
                    </g>
                  );
                })}

                {/* grid + ticks (y) */}
                {yTicks.map((ty) => {
                  const Y = yToSvg(ty);
                  return (
                    <g key={`yt-${ty}`}>
                      <line x1={pad} y1={Y} x2={W - pad} y2={Y} stroke="white" strokeOpacity="0.08" />
                      <line x1={axisX - 4} y1={Y} x2={axisX + 4} y2={Y} stroke="white" strokeOpacity="0.35" />
                      <text x={axisX - 10} y={Y + 4} textAnchor="end" fontSize="12" fill="rgba(242,245,255,0.65)">
                        {fmtSig(ty, 3)}
                      </text>
                    </g>
                  );
                })}

                {/* axes through origin */}
                <line x1={pad} y1={axisY} x2={W - pad} y2={axisY} stroke="white" strokeOpacity="0.70" />
                <line x1={axisX} y1={pad} x2={axisX} y2={H - pad} stroke="white" strokeOpacity="0.70" />

                {/* approx */}
                <path
                  d={pathApprox}
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeOpacity="0.50"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />

                {/* actual */}
                <path d={pathActual} fill="none" stroke="rgba(125,211,252,0.98)" strokeWidth="2.6" strokeOpacity="0.92" />

                {/* dot */}
                <circle cx={dotX} cy={dotY} r="5.2" fill="rgba(236,72,153,0.98)" stroke="white" strokeWidth="1.5" />

                {/* axis labels */}
                <text x={W - pad} y={axisY - 10} textAnchor="end" fontSize="12" fill="rgba(242,245,255,0.8)">
                  θ (radians)
                </text>
                <text x={axisX + 8} y={pad - 10} textAnchor="start" fontSize="12" fill="rgba(242,245,255,0.8)">
                  y
                </text>
              </svg>
            </div>

            <div className="divider" />

            <div className="row">
              <div className="rowLabel">θ</div>
              <div className="rowValue">{fmtRad(computed.t)} rad</div>
            </div>

            <div className="row">
              <div className="rowLabel">Actual</div>
              <div className="rowValue">{fmtSig(computed.a, 3)}</div>
            </div>

            <div className="row">
              <div className="rowLabel">Approx</div>
              <div className="rowValue">{fmtSig(computed.p, 3)}</div>
            </div>

            <div className="row">
              <div className="rowLabel">Absolute error</div>
              <div className="rowValue">{fmtSig(computed.absErr, 3)}</div>
            </div>

            <div className="row">
              <div className="rowLabel">% error</div>
              <div className="rowValue">{fmtSig(computed.pctErr, 3)}%</div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="stickyCol" style={{ marginTop: 14, minWidth: 0 }}>
          <div className="card cardStrong" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Unit Circle</div>

            <div className="graphBox" style={{ ["--ratio" as any]: "1/1" }}>
              <UnitCircleGraph mode={mode} theta={computed.t} ux={computed.ux} uy={computed.uy} tanVal={computed.tanVal} />
            </div>

            <div className="divider" />

            {/* ORDER: sin then cos then tan */}
            <div className="row">
              <div className="rowLabel">sinθ</div>
              <div className="rowValue">{fmtSig(computed.uy, 3)}</div>
            </div>
            <div className="row">
              <div className="rowLabel">cosθ</div>
              <div className="rowValue">{fmtSig(computed.ux, 3)}</div>
            </div>
            <div className="row">
              <div className="rowLabel">tanθ</div>
              <div className="rowValue">{computed.tanVal === null ? "undefined" : fmtSig(computed.tanVal, 3)}</div>
            </div>

            <p className="para" style={{ marginTop: 10 }}>
              The point given by the pink circle is ({fmtSig(computed.ux, 3)}, {fmtSig(computed.uy, 3)}). cosθ is the y-coordinate and sinθ is the x-coordinate.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Control(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  note?: string;
}) {
  const { label, value, min, max, step, onChange, note } = props;

  const [text, setText] = React.useState(fmtSig(value, 3));

  React.useEffect(() => {
    setText(Number.isFinite(value) ? fmtSig(value, 3) : String(min));
  }, [value, min]);

  return (
    <div className="card cardStrong" style={{ minWidth: 0 }}>
      <div className="controlLabel">{label}</div>

      <div className="controlRow" style={{ minWidth: 0 }}>
        <input
          className="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        <input
          className="numInput"
          type="number"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
          onBlur={() => {
            const n = Number(text);
            if (!Number.isFinite(n)) {
              setText(fmtSig(value, 3));
              return;
            }
            const clamped = Math.min(max, Math.max(min, n));
            onChange(clamped);
            setText(fmtSig(clamped, 3));
          }}
        />
      </div>

      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 14, opacity: 0.85 }}>
        <span>{fmtSig(value, 3)}</span>
        <span>{note ?? ""}</span>
      </div>
    </div>
  );
}

function UnitCircleGraph(props: { mode: Mode; theta: number; ux: number; uy: number; tanVal: number | null }) {
  const { mode, theta, ux, uy, tanVal } = props;

  const circlePts = useMemo(() => {
    const pts: Array<[number, number]> = [];
    const N = 220;
    for (let i = 0; i <= N; i++) {
      const a = (2 * Math.PI * i) / N;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    return pts;
  }, []);

  const view = 1.2;
  const grid = [-1, -0.5, 0, 0.5, 1];

  const showTan = mode === "tan" && tanVal !== null;
  const tanClip = tanVal === null ? 0 : clamp(tanVal, -TAN_Y, TAN_Y);

  const labelStyle: React.CSSProperties = {
    fill: "rgba(242,245,255,0.88)",
    fontSize: 0.095,
    fontWeight: 800,
  };

  return (
    <svg viewBox={`${-view} ${-view} ${2 * view} ${2 * view}`} preserveAspectRatio="xMidYMid meet">
      {/* grid + axes first (faint) */}
      {grid.map((v) => (
        <g key={`g-${v}`}>
          <line x1={-view} y1={v} x2={view} y2={v} stroke="white" strokeOpacity="0.05" strokeWidth="0.01" />
          <line x1={v} y1={-view} x2={v} y2={view} stroke="white" strokeOpacity="0.05" strokeWidth="0.01" />
        </g>
      ))}

      <line x1={-view} y1={0} x2={view} y2={0} stroke="white" strokeOpacity="0.20" strokeWidth="0.015" />
      <line x1={0} y1={-view} x2={0} y2={view} stroke="white" strokeOpacity="0.20" strokeWidth="0.015" />

      {/* flip geometry so +y is UP */}
      <g transform="scale(1,-1)">
        {/* circle */}
        <polyline
          points={circlePts.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="0.02"
        />

        {/* faint projections */}
        <line x1={ux} y1={0} x2={ux} y2={uy} stroke="rgba(255,255,255,0.24)" strokeWidth="0.02" />
        <line x1={0} y1={0} x2={ux} y2={0} stroke="rgba(255,255,255,0.24)" strokeWidth="0.02" />

        {/* radius */}
        <line x1={0} y1={0} x2={ux} y2={uy} stroke="rgba(125,211,252,0.98)" strokeWidth="0.04" />

        {/* angle arc */}
        <polyline
          points={(() => {
            const pts: string[] = [];
            const steps = 44;
            for (let i = 0; i <= steps; i++) {
              const a = (theta * i) / steps;
              pts.push(`${(0.22 * Math.cos(a)).toFixed(4)},${(0.22 * Math.sin(a)).toFixed(4)}`);
            }
            return pts.join(" ");
          })()}
          fill="none"
          stroke="rgba(236,72,153,0.92)"
          strokeWidth="0.03"
        />

        {/* tan construction (only when tan mode AND defined) */}
        {showTan && (
          <>
            <line x1={1} y1={-view} x2={1} y2={view} stroke="rgba(255,255,255,0.16)" strokeWidth="0.015" />
            <line x1={0} y1={0} x2={1} y2={tanClip} stroke="rgba(255,255,255,0.26)" strokeWidth="0.015" />
            <line x1={1} y1={0} x2={1} y2={tanClip} stroke="rgba(255,255,255,0.55)" strokeWidth="0.02" />
            <circle cx={1} cy={tanClip} r="0.035" fill="rgba(125,211,252,0.90)" />
          </>
        )}

        {/* moving point LAST */}
        <circle cx={ux} cy={uy} r="0.055" fill="rgba(236,72,153,0.98)" />
      </g>

      {/* scale labels outside the circle */}
      <text x={1.12} y={0.10} textAnchor="middle" style={labelStyle}>
        1
      </text>
      <text x={-1.12} y={0.10} textAnchor="middle" style={labelStyle}>
        −1
      </text>
      <text x={0.12} y={-1.12} dominantBaseline="middle" style={labelStyle}>
        1
      </text>
      <text x={0.12} y={1.12} dominantBaseline="middle" style={labelStyle}>
        −1
      </text>
    </svg>
  );
}