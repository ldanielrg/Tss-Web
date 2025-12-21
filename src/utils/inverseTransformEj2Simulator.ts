// src/utils/inverseTransformEj2Simulator.ts

export type InverseTransformEj2Side = 'left' | 'right' | 'full';

export type InverseTransformEj2Params = {
  a: number;
  b: number;
  c: number;
  n: number;
  seed: number;
  side: InverseTransformEj2Side;
  bins: number;
};

export type InverseTransformEj2Output = {
  kind: 'inverse-transform-ej2';
  params: InverseTransformEj2Params;

  metrics: Record<string, string>;

  columns: string[];
  rows: string[][];

  hist: {
    labels: string[];
    histDensity: number[];
    theoPdf: number[];
    fullTheoPdf: number[]; // <-- NUEVO: triángulo completo para overlay
  };

  scatter: {
    x: number[];
    fx: number[];
    theoLine: { x: number; y: number }[];      // guía del modo seleccionado
    fullTheoLine: { x: number; y: number }[];  // <-- NUEVO: triángulo completo
  };
};

function makeLCG(seed0: number) {
  const a = 16807;
  const c = 1;
  const m = 2147483647;
  let seed = Math.floor(seed0);

  return {
    nextU(): number {
      seed = (a * seed + c) % m;
      return seed / m;
    },
  };
}

// --- PDFs "solo tramo" (normalizadas a 1 en su tramo)
function fLeftUnit(x: number, a: number, b: number) {
  if (x < a || x > b) return 0;
  const den = (b - a) * (b - a);
  return den <= 0 ? NaN : (2 * (x - a)) / den;
}
function fRightUnit(x: number, b: number, c: number) {
  if (x < b || x > c) return 0;
  const den = (c - b) * (c - b);
  return den <= 0 ? NaN : (2 * (c - x)) / den;
}

// --- PDF del triángulo COMPLETO (área total 1)
function fTriFull(x: number, a: number, b: number, c: number) {
  if (x < a || x > c) return 0;
  const den = (c - a);
  if (den <= 0) return NaN;

  if (x <= b) {
    const denL = (b - a) * (c - a);
    return denL <= 0 ? NaN : (2 * (x - a)) / denL;
  } else {
    const denR = (c - b) * (c - a);
    return denR <= 0 ? NaN : (2 * (c - x)) / denR;
  }
}

// --- Inversas
function invLeftUnit(R: number, a: number, b: number) {
  return a + (b - a) * Math.sqrt(R);
}
function invRightUnit(R: number, b: number, c: number) {
  return c - (c - b) * Math.sqrt(1 - R);
}

// Inversa del triángulo completo:
// pLeft = (b-a)/(c-a)
// si R < pLeft: x = a + sqrt(R*(b-a)*(c-a))
// si no:        x = c - sqrt((1-R)*(c-b)*(c-a))
function invTriFull(R: number, a: number, b: number, c: number) {
  const ca = (c - a);
  const pLeft = (b - a) / ca;

  if (R < pLeft) {
    return a + Math.sqrt(R * (b - a) * ca);
  }
  return c - Math.sqrt((1 - R) * (c - b) * ca);
}

export function runInverseTransformEj2(params: InverseTransformEj2Params): InverseTransformEj2Output {
  const { a, b, c, n, seed, side, bins } = params;

  const rng = makeLCG(seed);

  const xs: number[] = new Array(n);
  const fxs: number[] = new Array(n);

  let sumX = 0;
  let sumX2 = 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;

  const getX = (R: number) => {
    if (side === 'left') return invLeftUnit(R, a, b);
    if (side === 'right') return invRightUnit(R, b, c);
    return invTriFull(R, a, b, c);
  };

  const getFx = (x: number) => {
    if (side === 'left') return fLeftUnit(x, a, b);
    if (side === 'right') return fRightUnit(x, b, c);
    return fTriFull(x, a, b, c);
  };

  for (let i = 0; i < n; i++) {
    const R = rng.nextU();
    const x = getX(R);
    const fx = getFx(x);

    xs[i] = x;
    fxs[i] = fx;

    sumX += x;
    sumX2 += x * x;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }

  const mean = sumX / n;
  const varS = (sumX2 - n * mean * mean) / Math.max(1, n - 1);

  // Teórico
  let meanTheo: number;
  let varTheo: number;

  if (side === 'left') {
    meanTheo = a + (2 * (b - a)) / 3;
    varTheo = ((b - a) * (b - a)) / 18;
  } else if (side === 'right') {
    meanTheo = c - (2 * (c - b)) / 3;
    varTheo = ((c - b) * (c - b)) / 18;
  } else {
    // Triangular(a,b,c)
    meanTheo = (a + b + c) / 3;
    varTheo = (a * a + b * b + c * c - a * b - a * c - b * c) / 18;
  }

  // Tabla primeras 20 (con el mismo seed)
  const columns = ['Iteración', 'R', 'Modo', 'x', 'f(x)'];
  const rows: string[][] = [];
  const m = Math.min(20, n);

  const rng2 = makeLCG(seed);
  for (let i = 0; i < m; i++) {
    const R = rng2.nextU();
    const x = getX(R);
    const fx = getFx(x);

    rows.push([
      (i + 1).toString(),
      R.toFixed(6),
      side === 'left' ? 'Izq' : side === 'right' ? 'Der' : 'Completo',
      x.toFixed(6),
      fx.toFixed(6),
    ]);
  }

  // Histograma en [a,c]
  const L = a;
  const U = c;
  const bw = (U - L) / bins;
  const counts = new Array<number>(bins).fill(0);

  for (const x of xs) {
    let idx = Math.floor((x - L) / bw);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1;
    counts[idx] += 1;
  }

  const histDensity = counts.map((cc) => cc / (n * bw));
  const centers = Array.from({ length: bins }, (_, i) => L + (i + 0.5) * bw);
  const labels = centers.map((v) => v.toFixed(3));

  const theoPdf = centers.map((x) => getFx(x));
  const fullTheoPdf = centers.map((x) => fTriFull(x, a, b, c));

  // Líneas teóricas para dispersión
  const fullTheoLine = [
    { x: a, y: 0 },
    { x: b, y: 2 / Math.max(1e-12, c - a) },
    { x: c, y: 0 },
  ];

  const theoLine =
    side === 'left'
      ? [
          { x: a, y: 0 },
          { x: b, y: 2 / Math.max(1e-12, b - a) },
        ]
      : side === 'right'
      ? [
          { x: b, y: 2 / Math.max(1e-12, c - b) },
          { x: c, y: 0 },
        ]
      : fullTheoLine;

  const metrics: Record<string, string> = {
    'Modo': side === 'left' ? 'Izq [a,b]' : side === 'right' ? 'Der [b,c]' : 'Triángulo completo [a,c]',
    'Media (sim)': mean.toFixed(6),
    'Var.S (sim)': varS.toFixed(6),
    'Media (teo)': meanTheo.toFixed(6),
    'Var (teo)': varTheo.toFixed(6),
    '|Media sim - teo|': Math.abs(mean - meanTheo).toFixed(6),
    '|Var sim - teo|': Math.abs(varS - varTheo).toFixed(6),
    'Min x (sim)': minX.toFixed(6),
    'Max x (sim)': maxX.toFixed(6),
  };

  return {
    kind: 'inverse-transform-ej2',
    params,
    metrics,
    columns,
    rows,
    hist: { labels, histDensity, theoPdf, fullTheoPdf },
    scatter: { x: xs, fx: fxs, theoLine, fullTheoLine },
  };
}
