// Top row is the objective in the form z + Σ cⱼ xⱼ = z*.
// cⱼ < 0 means increasing xⱼ increases z. At optimality the slack entries are shadow prices.

export type Rat = { n: number; d: number };

export type VarId = "x" | "y" | "s" | "t" | "u";

export type Point = { x: number; y: number };

export type Term = { name: string; c: Rat };

export type Tableau = {
  cols: VarId[];
  basics: VarId[];
  z: Rat[];
  rows: Rat[][];
};

export type Scene = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  ops: string[] | null;
  tableau: Tableau;
  trail: Point[];
  arrow: { from: Point; to: Point; label: string } | null;
  walk: { from: Point; to: Point } | null;
  beyond: { at: Point; label: string }[];
  pivotCol: number | null;
  pivotRow: number | null;
  showRatios: boolean;
  freshBasic: VarId | null;
  optimal: boolean;
};

export type RatioRow = {
  basic: VarId;
  label: string;
  value: number | null;
  chosen: boolean;
};

export type Corner = {
  x: number;
  y: number;
  z: number;
  sceneId: string | null;
};

export const X_MAX = 5;
export const Y_MAX = 7;
export const OPTIMAL_Z = 36;
export const GRADIENT = { x: 3, y: 5 };

export const POLY: Point[] = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 3 },
  { x: 2, y: 6 },
  { x: 0, y: 6 },
];

export const CORNERS: Corner[] = [
  { x: 0, y: 0, z: 0, sceneId: "start" },
  { x: 4, y: 0, z: 12, sceneId: null },
  { x: 4, y: 3, z: 27, sceneId: null },
  { x: 0, y: 6, z: 30, sceneId: "after-0" },
  { x: 2, y: 6, z: 36, sceneId: "after-1" },
];

const COLS: VarId[] = ["x", "y", "s", "t", "u"];

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

export function rat(n: number, d = 1): Rat {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) {
    throw new Error("rational expects nonzero integer denominator");
  }
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function add(a: Rat, b: Rat): Rat {
  return rat(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Rat, b: Rat): Rat {
  return rat(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Rat, b: Rat): Rat {
  return rat(a.n * b.n, a.d * b.d);
}

export function div(a: Rat, b: Rat): Rat {
  if (b.n === 0) throw new Error("divide by zero");
  return rat(a.n * b.d, a.d * b.n);
}

export function neg(a: Rat): Rat {
  return rat(-a.n, a.d);
}

export function isZero(a: Rat): boolean {
  return a.n === 0;
}

export function num(a: Rat): number {
  return a.n / a.d;
}

export function fmt(a: Rat): string {
  if (a.n === 0) return "0";
  const sign = a.n < 0 ? "−" : "";
  const n = Math.abs(a.n);
  if (a.d === 1) return sign + String(n);
  return `${sign}${n}/${a.d}`;
}

export function fmtNum(n: number): string {
  const r = Math.round(n);
  if (Math.abs(n - r) < 1e-8) return String(r);
  return (Math.round(n * 1000) / 1000).toString();
}

export function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
}

function R(n: number, d = 1): Rat {
  return rat(n, d);
}

function rhsOf(row: Rat[]): Rat {
  return row[row.length - 1];
}

export function initialTableau(): Tableau {
  return {
    cols: COLS,
    basics: ["s", "t", "u"],
    z: [R(-3), R(-5), R(0), R(0), R(0), R(0)],
    rows: [
      [R(1), R(0), R(1), R(0), R(0), R(4)],
      [R(0), R(2), R(0), R(1), R(0), R(12)],
      [R(3), R(2), R(0), R(0), R(1), R(18)],
    ],
  };
}

export function valueRat(tab: Tableau, name: string): Rat {
  if (name === "z") return rhsOf(tab.z);
  const i = tab.basics.indexOf(name as VarId);
  if (i < 0) return rat(0);
  return rhsOf(tab.rows[i]);
}

export function valueOf(tab: Tableau, name: string): number {
  return num(valueRat(tab, name));
}

export function vertex(tab: Tableau): Point {
  return { x: valueOf(tab, "x"), y: valueOf(tab, "y") };
}

export function here(scene: Scene): Point {
  return scene.trail[scene.trail.length - 1];
}

function nonbasic(tab: Tableau): VarId[] {
  return tab.cols.filter((name) => !tab.basics.includes(name));
}

function pointAt(tab: Tableau, col: number, theta: number): Point {
  const coord = (name: VarId) => {
    if (tab.cols[col] === name) return theta;
    const i = tab.basics.indexOf(name);
    if (i < 0) return 0;
    const row = tab.rows[i];
    return num(rhsOf(row)) - num(row[col]) * theta;
  };
  return { x: coord("x"), y: coord("y") };
}

function enteringCol(tab: Tableau): number | null {
  let best = -1;
  tab.z.slice(0, -1).forEach((c, j) => {
    if (c.n >= 0) return;
    if (best === -1 || c.n * tab.z[best].d < tab.z[best].n * c.d) best = j;
  });
  return best === -1 ? null : best;
}

type Stop = { row: number; ratio: Rat; ratioNum: number; at: Point };

function blockingStops(tab: Tableau, col: number): Stop[] {
  const stops: Stop[] = [];
  tab.rows.forEach((row, i) => {
    const a = row[col];
    if (a.n <= 0) return;
    const ratio = div(rhsOf(row), a);
    const ratioNum = num(ratio);
    stops.push({ row: i, ratio, ratioNum, at: pointAt(tab, col, ratioNum) });
  });
  stops.sort((a, b) => a.ratioNum - b.ratioNum || a.row - b.row);
  return stops;
}

function pivot(tab: Tableau, row: number, col: number): Tableau {
  const pivotEl = tab.rows[row][col];
  const newPivot = tab.rows[row].map((cell) => div(cell, pivotEl));
  const rows = tab.rows.map((r, i) => {
    if (i === row) return newPivot;
    const factor = r[col];
    return r.map((cell, j) => sub(cell, mul(factor, newPivot[j])));
  });
  const zFactor = tab.z[col];
  const z = tab.z.map((cell, j) => sub(cell, mul(zFactor, newPivot[j])));
  const basics = tab.basics.slice();
  basics[row] = tab.cols[col];
  return { cols: tab.cols, basics, z, rows };
}

function describeOps(tab: Tableau, row: number, col: number): string[] {
  const enter = tab.cols[col];
  const leave = tab.basics[row];
  const piv = tab.rows[row][col];
  const ops = [`${enter} takes ${leave}’s row, divided by ${fmt(piv)}.`];
  const names = ["z", ...tab.basics];
  const coeffs = [tab.z[col], ...tab.rows.map((r) => r[col])];
  names.forEach((name, i) => {
    if (i === row + 1) return;
    const c = coeffs[i];
    if (c.n === 0) {
      ops.push(`${name} stays unchanged. Its ${enter} entry is already 0.`);
      return;
    }
    const abs = rat(Math.abs(c.n), c.d);
    const one = abs.n === 1 && abs.d === 1;
    if (c.n < 0) {
      ops.push(
        one
          ? `${name} ← ${name} + the new ${enter} row.`
          : `${name} ← ${name} + ${fmt(abs)} × the new ${enter} row.`
      );
    } else if (one) {
      ops.push(`${name} ← ${name} − the new ${enter} row.`);
    } else {
      ops.push(`${name} ← ${name} − ${fmt(c)} × the new ${enter} row.`);
    }
  });
  return ops;
}

function wallPhrase(held: VarId, way: string): string {
  const place =
    held === "x"
      ? "the axis x = 0"
      : held === "y"
        ? "the axis y = 0"
        : held === "s"
          ? "the wall x = 4"
          : held === "t"
            ? "the wall 2y = 12"
            : "the wall 3x + 2y = 18";
  return `${held} stays at zero, which keeps the point on ${place}. The edge runs ${way}.`;
}

function directionSentence(tab: Tableau, col: number): string {
  const from = vertex(tab);
  const step = pointAt(tab, col, 1);
  const dx = step.x - from.x;
  const dy = step.y - from.y;
  const enter = tab.cols[col];
  const held = nonbasic(tab).find((name) => name !== enter);
  assert(held, "missing held variable");
  let way = "diagonally";
  if (Math.abs(dx) < 1e-8) way = dy > 0 ? "upwards" : "downwards";
  else if (Math.abs(dy) < 1e-8) way = dx > 0 ? "to the right" : "to the left";
  return wallPhrase(held, way);
}

function solutionSentence(tab: Tableau): string {
  const v = vertex(tab);
  const bits = tab.cols.map((name) => `${name} = ${fmt(valueRat(tab, name))}`);
  return `The corner is (${fmtNum(v.x)}, ${fmtNum(v.y)}), with ${bits.join(", ")}. z = ${fmt(valueRat(tab, "z"))}.`;
}

function tightSentence(tab: Tableau): string {
  const walls: Record<"s" | "t" | "u", string> = {
    s: "x = 4",
    t: "2y = 12",
    u: "3x + 2y = 18",
  };
  const tight = (["s", "t", "u"] as const).filter((name) => isZero(valueRat(tab, name)));
  if (tight.length === 0) {
    return "s, t and u are all positive, so the point is the corner of the two axes.";
  }
  const list = tight.map((name) => `${walls[name]} (${name} = 0)`).join(" and ");
  return `Active walls: ${list}.`;
}

function shadowSentence(tab: Tableau): string {
  const price = (name: VarId) => fmt(tab.z[tab.cols.indexOf(name)]);
  return `The top-row entries on the slacks are shadow prices: s is ${price("s")}, t is ${price("t")}, u is ${price("u")}. One extra unit of room in 2y ≤ 12 would raise optimal z by ${price("t")}. One extra unit of room in 3x + 2y ≤ 18 would raise it by ${price("u")}. Extra room in x ≤ 4 is worth ${price("s")}, and this corner already has s = ${fmt(valueRat(tab, "s"))}.`;
}

function enterParagraphs(tab: Tableau, col: number): string[] {
  const name = tab.cols[col];
  const negatives = tab.cols
    .map((n, j) => ({ n, c: tab.z[j] }))
    .filter((t) => t.c.n < 0);
  const gain = fmt(neg(tab.z[col]));
  const head =
    negatives.length > 1
      ? `Negative entries in the top row: ${negatives.map((t) => `${t.n} at ${fmt(t.c)}`).join(", ")}. The most negative is ${name}, so ${name} enters. Each unit of ${name} raises z by ${gain}.`
      : `${name} is the remaining negative entry in the top row (${fmt(tab.z[col])}). Each unit of ${name} raises z by ${gain}, so ${name} enters.`;
  const paras = [
    head,
    directionSentence(tab, col),
    "A basic column is already a single 1 with zeros elsewhere, and its top-row entry is 0. Only nonbasic variables are candidates.",
  ];
  const from = vertex(tab);
  if (Math.abs(from.x) < 1e-9 && Math.abs(from.y) < 1e-9) {
    paras.push(
      "The rightward edge ends at (4, 0), where z = 12, and continues to (4, 3), where z = 27. Both corners are feasible. The top row picks the upward edge: the gain per unit is 5 for y and 3 for x."
    );
  }
  return paras;
}

function ratioParagraphs(tab: Tableau, col: number, stops: Stop[]): string[] {
  const enter = tab.cols[col];
  const winner = tab.basics[stops[0].row];
  return [
    `Increase ${enter} and keep every other nonbasic variable at zero. Down the pivot column, a positive entry means that basic variable is falling. It hits zero at its value divided by that entry. A zero or negative entry means the variable is not running out on this edge.`,
    `The bars are those ratios. The shortest is ${fmt(stops[0].ratio)}, so ${winner} leaves and the highlighted cell is the pivot. A longer step would make ${winner} negative and leave the polygon.`,
  ];
}

function afterParagraphs(before: Tableau, after: Tableau, row: number, col: number): string[] {
  const enter = before.cols[col];
  const leave = before.basics[row];
  const paras = [
    `${enter} replaces ${leave} in the basis. The pivot row is scaled, then ${enter} is cancelled in every other row.`,
    solutionSentence(after),
    tightSentence(after),
  ];
  if (enteringCol(after) === null) {
    paras.push(
      "Every top-row entry is now zero or positive. Raising a nonbasic variable would lower z or leave it unchanged, so this corner is optimal."
    );
    paras.push(shadowSentence(after));
    paras.push(
      "The level curve z = 36 touches the polygon at this corner, and the rest of the polygon lies on the side where z is smaller."
    );
  } else {
    paras.push("A negative entry remains in the top row, so one more edge still improves z.");
  }
  return paras;
}

function blankGeom(): Pick<Scene, "arrow" | "walk" | "beyond" | "pivotCol" | "pivotRow" | "showRatios" | "freshBasic" | "optimal" | "ops"> {
  return {
    arrow: null,
    walk: null,
    beyond: [],
    pivotCol: null,
    pivotRow: null,
    showRatios: false,
    freshBasic: null,
    optimal: false,
    ops: null,
  };
}

function buildScenes(): Scene[] {
  const scenes: Scene[] = [];
  let tab = initialTableau();
  let trail: Point[] = [vertex(tab)];

  scenes.push({
    id: "start",
    kicker: "The opening tableau",
    title: "A corner you can write down",
    paragraphs: [
      "The slack columns s, t and u are an identity matrix. Those three variables are basic: each equals the number in the value column. x and y are nonbasic, so both are zero.",
      "You are at the origin. Every constraint still has spare room: s = 4, t = 12, u = 18. Nothing is produced, so z = 0.",
      "The top row is the objective after moving 3x + 5y across: z − 3x − 5y = 0. A negative entry means a step still raises z.",
    ],
    tableau: tab,
    trail: [...trail],
    ...blankGeom(),
  });

  let iter = 0;
  while (iter < 5) {
    const col = enteringCol(tab);
    if (col === null) break;
    const stops = blockingStops(tab, col);
    assert(stops.length > 0, "unbounded program");
    const enter = tab.cols[col];
    const from = vertex(tab);
    const winner = stops[0];
    const dx = winner.at.x - from.x;
    const dy = winner.at.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const len = Math.min(1.25, dist * 0.45);
    const tip = { x: from.x + (dx / dist) * len, y: from.y + (dy / dist) * len };

    scenes.push({
      id: `enter-${iter}`,
      kicker: "Entering variable",
      title: `${enter} enters`,
      paragraphs: enterParagraphs(tab, col),
      tableau: tab,
      trail: [...trail],
      ...blankGeom(),
      pivotCol: col,
      arrow: { from, to: tip, label: enter },
    });

    scenes.push({
      id: `ratio-${iter}`,
      kicker: "Ratio test",
      title: `${tab.basics[winner.row]} leaves`,
      paragraphs: ratioParagraphs(tab, col, stops),
      tableau: tab,
      trail: [...trail],
      ...blankGeom(),
      pivotCol: col,
      pivotRow: winner.row,
      showRatios: true,
      walk: { from, to: winner.at },
      beyond: stops.slice(1).map((stop) => ({
        at: stop.at,
        label: `${tab.basics[stop.row]} · ratio ${fmt(stop.ratio)}`,
      })),
    });

    const ops = describeOps(tab, winner.row, col);
    const next = pivot(tab, winner.row, col);
    const arrived = vertex(next);
    const optimal = enteringCol(next) === null;
    trail = [...trail, arrived];
    scenes.push({
      id: `after-${iter}`,
      kicker: optimal ? "Optimal tableau" : "After the pivot",
      title: optimal
        ? `Optimal at (${fmtNum(arrived.x)}, ${fmtNum(arrived.y)})`
        : `Now at (${fmtNum(arrived.x)}, ${fmtNum(arrived.y)})`,
      paragraphs: afterParagraphs(tab, next, winner.row, col),
      ops,
      tableau: next,
      trail: [...trail],
      arrow: null,
      walk: null,
      beyond: [],
      pivotCol: null,
      pivotRow: null,
      showRatios: false,
      freshBasic: enter,
      optimal,
    });
    tab = next;
    iter += 1;
  }

  return scenes;
}

export function ratioRows(tab: Tableau, col: number): RatioRow[] {
  const stops = blockingStops(tab, col);
  const best = stops[0]?.row;
  return tab.rows.map((row, i) => {
    const a = row[col];
    const rhs = rhsOf(row);
    if (a.n <= 0) {
      return {
        basic: tab.basics[i],
        label: a.n === 0 ? "entry 0 · not used up" : `entry ${fmt(a)} · rises`,
        value: null,
        chosen: false,
      };
    }
    const q = div(rhs, a);
    return {
      basic: tab.basics[i],
      label: `${fmt(rhs)} / ${fmt(a)} = ${fmt(q)}`,
      value: num(q),
      chosen: i === best,
    };
  });
}

export function dictionary(tab: Tableau): { lhs: string; constant: Rat; terms: Term[] }[] {
  const free = tab.cols.map((name, j) => ({ name, j })).filter((v) => !tab.basics.includes(v.name));
  return [
    {
      lhs: "z",
      constant: rhsOf(tab.z),
      terms: free.map((v) => ({ name: v.name, c: neg(tab.z[v.j]) })),
    },
    ...tab.basics.map((basic, i) => ({
      lhs: basic,
      constant: rhsOf(tab.rows[i]),
      terms: free.map((v) => ({ name: v.name, c: neg(tab.rows[i][v.j]) })),
    })),
  ];
}

export function programView(tab: Tableau): {
  objective: Term[];
  inequalities: { terms: Term[]; rhs: Rat }[];
  equations: { lead: string | null; terms: Term[]; rhs: Rat }[];
} {
  return {
    objective: tab.cols.map((name, j) => ({ name, c: neg(tab.z[j]) })).filter((t) => t.c.n !== 0),
    inequalities: tab.rows.map((row) => ({
      terms: tab.cols
        .map((name, j) => ({ name, c: row[j] }))
        .filter((t) => (t.name === "x" || t.name === "y") && t.c.n !== 0),
      rhs: rhsOf(row),
    })),
    equations: [
      ...tab.rows.map((row) => ({
        lead: null as string | null,
        terms: tab.cols.map((name, j) => ({ name, c: row[j] })),
        rhs: rhsOf(row),
      })),
      {
        lead: "z",
        terms: tab.cols.map((name, j) => ({ name, c: tab.z[j] })),
        rhs: rhsOf(tab.z),
      },
    ],
  };
}

export function lineSegment(
  a: number,
  b: number,
  c: number,
  xMax = X_MAX,
  yMax = Y_MAX
): [Point, Point] | null {
  const pts: Point[] = [];
  const add = (x: number, y: number) => {
    if (x < -1e-8 || y < -1e-8 || x > xMax + 1e-8 || y > yMax + 1e-8) return;
    const p = {
      x: Math.min(xMax, Math.max(0, x)),
      y: Math.min(yMax, Math.max(0, y)),
    };
    if (pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 1e-6)) pts.push(p);
  };
  if (Math.abs(b) > 1e-12) {
    add(0, c / b);
    add(xMax, (c - a * xMax) / b);
  }
  if (Math.abs(a) > 1e-12) {
    add(c / a, 0);
    add((c - b * yMax) / a, yMax);
  }
  if (pts.length < 2) return null;
  return [pts[0], pts[1]];
}

function ratEquals(a: Rat, n: number, d = 1): boolean {
  return a.n === n && a.d === d;
}

function verify(scenes: Scene[]) {
  assert(scenes.length === 7, `expected 7 scenes, got ${scenes.length}`);
  const byId = (id: string) => {
    const scene = scenes.find((s) => s.id === id);
    assert(scene, id);
    return scene;
  };
  const point = (id: string) => here(byId(id));
  assert(samePoint(point("start"), { x: 0, y: 0 }), "origin");
  assert(samePoint(point("after-0"), { x: 0, y: 6 }), "(0, 6)");
  assert(samePoint(point("after-1"), { x: 2, y: 6 }), "(2, 6)");
  assert(byId("after-1").optimal, "optimal flag");
  assert(Math.abs(valueOf(byId("after-0").tableau, "z") - 30) < 1e-9, "z mid");
  assert(Math.abs(valueOf(byId("after-1").tableau, "z") - 36) < 1e-9, "z opt");

  const mid = byId("after-0").tableau;
  assert(mid.basics.join() === "s,y,u", "mid basis");
  assert(ratEquals(mid.z[0], -3) && isZero(mid.z[1]) && ratEquals(mid.z[3], 5, 2), "mid z");
  assert(ratEquals(rhsOf(mid.z), 30), "mid z rhs");
  assert(ratEquals(mid.rows[2][0], 3) && ratEquals(mid.rows[2][3], -1) && ratEquals(rhsOf(mid.rows[2]), 6), "mid u");

  const end = byId("after-1").tableau;
  assert(end.basics.join() === "s,y,x", "end basis");
  assert(isZero(end.z[0]) && isZero(end.z[1]) && isZero(end.z[2]), "end z decisions");
  assert(ratEquals(end.z[3], 3, 2) && ratEquals(end.z[4], 1) && ratEquals(rhsOf(end.z), 36), "end z");
  assert(ratEquals(end.rows[0][3], 1, 3) && ratEquals(end.rows[0][4], -1, 3) && ratEquals(rhsOf(end.rows[0]), 2), "end s");
  assert(ratEquals(end.rows[1][3], 1, 2) && isZero(end.rows[1][4]) && ratEquals(rhsOf(end.rows[1]), 6), "end y");
  assert(ratEquals(end.rows[2][0], 1) && ratEquals(end.rows[2][3], -1, 3) && ratEquals(end.rows[2][4], 1, 3), "end x");
  assert(ratEquals(rhsOf(end.rows[2]), 2), "end x rhs");

  const dict = dictionary(end);
  const zTerms = dict[0].terms;
  const tTerm = zTerms.find((t) => t.name === "t");
  const uTerm = zTerms.find((t) => t.name === "u");
  assert(tTerm && ratEquals(tTerm.c, -3, 2), "dictionary t");
  assert(uTerm && ratEquals(uTerm.c, -1), "dictionary u");
  assert(lineSegment(3, 5, 0) === null, "zero contour");
  assert(lineSegment(3, 5, OPTIMAL_Z) !== null, "optimal contour");
  const horizontal = lineSegment(0, 1, 6);
  assert(horizontal !== null && horizontal.every((p) => p.y === 6), "wall y = 6");

  for (const corner of CORNERS) {
    assert(Math.abs(3 * corner.x + 5 * corner.y - corner.z) < 1e-9, "corner objective");
    assert(corner.x >= -1e-9 && corner.y >= -1e-9, "nonnegative");
    assert(corner.x <= 4 + 1e-9 && 2 * corner.y <= 12 + 1e-9, "bounds");
    assert(3 * corner.x + 2 * corner.y <= 18 + 1e-9, "material");
  }
}

export const SCENES: Scene[] = buildScenes();

verify(SCENES);
