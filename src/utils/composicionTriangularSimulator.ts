// src/utils/composicionTriangularSimulator.ts
// Ejercicio 2: distribución lineal por tramos (x1,y1)-(x2,y2)-(x3,y3)
// Método de composición con 2 regiones + transformada inversa condicional

export type Exercise12Params = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  n: number;
  seed: number;
  bins: number;
};

export type Exercise12RegionStat = {
  region: string;
  count: number;
  pct: number;
  theoPct: number;
  diffPct: number;
};

export type Exercise12Output = {
  kind: 'exercise-1-2-piecewise-linear';
  params: Exercise12Params;

  metrics: Record<string, string | number>;
  columns: string[];
  rows: (string | number)[][];

  regionStats: Exercise12RegionStat[];

  chart: {
    labels: string[];
    histDensity: number[];
    theoPdf: number[];
  };
};

function makeLCG(seed0: number) {
  // Igual estilo a tu composicionSimulator.ts (LCG determinista)
  const a = 16807;
  const c = 1;
  const m = 2147483647;

  let seed = Math.floor(seed0);

  return {
    nextU(): number {
      seed = (a * seed + c) % m;
      return seed / m;
    },
    getSeed(): number {
      return seed;
    },
  };
}

function areaTrapezoid(x0: number, x1: number, h0: number, h1: number) {
  return 0.5 * (x1 - x0) * (h0 + h1);
}

function pdfPiecewiseLinear(
  x: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  areaTotal: number
) {
  if (areaTotal <= 0) return 0;
  if (x < x1 || x > x3) return 0;

  if (x <= x2) {
    const m1 = (y2 - y1) / (x2 - x1);
    return (y1 + m1 * (x - x1)) / areaTotal;
  } else {
    const m2 = (y3 - y2) / (x3 - x2);
    return (y2 + m2 * (x - x2)) / areaTotal;
  }
}

function invCdfLinearSegment(u: number, x0: number, x1: number, h0: number, h1: number) {
  // Inversa de CDF en un tramo con densidad lineal entre (x0,h0)-(x1,h1).
  // u ~ U(0,1) condicional del tramo.
  const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
  u = clamp01(u);

  const dx = x1 - x0;
  if (dx <= 0) return x0;

  const area = areaTrapezoid(x0, x1, h0, h1);
  if (area <= 0) return x0;

  const m = (h1 - h0) / dx;

  // En t = x - x0:
  // F(t) = (h0*t + 0.5*m*t^2)/area = u
  // => 0.5*m*t^2 + h0*t - u*area = 0
  const A = 0.5 * m;
  const B = h0;
  const C = -u * area;

  // Caso "rectangular": m ~ 0
  if (Math.abs(A) < 1e-12) {
    if (B <= 0) return x0;
    let t = (u * area) / B;
    t = Math.max(0, Math.min(dx, t));
    return x0 + t;
  }

  let disc = B * B - 4 * A * C;
  if (disc < 0) disc = 0;
  const sqrtDisc = Math.sqrt(disc);

  const t1 = (-B + sqrtDisc) / (2 * A);
  const t2 = (-B - sqrtDisc) / (2 * A);

  const eps = 1e-9;
  const candidates: number[] = [];
  if (t1 >= -eps && t1 <= dx + eps) candidates.push(t1);
  if (t2 >= -eps && t2 <= dx + eps) candidates.push(t2);

  const clamp = (t: number) => Math.max(0, Math.min(dx, t));

  let t: number;
  if (candidates.length) {
    t = candidates[0];
    // si hay dos, elegimos la que quede mejor dentro
    if (candidates.length === 2) {
      const c0 = clamp(candidates[0]);
      const c1 = clamp(candidates[1]);
      t = Math.abs(candidates[0] - c0) <= Math.abs(candidates[1] - c1) ? candidates[0] : candidates[1];
    }
    t = clamp(t);
  } else {
    // fallback: la más cercana al intervalo
    const c0 = clamp(t1);
    const c1 = clamp(t2);
    t = Math.abs(t1 - c0) <= Math.abs(t2 - c1) ? c0 : c1;
  }

  return x0 + t;
}

export function runExercise12(p: Exercise12Params): Exercise12Output {
  const { x1, y1, x2, y2, x3, y3, n, seed, bins } = p;

  const A1 = areaTrapezoid(x1, x2, y1, y2);
  const A2 = areaTrapezoid(x2, x3, y2, y3);
  const AT = A1 + A2;

  const p1 = AT > 0 ? A1 / AT : 0.5;
  const p2 = 1 - p1;

  const rng = makeLCG(seed);

  const values: number[] = [];
  let c1 = 0;
  let c2 = 0;

  const firstRows: (string | number)[][] = [];

  for (let i = 1; i <= n; i++) {
    const R_region = rng.nextU();
    const R_valor = rng.nextU();

    let regionLabel = 'Región 1';
    let x = 0;

    if (R_region <= p1) {
      regionLabel = 'Región 1';
      c1++;
      x = invCdfLinearSegment(R_valor, x1, x2, y1, y2);
    } else {
      regionLabel = 'Región 2';
      c2++;
      x = invCdfLinearSegment(R_valor, x2, x3, y2, y3);
    }

    values.push(x);

    if (i <= 20) {
      firstRows.push([i, R_region.toFixed(4), R_valor.toFixed(4), regionLabel, x.toFixed(6)]);
    }
  }

  // Stats
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / Math.max(1, values.length);

  let s2 = 0;
  for (const v of values) s2 += (v - mean) * (v - mean);
  const std = Math.sqrt(s2 / Math.max(1, values.length - 1));

  // Histograma (densidad) en [x1,x3]
  const width = (x3 - x1) / bins || 1;
  const counts = new Array<number>(bins).fill(0);

  for (const x of values) {
    let idx = Math.floor((x - x1) / width);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  }

  const histDensity = counts.map((k) => k / (n * width));
  const centers = Array.from({ length: bins }, (_, i) => x1 + (i + 0.5) * width);
  const labels = centers.map((x) => x.toFixed(2));
  const theoPdf = centers.map((x) => pdfPiecewiseLinear(x, x1, y1, x2, y2, x3, y3, AT));

  const regionStats: Exercise12RegionStat[] = [
    {
      region: 'Región 1 [x1,x2]',
      count: c1,
      pct: (c1 * 100) / n,
      theoPct: p1 * 100,
      diffPct: Math.abs((c1 * 100) / n - p1 * 100),
    },
    {
      region: 'Región 2 [x2,x3]',
      count: c2,
      pct: (c2 * 100) / n,
      theoPct: p2 * 100,
      diffPct: Math.abs((c2 * 100) / n - p2 * 100),
    },
  ];

  const m1 = (y2 - y1) / (x2 - x1);
  const m2 = (y3 - y2) / (x3 - x2);

  const metrics: Record<string, string | number> = {
    x1,
    y1,
    x2,
    y2,
    x3,
    y3,
    'Área A₁': A1.toFixed(6),
    'Área A₂': A2.toFixed(6),
    'Área total': AT.toFixed(6),
    'p1 (Región 1)': `${p1.toFixed(6)} (${(p1 * 100).toFixed(2)}%)`,
    'p2 (Región 2)': `${p2.toFixed(6)} (${(p2 * 100).toFixed(2)}%)`,
    'Pendiente m1': m1.toFixed(6),
    'Pendiente m2': m2.toFixed(6),
    'Media (sim)': mean.toFixed(6),
    'Desv Std (sim)': std.toFixed(6),
    'Min (sim)': min.toFixed(6),
    'Max (sim)': max.toFixed(6),
  };

  return {
    kind: 'exercise-1-2-piecewise-linear',
    params: p,
    metrics,
    columns: ['Sim#', 'R_región', 'R_valor', 'Región', 'Valor X'],
    rows: firstRows,
    regionStats,
    chart: { labels, histDensity, theoPdf },
  };
}
