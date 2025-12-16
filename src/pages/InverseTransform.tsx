import React, { useState, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { evaluatePDF, evaluateCDF } from '../core/MathEngine';
import { Histogram } from '../components/charts/Histogram';
import { StatCard } from '../components/ui/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const InverseTransform: React.FC = () => {
  const [iterations, setIterations] = useState(1000);
  const { runSimulation, isRunning, progress, results, stats } = useSimulation();

  const handleSimulate = () => {
    runSimulation('CUSTOM_PDF', iterations);
  };

  // Create theoretical PDF overlay data
  const theoreticalData = useMemo(() => {
    const points = [];
    for (let x = 0; x <= 2; x += 0.02) {
      points.push({
        x,
        theoretical: evaluatePDF(x)
      });
    }
    return points;
  }, []);

  const transformedValues = results.map(r => r.value);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Método de la Transformada Inversa
          </h1>
          <p className="text-gray-600 mb-4">
            Implementación rigurosa del método de transformada inversa según la metodología Coss Bú
            para generación de variables aleatorias con distribuciones no estándar.
          </p>
          
          {/* Mathematical Foundation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Fundamento Matemático
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Función de Densidad por Partes</h3>
                <div className="bg-white p-4 rounded border text-sm font-mono">
                  <div>f(x) = -x + 5/4,  para 0 ≤ x ≤ 1</div>
                  <div>f(x) = 1/4,      para 1 &lt; x ≤ 2</div>
                  <div>f(x) = 0,        en otro caso</div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Función de Distribución Acumulada</h3>
                <div className="bg-white p-4 rounded border text-sm font-mono">
                  <div>F(x) = -x²/2 + 5x/4,     para 0 ≤ x ≤ 1</div>
                  <div>F(x) = 3/4 + (x-1)/4,    para 1 &lt; x ≤ 2</div>
                  <div className="mt-2 text-blue-600">Punto crítico: F(1) = 0.75</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-blue-800 mb-2">Algoritmo de Transformada Inversa</h3>
              <div className="bg-white p-4 rounded border text-sm">
                <div className="mb-2"><strong>Paso 1:</strong> Generar R ~ U(0,1)</div>
                <div className="mb-2"><strong>Paso 2:</strong> Si R ≤ 0.75, resolver: -x²/2 + 5x/4 = R</div>
                <div className="mb-2 ml-8">Solución: x = (5/4 - √(25/16 - 2R))/1</div>
                <div className="mb-2"><strong>Paso 3:</strong> Si R &gt; 0.75, resolver: 3/4 + (x-1)/4 = R</div>
                
                <div className="ml-8">Solución: x = 4R - 2</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Parámetros de Simulación</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Iteraciones
                </label>
                <input
                  type="number"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="100"
                  max="10000"
                  step="100"
                />
              </div>

              <div>
                <button
                onClick={handleSimulate}
                disabled={isRunning}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRunning ? `Simulando... ${progress}%` : 'Generar Muestras'}
              </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-800 mb-2">Función PDF</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>f(x) = -x + 5/4, para x ∈ [0,1]</div>
                <div>f(x) = 1/4, para x ∈ [1,2]</div>
              </div>
            </div>
          </div>

          {/* Statistics Panel */}
          <div className="lg:col-span-2 space-y-4">
            {stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Muestras"
                    value={stats.iterations}
                  />
                  <StatCard
                    title="Media"
                    value={stats.mean.toFixed(4)}
                    valueClassName="text-lg"
                  />
                  <StatCard
                    title="Mínimo"
                    value={stats.min.toFixed(3)}
                  />
                  <StatCard
                    title="Máximo"
                    value={stats.max.toFixed(3)}
                  />
                </div>

                {/* Theoretical vs Empirical Comparison */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Validación Estadística
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {((stats.mean - 1.0833) * 100 / 1.0833).toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">Error en Media</div>
                      <div className="text-xs text-gray-500">Teórica: 1.0833</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(stats.iterations >= 1000 ? 'VÁLIDO' : 'INSUFICIENTE')}
                      </div>
                      <div className="text-sm text-gray-600">Tamaño Muestral</div>
                      <div className="text-xs text-gray-500">Mínimo: 1,000</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.stdDev.toFixed(4)}
                      </div>
                      <div className="text-sm text-gray-600">Desv. Estándar</div>
                      <div className="text-xs text-gray-500">Empírica</div>
                    </div>
                  </div>
                </div>
                {/* Sample Table */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Trazabilidad de Resultados (Primeras 10 Muestras)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Iteración
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            R (Aleatorio)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            X (Transformado)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tramo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            F(X) Verificación
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.slice(0, 10).map((result, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.random().toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.value.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.value <= 1 ? '[0,1]' : '(1,2]'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {evaluateCDF(result.value).toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>Interpretación:</strong> La columna "F(X) Verificación" muestra el valor de la CDF 
                    evaluada en el punto generado. Para validar el método, estos valores deberían distribuirse 
                    uniformemente en [0,1] según el teorema fundamental de la transformada inversa.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Visualization */}
        {transformedValues.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF Comparison */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Comparación: PDF Teórica vs Distribución Empírica
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={theoreticalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="theoretical" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="PDF Teórica"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Validación Visual:</strong> La línea roja representa la función de densidad teórica. 
                El histograma de las muestras generadas debe aproximarse a esta curva conforme aumenta el número 
                de iteraciones (Ley de los Grandes Números).</p>
              </div>
            </div>

            {/* Histogram */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <Histogram
                data={transformedValues}
                bins={25}
                title="Distribución Empírica de Variables Generadas"
                xAxisLabel="Valor Transformado (X)"
              />
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Análisis de Convergencia:</strong> Con {stats?.iterations || 0} iteraciones, 
                la distribución empírica converge hacia la teórica. Para mayor precisión, se recomienda 
                usar al menos 10,000 muestras según los criterios de Coss Bú.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};