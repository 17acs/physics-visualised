"use client";

import React, { useMemo, useState } from "react";
import Photoelectric3D from "./Photoelectric3D";

const h = 6.62607015e-34; // J s
const e = 1.602176634e-19; // C

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function formatSci(n: number, sig = 3) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mant = n / Math.pow(10, exp);
  return `${mant.toFixed(sig - 1)}×10^${exp}`;
}

export default function PhotoelectricPage() {
  const [f14, setF14] = useState(6.0);
  const [intensity, setIntensity] = useState(50); // 0..100
  const [phiEv, setPhiEv] = useState(2.3);

  const fHz = f14 * 1e14;
  const phiJ = phiEv * e;
  const f0 = phiJ / h;

  const model = useMemo(() => {
    const photonE = h * fHz;
    const surplus = photonE - phiJ;
    const emits = surplus > 0;

    const kmaxJ = emits ? surplus : 0;
    const kmaxEv = kmaxJ / e;
    const vs = emits ? kmaxJ / e : 0;

    const rate = emits ? intensity / 100 : 0;

    return { photonE, emits, kmaxEv, vs, rate };
  }, [fHz, phiJ, intensity]);

  return (
    <main className="page" style={{ maxWidth: 1500 }}>

      <a href="/topics/modern" style={{ textDecoration: "none" }}>
        ← Back to Modern
      </a>

      <h1 style={{ fontSize: 34, margin: "12px 0 6px" }}>Photoelectric Effect</h1>
      <p style={{ marginTop: 0, opacity: 0.8, maxWidth: 980 }}>
        Emission only happens if <b>hf ≥ φ</b>. Intensity controls the <b>number</b> of electrons emitted (if above
        threshold frequency), not their max energy, since photon energy is dependent on hf. intensity is just the <b>amount</b> of photons not their energies.
      </p>

      <div className="topicGrid" style={{ ["--aside" as any]: "560px" }}>

        {/* LEFT */}
        {/* LEFT: graphs + controls + readout */}
<div style={{ display: "grid", gap: 12 }}>
  <MiniGraph fHz={fHz} phiJ={phiJ} />

  <div className="card" style={{ padding: 14 }}>
    <div style={{ fontWeight: 700, marginBottom: 10 }}>Controls</div>

    <Control
      label="Frequency f (×10¹⁴ Hz)"
      value={f14}
      min={0}
      max={12}
      step={0.1}
      onChange={setF14}
    />
    <Control
      label="Intensity"
      value={intensity}
      min={0}
      max={100}
      step={1}
      onChange={setIntensity}
    />
    <Control
      label="Work function φ (eV)"
      value={phiEv}
      min={1.5}
      max={5.5}
      step={0.05}
      onChange={setPhiEv}
    />
  </div>

  <div className="card" style={{ padding: 14 }}>
    <div style={{ fontWeight: 700, marginBottom: 10 }}>Results</div>

    <Row label="Threshold freq f₀" value={`${formatSci(f0)} Hz`} />
    <Row label="Emission?" value={model.emits ? "yes" : "no"} />

    <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

    <Row label="Photon energy (hf)" value={`${formatSci(model.photonE)} J`} />
    <Row label="Work function (φ)" value={`${phiEv.toFixed(2)} eV`} />

    <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

    <Row label="Ekmax" value={`${model.kmaxEv.toFixed(3)} eV`} />
    <Row label="Stopping potential" value={`${model.vs.toFixed(3)} V`} />
    <Row label="Electron rate " value={model.rate === 0 ? "0" : `${Math.round(model.rate * 100)}%`} />

    <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.6 }}>
      <div><b>Equations</b></div>
      <div>E = hf</div>
      <div>hf ≥ φ</div>
      <div>Ekmax = hf − φ</div>
      <div>eVs = Ekmax</div>
      <div>f₀ = φ / h</div>
    </div>
  </div>
</div>

{/* RIGHT: 3D (sticky on desktop) */}
<div className="stickyCol">
  <Photoelectric3D intensity={intensity} fHz={fHz} emits={model.emits} kmaxEv={model.kmaxEv} />
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
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
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
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <div style={{ fontWeight: 700 }}>{label}</div>
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

function MiniGraph({ fHz, phiJ }: { fHz: number; phiJ: number }) {
  // BIG graph that fills the right column width (top-right corner of the whole layout)
  const W = 560;
  const H = 240;
  const pad = 44;

  const fMin = 0;
  const fMax = 1.2e15;

  const xToPx = (fx: number) => pad + ((fx - fMin) / (fMax - fMin)) * (W - 2 * pad);

  const yMaxEv = 6;
  const yToPx = (kev: number) => H - pad - (kev / yMaxEv) * (H - 2 * pad);

  const steps = 140;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const fx = fMin + (i / steps) * (fMax - fMin);
    const kEv = Math.max(0, (h * fx - phiJ) / e);
    const X = xToPx(fx);
    const Y = yToPx(kEv);
    d += `${i === 0 ? "M" : "L"} ${X.toFixed(2)} ${Y.toFixed(2)} `;
  }

  const kNow = Math.max(0, (h * fHz - phiJ) / e);
  const cx = xToPx(clamp(fHz, fMin, fMax));
  const cy = yToPx(clamp(kNow, 0, yMaxEv));

  const f0 = phiJ / h;
  const f0x = xToPx(clamp(f0, fMin, fMax));

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Ekmax vs frequency</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>threshold marked</div>
      </div>

      <div className="graphBox" style={{ ["--ratio" as any]: `${W}/${H}` }}>
  <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">

        {/* axes */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="white" strokeOpacity="0.75" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="white" strokeOpacity="0.75" />

        {/* threshold */}
        <line x1={f0x} y1={pad} x2={f0x} y2={H - pad} stroke="#a78bfa" strokeOpacity="0.55" strokeDasharray="6 6" />

        {/* curve */}
        <path d={d} fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.5" />

        {/* current point */}
        <circle cx={cx} cy={cy} r="5.2" fill="#7dd3fc" stroke="white" strokeWidth="1.3" />

        {/* labels */}
        <text x={W - pad} y={H - 10} textAnchor="end" fontSize="12" fill="rgba(242,245,255,0.75)">
          f (Hz)
        </text>
        <text x={10} y={pad} textAnchor="start" fontSize="12" fill="rgba(242,245,255,0.75)">
          Ekmax (eV)
        </text>
        </svg>
</div>

    </div>
  );
}
