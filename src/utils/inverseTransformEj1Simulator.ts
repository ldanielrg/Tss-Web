// src/utils/inverseTransformEj1Simulator.ts

export type InverseTransformEj1Params = {
  L: number;     // límite inferior del soporte
  U: number;     // límite superior del soporte
  n: number;     // simulaciones
  seed: number;  // semilla LCG
  bins: number;  // bins histograma
};

export type InverseTransformEj1SimRow = {
  i: number;
  r: number;
  x: number;
};

export type InverseTransformEj1Output = {
  kind: 'inverse-transform-ej1';
  params: InverseTransformEj1Params;

  metrics: Record<string, string>;

  // Para tabla (primeras 20)
  columns: string[];
  rows: string[][];

  // Chart hist + teórico
  chart: {
    labels: string[];      // centros de bins
    histDensity: number[]; // densidad empírica
    theoPdf: number[];     // f(x) teórica en centros
  };

  // Scatter (R,X)
  scatter: {
    r: number[];
    x: number[];
  };
};

// Mismo estilo que composicionSimulator (LCG simple)
function makeLCG(seed0: number) {
  const a = 16807;
  const c = 1;
  const m = 2147483647;

  let seed = Math.floor(seed0);

  return {
    nextU(): number {
      seed = (a * seed + c) % m;
      return seed / m; // (0,1)
    },
    getSeed(): number {
      return seed;
    },
  };
}

// Parámetros internos del modelo generalizado a [L,U]
function modelParams(L: number, U: number) {
  const a = (L + U) / 2;      // centro
  const d = (U - L) / 2;      // semi-rango
  // pdf: f(x) = 3/(2 d^3) (x-a)^2 en [L,U]
  const K = 3 / (2 * d * d * d);
  return { a, d, K };
}

function pdf(x: number, L: number, U: number) {
  if (x < L || x > U) return 0;
  const { a, K } = modelParams(L, U);
  const t = x - a;
  return K * t * t;
}

// Inversa general: x = a + d * cbrt(2R-1)
function invCdf(r: number, L: number, U: number) {
  const { a, d } = modelParams(L, U);
  return a + d * Math.cbrt(2 * r - 1);
}

export function runInverseTransformEj1(params: InverseTransformEj1Params): InverseTransformEj1Output {
  const { L, U, n, seed, bins } = params;

  const rng = makeLCG(seed);

  const rArr: number[] = new Array(n);
  const xArr: number[] = new Array(n);

  let sum = 0;
  let sum2 = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < n; i++) {
    const r = rng.nextU();
    const x = invCdf(r, L, U);

    rArr[i] = r;
    xArr[i] = x;

    sum += x;
    sum2 += x * x;
    if (x < min) min = x;
    if (x > max) max = x;
  }

  const mean = sum / n;
  const varS = (sum2 - n * mean * mean) / Math.max(1, n - 1);
  const std = Math.sqrt(Math.max(0, varS));

  // Teórico
  const { a, d } = modelParams(L, U);
  const meanTheo = a;
  const varTheo = (3 * d * d) / 5; // varianza de esta familia
  const stdTheo = Math.sqrt(varTheo);

  // Histograma (densidad) en [L,U]
  const bw = (U - L) / bins;
  const histCounts = new Array<number>(bins).fill(0);

  for (const x of xArr) {
    let idx = Math.floor((x - L) / bw);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1;
    histCounts[idx] += 1;
  }

  const histDensity = histCounts.map((c) => c / (n * bw));
  const centers = Array.from({ length: bins }, (_, i) => L + (i + 0.5) * bw);
  const labels = centers.map((x) => x.toFixed(3));
  const theoPdf = centers.map((x) => pdf(x, L, U));

  // Tabla primeras 20
  const columns = ['Iteración', 'R', 'X'];
  const rows: string[][] = [];
  const m = Math.min(20, n);
  for (let i = 0; i < m; i++) {
    rows.push([(i + 1).toString(), rArr[i].toFixed(6), xArr[i].toFixed(6)]);
  }

  const metrics: Record<string, string> = {
    'Media (sim)': mean.toFixed(6),
    'Var.S (sim)': varS.toFixed(6),
    'Std (sim)': std.toFixed(6),
    'Min (sim)': min.toFixed(6),
    'Max (sim)': max.toFixed(6),
    'Media (teo)': meanTheo.toFixed(6),
    'Var (teo)': varTheo.toFixed(6),
    'Std (teo)': stdTheo.toFixed(6),
    '|Media sim - teo|': Math.abs(mean - meanTheo).toFixed(6),
    '|Var sim - teo|': Math.abs(varS - varTheo).toFixed(6),
  };

  return {
    kind: 'inverse-transform-ej1',
    params,
    metrics,
    columns,
    rows,
    chart: { labels, histDensity, theoPdf },
    scatter: { r: rArr, x: xArr },
  };
}
