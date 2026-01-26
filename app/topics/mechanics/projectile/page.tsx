"use client";
import Projectile3D from "./Projectile3D";
import React, { useEffect, useMemo, useState } from "react";

const g = 9.81;

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function ProjectilePage() {
  const [speed, setSpeed] = useState(20); // m/s
  const [angleDeg, setAngleDeg] = useState(45); // degrees
  const [time, setTime] = useState(0); // seconds
  const [autoScale, setAutoScale] = useState(false); // false = locked scale (recommended)


  const data = useMemo(() => {
    const theta = degToRad(angleDeg);
    const ux = speed * Math.cos(theta);
    const uy = speed * Math.sin(theta);

    const timeOfFlight = uy > 0 ? (2 * uy) / g : 0;
    const range = ux * timeOfFlight;
    const maxHeight = (uy * uy) / (2 * g);

    // clamp time into [0, timeOfFlight]
    const t = Math.max(0, Math.min(time, timeOfFlight || 0));

    // SUVAT (x: a=0, y: a=-g)
    const x = ux * t;
    const y = uy * t - 0.5 * g * t * t;
    const vx = ux;
    const vy = uy - g * t;

    // Build trajectory points for SVG
    const points: { x: number; y: number }[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const ti = (timeOfFlight * i) / steps;
      const xi = ux * ti;
      const yi = uy * ti - 0.5 * g * ti * ti;
      points.push({ x: xi, y: Math.max(0, yi) });
    }

    return {
      theta,
      ux,
      uy,
      timeOfFlight,
      range,
      maxHeight,
      t,
      x,
      y: Math.max(0, y),
      vx,
      vy,
      points,
    };
  }, [speed, angleDeg, time]);

  // keep time slider max aligned with time of flight
  const tMax = data.timeOfFlight || 0;

  // SVG sizing + scaling
// SVG sizing + scaling
const W = 700;
const H = 280;
const pad = 28;

// "Locked" scale based on slider limits (so changing speed visibly changes curve size)
const speedMax = 60;
const angleMax = 85;
const globalXMax = (speedMax * speedMax) / g; // max range occurs near 45° -> u^2/g
const globalYMax = (speedMax * speedMax * Math.sin(degToRad(angleMax)) ** 2) / (2 * g);

const xMax = Math.max(1, autoScale ? data.range : globalXMax);
const yMax = Math.max(1, autoScale ? data.maxHeight : globalYMax);

const sx = (W - 2 * pad) / xMax;
const sy = (H - 2 * pad) / yMax;

function niceTicks(max: number, approxCount: number) {
  const rawStep = max / approxCount;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const scaled = rawStep / pow;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  const step = nice * pow;
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
}

const xTicks = niceTicks(xMax, 6);
const yTicks = niceTicks(yMax, 5);


  const pathD = data.points
    .map((p, i) => {
      const X = pad + p.x * sx;
      const Y = H - pad - p.y * sy; // invert y for SVG
      return `${i === 0 ? "M" : "L"} ${X.toFixed(2)} ${Y.toFixed(2)}`;
    })
    .join(" ");

  const dotX = pad + data.x * sx;
  const dotY = H - pad - data.y * sy;

  return (
  <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 1400 }}>
    <a href="/topics/mechanics" style={{ textDecoration: "none" }}>
      ← Back to Mechanics
    </a>

    <h1 style={{ fontSize: 34, margin: "12px 0 6px" }}>Projectile Motion</h1>
    <p style={{ marginTop: 0, opacity: 0.8 }}>
      Split motion into components: <b>x</b> has <b>a = 0</b>, <b>y</b> has <b>a = −g</b>.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 650px",
        gap: 16,
        alignItems: "start",
        marginTop: 16,
      }}
    >
      <div>


      {/* Controls */}
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginTop: 14,
        }}
      >
        <Control
          label="Initial speed (ms⁻¹)"
          value={speed}
          min={1}
          max={100}
          step={0.1}
          onChange={setSpeed}
        />
        <Control
          label="Launch angle (°)"
          value={angleDeg}
          min={0}
          max={90}
          step={0.1}
          onChange={(v) => {
            setAngleDeg(v);
            setTime(0); // reset time when angle changes (optional)
          }}
        />
        <Control
          label="Time t (s)"
          value={data.t}
          min={0}
          max={tMax}
          step={tMax > 0 ? tMax / 200 : 0.01}
          onChange={setTime}
          note={tMax > 0 ? `0 → ${tMax.toFixed(2)} s` : "Increase angle/speed"}
        />
      </div>
<div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
  <input
    id="autoscale"
    type="checkbox"
    checked={autoScale}
    onChange={(e) => setAutoScale(e.target.checked)}
  />
  <label htmlFor="autoscale" style={{ opacity: 0.85 }}>
    auto-fit axes (keep off to keep changes in speed easy to see)
  </label>
</div>

      {/* Graph */}
      <div
        style={{
          marginTop: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Trajectory</div>
        <svg width={W} height={H} style={{ width: "100%", height: "auto", display: "block" }}>
  {/* faint grid + tick labels */}
  {xTicks.map((tx) => {
    if (tx === 0) return null;
    const X = pad + tx * sx;
    return (
      <g key={`x-${tx}`}>
        <line x1={X} y1={pad} x2={X} y2={H - pad} stroke="white" strokeOpacity="0.08" />
        <text x={X} y={H - pad + 16} textAnchor="middle" fontSize="11" fill="rgba(242,245,255,0.65)">
          {tx.toFixed(tx < 10 ? 1 : 0)}
        </text>
      </g>
    );
  })}

  {yTicks.map((ty) => {
    if (ty === 0) return null;
    const Y = H - pad - ty * sy;
    return (
      <g key={`y-${ty}`}>
        <line x1={pad} y1={Y} x2={W - pad} y2={Y} stroke="white" strokeOpacity="0.08" />
        <text x={pad - 8} y={Y + 4} textAnchor="end" fontSize="11" fill="rgba(242,245,255,0.65)">
          {ty.toFixed(ty < 10 ? 1 : 0)}
        </text>
      </g>
    );
  })}

  {/* axes */}
  <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="white" strokeWidth="1" strokeOpacity="0.85" />
  <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="white" strokeWidth="1" strokeOpacity="0.85" />

  {/* path */}
  <path d={pathD} fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.75" />

  {/* dot at time t */}
  <circle cx={dotX} cy={dotY} r="5" fill="#c1121f" stroke="white" strokeWidth="1.5" />

  {/* axis labels */}
  <text x={W - pad} y={H - 8} textAnchor="end" fontSize="12" fill="rgba(242,245,255,0.8)">
    x (m)
  </text>
  <text x={10} y={pad} textAnchor="start" fontSize="12" fill="rgba(242,245,255,0.8)">
    y (m)
  </text>
</svg>

        <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
          Range ≈ <b>{data.range.toFixed(2)} m</b> • Max height ≈{" "}
          <b>{data.maxHeight.toFixed(2)} m</b> • Time of flight ≈{" "}
          <b>{data.timeOfFlight.toFixed(2)} s</b>
        </div>
      </div>

      {/* SUVAT / equations */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <Box title="Components (initial)">
          <Eq label="uₓ" value={`${data.ux.toFixed(2)} m/s`} />
          <Eq label="uᵧ" value={`${data.uy.toFixed(2)} m/s`} />
          <Eq label="aₓ" value={`0 m/s²`} />
          <Eq label="aᵧ" value={`−${g} m/s²`} />
        </Box>

        <Box title={`At time t = ${data.t.toFixed(2)} s`}>
          <Eq label="x" value={`${data.x.toFixed(2)} m`} />
          <Eq label="y" value={`${data.y.toFixed(2)} m`} />
          <Eq label="vₓ" value={`${data.vx.toFixed(2)} m/s`} />
          <Eq label="vᵧ" value={`${data.vy.toFixed(2)} m/s`} />
        </Box>

        <Box title="SUVAT used (with this setup)">
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <div>
              <b>x-direction</b> (a = 0)
            </div>
            <div> s = ut + ½at² → x = uₓ t</div>
            <div> v = u + at → vₓ = uₓ</div>
            <div style={{ marginTop: 10 }}>
              <b>y-direction</b> (a = −g)
            </div>
            <div> s = ut + ½at² → y = uᵧ t − ½ g t²</div>
            <div> v = u + at → vᵧ = uᵧ − g t</div>
            <div> v² = u² + 2as → vᵧ² = uᵧ² − 2g y</div>
          </div>
        </Box>
      </div>
          </div> {/* end LEFT column */}

      <div style={{ position: "sticky", top: 16, marginTop: 14 }}>
        <Projectile3D
          points={data.points}
          ball={{ x: data.x, y: data.y }}
          range={data.range}
          maxHeight={data.maxHeight}
          vx={data.vx}
          vy={data.vy}
        />
      </div>
    </div> {/* end GRID */}
  </main>
);
}


function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

  // keeps the number input friendly while still controlled by the slider
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(Number.isFinite(value) ? value : min));
  }, [value, min]);

  function setValue(next: number) {
    const clamped = clamp(next, min, max);
    onChange(clamped);
  }

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,0.035)" }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ width: "100%" }}
        />

        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const n = Number(raw);
            if (Number.isFinite(n)) setValue(n);
          }}
          onBlur={() => {
            const n = Number(text);
            if (!Number.isFinite(n)) {
              setText(String(value));
            } else {
              // snap display back to clamped value
              const clamped = clamp(n, min, max);
              setText(String(clamped));
              onChange(clamped);
            }
          }}
          style={{
            width: 110,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            outline: "none",
          }}
        />
      </div>

      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 14, opacity: 0.85 }}>
        <span>{Number(value).toFixed(2)}</span>
        <span>{note ?? `${min} → ${max}`}</span>
      </div>
    </div>
  );
}


function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Eq({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        {value}
      </div>
    </div>
  );
}
