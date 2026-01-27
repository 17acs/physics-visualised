"use client";

import React, { useEffect, useMemo, useState } from "react";
import InverseSquare3D from "./InverseSquare3D";

type Point = { rM: number; N: number; C: number; Cnet: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Poisson sampling (counting statistics) from github. if i ever get a partner working on this website just know i managed to code everything BUT this. shit is fucking WEIRD
function sampleCounts(lambda: number) {
  if (lambda <= 0) return 0;

  // Normal approx if large
  if (lambda > 60) {
    const u1 = Math.random() || 1e-9;
    const u2 = Math.random() || 1e-9;
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
  }

  // Knuth if small
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export default function InverseSquarePage() {



    const researchNotes = `The process:
After struggling to understand how the equation accounts for only a portion of the counts being received, I turned to modelling the equations for answers. Assume you have a point source, like the one shown in the model. It emits particles uniformly in all directions (unbelievable at first). Since it is the centre of its own sphere, the distance between it and the point source will be its radius. If the source emits S particles per second, the particles per second per square metre is given by S/4πr2. But the detector doesn't measure all of this, just a small area. Let the area of the detector facing the source (m2) be x. Detection efficiency was ignored. The counts per second due to source is then equal to the particles per second per square metre multiplied by the area of the detector facing the source. Hence: xΦ(r) = xS/4πr2. This gives net count rate = K/r2. I wanted to account for background radiation so I allowed users to choose an amount and then modelled it using Cnet = Cgross - Cbg. Note that the 3D model does not do any of this math, all it is linked to is the radius slider. In practice, the mathematics behind this are more precise as they utilise a Poisson distribution linked to a normal approximation (for large lambdas) and knuths algorithm (for small lambdas) which I found on github and copied and pasted into my code. The count time was included in this distribution so I added a slider for it, improving accuracy of results in order to counteract point source randomness.
`;

  // distance from source to detector (m)
  const [rM, setRM] = useState(0.4);

  // K in (s^-1 * m^2) so that Cnet = K/r^2 has units s^-1
  const [K, setK] = useState(2.0);

  // background count rate (s^-1)
  const [Cbg, setCbg] = useState(6);

  // counting time (s)
  const [T, setT] = useState(10);

  // measured data
  const [data, setData] = useState<Point[]>([]);
  const [last, setLast] = useState<null | { N: number; C: number; Cnet: number }>(null);

  const model = useMemo(() => {
    const r = Math.max(0.05, rM);
    const Cnet = K / (r * r);     // net count rate due to source
    const Cgross = Cnet + Cbg;    // includes background
    return { Cnet, Cgross };
  }, [rM, K, Cbg]);

  function takeMeasurement() {
    // expected total counts in time T
    const lambda = model.Cgross * T;
    const N = sampleCounts(lambda);
    const C = N / T;         // measured gross count rate
    const Cnet = C - Cbg;    // subtract background (net)

    setLast({ N, C, Cnet });
    setData((prev) => [{ rM, N, C, Cnet }, ...prev].slice(0, 18));
  }

  function clearData() {
    setData([]);
    setLast(null);
  }

  // --- Graph (net count rate vs distance) ---
  const W = 720;
  const H = 280;
  const pad = 42;

  const rMin = 0.1;
  const rMax = 1.2;

  const yMax =
    Math.max(1, model.Cnet, ...data.map((d) => Math.max(0, d.Cnet))) * 1.15;

  const xToPx = (r: number) => pad + ((r - rMin) / (rMax - rMin)) * (W - 2 * pad);
  const yToPx = (cnet: number) => {
    const yVal = Math.max(0, cnet); // keep graph clean (no negative axis)
    return H - pad - (yVal / yMax) * (H - 2 * pad);
  };

  const curveD = useMemo(() => {
    const steps = 180;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const r = rMin + (i / steps) * (rMax - rMin);
      const Cnet = K / (r * r);
      const X = xToPx(r);
      const Y = yToPx(Cnet);
      d += `${i === 0 ? "M" : "L"} ${X.toFixed(2)} ${Y.toFixed(2)} `;
    }
    return d;
  }, [K, yMax]);

  const dotX = xToPx(rM);
  const dotY = yToPx(model.Cnet);

  return (
    <main className="page" style={{ maxWidth: 1500 }}>
      <a href="/topics/nuclear">← Back to Nuclear</a>

      <h1 style={{ fontSize: 34, margin: "12px 0 6px" }}>
        Inverse Square Law (γ radiation)
      </h1>

      <p style={{ marginTop: 0, opacity: 0.8, maxWidth: 980 }}>
        Research project on the inverse square law. I was confused on how the geiger tube's exposed area was taken into account.
      </p>

      <div className="topicGrid" style={{ ["--aside" as any]: "520px" }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 12 }}>
          <InverseSquare3D rM={rM} intensity={model.Cnet} />

          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 900 }}>Net count rate vs distance</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>model curve + your measurements</div>
            </div>

            <div className="graphBox" style={{ ["--ratio" as any]: `${W} / ${H}`, marginTop: 10 }}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                {/* axes */}
                <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="white" strokeOpacity="0.75" />
                <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="white" strokeOpacity="0.75" />

                {/* curve */}
                <path d={curveD} fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.5" />

                {/* current model point */}
                <circle cx={dotX} cy={dotY} r="5.2" fill="var(--accent)" stroke="white" strokeWidth="1.2" />

                {/* measured points */}
                {data.map((p, i) => (
                  <circle
                    key={i}
                    cx={xToPx(p.rM)}
                    cy={yToPx(p.Cnet)}
                    r="4"
                    fill="var(--accent3)"
                    fillOpacity="0.95"
                  />
                ))}

                {/* labels */}
                <text x={W - pad} y={H - 10} textAnchor="end" fontSize="12" fill="rgba(242,245,255,0.75)">
                  distance r (m)
                </text>
                <text x={10} y={pad} textAnchor="start" fontSize="12" fill="rgba(242,245,255,0.75)">
                  net count (s⁻¹)
                </text>
              </svg>
            </div>

            <div style={{ marginTop: 10, opacity: 0.8, fontSize: 14 }}>
              Graph of y=1/x2. Shoutout to all the mathematicians you the real physicists
            </div>
          </div>

          {/* Real-world examples stay below */}
          <section style={{ marginTop: 4 }}>
            <h2 style={{ margin: "18px 0 10px" }}>Real-world examples</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              <InverseSquareExampleCard
  title="Torch brightness (lux meter)"
  desc="D0 = 1200. r0 = 0.5. Anyone else notice a pattern with things emitted from a point?"
  unit="lx"
  atR0={1200}
  r0={0.5}
/>

<InverseSquareExampleCard
  title="Radiation dose rate (γ)"
  desc="Dose rate drops with distance. Figures used: D0 = 18. r0 = 0.5"
  unit="µSv/h"
  atR0={18}
  r0={0.5}
/>

<InverseSquareExampleCard
  title="Wi-Fi / radio signal (relative)"
  desc="Power per area spreads out. D0 = 100. r0 = 0.5. Things spread out inverse square-ly. They should make a law about this..."
  unit="%"
  atR0={100}
  r0={0.5}
/>



            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
  (r₀/r)² is the scale factor vs the reference distance r₀ — e.g. 0.06 means the reading is 6% of what it was at r₀. These equations are made by me.
  They follow: D(r)=D0(r0/r)² where D(r) is the dose rate for radius r, r0 is the example distance and r is the new distance you decide. This is to make the law clearer.
</div>

          </section>
        </div>

        {/* RIGHT */}
        <div className="stickyCol" style={{ display: "grid", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Research notes</div>
            <div
  style={{
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    opacity: 0.9,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
  }}
>
  {researchNotes}
</div>

          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Controls</div>

            <Control label="Distance r (m)" value={rM} min={0.1} max={1.2} step={0.01} onChange={setRM} />
            <Control label="Inverse-square constant K (s⁻¹·m²)" value={K} min={0.2} max={10} step={0.1} onChange={setK} />
            <Control label="Background Counts (s⁻¹)" value={Cbg} min={0} max={40} step={1} onChange={setCbg} />
            <Control label="Count time T (s)" value={T} min={2} max={40} step={1} onChange={setT} />

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={takeMeasurement} className="card" style={btnStyle}>
                Take measurement
              </button>
              <button onClick={clearData} className="card" style={{ ...btnStyle, opacity: 0.85 }}>
                Clear
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Model results</div>

            <Row label="Counts from source (Counts per second)" value={`${model.Cnet.toFixed(2)} s⁻¹`} />
            <Row label="Background (Counts per second)" value={`${Cbg.toFixed(2)} s⁻¹`} />
            <Row label="Total geiger reading (source + bg counts)" value={`${model.Cgross.toFixed(2)} s⁻¹`} />

            <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

            <Row label="Last N (counts)" value={last ? String(last.N) : "—"} />
            <Row label="Last C = N/T" value={last ? `${last.C.toFixed(2)} s⁻¹` : "—"} />
            <Row label="Last Counts from source = Total - background" value={last ? `${last.Cnet.toFixed(2)} s⁻¹` : "—"} />

            <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.6 }}>
              <div><b>Model</b></div>
              <div>Cnet = K / r²</div>
              <div style={{ marginTop: 8 }}><b>Measurement</b></div>
              <div>N counts in time T</div>
              <div>C = N/T</div>
              <div>Counts from source = Total counts - background counts</div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Your data</div>

            {data.length === 0 ? (
              <div style={{ opacity: 0.75 }}>No points yet. Take a measurement.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {data.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontSize: 13,
                      opacity: 0.9,
                    }}
                  >
                    <span>r={p.rM.toFixed(2)}m</span>
                    <span>N={p.N}</span>
                    <span>Cnet={p.Cnet.toFixed(2)}s⁻¹</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  cursor: "pointer",
};

function Control(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const { label, value, min, max, step, onChange } = props;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
          style={{ width: "100%" }}
        />
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
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
      <div style={{ fontWeight: 900 }}>{label}</div>
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

function InverseSquareExampleCard(props: {
  title: string;
  desc: string;
  unit: string;
  atR0: number;
  r0: number;
}) {
  const { title, desc, unit, atR0, r0 } = props;

  const [r, setR] = useState(r0);

  const Irel = useMemo(() => {
    const rr = Math.max(0.05, r);
    return (r0 * r0) / (rr * rr); // (r0/r)^2
  }, [r, r0]);

  const reading = useMemo(() => {
    const raw = atR0 * Irel;
    if (unit === "%") return Math.max(0, Math.min(100, raw));
    return raw;
  }, [atR0, Irel, unit]);

  const detectorX = 70 + (Math.min(2.0, Math.max(0.1, r)) / 2.0) * 210; // 0.1..2.0m -> 70..280
  const barW = unit === "%" ? (reading / 100) * 140 : Math.min(140, (reading / atR0) * 140);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 950, fontSize: 18 }}>{title}</div>
      <div style={{ opacity: 0.8, marginTop: 6 }}>{desc}</div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div style={{ fontWeight: 900 }}>r = {r.toFixed(2)} m</div>

          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              opacity: 0.9,
              whiteSpace: "nowrap",
            }}
          >
            {unit === "×g₀"
              ? `${reading.toFixed(3)} ${unit}`
              : unit === "%"
              ? `${Math.round(reading)}${unit}`
              : `${reading.toFixed(unit === "lx" ? 0 : 2)} ${unit}`}
          </div>
        </div>

        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.01}
          value={r}
          onChange={(e) => setR(Number(e.target.value))}
          style={{ width: "100%", marginTop: 10 }}
        />

        <svg viewBox="0 0 320 120" width="100%" height="120" style={{ display: "block", marginTop: 10 }}>
          {/* source */}
          <circle cx="55" cy="60" r="7" fill="var(--accent3)" />
          <text x="55" y="88" textAnchor="middle" fontSize="11" fill="rgba(242,245,255,0.75)">
            source
          </text>

          {/* expanding rings */}
          {[0, 1, 2].map((i) => (
            <circle key={i} cx="55" cy="60" r="12" fill="none" stroke="var(--accent2)" strokeWidth="2" opacity="0.55">
              <animate attributeName="r" values="12;85" dur="2.2s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.55;0" dur="2.2s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* detector */}
          <rect
            x={detectorX - 10}
            y="32"
            width="20"
            height="56"
            rx="8"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.14)"
          />
          <text x={detectorX} y="100" textAnchor="middle" fontSize="11" fill="rgba(242,245,255,0.75)">
            detector
          </text>

          {/* meter bar */}
          <rect x="165" y="14" width="140" height="12" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
          <rect x="165" y="14" width={barW} height="12" rx="6" fill="var(--accent)" opacity="0.9" />
          <text x="165" y="11" textAnchor="start" fontSize="10" fill="rgba(242,245,255,0.65)">
            meter
          </text>

          {/* formula */}
          <text x="165" y="44" textAnchor="start" fontSize="11" fill="rgba(242,245,255,0.75)">
            (r₀/r)² = {Irel.toFixed(2)}
          </text>
        </svg>
      </div>
    </div>
  );
}

