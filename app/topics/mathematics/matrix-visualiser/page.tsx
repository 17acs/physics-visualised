
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
    note: 'Leaves everything unchanged.',
  },
  {
    label: 'Stretch x',
    matrix: { a: 2, b: 0, c: 0, d: 1 },
    note: 'Doubles horizontal lengths, area scales by 2.',
  },
  {
    label: 'Stretch y',
    matrix: { a: 1, b: 0, c: 0, d: 2 },
    note: 'Doubles vertical lengths, area scales by 2.',
  },
  {
    label: 'Shear',
    matrix: { a: 1, b: 1.2, c: 0, d: 1 },
    note: 'Slants the plane without changing area.',
  },
  {
    label: 'Reflect x-axis',
    matrix: { a: 1, b: 0, c: 0, d: -1 },
    note: 'Flips orientation, so determinant is negative.',
  },
  {
    label: 'Rotate 90°',
    matrix: { a: 0, b: -1, c: 1, d: 0 },
    note: 'Rotates the plane while preserving area.',
  },
  {
    label: 'Det = 0',
    matrix: { a: 1, b: 2, c: 0.5, d: 1 },
    note: 'Everything falls apart.',
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
        padding: '10px 12px',
      }}
    >
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
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
    ? 'collapsed'
    : determinant > 0
      ? 'preserved'
      : 'reversed';

  const areaMessage = isSingular
    ? 'Area collapses to zero, so the matrix is singular and has no inverse.'
    : `Areas are scaled by ${fmt(Math.abs(determinant))}, with orientation ${orientation}.`;

  function updateEntry<K extends keyof Matrix>(key: K, value: string) {
    setMatrix((prev) => ({ ...prev, [key]: numberFromInput(value, prev[key]) }));
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
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
  style={{ marginBottom: -10 }}
>
  ← Back to Mathematics
</a>
      <section className="topicHeader" style={{ marginBottom: 1 }}>
        <div className="topicHeaderTitle">Matrix Transformations & Determinants</div>
        <div className="topicHeaderSub">
          It's useful to visualise a matrix transforming the plane, not just points in the plane.
        </div>
      </section>

      <section style={panelGridStyle}>
        <div className="card cardStrong" style={{ display: 'grid', gap: 16 }}>
          <div>
            <div className="h2" style={{ marginBottom: 6 }}>Matrix controls</div>
            <p className="p" style={{ margin: 0 }}>
              Edit the entries of{' '}
              <span className="monoBlock" style={{ display: 'inline-block', padding: '4px 8px' }}>
                [[a, b], [c, d]]
              </span>{' '}
              and see what it does to space.
            </p>
          </div>

          <div style={twoColStyle}>
            {([
              ['a', matrix.a],
              ['b', matrix.b],
              ['c', matrix.c],
              ['d', matrix.d],
            ] as const).map(([key, value]) => (
              <label key={key} className="control">
                <span className="controlLabel">{key}</span>
                <input
                  className="numInput"
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => updateEntry(key, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div>
            <div className="controlLabel" style={{ marginBottom: 8 }}>Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.05)',
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
            <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>{presetNote}</p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div className="controlLabel">Input a point</div>
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
              <InfoPill label="Singular / Invertible" value={isSingular ? 'Singular' : 'Invertible'} />
              <InfoPill label="Orientation" value={orientation} />
            </div>
            <InfoPill
              label="Vector image"
              value={`(${fmt(vector.x)}, ${fmt(vector.y)}) → (${fmt(transformedVector.x)}, ${fmt(transformedVector.y)})`}
            />
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="graphHeader" style={{ marginBottom: 10, display: 'grid', gap: 6, alignItems: 'start' }}>
            <div className="h2" style={{ marginBottom: 2 }}>Plane</div>
            <div className="graphHint" style={{ maxWidth: 560 }}>
              Transformed image is blue. The points Ai Aj and Av represent the inputted matrix A acting on the unit square where i = (1,0) and j = (0,1) as well as your inputted point
            </div>
          </div>

          <div className="graphBox" style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
            <svg
              viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="Matrix transformation visualiser"
            >
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
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth={n === 0 ? 1.8 : 1}
                    />
                    <line
                      x1={h1.x}
                      y1={h1.y}
                      x2={h2.x}
                      y2={h2.y}
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth={n === 0 ? 1.8 : 1}
                    />
                  </g>
                );
              })}

              {transformedVerticalLines.map((line, idx) => (
                <polyline
                  key={`tv-${idx}`}
                  points={linePoints(line.from, line.to)}
                  fill="none"
                  stroke="rgba(125,211,252,0.16)"
                  strokeWidth={1.1}
                />
              ))}

              {transformedHorizontalLines.map((line, idx) => (
                <polyline
                  key={`th-${idx}`}
                  points={linePoints(line.from, line.to)}
                  fill="none"
                  stroke="rgba(167,139,250,0.14)"
                  strokeWidth={1.1}
                />
              ))}

              <polygon
                points={polygonPoints(originalSquare)}
                fill="rgba(255,255,255,0.06)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={2}
              />

              <polygon
                points={polygonPoints(transformedSquare)}
                fill={isSingular ? 'rgba(236,72,153,0.18)' : 'rgba(125,211,252,0.18)'}
                stroke={isSingular ? 'rgba(236,72,153,0.85)' : 'rgba(125,211,252,0.92)'}
                strokeWidth={3}
              />

              <circle
                cx={toSvgPoint({ x: 1, y: 0 }).x}
                cy={toSvgPoint({ x: 1, y: 0 }).y}
                r={4.5}
                fill="rgba(255,255,255,0.82)"
              />
              <circle
                cx={toSvgPoint({ x: 0, y: 1 }).x}
                cy={toSvgPoint({ x: 0, y: 1 }).y}
                r={4.5}
                fill="rgba(255,255,255,0.82)"
              />
              <circle
                cx={toSvgPoint(vector).x}
                cy={toSvgPoint(vector).y}
                r={5}
                fill="rgba(255,255,255,0.82)"
              />

              <circle
                cx={toSvgPoint(transformedI).x}
                cy={toSvgPoint(transformedI).y}
                r={6}
                fill="var(--accent)"
              />
              <circle
                cx={toSvgPoint(transformedJ).x}
                cy={toSvgPoint(transformedJ).y}
                r={6}
                fill="var(--accent2)"
              />
              <circle
                cx={toSvgPoint(transformedVector).x}
                cy={toSvgPoint(transformedVector).y}
                r={6}
                fill="var(--accent3)"
              />
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
              <PointLegend color="rgba(255,255,255,0.82)" label="Original points" />
              <PointLegend color="var(--accent)" label="A i" />
              <PointLegend color="var(--accent2)" label="A j" />
              <PointLegend color="var(--accent3)" label="A v" />
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <div className="h2">Explanation</div>
        <p className="p" style={{ margin: 0 }}>
          The first column of the matrix you input becomes the image of <strong>i</strong> = (1, 0) and the second column becomes the image of
          <strong> j</strong> = (0, 1).
        </p>
        <p className="p" style={{ margin: 0 }}>
          The unit square has area 1. After the transformation it becomes a parallelogram, and its area is the determinant.
          That is why determinant measures area scale factor and whether orientation is preserved or reversed. This is all quite simple to visualise with the unit square, but gets tricky to understand when matrices act on matrices. I'll add that soon but I'm quite stumped on how to do it to be honest
        </p>
        <div className="eq">det(A) = ad − bc</div>
        <p className="p" style={{ margin: 0 }}>{areaMessage}</p>
        <p className="p" style={{ margin: 0 }}>
          When det(A) = 0, the square collapses into a lower-dimensional shape. That is why singular matrices are not invertible:
          different points get squashed onto the same line or point, so the mapping cannot be uniquely reversed.
        </p>
      </section>
    </main>
  );
}
