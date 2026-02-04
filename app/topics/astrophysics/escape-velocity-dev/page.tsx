"use client";

import React, { useMemo, useState } from "react";

const G = 6.67430e-11; // m^3 kg^-1 s^-2

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function fmt(n: number, dp = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(dp);
}

function sci(n: number, sig = 3) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mant = n / Math.pow(10, exp);
  return `${mant.toFixed(sig - 1)}×10^${exp}`;
}

export default function Page() {
  const [massEarth, setMassEarth] = useState(1.0);
  const [radiusEarth, setRadiusEarth] = useState(1.0);

  const model = useMemo(() => {
    const M = massEarth * 5.972e24;  // kg
    const R = radiusEarth * 6.371e6; // m
    const ve = Math.sqrt((2 * G * M) / R); // m/s
    const veKms = ve / 1000;
    const eps = (ve * ve) / 2; // J/kg
    return { M, R, veKms, eps };
  }, [massEarth, radiusEarth]);

  return (
    <main className="page" style={{ maxWidth: 1500 }}>
      <a href="/topics/astrophysics" className="backLink">← Back to Astrophysics</a>

      <div className="card" style={{ padding: 18, borderRadius: 18 }}>
        <h1 style={{ fontSize: 34, margin: "0 0 8px" }}>Escape Velocity</h1>

        <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.65, maxWidth: 980 }}>
          Escape velocity isn’t “how fast you need to go forever”. It’s the minimum speed you need <b>right now</b> so
          you can coast away without falling back (ignoring air resistance). Bigger mass increases it. Bigger radius
          decreases it.
        </p>

        <div style={{ marginTop: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          vₑ = √(2GM / r)
        </div>
      </div>

      <div className="topicGrid" style={{ ["--aside" as any]: "640px", marginTop: 16 }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Controls</div>

            <Control label="Mass (Earth masses)" value={massEarth} min={0.1} max={40} step={0.1} onChange={setMassEarth} />
            <Control label="Radius (Earth radii)" value={radiusEarth} min={0.2} max={15} step={0.05} onChange={setRadiusEarth} />
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Results</div>

            <Row label="M" value={`${sci(model.M)} kg`} />
            <Row label="r" value={`${sci(model.R)} m`} />

            <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

            <Row label="Escape velocity vₑ" value={`${fmt(model.veKms, 2)} km/s`} />
            <Row label="Energy per kg" value={`${sci(model.eps)} J/kg`} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="stickyCol">
          <EscapeDiagram massEarth={massEarth} radiusEarth={radiusEarth} veKms={model.veKms} />
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
}) {
  const { label, value, min, max, step, onChange } = props;
  const [text, setText] = useState(String(value));

  React.useEffect(() => setText(String(value)), [value]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{label}</div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: "100%" }}
        />

        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(clamp(n, min, max));
          }}
          onBlur={() => {
            const n = Number(text);
            if (!Number.isFinite(n)) setText(String(value));
            else setText(String(clamp(n, min, max)));
          }}
          style={{
            width: 120,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <div style={{ fontWeight: 800 }}>{label}</div>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          whiteSpace: "nowrap",
          overflowX: "auto",
          maxWidth: "65%",
          textAlign: "right",
          minWidth: 0,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EscapeDiagram(props: { massEarth: number; radiusEarth: number; veKms: number }) {
  const { massEarth, radiusEarth, veKms } = props;

  const W = 920;
  const H = 520;

  const R = clamp(90 + radiusEarth * 18, 90, 260);
  const cx = Math.round(W * 0.45);
  const cy = Math.round(H * 0.58);

  const arrowLen = clamp(120 + veKms * 7, 140, 420);
  const ax0 = cx + R + 10;
  const ay0 = cy - Math.round(R * 0.25);
  const ax1 = ax0 + arrowLen;
  const ay1 = ay0 - Math.round(arrowLen * 0.12);

  const label = `${veKms.toFixed(1)} km/s`;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", height: "clamp(360px, 52vh, 640px)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <radialGradient id="planetGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="rgba(125,211,252,0.35)" />
            <stop offset="1" stopColor="rgba(5,6,10,0.95)" />
          </radialGradient>

          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="rgba(252,211,77,0.95)" />
          </marker>
        </defs>

        <circle cx={cx} cy={cy} r={R + 46} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={R} fill="url(#planetGrad)" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />

        <g style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.55)", strokeWidth: 3, strokeLinejoin: "round" }}>
          <text x={60} y={64} fill="rgba(242,245,255,0.78)" fontSize="16">
            mass = {massEarth.toFixed(2)} M⊕
          </text>
          <text x={60} y={88} fill="rgba(242,245,255,0.78)" fontSize="16">
            radius = {radiusEarth.toFixed(2)} R⊕
          </text>
        </g>

        <line
          x1={ax0}
          y1={ay0}
          x2={ax1}
          y2={ay1}
          stroke="rgba(252,211,77,0.90)"
          strokeWidth="6"
          markerEnd="url(#arr)"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        <g style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.55)", strokeWidth: 3, strokeLinejoin: "round" }}>
          <text x={ax0 + 8} y={ay0 - 14} fill="rgba(242,245,255,0.85)" fontSize="18">
            vₑ ≈ {label}
          </text>
          <text x={ax0 + 8} y={ay0 + 14} fill="rgba(242,245,255,0.70)" fontSize="14">
            minimum “leave and never return” speed
          </text>
        </g>
      </svg>
    </div>
  );
}
