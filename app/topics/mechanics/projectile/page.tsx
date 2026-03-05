"use client";

import Projectile3D from "./Projectile3D";
import React, { useEffect, useMemo, useState } from "react";

const g = 9.81;

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function ProjectilePage() {
  const [speed, setSpeed] = useState(20);
  const [angleDeg, setAngleDeg] = useState(45);
  const [time, setTime] = useState(0);
  const [autoScale, setAutoScale] = useState(true);

  const data = useMemo(() => {
    const theta = degToRad(angleDeg);
    const ux = speed * Math.cos(theta);
    const uy = speed * Math.sin(theta);

    const timeOfFlight = uy > 0 ? (2 * uy) / g : 0;
    const range = ux * timeOfFlight;
    const maxHeight = (uy * uy) / (2 * g);

    const t = Math.max(0, Math.min(time, timeOfFlight || 0));

    const x = ux * t;
    const y = uy * t - 0.5 * g * t * t;
    const vx = ux;
    const vy = uy - g * t;

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

  const tMax = data.timeOfFlight || 0;

  // SVG sizing + scaling
  const W = 700;
  const H = 280;
  const pad = 28;

  const speedMax = 60;
  const angleMax = 85;
  const globalXMax = (speedMax * speedMax) / g;
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
      const Y = H - pad - p.y * sy;
      return `${i === 0 ? "M" : "L"} ${X.toFixed(2)} ${Y.toFixed(2)}`;
    })
    .join(" ");

  const dotX = pad + data.x * sx;
  const dotY = H - pad - data.y * sy;

  return (
    <main className="page" style={{ maxWidth: 1400 }}>
      <a href="/topics/mechanics" className="backLink">
        ← Back to Mechanics
      </a>

      <h1 style={{ fontSize: 34, margin: "12px 0 6px" }}>Projectile Motion</h1>
      <p className="heroText" style={{ marginTop: 0 }}>
        Model of throwing objects. Constant acceleration so negligible air resistance and external forces.
      </p>

      <div className="topicGrid" style={{ ["--aside" as any]: "650px" }}>
        {/* LEFT */}
        {/* critical: allows inner grids to shrink instead of forcing overflow */}
        <div style={{ minWidth: 0 }}>
          {/* Controls */}
          <div
            style={{
              display: "grid",
              gap: 12,
              // critical: min() prevents the “two cards but not enough room” crop
              gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
              marginTop: 14,
              minWidth: 0,
            }}
          >
            <Control label="Initial speed (ms⁻¹)" value={speed} min={1} max={100} step={0.1} onChange={setSpeed} />
            <Control
              label="Launch angle (°)"
              value={angleDeg}
              min={0}
              max={90}
              step={0.1}
              onChange={(v) => {
                setAngleDeg(v);
                setTime(0);
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
            <input id="autoscale" type="checkbox" checked={autoScale} onChange={(e) => setAutoScale(e.target.checked)} />
            <label htmlFor="autoscale" style={{ opacity: 0.85 }}>
              auto-fit axes (keep off to keep changes in speed easy to see)
            </label>
          </div>

          {/* Graph */}
          <div className="card cardStrong" style={{ marginTop: 18, minWidth: 0 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Trajectory</div>

            <div className="graphBox" style={{ ["--ratio" as any]: `${W}/${H}` }}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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

                <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="white" strokeWidth="1" strokeOpacity="0.85" />
                <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="white" strokeWidth="1" strokeOpacity="0.85" />

                <path d={pathD} fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.75" />

                <circle cx={dotX} cy={dotY} r="5" fill="#c1121f" stroke="white" strokeWidth="1.5" />

                <text x={W - pad} y={H - 0.01} textAnchor="end" fontSize="12" fill="rgba(242,245,255,0.8)">
                  x (m)
                </text>
                <text x={10} y={pad} textAnchor="start" fontSize="12" fill="rgba(242,245,255,0.8)">
                  y (m)
                </text>
              </svg>
            </div>

            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
              Range ≈ <b>{data.range.toFixed(2)} m</b> • Max height ≈ <b>{data.maxHeight.toFixed(2)} m</b> • Time of flight ≈{" "}
              <b>{data.timeOfFlight.toFixed(2)} s</b>
            </div>
          </div>

          {/* Boxes */}
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 12,
              // critical: this is the real fix for your cropped boxes
              gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
              minWidth: 0,
            }}
          >
            <Box title="Initial components">
              <Eq label="horizontal velocity" value={`${data.ux.toFixed(2)} m/s`} />
              <Eq label="vertical velocity" value={`${data.uy.toFixed(2)} m/s`} />
              <Eq label="horizontal acceleration" value={`0 m/s²`} />
              <Eq label="vertical acceleration" value={`−${g} m/s²`} />
            </Box>

            <Box title={`At time t = ${data.t.toFixed(2)} s`}>
              <Eq label="horizontal distance" value={`${data.x.toFixed(2)} m`} />
              <Eq label="vertical distance" value={`${data.y.toFixed(2)} m`} />
              <Eq label="horizontal velocity" value={`${data.vx.toFixed(2)} m/s`} />
              <Eq label="vertical velocity" value={`${data.vy.toFixed(2)} m/s`} />
            </Box>

            <Box title="SUVAT used">
              <div className="monoBlock">
                <div>
                  <b>verticals:</b> (a = 0)
                </div>
                <div>s = ut + ½at²</div>
                <div>v = u + at</div>

                <div style={{ marginTop: 10 }}>
                  <b>horizontals:</b> (a = −g)
                </div>
                <div>s = ut + ½at²</div>
                <div>v = u + at</div>
                <div>v² = u² + 2as</div>
              </div>
            </Box>
          </div>
        </div>

        {/* RIGHT */}
        <div className="stickyCol" style={{ marginTop: 14, minWidth: 0 }}>
          <Projectile3D
            points={data.points}
            ball={{ x: data.x, y: data.y }}
            range={data.range}
            maxHeight={data.maxHeight}
            vx={data.vx}
            vy={data.vy}
          />
        </div>
      </div>
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
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(Number.isFinite(value) ? value : min));
  }, [value, min]);

  function setValue(next: number) {
    const clamped = clamp(next, min, max);
    onChange(clamped);
  }

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
          onChange={(e) => setValue(Number(e.target.value))}
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
            if (Number.isFinite(n)) setValue(n);
          }}
          onBlur={() => {
            const n = Number(text);
            if (!Number.isFinite(n)) {
              setText(String(value));
            } else {
              const clamped = clamp(n, min, max);
              setText(String(clamped));
              onChange(clamped);
            }
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
    <div className="card cardStrong" style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Eq({ label, value }: { label: string; value: string }) {
  return (
    <div className="row">
      <div className="rowLabel">{label}</div>
      <div className="rowValue">{value}</div>
    </div>
  );
}