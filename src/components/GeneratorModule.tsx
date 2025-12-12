import React, { useState, useCallback } from 'react';
import { Settings, Play, BarChart3, TrendingUp } from 'lucide-react';
import { RandomGenerator } from '../utils/randomGenerators';
import { Statistics } from '../utils/statistics';
import DistributionChart from './DistributionChart';
import Tooltip from './Tooltip';
import type { Distribution, SimulationResult } from '../types/simulation';

const GeneratorModule: React.FC = () => {
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution['type']>('uniform');
  const [parameters, setParameters] = useState<{ [key: string]: number }>({
    a: 0, b: 1, lambda: 1, mu: 0, sigma: 1
  });
  const [sampleSize, setSampleSize] = useState(1000);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const distributions: Distribution[] = [
    {
      name: 'Uniforme',
      type: 'uniform',
      parameters: { a: 'Límite inferior', b: 'Límite superior' },
      description: 'Todos los valores en el intervalo [a,b] tienen igual probabilidad',
      formula: 'f(x) = 1/(b-a) para a ≤ x ≤ b'
    },
    {
      name: 'Exponencial',
      type: 'exponential',
      parameters: { lambda: 'Tasa (λ)' },
      description: 'Modela tiempos entre eventos (llegadas, fallas, etc.)',
      formula: 'f(x) = λe^(-λx) para x ≥ 0'
    },
    {
      name: 'Normal',
      type: 'normal',
      parameters: { mu: 'Media (μ)', sigma: 'Desv. Estándar (σ)' },
      description: 'Distribución gaussiana, muy común en fenómenos naturales',
      formula: 'f(x) = (1/(σ√(2π)))e^(-(x-μ)²/(2σ²))'
    }
  ];

  const generateSamples = useCallback(() => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let data: number[] = [];
      let theoreticalMean = 0;
      let theoreticalVariance = 0;

      switch (selectedDistribution) {
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
      }

      const histogram = Statistics.histogram(data, 30);
      const empiricalMean = Statistics.mean(data);
      const empiricalVariance = Statistics.variance(data);

      setResult({
        data,
        theoretical: {
          mean: theoreticalMean,
          variance: theoreticalVariance
        },
        empirical: {
          mean: empiricalMean,
          variance: empiricalVariance,
          standardDeviation: Statistics.standardDeviation(data)
        },
        histogram
      });

      setIsGenerating(false);
    }, 100);
  }, [selectedDistribution, parameters, sampleSize]);

  const getTheoreticalCurve = () => {
    if (!result) return { x: [], y: [] };

    const min = Math.min(...result.data);
    const max = Math.max(...result.data);
    const range = max - min;
    const x = [];
    const y = [];

    for (let i = 0; i <= 100; i++) {
      const xi = min + (range * i) / 100;
      x.push(xi);

      let yi = 0;
      switch (selectedDistribution) {
        case 'uniform':
          yi = Statistics.uniformPDF(xi, parameters.a, parameters.b);
          break;
        case 'exponential':
          yi = Statistics.exponentialPDF(xi, parameters.lambda);
          break;
        case 'normal':
          yi = Statistics.normalPDF(xi, parameters.mu, parameters.sigma);
          break;
      }
      y.push(yi);
    }

    return { x, y };
  };

  const currentDistribution = distributions.find(d => d.type === selectedDistribution)!;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Módulo B: Generador de Variables Aleatorias</h2>
        </div>
        <p className="text-green-100">
          Configura parámetros, genera muestras y compara resultados empíricos vs teóricos.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel de Configuración */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Configuración</span>
            </h3>

            {/* Selección de distribución */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribución
                <Tooltip content="Selecciona el modelo de distribución de probabilidad">
                  <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                </Tooltip>
              </label>
              <select
                value={selectedDistribution}
                onChange={(e) => setSelectedDistribution(e.target.value as Distribution['type'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {distributions.map((dist) => (
                  <option key={dist.type} value={dist.type}>
                    {dist.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Parámetros dinámicos */}
            {Object.entries(currentDistribution.parameters).map(([param, label]) => (
              <div key={param} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={parameters[param]}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    [param]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}

            {/* Tamaño de muestra */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño de Muestra
                <Tooltip content="Número de valores aleatorios a generar">
                  <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                </Tooltip>
              </label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value) || 1000)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botón generar */}
            <button
              onClick={generateSamples}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isGenerating ? 'Generando...' : 'Generar Muestras'}</span>
            </button>

            {/* Información de la distribución */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Información</h4>
              <p className="text-sm text-gray-600 mb-2">{currentDistribution.description}</p>
              <div className="bg-white p-2 rounded border">
                <code className="text-xs font-mono">{currentDistribution.formula}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Gráfico */}
              <DistributionChart
                histogramData={result.histogram}
                theoreticalData={getTheoreticalCurve()}
                title={`Distribución ${currentDistribution.name} - Comparación Teórica vs Empírica`}
              />

              {/* Estadísticas */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Estadísticas Comparativas</span>
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Valores Teóricos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Media (μ):</span>
                        <span className="font-mono">{result.theoretical.mean.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Varianza (σ²):</span>
                        <span className="font-mono">{result.theoretical.variance.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Desv. Estándar (σ):</span>
                        <span className="font-mono">{Math.sqrt(result.theoretical.variance).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Valores Empíricos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Media (x̄):</span>
                        <span className="font-mono">{result.empirical.mean.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Varianza (s²):</span>
                        <span className="font-mono">{result.empirical.variance.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Desv. Estándar (s):</span>
                        <span className="font-mono">{result.empirical.standardDeviation.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Análisis de convergencia */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Análisis de Convergencia</h4>
                  <div className="text-sm text-blue-800">
                    <p><strong>Error en Media:</strong> {Math.abs(result.theoretical.mean - result.empirical.mean).toFixed(4)} 
                       ({(Math.abs(result.theoretical.mean - result.empirical.mean) / Math.abs(result.theoretical.mean) * 100).toFixed(2)}%)</p>
                    <p><strong>Error en Varianza:</strong> {Math.abs(result.theoretical.variance - result.empirical.variance).toFixed(4)}
                       ({(Math.abs(result.theoretical.variance - result.empirical.variance) / Math.abs(result.theoretical.variance) * 100).toFixed(2)}%)</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!result && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <BarChart3 className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Datos</h3>
              <p className="text-gray-600">
                Configura los parámetros y haz clic en "Generar Muestras" para comenzar la simulación.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorModule;