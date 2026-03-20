"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Mode = "two" | "single" | "double";
type Pt = { x: number; y: number };

const CANVAS_W = 900;
const CANVAS_H = 520;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function sinc(x: number) {
  if (Math.abs(x) < 1e-8) return 1;
  return Math.sin(x) / x;
}

function format(n: number, dp = 2) {
  return n.toFixed(dp);
}

export default function InterferenceDiffractionPage() {
  const [mode, setMode] = useState<Mode>("two");

  const [wavelength, setWavelength] = useState(0.85);
  const [separation, setSeparation] = useState(1.8);
  const [slitWidth, setSlitWidth] = useState(0.8);
  const screenDistance = 6;
  const [playing, setPlaying] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphRef = useRef<HTMLCanvasElement | null>(null);

  const diffractionRatio = useMemo(
    () => wavelength / slitWidth,
    [wavelength, slitWidth]
  );

  const modeTitle = useMemo(() => {
    if (mode === "two") return "Two Sources";
    if (mode === "single") return "Single Slit";
    return "Double Slit";
  }, [mode]);

  const modeBlurb = useMemo(() => {
    if (mode === "two") {
      return "Based on an AQA textbook question I saw regarding dippers in water.";
    }
    if (mode === "single") {
      return "Waves passing through a slit. Watch how they bend.";
    }
    return "Waves pass through two slits and superimpose on themselves. This causes fringes.";
  }, [mode]);

  const graphHint = useMemo(() => {
    return "brightness along the vertical screen";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const graphCanvas = graphRef.current;
    if (!canvas || !graphCanvas) return;

    const ctx = canvas.getContext("2d");
    const gctx = graphCanvas.getContext("2d");
    if (!ctx || !gctx) return;

    const drawCtx: CanvasRenderingContext2D = ctx;
    const graphCtx: CanvasRenderingContext2D = gctx;

    let raf = 0;
    const start = performance.now();

    const bg = "rgba(6, 8, 20, 0.96)";
    const line = "rgba(235, 240, 255, 0.42)";
    const lineStrong = "rgba(245, 248, 255, 0.72)";
    const barrier = "rgba(255,255,255,0.92)";
    const screen = "rgba(255,255,255,0.20)";
    const guide = "rgba(255,255,255,0.07)";
    const screenXWorld = 6.2;

    const world = {
      xMin: -8.5,
      xMax: 8.5,
      yMin: -4.8,
      yMax: 4.8,
    };

    function X(x: number) {
      return ((x - world.xMin) / (world.xMax - world.xMin)) * CANVAS_W;
    }

    function Y(y: number) {
      return ((world.yMax - y) / (world.yMax - world.yMin)) * CANVAS_H;
    }

    function drawBackground() {
      drawCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawCtx.fillStyle = bg;
      drawCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      drawCtx.strokeStyle = guide;
      drawCtx.lineWidth = 1;

      for (let i = 1; i < 6; i++) {
        const x = (CANVAS_W * i) / 6;
        drawCtx.beginPath();
        drawCtx.moveTo(x, 0);
        drawCtx.lineTo(x, CANVAS_H);
        drawCtx.stroke();
      }

      for (let i = 1; i < 5; i++) {
        const y = (CANVAS_H * i) / 5;
        drawCtx.beginPath();
        drawCtx.moveTo(0, y);
        drawCtx.lineTo(CANVAS_W, y);
        drawCtx.stroke();
      }
    }

    function drawPlaneWaveLines(
      xStart: number,
      xEnd: number,
      phaseOffset: number
    ) {
      const spacing = wavelength * 0.9;
      const first = xStart - 20 * spacing;

      drawCtx.strokeStyle = line;
      drawCtx.lineWidth = 1.4;

      for (let n = 0; n < 80; n++) {
        const x = first + n * spacing + phaseOffset;
        if (x < xStart || x > xEnd) continue;

        drawCtx.beginPath();
        drawCtx.moveTo(X(x), Y(world.yMin));
        drawCtx.lineTo(X(x), Y(world.yMax));
        drawCtx.stroke();
      }
    }

    function drawCircularWavefronts(
      source: Pt,
      phaseOffset: number,
      radiusMax: number,
      angleStart = 0,
      angleEnd = Math.PI * 2,
      alphaScale = 1
    ) {
      const spacing = wavelength * 0.9;
      const baseRadius = ((phaseOffset % spacing) + spacing) % spacing;

      for (let r = baseRadius; r < radiusMax; r += spacing) {
        const a =
          clamp(0.18 + 0.55 * (1 - r / radiusMax), 0.07, 0.65) * alphaScale;
        drawCtx.strokeStyle = `rgba(245,248,255,${a})`;
        drawCtx.lineWidth = r < 1.2 ? 1.8 : 1.2;
        drawCtx.beginPath();
        drawCtx.arc(
          X(source.x),
          Y(source.y),
          (r / (world.xMax - world.xMin)) * CANVAS_W,
          angleStart,
          angleEnd
        );
        drawCtx.stroke();
      }
    }

    function drawBarrierSingle() {
      const bx = -2.9;
      const half = slitWidth / 2;

      drawCtx.fillStyle = barrier;
      drawCtx.fillRect(X(bx) - 4, 0, 8, Y(half));
      drawCtx.fillRect(X(bx) - 4, Y(-half), 8, CANVAS_H - Y(-half));
    }

    function drawBarrierDouble() {
      const bx = -2.9;
      const c1 = -separation / 2;
      const c2 = separation / 2;
      const half = slitWidth / 2;

      const top1 = c1 + half;
      const bot1 = c1 - half;
      const top2 = c2 + half;
      const bot2 = c2 - half;

      drawCtx.fillStyle = barrier;
      drawCtx.fillRect(X(bx) - 4, 0, 8, Y(top2));
      drawCtx.fillRect(X(bx) - 4, Y(bot2), 8, Y(top1) - Y(bot2));
      drawCtx.fillRect(X(bx) - 4, Y(bot1), 8, CANVAS_H - Y(bot1));
    }

    function drawScreenLine() {
      drawCtx.fillStyle = screen;
      drawCtx.fillRect(X(screenXWorld), 0, 2, CANVAS_H);
    }

    function twoSourceIntensityAtScreenY(y: number) {
      const s1: Pt = { x: -separation / 2, y: 0 };
      const s2: Pt = { x: separation / 2, y: 0 };

      const r1 = Math.hypot(screenXWorld - s1.x, y - s1.y);
      const r2 = Math.hypot(screenXWorld - s2.x, y - s2.y);

      const deltaR = r1 - r2;
      const intensity = Math.cos((Math.PI * deltaR) / wavelength) ** 2;

      return clamp(intensity, 0, 1);
    }

    function sinThetaFromScreenCoord(s: number) {
      return s / Math.hypot(s, screenDistance);
    }

    function intensityAtScreenY(y: number) {
      if (mode === "two") {
        return twoSourceIntensityAtScreenY(y);
      }

      const sinTheta = sinThetaFromScreenCoord(y);

      if (mode === "single") {
        const beta = (Math.PI * slitWidth * sinTheta) / wavelength;
        return clamp(sinc(beta) ** 2, 0, 1);
      }

      const beta = (Math.PI * slitWidth * sinTheta) / wavelength;
      const alpha = (Math.PI * separation * sinTheta) / wavelength;

      return clamp(Math.cos(alpha) ** 2 * sinc(beta) ** 2, 0, 1);
    }

    function drawScreenBrightness() {
      const xPx = X(screenXWorld);

      for (let py = 0; py < CANVAS_H; py += 3) {
        const yWorld =
          world.yMax - (py / CANVAS_H) * (world.yMax - world.yMin);
        const I = intensityAtScreenY(yWorld);
        const alpha = 0.06 + 0.82 * I;

        drawCtx.fillStyle = `rgba(245,248,255,${alpha})`;
        drawCtx.fillRect(xPx - 3, py, 8, 3);
      }
    }

    function getDiffractionHalfAngle() {
      if (mode === "two") return Math.PI;

      const raw = Math.asin(clamp(wavelength / slitWidth, 0, 0.98));
      return clamp(raw, 0.18, 1.35);
    }

    function drawTwoSources(phaseOffset: number) {
      const s1: Pt = { x: -separation / 2, y: 0 };
      const s2: Pt = { x: separation / 2, y: 0 };

      drawCircularWavefronts(s1, phaseOffset, 12.5);
      drawCircularWavefronts(s2, phaseOffset, 12.5);

      drawCtx.fillStyle = lineStrong;
      drawCtx.beginPath();
      drawCtx.arc(X(s1.x), Y(s1.y), 5, 0, Math.PI * 2);
      drawCtx.fill();

      drawCtx.beginPath();
      drawCtx.arc(X(s2.x), Y(s2.y), 5, 0, Math.PI * 2);
      drawCtx.fill();

      drawCtx.strokeStyle = "rgba(255,255,255,0.15)";
      drawCtx.lineWidth = 1;
      drawCtx.beginPath();
      drawCtx.moveTo(X(s1.x), Y(s1.y));
      drawCtx.lineTo(X(s2.x), Y(s2.y));
      drawCtx.stroke();

      drawCtx.save();
      drawCtx.setLineDash([8, 8]);
      drawCtx.strokeStyle = "rgba(245,248,255,0.18)";
      drawCtx.lineWidth = 1;
      drawCtx.beginPath();
      drawCtx.moveTo(X(0), Y(0));
      drawCtx.lineTo(X(screenXWorld), Y(0));
      drawCtx.stroke();
      drawCtx.restore();

      drawScreenLine();
      drawScreenBrightness();
    }

    function drawSingleSlit(phaseOffset: number) {
      const bx = -2.9;
      const half = slitWidth / 2;
      const diffractionHalfAngle = getDiffractionHalfAngle();
      const angleStart = -diffractionHalfAngle;
      const angleEnd = diffractionHalfAngle;

      drawPlaneWaveLines(world.xMin, bx - 0.12, phaseOffset);
      drawBarrierSingle();

      const samples = 9;
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const y = -half + t * slitWidth;

        drawCircularWavefronts(
          { x: bx + 0.02, y },
          phaseOffset,
          11.5,
          angleStart,
          angleEnd,
          0.72
        );
      }

      drawScreenLine();
      drawScreenBrightness();
    }

    function drawDoubleSlit(phaseOffset: number) {
      const bx = -2.9;
      const c1 = -separation / 2;
      const c2 = separation / 2;
      const half = slitWidth / 2;
      const diffractionHalfAngle = getDiffractionHalfAngle();
      const angleStart = -diffractionHalfAngle;
      const angleEnd = diffractionHalfAngle;

      drawPlaneWaveLines(world.xMin, bx - 0.12, phaseOffset);
      drawBarrierDouble();

      const samples = 7;
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const y1 = c1 - half + t * slitWidth;
        const y2 = c2 - half + t * slitWidth;

        drawCircularWavefronts(
          { x: bx + 0.02, y: y1 },
          phaseOffset,
          11.5,
          angleStart,
          angleEnd,
          0.68
        );

        drawCircularWavefronts(
          { x: bx + 0.02, y: y2 },
          phaseOffset,
          11.5,
          angleStart,
          angleEnd,
          0.68
        );
      }

      drawScreenLine();
      drawScreenBrightness();
    }

    function drawGraph() {
      const w = graphCtx.canvas.width;
      const h = graphCtx.canvas.height;

      graphCtx.clearRect(0, 0, w, h);
      graphCtx.fillStyle = "rgba(5,8,20,0.92)";
      graphCtx.fillRect(0, 0, w, h);

      graphCtx.strokeStyle = "rgba(255,255,255,0.08)";
      graphCtx.lineWidth = 1;

      for (let i = 1; i < 5; i++) {
        const y = (h * i) / 5;
        graphCtx.beginPath();
        graphCtx.moveTo(0, y);
        graphCtx.lineTo(w, y);
        graphCtx.stroke();
      }

      for (let i = 1; i < 6; i++) {
        const x = (w * i) / 6;
        graphCtx.beginPath();
        graphCtx.moveTo(x, 0);
        graphCtx.lineTo(x, h);
        graphCtx.stroke();
      }

      const intensities: number[] = [];

      for (let i = 0; i < w; i++) {
        let I = 0;

        if (mode === "two") {
          const y =
            world.yMax - (i / (w - 1)) * (world.yMax - world.yMin);
          I = twoSourceIntensityAtScreenY(y);
        } else {
          const s =
            world.yMax - (i / (w - 1)) * (world.yMax - world.yMin);
          const sinTheta = sinThetaFromScreenCoord(s);

          if (mode === "single") {
            const beta = (Math.PI * slitWidth * sinTheta) / wavelength;
            I = sinc(beta) ** 2;
          } else {
            const beta = (Math.PI * slitWidth * sinTheta) / wavelength;
            const alpha = (Math.PI * separation * sinTheta) / wavelength;
            I = Math.cos(alpha) ** 2 * sinc(beta) ** 2;
          }
        }

        intensities.push(clamp(I, 0, 1));
      }

      graphCtx.strokeStyle = "rgba(235,240,255,0.88)";
      graphCtx.lineWidth = 2.1;
      graphCtx.beginPath();

      intensities.forEach((I, i) => {
        const x = (i / (w - 1)) * w;
        const y = h - I * (h - 18) - 10;
        if (i === 0) graphCtx.moveTo(x, y);
        else graphCtx.lineTo(x, y);
      });

      graphCtx.stroke();

      graphCtx.fillStyle = "rgba(255,255,255,0.72)";
      graphCtx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
      graphCtx.fillText("intensity", 10, 16);
    }

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const speed = playing ? 1 : 0;
      const phaseOffset = t * speed * 1.45;

      drawBackground();

      if (mode === "two") drawTwoSources(phaseOffset);
      if (mode === "single") drawSingleSlit(phaseOffset);
      if (mode === "double") drawDoubleSlit(phaseOffset);

      drawGraph();
      raf = requestAnimationFrame(draw);
    };

    drawGraph();
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, [mode, playing, separation, slitWidth, wavelength]);

  const keyIdea = useMemo(() => {
    if (mode === "two") {
      return "This treats the points as sources of sine waves. For each point on the screen (right hand side of the diagram), the code finds the distances r₁ and r₂ from the two sources, works out the difference Δr = r₁ - r₂, then uses I = cos²(πΔr / λ) to get the relative intensity. (I do not know where this equation comes from - outsourced from wikipedia.) Bright and dark patches are then determined simply by assessing the value of the difference (positive integers end up being bright regions). I do not know how this works, but I know that it does work. I wanted to get this page done as fast as possible (been working on it for a week)";
    }
    if (mode === "single") {
      return "This mode uses the single-slit result I = sinc²(β), where β = πa sinθ / λ, with a as slit width. The equations for this are very accessible online. If you search up 'single-slit diffraction diagrams' you can find asinθ = nλ explanations which work wonderfully to show why diffraction is neatest and most noticable when a=λ and also how minima fringes disappear when the slit gap becomes smaller than the wavelength. Genuinely some really interesting stuff to look at.";
    }
    return "This calculates the intensity using I = cos²(α)sinc²(β), (Fraunhofer equation) where α = πd sinθ / λ sets the interference fringes from slit separation d, and β = πa sinθ / λ sets the diffraction envelope from slit width a. These are textbook definitions that I just placed into the code. For the record I do not understand them as of coding this - if there is anything wrong with them contact me immediately please.";
  }, [mode]);

  return (
    <main className="page">
      <Link href="/topics/waves" className="backLink">
        ← Back to Waves
      </Link>

      <section
        className="card topicHeader"
        style={{
          paddingTop: 18,
          paddingBottom: 18,
          minHeight: 0,
          display: "block",
        }}
      >
        <h1
          className="topicHeaderTitle"
          style={{ marginBottom: 8 }}
        >
          Interference &amp; Diffraction
        </h1>
        <p
          className="topicHeaderSub"
          style={{ margin: 0 }}
        >
          I always struggled to understand waves, so I modelled them here to the
          best of my ability. This page is primarily based on classical wave
          equations I found on the double-slit experiment wikipedia page.
        </p>
      </section>

      <div className="topicGrid">
        <section className="stack">
          <div
            className="card cardStrong"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            {[
              { key: "two", label: "Two Sources" },
              { key: "single", label: "Single Slit" },
              { key: "double", label: "Double Slit" },
            ].map((tab) => {
              const active = mode === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setMode(tab.key as Mode)}
                  style={{
                    border: active
                      ? "1px solid rgba(125,211,252,0.45)"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: active
                      ? "rgba(125,211,252,0.10)"
                      : "rgba(255,255,255,0.04)",
                    color: "var(--text)",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="card cardStrong canvasCard">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                borderRadius: 16,
              }}
            />
          </div>

          <div
            className="card cardStrong microWindow"
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="graphHeader">
              <h2 className="h2">Screen reading</h2>
              <div className="graphHint">{graphHint}</div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
              }}
            >
              <canvas
                ref={graphRef}
                width={900}
                height={220}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  borderRadius: 14,
                }}
              />
            </div>
          </div>
        </section>

        <aside className="stickyCol stack">
          <div className="card cardStrong">
            <h2 className="h2">{modeTitle}</h2>
            <p className="heroText" style={{ marginTop: 8 }}>
              {modeBlurb}
            </p>
          </div>

          <div className="card cardStrong">
            <h2 className="sectionTitle">Controls</h2>

            <div className="control">
              <div className="controlLabel">
                Wavelength: {format(wavelength, 2)}
              </div>
              <div className="controlRow">
                <input
                  className="range"
                  type="range"
                  min={0.4}
                  max={1.6}
                  step={0.01}
                  value={wavelength}
                  onChange={(e) => setWavelength(Number(e.target.value))}
                />
              </div>
            </div>

            {(mode === "two" || mode === "double") && (
              <div className="control">
                <div className="controlLabel">
                  Separation: {format(separation, 2)}
                </div>
                <div className="controlRow">
                  <input
                    className="range"
                    type="range"
                    min={0.8}
                    max={3.4}
                    step={0.01}
                    value={separation}
                    onChange={(e) => setSeparation(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {(mode === "single" || mode === "double") && (
              <div className="control">
                <div className="controlLabel">
                  Slit width: {format(slitWidth, 2)}
                </div>
                <div className="controlRow">
                  <input
                    className="range"
                    type="range"
                    min={0.25}
                    max={1.6}
                    step={0.01}
                    value={slitWidth}
                    onChange={(e) => setSlitWidth(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {(mode === "single" || mode === "double") && (
              <div className="row" style={{ marginTop: 6 }}>
                <span className="rowLabel">Diffraction ratio λ/a</span>
                <span className="rowValue">{format(diffractionRatio, 2)}</span>
              </div>
            )}

            <div className="divider" />

            <div className="row">
              <span className="rowLabel">Animation</span>
              <button
                onClick={() => setPlaying((p) => !p)}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text)",
                  borderRadius: 12,
                  padding: "8px 12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {playing ? "Pause" : "Play"}
              </button>
            </div>
          </div>

          <div className="card cardStrong">
            <h2 className="sectionTitle">Key idea</h2>

            <div className="row">
              <span className="rowLabel">Mode</span>
              <span className="rowValue">{modeTitle}</span>
            </div>

            <div className="divider" />

            <p className="para">{keyIdea}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}