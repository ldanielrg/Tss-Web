import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { StatCard } from '../components/ui/StatCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Histogram } from '../components/charts/Histogram';
import { GaugeChart } from '../components/charts/GaugeChart';

export const InvestmentProject: React.FC = () => {
  const [iterations, setIterations] = useState(10000);
  
  const { 
    isRunning, 
    progress, 
    results, 
    stats,
    runSimulation
  } = useSimulation();

  const handleSimulate = () => {
    runSimulation('INVESTMENT', iterations);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evaluación Financiera de Proyectos de Inversión
          </h1>
          <p className="text-gray-600 mb-4">
            Análisis de riesgo financiero mediante simulación Monte Carlo aplicando 
            la metodología Coss Bú para evaluación de proyectos bajo incertidumbre.
          </p>
          
          {/* Financial Model */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-3">
              Modelo Financiero Estocástico
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-purple-800 mb-2">Variables Estocásticas</h3>
                <div className="bg-white p-4 rounded border text-sm space-y-2">
                  <div><strong>I₀:</strong> Inversión inicial ~ Triangular(80k, 100k, 130k)</div>
                  <div><strong>VS:</strong> Valor rescate ~ Triangular(16k, 20k, 26k)</div>
                  <div><strong>Inf:</strong> Inflación ~ Triangular(15%, 20%, 25%)</div>
                  <div>
  <strong>Fₜ:</strong> Flujos anuales ~ Discreta&#123;20k, 30k, 40k, 50k, 60k&#125;
</div>

                </div>
                
                <h3 className="font-medium text-purple-800 mb-2 mt-4">Criterio de Decisión</h3>
                <div className="bg-white p-4 rounded border text-sm">
                  <div><strong>VPN ≥ 0:</strong> Aceptar proyecto</div>
                  <div><strong>VPN &lt; 0:</strong> Rechazar proyecto</div>
                  <div className="mt-2 text-purple-600">
                    <strong>Meta:</strong> P(VPN ≥ 0) ≥ 70%
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-purple-800 mb-2">Fórmula del VPN</h3>
                <div className="bg-white p-4 rounded border text-sm font-mono">
                  <div>VPN = -I₀ + Σₜ₌₁ⁿ [FNEₜ/(1+TREMA)ᵗ] + VS/(1+TREMA)ⁿ</div>
                </div>
                
                <h3 className="font-medium text-purple-800 mb-2 mt-4">Flujo Neto de Efectivo</h3>
                <div className="bg-white p-4 rounded border text-sm space-y-1">
                  <div>Ingresos Brutos: Fₜ</div>
                  <div>(-) Depreciación: (I₀-VS)/n</div>
                  <div>(=) UAI: Fₜ - Depreciación</div>
                  <div>(-) Impuestos: UAI × 50%</div>
                  <div>(=) Utilidad Neta</div>
                  <div>(+) Depreciación</div>
                  <div><strong>(=) FNE</strong></div>
                </div>
                
                <h3 className="font-medium text-purple-800 mb-2 mt-4">Parámetros</h3>
                <div className="bg-white p-4 rounded border text-sm space-y-1">
                  <div>TREMA: 20%</div>
                  <div>Tasa impositiva: 50%</div>
                  <div>Horizonte: 5 años</div>
                  <div>Depreciación: Línea recta</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuración</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Iteraciones Monte Carlo
                </label>
                <input
                  type="number"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1000"
                  max="50000"
                  step="1000"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Mínimo recomendado: 10,000 para estabilidad estadística
                </div>
              </div>

              <div>
                <button
                onClick={handleSimulate}
                disabled={isRunning}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRunning ? `Evaluando... ${progress}%` : 'Evaluar Proyecto'}
              </button>
              </div>
            </div>

            {/* Model Parameters */}
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-800 mb-3">Distribuciones de Entrada</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <strong>Inversión Inicial:</strong><br />
                    Triangular($80k, $100k, $130k)
                  </div>
                  <div>
                    <strong>Valor de Rescate:</strong><br />
                    Triangular($16k, $20k, $26k)
                  </div>
                  <div>
                    <strong>Inflación:</strong><br />
                    Triangular(15%, 20%, 25%)
                  </div>
                  <div>
                    <strong>Flujos de Caja:</strong><br />
                    Uniforme{'{$20k, $30k, $40k, $50k, $60k}'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Parámetros Financieros</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>TREMA: 20%</div>
                  <div>Tasa Impositiva: 50%</div>
                  <div>Horizonte: 5 años</div>
                  <div>Depreciación: Lineal</div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">Supuestos del Modelo</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>• Flujos independientes entre años</div>
                  <div>• Reinversión a TREMA</div>
                  <div>• Valor rescate libre de impuestos</div>
                  <div>• Depreciación fiscal = contable</div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Dashboard */}
          <div className="lg:col-span-3">
            {isRunning && (
              <div className="mb-6">
                <ProgressBar 
                  progress={progress} 
                  label={`Simulación Monte Carlo (${Math.round((progress / 100) * iterations).toLocaleString()} de ${iterations.toLocaleString()} iteraciones)`}
                />
              </div>
            )}

            {stats && (
              <>
                {/* Main Recommendation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-1">
                    <GaugeChart
                      value={stats.probabilitySuccess || 0}
                      title="Probabilidad VPN ≥ 0"
                      subtitle="Criterio de Aceptación"
                      thresholds={{ good: 0.70, acceptable: 0.50 }}
                    />
                  </div>
                  
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <StatCard
                      title="VPN Promedio"
                      value={formatCurrency(stats.mean)}
                      trend={stats.mean > 0 ? 'up' : 'down'}
                      subtitle="Valor esperado"
                    />
                    <StatCard
                      title="Riesgo (σ)"
                      value={formatCurrency(stats.stdDev)}
                      subtitle="Medida de riesgo"
                    />
                    <StatCard
                      title="VPN Máximo"
                      value={formatCurrency(stats.max)}
                      trend="up"
                      subtitle="Escenario optimista"
                    />
                    <StatCard
                      title="VPN Mínimo"
                      value={formatCurrency(stats.min)}
                      trend="down"
                      subtitle="Escenario pesimista"
                    />
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Análisis de Riesgo Financiero
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {((stats.stdDev / Math.abs(stats.mean)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Coeficiente de Variación</div>
                      <div className="text-xs text-gray-500">Riesgo relativo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(Math.max(0, stats.probabilitySuccess || 0))}
                      </div>
                      <div className="text-sm text-gray-600">Probabilidad Éxito</div>
                      <div className="text-xs text-gray-500">VPN ≥ 0</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(stats.mean + 1.96 * stats.stdDev)}
                      </div>
                      <div className="text-sm text-gray-600">VPN 97.5%</div>
                      <div className="text-xs text-gray-500">Percentil superior</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(stats.mean - 1.96 * stats.stdDev)}
                      </div>
                      <div className="text-sm text-gray-600">VPN 2.5%</div>
                      <div className="text-xs text-gray-500">Percentil inferior</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>Interpretación:</strong> El coeficiente de variación mide el riesgo relativo del proyecto. 
                    Los percentiles 2.5% y 97.5% definen el intervalo de confianza del 95% para el VPN.</p>
                  </div>
                </div>
                {/* Final Recommendation Card */}
                <div className={`p-6 rounded-lg border-2 mb-8 ${
                  (stats.probabilitySuccess || 0) >= 0.70
                    ? 'bg-green-50 border-green-200' 
                    : (stats.probabilitySuccess || 0) >= 0.50
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xl font-bold ${
                        (stats.probabilitySuccess || 0) >= 0.70
                          ? 'text-green-800' 
                          : (stats.probabilitySuccess || 0) >= 0.50
                          ? 'text-yellow-800'
                          : 'text-red-800'
                      }`}>
                        Recomendación: {(stats.probabilitySuccess || 0) >= 0.70
                            ? 'ACEPTAR PROYECTO' 
                            : (stats.probabilitySuccess || 0) >= 0.50
                            ? 'EVALUACIÓN ADICIONAL'
                            : 'RECHAZAR PROYECTO'
                        }
                      </h3>
                      <p className={`mt-2 ${
                        (stats.probabilitySuccess || 0) >= 0.70
                          ? 'text-green-700' 
                          : (stats.probabilitySuccess || 0) >= 0.50
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
                        {(stats.probabilitySuccess || 0) >= 0.70 && 
                          `El proyecto tiene una alta probabilidad (${formatPercentage(stats.probabilitySuccess || 0)}) de generar valor positivo.`
                        }
                        {(stats.probabilitySuccess || 0) >= 0.50 && (stats.probabilitySuccess || 0) < 0.70 && 
                          `El proyecto presenta riesgo moderado. Probabilidad de éxito: ${formatPercentage(stats.probabilitySuccess || 0)}.`
                        }
                        {(stats.probabilitySuccess || 0) < 0.50 && 
                          `El proyecto presenta alto riesgo de pérdidas. Probabilidad de éxito: ${formatPercentage(stats.probabilitySuccess || 0)}.`
                        }
                      </p>
                      <div className="mt-3 text-sm">
                        <strong>Fundamento técnico:</strong> Según la metodología Coss Bú, se requiere 
                        una probabilidad mínima del 70% para proyectos de inversión bajo incertidumbre.
                      </div>
                    </div>
                    <div className={`text-4xl font-bold ${
                      (stats.probabilitySuccess || 0) >= 0.70
                        ? 'text-green-600' 
                        : (stats.probabilitySuccess || 0) >= 0.50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {formatPercentage(stats.probabilitySuccess || 0)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* NPV Distribution */}
            {results.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <Histogram
                  data={results.map((r: any) => r.vpn)}
                  bins={30}
                  title="Distribución Empírica del Valor Presente Neto (VPN)"
                  xAxisLabel="VPN ($)"
                  referenceValue={0}
                  referenceName="VPN = 0 (Punto de equilibrio)"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <strong>Análisis de Distribución:</strong> La forma de la distribución revela el perfil de riesgo del proyecto. 
                    Una distribución simétrica indica riesgo balanceado, mientras que asimetría sugiere sesgo hacia escenarios 
                    optimistas o pesimistas. Los valores a la derecha de la línea roja representan escenarios de creación de valor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};