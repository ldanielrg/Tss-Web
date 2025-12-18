import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Calculator,
  BarChart3,
  Dices,
  Sigma,
  Shuffle,
  Target,
  GitBranch,
} from 'lucide-react';
import Tooltip from './Tooltip';
import DistributionChart from './DistributionChart';
import ScatterPlot from './ScatterPlot';
import HeatmapGrid from './HeatmapGrid';
import SimpleLineChart from './SimpleLineChart';
import { Statistics } from '../utils/statistics';

type PRNGType = 'math' | 'lcg_mixed' | 'lcg_mult';

type Sample = {
  u: number[];
  seedUsed: number;
  periodDetected: number | null;
};

function normalInv(p: number): number {
  // Aproximación de Acklam (suficiente para críticos)
  if (p <= 0 || p >= 1) return NaN;
  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00,
  ];
  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01,
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00,
  ];
  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00,
  ];

  const plow = 0.02425;
  const phigh = 1 - plow;

  let q: number, r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  q = p - 0.5;
  r = q * q;
  return (
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

function zCritTwoSided(alpha: number) {
  return normalInv(1 - alpha / 2);
}

function chiSquareCritRightTail(df: number, alpha: number) {
  // Wilson–Hilferty
  const z = normalInv(1 - alpha);
  const t = 1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df));
  return df * Math.pow(t, 3);
}

function ksCrit(alpha: number, n: number) {
  // Aproximación típica
  const c =
    alpha <= 0.01 ? 1.63 :
    alpha <= 0.05 ? 1.36 :
    1.22;
  return c / Math.sqrt(n);
}

function generateLCGSample(params: {
  n: number;
  seed: number;
  a: number;
  c: number;
  m: number;
  type: PRNGType;
}): Sample {
  const { n, seed, a, c, m, type } = params;

  let x = Math.floor(seed % m);
  const seen = new Map<number, number>();
  const u: number[] = [];
  let period: number | null = null;

  for (let i = 0; i < n; i++) {
    if (seen.has(x)) {
      period = i - (seen.get(x) ?? i);
    } else {
      seen.set(x, i);
    }

    if (type === 'lcg_mult') {
      x = (a * x) % m;
    } else {
      x = (a * x + c) % m;
    }

    u.push(x / m);
  }

  return { u, seedUsed: seed, periodDetected: period };
}

function sampleU(
  prngType: PRNGType,
  n: number,
  seed: number,
  a: number,
  c: number,
  m: number
): Sample {
  if (prngType === 'math') {
    const u = Array.from({ length: n }, () => Math.random());
    return { u, seedUsed: seed, periodDetected: null };
  }
  return generateLCGSample({ n, seed, a, c, m, type: prngType });
}

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, subtitle, open, onToggle, children }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50"
    >
      <div className="flex items-start gap-3">
        <div className="text-blue-600 mt-1">{icon}</div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
        </div>
      </div>
      <div className="text-gray-400">{open ? '—' : '+'}</div>
    </button>
    {open && <div className="p-5 border-t border-gray-100">{children}</div>}
  </div>
);

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="font-semibold text-blue-900 mb-2">{title}</div>
    <div className="text-sm text-blue-900/90 leading-relaxed">{children}</div>
  </div>
);

const TipCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
    <div className="font-semibold text-amber-900 mb-2">{title}</div>
    <div className="text-sm text-amber-900/90 leading-relaxed">{children}</div>
  </div>
);

const MiniTheory: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border rounded-lg p-4">
    <div className="text-sm text-gray-800 leading-relaxed">{children}</div>
  </div>
);

const ConceptualModule: React.FC = () => {
  // ======= (Intro cards existentes) =======
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const concepts = [
    {
      id: 'variable-aleatoria',
      title: 'Variable Aleatoria',
      icon: <Calculator className="w-6 h-6" />,
      description: 'Una función que asigna un número real a cada resultado de un experimento aleatorio.',
      details: `Ejemplo (moneda): si lanzamos una moneda 10 veces, una VA puede ser:
"X = número de caras obtenidas".

Eso ya te deja medir y comparar resultados entre simulaciones.`,
      formula: 'X(ω) = valor numérico del resultado ω',
    },
    {
      id: 'distribucion',
      title: 'Distribución de Probabilidad',
      icon: <BarChart3 className="w-6 h-6" />,
      description: 'Modelo matemático que describe cómo se distribuyen probabilidades de una variable aleatoria.',
      details: `Ejemplo (moneda sesgada):
P(Cara)=p, P(Cruz)=1-p.

Ejemplo (tiempos): Exponencial(λ) para tiempos entre eventos.`,
      formula: 'P(a ≤ X ≤ b) = ∫[a,b] f(x)dx',
    },
    {
      id: 'simulacion',
      title: 'Simulación y Monte Carlo',
      icon: <HelpCircle className="w-6 h-6" />,
      description: 'Imitar sistemas con números aleatorios y estimar resultados cuando el análisis exacto es difícil.',
      details: `Idea clave:
1) Generas U(0,1)
2) Verificas que “parezcan” uniformes e independientes
3) Transformas a la distribución que necesitas
4) Repites muchas veces y estimas (promedios, probabilidades, costos, etc.)`,
      formula: 'Estimación ≈ promedio de muchas corridas',
    },
  ];

  // ======= Fuente aleatoria (compartida por todo el módulo A) =======
  const [prngType, setPrngType] = useState<PRNGType>('lcg_mixed');
  const [nBase, setNBase] = useState(2000);
  const [seed, setSeed] = useState(12345);
  const [a, setA] = useState(1103515245);
  const [c, setC] = useState(12345);
  const [m, setM] = useState(2 ** 31);
  const [baseSample, setBaseSample] = useState<Sample | null>(null);

  const baseU = baseSample?.u ?? [];

  // IMPORTANTÍSIMO (performance): no toca state, solo devuelve un prefijo de tamaño exacto.
  const getU = (need: number): number[] => {
    if (baseSample && baseSample.u.length >= need) return baseSample.u.slice(0, need);
    return sampleU(prngType, need, seed, a, c, m).u;
  };

  // ======= Secciones (accordion) =======
  const [openId, setOpenId] = useState<string>('s1');

  // ===========================
  // (1) PRNG + moneda
  // ===========================
  const prngStats = useMemo(() => {
    if (!baseSample) return null;
    const mean = Statistics.mean(baseSample.u);
    const variance = Statistics.variance(baseSample.u);
    const heads = baseSample.u.filter((x) => x < 0.5).length;
    return { mean, variance, heads };
  }, [baseSample]);

  const prngHistogram = useMemo(() => {
    if (!baseSample || openId !== 's1') return null;
    const hist = Statistics.histogram(baseSample.u, 25);
    const x = Array.from({ length: 101 }, (_, i) => i / 100);
    const y = x.map(() => 1);
    return { hist, curve: { x, y } };
  }, [baseSample, openId]);

  const prngScatter = useMemo(() => {
    if (!baseSample || openId !== 's1') return [];
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < Math.min(baseSample.u.length - 1, 1200); i++) {
      pts.push({ x: baseSample.u[i], y: baseSample.u[i + 1] });
    }
    return pts;
  }, [baseSample, openId]);

  // ===========================
  // (2) Pruebas de uniformidad
  // ===========================
  const [alpha, setAlpha] = useState(0.05);
  const [chiBins, setChiBins] = useState(10);

  const uniformity = useMemo(() => {
    if (openId !== 's2') return null;
    if (baseU.length < 30) return null;
    const n = baseU.length;

    // Promedios (Z)
    const xbar = Statistics.mean(baseU);
    const z = (xbar - 0.5) / Math.sqrt(1 / (12 * n));
    const zcrit = zCritTwoSided(alpha);
    const passMean = Math.abs(z) <= zcrit;

    // Chi-cuadrado (k bins)
    const k = Math.max(2, Math.floor(chiBins));
    const counts = new Array(k).fill(0);
    for (const u of baseU) {
      const idx = Math.min(k - 1, Math.floor(u * k));
      counts[idx]++;
    }
    const fe = n / k;
    const chi2 = counts.reduce((acc, fo) => acc + ((fo - fe) * (fo - fe)) / fe, 0);
    const dfChi = k - 1;
    const chiCrit = chiSquareCritRightTail(dfChi, alpha);
    const passChi = chi2 <= chiCrit;

    // KS
    const sorted = [...baseU].sort((p, q) => p - q);
    let d = 0;
    for (let i = 0; i < n; i++) {
      const fn = (i + 1) / n;
      const diff = Math.max(Math.abs(fn - sorted[i]), Math.abs(sorted[i] - i / n));
      if (diff > d) d = diff;
    }
    const dCrit = ksCrit(alpha, n);
    const passKS = d <= dCrit;

    return {
      n,
      meanTest: { xbar, z, zcrit, pass: passMean },
      chiTest: { k, counts, chi2, df: dfChi, chiCrit, pass: passChi },
      ksTest: { d, dCrit, pass: passKS },
    };
  }, [openId, baseU, alpha, chiBins]);

  // ===========================
  // (3) Independencia: Series + Rachas (moneda)
  // ===========================
  const [seriesK, setSeriesK] = useState(6);

  const independence = useMemo(() => {
    if (openId !== 's3') return null;
    if (baseU.length < 200) return null;
    const n = baseU.length;

    // Series en pares
    const k = Math.max(2, Math.floor(seriesK));
    const mat = Array.from({ length: k }, () => new Array(k).fill(0));
    const pairs = n - 1;
    for (let i = 0; i < pairs; i++) {
      const r = Math.min(k - 1, Math.floor(baseU[i] * k));
      const c2 = Math.min(k - 1, Math.floor(baseU[i + 1] * k));
      mat[r][c2]++;
    }
    const fe = pairs / (k * k);
    let chi2 = 0;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const fo = mat[i][j];
        chi2 += ((fo - fe) * (fo - fe)) / fe;
      }
    }
    const df = k * k - 1;
    const chiCrit = chiSquareCritRightTail(df, alpha);
    const passSeries = chi2 <= chiCrit;

    // Rachas en moneda (umbral 0.5)
    const bits = baseU.map((u) => (u < 0.5 ? 1 : 0));
    let runs = 1;
    for (let i = 1; i < bits.length; i++) {
      if (bits[i] !== bits[i - 1]) runs++;
    }
    const n1 = bits.reduce<number>((acc, b) => acc + b, 0);
    const n0 = n - n1;

    let zRuns = NaN;
    let passRuns = false;
    if (n0 > 0 && n1 > 0 && n > 1) {
      const er = (2 * n1 * n0) / n + 1;
      const vr = (2 * n1 * n0 * (2 * n1 * n0 - n)) / (n * n * (n - 1));
      zRuns = (runs - er) / Math.sqrt(vr);
      const zcrit = zCritTwoSided(alpha);
      passRuns = Math.abs(zRuns) <= zcrit;
    }

    const scatterPairs = baseU
      .slice(0, 1200)
      .map((u, i) => (i < 1199 ? { x: u, y: baseU[i + 1] } : null))
      .filter(Boolean) as { x: number; y: number }[];

    return {
      scatterPairs,
      series: { k, mat, chi2, df, chiCrit, pass: passSeries },
      runs: { runs, n1, n0, z: zRuns, pass: passRuns },
    };
  }, [openId, baseU, seriesK, alpha]);

  // ===========================
  // (4) Inversa: Exponencial
  // ===========================
  const [lambda, setLambda] = useState(1);

  const inverseExp = useMemo(() => {
    if (openId !== 's4') return null;
    if (baseU.length < 50) return null;

    const lam = Math.max(1e-9, lambda);
    const data = baseU.map((u) => -Math.log(1 - u) / lam);
    const hist = Statistics.histogram(data, 30);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const xi = min + ((max - min) * i) / 120;
      x.push(xi);
      y.push(xi >= 0 ? lam * Math.exp(-lam * xi) : 0);
    }

    return {
      data,
      hist,
      curve: { x, y },
      empirical: { mean: Statistics.mean(data), variance: Statistics.variance(data) },
      theoretical: { mean: 1 / lam, variance: 1 / (lam * lam) },
    };
  }, [openId, baseU, lambda]);

  // ===========================
  // (5) Rechazo: f(x)=2x en [0,1]
  // ===========================
  const [rejN, setRejN] = useState(2000);
  const [rejM, setRejM] = useState(2); // envolvente (altura)

  const rejection = useMemo(() => {
    if (openId !== 's5') return null;

    const N = Math.max(100, Math.floor(rejN));
    const neededU = 2 * N;
    const u = getU(neededU);
    const M = Math.max(0.1, rejM);

    const accepted: number[] = [];
    const accPts: { x: number; y: number }[] = [];
    const rejPts: { x: number; y: number }[] = [];

    for (let i = 0; i < N; i++) {
      const x = u[2 * i];
      const y = u[2 * i + 1] * M;
      const fx = 2 * x;
      const ok = y <= fx;

      if (ok) {
        accepted.push(x);
        if (accPts.length < 1200) accPts.push({ x, y });
      } else {
        if (rejPts.length < 1200) rejPts.push({ x, y });
      }
    }

    const rate = accepted.length / N;
    const hist = accepted.length >= 30 ? Statistics.histogram(accepted, 20) : null;

    const curveX = Array.from({ length: 101 }, (_, i) => i / 100);
    const curveY = curveX.map((x) => 2 * x);

    return { N, M, accepted, rate, accPts, rejPts, hist, curve: { x: curveX, y: curveY } };
  }, [openId, rejN, rejM, prngType, seed, a, c, m, baseSample]); // deps amplios (pero solo se calcula si s5 abierta)

  // ===========================
  // (6) Composición: mezcla de 2 exponenciales
  // ===========================
  const [mixP, setMixP] = useState(0.6);
  const [lambda1, setLambda1] = useState(1);
  const [lambda2, setLambda2] = useState(4);

  const mixture = useMemo(() => {
    if (openId !== 's6') return null;
    if (baseU.length < 50) return null;

    const p = Math.max(0, Math.min(1, mixP));
    const data: number[] = [];

    const need = 2 * baseU.length;
    const u2 = getU(need);

    for (let i = 0; i < baseU.length; i++) {
      const choose = u2[2 * i];
      const u = u2[2 * i + 1];
      const lam = choose < p ? Math.max(1e-9, lambda1) : Math.max(1e-9, lambda2);
      data.push(-Math.log(1 - u) / lam);
    }

    const hist = Statistics.histogram(data, 30);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const xi = min + ((max - min) * i) / 120;
      x.push(xi);
      const f =
        xi >= 0
          ? p * (lambda1 * Math.exp(-lambda1 * xi)) + (1 - p) * (lambda2 * Math.exp(-lambda2 * xi))
          : 0;
      y.push(f);
    }

    return {
      data,
      hist,
      curve: { x, y },
      empirical: { mean: Statistics.mean(data), variance: Statistics.variance(data) },
    };
  }, [openId, baseU, mixP, lambda1, lambda2, prngType, seed, a, c, m, baseSample]);

  // ===========================
  // Monte Carlo: π, integral, prob evento
  // ===========================
  const [mcN, setMcN] = useState(5000);
  const [mcMode, setMcMode] = useState<'pi' | 'integral' | 'coin_event'>('pi');
  const [mcFunc, setMcFunc] = useState<'x2' | 'sin' | 'exp'>('x2');
  const [coinP, setCoinP] = useState(0.5);
  const [coinM, setCoinM] = useState(10);
  const [coinK, setCoinK] = useState(6);

  const monteCarlo = useMemo(() => {
    if (openId !== 'mc') return null;

    const N = Math.max(200, Math.floor(mcN));

    if (mcMode === 'pi') {
      const need = 2 * N;
      const u = getU(need);

      let inside = 0;
      const ptsInside: { x: number; y: number }[] = [];
      const ptsOut: { x: number; y: number }[] = [];

      const step = 200;
      const labels: string[] = [];
      const values: number[] = [];

      for (let i = 0; i < N; i++) {
        const x = u[2 * i];
        const y = u[2 * i + 1];
        const ok = x * x + y * y <= 1;
        if (ok) inside++;
        if (i < 1200) (ok ? ptsInside : ptsOut).push({ x, y });

        if ((i + 1) % step === 0) {
          labels.push(String(i + 1));
          values.push(4 * (inside / (i + 1)));
        }
      }

      const piHat = 4 * (inside / N);
      return { mode: 'pi' as const, piHat, ptsInside, ptsOut, labels, values };
    }

    if (mcMode === 'integral') {
      const u = getU(N);

      const f = (x: number) => {
        if (mcFunc === 'x2') return x * x;
        if (mcFunc === 'sin') return Math.sin(x);
        return Math.exp(-x);
      };

      const step = 200;
      let sum = 0;
      const labels: string[] = [];
      const values: number[] = [];

      for (let i = 0; i < N; i++) {
        sum += f(u[i]);
        if ((i + 1) % step === 0) {
          labels.push(String(i + 1));
          values.push(sum / (i + 1));
        }
      }

      const exact =
        mcFunc === 'x2' ? 1 / 3 :
        mcFunc === 'sin' ? 1 - Math.cos(1) :
        1 - Math.exp(-1);

      return { mode: 'integral' as const, estimate: sum / N, exact, labels, values };
    }

    // coin_event: P(al menos K caras en M lanzamientos) con moneda sesgada
    const M = Math.max(1, Math.floor(coinM));
    const K = Math.max(0, Math.min(M, Math.floor(coinK)));
    const p = Math.max(0, Math.min(1, coinP));

    const need = N * M;
    const u = getU(need);

    let success = 0;
    const step = 200;
    const labels: string[] = [];
    const values: number[] = [];

    for (let i = 0; i < N; i++) {
      let heads = 0;
      for (let t = 0; t < M; t++) {
        const r = u[i * M + t];
        if (r < p) heads++;
      }
      if (heads >= K) success++;

      if ((i + 1) % step === 0) {
        labels.push(String(i + 1));
        values.push(success / (i + 1));
      }
    }

    return { mode: 'coin_event' as const, prob: success / N, labels, values, params: { M, K, p } };
  }, [openId, mcN, mcMode, mcFunc, coinP, coinM, coinK, prngType, seed, a, c, m, baseSample]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Módulo A: Conceptos Fundamentales</h2>
        </div>
        <p className="text-blue-100">
          Aprende el flujo completo de simulación:
          <b> generar U(0,1) → validar → transformar → usar Monte Carlo</b>.
        </p>
      </div>

      {/* Conceptos (los que ya tenías) */}
      <div className="grid md:grid-cols-3 gap-6">
        {concepts.map((concept) => (
          <div key={concept.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div
              className="p-6 cursor-pointer"
              onClick={() => setSelectedConcept(selectedConcept === concept.id ? null : concept.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-blue-600">{concept.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{concept.title}</h3>
                <Tooltip content="Haz clic para ver más detalles" title="Ayuda">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </div>
              <p className="text-gray-600 text-sm">{concept.description}</p>
            </div>

            {selectedConcept === concept.id && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="mt-4 space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Explicación Detallada</h4>
                    <p className="text-blue-800 text-sm whitespace-pre-line">{concept.details}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Idea/Fórmula</h4>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{concept.formula}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fuente aleatoria (control global) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Dices className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Fuente de aleatoriedad (para TODO el Módulo A)</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Generador</label>
            <select
              value={prngType}
              onChange={(e) => setPrngType(e.target.value as PRNGType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="math">Math.random()</option>
              <option value="lcg_mixed">LCG mixto (ax + c) mod m</option>
              <option value="lcg_mult">LCG multiplicativo (ax) mod m</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño muestra base (n)</label>
            <input
              type="number"
              min={200}
              max={20000}
              step={100}
              value={nBase}
              onChange={(e) => setNBase(parseInt(e.target.value) || 2000)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Recomendación: 2000–5000 para que vaya fluido.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semilla (LCG)</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 12345)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {(prngType === 'lcg_mixed' || prngType === 'lcg_mult') && (
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">a</label>
              <input
                type="number"
                value={a}
                onChange={(e) => setA(parseInt(e.target.value) || a)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            {prngType === 'lcg_mixed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">c</label>
                <input
                  type="number"
                  value={c}
                  onChange={(e) => setC(parseInt(e.target.value) || c)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">m</label>
              <input
                type="number"
                value={m}
                onChange={(e) => setM(parseInt(e.target.value) || m)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}


        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <InfoCard title="¿Para qué sirven estos valores? (guía rápida)">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Generador:</b> define <i>cómo</i> obtienes los números U(0,1). <b>Math.random()</b> es cómodo; los
                <b> LCG</b> son ideales para entender el proceso y repetir experimentos.
              </li>
              <li>
                <b>n (tamaño de muestra base):</b> cuántos U(0,1) se generan para alimentar histogramas, pruebas y
                transformaciones. Con n pequeño verás más “ruido”; con n grande las pruebas son más exigentes
                (pero la página puede ir más lenta).
              </li>
              <li>
                <b>Semilla (x₀):</b> el punto de arranque del LCG. Cambiarla cambia toda la secuencia. Mantener la misma
                semilla permite <b>reproducir</b> resultados (muy útil al depurar o comparar escenarios).
              </li>
              <li>
                <b>a, c, m:</b> parámetros del LCG. <b>m</b> (módulo) controla el “tamaño” del ciclo posible; <b>a</b> (multiplicador)
                y <b>c</b> (incremento, solo en el mixto) afectan la calidad y el <b>periodo</b> (cuándo se repite la secuencia).
              </li>
            </ul>
          </InfoCard>

          <TipCard title="¿Cómo leer los números que aparecen a la derecha?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>mean</b> debería acercarse a <b>0.5</b> si la muestra se parece a U(0,1).
              </li>
              <li>
                <b>var</b> debería acercarse a <b>1/12 ≈ 0.0833</b> para U(0,1).
              </li>
              <li>
                <b>periodo detectado</b>: si el módulo ve que el estado interno se repite, te muestra un estimado del
                ciclo. Un periodo muy corto es una señal de alarma (puede introducir patrones en las gráficas).
              </li>
              <li>
                Si algo “falla” en pruebas (uniformidad/independencia), prueba: subir <b>m</b>, cambiar <b>a</b>/<b>c</b> o usar otra semilla.
              </li>
            </ul>
          </TipCard>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setBaseSample(sampleU(prngType, nBase, seed, a, c, m))}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Generar muestra base
          </button>
          <div className="text-sm text-gray-600">
            {baseSample ? (
              <>
                n={baseSample.u.length} • mean={prngStats?.mean.toFixed(4)} • var={prngStats?.variance.toFixed(4)} •
                {baseSample.periodDetected ? ` periodo detectado≈${baseSample.periodDetected}` : ' periodo: (no detectado)'}
              </>
            ) : (
              <>Genera una muestra base para que las secciones 1–6 y Monte Carlo la usen.</>
            )}
          </div>
        </div>
      </div>

      {/* Secciones 1..6 + Monte Carlo */}
      <div className="space-y-4">
        {/* (1) PRNG + moneda */}
        <Section
          title="1) Números rectangulares U(0,1) + ejemplo de moneda"
          icon={<Shuffle className="w-5 h-5" />}
          subtitle="Histograma, dispersión (uᵢ,uᵢ₊₁) y “cara si u<0.5”"
          open={openId === 's1'}
          onToggle={() => setOpenId(openId === 's1' ? '' : 's1')}
        >
          <div className="space-y-3 mb-5">
            <InfoCard title="Primero lo primero: ¿qué es un número aleatorio aquí?">
              <p>
                En simulación usamos números entre 0 y 1 (como un “termómetro” de azar).
                A estos números los llamamos <b>U(0,1)</b>. Con ellos podemos imitar decisiones al azar,
                como una moneda, un dado o “¿llega un cliente ahora?”.
              </p>
            </InfoCard>

            <MiniTheory>
              <p>
                <b>Idea sencilla:</b> si el generador funciona bien, deberías ver números repartidos “por todo” el rango 0…1.
                No deberían salir solo cerca de 0 o solo cerca de 1.
              </p>
              <p className="mt-2">
                <b>Ejemplo moneda:</b> tomamos un número U.
                Si <b>U &lt; 0.5</b> decimos “Cara”. Si no, “Cruz”.
              </p>
            </MiniTheory>

            <TipCard title="Prueba rápida (sin fórmulas)">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Genera la muestra.</li>
                <li>En el histograma: debería verse “parejo”.</li>
                <li>En la moneda: caras cerca de 50% (aprox.).</li>
              </ol>
            </TipCard>
          </div>


          {!baseSample ? (
            <div className="text-sm text-gray-700">Primero: “Generar muestra base”.</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {prngHistogram && (
                <DistributionChart
                  histogramData={prngHistogram.hist}
                  theoreticalData={prngHistogram.curve}
                  title="U(0,1): histograma vs densidad teórica"
                />
              )}

              <div className="space-y-4">
                <ScatterPlot
                  title="Dispersión (uᵢ, uᵢ₊₁): patrones → mala independencia"
                  xLabel="uᵢ"
                  yLabel="uᵢ₊₁"
                  datasets={[{ label: 'pares', data: prngScatter }]}
                />

                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="font-semibold text-gray-900 mb-2">Moneda (Cara si u &lt; 0.5)</div>
                  <div className="text-sm text-gray-700">
                    Caras: <strong>{prngStats?.heads}</strong> / {baseSample.u.length} (
                    {(((prngStats?.heads ?? 0) / baseSample.u.length) * 100).toFixed(2)}%)
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Ojo: 50/50 no garantiza independencia (eso lo ves en (3)).
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* (2) Uniformidad */}
        <Section
          title="2) Pruebas de uniformidad (Promedios, Chi², K-S)"
          icon={<Sigma className="w-5 h-5" />}
          subtitle="“Pasa / no pasa” con α configurable + interpretación"
          open={openId === 's2'}
          onToggle={() => setOpenId(openId === 's2' ? '' : 's2')}
        >
          <div className="space-y-3 mb-5">
            <InfoCard title="¿Qué estamos comprobando aquí?">
              <p>
                Queremos saber si los números entre 0 y 1 salen “bien repartidos”.
                Si un generador está mal, puede concentrarse en ciertas zonas y eso arruina una simulación.
              </p>
            </InfoCard>

            <div className="grid md:grid-cols-3 gap-4">
              <InfoCard title="¿Qué es el promedio (promedio muestral)?">
                <p>
                  El <b>promedio</b> es una forma rápida de “resumir” una lista de números en un solo valor:
                  si tienes <b>n</b> números <b>u₁, u₂, …, uₙ</b>, el promedio es
                  <span className="ml-1 font-mono">x̄ = (u₁+u₂+…+uₙ)/n</span>.
                </p>
                <p className="mt-2">
                  Para una <b>U(0,1)</b>, el valor esperado es <b>0.5</b>.
                  Así que si tu promedio se aleja demasiado de 0.5, es una señal de que algo anda raro
                  (o de que <b>n</b> es muy pequeño).
                </p>
              </InfoCard>

              <InfoCard title="¿Qué es Chi² (chi-cuadrada) aquí?">
                <p>
                  La prueba <b>Chi² de bondad de ajuste</b> compara lo que <i>observaste</i> contra lo que
                  <i>deberías observar</i> si fuera uniforme.
                </p>
                <p className="mt-2">
                  Dividimos el intervalo <b>[0,1)</b> en <b>k</b> cajitas (bins). Si todo es uniforme,
                  en cada cajita esperarías aproximadamente <span className="font-mono">E = n/k</span> números.
                  Luego se calcula un estadístico que “castiga” diferencias grandes entre conteos.
                </p>
                <p className="mt-2">
                  Intuición: si ves algunas cajitas casi vacías y otras súper llenas, Chi² tiende a salir grande
                  y el test puede <b>rechazar</b> la uniformidad.
                </p>
              </InfoCard>

              <InfoCard title="¿Qué es K–S (Kolmogorov–Smirnov)?">
                <p>
                  K–S no usa cajitas: ordena la muestra y construye una curva acumulada empírica <b>Fₙ(x)</b>
                  (“qué fracción va por debajo de x”).
                </p>
                <p className="mt-2">
                  Para la <b>U(0,1)</b> la acumulada ideal es la recta <span className="font-mono">F(x)=x</span>.
                  K–S mide la <b>mayor distancia</b> entre tu curva empírica y esa recta.
                </p>
                <p className="mt-2">
                  Intuición: si tu secuencia se “amontona” en algún rango, la curva se separa de la recta
                  y el estadístico K–S crece.
                </p>
              </InfoCard>
            </div>


            <MiniTheory>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Promedio:</b> si todo está parejo, el promedio debería estar cerca de <b>0.5</b>.</li>
                <li><b>Conteo por cajitas:</b> partimos [0,1) en cajitas (bins) y contamos cuántos caen en cada una.</li>
                <li><b>Chequeo “curva acumulada” (K-S):</b> otra forma de ver si se parece a lo esperado.</li>
              </ul>
              <p className="mt-2">
                El parámetro <b>α</b> es “qué tan estricto” es el test.
                Si lo haces muy estricto, fallará más fácil.
              </p>
            </MiniTheory>

            <TipCard title="Prueba guiada">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Deja α=0.05.</li>
                <li>Regenera 3 veces: a veces un test puede fallar por azar.</li>
                <li>Sube n (muestra base): las conclusiones se vuelven más estables.</li>
              </ol>
            </TipCard>
          </div>


          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">α</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                max="0.2"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value) || 0.05)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bins Chi² (k)</label>
              <input
                type="number"
                min="4"
                max="50"
                value={chiBins}
                onChange={(e) => setChiBins(parseInt(e.target.value) || 10)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setBaseSample(sampleU(prngType, nBase, seed, a, c, m))}
                className="w-full bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium"
              >
                Regenerar muestra base
              </button>
            </div>
          </div>

          {!uniformity ? (
            <div className="text-sm text-gray-700">Genera una muestra base (n≥30 recomendado) y abre esta sección.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="font-semibold">Promedios (Z)</div>
                  <div className="text-sm mt-2">
                    x̄={uniformity.meanTest.xbar.toFixed(5)}<br />
                    Z={uniformity.meanTest.z.toFixed(3)} • Zcrit={uniformity.meanTest.zcrit.toFixed(3)}<br />
                    <span className={uniformity.meanTest.pass ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {uniformity.meanTest.pass ? 'PASA' : 'NO PASA'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="font-semibold">Chi-cuadrado</div>
                  <div className="text-sm mt-2">
                    k={uniformity.chiTest.k} • df={uniformity.chiTest.df}<br />
                    χ²={uniformity.chiTest.chi2.toFixed(2)} • χ²crit={uniformity.chiTest.chiCrit.toFixed(2)}<br />
                    <span className={uniformity.chiTest.pass ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {uniformity.chiTest.pass ? 'PASA' : 'NO PASA'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="font-semibold">Kolmogorov–Smirnov</div>
                  <div className="text-sm mt-2">
                    D={uniformity.ksTest.d.toFixed(4)} • Dcrit={uniformity.ksTest.dCrit.toFixed(4)}<br />
                    <span className={uniformity.ksTest.pass ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {uniformity.ksTest.pass ? 'PASA' : 'NO PASA'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="font-semibold mb-2">Frecuencias por bin (Chi²)</div>
                <div className="text-xs text-gray-600 mb-2">
                  Esperado por bin: {(uniformity.n / uniformity.chiTest.k).toFixed(1)}
                </div>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {uniformity.chiTest.counts.map((fo, i) => (
                    <div key={i} className="bg-gray-50 border rounded p-2 text-xs">
                      <div className="font-semibold">Bin {i + 1}</div>
                      <div>FO: {fo}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-2">Auto-check</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>¿Qué significa α=0.05?</li>
                  <li>¿Por qué “PASA” no prueba que el generador sea perfecto?</li>
                </ul>
              </div>
            </div>
          )}
        </Section>

        {/* (3) Independencia */}
        <Section
          title="3) Pruebas de independencia (Series + Rachas con moneda)"
          icon={<GitBranch className="w-5 h-5" />}
          subtitle="Uniforme ≠ independiente: detecta patrones"
          open={openId === 's3'}
          onToggle={() => setOpenId(openId === 's3' ? '' : 's3')}
        >
          <div className="space-y-3 mb-5">
            <InfoCard title="Ojo: “parejo” no significa “sin patrón”">
              <p>
                Un generador puede dar 50% caras y aún así estar mal.
                ¿Por qué? Porque puede tener <b>patrones</b>.
                Por ejemplo: alternar Cara-Cruz-Cara-Cruz… (eso no es azar real).
              </p>
            </InfoCard>

            <MiniTheory>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Scatter (uᵢ,uᵢ₊₁):</b> si todo es sano, debería verse como “nube” sin forma.</li>
                <li><b>Heatmap:</b> es el scatter pero contado en cuadritos.</li>
                <li><b>Rachas (moneda):</b> mira si hay demasiada alternancia o demasiados bloques largos.</li>
              </ul>
            </MiniTheory>

            <TipCard title="Prueba guiada">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Mira el scatter: si ves líneas o rejilla, hay patrón.</li>
                <li>Sube k y mira el heatmap: debería ser relativamente parejo.</li>
                <li>En rachas: si sale “muy raro”, sospecha dependencia.</li>
              </ol>
            </TipCard>
          </div>


          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">k (grilla series)</label>
              <input
                type="number"
                min="3"
                max="15"
                value={seriesK}
                onChange={(e) => setSeriesK(parseInt(e.target.value) || 6)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2 text-sm text-gray-600 flex items-end">
              Consejo: si el scatter muestra líneas/rejillas, casi siempre hay dependencia.
            </div>
          </div>

          {!independence ? (
            <div className="text-sm text-gray-700">Genera una muestra base (n≥200 recomendado) y abre esta sección.</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ScatterPlot
                  title="Scatter (uᵢ,uᵢ₊₁): si ves líneas/patrones → mala independencia"
                  xLabel="uᵢ"
                  yLabel="uᵢ₊₁"
                  datasets={[{ label: 'pares', data: independence.scatterPairs }]}
                />

                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="font-semibold">Rachas (Moneda: Cara si u&lt;0.5)</div>
                  <div className="text-sm mt-2">
                    n1 (caras)={independence.runs.n1} • n0 (cruces)={independence.runs.n0}<br />
                    rachas={independence.runs.runs} • Z={Number.isFinite(independence.runs.z) ? independence.runs.z.toFixed(3) : '—'}<br />
                    <span className={independence.runs.pass ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {Number.isFinite(independence.runs.z)
                        ? (independence.runs.pass ? 'PASA' : 'NO PASA')
                        : 'No aplica (todo salió igual)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <HeatmapGrid
                  title={`Series (k×k): χ²=${independence.series.chi2.toFixed(2)} • χ²crit=${independence.series.chiCrit.toFixed(2)} → ${independence.series.pass ? 'PASA' : 'NO PASA'}`}
                  matrix={independence.series.mat}
                  xLabel="uᵢ₊₁"
                  yLabel="uᵢ"
                />
                <div className="text-xs text-gray-600">
                  df = k² - 1 = {independence.series.df}. (α = {alpha})
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* (4) Inversa */}
        <Section
          title="4) Transformada inversa (Ejemplo: Exponencial)"
          icon={<BarChart3 className="w-5 h-5" />}
          subtitle="Convierte U(0,1) en tiempos entre eventos"
          open={openId === 's4'}
          onToggle={() => setOpenId(openId === 's4' ? '' : 's4')}
        >
          <div className="space-y-3 mb-5">
            <InfoCard title="Ahora sí: números para cosas reales (tiempos, duraciones)">
              <p>
                U(0,1) es útil, pero en simulación normalmente necesitas números con forma “real”:
                por ejemplo, <b>tiempos entre llegadas</b> o <b>tiempos entre fallas</b>.
              </p>
            </InfoCard>

            <MiniTheory>
              <p>
                Ejemplo típico: <b>Exponencial(λ)</b>. Produce muchos tiempos pequeños y pocos tiempos grandes.
                (Eso pasa en muchos sistemas).
              </p>
              <p className="mt-2">
                Aquí solo mira esto: si el histograma se parece a la curva, vas bien.
                Y si subes λ, los tiempos deberían hacerse más cortos.
              </p>
            </MiniTheory>

            
            <InfoCard title="Procedimiento a mano (Transformada inversa)">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Parte de la <b>fdp</b> (densidad) que quieres simular: <code>f(x)</code>.</li>
                <li>Integra para obtener la acumulada: <code>F(x)=∫ f(x) dx</code> (respetando intervalos si es por tramos).</li>
                <li>Iguala a un uniforme: <code>F(x)=R</code>, con <code>0&lt;R&lt;1</code>.</li>
                <li>Despeja <code>x</code>: <code>x = F⁻¹(R)</code>.</li>
                <li>Si <code>F(x)</code> es por tramos, primero calcula el <b>rango de R</b> de cada tramo y luego eliges la fórmula correcta.</li>
              </ol>
              <div className="mt-3 text-sm">
                Para la exponencial: <code>F(x)=1−e^(−λx)</code> ⇒ <code>x=−ln(1−R)/λ</code>.
              </div>
            </InfoCard>

            <TipCard title="Ejemplo rápido (a mano)">
              <div className="space-y-1">
                <div>
                  Si λ=2 y R=0.30: <code>x = −ln(0.70)/2 ≈ 0.178</code>.
                </div>
                <div className="text-xs text-amber-800/80">
                  Nota: en una distribución por tramos (ej. triangular), primero verificas si R cae en el tramo 1 o 2 y luego aplicas la inversa del tramo.
                </div>
              </div>
            </TipCard>
<TipCard title="Prueba guiada">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Prueba λ=1, luego λ=4.</li>
                <li>Con λ=4 la distribución debería “apretarse” más cerca de 0.</li>
                <li>Compara la media empírica con la teórica (1/λ).</li>
              </ol>
            </TipCard>
          </div>


          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">λ</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={lambda}
                onChange={(e) => setLambda(parseFloat(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2 text-sm text-gray-600 flex items-end">
              Con esto ya puedes simular “tiempos entre llegadas/fallas”.
            </div>
          </div>

          {!inverseExp ? (
            <div className="text-sm text-gray-700">Genera una muestra base y abre esta sección.</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <DistributionChart
                histogramData={inverseExp.hist}
                theoreticalData={inverseExp.curve}
                title="Exponencial: histograma vs densidad teórica"
              />
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="font-semibold mb-2">Comparación de estadísticas</div>
                <div className="text-sm">
                  Empírica: media={inverseExp.empirical.mean.toFixed(3)} • var={inverseExp.empirical.variance.toFixed(3)}<br />
                  Teórica: media={inverseExp.theoretical.mean.toFixed(3)} • var={inverseExp.theoretical.variance.toFixed(3)}
                </div>
                <div className="text-xs text-gray-600 mt-3">
                  Si tu U(0,1) es mala, la exponencial también lo será (por eso están (2) y (3)).
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* (5) Rechazo */}
        <Section
          title="5) Aceptación–Rechazo (Ejemplo visual: f(x)=2x en [0,1])"
          icon={<Target className="w-5 h-5" />}
          subtitle="Dardos: acepto si y ≤ f(x). Eficiencia depende de M"
          open={openId === 's5'}
          onToggle={() => setOpenId(openId === 's5' ? '' : 's5')}
        >
          <div className="space-y-3 mb-5">
            <InfoCard title="Método rechazo: la idea de ‘dardos’">
              <p>
                Imagina un dibujo con una curva. Tiras puntos al azar.
                Si el punto cae debajo de la curva, lo aceptas. Si no, lo rechazas.
                Con eso puedes generar distribuciones cuando no hay un método directo.
              </p>
            </InfoCard>

            
            <InfoCard title="Procedimiento a mano (Aceptación–Rechazo)">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Genera dos uniformes: <code>R1</code> y <code>R2</code>.</li>
                <li>Propón un candidato uniforme <code>x = a + (b−a)·R1</code>.</li>
                <li>Construye <code>y = M·R2</code> (con <code>M ≥ fmax</code> en [a,b]).</li>
                <li>Evalúa <code>f(x)</code> y <b>acepta</b> si <code>y ≤ f(x)</code>. Si no, <b>rechaza</b> y repite.</li>
              </ol>
              <div className="mt-3 text-sm">
                En este ejemplo <code>f(x)=2x</code> en <code>[0,1]</code> y <code>fmax=2</code>, así que lo correcto es usar <code>M=2</code>.
                Con eso, la regla se simplifica a: <code>R2 ≤ R1</code>.
              </div>
            </InfoCard>

            <TipCard title="Ejemplo (a mano)">
              <ul className="list-disc pl-5 space-y-1">
                <li>R1=0.24, R2=0.87 ⇒ 0.87 ≤ 0.24 (NO) ⇒ se rechaza.</li>
                <li>R1=0.65, R2=0.04 ⇒ 0.04 ≤ 0.65 (SÍ) ⇒ se acepta x=0.65.</li>
              </ul>
            </TipCard>
<MiniTheory>
              <p>
                <b>M</b> es el “techo” donde tiras los dardos.
                Si M es muy grande, rechazas mucho y se vuelve lento.
                Si M es demasiado pequeño, el método deja de ser correcto.
              </p>
            </MiniTheory>

            <TipCard title="Prueba guiada">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Deja M=2 y mira la tasa de aceptación.</li>
                <li>Sube M: debería bajar la aceptación.</li>
                <li>Si pones M menor a 2, el resultado ya no representa bien la curva.</li>
              </ol>
            </TipCard>
          </div>


          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">N candidatos</label>
              <input
                type="number"
                min="200"
                max="20000"
                step="100"
                value={rejN}
                onChange={(e) => setRejN(parseInt(e.target.value) || 2000)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">M (altura de envolvente)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={rejM}
                onChange={(e) => setRejM(parseFloat(e.target.value) || 2)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <div className="text-xs text-gray-500 mt-1">Ideal: M=2 (máximo de f).</div>
            </div>
            <div className="flex items-end text-sm text-gray-700">
              Aceptación ≈ {rejection ? (rejection.rate * 100).toFixed(1) : '—'}%
            </div>
          </div>

          {!rejection ? (
            <div className="text-sm text-gray-700">Abre esta sección para calcular (se optimiza cuando está cerrada).</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <ScatterPlot
                title="Plano (x,y): aceptados vs rechazados"
                xLabel="x"
                yLabel="y"
                datasets={[
                  { label: 'Aceptados', data: rejection.accPts, color: 'rgba(34,197,94,0.65)', pointRadius: 2 },
                  { label: 'Rechazados', data: rejection.rejPts, color: 'rgba(220,38,38,0.50)', pointRadius: 2 },
                ]}
              />

              <div className="space-y-4">
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="font-semibold">Resumen</div>
                  <div className="text-sm mt-2">
                    N={rejection.N} • aceptados={rejection.accepted.length} • tasa={(rejection.rate * 100).toFixed(2)}%<br />
                    Nota: si M &lt; 2, el método deja de ser válido (sesga).
                  </div>
                </div>

                {rejection.hist && (
                  <DistributionChart
                    histogramData={rejection.hist}
                    theoreticalData={rejection.curve}
                    title="Distribución resultante: histograma vs f(x)=2x"
                  />
                )}
              </div>
            </div>
          )}
        </Section>

        {/* (6) Composición */}
        <Section
          title="6) Composición (Mezcla de distribuciones) + moneda de decisión"
          icon={<Shuffle className="w-5 h-5" />}
          subtitle="Eliges componente con U<p y luego generas dentro de ese componente"
          open={openId === 's6'}
          onToggle={() => setOpenId(openId === 's6' ? '' : 's6')}
        >
          <div className="space-y-3 mb-5">
            <InfoCard title="Composición: mezclar comportamientos (como elegir con una moneda)">
              <p>
                A veces un sistema tiene dos “modos”. Por ejemplo:
                días normales vs días con mucha demanda.
                Una mezcla te permite modelar eso.
              </p>
            </InfoCard>

            <MiniTheory>
              <p>
                Primero haces una decisión:
                si U &lt; p eliges el “modo A”, si no eliges el “modo B”.
                Después generas el número con el método del modo elegido.
              </p>
            </MiniTheory>

            
            <InfoCard title="Procedimiento a mano (Composición / Mezcla)">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Divide la densidad en componentes <code>f1(x), f2(x), …</code> con pesos <code>A1, A2, …</code> (probabilidades) y verifica que <code>∑Ai = 1</code>.</li>
                <li>Genera <code>R1</code> para <b>elegir el componente</b> (como una moneda): si <code>R1 &lt; A1</code> eliges 1; si no, revisas el siguiente tramo, etc.</li>
                <li>Genera <code>R2</code> para <b>simular dentro del componente</b> usando el método que corresponda (transformada inversa o rechazo).</li>
              </ol>
              <div className="mt-3 text-sm">
                Aquí usamos 2 exponenciales: con probabilidad <code>p</code> eliges Exp(λ1) y con <code>1−p</code> eliges Exp(λ2).
                Luego, dentro del componente, generas <code>x = −ln(1−R2)/λ</code>.
              </div>
            </InfoCard>

            <TipCard title="Pseudocódigo (a mano)">
              <pre className="text-xs whitespace-pre-wrap bg-amber-100/40 p-3 rounded">
{`R1 = U(0,1)
R2 = U(0,1)
si (R1 < p)   λ = λ1
si no         λ = λ2
X = -ln(1-R2)/λ`}
              </pre>
            </TipCard>
<TipCard title="Prueba guiada">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Fija λ1=1 y λ2=6.</li>
                <li>Con p cerca de 1 domina λ1; con p cerca de 0 domina λ2.</li>
                <li>Mueve p y observa cómo cambia la forma del histograma.</li>
              </ol>
            </TipCard>
          </div>


          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">p (elige Exp(λ1) con prob.)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={mixP}
                onChange={(e) => setMixP(parseFloat(e.target.value) || 0.6)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">λ1</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={lambda1}
                onChange={(e) => setLambda1(parseFloat(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">λ2</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={lambda2}
                onChange={(e) => setLambda2(parseFloat(e.target.value) || 4)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {!mixture ? (
            <div className="text-sm text-gray-700">Genera una muestra base y abre esta sección.</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <DistributionChart
                histogramData={mixture.hist}
                theoreticalData={mixture.curve}
                title="Mezcla: histograma vs densidad teórica de la mezcla"
              />
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="font-semibold">Idea tipo “moneda”</div>
                <div className="text-sm mt-2">
                  Si U &lt; p ⇒ usa Exp(λ1). Si no ⇒ Exp(λ2).<br />
                  Empírica: media={mixture.empirical.mean.toFixed(3)} • var={mixture.empirical.variance.toFixed(3)}
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Monte Carlo */}
        <Section
          title="Monte Carlo (Estimación por muestreo)"
          icon={<Target className="w-5 h-5" />}
          subtitle="π con dardos, integrales y probabilidades con moneda"
          open={openId === 'mc'}
          onToggle={() => setOpenId(openId === 'mc' ? '' : 'mc')}
        >
          <div className="space-y-3 mb-5">
            <InfoCard title="Monte Carlo en una frase">
              <p>
                “Repetir muchas veces y sacar un promedio o porcentaje”.
                Eso es Monte Carlo.
              </p>
            </InfoCard>

            <MiniTheory>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>π:</b> tiras puntos y ves qué porcentaje cae dentro del círculo.</li>
                <li><b>Integral:</b> promedio de f(U).</li>
                <li><b>Probabilidad:</b> porcentaje de veces que ocurre un evento.</li>
              </ul>
              <p className="mt-2">
                Mientras más simulaciones (N), más estable suele ser el resultado.
                Por eso ves una curva que “tiembla” pero se va acomodando.
              </p>
            </MiniTheory>

            <TipCard title="Prueba guiada">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Estimar π con N=1000 y luego con N=20000.</li>
                <li>En moneda, cambia p y mira cómo cambia la probabilidad.</li>
                <li>Quédate con la idea: <b>más N → menos ruido</b>.</li>
              </ol>
            </TipCard>
          </div>


          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modo</label>
              <select
                value={mcMode}
                onChange={(e) => setMcMode(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="pi">Estimar π</option>
                <option value="integral">Estimar integral</option>
                <option value="coin_event">Probabilidad (moneda)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">N simulaciones</label>
              <input
                type="number"
                min="200"
                max="50000"
                step="200"
                value={mcN}
                onChange={(e) => setMcN(parseInt(e.target.value) || 5000)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {mcMode === 'integral' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Función en [0,1]</label>
                <select
                  value={mcFunc}
                  onChange={(e) => setMcFunc(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="x2">x²</option>
                  <option value="sin">sin(x)</option>
                  <option value="exp">e<sup>-x</sup></option>
                </select>
              </div>
            )}

            {mcMode === 'coin_event' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">p (Cara)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={coinP}
                  onChange={(e) => setCoinP(parseFloat(e.target.value) || 0.5)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            )}
          </div>

          {mcMode === 'coin_event' && (
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">M (lanzamientos por experimento)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={coinM}
                  onChange={(e) => setCoinM(parseInt(e.target.value) || 10)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">K (mínimo de caras)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coinK}
                  onChange={(e) => setCoinK(parseInt(e.target.value) || 6)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="text-sm text-gray-600 flex items-end">
                Evento: “al menos K caras en M lanzamientos”
              </div>
            </div>
          )}

          {!monteCarlo ? (
            <div className="text-sm text-gray-700">Abre esta sección para calcular (se optimiza cuando está cerrada).</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {monteCarlo.mode === 'pi' && (
                <>
                  <ScatterPlot
                    title={`Estimación π ≈ ${monteCarlo.piHat.toFixed(5)} (dentro vs fuera)`}
                    xLabel="x"
                    yLabel="y"
                    datasets={[
                      { label: 'Dentro', data: monteCarlo.ptsInside, color: 'rgba(34,197,94,0.65)', pointRadius: 2 },
                      { label: 'Fuera', data: monteCarlo.ptsOut, color: 'rgba(220,38,38,0.45)', pointRadius: 2 },
                    ]}
                  />
                  <SimpleLineChart
                    title="Convergencia de π"
                    labels={monteCarlo.labels}
                    datasetLabel="π estimado"
                    data={monteCarlo.values}
                    yLabel="π"
                  />
                </>
              )}

              {monteCarlo.mode === 'integral' && (
                <>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="font-semibold mb-2">Resultado</div>
                    <div className="text-sm">
                      Estimación: <strong>{monteCarlo.estimate.toFixed(6)}</strong><br />
                      Valor real: <strong>{monteCarlo.exact.toFixed(6)}</strong><br />
                      Error: {(monteCarlo.estimate - monteCarlo.exact).toFixed(6)}
                    </div>
                  </div>
                  <SimpleLineChart
                    title="Convergencia del estimador (promedio acumulado)"
                    labels={monteCarlo.labels}
                    datasetLabel="Estimación"
                    data={monteCarlo.values}
                    yLabel="Integral"
                  />
                </>
              )}

              {monteCarlo.mode === 'coin_event' && (
                <>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="font-semibold mb-2">Probabilidad estimada</div>
                    <div className="text-sm">
                      p̂ = <strong>{monteCarlo.prob.toFixed(5)}</strong><br />
                      con p={monteCarlo.params.p}, M={monteCarlo.params.M}, K={monteCarlo.params.K}
                    </div>
                  </div>
                  <SimpleLineChart
                    title="Convergencia de la probabilidad"
                    labels={monteCarlo.labels}
                    datasetLabel="p̂"
                    data={monteCarlo.values}
                    yLabel="Probabilidad"
                  />
                </>
              )}
            </div>
          )}
        </Section>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <div className="flex items-start space-x-3">
          <div className="text-amber-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-800">Nota didáctica</h4>
            <p className="text-amber-700 text-sm mt-1">
              Este módulo A mezcla teoría + práctica: primero entiendes U(0,1), luego validas (uniformidad/independencia),
              después transformas a no-uniformes y finalmente aplicas Monte Carlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptualModule;
