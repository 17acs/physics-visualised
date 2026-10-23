"use client";

import { useEffect, useState } from "react";
import {
  CORNERS,
  GRADIENT,
  OPTIMAL_Z,
  POLY,
  SCENES,
  X_MAX,
  Y_MAX,
  dictionary,
  fmtNum,
  here,
  isZero,
  lineSegment,
  programView,
  rat,
  ratioRows,
  samePoint,
  valueOf,
  valueRat,
} from "./math";
import type { Point, Rat, Scene, Tableau, Term } from "./math";

const PROGRAM = programView(SCENES[0].tableau);

const RULES = [
  {
    title: "A corner is a basis",
    body: "Three equations give three basic variables. Their columns form the identity, so the value column is their solution and every other variable is zero. That point is a corner. At the start the basics are the slacks, x and y are zero, and the corner is the origin. Each pivot swaps one basic variable for the entering one.",
  },
  {
    title: "The top row chooses the edge",
    body: "The top row is the objective with its variables moved to the left. At the start it reads z − 3x − 5y = 0. A negative number under a variable means z rises if that variable rises, by the size of that number per unit. The most negative number enters. This is Dantzig’s rule. Basic columns carry a zero there, so only nonbasic variables compete. The contest is per unit of each variable, so an edge that looks steeper on the page can still lose.",
  },
  {
    title: "The ratio test chooses the step",
    body: "Along the chosen edge the other nonbasic variables stay zero. A positive entry in the pivot column means that basic variable is falling, and it hits zero at value ÷ entry. The smallest positive ratio is the longest step that stays inside the polygon. That row leaves. Divide it by the pivot and clear the rest of the column. The new identity is the next corner. Stop when every top-row entry is zero or positive. Those slack entries are then the shadow prices: how much optimal z would rise if that constraint’s right-hand side grew by one.",
  },
];

const CELL = 64;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 36;
const VW = PAD_L + PAD_R + X_MAX * CELL;
const VH = PAD_T + PAD_B + Y_MAX * CELL;

function X(x: number) {
  return PAD_L + x * CELL;
}
function Y(y: number) {
  return PAD_T + (Y_MAX - y) * CELL;
}

function VarName({ name }: { name: string }) {
  return <var className={`sx-v sx-v-${name}`}>{name}</var>;
}

function Frac({ r }: { r: Rat }) {
  if (r.n === 0) return <span className="sx-int">0</span>;
  const sign = r.n < 0 ? "−" : "";
  if (r.d === 1) {
    return (
      <span className="sx-int">
        {sign}
        {Math.abs(r.n)}
      </span>
    );
  }
  return (
    <span className="sx-frac">
      {sign ? <span className="sx-sign">{sign}</span> : null}
      <span className="sx-stack">
        <span>{Math.abs(r.n)}</span>
        <span>{r.d}</span>
      </span>
    </span>
  );
}

function Term({ c, name, leading }: { c: Rat; name: string; leading: boolean }) {
  const negative = c.n < 0;
  const abs = rat(Math.abs(c.n), c.d);
  const one = abs.n === 1 && abs.d === 1;
  return (
    <span className="sx-term">
      {!leading || negative ? <span className="sx-op">{negative ? "−" : "+"}</span> : null}
      {one ? null : <Frac r={abs} />}
      <VarName name={name} />
    </span>
  );
}

function Equation({
  lead,
  terms,
  rhs,
  rel = "=",
}: {
  lead: string | null;
  terms: Term[];
  rhs: Rat;
  rel?: string;
}) {
  const shown = terms.filter((t) => !isZero(t.c));
  return (
    <div className="sx-eq">
      {lead ? <VarName name={lead} /> : null}
      {shown.map((term, i) => (
        <Term key={term.name} c={term.c} name={term.name} leading={!lead && i === 0} />
      ))}
      <span className="sx-op">{rel}</span>
      <Frac r={rhs} />
    </div>
  );
}

function ExprLine({ lhs, constant, terms }: { lhs: string; constant: Rat; terms: Term[] }) {
  const shown = terms.filter((t) => !isZero(t.c));
  const showConstant = !isZero(constant) || shown.length === 0;
  return (
    <div className="sx-eq">
      <VarName name={lhs} />
      <span className="sx-op">=</span>
      {showConstant ? <Frac r={constant} /> : null}
      {shown.map((term, i) => (
        <Term key={term.name} c={term.c} name={term.name} leading={!showConstant && i === 0} />
      ))}
    </div>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 2.4,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const h = Math.hypot(dx, dy) || 1;
  const ux = dx / h;
  const uy = dy / h;
  const head = 12;
  const wing = 5.5;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${bx - uy * wing},${by + ux * wing} ${bx + uy * wing},${by - ux * wing}`}
        fill={color}
      />
    </g>
  );
}

function Chip({
  x,
  y,
  text,
  anchor = "start",
  fill = "rgba(255,255,255,0.92)",
  size = 12,
}: {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  size?: number;
}) {
  const width = Math.ceil(text.length * size * 0.58) + 12;
  const height = size + 8;
  const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const top = y - height + 4;
  const textX = anchor === "middle" ? x : anchor === "end" ? left + width - 6 : left + 6;
  return (
    <g pointerEvents="none">
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={7}
        fill="rgba(5,7,18,0.92)"
        stroke="rgba(255,255,255,0.16)"
      />
      <text
        x={textX}
        y={top + height / 2 + size * 0.34}
        textAnchor={anchor === "middle" ? "middle" : anchor}
        fontSize={size}
        fill={fill}
        fontFamily="var(--font-sans), sans-serif"
      >
        {text}
      </text>
    </g>
  );
}

function gradientTip(from: Point): Point {
  const h = Math.hypot(GRADIENT.x, GRADIENT.y);
  const ux = GRADIENT.x / h;
  const uy = GRADIENT.y / h;
  const roomX = (X_MAX - 0.3 - from.x) / ux;
  const roomY = (Y_MAX - 0.3 - from.y) / uy;
  const len = Math.max(0.62, Math.min(1.45, roomX, roomY));
  return { x: from.x + ux * len, y: from.y + uy * len };
}

function clipEnd(from: Point, to: Point): { at: Point; clipped: boolean } {
  const inside =
    to.x >= -1e-8 && to.y >= -1e-8 && to.x <= X_MAX + 1e-8 && to.y <= Y_MAX + 1e-8;
  if (inside) return { at: to, clipped: false };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let t = 1;
  if (dy > 1e-12) t = Math.min(t, (Y_MAX - from.y) / dy);
  if (dy < -1e-12) t = Math.min(t, (0 - from.y) / dy);
  if (dx > 1e-12) t = Math.min(t, (X_MAX - from.x) / dx);
  if (dx < -1e-12) t = Math.min(t, (0 - from.x) / dx);
  t = Math.max(0, Math.min(1, t));
  return { at: { x: from.x + dx * t, y: from.y + dy * t }, clipped: true };
}

const WALLS = [
  { a: 1, b: 0, c: 4, label: "x = 4", x: 4.2, y: 2.15, anchor: "start" as const },
  { a: 0, b: 1, c: 6, label: "2y = 12", x: 4.85, y: 6.62, anchor: "end" as const },
  { a: 3, b: 2, c: 18, label: "3x + 2y = 18", x: 3.7, y: 4.95, anchor: "middle" as const },
];

const Z_OFFSET: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  "0,0": { dx: 16, dy: -4, anchor: "start" },
  "4,0": { dx: 8, dy: -18, anchor: "start" },
  "4,3": { dx: 14, dy: -4, anchor: "start" },
  "0,6": { dx: 18, dy: 46, anchor: "start" },
  "2,6": { dx: 0, dy: 44, anchor: "middle" },
};

function Polygon({ scene, onJump }: { scene: Scene; onJump: (id: string) => void }) {
  const place = here(scene);
  const zNow = valueOf(scene.tableau, "z");
  const currentLevel = zNow > 0.05 ? lineSegment(3, 5, zNow) : null;
  const optimalLevel = Math.abs(zNow - OPTIMAL_Z) > 0.05 ? lineSegment(3, 5, OPTIMAL_Z) : null;
  const tip = gradientTip(place);

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      role="group"
      aria-label={`Feasible polygon. Current corner x = ${fmtNum(place.x)}, y = ${fmtNum(place.y)}, z = ${fmtNum(zNow)}.`}
    >
      <rect
        x={PAD_L}
        y={PAD_T}
        width={X_MAX * CELL}
        height={Y_MAX * CELL}
        fill="rgba(0,0,0,0.22)"
        stroke="rgba(255,255,255,0.18)"
      />
      {Array.from({ length: X_MAX - 1 }, (_, i) => i + 1).map((x) => (
        <line
          key={`gx-${x}`}
          x1={X(x)}
          y1={Y(0)}
          x2={X(x)}
          y2={Y(Y_MAX)}
          stroke="rgba(255,255,255,0.07)"
        />
      ))}
      {Array.from({ length: Y_MAX - 1 }, (_, i) => i + 1).map((y) => (
        <line
          key={`gy-${y}`}
          x1={X(0)}
          y1={Y(y)}
          x2={X(X_MAX)}
          y2={Y(y)}
          stroke="rgba(255,255,255,0.07)"
        />
      ))}
      {WALLS.map((wall) => {
        const seg = lineSegment(wall.a, wall.b, wall.c);
        if (!seg) return null;
        return (
          <line
            key={wall.label}
            x1={X(seg[0].x)}
            y1={Y(seg[0].y)}
            x2={X(seg[1].x)}
            y2={Y(seg[1].y)}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.4}
            strokeDasharray="5 4"
          />
        );
      })}
      <polygon
        points={POLY.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}
        fill="rgba(125,211,252,0.28)"
        stroke="rgba(125,211,252,0.92)"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {optimalLevel ? (
        <line
          x1={X(optimalLevel[0].x)}
          y1={Y(optimalLevel[0].y)}
          x2={X(optimalLevel[1].x)}
          y2={Y(optimalLevel[1].y)}
          stroke="rgba(249,168,212,0.45)"
          strokeWidth={1.6}
          strokeDasharray="7 5"
        />
      ) : null}
      {currentLevel ? (
        <line
          x1={X(currentLevel[0].x)}
          y1={Y(currentLevel[0].y)}
          x2={X(currentLevel[1].x)}
          y2={Y(currentLevel[1].y)}
          stroke="#f9a8d4"
          strokeWidth={2}
          strokeDasharray="7 5"
        />
      ) : null}
      {scene.trail.length > 1 ? (
        <polyline
          points={scene.trail.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {scene.walk
        ? scene.beyond.map((mark) => {
            const end = clipEnd(scene.walk!.to, mark.at);
            return (
              <g key={mark.label}>
                <line
                  x1={X(scene.walk!.to.x)}
                  y1={Y(scene.walk!.to.y)}
                  x2={X(end.at.x)}
                  y2={Y(end.at.y)}
                  stroke="rgba(251,191,36,0.75)"
                  strokeWidth={2}
                  strokeDasharray="3 5"
                />
                {end.clipped ? null : (
                  <circle
                    cx={X(mark.at.x)}
                    cy={Y(mark.at.y)}
                    r={5}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={1.6}
                  />
                )}
              </g>
            );
          })
        : null}
      {scene.walk ? (
        <line
          x1={X(scene.walk.from.x)}
          y1={Y(scene.walk.from.y)}
          x2={X(scene.walk.to.x)}
          y2={Y(scene.walk.to.y)}
          stroke="#fbbf24"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}
      {scene.arrow ? (
        <Arrow
          x1={X(scene.arrow.from.x)}
          y1={Y(scene.arrow.from.y)}
          x2={X(scene.arrow.to.x)}
          y2={Y(scene.arrow.to.y)}
          color="#fbbf24"
        />
      ) : null}
      <Arrow x1={X(place.x)} y1={Y(place.y)} x2={X(tip.x)} y2={Y(tip.y)} color="#f9a8d4" width={2} />
      {CORNERS.map((corner) => {
        const key = `${corner.x},${corner.y}`;
        const current = samePoint(corner, place);
        const visited = scene.trail.some((p) => samePoint(p, corner));
        const offset = Z_OFFSET[key] ?? { dx: 8, dy: -12, anchor: "start" as const };
        return (
          <g key={key}>
            {current ? (
              <circle cx={X(corner.x)} cy={Y(corner.y)} r={14} fill="none" stroke="rgba(125,211,252,0.45)" strokeWidth={2} />
            ) : null}
            <circle
              cx={X(corner.x)}
              cy={Y(corner.y)}
              r={current ? 7 : 5}
              fill={visited || current ? "#7dd3fc" : "rgba(7,8,21,0.65)"}
              stroke={visited || current ? "#e0f2fe" : "rgba(255,255,255,0.75)"}
              strokeWidth={current ? 2 : 1.5}
            />
            <Chip
              x={X(corner.x) + offset.dx}
              y={Y(corner.y) + offset.dy}
              anchor={offset.anchor}
              fill={current ? "#f9a8d4" : "rgba(255,255,255,0.88)"}
              text={`z = ${corner.z}`}
            />
          </g>
        );
      })}
      {scene.walk ? (
        <circle
          cx={X(scene.walk.to.x)}
          cy={Y(scene.walk.to.y)}
          r={11}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={2}
        />
      ) : null}
      {WALLS.map((wall) => (
        <Chip key={wall.label} x={X(wall.x)} y={Y(wall.y)} anchor={wall.anchor} text={wall.label} />
      ))}
      {scene.walk
        ? scene.beyond.map((mark) => {
            const end = clipEnd(scene.walk!.to, mark.at);
            const below = !end.clipped && mark.at.y >= 5;
            return (
              <Chip
                key={`lab-${mark.label}`}
                x={X(end.at.x) + (end.clipped ? 8 : below ? -10 : 12)}
                y={Y(end.at.y) + (end.clipped ? 18 : below ? 20 : -8)}
                anchor={below ? "end" : "start"}
                fill="#fde68a"
                text={mark.label}
              />
            );
          })
        : null}
      {scene.arrow ? (
        <Chip
          x={X(scene.arrow.to.x) + 8}
          y={Y(scene.arrow.to.y) + 14}
          fill="#fde68a"
          text={scene.arrow.label}
        />
      ) : null}
      {Array.from({ length: X_MAX }, (_, i) => i + 1).map((x) => (
        <text
          key={`tx-${x}`}
          x={X(x)}
          y={Y(0) + 18}
          textAnchor="middle"
          fontSize={12}
          fill="rgba(255,255,255,0.55)"
          fontFamily="var(--font-sans), sans-serif"
        >
          {x}
        </text>
      ))}
      {Array.from({ length: Y_MAX }, (_, i) => i + 1).map((y) => (
        <text
          key={`ty-${y}`}
          x={X(0) - 8}
          y={Y(y) + 4}
          textAnchor="end"
          fontSize={12}
          fill="rgba(255,255,255,0.55)"
          fontFamily="var(--font-sans), sans-serif"
        >
          {y}
        </text>
      ))}
      <text
        x={X(0) - 8}
        y={Y(0) + 4}
        textAnchor="end"
        fontSize={12}
        fill="rgba(255,255,255,0.55)"
        fontFamily="var(--font-sans), sans-serif"
      >
        0
      </text>
      <text
        x={X(X_MAX) - 4}
        y={Y(0) - 8}
        textAnchor="end"
        fontSize={16}
        fontStyle="italic"
        fontFamily="ui-serif, Georgia, serif"
        fill="rgba(255,255,255,0.84)"
      >
        x
      </text>
      <text
        x={13}
        y={(Y(0) + Y(Y_MAX)) / 2}
        textAnchor="middle"
        fontSize={16}
        fontStyle="italic"
        fontFamily="ui-serif, Georgia, serif"
        fill="rgba(255,255,255,0.84)"
        transform={`rotate(-90 13 ${(Y(0) + Y(Y_MAX)) / 2})`}
      >
        y
      </text>
      {CORNERS.map((corner) => {
        const label = `Corner (${corner.x}, ${corner.y}), z = ${corner.z}. ${
          corner.sceneId ? "Show the tableau at this corner." : "Feasible corner off this walk."
        }`;
        if (!corner.sceneId) {
          return (
            <g key={`hit-${corner.x}-${corner.y}`} role="img" aria-label={label}>
              <circle cx={X(corner.x)} cy={Y(corner.y)} r={14} fill="transparent" />
            </g>
          );
        }
        return (
          <g
            key={`hit-${corner.x}-${corner.y}`}
            className="sx-hit"
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={() => onJump(corner.sceneId!)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onJump(corner.sceneId!);
              }
            }}
          >
            <circle className="sx-ring" cx={X(corner.x)} cy={Y(corner.y)} r={16} fill="transparent" stroke="transparent" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}

function roleOf(tab: Tableau, name: "x" | "y" | "s" | "t" | "u" | "z") {
  if (name === "z") return "objective";
  return tab.basics.includes(name) ? "basic" : "nonbasic";
}

function Readout({ tab }: { tab: Tableau }) {
  const names = ["x", "y", "s", "t", "u", "z"] as const;
  return (
    <div className="sx-read">
      {names.map((name) => (
        <div key={name} className="sx-chip">
          <div className="sx-chip-top">
            <VarName name={name} />
            <span>{roleOf(tab, name)}</span>
          </div>
          <Frac r={valueRat(tab, name)} />
        </div>
      ))}
    </div>
  );
}

function cellClass(r: Rat, flags: { hotCol: boolean; hotRow: boolean; pivot: boolean; zRow: boolean; value: boolean }) {
  const names = ["sx-td"];
  if (flags.value) names.push("sx-val");
  if (flags.hotCol) names.push("sx-hotcol");
  if (flags.hotRow) names.push("sx-hotrow");
  if (flags.pivot) names.push("sx-pivot");
  if (!flags.pivot && isZero(r)) names.push("sx-zero");
  if (!flags.pivot && flags.zRow && r.n < 0) names.push("sx-neg");
  return names.join(" ");
}

function TableauCard({ scene }: { scene: Scene }) {
  const tab = scene.tableau;
  const ratios = scene.showRatios && scene.pivotCol !== null ? ratioRows(tab, scene.pivotCol) : null;
  const maxRatio = Math.max(1, ...(ratios ?? []).map((row) => row.value ?? 0));
  const rows = dictionary(tab);

  return (
    <section className="card" aria-labelledby="simplex-grid-title">
      <h2 id="simplex-grid-title" className="sx-title">
        The tableau
      </h2>
      <p className="sx-note">
        Rose numbers in the top row would raise z. The value column is the basic solution. Textbooks call it the right-hand side.
      </p>
      <div className="sx-sheet">
        <table className="sx-table">
          <caption className="sx-sr">Simplex tableau for the current corner</caption>
          <thead>
            <tr>
              <th scope="col" className="sx-basis">
                Basis
              </th>
              {tab.cols.map((col, j) => (
                <th key={col} scope="col" className={scene.pivotCol === j ? "sx-hotcol" : undefined}>
                  <VarName name={col} />
                  {scene.pivotCol === j ? <span className="sx-tag">enters</span> : null}
                </th>
              ))}
              <th scope="col">Value</th>
              {ratios ? <th scope="col">Ratio</th> : null}
            </tr>
          </thead>
          <tbody>
            <tr className="sx-zrow">
              <th scope="row" className="sx-basis">
                <VarName name="z" />
              </th>
              {tab.z.slice(0, -1).map((cell, j) => (
                <td
                  key={tab.cols[j]}
                  className={cellClass(cell, {
                    hotCol: scene.pivotCol === j,
                    hotRow: false,
                    pivot: false,
                    zRow: true,
                    value: false,
                  })}
                >
                  <Frac r={cell} />
                </td>
              ))}
              <td className="sx-td sx-val">
                <Frac r={tab.z[tab.z.length - 1]} />
              </td>
              {ratios ? <td className="sx-td" /> : null}
            </tr>
            {tab.rows.map((row, i) => (
              <tr key={tab.basics[i]}>
                <th scope="row" className={`sx-basis ${scene.pivotRow === i ? "sx-hotrow" : ""}`}>
                  <VarName name={tab.basics[i]} />
                  {scene.pivotRow === i ? <span className="sx-tag sx-tag-out">leaves</span> : null}
                  {tab.basics[i] === scene.freshBasic ? <span className="sx-tag sx-tag-in">entered</span> : null}
                </th>
                {row.slice(0, -1).map((cell, j) => (
                  <td
                    key={tab.cols[j]}
                    className={cellClass(cell, {
                      hotCol: scene.pivotCol === j,
                      hotRow: scene.pivotRow === i,
                      pivot: scene.pivotCol === j && scene.pivotRow === i,
                      zRow: false,
                      value: false,
                    })}
                  >
                    <Frac r={cell} />
                  </td>
                ))}
                <td
                  className={cellClass(row[row.length - 1], {
                    hotCol: false,
                    hotRow: scene.pivotRow === i,
                    pivot: false,
                    zRow: false,
                    value: true,
                  })}
                >
                  <Frac r={row[row.length - 1]} />
                </td>
                {ratios ? (
                  <td className={`sx-td sx-ratio ${ratios[i].chosen ? "is-chosen" : ""}`}>
                    {ratios[i].value === null ? "—" : fmtNum(ratios[i].value)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ratios ? (
        <div className="sx-bars" aria-label="Ratio test">
          <h3 className="sx-h3">How far the entering variable can move</h3>
          {ratios.map((row) => (
            <div key={row.basic} className={`sx-bar ${row.chosen ? "is-chosen" : ""}`}>
              <span className="sx-bar-name">
                <VarName name={row.basic} />
              </span>
              <span className="sx-track">
                {row.value === null ? null : (
                  <span className="sx-fill" style={{ width: `${(row.value / maxRatio) * 100}%` }} />
                )}
              </span>
              <span className="sx-bar-val">{row.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      <h3 className="sx-h3">The same rows, solved for the basics</h3>
      <p className="sx-note">
        Each equation is solved for its basic variable. Moving a term across the tableau flips its sign, so a positive coefficient in the z equation is a gain.
      </p>
      <div className="sx-dict">
        {rows.map((row) => (
          <ExprLine key={row.lhs} lhs={row.lhs} constant={row.constant} terms={row.terms} />
        ))}
      </div>
    </section>
  );
}

export default function SimplexLesson() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scene = SCENES[index];
  const place = here(scene);
  const atEnd = index === SCENES.length - 1;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      setPlaying(false);
      setIndex((i) => {
        if (event.key === "ArrowRight") return Math.min(SCENES.length - 1, i + 1);
        return Math.max(0, i - 1);
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (index >= SCENES.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setIndex((i) => Math.min(SCENES.length - 1, i + 1));
    }, 4800);
    return () => window.clearTimeout(timer);
  }, [playing, index]);

  function go(delta: number) {
    setPlaying(false);
    setIndex((i) => Math.min(SCENES.length - 1, Math.max(0, i + delta)));
  }

  function jump(id: string) {
    const next = SCENES.findIndex((item) => item.id === id);
    if (next < 0) return;
    setPlaying(false);
    setIndex(next);
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (atEnd) setIndex(0);
    setPlaying(true);
  }

  return (
    <main className="page sx-page">
      <a href="/topics/mathematics" className="backLink">
        ← Back to Mathematics
      </a>

      <header className="sx-hero">
        <h1 className="topicHeaderTitle">Simplex and optimisation</h1>
        <p className="heroText">
          A linear program maximises a linear function over a polygon cut out by linear inequalities. The best value is attained at a corner. Simplex starts at a corner and walks along edges to better ones. The tableau is that corner written as a linear system, so each step is one pivot: a division, then a few subtractions.
        </p>
      </header>

      <section className="card sx-problem" aria-labelledby="simplex-program">
        <div className="sx-split">
          <div>
            <h2 id="simplex-program" className="sx-title">
              The program
            </h2>
            <div className="sx-eq">
              <span className="sx-word">maximise</span>
              <VarName name="z" />
              <span className="sx-op">=</span>
              {PROGRAM.objective.map((term, i) => (
                <Term key={term.name} c={term.c} name={term.name} leading={i === 0} />
              ))}
            </div>
            <div className="sx-word">subject to</div>
            {PROGRAM.inequalities.map((ineq) => (
              <Equation key={ineq.terms.map((t) => t.name).join()} lead={null} terms={ineq.terms} rhs={ineq.rhs} rel="≤" />
            ))}
            <div className="sx-eq">
              <VarName name="x" />
              <span className="sx-comma">,</span>
              <VarName name="y" />
              <span className="sx-op">≥</span>
              <span className="sx-int">0</span>
            </div>
          </div>
          <div>
            <h2 className="sx-title">Written as equations</h2>
            <p className="sx-note">
              Each inequality gets a slack. The slack is zero on the wall and positive on the feasible side. The objective is moved to the left-hand side. Stacked with z on top, these rows are the opening tableau.
            </p>
            {PROGRAM.equations.map((eq, i) => (
              <Equation key={eq.lead ?? i} lead={eq.lead} terms={eq.terms} rhs={eq.rhs} />
            ))}
            <p className="sx-note">s, t and u stay non-negative. That is what keeps (x, y) inside the polygon.</p>
          </div>
        </div>
      </section>

      <div className="sx-toolbar card">
        <span className="sx-progress">
          {index + 1} / {SCENES.length}
        </span>
        <div className="sx-dots" role="tablist" aria-label="Tableau steps">
          {SCENES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className="sx-dot"
              aria-selected={i === index}
              aria-controls="simplex-step"
              aria-label={`${i + 1}. ${item.kicker}: ${item.title}`}
              onClick={() => {
                setPlaying(false);
                setIndex(i);
              }}
            />
          ))}
        </div>
        <span className="sx-hint">Arrow keys</span>
        <span className="sx-stepname">
          {scene.kicker}. {scene.title}
        </span>
        <div className="sx-actions">
          <button type="button" className="sx-btn" onClick={() => go(-1)} disabled={index === 0}>
            Back
          </button>
          <button type="button" className="sx-btn" onClick={togglePlay} aria-pressed={playing}>
            {playing ? "Pause" : atEnd ? "Replay" : "Play"}
          </button>
          <button type="button" className="sx-btn sx-btn-primary" onClick={() => go(1)} disabled={atEnd}>
            Next
          </button>
        </div>
      </div>

      <div className="sx-stage">
        <section className="card sx-graphcard" aria-labelledby="simplex-poly-title">
          <div className="sx-ghead">
            <div>
              <h2 id="simplex-poly-title" className="sx-title">
                The polygon
              </h2>
              <p className="sx-note">
                (<VarName name="x" />, <VarName name="y" />) = ({fmtNum(place.x)}, {fmtNum(place.y)})
              </p>
            </div>
            <div className="sx-zhero">
              <VarName name="z" />
              <strong>{fmtNum(valueOf(scene.tableau, "z"))}</strong>
            </div>
          </div>
          <div className="sx-plot">
            <Polygon scene={scene} onJump={jump} />
          </div>
          <ul className="sx-legend">
            <li>
              <i className="sx-swatch sx-swatch-region" /> feasible region
            </li>
            <li>
              <i className="sx-swatch sx-swatch-level" /> level of z
            </li>
            <li>
              <i className="sx-swatch sx-swatch-best" /> optimal level, z = 36
            </li>
            <li>
              <i className="sx-swatch sx-swatch-edge" /> edge of this step
            </li>
            <li>
              <i className="sx-swatch sx-swatch-rise" /> z increases
            </li>
          </ul>
          <p className="sx-note">Hollow dots are other feasible corners. Filled dots are on this walk. Click a filled dot to open its tableau.</p>
          <Readout tab={scene.tableau} />
        </section>

        <div className="sx-side">
          <section id="simplex-step" className="card" role="tabpanel" aria-live="polite">
            <h2 className="sx-title">
              <span className="sx-kicker">{scene.kicker}</span>
              {scene.title}
            </h2>
            {scene.paragraphs.map((paragraph) => (
              <p className="sx-prose" key={paragraph}>
                {paragraph}
              </p>
            ))}
            {scene.ops ? (
              <ol className="sx-ops">
                {scene.ops.map((op) => (
                  <li key={op}>{op}</li>
                ))}
              </ol>
            ) : null}
          </section>
          <TableauCard scene={scene} />
        </div>
      </div>

      <section className="sx-rules" aria-label="How to read any tableau">
        {RULES.map((rule) => (
          <article key={rule.title} className="card">
            <h2 className="sx-title">{rule.title}</h2>
            <p className="sx-prose">{rule.body}</p>
          </article>
        ))}
      </section>

      <p className="sx-foot">
        Two cases this walk never meets. If the pivot column has no positive entry, the edge never hits a wall and the program is unbounded. If two ratios tie, the step can have length zero and a careless tie-break can cycle; Bland’s rule, breaking ties toward the lowest variable index, prevents that. Interior-point methods cross the middle of the same polygon. They do not build a tableau.
      </p>
      <p className="sx-foot">
        <a href="/topics/mathematics">Back to mathematics</a>
      </p>
      <style>{CSS}</style>
    </main>
  );
}

const CSS = `
.sx-page { max-width: 1180px; }
.sx-hero { margin: 8px 0 16px; }
.sx-hero .topicHeaderTitle { margin: 0; }
.sx-problem { margin-top: 6px; }
.sx-split { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; }
.sx-title { margin: 0 0 8px; font-size: 22px; letter-spacing: -0.03em; line-height: 1.2; }
.sx-kicker { display: block; color: var(--accent); font-size: 13px; font-weight: 800; margin-bottom: 4px; }
.sx-note { margin: 0 0 10px; color: var(--muted); line-height: 1.55; font-size: 14px; }
.sx-prose { margin: 0 0 10px; line-height: 1.62; font-size: 16px; }
.sx-prose:last-child { margin-bottom: 0; }
.sx-word {
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 8px 8px 4px 0;
}
.sx-eq {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-family: ui-serif, Georgia, "Times New Roman", serif;
  font-size: 1.18rem;
  line-height: 1.3;
  padding: 3px 0;
}
.sx-term { display: inline-flex; align-items: center; }
.sx-op { margin: 0 6px; font-style: normal; }
.sx-comma { margin-right: 4px; }
.sx-v { font-style: italic; font-weight: 650; }
.sx-v-x { color: #7dd3fc; }
.sx-v-y { color: #c4b5fd; }
.sx-v-z { color: #f9a8d4; }
.sx-v-s, .sx-v-t, .sx-v-u { color: rgba(255,255,255,0.92); }
.sx-frac, .sx-int { font-variant-numeric: tabular-nums; }
.sx-frac { display: inline-flex; align-items: center; }
.sx-sign { margin-right: 1px; }
.sx-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.05;
  font-size: 0.74em;
  margin: 0 1px;
}
.sx-stack span:first-child { border-bottom: 1px solid currentColor; padding: 0 3px 1px; }
.sx-stack span:last-child { padding: 1px 3px 0; }
.sx-toolbar {
  position: sticky;
  top: 10px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin: 16px 0;
}
.sx-progress { font-weight: 800; min-width: 48px; }
.sx-dots { display: flex; gap: 6px; align-items: center; }
.sx-dot {
  width: 9px;
  height: 9px;
  border-radius: 99px;
  border: 0;
  padding: 0;
  background: rgba(255,255,255,0.28);
  cursor: pointer;
}
.sx-dot[aria-selected="true"] { width: 22px; background: #7dd3fc; }
.sx-dot:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 3px; }
.sx-hint { color: var(--muted); font-size: 12px; }
.sx-stepname { flex: 1 1 100%; font-weight: 800; font-size: 15px; }
.sx-actions { display: flex; gap: 8px; margin-left: auto; }
.sx-btn {
  appearance: none;
  min-height: 44px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.06);
  color: inherit;
  font: inherit;
  font-weight: 800;
  border-radius: 999px;
  padding: 0 16px;
  cursor: pointer;
}
.sx-btn:hover:not(:disabled) { border-color: rgba(125,211,252,0.45); background: rgba(255,255,255,0.1); }
.sx-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.sx-btn:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
.sx-btn-primary { background: rgba(125,211,252,0.16); border-color: rgba(125,211,252,0.45); }
.sx-stage {
  display: grid;
  grid-template-columns: minmax(280px, 400px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.sx-side { display: grid; gap: 16px; min-width: 0; }
.sx-ghead { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.sx-zhero { text-align: right; line-height: 1; }
.sx-zhero strong {
  display: block;
  font-size: 36px;
  letter-spacing: -0.04em;
  color: #f9a8d4;
}
.sx-plot svg { width: 100%; height: auto; display: block; }
.sx-hit { cursor: pointer; }
.sx-hit:focus { outline: none; }
.sx-hit:focus-visible .sx-ring { stroke: #fff; }
.sx-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 10px 0;
  padding: 0;
  list-style: none;
  color: var(--muted);
  font-size: 13px;
}
.sx-legend li { display: inline-flex; align-items: center; gap: 6px; }
.sx-swatch { width: 18px; height: 8px; border-radius: 99px; display: inline-block; }
.sx-swatch-region { background: rgba(125,211,252,0.85); }
.sx-swatch-level { background: repeating-linear-gradient(90deg, #f9a8d4 0 5px, transparent 5px 8px); }
.sx-swatch-best { background: repeating-linear-gradient(90deg, rgba(249,168,212,0.45) 0 5px, transparent 5px 8px); }
.sx-swatch-edge { background: #fbbf24; }
.sx-swatch-rise { background: #f9a8d4; }
.sx-read { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 4px; }
.sx-chip {
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 8px 10px;
}
.sx-chip-top { display: flex; justify-content: space-between; gap: 6px; color: var(--muted); font-size: 11px; margin-bottom: 4px; }
.sx-sheet {
  background: rgba(0,0,0,0.28);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  overflow-x: auto;
}
.sx-table { width: 100%; min-width: 560px; border-collapse: separate; border-spacing: 0; }
.sx-table th, .sx-table td {
  text-align: center;
  vertical-align: middle;
  padding: 8px 6px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  transition: background-color 0.2s linear;
}
.sx-table thead th { font-size: 13px; font-weight: 800; border-bottom-color: rgba(255,255,255,0.16); }
.sx-basis { text-align: left !important; white-space: nowrap; padding-left: 12px !important; }
.sx-zrow { background: rgba(249,168,212,0.06); }
.sx-table .sx-int, .sx-table .sx-frac { font-family: var(--font-mono), ui-monospace, monospace; font-size: 14px; }
.sx-table .sx-stack { font-size: 0.86em; }
.sx-hotcol { background: rgba(125,211,252,0.1); }
.sx-hotrow { background: rgba(167,139,250,0.12); }
.sx-table td.sx-pivot {
  background: #fde68a;
  color: #1a1204;
  border-radius: 8px;
  font-weight: 800;
  animation: sx-pulse 1.6s ease-out infinite;
}
.sx-zero { opacity: 0.38; }
.sx-neg { color: #fb7185; font-weight: 800; }
.sx-val { font-weight: 800; }
.sx-ratio { font-size: 13px; white-space: nowrap; }
.sx-ratio.is-chosen { color: #fde68a; font-weight: 800; }
.sx-tag {
  display: block;
  margin-top: 3px;
  font-family: var(--font-sans), sans-serif;
  font-style: normal;
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7dd3fc;
}
.sx-tag-out { color: #fbbf24; }
.sx-tag-in { color: #86efac; }
.sx-h3 { margin: 16px 0 8px; font-size: 15px; }
.sx-bars { display: grid; gap: 8px; margin-top: 14px; }
.sx-bar { display: grid; grid-template-columns: 22px minmax(48px, 1fr) auto; gap: 8px; align-items: center; }
.sx-bar.is-chosen .sx-fill { background: #fbbf24; }
.sx-track {
  position: relative;
  height: 16px;
  border-radius: 99px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}
.sx-track em { position: absolute; left: 8px; top: -1px; font-size: 11px; font-style: normal; color: var(--muted); }
.sx-fill { display: block; height: 100%; background: rgba(125,211,252,0.55); border-radius: inherit; }
.sx-bar-val { font-family: var(--font-mono), ui-monospace, monospace; font-size: 12px; color: var(--muted); }
.sx-bar.is-chosen .sx-bar-val { color: #fde68a; }
.sx-dict { display: grid; gap: 2px; }
.sx-ops { margin: 12px 0 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.sx-ops li {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.45;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0,0,0,0.22);
  border: 1px solid rgba(255,255,255,0.08);
}
.sx-rules { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
.sx-foot { color: var(--muted); line-height: 1.6; font-size: 14px; margin: 14px 0 0; }
.sx-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.sx-scrollhint { display: none; }
@keyframes sx-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(253, 230, 138, 0.55); }
  50% { box-shadow: 0 0 0 6px rgba(253, 230, 138, 0); }
}
@media (max-width: 900px) {
  .sx-split, .sx-stage, .sx-rules { grid-template-columns: 1fr; }
  .sx-plot { max-width: 460px; }
}
@media (max-width: 720px) {
  .sx-hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sx-table td.sx-pivot { animation: none; }
  .sx-dot, .sx-table th, .sx-table td { transition: none; }
}
`;
