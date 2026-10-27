"use client";

import React, { useEffect, useMemo, useState } from "react";

type SeriesId = "sin" | "cos" | "exp" | "ln" | "sqrt" | "cube";

type View = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type Series = {
  id: SeriesId;
  label: string;
  view: View;
  x0: number;
  terms0: number;
  maxTerms: number;
  shade: { from: number; to: number } | null;
  xStep: number;
  yStep: number;
};

const SERIES: Record<SeriesId, Series> = {
  sin: {
    id: "sin",
    label: "sin x",
    view: { xMin: -6.5, xMax: 6.5, yMin: -1.6, yMax: 1.6 },
    x0: 1,
    terms0: 1,
    maxTerms: 10,
    shade: null,
    xStep: 2,
    yStep: 1,
  },
  cos: {
    id: "cos",
    label: "cos x",
    view: { xMin: -6.5, xMax: 6.5, yMin: -1.6, yMax: 1.6 },
    x0: 1,
    terms0: 1,
    maxTerms: 10,
    shade: null,
    xStep: 2,
    yStep: 1,
  },
  exp: {
    id: "exp",
    label: "e^x",
    view: { xMin: -4, xMax: 2, yMin: -2, yMax: 8 },
    x0: -2,
    terms0: 1,
    maxTerms: 14,
    shade: null,
    xStep: 2,
    yStep: 2,
  },
  ln: {
    id: "ln",
    label: "ln(1+x)",
    view: { xMin: -1.5, xMax: 2.5, yMin: -2.5, yMax: 2 },
    x0: 1,
    terms0: 4,
    maxTerms: 12,
    shade: { from: -1, to: 1 },
    xStep: 0.5,
    yStep: 1,
  },
  sqrt: {
    id: "sqrt",
    label: "(1+x)^(1/2)",
    view: { xMin: -1.5, xMax: 2.5, yMin: -0.5, yMax: 2.4 },
    x0: -1,
    terms0: 4,
    maxTerms: 12,
    shade: { from: -1, to: 1 },
    xStep: 0.5,
    yStep: 1,
  },
  cube: {
    id: "cube",
    label: "(1+x)^3",
    view: { xMin: -1.5, xMax: 2.5, yMin: -10, yMax: 48 },
    x0: 2,
    terms0: 4,
    maxTerms: 4,
    shade: null,
    xStep: 0.5,
    yStep: 10,
  },
};

const WIDTH = 860;
const HEIGHT = 420;
const PAD_L = 52;
const PAD_R = 18;
const PAD_T = 46;
const PAD_B = 36;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function tidy(n: number) {
  return Math.abs(n) < 1e-9 ? 0 : n;
}

function fmtSig(n: number, sig = 4) {
  if (!Number.isFinite(n)) return "—";
  const value = tidy(n);
  const a = Math.abs(value);
  if (a < 1e-12) return "0";
  const p = Math.floor(Math.log10(a));
  const decimals = Math.max(0, Math.min(12, sig - 1 - p));
  const text = value.toFixed(decimals).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  if (Number(text) === 0) return "0";
  return text;
}

function fmtTick(n: number) {
  if (Math.abs(n) < 1e-9) return "0";
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(Math.round(n * 10) / 10);
}

function gcd(a: number, b: number) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function partialSum(id: SeriesId, x: number, count: number) {
  if (id === "sin") {
    let term = x;
    let sum = 0;
    for (let k = 0; k < count; k++) {
      if (k > 0) term *= (-x * x) / ((2 * k) * (2 * k + 1));
      sum += term;
    }
    return sum;
  }

  if (id === "cos") {
    let term = 1;
    let sum = 0;
    for (let k = 0; k < count; k++) {
      if (k > 0) term *= (-x * x) / ((2 * k - 1) * (2 * k));
      sum += term;
    }
    return sum;
  }

  if (id === "exp") {
    let term = 1;
    let sum = 0;
    for (let k = 0; k < count; k++) {
      if (k > 0) term *= x / k;
      sum += term;
    }
    return sum;
  }

  if (id === "ln") {
    let term = x;
    let sum = 0;
    for (let k = 1; k <= count; k++) {
      if (k > 1) term *= (-x * (k - 1)) / k;
      sum += term;
    }
    return sum;
  }

  if (id === "sqrt") {
    let term = 1;
    let sum = 0;
    for (let k = 0; k < count; k++) {
      if (k > 0) term *= (x * (3 - 2 * k)) / (2 * k);
      sum += term;
    }
    return sum;
  }

  const coeffs = [1, 3, 3, 1];
  let power = 1;
  let sum = 0;
  for (let k = 0; k < count; k++) {
    sum += coeffs[k] * power;
    power *= x;
  }
  return sum;
}

function fValue(id: SeriesId, x: number): number | null {
  if (id === "sin") return Math.sin(x);
  if (id === "cos") return Math.cos(x);
  if (id === "exp") return Math.exp(x);
  if (id === "ln") return x <= -1 ? null : Math.log(1 + x);
  if (id === "sqrt") return x < -1 ? null : Math.sqrt(1 + x);
  const u = 1 + x;
  return u * u * u;
}

function lastPower(id: SeriesId, count: number) {
  if (id === "sin") return 2 * (count - 1) + 1;
  if (id === "cos") return 2 * (count - 1);
  if (id === "ln") return count;
  return count - 1;
}

function termLabel(power: number) {
  if (power <= 0) return "Constant term";
  if (power === 1) return "Up to the term in x";
  return `Up to the term in x^${power}`;
}

type TermBits = {
  sign: 1 | -1;
  coeff: React.ReactNode;
  power: string | null;
  den: string | null;
};

function plainTerm(sign: 1 | -1, power: string | null, coeff: React.ReactNode = null): TermBits {
  return { sign, coeff, power, den: null };
}

function fracTerm(
  sign: 1 | -1,
  power: string | null,
  den: string,
  coeff: React.ReactNode = null
): TermBits {
  return { sign, coeff, power, den };
}

function SignedOne({ exp }: { exp: string }) {
  return (
    <span>
      (−1)<sup style={{ fontSize: "0.68em", marginLeft: 1 }}>{exp}</sup>
    </span>
  );
}

function sqrtCoeff(k: number) {
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= 3 - 2 * i;
    den *= 2 * i;
    const g = gcd(num, den);
    num /= g;
    den /= g;
  }
  return { num, den };
}

function includedTerms(id: SeriesId, count: number): TermBits[] {
  if (id === "sin") {
    return Array.from({ length: count }, (_, k) => {
      const power = 2 * k + 1;
      const sign = (k % 2 === 0 ? 1 : -1) as 1 | -1;
      return power === 1 ? plainTerm(sign, "1") : fracTerm(sign, String(power), `${power}!`);
    });
  }

  if (id === "cos") {
    return Array.from({ length: count }, (_, k) => {
      const power = 2 * k;
      const sign = (k % 2 === 0 ? 1 : -1) as 1 | -1;
      return power === 0 ? plainTerm(sign, null, "1") : fracTerm(sign, String(power), `${power}!`);
    });
  }

  if (id === "exp") {
    return Array.from({ length: count }, (_, k) => {
      if (k === 0) return plainTerm(1, null, "1");
      if (k === 1) return plainTerm(1, "1");
      return fracTerm(1, String(k), `${k}!`);
    });
  }

  if (id === "ln") {
    return Array.from({ length: count }, (_, i) => {
      const k = i + 1;
      const sign = (k % 2 === 1 ? 1 : -1) as 1 | -1;
      return k === 1 ? plainTerm(sign, "1") : fracTerm(sign, String(k), String(k));
    });
  }

  if (id === "sqrt") {
    return Array.from({ length: count }, (_, k) => {
      const { num, den } = sqrtCoeff(k);
      const sign = (num < 0 ? -1 : 1) as 1 | -1;
      const absNum = Math.abs(num);
      const coeff = absNum === 1 ? null : String(absNum);
      if (k === 0) return plainTerm(1, null, "1");
      if (den === 1) return plainTerm(sign, String(k), coeff);
      return fracTerm(sign, String(k), String(den), coeff);
    });
  }

  const cube: TermBits[] = [
    plainTerm(1, null, "1"),
    plainTerm(1, "1", "3"),
    plainTerm(1, "2", "3"),
    plainTerm(1, "3"),
  ];
  return cube.slice(0, count);
}

function patternTerm(id: SeriesId): { term: TermBits } | null {
  if (id === "sin") return { term: fracTerm(1, "2k+1", "(2k+1)!", <SignedOne exp="k" />) };
  if (id === "cos") return { term: fracTerm(1, "2k", "(2k)!", <SignedOne exp="k" />) };
  if (id === "exp") return { term: fracTerm(1, "k", "k!") };
  if (id === "ln") return { term: fracTerm(1, "k", "k", <SignedOne exp="k+1" />) };
  if (id === "sqrt") return { term: fracTerm(1, "k", "k!", <span>(1/2)(1/2−1)…(1/2−k+1)</span>) };
  return null;
}

function LeftSide({ id }: { id: SeriesId }) {
  const supStyle = { fontSize: "0.68em", marginLeft: 1 };
  if (id === "exp") return <span>e<sup style={supStyle}>x</sup></span>;
  if (id === "sqrt") return <span>√(1+x)</span>;
  if (id === "cube") return <span>(1+x)<sup style={supStyle}>3</sup></span>;
  if (id === "ln") return <span>ln(1+x)</span>;
  if (id === "sin") return <span>sin x</span>;
  return <span>cos x</span>;
}

function readoutNote(id: SeriesId, x: number) {
  if (id === "ln") {
    if (x <= -1) {
      return "There is no curve here. The terms still produce a number, but ln(1+x) is not real.";
    }
    if (Math.abs(x - 1) <= 0.005) {
      return "It is getting to ln 2, just slowly. The gap is meant to be there.";
    }
    if (x > 1) {
      return "Past 1, adding another term makes this worse, not better.";
    }
    return null;
  }

  if (id === "sqrt") {
    if (x < -1) {
      return "The square root is not real here, and the terms are flying off as well.";
    }
    if (Math.abs(x + 1) <= 0.005) {
      return "It is heading for 0, slowly. That gap is not a mistake.";
    }
    if (x > 1) {
      return "Outside |x| < 1, more terms will not settle on the curve.";
    }
    return null;
  }

  return null;
}

function ticks(min: number, max: number, step: number) {
  const out: number[] = [];
  const start = Math.ceil((min - 1e-9) / step) * step;
  for (let v = start; v <= max + 1e-9; v += step) {
    const rounded = Math.round(v * 1000) / 1000;
    if (rounded < min - 1e-9 || rounded > max + 1e-9) continue;
    out.push(rounded);
  }
  return out;
}

function toSvgX(x: number, view: View) {
  return PAD_L + ((x - view.xMin) / (view.xMax - view.xMin)) * (WIDTH - PAD_L - PAD_R);
}

function toSvgY(y: number, view: View) {
  return PAD_T + ((view.yMax - y) / (view.yMax - view.yMin)) * (HEIGHT - PAD_T - PAD_B);
}

function clipY(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  yMin: number,
  yMax: number
) {
  let t0 = 0;
  let t1 = 1;
  const dy = y1 - y0;
  const p = [-dy, dy];
  const q = [y0 - yMin, yMax - y0];

  for (let i = 0; i < 2; i++) {
    if (Math.abs(p[i]) < 1e-12) {
      if (q[i] < 0) return null;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }

  if (t0 > t1) return null;
  return [
    { x: x0 + t0 * (x1 - x0), y: y0 + t0 * dy },
    { x: x0 + t1 * (x1 - x0), y: y0 + t1 * dy },
  ];
}

function buildPath(
  samples: Array<{ x: number; y: number | null }>,
  view: View
) {
  let d = "";
  let pen = false;

  const move = (x: number, y: number, command: "M" | "L") => {
    d += `${command} ${toSvgX(x, view).toFixed(2)} ${toSvgY(y, view).toFixed(2)} `;
    pen = true;
  };

  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (a.y === null || b.y === null || !Number.isFinite(a.y) || !Number.isFinite(b.y)) {
      pen = false;
      continue;
    }

    const clipped = clipY(a.x, a.y, b.x, b.y, view.yMin, view.yMax);
    if (!clipped) {
      pen = false;
      continue;
    }

    const startsInside = a.y >= view.yMin && a.y <= view.yMax;
    const endsInside = b.y >= view.yMin && b.y <= view.yMax;
    if (!startsInside) pen = false;
    move(clipped[0].x, clipped[0].y, pen && startsInside ? "L" : "M");
    move(clipped[1].x, clipped[1].y, "L");
    if (!endsInside) pen = false;
  }

  return d;
}

function pinY(y: number, view: View) {
  if (y > view.yMax) return view.yMax;
  if (y < view.yMin) return view.yMin;
  return y;
}

function Control(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  plain?: boolean;
  thumb?: string;
}) {
  const { label, value, min, max, step, onChange, plain, thumb } = props;
  const [text, setText] = useState(fmtSig(value, 4));

  useEffect(() => {
    setText(Number.isFinite(value) ? fmtSig(value, 4) : String(min));
  }, [value, min]);

  return (
    <div className={plain ? "graphHudControl" : "card cardStrong"} style={plain ? { ["--hud" as string]: thumb } : { minWidth: 0 }}>
      {plain ? <span className="graphHudLabel">{label}</span> : <div className="controlLabel">{label}</div>}
      <div className="controlRow" style={{ minWidth: 0, flex: plain ? 1 : undefined }}>
        <input
          className={plain ? "graphHudRange" : "range"}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          onWheel={(e) => e.currentTarget.blur()}
        />
        <input
          className={plain ? "graphHudNumber" : "numInput"}
          type="number"
          min={min}
          max={max}
          step={step}
          value={text}
          aria-label={`${label} value`}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
          onBlur={() => {
            const n = Number(text);
            if (!Number.isFinite(n)) {
              setText(fmtSig(value, 4));
              return;
            }
            const next = clamp(n, min, max);
            onChange(next);
            setText(fmtSig(next, 4));
          }}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </div>
    </div>
  );
}

function AxisX(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  axisY: number;
  plotLeft: number;
  plotWidth: number;
}) {
  const { value, min, max, step, onChange, axisY, plotLeft, plotWidth } = props;
  const [text, setText] = useState(fmtSig(value, 4));
  const thumb = 12;

  useEffect(() => {
    setText(Number.isFinite(value) ? fmtSig(value, 4) : String(min));
  }, [value, min]);

  const t = max === min ? 0 : clamp((value - min) / (max - min), 0, 1);
  const shift = t < 0.12 ? "translateX(0)" : t > 0.88 ? "translateX(-100%)" : "translateX(-50%)";

  return (
    <>
      <input
        className="graphHudRange axisRange"
        style={{
          left: `calc(${plotLeft}% - ${thumb / 2}px)`,
          width: `calc(${plotWidth}% + ${thumb}px)`,
          top: `calc(${axisY}% - ${thumb / 2}px)`,
          ["--hud" as string]: "var(--accent)",
        }}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label="x"
        onChange={(e) => onChange(Number(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
      />
      <input
        className="graphHudNumber axisValue"
        style={{
          left: `${plotLeft + t * plotWidth}%`,
          top: `calc(${axisY}% - 22px)`,
          transform: shift,
        }}
        type="number"
        min={min}
        max={max}
        step={step}
        value={text}
        aria-label="x value"
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(n);
        }}
        onBlur={() => {
          const n = Number(text);
          if (!Number.isFinite(n)) {
            setText(fmtSig(value, 4));
            return;
          }
          const next = clamp(n, min, max);
          onChange(next);
          setText(fmtSig(next, 4));
        }}
        onWheel={(e) => e.currentTarget.blur()}
      />
    </>
  );
}

function Power({ value }: { value: string }) {
  if (value === "1") return <span>x</span>;
  return (
    <span>
      x<sup style={{ fontSize: "0.68em", marginLeft: 1 }}>{value}</sup>
    </span>
  );
}

function TermBody({ term }: { term: TermBits }) {
  const tight = typeof term.coeff === "string" && /^[0-9]+$/.test(term.coeff);
  const top = (
    <span>
      {term.coeff != null && <span style={{ marginRight: tight || !term.power ? 0 : 6 }}>{term.coeff}</span>}
      {term.power ? <Power value={term.power} /> : term.coeff ? null : "1"}
    </span>
  );

  if (!term.den) return top;

  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 2px",
        lineHeight: 1.15,
      }}
    >
      <span style={{ padding: "0 7px 3px" }}>{top}</span>
      <span
        style={{
          borderTop: "1.5px solid rgba(242,245,255,0.88)",
          padding: "3px 7px 0",
          fontSize: "0.92em",
        }}
      >
        {term.den}
      </span>
    </span>
  );
}

function FormulaTerm({ term, first }: { term: TermBits; first: boolean }) {
  const showSign = !first || term.sign < 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {showSign && (
        <span style={{ margin: "0 7px", fontSize: "0.95em" }}>{term.sign < 0 ? "−" : "+"}</span>
      )}
      <TermBody term={term} />
    </span>
  );
}

function FormulaLine({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px 2px",
        fontFamily: 'ui-serif, "Times New Roman", "STIX Two Text", Georgia, serif',
        fontSize: small ? "1.2rem" : "1.65rem",
        lineHeight: 1.15,
        padding: small ? "2px 0" : "4px 0 2px",
        maxWidth: "100%",
        overflowX: "auto",
      }}
    >
      {children}
    </div>
  );
}

export default function MaclaurinPage() {
  const [seriesId, setSeriesId] = useState<SeriesId>("sin");
  const [xRaw, setXRaw] = useState(SERIES.sin.x0);
  const [termsRaw, setTermsRaw] = useState(SERIES.sin.terms0);

  const series = SERIES[seriesId];
  const view = series.view;
  const x = clamp(Math.round(xRaw * 100) / 100, view.xMin, view.xMax);
  const terms = clamp(Math.round(termsRaw), 1, series.maxTerms);
  const power = lastPower(seriesId, terms);

  const sum = partialSum(seriesId, x, terms);
  const fn = fValue(seriesId, x);
  const percent =
    fn === null || Math.abs(fn) < 1e-8 ? null : (Math.abs(sum - fn) / Math.abs(fn)) * 100;
  const note = readoutNote(seriesId, x);
  const drawn = includedTerms(seriesId, terms);
  const pattern = patternTerm(seriesId);
  const finishedCube = seriesId === "cube" && terms === series.maxTerms;

  const samples = useMemo(() => {
    const n = 720;
    const fnSamples: Array<{ x: number; y: number | null }> = [];
    const sumSamples: Array<{ x: number; y: number | null }> = [];
    for (let i = 0; i <= n; i++) {
      const sampleX = view.xMin + ((view.xMax - view.xMin) * i) / n;
      fnSamples.push({ x: sampleX, y: fValue(seriesId, sampleX) });
      sumSamples.push({ x: sampleX, y: partialSum(seriesId, sampleX, terms) });
    }
    return {
      fn: buildPath(fnSamples, view),
      sum: buildPath(sumSamples, view),
    };
  }, [seriesId, terms, view]);

  const xTicks = ticks(view.xMin, view.xMax, series.xStep);
  const yTicks = ticks(view.yMin, view.yMax, series.yStep);
  const sumOff = sum > view.yMax || sum < view.yMin;
  const fnOff = fn !== null && (fn > view.yMax || fn < view.yMin);
  const showGuide = view.yMin < 0 && view.yMax > 0;

  function choose(next: SeriesId) {
    const spec = SERIES[next];
    setSeriesId(next);
    setXRaw(spec.x0);
    setTermsRaw(spec.terms0);
  }

  return (
    <main className="page">
      <a href="/topics/mathematics" className="backLink">
        ← Back to Mathematics
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Maclaurin series</h1>
        <div className="topicHeaderSub">
          Rebuild a function from its derivatives at zero, one power of x at a time.
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <FormulaLine small>
          <span>f(x) = f(0) + f′(0)x + </span>
          <TermBody term={fracTerm(1, "2", "2!", "f″(0)")} />
          <span> + </span>
          <TermBody term={fracTerm(1, "3", "3!", "f‴(0)")} />
          <span> + …</span>
        </FormulaLine>
        <div className="muted" style={{ marginTop: 10 }}>
          <p style={{ margin: 0 }}>
            The Maclaurin series builds a polynomial that copies the function at x = 0.
          </p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li>f(0) finds the y-intercept, so it starts at the same point as the curve.</li>
            <li>f′(0)x finds the gradient. Now it is the tangent at x = 0.</li>
            <li>The x<sup>2</sup> term matches the second derivative, so the series curves with the function.</li>
            <li>Each term after that matches the next derivative, so it stays on the curve for longer.</li>
          </ul>
        </div>
      </div>

      <div className="topicGrid">
          <div className="card">
            <div style={{ position: "relative" }}>
            <div className="graphBox" style={{ ["--ratio" as string]: `${WIDTH} / ${HEIGHT}` }}>
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`Graph of ${series.label} and the polynomial ${termLabel(power)}`}
              >
                {yTicks.map((tick) => (
                  <line
                    key={`hy-${tick}`}
                    x1={PAD_L}
                    x2={WIDTH - PAD_R}
                    y1={toSvgY(tick, view)}
                    y2={toSvgY(tick, view)}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                  />
                ))}
                {xTicks.map((tick) => (
                  <line
                    key={`vx-${tick}`}
                    y1={PAD_T}
                    y2={HEIGHT - PAD_B}
                    x1={toSvgX(tick, view)}
                    x2={toSvgX(tick, view)}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                  />
                ))}

                {series.shade && (
                  <rect
                    x={toSvgX(series.shade.from, view)}
                    y={PAD_T}
                    width={toSvgX(series.shade.to, view) - toSvgX(series.shade.from, view)}
                    height={HEIGHT - PAD_T - PAD_B}
                    fill="rgba(125,211,252,0.14)"
                  />
                )}

                {showGuide && (
                  <line
                    className="xAxis"
                    x1={PAD_L}
                    x2={WIDTH - PAD_R}
                    y1={toSvgY(0, view)}
                    y2={toSvgY(0, view)}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth={1.5}
                  />
                )}
                <line
                  y1={PAD_T}
                  y2={HEIGHT - PAD_B}
                  x1={toSvgX(0, view)}
                  x2={toSvgX(0, view)}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={1.5}
                />

                <path d={samples.fn} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
                <path d={samples.sum} fill="none" stroke="var(--accent2)" strokeWidth={2.5} />

                <line
                  className="xGuide"
                  x1={toSvgX(x, view)}
                  x2={toSvgX(x, view)}
                  y1={PAD_T}
                  y2={HEIGHT - PAD_B}
                  stroke="rgba(255,255,255,0.35)"
                  strokeDasharray="4 6"
                />

                {fn !== null && (
                  <circle
                    cx={toSvgX(x, view)}
                    cy={toSvgY(fnOff ? pinY(fn, view) : fn, view)}
                    r={6}
                    fill={fnOff ? "none" : "var(--accent)"}
                    stroke="var(--accent)"
                    strokeWidth={2}
                  >
                    {fnOff && <title>The function is off the graph. The number below is the real value.</title>}
                  </circle>
                )}

                <circle
                  cx={toSvgX(x, view)}
                  cy={toSvgY(sumOff ? pinY(sum, view) : sum, view)}
                  r={6}
                  fill={sumOff ? "none" : "var(--accent2)"}
                  stroke="var(--accent2)"
                  strokeWidth={2}
                >
                  {sumOff && <title>The polynomial is off the graph. The number below is the real value.</title>}
                </circle>

                {xTicks.map((tick) => (
                  <text
                    key={`xt-${tick}`}
                    x={toSvgX(tick, view)}
                    y={HEIGHT - 16}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.72)"
                    fontSize="13"
                    fontFamily="var(--font-mono)"
                  >
                    {fmtTick(tick)}
                  </text>
                ))}
                {yTicks.map((tick) => (
                  <text
                    key={`yt-${tick}`}
                    x={PAD_L - 8}
                    y={toSvgY(tick, view) + 4}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.72)"
                    fontSize="13"
                    fontFamily="var(--font-mono)"
                  >
                    {fmtTick(tick)}
                  </text>
                ))}
              </svg>
            </div>

            <div className="graphHud graphHudTop">
              <label className="graphHudTitle">
                <select
                  className="graphHudSelect"
                  value={seriesId}
                  aria-label="Function"
                  onChange={(e) => choose(e.target.value as SeriesId)}
                  onWheel={(e) => e.currentTarget.blur()}
                >
                  <option value="sin">sin x</option>
                  <option value="cos">cos x</option>
                  <option value="exp">e^x</option>
                  <option value="ln">ln(1+x)</option>
                  <option value="sqrt">(1+x)^(1/2)</option>
                  <option value="cube">(1+x)^3</option>
                </select>
              </label>
              <Control
                plain
                thumb="var(--accent2)"
                label="Terms"
                value={terms}
                min={1}
                max={series.maxTerms}
                step={1}
                onChange={setTermsRaw}
              />
            </div>

            <AxisX
              value={x}
              min={view.xMin}
              max={view.xMax}
              step={0.01}
              onChange={setXRaw}
              axisY={(toSvgY(0, view) / HEIGHT) * 100}
              plotLeft={(PAD_L / WIDTH) * 100}
              plotWidth={((WIDTH - PAD_L - PAD_R) / WIDTH) * 100}
            />
            </div>

            {(series.shade || sumOff || fnOff) && (
              <p className="muted" style={{ margin: "10px 0 0" }}>
                {[
                  series.shade ? "Shading is where those terms can actually keep up." : "",
                  sumOff || fnOff ? "A hollow dot has run off the graph. Use the number." : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
          </div>

          <div className="card stickyCol">
            <FormulaLine>
              <span style={{ marginRight: 8 }}>
                <LeftSide id={seriesId} />
              </span>
              <span style={{ marginRight: 4 }}>{finishedCube ? "=" : "≈"}</span>
              {drawn.map((term, index) => (
                <FormulaTerm key={`${seriesId}-${index}`} term={term} first={index === 0} />
              ))}
            </FormulaLine>

            {pattern && (
              <div style={{ marginTop: 16 }}>
                <div className="muted" style={{ marginBottom: 4 }}>
                  The general formula is
                </div>
                <FormulaLine small>
                  <FormulaTerm term={pattern.term} first />
                </FormulaLine>
              </div>
            )}

            <div className="divider" />
            <div className="row">
              <div className="rowLabel">x</div>
              <div className="rowValue">{fmtSig(x)}</div>
            </div>
            <div className="row">
              <div className="rowLabel">real value</div>
              <div className="rowValue">{fn === null ? "not a real number" : fmtSig(fn)}</div>
            </div>
            <div className="row">
              <div className="rowLabel">approximation</div>
              <div className="rowValue">{fmtSig(sum)}</div>
            </div>
            <div className="row">
              <div className="rowLabel">percentage error</div>
              <div className="rowValue">
                {percent === null ? "—" : Math.abs(percent) < 5e-4 ? "0%" : `${fmtSig(percent)}%`}
              </div>
            </div>
            {fn !== null && Math.abs(fn) < 1e-8 && (
              <p className="muted" style={{ margin: "8px 0 0" }}>
                The real value is about 0, so a percentage is not meaningful here.
              </p>
            )}
            {note && (
              <p className="muted" style={{ margin: "8px 0 0" }}>
                {note}
              </p>
            )}
          </div>
      </div>
    </main>
  );
}
