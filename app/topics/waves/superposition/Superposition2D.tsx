"use client";

import React, { useEffect, useRef, useState } from "react";

function fmt(n: number, dp = 2) {
  return Number.isFinite(n) ? n.toFixed(dp) : "—";
}
function deg(rad: number) {
  return (rad * 180) / Math.PI;
}

function piFraction(rad: number) {
  const TWO_PI = Math.PI * 2;
  const STEP = Math.PI / 4; // we’re stepping in 45° chunks

  // normalise into [0, 2π)
  let r = rad % TWO_PI;
  if (r < 0) r += TWO_PI;

  // snap to nearest step to avoid float noise
  const n = Math.round(r / STEP); // 0..8
  if (n === 0) return "0";
  if (n === 8) return "2π";

  // represent as nπ/4, then simplify
  const num = n;
  const den = 4;

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(num, den);
  const p = num / g;
  const q = den / g;

  if (q === 1) return p === 1 ? "π" : `${p}π`;
  if (p === 1) return `π/${q}`;
  return `${p}π/${q}`;
}


export default function Superposition2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [A1, setA1] = useState(60);
  const [A2, setA2] = useState(60);
  const [phi, setPhi] = useState(Math.PI / 2);
  const [running, setRunning] = useState(true);

    const PHI_STEP = Math.PI / 4; // 45° steps

  // Canvas + wave params (px-based MVP)
  const W = 980;
  const H = 340;
  const lambda = 320;
  const k = (2 * Math.PI) / lambda;
  const T = 2.2;
  const omega = (2 * Math.PI) / T;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    let last = performance.now();

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;

      for (let x = 0; x <= W; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // midline
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();

      const phaseT = omega * t;

      const y1 = (x: number) => A1 * Math.sin(k * x - phaseT);
      const y2 = (x: number) => A2 * Math.sin(k * x - phaseT + phi);
      const yr = (x: number) => y1(x) + y2(x);

      const plot = (fn: (x: number) => number, stroke: string, lw: number) => {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
          const y = fn(x);
          const py = H / 2 - y;
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.stroke();
      };

      // wave1, wave2, resultant
      plot(y1, "rgba(0, 200, 255, 0.75)", 1.6);
      plot(y2, "rgba(255, 140, 0, 0.75)", 1.6);
      plot(yr, "rgba(255, 255, 255, 0.95)", 3);

      // labels
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("wave 1 (b)", 10, 18);
      ctx.fillText("wave 2 (o)", 130, 18);
      ctx.fillText("resultant (w)", 250, 18);
    };

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (running) t += dt;

      draw();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [A1, A2, phi, running, k, omega]);

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", maxWidth: W, borderRadius: 12, display: "block" }}
        />
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <div style={{ marginBottom: 6, fontWeight: 800 }}>Wave 1: {A1}</div>
          <input
            type="range"
            min={0}
            max={120}
            value={A1}
            onChange={(e) => setA1(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
            Amplitude of wave 1.
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 6, fontWeight: 800 }}>Wave 2: {A2}</div>
          <input
            type="range"
            min={0}
            max={120}
            value={A2}
            onChange={(e) => setA2(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
            Amplitude of wave 2.
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 6, fontWeight: 800 }}>
              Phase φ: {piFraction(phi)} ({fmt(deg(phi), 0)}°)
            </div>
          <input
            type="range"
            min={0}
            max={Math.PI * 2}
            step={PHI_STEP}
            value={phi}
            onChange={(e) => setPhi(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
            Phase difference between the two waves.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={() => setRunning((r) => !r)}
            className="card"
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              userSelect: "none",
              width: "100%",
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            {running ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, opacity: 0.9, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>How to read the graph</div>
        <div style={{ opacity: 0.9 }}>
          The resultant (white) is formed by adding the two displacements at each point along the
          wave. Changing phase shifts how much they reinforce or cancel.
        </div>
      </div>
    </div>
  );
}
