export type ExponentialMixtureParams = {
  beta1: number;
  beta2: number;
  p: number;   // prob de elegir componente 1
  N: number;   // iteraciones
};

export type ExponentialMixtureRow = {
  i: number;
  R_sel: number;
  U: number;
  X: number;
  componente: "x1 (β1)" | "x2 (β2)";
};

export type ExponentialMixtureResult = {
  rows: ExponentialMixtureRow[];
  points: { u: number; x: number }[];
  guide: { u: number; x1: number; x2: number }[];
  yMax: number; // para graficar sin que outliers revienten el eje
};

export function simulateExponentialMixtureInverse(params: ExponentialMixtureParams): ExponentialMixtureResult {
  const { beta1, beta2, p, N } = params;

  const rows: ExponentialMixtureRow[] = [];
  const points: { u: number; x: number }[] = [];
  const xs: number[] = [];

  for (let i = 1; i <= N; i++) {
    const R_sel = Math.random();
    const U = Math.random();

    let X: number;
    let componente: ExponentialMixtureRow["componente"];

    if (R_sel <= p) {
      X = -Math.log(1 - U) / beta1;
      componente = "x1 (β1)";
    } else {
      X = -Math.log(1 - U) / beta2;
      componente = "x2 (β2)";
    }

    rows.push({ i, R_sel, U, X, componente });
    points.push({ u: U, x: X });
    xs.push(X);
  }

  const yMax = robustYMax(xs);

  // Curvas guía: F^{-1}(u) = -ln(1-u)/β
  const guideN = 300;
  const guide: { u: number; x1: number; x2: number }[] = [];
  for (let i = 0; i < guideN; i++) {
    const u = (i + 0.5) / guideN; // evita 0 y 1 exactos
    const x1 = -Math.log(1 - u) / beta1;
    const x2 = -Math.log(1 - u) / beta2;
    guide.push({ u, x1, x2 });
  }

  return { rows, points, guide, yMax: Math.max(yMax, maxGuideY(guide)) };
}

/* ===================== BINOMIAL MIXTURE ===================== */

export type BinomialMixtureParams = {
  n: number;
  theta1: number;
  theta2: number;
  p: number;
  N: number;
};

export type BinomialMixtureRow = {
  i: number;
  R_sel: number;
  U: number;
  X: number;
  componente: "x1 (θ1)" | "x2 (θ2)";
};

export type BinomialMixtureResult = {
  rows: BinomialMixtureRow[];
  pmfData: { x: number; emp: number; teor: number }[]; // para chart PMF
  inverseGuide: { u: number; inv1: number; inv2: number }[]; // escalones
  inversePoints: { u: number; x: number }[];
};

export function simulateBinomialMixture(params: BinomialMixtureParams): BinomialMixtureResult {
  const { n, theta1, theta2, p, N } = params;

  const pmf1 = pmfBinomial(n, theta1);
  const pmf2 = pmfBinomial(n, theta2);
  const cdf1 = cdfFromPmf(pmf1);
  const cdf2 = cdfFromPmf(pmf2);

  const pmfMix = Array.from({ length: n + 1 }, (_, x) => p * pmf1[x] + (1 - p) * pmf2[x]);

  const counts = Array.from({ length: n + 1 }, () => 0);
  const rows: BinomialMixtureRow[] = [];
  const inversePoints: { u: number; x: number }[] = [];

  for (let i = 1; i <= N; i++) {
    const R_sel = Math.random();
    const U = Math.random();

    let X: number;
    let componente: BinomialMixtureRow["componente"];

    if (R_sel <= p) {
      X = inverseDiscreteFromCdf(cdf1, U);
      componente = "x1 (θ1)";
    } else {
      X = inverseDiscreteFromCdf(cdf2, U);
      componente = "x2 (θ2)";
    }

    counts[X]++;
    rows.push({ i, R_sel, U, X, componente });
    inversePoints.push({ u: U, x: X });
  }

  const pmfEmp = counts.map((c) => c / N);
  const pmfData = Array.from({ length: n + 1 }, (_, x) => ({
    x,
    emp: pmfEmp[x],
    teor: pmfMix[x],
  }));

  // Guía inversa (escalón): u -> x para cada componente
  const uBreaks = uniqueSorted([0, 1, ...cdf1, ...cdf2]); // puntos donde cambian escalones
  const inverseGuide = uBreaks.map((u) => ({
    u,
    inv1: inverseDiscreteFromCdf(cdf1, u),
    inv2: inverseDiscreteFromCdf(cdf2, u),
  }));

  return { rows, pmfData, inverseGuide, inversePoints };
}

/* ===================== helpers ===================== */

function pmfBinomial(n: number, theta: number): number[] {
  const pmf = Array.from({ length: n + 1 }, () => 0);

  if (theta <= 0) { pmf[0] = 1; return pmf; }
  if (theta >= 1) { pmf[n] = 1; return pmf; }

  for (let x = 0; x <= n; x++) {
    pmf[x] = choose(n, x) * Math.pow(theta, x) * Math.pow(1 - theta, n - x);
  }
  return pmf;
}

function cdfFromPmf(pmf: number[]): number[] {
  const cdf: number[] = [];
  let s = 0;
  for (let i = 0; i < pmf.length; i++) {
    s += pmf[i];
    cdf.push(s);
  }
  cdf[cdf.length - 1] = 1.0;
  return cdf;
}

function inverseDiscreteFromCdf(cdf: number[], u: number): number {
  for (let x = 0; x < cdf.length; x++) {
    if (u <= cdf[x]) return x;
  }
  return cdf.length - 1;
}

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - k + i)) / i;
  }
  return c;
}

function uniqueSorted(arr: number[]): number[] {
  const s = Array.from(new Set(arr.map((v) => (v <= 0 ? 0 : v >= 1 ? 1 : v))));
  s.sort((a, b) => a - b);
  return s;
}

function robustYMax(xs: number[]): number {
  if (!xs.length) return 1;
  const sorted = [...xs].sort((a, b) => a - b);
  const q = quantile(sorted, 0.99);
  return q > 0 ? q : Math.max(...sorted);
}

function quantile(sortedAsc: number[], q: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
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
