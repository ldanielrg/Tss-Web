import React, { useMemo, useState, useCallback } from 'react';
import { Settings, Play, BarChart3, TrendingUp, HelpCircle, Download } from 'lucide-react';
import { RandomGenerator } from '../utils/randomGenerators';
import { Statistics } from '../utils/statistics';
import DistributionChart from './DistributionChart';
import Tooltip from './Tooltip';
import type { Distribution, SimulationResult } from '../types/simulation';

type DistType =
  | 'uniform'
  | 'exponential'
  | 'normal'
  | 'triangular'
  | 'studentT'
  | 'chiSquare'
  | 'fisherF'
  | 'bernoulli'
  | 'binomial'
  | 'poisson'
  | 'geometric'
  | 'multinomial';

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));

const GeneratorModule: React.FC = () => {
  const [selectedDistribution, setSelectedDistribution] = useState<DistType>('uniform');

  const [parameters, setParameters] = useState<{ [key: string]: number }>({
    a: 0,
    b: 1,
    c: 0.5, 
    lambda: 1,   
    mu: 0,
    sigma: 1,
    p: 0.5,
    n: 10,
    nu: 5,      // t-student df
    k: 4,       // chi-square df
    d1: 5, d2: 10 // F df1 df2  
  });


  const [sampleSize, setSampleSize] = useState(1000);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tableRows, setTableRows] = useState(50);
  const [multiProbsText, setMultiProbsText] = useState('0.2, 0.3, 0.5');
  const [multiCategory, setMultiCategory] = useState(1); // 1..k


  const distributions: Distribution[] = [
    // CONTINUAS
    {
      name: 'Uniforme',
      type: 'uniform',
      kind: 'continuous',
      parameters: { a: 'Límite inferior (a)', b: 'Límite superior (b)' },
      description: 'Todos los valores en [a, b] tienen igual probabilidad',
      formula: 'f(x)=1/(b-a), a≤x≤b',
      method: 'Método: Transformada inversa (U~U(0,1) => X=a+(b-a)U).'
    },
    {
      name: 'Exponencial',
      type: 'exponential',
      kind: 'continuous',
      parameters: { lambda: 'Tasa (λ)' },
      description: 'Modela tiempos entre eventos (llegadas, fallas, etc.)',
      formula: 'f(x)=λ e^{-λx}, x≥0',
      method: 'Método: Transformada inversa (X=-(1/λ) ln(1-U)).'
    },
    {
      name: 'Normal',
      type: 'normal',
      kind: 'continuous',
      parameters: { mu: 'Media (μ)', sigma: 'Desv. Estándar (σ)' },
      description: 'Distribución gaussiana (muy común en fenómenos naturales)',
      formula: 'f(x)= (1/(σ√(2π))) e^{-((x-μ)^2)/(2σ^2)}',
      method: 'Método: Box–Muller (usa 2 uniformes para generar normales).'
    },
    {
      name: 'Triangular',
      type: 'triangular',
      kind: 'continuous',
      parameters: { a: 'Mínimo (a)', b: 'Máximo (b)', c: 'Moda (c)' },
      description: 'Distribución triangular definida por mínimo, máximo y moda.',
      formula: 'f(x)= 2(x-a)/((b-a)(c-a)) si a≤x<c; 2(b-x)/((b-a)(b-c)) si c≤x≤b',
      method: 'Método: Transformada inversa por tramos.'
    },
    {
      name: 't de Student',
      type: 'studentT',
      kind: 'continuous',
      parameters: { nu: 'Grados de libertad (ν)' },
      description: 'Distribución t de Student (colas más pesadas que la normal).',
      formula: 'f(x)= Γ((ν+1)/2)/(√(νπ)Γ(ν/2)) (1+x²/ν)^(-(ν+1)/2)',
      method: 'Método: t = Z / √(X/ν), Z~N(0,1), X~Chi²(ν).'
    },
    {
      name: 'Chi-Cuadrado',
      type: 'chiSquare',
      kind: 'continuous',
      parameters: { k: 'Grados de libertad (k)' },
      description: 'Suma de cuadrados de normales estándar.',
      formula: 'f(x)= 1/(2^{k/2}Γ(k/2)) x^{k/2-1} e^{-x/2}, x≥0',
      method: 'Método: X = Σ Z_i², Z_i~N(0,1).'
    },
    {
      name: 'F de Fisher',
      type: 'fisherF',
      kind: 'continuous',
      parameters: { d1: 'Grados libertad (d1)', d2: 'Grados libertad (d2)' },
      description: 'Cociente de varianzas (muy usada en ANOVA).',
      formula: 'f(x)= [Γ((d1+d2)/2)/(Γ(d1/2)Γ(d2/2))] (d1/d2)^{d1/2} x^{d1/2-1} / (1+(d1/d2)x)^{(d1+d2)/2}',
      method: 'Método: F=(X1/d1)/(X2/d2), Xi~Chi²(di).'
    },


    // DISCRETAS (para cumplir el alcance)
    {
      name: 'Bernoulli',
      type: 'bernoulli',
      kind: 'discrete',
      parameters: { p: 'Probabilidad de éxito (p)' },
      description: 'Una sola prueba: X∈{0,1}.',
      formula: 'P(X=1)=p, P(X=0)=1-p',
      method: 'Método: comparación con U~U(0,1) (si U<p entonces 1, sino 0).'
    },
    {
      name: 'Binomial',
      type: 'binomial',
      kind: 'discrete',
      parameters: { n: 'Ensayos (n)', p: 'Prob. éxito (p)' },
      description: 'Número de éxitos en n ensayos Bernoulli.',
      formula: 'P(X=k)=C(n,k)p^k(1-p)^{n-k}',
      method: 'Método: suma de n Bernoulli o inversa por acumulada (según implementación).'
    },
    {
      name: 'Poisson',
      type: 'poisson',
      kind: 'discrete',
      parameters: { lambda: 'Tasa/Media (λ)' },
      description: 'Cuenta eventos en un intervalo cuando ocurren al azar.',
      formula: 'P(X=k)=e^{-λ} λ^k / k!',
      method: 'Método clásico de Knuth (producto de uniformes).'
    },
    {
      name: 'Geométrica',
      type: 'geometric',
      kind: 'discrete',
      parameters: { p: 'Prob. éxito (p)' },
      description: 'Cantidad de intentos hasta el primer éxito (según convención).',
      formula: 'P(X=k)=(1-p)^{k-1}p, k=1,2,...',
      method: 'Método: inversa discreta usando acumulada.'
    },
    {
      name: 'Multinomial',
      type: 'multinomial',
      kind: 'discrete',
      parameters: { n: 'Ensayos (n)' }, // probs lo hacemos input especial
      description: 'Generaliza la binomial a k categorías. Genera un vector (X1,...,Xk) que suma n.',
      formula: 'P(x1,...,xk)= n!/(x1!...xk!) ∏ p_i^{x_i}, con ∑x_i=n y ∑p_i=1',
      method: 'Método: descomposición secuencial en binomiales (condicionales).'
    }

  ];

  const currentDistribution = distributions.find(d => d.type === selectedDistribution)!;

  const parsedMultiProbs = useMemo(() => {
    return multiProbsText
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(v => !Number.isNaN(v));
  }, [multiProbsText]);

  const validationError = useMemo(() => {
    const p = parameters.p;
    const n = Math.floor(parameters.n);

    switch (selectedDistribution) {
      case 'uniform':
        if (!(parameters.b > parameters.a)) return 'En Uniforme debe cumplirse: b > a.';
        return null;
      case 'exponential':
        if (!(parameters.lambda > 0)) return 'En Exponencial debe cumplirse: λ > 0.';
        return null;
      case 'normal':
        if (!(parameters.sigma > 0)) return 'En Normal debe cumplirse: σ > 0.';
        return null;
      case 'triangular':
        if (!(parameters.b > parameters.a)) return 'En Triangular: b > a.';
        if (!(parameters.c >= parameters.a && parameters.c <= parameters.b)) return 'En Triangular: a ≤ c ≤ b.';
        return null;

      case 'chiSquare': {
        const kk = Math.floor(parameters.k);
        if (!(kk >= 1)) return 'En Chi-Cuadrado: k ≥ 1 (entero).';
        return null;
      }

      case 'studentT': {
        const nu = parameters.nu;
        if (!(nu > 2)) return 'En t-Student: ν > 2 (para que la varianza sea finita).';
        return null;
      }

      case 'fisherF': {
        const d1 = Math.floor(parameters.d1);
        const d2 = Math.floor(parameters.d2);
        if (!(d1 >= 1)) return 'En F: d1 ≥ 1 (entero).';
        if (!(d2 > 4)) return 'En F: d2 > 4 (para que la varianza sea finita).';
        return null;
      }
      case 'bernoulli':
      case 'geometric':
        if (!(p >= 0 && p <= 1)) return 'Debe cumplirse: 0 ≤ p ≤ 1.';
        if (selectedDistribution === 'geometric' && p === 0) return 'En Geométrica debe cumplirse: p > 0.';
        return null;
      case 'binomial':
        if (!(n >= 1)) return 'En Binomial debe cumplirse: n ≥ 1 (entero).';
        if (!(p >= 0 && p <= 1)) return 'En Binomial debe cumplirse: 0 ≤ p ≤ 1.';
        return null;
      case 'poisson':
        if (!(parameters.lambda > 0)) return 'En Poisson debe cumplirse: λ > 0.';
        return null;
      case 'multinomial': {
        const nn = Math.floor(parameters.n);
        const probs = parsedMultiProbs;

        if (nn < 1) return 'En Multinomial: n debe ser ≥ 1 (entero).';
        if (probs.length < 2) return 'En Multinomial: ingresá al menos 2 probabilidades (p1,p2,...).';
        if (probs.some(pi => pi < 0 || pi > 1)) return 'En Multinomial: cada p_i debe estar entre 0 y 1.';
        const sum = probs.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1) > 1e-6) return `En Multinomial: las probabilidades deben sumar 1 (suman ${sum.toFixed(6)}).`;

        const k = probs.length;
        if (multiCategory < 1 || multiCategory > k) return `Categoría inválida: debe estar entre 1 y ${k}.`;

        return null;
      }
      default:
        return null;
    }
  }, [selectedDistribution, parameters, parsedMultiProbs, multiCategory]);


  const generateSamples = useCallback(() => {
    if (validationError) return;

    setIsGenerating(true);

    setTimeout(() => {
      let data: number[] = [];
      let theoreticalMean = 0;
      let theoreticalVariance = 0;
      let multiVectors: number[][] | null = null;
      let multiProbs: number[] | null = null;
      let multiN: number | null = null;
      let multiIndex: number | null = null;


      const p = clamp(parameters.p, 0, 1);
      const n = Math.max(1, Math.floor(parameters.n));

      switch (selectedDistribution) {
        // CONTINUAS
        case 'uniform':
          data = RandomGenerator.uniform(parameters.a, parameters.b, sampleSize);
          theoreticalMean = (parameters.a + parameters.b) / 2;
          theoreticalVariance = Math.pow(parameters.b - parameters.a, 2) / 12;
          break;
        case 'exponential':
          data = RandomGenerator.exponential(parameters.lambda, sampleSize);
          theoreticalMean = 1 / parameters.lambda;
          theoreticalVariance = 1 / Math.pow(parameters.lambda, 2);
          break;
        case 'normal':
          data = RandomGenerator.normal(parameters.mu, parameters.sigma, sampleSize);
          theoreticalMean = parameters.mu;
          theoreticalVariance = Math.pow(parameters.sigma, 2);
          break;
        case 'triangular':
          data = RandomGenerator.triangular(parameters.a, parameters.b, parameters.c, sampleSize);
          theoreticalMean = (parameters.a + parameters.b + parameters.c) / 3;
          theoreticalVariance =
            (parameters.a * parameters.a +
              parameters.b * parameters.b +
              parameters.c * parameters.c -
              parameters.a * parameters.b -
              parameters.a * parameters.c -
              parameters.b * parameters.c) / 18;
          break;

        case 'chiSquare': {
          const kk = Math.max(1, Math.floor(parameters.k));
          data = RandomGenerator.chiSquare(kk, sampleSize);
          theoreticalMean = kk;
          theoreticalVariance = 2 * kk;
          break;
        }

        case 'studentT': {
          const nu = parameters.nu;
          data = RandomGenerator.studentT(nu, sampleSize);
          theoreticalMean = 0;
          theoreticalVariance = nu / (nu - 2);
          break;
        }

        case 'fisherF': {
          const d1 = Math.max(1, Math.floor(parameters.d1));
          const d2 = Math.max(1, Math.floor(parameters.d2));
          data = RandomGenerator.fisherF(d1, d2, sampleSize);

          theoreticalMean = d2 / (d2 - 2);
          theoreticalVariance = (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) * (d2 - 2) * (d2 - 4));
          break;
        }


        // DISCRETAS
        case 'bernoulli':
          data = RandomGenerator.bernoulli(p, sampleSize);
          theoreticalMean = p;
          theoreticalVariance = p * (1 - p);
          break;
        case 'binomial':
          data = RandomGenerator.binomial(n, p, sampleSize);
          theoreticalMean = n * p;
          theoreticalVariance = n * p * (1 - p);
          break;
        case 'poisson':
          data = RandomGenerator.poisson(parameters.lambda, sampleSize);
          theoreticalMean = parameters.lambda;
          theoreticalVariance = parameters.lambda;
          break;
        case 'geometric':
          data = RandomGenerator.geometric(p, sampleSize); // convención: k=1,2,3...
          theoreticalMean = 1 / p;
          theoreticalVariance = (1 - p) / (p * p);
          break;
        case 'multinomial': {
          const nn = Math.max(1, Math.floor(parameters.n));
          const probs = parsedMultiProbs;
          const j = multiCategory - 1;

          multiVectors = RandomGenerator.multinomial(nn, probs, sampleSize);
          data = multiVectors.map(v => v[j]);

          theoreticalMean = nn * probs[j];
          theoreticalVariance = nn * probs[j] * (1 - probs[j]);

          // guardar metadata para setResult
          multiProbs = probs;
          multiN = nn;
          multiIndex = j;
          break;
        }
      }

      const histogram =
        currentDistribution.kind === 'discrete'
          ? Statistics.discreteHistogram(data)
          : Statistics.histogram(data, 30);

      const empiricalMean = Statistics.mean(data);
      const empiricalVariance = Statistics.variance(data);

      setResult({
        data,
        theoretical: { mean: theoreticalMean, variance: theoreticalVariance },
        empirical: {
          mean: empiricalMean,
          variance: empiricalVariance,
          standardDeviation: Statistics.standardDeviation(data)
        },
        histogram,
        meta: {
          distributionName: currentDistribution.name,
          kind: currentDistribution.kind
        },
        multinomial: selectedDistribution === 'multinomial' && multiVectors && multiProbs && multiN !== null && multiIndex !== null
          ? { probs: multiProbs, vectors: multiVectors, categoryIndex: multiIndex, n: multiN }
          : undefined,
      });

      setIsGenerating(false);
    }, 100);
  }, [selectedDistribution, parameters, sampleSize, validationError, currentDistribution.kind, currentDistribution.name, parsedMultiProbs, multiCategory]);

const theoreticalSeries = useMemo(() => {
  if (!result) return { x: [], y: [] as number[] };

  const bins = result.histogram.bins;

  // DISCRETAS: usar exactamente los bins del histograma
  if (currentDistribution.kind === 'discrete') {
    const p = clamp(parameters.p, 0, 1);
    const n = Math.max(1, Math.floor(parameters.n));

    const x = bins.map(b => Math.round(b));
    const y = x.map((k) => {
      switch (selectedDistribution) {
        case 'bernoulli':
          return Statistics.bernoulliPMF(k, p);
        case 'binomial':
          return Statistics.binomialPMF(k, n, p);
        case 'poisson':
          return Statistics.poissonPMF(k, parameters.lambda);
        case 'geometric':
          return Statistics.geometricPMF(k, p);
        case 'multinomial': {
          const nn = Math.max(1, Math.floor(parameters.n));
          const probs = parsedMultiProbs;
          const j = multiCategory - 1;
          const pj = probs[j] ?? 0;
          return Statistics.binomialPMF(k, nn, pj);
        }
        default:
          return 0;
      }
    });

    return { x, y };
  }

  // CONTINUAS: evaluar la PDF en el centro de cada bin (para que calce mejor)
  const binWidth = bins.length > 1 ? (bins[1] - bins[0]) : 1;
  const x = bins.map(b => b + binWidth / 2);

  const y = x.map((xi) => {
    switch (selectedDistribution) {
      case 'uniform':
        return Statistics.uniformPDF(xi, parameters.a, parameters.b);
      case 'exponential':
        return Statistics.exponentialPDF(xi, parameters.lambda);
      case 'normal':
        return Statistics.normalPDF(xi, parameters.mu, parameters.sigma);
      case 'triangular':
        return Statistics.triangularPDF(xi, parameters.a, parameters.b, parameters.c);
      case 'chiSquare':
        return Statistics.chiSquarePDF(xi, Math.max(1, Math.floor(parameters.k)));
      case 'studentT':
        return Statistics.studentTPDF(xi, parameters.nu);
      case 'fisherF':
        return Statistics.fisherFPDF(xi, Math.max(1, Math.floor(parameters.d1)), Math.max(1, Math.floor(parameters.d2)));
      default:
        return 0;
    }
  });

  return { x, y };
}, [result, currentDistribution.kind, selectedDistribution, parameters, parsedMultiProbs, multiCategory]);


  const downloadCSV = () => {
    if (!result) return;

    const header = 'i,valor\n';
    const body = result.data.map((v, i) => `${i + 1},${v}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `muestras_${selectedDistribution}_${sampleSize}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Módulo 2: Distribuciones (Generación y Visualización)</h2>
        </div>
        <p className="text-green-100">
          Seleccioná una distribución (discreta o continua), configurá parámetros, generá muestras y compará empírico vs teórico.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel Config */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Configuración</span>
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribución
                <Tooltip content="Selecciona el modelo de distribución (discreta o continua)">
                  <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                </Tooltip>
              </label>

              <select
                value={selectedDistribution}
                onChange={(e) => setSelectedDistribution(e.target.value as DistType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {/* agrupado para que el docente vea “discretas y continuas” */}
                <optgroup label="Continuas">
                  {distributions.filter(d => d.kind === 'continuous').map((dist) => (
                    <option key={dist.type} value={dist.type}>
                      {dist.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Discretas">
                  {distributions.filter(d => d.kind === 'discrete').map((dist) => (
                    <option key={dist.type} value={dist.type}>
                      {dist.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {Object.entries(currentDistribution.parameters).map(([param, label]) => (
              <div key={param} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <input
                  type="number"
                  step={param === 'n' ? '1' : '0.1'}
                  value={parameters[param]}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    [param]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            {selectedDistribution === 'multinomial' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probabilidades (p1,p2,...)
                  </label>
                  <input
                    type="text"
                    value={multiProbsText}
                    onChange={(e) => setMultiProbsText(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ej: 0.2, 0.3, 0.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deben sumar 1.</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría a visualizar (1..k)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={multiCategory}
                    onChange={(e) => setMultiCategory(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño de Muestra
                <Tooltip content="Cantidad de valores pseudoaleatorios a generar">
                  <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                </Tooltip>
              </label>
              <input
                type="number"
                min="100"
                max="20000"
                step="100"
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value) || 1000)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {validationError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {validationError}
              </div>
            )}

            <button
              onClick={generateSamples}
              disabled={isGenerating || !!validationError}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isGenerating ? 'Generando...' : 'Generar Muestras'}</span>
            </button>

            {/* Ayuda educativa (RF-06) */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Ayuda educativa
              </h4>
              <p className="text-sm text-gray-700 mb-2"><strong>Descripción:</strong> {currentDistribution.description}</p>
              <div className="bg-white p-2 rounded border mb-2">
                <div className="text-xs text-gray-500 mb-1">Fórmula:</div>
                <code className="text-xs font-mono">{currentDistribution.formula}</code>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="text-xs text-gray-500 mb-1">Método de generación:</div>
                <p className="text-xs text-gray-700">{currentDistribution.method}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <DistributionChart
                kind={currentDistribution.kind}
                histogramData={result.histogram}
                theoreticalData={theoreticalSeries}
                title={`${currentDistribution.name} — Teórico vs Empírico`}
              />

              {/* Tabla (RF-02a) */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">Tabla de valores generados</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Filas:</label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      step={10}
                      value={tableRows}
                      onChange={(e) => setTableRows(parseInt(e.target.value) || 50)}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={downloadCSV}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                      title="Descargar CSV"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">CSV</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 max-h-80 overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 border-b">i</th>
                        <th className="text-left px-3 py-2 border-b">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.slice(0, tableRows).map((v, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 border-b">{idx + 1}</td>
                          <td className="px-3 py-2 border-b font-mono">{Number.isInteger(v) ? v : v.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Mostrando las primeras {Math.min(tableRows, result.data.length)} muestras de {result.data.length}.
                </p>
              </div>

              {/* Estadísticas (RF-03) */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Estadísticas comparativas</span>
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Teóricas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Media:</span>
                        <span className="font-mono">{result.theoretical.mean.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Varianza:</span>
                        <span className="font-mono">{result.theoretical.variance.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Desv. estándar:</span>
                        <span className="font-mono">{Math.sqrt(result.theoretical.variance).toFixed(6)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Empíricas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Media:</span>
                        <span className="font-mono">{result.empirical.mean.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Varianza:</span>
                        <span className="font-mono">{result.empirical.variance.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Desv. estándar:</span>
                        <span className="font-mono">{result.empirical.standardDeviation.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Convergencia (error absoluto)</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <strong>Error en media:</strong> {Math.abs(result.theoretical.mean - result.empirical.mean).toFixed(6)}
                    </p>
                    <p>
                      <strong>Error en varianza:</strong> {Math.abs(result.theoretical.variance - result.empirical.variance).toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <BarChart3 className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin datos</h3>
              <p className="text-gray-600">
                Configurá parámetros y tocá “Generar Muestras”.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorModule;
