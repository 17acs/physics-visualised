"use client";

import React, { useEffect, useRef, useState } from "react";
import "./rutherford.css";

export default function RutherfordDiagram() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  async function toggleFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Make viewBox roomy so even "slice" doesn't cut important labels
  const W = 1200;
  const H = 700;

  const foilX = 660;
  const nucleusX = foilX + 12;
  const nucleusY = 360;

  // styling helpers for readable text
  const textStyle: React.CSSProperties = {
    paintOrder: "stroke",
    stroke: "rgba(0,0,0,0.55)",
    strokeWidth: 3,
    strokeLinejoin: "round",
  };

  return (
    <div ref={wrapRef} className="ruthDiagramWrap">
      <div className="ruthDiagramTop">
        <div className="ruthDiagramTitle">the setup</div>
        <button className="ruthBtn" onClick={toggleFullscreen}>
          {isFs ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>

      <div className="ruthSvgBox">
        <svg
          className="ruthSvg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(242,245,255,0.65)" />
            </marker>

            <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.0" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="soft" x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="6.0" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="foilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.16)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
            </linearGradient>
          </defs>

          {/* subtle grid */}
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 110 + i * 90;
            return <line key={"gx" + i} x1={x} y1={90} x2={x} y2={H - 90} stroke="white" strokeOpacity="0.05" />;
          })}
          {Array.from({ length: 7 }).map((_, i) => {
            const y = 120 + i * 80;
            return <line key={"gy" + i} x1={90} y1={y} x2={W - 90} y2={y} stroke="white" strokeOpacity="0.05" />;
          })}

          {/* labels */}
          <g style={textStyle}>
            <text x={110} y={150} fill="rgba(242,245,255,0.78)" fontSize="18">
              α source / collimator
            </text>
          </g>

          {/* incident beam */}
          {[0, 24, -24].map((dy, i) => (
            <path
              key={i}
              d={`M 140 ${nucleusY + dy} L ${foilX - 30} ${nucleusY + dy}`}
              stroke="rgba(125,211,252,0.65)"
              strokeWidth="9"
              markerEnd="url(#arrow)"
              strokeLinecap="round"
            />
          ))}

          {/* foil */}
          <rect
            x={foilX - 8}
            y={160}
            width={16}
            height={400}
            rx={10}
            fill="url(#foilGrad)"
            stroke="rgba(255,255,255,0.30)"
          />
          <g style={textStyle}>
            <text x={foilX - 48} y={150} fill="rgba(242,245,255,0.78)" fontSize="18">
              thin foil
            </text>
          </g>

          {/* nucleus */}
          <circle cx={nucleusX} cy={nucleusY} r={14} fill="rgba(239,68,68,0.95)" filter="url(#glow)" />
          <circle cx={nucleusX} cy={nucleusY} r={28} fill="rgba(239,68,68,0.12)" filter="url(#soft)" />
          <g style={textStyle}>
            <text x={nucleusX + 20} y={nucleusY - 12} fill="rgba(242,245,255,0.78)" fontSize="18">
              nucleus
            </text>
          </g>

          {/* forward scattered */}
          {[14, -12, 30, -26].map((dy, i) => (
            <path
              key={"f" + i}
              d={`M ${foilX + 10} ${nucleusY} C ${foilX + 180} ${nucleusY + dy} ${foilX + 380} ${
                nucleusY + dy
              } ${foilX + 560} ${nucleusY + dy}`}
              stroke="rgba(125,211,252,0.52)"
              strokeWidth="8"
              markerEnd="url(#arrow)"
              fill="none"
              strokeLinecap="round"
            />
          ))}

          {/* large angles */}
          <path
            d={`M ${foilX + 10} ${nucleusY} C ${foilX + 170} ${nucleusY - 130} ${foilX + 290} ${nucleusY - 240} ${
              foilX + 420
            } ${nucleusY - 340}`}
            stroke="rgba(167,139,250,0.72)"
            strokeWidth="9"
            markerEnd="url(#arrow)"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${foilX + 10} ${nucleusY} C ${foilX + 170} ${nucleusY + 130} ${foilX + 290} ${nucleusY + 240} ${
              foilX + 420
            } ${nucleusY + 340}`}
            stroke="rgba(167,139,250,0.72)"
            strokeWidth="9"
            markerEnd="url(#arrow)"
            fill="none"
            strokeLinecap="round"
          />

          {/* backscatter */}
          <path
            d={`M ${foilX + 10} ${nucleusY} C ${foilX - 90} ${nucleusY - 55} ${foilX - 220} ${nucleusY - 80} 300 ${
              nucleusY - 110
            }`}
            stroke="rgba(252,211,77,0.88)"
            strokeWidth="11"
            markerEnd="url(#arrow)"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          <g style={textStyle}>
            <text x={300} y={nucleusY - 155} fill="rgba(242,245,255,0.78)" fontSize="18">
              rare back-scatter
            </text>
          </g>

          {/* ZnS screen */}
          <path
            d={`M ${W - 240} 185 A 280 280 0 0 1 ${W - 240} 525`}
            stroke="rgba(242,245,255,0.22)"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
          />
          <g style={textStyle}>
            <text x={W - 380} y={175} fill="rgba(242,245,255,0.78)" fontSize="18">
              Zinc Sulphide screen
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
