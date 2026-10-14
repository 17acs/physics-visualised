'use client';

import React, { useMemo, useState } from 'react';

type Vec = { x: number; y: number };
type Matrix = { a: number; b: number; c: number; d: number };

type Preset = {
  label: string;
  matrix: Matrix;
  note: string;
};

const PRESETS: Preset[] = [
  {
    label: 'Identity',
    matrix: { a: 1, b: 0, c: 0, d: 1 },
    note: 'Leaves the grid unchanged.',
  },
  {
    label: 'Stretch x',
    matrix: { a: 2, b: 0, c: 0, d: 1 },
    note: 'Doubles every x-coordinate. Areas double.',
  },
  {
    label: 'Stretch y',
    matrix: { a: 1, b: 0, c: 0, d: 2 },
    note: 'Doubles every y-coordinate. Areas double.',
  },
  {
    label: 'Shear x',
    matrix: { a: 1, b: 1.2, c: 0, d: 1 },
    note: 'Shifts x according to y. Area stays the same.',
  },
  {
    label: 'Rotate 45°',
    matrix: {
      a: Math.SQRT1_2,
      b: -Math.SQRT1_2,
      c: Math.SQRT1_2,
      d: Math.SQRT1_2,
    },
    note: 'Rotates the grid by 45°. Lengths and areas stay the same.',
  },
  {
    label: 'Reflect x-axis',
    matrix: { a: 1, b: 0, c: 0, d: -1 },
    note: 'Reflects the grid across the x-axis. The determinant is negative.',
  },
  {
    label: 'Rotate 90°',
    matrix: { a: 0, b: -1, c: 1, d: 0 },
    note: 'Rotates the grid by 90°. Area stays the same.',
  },
  {
    label: 'Project onto y = x',
    matrix: { a: 0.5, b: 0.5, c: 0.5, d: 0.5 },
    note: 'Sends every point onto the line y = x. det(A) = 0.',
  },
];

const VIEW_MIN = -6;
const VIEW_MAX = 6;
const VIEW_SIZE = 620;
const GRID_RANGE = 6;
const EPS = 1e-9;

function applyMatrix(m: Matrix, v: Vec): Vec {
  return {
    x: m.a * v.x + m.b * v.y,
    y: m.c * v.x + m.d * v.y,
  };
}

function det(m: Matrix): number {
  return m.a * m.d - m.b * m.c;
}

function matricesMatch(left: Matrix, right: Matrix) {
  return (Object.keys(left) as (keyof Matrix)[]).every(
    (key) => Math.abs(left[key] - right[key]) < EPS
  );
}

function toSvgPoint(v: Vec) {
  const scale = VIEW_SIZE / (VIEW_MAX - VIEW_MIN);
  return {
    x: (v.x - VIEW_MIN) * scale,
    y: VIEW_SIZE - (v.y - VIEW_MIN) * scale,
  };
}

function fmt(n: number) {
  if (Math.abs(n) < 1e-12) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.00$/, '');
}

function linePoints(p1: Vec, p2: Vec) {
  const s1 = toSvgPoint(p1);
  const s2 = toSvgPoint(p2);
  return `${s1.x},${s1.y} ${s2.x},${s2.y}`;
}

function polygonPoints(points: Vec[]) {
  return points
    .map((p) => {
      const s = toSvgPoint(p);
      return `${s.x},${s.y}`;
    })
    .join(' ');
}

function numberFromInput(value: string, fallback: number) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: '12px 14px',
      }}
    >
      <div className="muted" style={{ fontSize: 12, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function PointLegend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          display: 'inline-block',
        }}
      />
      <span>{label}</span>
    </div>
  );
}

export default function MatrixVisualiserPage() {
  const [matrix, setMatrix] = useState<Matrix>({ a: 1.6, b: 0.7, c: 0.4, d: 1.2 });
  const [vector, setVector] = useState<Vec>({ x: 2, y: 1 });
  const [presetNote, setPresetNote] = useState<string>(
    ''
  );

  const determinant = useMemo(() => det(matrix), [matrix]);
  const activePreset = useMemo(
    () => PRESETS.find((preset) => matricesMatch(matrix, preset.matrix)),
    [matrix]
  );
  const transformedI = useMemo(() => applyMatrix(matrix, { x: 1, y: 0 }), [matrix]);
  const transformedJ = useMemo(() => applyMatrix(matrix, { x: 0, y: 1 }), [matrix]);
  const transformedVector = useMemo(() => applyMatrix(matrix, vector), [matrix, vector]);

  const originalSquare = useMemo<Vec[]>(
    () => [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    []
  );

  const transformedSquare = useMemo<Vec[]>(
    () => [
      { x: 0, y: 0 },
      transformedI,
      { x: transformedI.x + transformedJ.x, y: transformedI.y + transformedJ.y },
      transformedJ,
    ],
    [transformedI, transformedJ]
  );

  const transformedVerticalLines = useMemo(() => {
    const lines: { from: Vec; to: Vec }[] = [];
    for (let x = -GRID_RANGE; x <= GRID_RANGE; x += 1) {
      lines.push({
        from: applyMatrix(matrix, { x, y: -GRID_RANGE }),
        to: applyMatrix(matrix, { x, y: GRID_RANGE }),
      });
    }
    return lines;
  }, [matrix]);

  const transformedHorizontalLines = useMemo(() => {
    const lines: { from: Vec; to: Vec }[] = [];
    for (let y = -GRID_RANGE; y <= GRID_RANGE; y += 1) {
      lines.push({
        from: applyMatrix(matrix, { x: -GRID_RANGE, y }),
        to: applyMatrix(matrix, { x: GRID_RANGE, y }),
      });
    }
    return lines;
  }, [matrix]);

  const isSingular = Math.abs(determinant) < EPS;
  const orientation = isSingular
    ? 'not defined'
    : determinant > 0
      ? 'same'
      : 'reversed';

  const areaMessage = isSingular
    ? 'The area is 0. A is singular, so it has no inverse.'
    : determinant > 0
      ? `Area is multiplied by ${fmt(Math.abs(determinant))}. Orientation stays the same.`
      : `Area is multiplied by ${fmt(Math.abs(determinant))}. Orientation is reversed.`;
  const inverse = isSingular
    ? null
    : {
        a: matrix.d / determinant,
        b: -matrix.b / determinant,
        c: -matrix.c / determinant,
        d: matrix.a / determinant,
      };

  function updateEntry<K extends keyof Matrix>(key: K, value: string) {
    setMatrix((prev) => ({ ...prev, [key]: numberFromInput(value, prev[key]) }));
    setPresetNote('');
  }

  function updateVector<K extends keyof Vec>(key: K, value: string) {
    setVector((prev) => ({ ...prev, [key]: numberFromInput(value, prev[key]) }));
  }

  function applyPreset(preset: Preset) {
    setMatrix(preset.matrix);
    setPresetNote(preset.note);
  }

  const panelGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
    gap: 18,
    alignItems: 'start',
  };

  const twoColStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  };

  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <a
        href="/topics/mathematics"
        className="backLink"
      >
        ← Back to Mathematics
      </a>
      <section className="topicHeader" style={{ marginTop: 0, marginBottom: 16 }}>
        <h1 className="topicHeaderTitle">2D Matrix Transformations</h1>
        <div className="topicHeaderSub">
          Change the numbers in a 2 × 2 matrix to see what happens to the grid.
        </div>
      </section>

      <section style={panelGridStyle}>
        <div className="card cardStrong" style={{ display: 'grid', gap: 16 }}>
          <div>
            <div className="h2" style={{ marginBottom: 6 }}>Matrix</div>
            <p className="p" style={{ margin: 0 }}>
              The first column is <strong>Ai</strong>. The second is <strong>Aj</strong>.
            </p>
          </div>

          <div
            aria-label={`Matrix A: ${fmt(matrix.a)}, ${fmt(matrix.b)}, ${fmt(matrix.c)}, ${fmt(matrix.d)}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <strong style={{ fontSize: 20 }}>A =</strong>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(90px, 1fr))',
                gap: 8,
                padding: '10px 14px',
                borderLeft: '2px solid var(--muted)',
                borderRight: '2px solid var(--muted)',
                borderRadius: 8,
              }}
            >
              {([
                ['a', matrix.a],
                ['b', matrix.b],
                ['c', matrix.c],
                ['d', matrix.d],
              ] as const).map(([key, value]) => (
                <label key={key}>
                  <span className="muted" style={{ display: 'block', fontSize: 11, marginBottom: 3 }}>
                    {key}
                  </span>
                  <input
                    aria-label={`Matrix entry ${key}`}
                    className="numInput"
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => updateEntry(key, e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="controlLabel" style={{ marginBottom: 8 }}>Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={activePreset?.label === preset.label}
                  style={{
                    border: activePreset?.label === preset.label
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                    background: activePreset?.label === preset.label
                      ? 'rgba(125,211,252,0.14)'
                      : 'rgba(255,255,255,0.05)',
                    color: 'var(--text)',
                    borderRadius: 999,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 10, marginBottom: 0, minHeight: '1.5em' }}>
              {presetNote || activePreset?.note || 'Custom matrix.'}
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <div className="controlLabel">Try a vector</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                Enter v = (x, y). The graph also shows Av.
              </div>
            </div>
            <div style={twoColStyle}>
              <label className="control">
                <span className="controlLabel">x</span>
                <input
                  className="numInput"
                  type="number"
                  step="0.1"
                  value={vector.x}
                  onChange={(e) => updateVector('x', e.target.value)}
                />
              </label>
              <label className="control">
                <span className="controlLabel">y</span>
                <input
                  className="numInput"
                  type="number"
                  step="0.1"
                  value={vector.y}
                  onChange={(e) => updateVector('y', e.target.value)}
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <InfoPill label="det(A) = ad − bc" value={fmt(determinant)} />
            <div style={twoColStyle}>
              <InfoPill label="Area scale factor" value={fmt(Math.abs(determinant))} />
              <InfoPill label="Orientation" value={orientation} />
            </div>
            <InfoPill
              label="Vector transformation"
              value={`(${fmt(vector.x)}, ${fmt(vector.y)}) → (${fmt(transformedVector.x)}, ${fmt(transformedVector.y)})`}
            />
            <InfoPill
              label="Inverse"
              value={inverse
                ? `[[${fmt(inverse.a)}, ${fmt(inverse.b)}], [${fmt(inverse.c)}, ${fmt(inverse.d)}]]`
                : 'Does not exist'}
            />
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="graphHeader" style={{ marginBottom: 10, display: 'grid', gap: 6, alignItems: 'start' }}>
            <div className="h2" style={{ marginBottom: 2 }}>Grid</div>
            <div className="graphHint" style={{ maxWidth: 560 }}>
              The original grid and vectors are white. Their transformed versions are coloured.
            </div>
          </div>

          <div
            className="graphBox"
            style={{
              width: '100%',
              maxWidth: 720,
              margin: '0 auto',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'radial-gradient(circle at 50% 45%, rgba(125,211,252,0.045), rgba(0,0,0,0.16) 68%)',
            }}
          >
            <svg
              viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="Matrix transformation visualiser"
            >
              <defs>
                <marker id="arrow-white" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.75)" />
                </marker>
                <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
                </marker>
                <marker id="arrow-violet" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent2)" />
                </marker>
                <marker id="arrow-pink" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent3)" />
                </marker>
              </defs>
              <rect x="0" y="0" width={VIEW_SIZE} height={VIEW_SIZE} fill="transparent" />

              {Array.from({ length: GRID_RANGE * 2 + 1 }, (_, idx) => idx - GRID_RANGE).map((n) => {
                const v1 = toSvgPoint({ x: n, y: VIEW_MIN });
                const v2 = toSvgPoint({ x: n, y: VIEW_MAX });
                const h1 = toSvgPoint({ x: VIEW_MIN, y: n });
                const h2 = toSvgPoint({ x: VIEW_MAX, y: n });
                return (
                  <g key={`base-${n}`}>
                    <line
                      x1={v1.x}
                      y1={v1.y}
                      x2={v2.x}
                      y2={v2.y}
                      stroke={n === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.055)'}
                      strokeWidth={n === 0 ? 1.2 : 0.8}
                    />
                    <line
                      x1={h1.x}
                      y1={h1.y}
                      x2={h2.x}
                      y2={h2.y}
                      stroke={n === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.055)'}
                      strokeWidth={n === 0 ? 1.2 : 0.8}
                    />
                  </g>
                );
              })}

              {transformedVerticalLines.map((line, idx) => (
                <polyline
                  key={`tv-${idx}`}
                  points={linePoints(line.from, line.to)}
                  fill="none"
                  stroke="rgba(125,211,252,0.14)"
                  strokeWidth={0.9}
                />
              ))}

              {transformedHorizontalLines.map((line, idx) => (
                <polyline
                  key={`th-${idx}`}
                  points={linePoints(line.from, line.to)}
                  fill="none"
                  stroke="rgba(167,139,250,0.12)"
                  strokeWidth={0.9}
                />
              ))}

              <polygon
                points={polygonPoints(originalSquare)}
                fill="rgba(255,255,255,0.06)"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1.2}
              />

              <polygon
                points={polygonPoints(transformedSquare)}
                fill={isSingular ? 'rgba(236,72,153,0.12)' : 'rgba(125,211,252,0.11)'}
                stroke={isSingular ? 'rgba(236,72,153,0.75)' : 'rgba(125,211,252,0.72)'}
                strokeWidth={1.6}
              />

              <line
                x1={toSvgPoint({ x: 0, y: 0 }).x}
                y1={toSvgPoint({ x: 0, y: 0 }).y}
                x2={toSvgPoint(vector).x}
                y2={toSvgPoint(vector).y}
                stroke="rgba(255,255,255,0.58)"
                strokeWidth={1.4}
                strokeDasharray="5 5"
                strokeLinecap="round"
                markerEnd="url(#arrow-white)"
              />
              <line
                x1={toSvgPoint({ x: 0, y: 0 }).x}
                y1={toSvgPoint({ x: 0, y: 0 }).y}
                x2={toSvgPoint(transformedI).x}
                y2={toSvgPoint(transformedI).y}
                stroke="var(--accent)"
                strokeWidth={2}
                strokeLinecap="round"
                markerEnd="url(#arrow-cyan)"
              />
              <line
                x1={toSvgPoint({ x: 0, y: 0 }).x}
                y1={toSvgPoint({ x: 0, y: 0 }).y}
                x2={toSvgPoint(transformedJ).x}
                y2={toSvgPoint(transformedJ).y}
                stroke="var(--accent2)"
                strokeWidth={2}
                strokeLinecap="round"
                markerEnd="url(#arrow-violet)"
              />
              <line
                x1={toSvgPoint({ x: 0, y: 0 }).x}
                y1={toSvgPoint({ x: 0, y: 0 }).y}
                x2={toSvgPoint(transformedVector).x}
                y2={toSvgPoint(transformedVector).y}
                stroke="var(--accent3)"
                strokeWidth={2}
                strokeLinecap="round"
                markerEnd="url(#arrow-pink)"
              />

              <circle
                cx={toSvgPoint({ x: 0, y: 0 }).x}
                cy={toSvgPoint({ x: 0, y: 0 }).y}
                r={2.5}
                fill="rgba(255,255,255,0.8)"
              />

              <text
                x={toSvgPoint({ x: 5.65, y: -0.28 }).x}
                y={toSvgPoint({ x: 5.65, y: -0.28 }).y}
                fill="rgba(255,255,255,0.48)"
                fontSize={13}
              >
                x
              </text>
              <text
                x={toSvgPoint({ x: 0.2, y: 5.55 }).x}
                y={toSvgPoint({ x: 0.2, y: 5.55 }).y}
                fill="rgba(255,255,255,0.48)"
                fontSize={13}
              >
                y
              </text>

              {(() => {
                const labels = [
                  { point: transformedI, label: 'Ai', color: 'var(--accent)' },
                  { point: transformedJ, label: 'Aj', color: 'var(--accent2)' },
                  { point: transformedVector, label: 'Av', color: 'var(--accent3)' },
                ];
                const placed: { x: number; y: number }[] = [];
                return labels.map(({ point, label, color }) => {
                  const position = toSvgPoint(point);
                  let y = position.y - 9;
                  const collisions = placed.filter(
                    (other) => Math.hypot(position.x - other.x, position.y - other.y) < 22
                  ).length;
                  y += 22 * collisions;
                  placed.push({ x: position.x, y: position.y });
                  return (
                    <text
                      key={label}
                      x={position.x + 9}
                      y={y}
                      fill={color}
                      fontSize={14}
                      fontWeight={800}
                      paintOrder="stroke"
                      stroke="rgba(3,4,13,0.9)"
                      strokeWidth={4}
                      strokeLinejoin="round"
                    >
                      {label}
                    </text>
                  );
                });
              })()}
            </svg>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'center',
                marginTop: 12,
                fontSize: 13,
              }}
            >
              <PointLegend color="rgba(255,255,255,0.72)" label="Original" />
              <PointLegend color="var(--accent)" label="Ai (first column)" />
              <PointLegend color="var(--accent2)" label="Aj (second column)" />
              <PointLegend color="var(--accent3)" label="Av (test vector)" />
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <div className="h2">What the graph shows</div>
        <p className="p" style={{ margin: 0 }}>
          Multiplying i = (1, 0) by A gives the first column of A.
          Multiplying j = (0, 1) by A gives the second column.
        </p>
        <p className="p" style={{ margin: 0 }}>
          The white square has area 1. After multiplying by A, it becomes the coloured
          parallelogram. Its area is <strong>|det(A)|</strong>. A negative determinant
          means the grid has also been reflected.
        </p>
        <div className="eq">det(A) = ad − bc</div>
        <p className="p" style={{ margin: 0 }}>{areaMessage}</p>
        <p className="p" style={{ margin: 0 }}>
          If det(A) = 0, the parallelogram becomes a line or a point. A then has no
          inverse because more than one input can give the same output.
        </p>
      </section>
    </main>
  );
}
