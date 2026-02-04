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
      <a href="/topics/modern" className="backLink">
        ← Back to Modern
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Photoelectric Effect</h1>
        <p className="heroText">
          Emission only happens if <b>hf ≥ φ</b>. Intensity controls the <b>number</b> of electrons emitted (if above
          threshold frequency), not their max energy, since photon energy is dependent on hf. intensity is just the <b>amount</b> of photons not their energies.
        </p>
      </div>

      <div className="topicGrid" style={{ ["--aside" as any]: "560px" }}>
        {/* LEFT */}
        <div className="stack12">
          <MiniGraph fHz={fHz} phiJ={phiJ} />

          <div className="card cardPad">
            <div className="sectionTitle">Controls</div>

            <Control label="Frequency f (×10¹⁴ Hz)" value={f14} min={0} max={12} step={0.1} onChange={setF14} />
            <Control label="Intensity" value={intensity} min={0} max={100} step={1} onChange={setIntensity} />
            <Control label="Work function φ (eV)" value={phiEv} min={1.5} max={5.5} step={0.05} onChange={setPhiEv} />
          </div>

          <div className="card cardPad">
            <div className="sectionTitle">Results</div>

            <Row label="Threshold freq f₀" value={`${formatSci(f0)} Hz`} />
            <Row label="Emission?" value={model.emits ? "yes" : "no"} />

            <div className="divider" />

            <Row label="Photon energy (hf)" value={`${formatSci(model.photonE)} J`} />
            <Row label="Work function (φ)" value={`${phiEv.toFixed(2)} eV`} />

            <div className="divider" />

            <Row label="Ekmax" value={`${model.kmaxEv.toFixed(3)} eV`} />
            <Row label="Stopping potential" value={`${model.vs.toFixed(3)} V`} />
            <Row label="Electron rate " value={model.rate === 0 ? "0" : `${Math.round(model.rate * 100)}%`} />

            <div className="divider" />

            <div className="monoBlock">
              <div><b>Equations</b></div>
              <div>E = hf</div>
              <div>hf ≥ φ</div>
              <div>Ekmax = hf − φ</div>
              <div>eVs = Ekmax</div>
              <div>f₀ = φ / h</div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
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
    <div className="control">
      <div className="controlLabel">{label}</div>
      <div className="controlRow">
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
            setText(e.target.value);
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(clamp(n, min, max));
          }}
          onBlur={() => {
            const n = Number(text);
            if (!Number.isFinite(n)) setText(String(value));
            else setText(String(clamp(n, min, max)));
          }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row">
      <div className="rowLabel">{label}</div>
      <div className="rowValue">{value}</div>
    </div>
  );
}

function MiniGraph({ fHz, phiJ }: { fHz: number; phiJ: number }) {
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

  // subtle grid
  const grid = [];
  for (let i = 1; i <= 4; i++) {
    const y = pad + (i / 5) * (H - 2 * pad);
    grid.push(<line key={"gy" + i} x1={pad} y1={y} x2={W - pad} y2={y} stroke="white" strokeOpacity="0.08" />);
  }
  for (let i = 1; i <= 5; i++) {
    const x = pad + (i / 6) * (W - 2 * pad);
    grid.push(<line key={"gx" + i} x1={x} y1={pad} x2={x} y2={H - pad} stroke="white" strokeOpacity="0.08" />);
  }

  return (
    <div className="card cardPad">
      <div className="graphHeader">
        <div className="sectionTitle" style={{ margin: 0 }}>Ekmax vs frequency</div>
        <div className="graphHint">threshold marked</div>
      </div>

      <div className="graphBox" style={{ ["--ratio" as any]: `${W}/${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {grid}

          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="white" strokeOpacity="0.55" />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="white" strokeOpacity="0.55" />

          <line x1={f0x} y1={pad} x2={f0x} y2={H - pad} stroke="#a78bfa" strokeOpacity="0.55" strokeDasharray="6 6" />

          <path d={d} fill="none" stroke="white" strokeOpacity="0.72" strokeWidth="2.6" />
          <circle cx={cx} cy={cy} r="5.2" fill="#7dd3fc" stroke="white" strokeWidth="1.3" />

          <text x={W - pad} y={H - 10} textAnchor="end" fontSize="12" fill="rgba(242,245,255,0.75)">f (Hz)</text>
          <text x={10} y={pad} textAnchor="start" fontSize="12" fill="rgba(242,245,255,0.75)">Ekmax (eV)</text>
        </svg>
      </div>
    </div>
  );
}
