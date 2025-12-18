// src/utils/composicionSimulator.ts

export type ComposicionParams = {
  a: number; // punto donde termina la subida (desde 0)
  b: number; // inicio meseta
  c: number; // fin soporte
  n: number; // simulaciones
  seed: number; // semilla LCG
  bins: number; // bins histograma
};

export type ComposicionSimRow = {
  i: number;
  rRegion: number;
  rValor: number;
  region: 'f₁' | 'f₂' | 'f₃';
  x: number;
};

export type ComposicionRegionStat = {
  region: string;
  count: number;
  pct: number;
  theoPct: number;
  diffPct: number;
};

export type ComposicionOutput = {
  kind: 'composicion-trapezoidal';
  params: ComposicionParams;

  // para la tablita tipo ServiceSystems
  metrics: Record<string, string | number>;

  // primeras filas (tipo “mostrando primeras 20”)
  columns: string[];
  rows: (string | number)[][];

  regionStats: ComposicionRegionStat[];

  // chart hist + teórico
  chart: {
    labels: string[]; // centros de bins
    histDensity: number[];
    theoPdf: number[];
  };
};

function makeLCG(seed0: number) {
  // Igual a tu Python:
  // semilla = (a_cong * semilla + c_cong) % m_cong
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

function pdfTrapezoidal(x: number, a: number, b: number, c: number, h: number) {
  if (x < 0 || x > c) return 0;
  if (x <= a) return (h * x) / a; // sube lineal
  if (x <= b) return h; // meseta
  return (h * (c - x)) / (c - b); // baja lineal
}

export function runComposicion(params: ComposicionParams): ComposicionOutput {
  const { a, b, c, n, seed, bins } = params;

  // altura normalizada (misma fórmula que tu Python)
  const h = 2.0 / (a + 2.0 * (b - a) + (c - b));

  const A1 = (h * a) / 2.0;
  const A2 = h * (b - a);
  const A3 = (h * (c - b)) / 2.0;

  const rng = makeLCG(seed);

  const simRows: ComposicionSimRow[] = [];
  const values: number[] = [];

  const counts = { f1: 0, f2: 0, f3: 0 };

  for (let i = 1; i <= n; i++) {
    const R_region = rng.nextU();
    const R_valor = rng.nextU();

    let x = 0;
    let region: 'f₁' | 'f₂' | 'f₃' = 'f₁';

    if (R_region <= A1) {
      // f1: triangular creciente
      x = a * Math.sqrt(R_valor);
      region = 'f₁';
      counts.f1++;
    } else if (R_region <= A1 + A2) {
      // f2: uniforme en [a,b]
      x = R_valor * (b - a) + a;
      region = 'f₂';
      counts.f2++;
    } else {
      // f3: triangular decreciente
      x = c - (c - b) * Math.sqrt(1 - R_valor);
      region = 'f₃';
      counts.f3++;
    }

    values.push(x);

    if (i <= 20) {
      simRows.push({
        i,
        rRegion: R_region,
        rValor: R_valor,
        region,
        x,
      });
    }
  }

  // stats básicos
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / values.length;

  let s2 = 0;
  for (const v of values) s2 += (v - mean) * (v - mean);
  const std = Math.sqrt(s2 / Math.max(1, values.length - 1));

  // histograma (densidad) en [0,c]
  const bw = c / bins;
  const histCounts = new Array<number>(bins).fill(0);

  for (const x of values) {
    let idx = Math.floor(x / bw);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1; // por si cae en x=c
    histCounts[idx]++;
  }

  const histDensity = histCounts.map((k) => k / (n * bw));

  const centers = Array.from({ length: bins }, (_, i) => (i + 0.5) * bw);
  const labels = centers.map((x) => x.toFixed(2));
  const theoPdf = centers.map((x) => pdfTrapezoidal(x, a, b, c, h));

  const regionStats: ComposicionRegionStat[] = [
    {
      region: 'Región 1 (f₁)',
      count: counts.f1,
      pct: (counts.f1 * 100) / n,
      theoPct: A1 * 100,
      diffPct: Math.abs((counts.f1 * 100) / n - A1 * 100),
    },
    {
      region: 'Región 2 (f₂)',
      count: counts.f2,
      pct: (counts.f2 * 100) / n,
      theoPct: A2 * 100,
      diffPct: Math.abs((counts.f2 * 100) / n - A2 * 100),
    },
    {
      region: 'Región 3 (f₃)',
      count: counts.f3,
      pct: (counts.f3 * 100) / n,
      theoPct: A3 * 100,
      diffPct: Math.abs((counts.f3 * 100) / n - A3 * 100),
    },
  ];

  const columns = ['Sim#', 'R_región', 'R_valor', 'Región', 'Valor X'];
  const rows = simRows.map((r) => [
    r.i,
    r.rRegion.toFixed(4),
    r.rValor.toFixed(4),
    r.region,
    r.x.toFixed(6),
  ]);

  const metrics: Record<string, string | number> = {
    a,
    b,
    c,
    'Altura h': h.toFixed(6),
    'A₁ (triangular)': `${A1.toFixed(6)} (${(A1 * 100).toFixed(2)}%)`,
    'A₂ (rectangular)': `${A2.toFixed(6)} (${(A2 * 100).toFixed(2)}%)`,
    'A₃ (triangular)': `${A3.toFixed(6)} (${(A3 * 100).toFixed(2)}%)`,
    'Suma A₁+A₂+A₃': (A1 + A2 + A3).toFixed(6),
    'Media (sim)': mean.toFixed(6),
    'Desv Std (sim)': std.toFixed(6),
    'Min (sim)': min.toFixed(6),
    'Max (sim)': max.toFixed(6),
  };

  return {
    kind: 'composicion-trapezoidal',
    params,
    metrics,
    columns,
    rows,
    regionStats,
    chart: { labels, histDensity, theoPdf },
  };
}
