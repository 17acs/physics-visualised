"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

type C = { re: number; im: number };
type Tab = "one" | "mul" | "loci" | "proofs";
type LociKind = "circle" | "arg" | "bisector";
type DragTarget = "z" | "w" | "a" | "b";

const TABS: { id: Tab; label: string }[] = [
  { id: "one", label: "Cartesian" },
  { id: "mul", label: "Multiplication and division" },
  { id: "loci", label: "Loci and roots" },
  { id: "proofs", label: "Proofs" },
];

const W = 620;
const H = 620;
const PAD = 44;
const VIEW = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function tidy(n: number) {
  return Math.abs(n) < 1e-9 ? 0 : n;
}

/** At most two decimal places; drop trailing zeros (2.500 → 2.5, 2 → 2). */
function fmtNum(n: number) {
  if (!Number.isFinite(n)) return String(n);
  const rounded = Math.round(n * 100) / 100;
  if (Math.abs(rounded) < 1e-12) return "0";
  const s = rounded
    .toFixed(2)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  return s === "-0" ? "0" : s;
}

function fmtRad(x: number) {
  const pi = Math.PI;
  const tol = 6e-4;
  const table: Array<[number, string]> = [
    [-pi, "−π"],
    [-pi / 2, "−π/2"],
    [-pi / 3, "−π/3"],
    [-pi / 4, "−π/4"],
    [-pi / 6, "−π/6"],
    [0, "0"],
    [pi / 6, "π/6"],
    [pi / 4, "π/4"],
    [pi / 3, "π/3"],
    [pi / 2, "π/2"],
    [pi, "π"],
  ];
  for (const [v, s] of table) if (Math.abs(x - v) < tol) return s;
  return fmtNum(x);
}

function mod(z: C) {
  return Math.hypot(z.re, z.im);
}

function principalArg(z: C) {
  if (z.re === 0 && z.im === 0) return 0;
  return Math.atan2(z.im, z.re);
}

function fromPolar(r: number, theta: number): C {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
}

function add(a: C, b: C): C {
  return { re: a.re + b.re, im: a.im + b.im };
}

function sub(a: C, b: C): C {
  return { re: a.re - b.re, im: a.im - b.im };
}

function mul(a: C, b: C): C {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function div(a: C, b: C): C | null {
  const d = b.re * b.re + b.im * b.im;
  if (d < 1e-14) return null;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
}

function fmtImUnit(posCoeff: number) {
  const c = Math.abs(posCoeff);
  if (Math.abs(c - 1) < 1e-9) return "i";
  return `${fmtNum(c)}i`;
}

function fmtComplex(z: C) {
  const x = tidy(z.re);
  const y = tidy(z.im);
  if (y === 0) return `${fmtNum(x)}`;
  if (x === 0) {
    if (Math.abs(y - 1) < 1e-9) return "i";
    if (Math.abs(y + 1) < 1e-9) return "−i";
    return `${fmtNum(y)}i`;
  }
  const sign = y >= 0 ? "+" : "−";
  return `${fmtNum(x)} ${sign} ${fmtImUnit(y)}`;
}

/** z − a expanded without brackets, e.g. a = 2 + i → z − 2 − i */
function fmtZMinusA(a: C) {
  const x = tidy(a.re);
  const y = tidy(a.im);
  let s = "z";
  if (x > 0) s += ` − ${fmtNum(x)}`;
  else if (x < 0) s += ` + ${fmtNum(Math.abs(x))}`;
  if (y > 0) s += ` − ${fmtImUnit(y)}`;
  else if (y < 0) s += ` + ${fmtImUnit(y)}`;
  return s;
}

function nearInt(n: number) {
  return Math.abs(n - Math.round(n)) < 1e-6;
}

function simplifyRadical(n: number): string {
  if (n < 0 || !Number.isFinite(n)) return fmtNum(Math.sqrt(n));
  const N = Math.round(n);
  if (Math.abs(n - N) > 1e-6) return fmtNum(Math.sqrt(n));
  if (N === 0) return "0";
  if (N === 1) return "1";

  let rem = N;
  let coef = 1;
  for (let p = 2; p * p <= rem; p++) {
    while (rem % (p * p) === 0) {
      coef *= p;
      rem /= p * p;
    }
  }
  if (coef === 1) return `√${rem}`;
  if (rem === 1) return String(coef);
  return `${coef}√${rem}`;
}

/** |z| in simplest form (√n, k√n, or integer) when x and y are integers. */
function fmtModulus(z: C) {
  if (nearInt(z.re) && nearInt(z.im)) {
    const x = Math.round(z.re);
    const y = Math.round(z.im);
    return simplifyRadical(x * x + y * y);
  }
  return fmtNum(mod(z));
}

function fmtModArg(z: C) {
  if (mod(z) < 1e-12) return "0";
  const theta = principalArg(z);
  const t = fmtRad(theta);
  return `${fmtModulus(z)}(cos(${t}) + isin(${t}))`;
}

function toSvgX(x: number) {
  const { xMin, xMax } = VIEW;
  return PAD + ((x - xMin) / (xMax - xMin)) * (W - 2 * PAD);
}

function toSvgY(y: number) {
  const { yMin, yMax } = VIEW;
  return H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD);
}

function fromSvg(px: number, py: number): C {
  const { xMin, xMax, yMin, yMax } = VIEW;
  const re = xMin + ((px - PAD) / (W - 2 * PAD)) * (xMax - xMin);
  const im = yMax - ((py - PAD) / (H - 2 * PAD)) * (yMax - yMin);
  return { re: clamp(re, xMin, xMax), im: clamp(im, yMin, yMax) };
}

function clientToComplex(svg: SVGSVGElement | null, clientX: number, clientY: number): C | null {
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  const u = (clientX - rect.left) / rect.width;
  const v = (clientY - rect.top) / rect.height;
  const px = u * W;
  const py = v * H;
  return snapComplex(fromSvg(px, py));
}

const SNAP_TOL = 0.22;

function snapAxis(n: number, min: number, max: number) {
  const nearest = clamp(Math.round(n), min, max);
  return Math.abs(n - nearest) <= SNAP_TOL ? nearest : n;
}

function snapComplex(c: C): C {
  const { xMin, xMax, yMin, yMax } = VIEW;
  return {
    re: snapAxis(c.re, xMin, xMax),
    im: snapAxis(c.im, yMin, yMax),
  };
}

export default function ArgandDiagramPage() {
  const [tab, setTab] = useState<Tab>("one");
  const [z, setZ] = useState<C>({ re: 2, im: 1.5 });
  const [a, setA] = useState<C>({ re: 1, im: 0.5 });
  const [b, setB] = useState<C>({ re: -2, im: 1 });
  const [wMod, setWMod] = useState(1);
  const [wArg, setWArg] = useState(Math.PI / 2);
  const [lociKind, setLociKind] = useState<LociKind>("circle");
  const [radius, setRadius] = useState(2);
  const [lociArg, setLociArg] = useState(Math.PI / 4);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragTarget = useRef<DragTarget | null>(null);

  const w = useMemo((): C => fromPolar(wMod, wArg), [wMod, wArg]);

  const zw = useMemo(() => mul(z, w), [z, w]);
  const zOverW = useMemo(() => div(z, w), [z, w]);

  const argZ = principalArg(z);

  const onPointerDown = useCallback(
    (target: DragTarget) => (e: React.PointerEvent) => {
      dragTarget.current = target;
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTarget.current) return;
    const c = clientToComplex(svgRef.current, e.clientX, e.clientY);
    if (!c) return;
    if (dragTarget.current === "z") setZ(c);
    else if (dragTarget.current === "a") setA(c);
    else if (dragTarget.current === "b") setB(c);
    else if (dragTarget.current === "w") {
      setWMod(mod(c));
      setWArg(principalArg(c));
    }
  }, []);

  const onPointerUp = useCallback(() => {
    dragTarget.current = null;
  }, []);

  const axisX = toSvgX(0);
  const axisY = toSvgY(0);

  const gridStep = 1;
  const gridLines: number[] = [];
  for (let k = VIEW.xMin; k <= VIEW.xMax; k += gridStep) gridLines.push(k);

  const showMul = tab === "mul";
  const showLoci = tab === "loci";
  const showDiagram = tab !== "proofs";

  const lociEquation = useMemo(() => {
    if (lociKind === "circle") return `|${fmtZMinusA(a)}| = ${fmtNum(radius)}`;
    if (lociKind === "arg") return `arg(${fmtZMinusA(a)}) = ${fmtRad(lociArg)}`;
    return `|${fmtZMinusA(a)}| = |${fmtZMinusA(b)}|`;
  }, [lociKind, radius, lociArg, a, b]);

  return (
    <main className="page" style={{ maxWidth: 1400 }}>
      <a href="/topics/mathematics" className="backLink">
        ← Back to Mathematics
      </a>

      <div className="stack12" style={{ marginTop: 12 }}>
        <h1 className="topicHeaderTitle" style={{ margin: 0 }}>
          Argand diagram
        </h1>
      </div>

      <div className="topicGrid" style={{ ["--aside" as string]: "520px" }}>
        <div style={{ minWidth: 0 }}>
          <div className="card cardStrong" style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: 8,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
              }}
            >
              {TABS.map(({ id, label }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    aria-pressed={active}
                    style={{
                      flex: "0 0 auto",
                      border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: active ? "rgba(125,211,252,0.14)" : "rgba(255,255,255,0.05)",
                      color: "var(--text)",
                      borderRadius: 999,
                      padding: "8px 12px",
                      cursor: "pointer",
                      font: "inherit",
                      fontSize: 14,
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "loci" && (
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <div className="card cardStrong">
                <div className="controlLabel">Locus</div>
                <select
                  className="numInput"
                  value={lociKind}
                  onChange={(e) => setLociKind(e.target.value as LociKind)}
                  style={{ width: "100%" }}
                >
                  <option value="circle">|z − a| = r (circle)</option>
                  <option value="arg">arg(z − a) = θ (half-line)</option>
                  <option value="bisector">|z − a| = |z − b| (perpendicular bisector)</option>
                </select>
              </div>
              {lociKind === "circle" && (
                <Slider label="r" value={radius} min={0.3} max={4} step={0.05} onChange={setRadius} />
              )}
              {lociKind === "arg" && (
                <Slider
                  label="θ"
                  value={lociArg}
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.01}
                  onChange={setLociArg}
                  note={fmtRad(lociArg)}
                />
              )}
            </div>
          )}

          {showDiagram && (
            <div className="card cardStrong" style={{ marginTop: 18, minWidth: 0 }}>
              <div className="graphHeader">
                <div style={{ fontWeight: 900 }}>Complex plane</div>
              </div>
              <div className="graphBox" style={{ ["--ratio" as string]: `${W}/${H}` }}>
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="xMidYMid meet"
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  style={{ touchAction: "none", cursor: dragTarget.current ? "grabbing" : "default" }}
                >
                  <defs>
                    <marker
                      id="argand-arrow"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth={6}
                      markerHeight={6}
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
                    </marker>
                  </defs>
                  {gridLines.map((g) => (
                    <g key={`g-${g}`}>
                      <line
                        x1={toSvgX(g)}
                        y1={PAD}
                        x2={toSvgX(g)}
                        y2={H - PAD}
                        stroke="white"
                        strokeOpacity={g === 0 ? 0 : 0.06}
                      />
                      <line
                        x1={PAD}
                        y1={toSvgY(g)}
                        x2={W - PAD}
                        y2={toSvgY(g)}
                        stroke="white"
                        strokeOpacity={g === 0 ? 0 : 0.06}
                      />
                    </g>
                  ))}

                  <line x1={PAD} y1={axisY} x2={W - PAD} y2={axisY} stroke="white" strokeOpacity={0.35} />
                  <line x1={axisX} y1={PAD} x2={axisX} y2={H - PAD} stroke="white" strokeOpacity={0.35} />

                  {gridLines.map((g) => {
                    const tickFill = "rgba(242,245,255,0.65)";
                    const imLabel = g === 0 ? "0" : `${g}i`;
                    return (
                      <g key={`axis-tick-${g}`}>
                        <line
                          x1={toSvgX(g)}
                          y1={axisY - 4}
                          x2={toSvgX(g)}
                          y2={axisY + 4}
                          stroke="white"
                          strokeOpacity={0.35}
                        />
                        <text
                          x={toSvgX(g)}
                          y={axisY + 18}
                          textAnchor="middle"
                          fontSize={12}
                          fill={tickFill}
                        >
                          {g}
                        </text>
                        <line
                          x1={axisX - 4}
                          y1={toSvgY(g)}
                          x2={axisX + 4}
                          y2={toSvgY(g)}
                          stroke="white"
                          strokeOpacity={0.35}
                        />
                        <text x={axisX - 10} y={toSvgY(g) + 4} textAnchor="end" fontSize={12} fill={tickFill}>
                          {imLabel}
                        </text>
                      </g>
                    );
                  })}

                  <text
                    x={W - PAD + 4}
                    y={axisY + 5}
                    textAnchor="start"
                    fontSize={13}
                    fontWeight={700}
                    fill="rgba(242,245,255,0.85)"
                  >
                    Re
                  </text>
                  <text
                    x={axisX + 8}
                    y={PAD - 8}
                    textAnchor="start"
                    fontSize={13}
                    fontWeight={700}
                    fill="rgba(242,245,255,0.85)"
                  >
                    Im
                  </text>

                  {showLoci && lociKind === "circle" && (
                    <circle
                      cx={toSvgX(a.re)}
                      cy={toSvgY(a.im)}
                      r={(radius / (VIEW.xMax - VIEW.xMin)) * (W - 2 * PAD)}
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth={2}
                    />
                  )}
                  {showLoci && lociKind === "arg" && (
                    <HalfLine centre={a} theta={lociArg} />
                  )}
                  {showLoci && lociKind === "bisector" && (
                    <PerpendicularBisector a={a} b={b} />
                  )}
                  {showMul && mod(w) > 1e-6 && (
                    <>
                      <Vector from={{ re: 0, im: 0 }} to={zw} color="#fb923c" label="zw" dashed />
                      {zOverW && (
                        <Vector from={{ re: 0, im: 0 }} to={zOverW} color="#c084fc" label="z/w" dashed />
                      )}
                    </>
                  )}

                  {!showLoci && (
                    <DraggablePoint
                      c={z}
                      color="#60a5fa"
                      label="z"
                      onPointerDown={onPointerDown("z")}
                    />
                  )}

                  {showLoci && (
                    <DraggablePoint c={a} color="#f472b6" label="a" onPointerDown={onPointerDown("a")} />
                  )}
                  {showLoci && lociKind === "bisector" && (
                    <DraggablePoint c={b} color="#fbbf24" label="b" onPointerDown={onPointerDown("b")} />
                  )}

                  {showMul && (
                    <DraggablePoint
                      c={w}
                      color="#34d399"
                      label="w"
                      onPointerDown={onPointerDown("w")}
                    />
                  )}
                </svg>
              </div>
            </div>
          )}

          {showLoci && (
            <div className="card cardStrong" style={{ marginTop: 12 }}>
              <div className="h2">Equation</div>
              <p className="para" style={{ marginTop: 8, fontFamily: "ui-monospace, monospace" }}>
                {lociEquation}
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <div className="rowLabel">a</div>
                <div className="rowValue">{fmtComplex(a)}</div>
              </div>
              {lociKind === "bisector" && (
                <div className="row">
                  <div className="rowLabel">b</div>
                  <div className="rowValue">{fmtComplex(b)}</div>
                </div>
              )}
            </div>
          )}

          {tab === "proofs" && <ProofsPanel />}
        </div>

        {(tab === "one" || tab === "mul") && (
        <div className="stickyCol">
          {tab === "one" && (
            <div className="card cardStrong">
              <div className="h2">z</div>
              <div className="row">
                <div className="rowLabel">Cartesian</div>
                <div className="rowValue">{fmtComplex(z)}</div>
              </div>
              <div className="row">
                <div className="rowLabel">|z|</div>
                <div className="rowValue">{fmtModulus(z)}</div>
              </div>
              <div className="row">
                <div className="rowLabel">arg(z)</div>
                <div className="rowValue">{fmtRad(argZ)}</div>
              </div>
            </div>
          )}

          {tab === "mul" && (
            <div className="card cardStrong">
              <p className="para" style={{ marginTop: 0, marginBottom: 12 }}>
                General modulus–argument form:{" "}
                <span style={{ fontFamily: "ui-monospace, monospace" }}>z = r(cos θ + isin θ)</span>
              </p>
              <Readout label="z" value={fmtModArg(z)} />
              <Readout label="w" value={fmtModArg(w)} />
              <Readout label="zw" value={fmtModArg(zw)} />
              {mod(w) < 1e-6 ? (
                <Readout label="z/w" value="undefined (w = 0)" />
              ) : (
                <Readout label="z/w" value={fmtModArg(zOverW!)} />
              )}
              <div style={{ marginTop: 12 }}>
                <Readout
                  label="|zw| = |z||w|"
                  value={`${fmtModulus(zw)} = ${fmtModulus(z)} × ${fmtModulus(w)}`}
                />
                {mod(w) >= 1e-6 && (
                  <Readout
                    label="|z/w| = |z|/|w|"
                    value={`${fmtModulus(zOverW!)} = ${fmtModulus(z)} / ${fmtModulus(w)}`}
                  />
                )}
              </div>
            </div>
          )}

        </div>
        )}
      </div>
    </main>
  );
}

function Readout(props: { label: string; value: string }) {
  return (
    <div className="row">
      <div className="rowLabel">{props.label}</div>
      <div className="rowValue">{props.value}</div>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  note?: string;
}) {
  const { label, value, min, max, step, onChange, note } = props;
  return (
    <div className="card cardStrong">
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
        <span className="graphHint">{note ?? fmtNum(value)}</span>
      </div>
    </div>
  );
}

function DraggablePoint(props: {
  c: C;
  color: string;
  label: string;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const { c, color, label, onPointerDown } = props;
  const cx = toSvgX(c.re);
  const cy = toSvgY(c.im);
  return (
    <g>
      <line x1={toSvgX(0)} y1={toSvgY(0)} x2={cx} y2={cy} stroke={color} strokeOpacity={0.35} strokeWidth={1.5} />
      <circle
        cx={cx}
        cy={cy}
        r={11}
        fill={color}
        stroke="white"
        strokeWidth={2}
        onPointerDown={onPointerDown}
        style={{ cursor: "grab" }}
      />
      <text x={cx + 14} y={cy - 8} fontSize={13} fontWeight={700} fill={color}>
        {label}
      </text>
    </g>
  );
}

function Vector(props: { from: C; to: C; color: string; label: string; dashed?: boolean }) {
  const { from, to, color, label, dashed } = props;
  const x1 = toSvgX(from.re);
  const y1 = toSvgY(from.im);
  const x2 = toSvgX(to.re);
  const y2 = toSvgY(to.im);
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashed ? "5 4" : undefined}
        markerEnd="url(#argand-arrow)"
      />
      <text x={x2 + 8} y={y2} fontSize={12} fill={color}>
        {label}
      </text>
    </g>
  );
}

function PerpendicularBisector(props: { a: C; b: C }) {
  const { a, b } = props;
  const dx = b.re - a.re;
  const dy = b.im - a.im;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return null;

  const mid = { re: (a.re + b.re) / 2, im: (a.im + b.im) / 2 };
  const ux = -dy / len;
  const uy = dx / len;
  const extent = 14;
  const p1 = { re: mid.re - ux * extent, im: mid.im - uy * extent };
  const p2 = { re: mid.re + ux * extent, im: mid.im + uy * extent };

  return (
    <g>
      <line
        x1={toSvgX(a.re)}
        y1={toSvgY(a.im)}
        x2={toSvgX(b.re)}
        y2={toSvgY(b.im)}
        stroke="#a78bfa"
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <line
        x1={toSvgX(p1.re)}
        y1={toSvgY(p1.im)}
        x2={toSvgX(p2.re)}
        y2={toSvgY(p2.im)}
        stroke="#a78bfa"
        strokeWidth={2.5}
      />
    </g>
  );
}

function HalfLine(props: { centre: C; theta: number }) {
  const { centre, theta } = props;
  const len = 8;
  const end = add(centre, fromPolar(len, theta));
  return (
    <line
      x1={toSvgX(centre.re)}
      y1={toSvgY(centre.im)}
      x2={toSvgX(end.re)}
      y2={toSvgY(end.im)}
      stroke="#a78bfa"
      strokeWidth={2.5}
    />
  );
}

const MONO: React.CSSProperties = { fontFamily: "ui-monospace, monospace" };

function ProofsPanel() {
  const zb = "z\u0304";
  const wb = "w\u0304";
  const zwBar = (
    <span style={{ textDecoration: "overline", display: "inline-block", lineHeight: 1.25 }}>
      zw
    </span>
  );
  const quotientBar = (
    <span style={{ textDecoration: "overline", display: "inline-block", lineHeight: 1.25 }}>
      z/w
    </span>
  );

  return (
    <>
      <div className="card cardStrong" style={{ marginTop: 14 }}>
        <div className="prose">
        <h2 className="h2">Modulus of a product</h2>
        <p className="para"><b>1.</b></p>
        <p className="para" style={MONO}>
          |z|&sup2; = z{zb}, &nbsp; |w|&sup2; = w{wb}
        </p>
        <p className="para"><b>2.</b></p>
        <p className="para" style={MONO}>
          ({zwBar}) = {zb}{wb}
        </p>
        <p className="para"><b>3.</b></p>
        <p className="para" style={MONO}>
          |zw|&sup2; = (zw)({zwBar})
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;= (zw)({zb}{wb})
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;= (z{zb})(w{wb})
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;= |z|&sup2;|w|&sup2;
        </p>
        <p className="para"><b>4.</b></p>
        <p className="para" style={MONO}>
          <b>|zw| = |z||w|</b>
        </p>

        <h2 className="h2" style={{ marginTop: 24 }}>Argument of a product</h2>
        <p className="para"><b>1.</b></p>
        <p className="para" style={MONO}>
          z = |z|(cos(&alpha;) + isin(&alpha;))
          <br />
          w = |w|(cos(&beta;) + isin(&beta;))
        </p>
        <p className="para"><b>2.</b></p>
        <p className="para" style={MONO}>
          zw = |z||w|[(cos(&alpha;)cos(&beta;) &minus; sin(&alpha;)sin(&beta;))
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;+ i(sin(&alpha;)cos(&beta;) + cos(&alpha;)sin(&beta;))]
        </p>
        <p className="para"><b>3.</b></p>
        <p className="para" style={MONO}>
          cos(&alpha; + &beta;) = cos(&alpha;)cos(&beta;) &minus; sin(&alpha;)sin(&beta;)
          <br />
          sin(&alpha; + &beta;) = sin(&alpha;)cos(&beta;) + cos(&alpha;)sin(&beta;)
        </p>
        <p className="para"><b>4.</b></p>
        <p className="para" style={MONO}>
          zw = |z||w|(cos(&alpha; + &beta;) + isin(&alpha; + &beta;))
        </p>
        <p className="para"><b>5.</b></p>
        <p className="para" style={MONO}>
          <b>arg(zw) = arg(z) + arg(w)</b>
        </p>

        <h2 className="h2" style={{ marginTop: 24 }}>Modulus of a quotient (w &ne; 0)</h2>
        <p className="para"><b>1.</b></p>
        <p className="para" style={MONO}>
          ({quotientBar}) = {zb}/{wb}
        </p>
        <p className="para"><b>2.</b></p>
        <p className="para" style={MONO}>
          |z/w|&sup2; = (z/w)({quotientBar})
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;= (z/w)({zb}/{wb})
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;= (z{zb})/(w{wb})
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;= |z|&sup2;/|w|&sup2;
        </p>
        <p className="para"><b>3.</b></p>
        <p className="para" style={MONO}>
          <b>|z/w| = |z|/|w|</b>
        </p>

        <h2 className="h2" style={{ marginTop: 24 }}>Argument of a quotient (w &ne; 0)</h2>
        <p className="para"><b>1.</b></p>
        <p className="para" style={MONO}>
          z = |z|(cos(&alpha;) + isin(&alpha;))
          <br />
          w = |w|(cos(&beta;) + isin(&beta;))
        </p>
        <p className="para"><b>2.</b></p>
        <p className="para" style={MONO}>
          z/w = (|z|/|w|) &times; (cos(&alpha;) + isin(&alpha;))/(cos(&beta;) + isin(&beta;))
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&times; (cos(&beta;) &minus; isin(&beta;))/(cos(&beta;) &minus; isin(&beta;))
        </p>
        <p className="para"><b>3.</b></p>
        <p className="para" style={MONO}>
          z/w = (|z|/|w|)[(cos(&alpha;)cos(&beta;) + sin(&alpha;)sin(&beta;))
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;+ i(sin(&alpha;)cos(&beta;) &minus; cos(&alpha;)sin(&beta;))]
        </p>
        <p className="para"><b>4.</b></p>
        <p className="para" style={MONO}>
          cos(&alpha; &minus; &beta;) = cos(&alpha;)cos(&beta;) + sin(&alpha;)sin(&beta;)
          <br />
          sin(&alpha; &minus; &beta;) = sin(&alpha;)cos(&beta;) &minus; cos(&alpha;)sin(&beta;)
        </p>
        <p className="para"><b>5.</b></p>
        <p className="para" style={MONO}>
          z/w = (|z|/|w|)(cos(&alpha; &minus; &beta;) + isin(&alpha; &minus; &beta;))
        </p>
        <p className="para"><b>6.</b></p>
        <p className="para" style={MONO}>
          <b>arg(z/w) = arg(z) &minus; arg(w)</b>
        </p>
        </div>
      </div>
      <div className="card cardStrong" style={{ marginTop: 12 }}>
        <p className="para" style={{ margin: 0 }}>
          Trust me just read it and really think about each step. If you don&apos;t understand the argument explanations,
          it&apos;s worth asking AI. They can explain each step better than I could, I struggled putting them on here.
          The modulus proofs are the best I&apos;ve ever seen in my opinion though (obviously not my own proof).
        </p>
      </div>
    </>
  );
}
