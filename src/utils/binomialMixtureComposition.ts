// src/utils/binomialMixtureComposition.ts

export type BinomialMixtureParams = {
  n: number;
  theta1: number;
  theta2: number;
  p: number; // prob elegir componente 1
  N: number; // tamaño de muestra
  seed: number; // para LCG
};

export type BinomialMixtureRow = {
  i: number;
  R_sel: number; // R1
  U: number;     // R2
  X: number;
  componente: "x1 (θ1)" | "x2 (θ2)";
};

export type BinomialMixtureResult = {
  rows: BinomialMixtureRow[];
  pmfData: { x: number; emp: number; teor: number }[];
  inverseGuide: { u: number; inv1: number; inv2: number }[];
  inversePoints: { u: number; x: number }[];
  stats: {
    meanEmp: number;
    varEmp: number;
    meanTeo: number;
    varTeo: number;
  };
};

export function simulateBinomialMixtureByComposition(params: BinomialMixtureParams): BinomialMixtureResult {
  const { n, theta1, theta2, p, N, seed } = params;

  // Generador congruencial mixto simple (LCG)
  const rng = makeLCG(seed);

  // PMFs y CDFs de cada componente
  const pmf1 = pmfBinomial(n, theta1);
  const pmf2 = pmfBinomial(n, theta2);
  const cdf1 = cdfFromPmf(pmf1);
  const cdf2 = cdfFromPmf(pmf2);

  // PMF mezcla teórica
  const pmfMix = Array.from({ length: n + 1 }, (_, x) => p * pmf1[x] + (1 - p) * pmf2[x]);

  const rows: BinomialMixtureRow[] = [];
  const counts = Array.from({ length: n + 1 }, () => 0);
  const inversePoints: { u: number; x: number }[] = [];

  // Simulación por composición
  for (let i = 1; i <= N; i++) {
    const R1 = rng(); // selector
    const R2 = rng(); // inversa

    let X: number;
    let componente: BinomialMixtureRow["componente"];

    if (R1 <= p) {
      X = inverseDiscreteFromCdf(cdf1, R2);
      componente = "x1 (θ1)";
    } else {
      X = inverseDiscreteFromCdf(cdf2, R2);
      componente = "x2 (θ2)";
    }

    counts[X]++;
    rows.push({ i, R_sel: R1, U: R2, X, componente });
    inversePoints.push({ u: R2, x: X });
  }

  // PMF empírica
  const pmfEmp = counts.map((c) => c / N);

  const pmfData = Array.from({ length: n + 1 }, (_, x) => ({
    x,
    emp: pmfEmp[x],
    teor: pmfMix[x],
  }));

  // Guía inversa (escalones)
  const uBreaks = uniqueSorted([0, 1, ...cdf1, ...cdf2]);
  const inverseGuide = uBreaks.map((u) => ({
    u,
    inv1: inverseDiscreteFromCdf(cdf1, u),
    inv2: inverseDiscreteFromCdf(cdf2, u),
  }));

  // Estadísticas empíricas
  const meanEmp = pmfEmp.reduce((s, pr, x) => s + x * pr, 0);
  const ex2Emp = pmfEmp.reduce((s, pr, x) => s + x * x * pr, 0);
  const varEmp = ex2Emp - meanEmp * meanEmp;

  // Estadísticas teóricas (mezcla)
  const mu1 = n * theta1;
  const mu2 = n * theta2;
  const var1 = n * theta1 * (1 - theta1);
  const var2 = n * theta2 * (1 - theta2);

  const meanTeo = p * mu1 + (1 - p) * mu2;
  const varTeo =
    p * var1 +
    (1 - p) * var2 +
    p * (mu1 - meanTeo) * (mu1 - meanTeo) +
    (1 - p) * (mu2 - meanTeo) * (mu2 - meanTeo);

  return {
    rows,
    pmfData,
    inverseGuide,
    inversePoints,
    stats: { meanEmp, varEmp, meanTeo, varTeo },
  };
}

/* ===================== Helpers ===================== */

// LCG (mixto): X_{k+1} = (aX_k + c) mod m, U = X/m
function makeLCG(seed: number) {
  let x = Math.trunc(seed) >>> 0;

  // parámetros típicos (m = 2^32)
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;

  return () => {
    x = (a * x + c) >>> 0;
    // evita 0 exacto
    const u = (x + 1) / (m + 1);
    return u;
  };
}

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

// inversa discreta generalizada: min{x: F(x) >= u}
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
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
}

function uniqueSorted(arr: number[]): number[] {
  const s = Array.from(new Set(arr.map((v) => (v <= 0 ? 0 : v >= 1 ? 1 : v))));
  s.sort((a, b) => a - b);
  return s;
}
