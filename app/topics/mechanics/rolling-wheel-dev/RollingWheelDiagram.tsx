"use client";

import React, { useEffect, useRef, useState } from "react";

type Vector2 = { x: number; y: number };
type PointName = "Top point" | "Centre point" | "Bottom point";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}
function sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}
function mul(a: Vector2, k: number): Vector2 {
  return { x: a.x * k, y: a.y * k };
}
function magnitude(v: Vector2) {
  return Math.hypot(v.x, v.y);
}
function normalize(v: Vector2): Vector2 {
  const m = magnitude(v);
  if (m < 1e-9) return { x: 0, y: 0 };
  return { x: v.x / m, y: v.y / m };
}
function formatNumber(value: number, decimals = 2) {
  return value.toFixed(decimals);
}
function getDevicePixelRatio() {
  return typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
}

/**
 * Velocity due to rotation about the centre:
 * v = angularSpeed × (k̂ × r), where k̂ × (rx, ry) = (-ry, rx)
 */
function velocityDueToRotationAboutCentre(angularSpeedRadiansPerSecond: number, radiusVector: Vector2): Vector2 {
  return {
    x: -angularSpeedRadiansPerSecond * radiusVector.y,
    y: angularSpeedRadiansPerSecond * radiusVector.x,
  };
}

// Compresses growth: approximately linear at small values, saturates at high values.
// linearAt: where compression becomes noticeable
// maxDisplay: maximum output value
function compressSpeed(value: number, linearAt: number, maxDisplay: number) {
  const v = Math.max(0, value);
  return maxDisplay * (1 - Math.exp(-v / Math.max(1e-6, linearAt)));
}

// Compress a vector magnitude but keep direction.
function compressVector(vec: Vector2, linearAt: number, maxDisplay: number): Vector2 {
  const L = magnitude(vec);
  if (L < 1e-9) return { x: 0, y: 0 };
  const newL = compressSpeed(L, linearAt, maxDisplay);
  return mul(normalize(vec), newL);
}

function drawArrow(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2, lineWidth: number) {
  const dir = sub(end, start);
  const L = magnitude(dir);
  if (L < 1e-6) return;

  const unit = normalize(dir);

  const headLength = Math.min(14, Math.max(8, L * 0.22));
  const headWidth = headLength * 0.65;

  const base = sub(end, mul(unit, headLength));
  const left = { x: base.x + (-unit.y) * headWidth, y: base.y + unit.x * headWidth };
  const right = { x: base.x - (-unit.y) * headWidth, y: base.y - unit.x * headWidth };

  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.fill();
}

function drawCircle(ctx: CanvasRenderingContext2D, centre: Vector2, radius: number) {
  ctx.beginPath();
  ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}
function drawFilledCircle(ctx: CanvasRenderingContext2D, centre: Vector2, radius: number) {
  ctx.beginPath();
  ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export default function RollingWheelDiagram() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // =========================================================
  // VISUAL SCALES (decoupled + non-linear compression)
  // =========================================================
  const sizePixelsPerMetre = 90; // wheel size

  const motionPixelsPerMetre = 22; // wheel translation on screen
  const motionCompressLinearAt = 6; // m/s
  const motionCompressMaxDisplay = 8.5; // max visual m/s

  const arrowPixelsPerMetrePerSecond = 10; // arrow length per (display m/s)
  const arrowCompressLinearAt = 6; // m/s
  const arrowCompressMaxDisplay = 10; // max visual m/s for arrows

  // =========================================================
  // Controls (SI)
  // =========================================================
  const [wheelRadiusMetres, setWheelRadiusMetres] = useState(0.7);
  const [centreSpeedMetresPerSecond, setCentreSpeedMetresPerSecond] = useState(5);

  const [useNoSlippingConstraint, setUseNoSlippingConstraint] = useState(true);
  const [angularSpeedRadiansPerSecond, setAngularSpeedRadiansPerSecond] = useState(
    centreSpeedMetresPerSecond / Math.max(0.05, wheelRadiusMetres)
  );

  const [isPaused, setIsPaused] = useState(false);

  const [showCentreVelocity, setShowCentreVelocity] = useState(true);
  const [showVelocityDueToRotation, setShowVelocityDueToRotation] = useState(true);
  const [showResultantVelocity, setShowResultantVelocity] = useState(true);
  const [showTraces, setShowTraces] = useState(true);

  // DOM readout
  const [readout, setReadout] = useState({
    angularSpeed: 0,
    topSpeed: 0,
    centreSpeed: 0,
    bottomSpeed: 0,
  });

  const simulationRef = useRef({
    angleRadians: 0, // continuous
    distanceMetres: 0, // physical distance (kept for reference)
    visualDistanceMetres: 0, // used for on-screen position (compressed speed)
    lastWrappedMetres: 0,
    trace: {
      "Top point": [] as Vector2[],
      "Centre point": [] as Vector2[],
      "Bottom point": [] as Vector2[],
    } as Record<PointName, Vector2[]>,
    lastReadoutUpdateTimeMs: 0,
  });

  useEffect(() => {
    if (useNoSlippingConstraint) {
      setAngularSpeedRadiansPerSecond(centreSpeedMetresPerSecond / Math.max(0.05, wheelRadiusMetres));
    }
  }, [useNoSlippingConstraint, centreSpeedMetresPerSecond, wheelRadiusMetres]);

  function angularSpeedUsedRadiansPerSecond() {
    return useNoSlippingConstraint
      ? centreSpeedMetresPerSecond / Math.max(0.05, wheelRadiusMetres)
      : angularSpeedRadiansPerSecond;
  }

  function resetSimulation() {
    const s = simulationRef.current;
    s.angleRadians = 0;
    s.distanceMetres = 0;
    s.visualDistanceMetres = 0;
    s.lastWrappedMetres = 0;
    s.trace = { "Top point": [], "Centre point": [], "Bottom point": [] };
  }

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const area = areaRef.current;
    if (!canvas || !area) return;

    const resize = () => {
      const rect = area.getBoundingClientRect();
      const dpr = getDevicePixelRatio();

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const area = areaRef.current;
    if (!canvas || !area) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const deltaSeconds = clamp((timestamp - lastTimestamp) / 1000, 0, 0.033);
      lastTimestamp = timestamp;

      if (!isPaused) simulate(deltaSeconds);
      draw(ctx, timestamp);

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isPaused,
    wheelRadiusMetres,
    centreSpeedMetresPerSecond,
    angularSpeedRadiansPerSecond,
    useNoSlippingConstraint,
    showCentreVelocity,
    showVelocityDueToRotation,
    showResultantVelocity,
    showTraces,
  ]);

  function simulate(deltaSeconds: number) {
    const s = simulationRef.current;

    // physical distance (not used for the wrap)
    s.distanceMetres += centreSpeedMetresPerSecond * deltaSeconds;

    // compressed "display speed" for translation
    const displayCentreSpeed = compressSpeed(centreSpeedMetresPerSecond, motionCompressLinearAt, motionCompressMaxDisplay);
    s.visualDistanceMetres += displayCentreSpeed * deltaSeconds;

    // keep rolling visually consistent with the on-screen translation
    const radiusSafe = Math.max(0.05, wheelRadiusMetres);

    const displayAngularSpeed = useNoSlippingConstraint
      ? displayCentreSpeed / radiusSafe
      : compressSpeed(angularSpeedUsedRadiansPerSecond(), motionCompressLinearAt, 10);

    s.angleRadians += -displayAngularSpeed * deltaSeconds;
  }

  function trackGeometry(canvasWidth: number) {
    const wheelRadiusPixels = wheelRadiusMetres * sizePixelsPerMetre;

    const leftPaddingPixels = 28 + wheelRadiusPixels;
    const rightPaddingPixels = 28 + wheelRadiusPixels;

    const trackLengthPixels = Math.max(1, canvasWidth - leftPaddingPixels - rightPaddingPixels);

    // track length in "visual metres" for wrapping (consistent with motionPixelsPerMetre)
    const trackLengthMetres = trackLengthPixels / motionPixelsPerMetre;

    return { wheelRadiusPixels, leftPaddingPixels, rightPaddingPixels, trackLengthPixels, trackLengthMetres };
  }

  function wheelCentrePixels(canvasWidth: number, canvasHeight: number) {
    const geometry = trackGeometry(canvasWidth);
    const s = simulationRef.current;

    const groundLineY = canvasHeight * 0.60;

    const wrappedMetres =
      geometry.trackLengthMetres <= 0
        ? 0
        : ((s.visualDistanceMetres % geometry.trackLengthMetres) + geometry.trackLengthMetres) % geometry.trackLengthMetres;

    const x = geometry.leftPaddingPixels + wrappedMetres * motionPixelsPerMetre;
    const y = groundLineY - geometry.wheelRadiusPixels;

    return { centre: { x, y } as Vector2, wrappedMetres, geometry };
  }

  function pointWorldPosition(centre: Vector2, wheelRadiusPixels: number, wheelAngleRadians: number, point: PointName): Vector2 {
    const local =
      point === "Top point"
        ? ({ x: 0, y: -wheelRadiusPixels } as Vector2)
        : point === "Bottom point"
        ? ({ x: 0, y: wheelRadiusPixels } as Vector2)
        : ({ x: 0, y: 0 } as Vector2);

    const c = Math.cos(wheelAngleRadians);
    const s = Math.sin(wheelAngleRadians);

    const rotated: Vector2 = {
      x: local.x * c - local.y * s,
      y: local.x * s + local.y * c,
    };

    return add(centre, rotated);
  }

  // SI velocities (m/s), for correct readout + compressed arrow visuals
  function velocitiesAtPointSI(wheelAngleRadians: number, point: PointName) {
    const centreVelocityMetresPerSecond: Vector2 = { x: centreSpeedMetresPerSecond, y: 0 };

    const localMetres =
      point === "Top point"
        ? ({ x: 0, y: -wheelRadiusMetres } as Vector2)
        : point === "Bottom point"
        ? ({ x: 0, y: wheelRadiusMetres } as Vector2)
        : ({ x: 0, y: 0 } as Vector2);

    const c = Math.cos(wheelAngleRadians);
    const s = Math.sin(wheelAngleRadians);

    const radiusVectorWorldMetres: Vector2 = {
      x: localMetres.x * c - localMetres.y * s,
      y: localMetres.x * s + localMetres.y * c,
    };

    const angularVelocityRadiansPerSecond = -angularSpeedUsedRadiansPerSecond();

    const velocityDueToRotationMetresPerSecond = velocityDueToRotationAboutCentre(
      angularVelocityRadiansPerSecond,
      radiusVectorWorldMetres
    );

    const resultantMetresPerSecond = add(centreVelocityMetresPerSecond, velocityDueToRotationMetresPerSecond);

    return {
      centreVelocityMetresPerSecond,
      velocityDueToRotationMetresPerSecond,
      resultantMetresPerSecond,
      resultantSpeedMetresPerSecond: magnitude(resultantMetresPerSecond),
    };
  }

  function arrowVectorFromMetresPerSecond(vecMetresPerSecond: Vector2): Vector2 {
    const displayVec = compressVector(vecMetresPerSecond, arrowCompressLinearAt, arrowCompressMaxDisplay);
    return mul(displayVec, arrowPixelsPerMetrePerSecond);
  }

  function clearTracesOnTeleport(wrappedMetres: number, trackLengthMetres: number) {
    const s = simulationRef.current;
    const previousWrapped = s.lastWrappedMetres;

    const teleportThresholdMetres = Math.max(0.02 * trackLengthMetres, 0.05);
    const didTeleport = trackLengthMetres > 0 && wrappedMetres < previousWrapped - teleportThresholdMetres;

    if (didTeleport) {
      s.trace = { "Top point": [], "Centre point": [], "Bottom point": [] };
    }

    s.lastWrappedMetres = wrappedMetres;
  }

  function pushTracePoint(name: PointName, point: Vector2) {
    const s = simulationRef.current;
    s.trace[name].push(point);

    const maxPoints = 900;
    if (s.trace[name].length > maxPoints) s.trace[name].shift();
  }

  function drawTraces(ctx: CanvasRenderingContext2D) {
    const s = simulationRef.current;

    const palette: Record<PointName, string> = {
      "Top point": "rgba(125,211,252,0.55)",
      "Centre point": "rgba(167,139,250,0.45)",
      "Bottom point": "rgba(252,211,77,0.45)",
    };

    ctx.save();
    ctx.lineWidth = 2;

    (Object.keys(s.trace) as PointName[]).forEach((name) => {
      const pts = s.trace[name];
      if (pts.length < 2) return;

      ctx.strokeStyle = palette[name];
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    });

    ctx.restore();
  }

  function draw(ctx: CanvasRenderingContext2D, timestampMs: number) {
    const area = areaRef.current!;
    const rect = area.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const { centre, wrappedMetres, geometry } = wheelCentrePixels(width, height);
    const wheelRadiusPixels = geometry.wheelRadiusPixels;

    if (showTraces) {
      clearTracesOnTeleport(wrappedMetres, geometry.trackLengthMetres);
    } else {
      simulationRef.current.lastWrappedMetres = wrappedMetres;
    }

    const wheelAngleRadians = simulationRef.current.angleRadians;

    // background
    ctx.clearRect(0, 0, width, height);

    // subtle grid
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    const spacing = 32;
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // ground line
    const groundLineY = height * 0.60;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundLineY);
    ctx.lineTo(width, groundLineY);
    ctx.stroke();
    ctx.restore();

    // traces
    if (showTraces) drawTraces(ctx);

    // wheel
    ctx.save();
    ctx.strokeStyle = "rgba(242,245,255,0.92)";
    ctx.lineWidth = 2;
    drawCircle(ctx, centre, wheelRadiusPixels);

    ctx.globalAlpha = 0.60;
    for (let i = 0; i < 8; i++) {
      const ang = wheelAngleRadians + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(centre.x, centre.y);
      ctx.lineTo(centre.x + Math.cos(ang) * wheelRadiusPixels, centre.y + Math.sin(ang) * wheelRadiusPixels);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    drawFilledCircle(ctx, centre, 3.5);
    ctx.restore();

    // points + arrows
    const pointNames: PointName[] = ["Top point", "Centre point", "Bottom point"];

    for (const name of pointNames) {
      const pos = pointWorldPosition(centre, wheelRadiusPixels, wheelAngleRadians, name);
      if (showTraces) pushTracePoint(name, pos);

      const vSI = velocitiesAtPointSI(wheelAngleRadians, name);

      if (showCentreVelocity) {
        const arrowVec = arrowVectorFromMetresPerSecond(vSI.centreVelocityMetresPerSecond);
        ctx.save();
        ctx.strokeStyle = "rgba(125,211,252,0.9)";
        ctx.fillStyle = "rgba(125,211,252,0.9)";
        drawArrow(ctx, pos, add(pos, arrowVec), 2);
        ctx.restore();
      }

      if (showVelocityDueToRotation) {
        const arrowVec = arrowVectorFromMetresPerSecond(vSI.velocityDueToRotationMetresPerSecond);
        ctx.save();
        ctx.strokeStyle = "rgba(167,139,250,0.9)";
        ctx.fillStyle = "rgba(167,139,250,0.9)";
        drawArrow(ctx, pos, add(pos, arrowVec), 2);
        ctx.restore();
      }

      if (showResultantVelocity) {
        const arrowVec = arrowVectorFromMetresPerSecond(vSI.resultantMetresPerSecond);
        ctx.save();
        ctx.strokeStyle = "rgba(252,211,77,0.92)";
        ctx.fillStyle = "rgba(252,211,77,0.92)";
        drawArrow(ctx, pos, add(pos, arrowVec), 2);
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      drawFilledCircle(ctx, pos, 4);
      ctx.restore();
    }

    // readout (not compressed)
    const s = simulationRef.current;
    if (timestampMs - s.lastReadoutUpdateTimeMs > 150) {
      s.lastReadoutUpdateTimeMs = timestampMs;

      const top = velocitiesAtPointSI(wheelAngleRadians, "Top point").resultantSpeedMetresPerSecond;
      const centreSp = velocitiesAtPointSI(wheelAngleRadians, "Centre point").resultantSpeedMetresPerSecond;
      const bottom = velocitiesAtPointSI(wheelAngleRadians, "Bottom point").resultantSpeedMetresPerSecond;

      setReadout({
        angularSpeed: angularSpeedUsedRadiansPerSecond(),
        topSpeed: top,
        centreSpeed: centreSp,
        bottomSpeed: bottom,
      });
    }
  }

  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card cardPad">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="h2" style={{ marginBottom: 6 }}>
              Live values
            </div>
            <div className="monoBlock">
              centre speed = {formatNumber(centreSpeedMetresPerSecond)} m/s
              <br />
              angular speed = {formatNumber(readout.angularSpeed)} rad/s
              <br />
              top point speed (ground) = {formatNumber(readout.topSpeed)} m/s
              <br />
              centre point speed (ground) = {formatNumber(readout.centreSpeed)} m/s
              <br />
              bottom point speed (ground) = {formatNumber(readout.bottomSpeed)} m/s
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="numInput" style={{ width: 120, cursor: "pointer" }} onClick={() => setIsPaused((p) => !p)}>
              {isPaused ? "Play" : "Pause"}
            </button>
            <button className="numInput" style={{ width: 120, cursor: "pointer" }} onClick={resetSimulation}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div ref={areaRef} className="card canvasCard" style={{ height: "clamp(300px, 48vh, 560px)", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        <div className="card cardPad">
          <div className="control">
            <div className="controlLabel">Wheel radius (metres)</div>
            <div className="controlRow">
              <input
                className="range"
                type="range"
                min={0.2}
                max={2.0}
                step={0.01}
                value={wheelRadiusMetres}
                onChange={(e) => setWheelRadiusMetres(parseFloat(e.target.value))}
              />
              <input
                className="numInput"
                type="number"
                min={0.2}
                max={2.0}
                step={0.01}
                value={wheelRadiusMetres}
                onChange={(e) => setWheelRadiusMetres(parseFloat(e.target.value || "0"))}
              />
            </div>
          </div>

          <div className="control">
            <div className="controlLabel">Centre speed (m/s)</div>
            <div className="controlRow">
              <input
                className="range"
                type="range"
                min={0}
                max={20}
                step={0.1}
                value={centreSpeedMetresPerSecond}
                onChange={(e) => setCentreSpeedMetresPerSecond(parseFloat(e.target.value))}
              />
              <input
                className="numInput"
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={centreSpeedMetresPerSecond}
                onChange={(e) => setCentreSpeedMetresPerSecond(parseFloat(e.target.value || "0"))}
              />
            </div>
          </div>

          <div className="control">
            <div className="controlRow" style={{ justifyContent: "flex-start" }}>
              <input type="checkbox" checked={useNoSlippingConstraint} onChange={(e) => setUseNoSlippingConstraint(e.target.checked)} />
              <div className="controlLabel" style={{ margin: 0 }}>
                No slipping (centre speed = angular speed × radius)
              </div>
            </div>
          </div>

          <div className="control" style={{ opacity: useNoSlippingConstraint ? 0.55 : 1 }}>
            <div className="controlLabel">Angular speed (rad/s)</div>
            <div className="controlRow">
              <input
                className="range"
                type="range"
                min={0}
                max={20}
                step={0.01}
                value={angularSpeedRadiansPerSecond}
                onChange={(e) => setAngularSpeedRadiansPerSecond(parseFloat(e.target.value))}
                disabled={useNoSlippingConstraint}
              />
              <input
                className="numInput"
                type="number"
                min={0}
                max={20}
                step={0.01}
                value={angularSpeedRadiansPerSecond}
                onChange={(e) => setAngularSpeedRadiansPerSecond(parseFloat(e.target.value || "0"))}
                disabled={useNoSlippingConstraint}
              />
            </div>
          </div>

          <div className="divider" />

          <div className="stack12" style={{ gap: 10 }}>
            <label className="controlRow" style={{ justifyContent: "flex-start" }}>
              <input type="checkbox" checked={showCentreVelocity} onChange={(e) => setShowCentreVelocity(e.target.checked)} />
              <span>Show centre velocity</span>
            </label>

            <label className="controlRow" style={{ justifyContent: "flex-start" }}>
              <input type="checkbox" checked={showVelocityDueToRotation} onChange={(e) => setShowVelocityDueToRotation(e.target.checked)} />
              <span>Show velocity due to rotation about the centre</span>
            </label>

            <label className="controlRow" style={{ justifyContent: "flex-start" }}>
              <input type="checkbox" checked={showResultantVelocity} onChange={(e) => setShowResultantVelocity(e.target.checked)} />
              <span>Show resultant ground velocity</span>
            </label>

            <label className="controlRow" style={{ justifyContent: "flex-start" }}>
              <input type="checkbox" checked={showTraces} onChange={(e) => setShowTraces(e.target.checked)} />
              <span>Show traces (clears each lap)</span>
            </label>
          </div>

          <div className="divider" />

          <div className="muted" style={{ lineHeight: 1.6 }}>
            Visual motion and arrows are compressed above ~6 m/s so speeds above 8 m/s stay readable instead of exploding on screen.
          </div>
        </div>
      </div>
    </div>
  );
}