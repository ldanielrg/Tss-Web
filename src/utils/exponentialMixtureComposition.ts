// src/utils/exponentialMixtureComposition.ts

export type ExpMixParams = {
  beta1: number;
  beta2: number;
  p: number;   // prob. componente 1
  N: number;   // tamaño muestra
  bins?: number; // opcional: bins para histograma
};

export type ExpMixRow = {
  i: number;
  R_sel: number; // U0 selector
  U: number;     // U1 para inversa
  X: number;
  componente: "x1 (β1)" | "x2 (β2)";
};

export type ExpMixStats = {
  n1: number;
  n2: number;
  pHat: number;

  meanEmp: number;
  varEmp: number;

  meanTheor: number;
  varTheor: number;

  ks: number;       // KS aproximado contra CDF teórica
  maxXUsed: number; // máximo robusto usado para hist/plots
};

export type ExpMixChartHistogram = { x: number; hist: number; pdf: number }[];
export type ExpMixChartEcdf = { x: number; ecdf: number; cdf: number }[];

export type ExpMixResult = {
  rows: ExpMixRow[];
  // Para scatter inversa
  points: { u: number; x: number }[];
  guide: { u: number; x1: number; x2: number }[];
  yMax: number;

  // Para selector (composición)
  selectorPoints: { i: number; r: number; picked: 1 | 2 }[];

  // Para validación
  histogram: ExpMixChartHistogram;
  ecdf: ExpMixChartEcdf;

  stats: ExpMixStats;
};

export function simulateExpMixtureByComposition(params: ExpMixParams): ExpMixResult {
  const { beta1, beta2, p, N } = params;
  const bins = clampInt(params.bins ?? defaultBins(N), 10, 120);

  const rows: ExpMixRow[] = [];
  const points: { u: number; x: number }[] = [];
  const selectorPoints: { i: number; r: number; picked: 1 | 2 }[] = [];

  const xs: number[] = [];
  let n1 = 0;

  for (let i = 1; i <= N; i++) {
    const R_sel = Math.random(); // U0 selector
    const U = Math.random();     // U1 inversa

    let X: number;
    let componente: ExpMixRow["componente"];
    let picked: 1 | 2;

    if (R_sel <= p) {
      // componente 1 ~ Exp(beta1)
      X = -Math.log(1 - U) / beta1;
      componente = "x1 (β1)";
      picked = 1;
      n1++;
    } else {
      // componente 2 ~ Exp(beta2)
      X = -Math.log(1 - U) / beta2;
      componente = "x2 (β2)";
      picked = 2;
    }

    rows.push({ i, R_sel, U, X, componente });
    points.push({ u: U, x: X });
    selectorPoints.push({ i, r: R_sel, picked });
    xs.push(X);
  }

  const n2 = N - n1;
  const pHat = n1 / N;

  // Curvas guía para inversa: F^{-1}(u) = -ln(1-u)/beta
  const guideN = 300;
  const guide: { u: number; x1: number; x2: number }[] = [];
  for (let k = 0; k < guideN; k++) {
    const u = (k + 0.5) / guideN;
    guide.push({
      u,
      x1: -Math.log(1 - u) / beta1,
      x2: -Math.log(1 - u) / beta2,
    });
  }

  const yMax = Math.max(robustYMax(xs, 0.99), maxGuideY(guide));

  // --- Validación: Histograma (densidad) vs PDF teórica ---
  const maxXUsed = robustYMax(xs, 0.995);
  const histogram = buildHistogramDensity(xs, bins, maxXUsed, (x) => pdfMix(x, beta1, beta2, p));

  // --- Validación: ECDF vs CDF teórica ---
  const ecdf = buildEcdfVsCdf(xs, (x) => cdfMix(x, beta1, beta2, p), 450);

  // --- Estadísticos empíricos ---
  const meanEmp = mean(xs);
  const varEmp = variance(xs, meanEmp);

  // --- Teóricos de la mezcla ---
  const mu1 = 1 / beta1;
  const mu2 = 1 / beta2;
  const var1 = 1 / (beta1 * beta1);
  const var2 = 1 / (beta2 * beta2);

  const meanTheor = p * mu1 + (1 - p) * mu2;
  const secondMoment = p * (var1 + mu1 * mu1) + (1 - p) * (var2 + mu2 * mu2);
  const varTheor = secondMoment - meanTheor * meanTheor;

  // KS aproximado
  const ks = approxKS(xs, (x) => cdfMix(x, beta1, beta2, p));

  return {
    rows,
    points,
    guide,
    yMax,
    selectorPoints,
    histogram,
    ecdf,
    stats: {
      n1,
      n2,
      pHat,
      meanEmp,
      varEmp,
      meanTheor,
      varTheor,
      ks,
      maxXUsed,
    },
  };
}

/* ====================== Distribución mezcla ====================== */

export function pdfMix(x: number, beta1: number, beta2: number, p: number): number {
  if (x < 0) return 0;
  return p * beta1 * Math.exp(-beta1 * x) + (1 - p) * beta2 * Math.exp(-beta2 * x);
}

export function cdfMix(x: number, beta1: number, beta2: number, p: number): number {
  if (x < 0) return 0;
  const F1 = 1 - Math.exp(-beta1 * x);
  const F2 = 1 - Math.exp(-beta2 * x);
  return p * F1 + (1 - p) * F2;
}

/* ====================== Helpers: Histogram/ECDF ====================== */

function buildHistogramDensity(
  xs: number[],
  bins: number,
  maxX: number,
  pdf: (x: number) => number
): { x: number; hist: number; pdf: number }[] {
  const n = xs.length;
  if (!n || maxX <= 0) return [];

  const w = maxX / bins;
  const counts = Array.from({ length: bins }, () => 0);

  for (const x of xs) {
    if (x < 0) continue;
    const idx = Math.min(bins - 1, Math.floor(x / w));
    if (idx >= 0 && idx < bins) counts[idx]++;
  }

  const out: { x: number; hist: number; pdf: number }[] = [];
  for (let i = 0; i < bins; i++) {
    const center = (i + 0.5) * w;
    const density = counts[i] / (n * w);
    out.push({ x: center, hist: density, pdf: pdf(center) });
  }
  return out;
}

function buildEcdfVsCdf(
  xs: number[],
  cdf: (x: number) => number,
  maxPoints: number
): { x: number; ecdf: number; cdf: number }[] {
  const n = xs.length;
  if (!n) return [];

  const sorted = [...xs].sort((a, b) => a - b);

  // Downsample uniforme en índices
  const m = Math.min(maxPoints, n);
  const out: { x: number; ecdf: number; cdf: number }[] = [];

  for (let j = 1; j <= m; j++) {
    const idx = Math.floor((j * n) / m) - 1;
    const k = clampInt(idx, 0, n - 1);
    const x = sorted[k];
    const ec = (k + 1) / n;
    out.push({ x, ecdf: ec, cdf: cdf(x) });
  }

  // Asegura arranque desde x=0 (visual)
  if (out.length && out[0].x > 0) {
    out.unshift({ x: 0, ecdf: 0, cdf: cdf(0) });
  }

  return out;
}

/* ====================== Helpers: estadísticos ====================== */

function mean(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return xs.length ? s / xs.length : 0;
}

function variance(xs: number[], mu?: number): number {
  if (!xs.length) return 0;
  const m = mu ?? mean(xs);
  let s = 0;
  for (const x of xs) {
    const d = x - m;
    s += d * d;
  }
  return s / xs.length;
}

function approxKS(xs: number[], cdf: (x: number) => number): number {
  const n = xs.length;
  if (!n) return 0;
  const sorted = [...xs].sort((a, b) => a - b);

  let dMax = 0;
  for (let i = 0; i < n; i++) {
    const x = sorted[i];
    const F = cdf(x);
    const Fn = (i + 1) / n;
    const diff = Math.abs(Fn - F);
    if (diff > dMax) dMax = diff;
  }
  return dMax;
}

/* ====================== Helpers: robustos y misc ====================== */

function robustYMax(xs: number[], q: number): number {
  if (!xs.length) return 1;
  const sorted = [...xs].sort((a, b) => a - b);
  const val = quantile(sorted, q);
  return val > 0 ? val : Math.max(...sorted);
}

function quantile(sortedAsc: number[], q: number): number {
  const n = sortedAsc.length;
  if (!n) return 0;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo];
  const w = pos - lo;
  return sortedAsc[lo] * (1 - w) + sortedAsc[hi] * w;
}

function maxGuideY(guide: { u: number; x1: number; x2: number }[]): number {
  let m = 0;
  for (const g of guide) m = Math.max(m, g.x1, g.x2);
  return m || 1;
}

function defaultBins(N: number): number {
  // regla simple (Sturges-ish suave)
  const b = Math.round(1 + 3.3 * Math.log10(Math.max(2, N)));
  return clampInt(b * 3, 20, 80);
}

function clampInt(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, Math.floor(x)));
}
