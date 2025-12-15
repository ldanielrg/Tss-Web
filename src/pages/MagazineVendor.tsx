import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { MagazineVendorSimulation } from '../core/simulations';
import { StatCard } from '../components/ui/StatCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Histogram } from '../components/charts/Histogram';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const MagazineVendor: React.FC = () => {
  const [iterations, setIterations] = useState(5000);
  const [selectedQ, setSelectedQ] = useState(10);
  const [optimizationResults, setOptimizationResults] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const { 
    isRunning, 
    progress, 
    results, 
    stats,
    runSimulation
  } = useSimulation();

  const handleSimulate = () => {
    runSimulation('MAGAZINE', iterations, { quantity: selectedQ });
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    setOptimizationResults([]);
    
    const { simulateMagazineMonth } = await import('../core/BusinessLogic');
    const policies = [];
    
    // Test policies from Q = 5 to Q = 18
    for (let q = 5; q <= 18; q++) {
      const policyResults = [];
      for (let i = 0; i < 1000; i++) {
        policyResults.push(simulateMagazineMonth(q));
      }
      const profits = policyResults.map(r => r.profit);
      const averageProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
      const profitVariance = profits.reduce((sum, p) => sum + Math.pow(p - averageProfit, 2), 0) / profits.length;
      const successRate = profits.filter(p => p > 0).length / profits.length;
      
      policies.push({
        quantity: q,
        averageProfit: averageProfit,
        profitVariance: profitVariance,
        successRate: successRate
      });
    }
    
    setOptimizationResults(policies);
    setIsOptimizing(false);
  };

  const optimalPolicy = optimizationResults.length > 0 
    ? optimizationResults.reduce((best, current) => 
        current.averageProfit > best.averageProfit ? current : best
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Modelo Estocástico de Inventarios - Vendedor de Revistas
          </h1>
          <p className="text-gray-600 mb-4">
            Optimización de políticas de inventario bajo demanda estocástica bifásica 
            aplicando la metodología Coss Bú para sistemas de inventarios.
          </p>
          
          {/* Mathematical Model */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-900 mb-3">
              Modelo Matemático del Sistema
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-green-800 mb-2">Variables de Decisión</h3>
                <div className="bg-white p-4 rounded border text-sm">
                  <div><strong>Q:</strong> Cantidad inicial a comprar (variable de control)</div>
                  <div><strong>Objetivo:</strong> Maximizar E[Utilidad] = E[Ingresos - Costos]</div>
                </div>
                
                <h3 className="font-medium text-green-800 mb-2 mt-4">Parámetros Económicos</h3>
                <div className="bg-white p-4 rounded border text-sm space-y-1">
                  <div>c₁ = $1.50 (costo inicial)</div>
                  <div>p = $2.00 (precio venta)</div>
                  <div>r₁ = $0.90 (recompra día 10)</div>
                  <div>c₂ = $1.20 (compra adicional)</div>
                  <div>r₂ = $0.60 (recompra día 30)</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-green-800 mb-2">Variables Estocásticas</h3>
                <div className="bg-white p-4 rounded border text-sm space-y-2">
                  <div>
                    <strong>D₁:</strong> Demanda días 1-10<br/>
                    <span className="text-xs text-gray-600">Distribución empírica según tabla</span>
                  </div>
                  <div>
                    <strong>D₂:</strong> Demanda días 11-30<br/>
                    <span className="text-xs text-gray-600">Distribución empírica según tabla</span>
                  </div>
                </div>
                
                <h3 className="font-medium text-green-800 mb-2 mt-4">Función Objetivo</h3>
                <div className="bg-white p-4 rounded border text-sm font-mono">
                  <div>Utilidad = Σ(Ventas × p) + Σ(Devoluciones × r) - Σ(Compras × c)</div>
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
                  Cantidad a Comprar (Q)
                </label>
                <input
                  type="range"
                  min="5"
                  max="18"
                  value={selectedQ}
                  onChange={(e) => setSelectedQ(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-lg font-bold text-blue-600 mt-2">
                  {selectedQ} revistas
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Iteraciones por Política
                </label>
                <input
                  type="number"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1000"
                  max="10000"
                  step="1000"
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSimulate}
                  disabled={isRunning}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isRunning ? `Simulando... ${progress}%` : 'Simular Política'}
                </button>

                <button
                  onClick={runOptimization}
                  disabled={isOptimizing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isOptimizing ? 'Optimizando...' : 'Optimizar Todas'}
                </button>
              </div>
            </div>

            {/* Cost Parameters */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-800 mb-2">Parámetros del Modelo</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Costo inicial: $1.50</div>
                <div>Precio venta: $2.00</div>
                <div>Devolución día 10: $0.90</div>
                <div>Compra adicional: $1.20</div>
                <div>Devolución día 30: $0.60</div>
              </div>
            </div>
            
            {/* Demand Distributions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Distribuciones de Demanda</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <div>
                  <strong>Fase 1 (días 1-10):</strong><br/>
                  <span className="text-xs">D₁ ∈ {8,9,10,11,12}</span><br/>
                  <span className="text-xs">P(D₁) = {0.15,0.20,0.30,0.25,0.10}</span>
                </div>
                <div>
                  <strong>Fase 2 (días 11-30):</strong><br/>
                  <span className="text-xs">D₂ ∈ {6,7,8,9,10,11,12}</span><br/>
                  <span className="text-xs">P(D₂) = {0.10,0.15,0.20,0.25,0.15,0.10,0.05}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-3">
            {isRunning && (
              <div className="mb-6">
                <ProgressBar 
                  progress={progress} 
                  label="Ejecutando simulación Monte Carlo" 
                />
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Utilidad Promedio"
                  value={`$${stats.mean.toFixed(2)}`}
                  trend={stats.mean > 0 ? 'up' : 'down'}
                />
                <StatCard
                  title="Probabilidad Utilidad > 0"
                  value={`${((stats.probabilitySuccess || 0) * 100).toFixed(1)}%`}
                />
                <StatCard
                  title="Riesgo (σ)"
                  value={`$${stats.stdDev.toFixed(2)}`}
                />
                <StatCard
                  title="Política Evaluada"
                  value={`${selectedQ} revistas`}
                />
              </div>
            )}

            {/* Detailed Results Analysis */}
            {results.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Análisis Detallado de Resultados - Política Q={selectedQ}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Estadísticas de Ventas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ventas Fase 1 (promedio):</span>
                        <span className="font-mono">
                          {(results.reduce((sum: number, r: any) => sum + r.phase1Sales, 0) / results.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ventas Fase 2 (promedio):</span>
                        <span className="font-mono">
                          {(results.reduce((sum: number, r: any) => sum + r.phase2Sales, 0) / results.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ventas Totales (promedio):</span>
                        <span className="font-mono">
                          {(results.reduce((sum: number, r: any) => sum + r.sold, 0) / results.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Análisis Financiero</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ingresos Promedio:</span>
                        <span className="font-mono text-green-600">
                          ${(results.reduce((sum: number, r: any) => sum + r.totalRevenue, 0) / results.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Costos Promedio:</span>
                        <span className="font-mono text-red-600">
                          ${(results.reduce((sum: number, r: any) => sum + r.totalCosts, 0) / results.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Margen Promedio:</span>
                        <span className="font-mono font-bold">
                          {(((results.reduce((sum: number, r: any) => sum + r.totalRevenue, 0) / results.length) - 
                             (results.reduce((sum: number, r: any) => sum + r.totalCosts, 0) / results.length)) / 
                             (results.reduce((sum: number, r: any) => sum + r.totalRevenue, 0) / results.length) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Indicadores de Riesgo</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Coeficiente de Variación:</span>
                        <span className="font-mono">
                          {((stats?.stdDev || 0) / Math.abs(stats?.mean || 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilidad Mínima:</span>
                        <span className="font-mono text-red-600">
                          ${(stats?.min || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilidad Máxima:</span>
                        <span className="font-mono text-green-600">
                          ${(stats?.max || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Optimization Results */}
            {optimizationResults.length > 0 && optimalPolicy && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Análisis de Sensibilidad - Todas las Políticas
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={optimizationResults}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quantity" label={{ value: 'Cantidad (Q)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Utilidad Promedio ($)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Utilidad Promedio']}
                        labelFormatter={(label: number) => `Cantidad: ${label} revistas`}
                      />
                      <Bar dataKey="averageProfit" fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>Interpretación:</strong> El gráfico muestra la utilidad esperada para cada política de compra. 
                    La política óptima maximiza la utilidad esperada considerando los costos de sobrestock y faltantes.</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">
                    Política Óptima Recomendada
                  </h3>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-green-700">
                      {optimalPolicy.quantity} revistas
                    </div>
                    <div className="text-lg text-green-700">
                      Utilidad esperada: <span className="font-semibold">${optimalPolicy.averageProfit.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-green-600">
                      Probabilidad utilidad &gt; 0: {(optimalPolicy.successRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-600">
                      Riesgo (σ): ${Math.sqrt(optimalPolicy.profitVariance).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">
                      Coef. variación: {(Math.sqrt(optimalPolicy.profitVariance) / optimalPolicy.averageProfit * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white rounded border border-green-300">
                    <h4 className="font-medium text-green-800 mb-2">Justificación Técnica</h4>
                    <p className="text-sm text-green-700">
                      Esta política equilibra óptimamente los costos de inventario excesivo contra 
                      los costos de oportunidad por ventas perdidas, maximizando el valor esperado 
                      del negocio según el criterio de Coss Bú.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Profit Distribution */}
            {results.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <Histogram
                  data={results.map((r: any) => r.profit)}
                  bins={20}
                  title={`Distribución Empírica de Utilidades - Política Q=${selectedQ}`}
                  xAxisLabel="Utilidad ($)"
                  referenceValue={0}
                  referenceName="Punto de equilibrio"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Análisis de Riesgo:</strong> La distribución muestra la variabilidad de utilidades 
                  bajo la política seleccionada. Los valores a la derecha del punto de equilibrio (utilidad ≥ 0) 
                  representan escenarios rentables. La forma de la distribución indica el perfil de riesgo del negocio.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};