// src/components/MachineMechanicModule.tsx
import React, { useMemo, useState } from 'react';
import { Play, Clock, Wrench } from 'lucide-react';
import Tooltip from './Tooltip';
import MachineMechanicChart from './MachineMechanicChart';
import { runMachineMechanicSizing, type MachineMechanicParams, type MachineMechanicOutput } from '../utils/machineMechanicSimulator';

const DEFAULT: MachineMechanicParams = {
  minMachines: 1,
  maxMachines: 10,
  simHours: 10000,
  replications: 30,
  idleCostPerHour: 500,
  wagePerHour: 50,
};

export default function MachineMechanicModule() {
  const [params, setParams] = useState<MachineMechanicParams>({ ...DEFAULT });
  const [result, setResult] = useState<MachineMechanicOutput | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useMemo(
    () => ({
      btn: 'bg-violet-600 hover:bg-violet-700',
      ring: 'focus:ring-violet-500',
      pill: 'border-violet-500 bg-violet-50 text-violet-700',
      wrap: 'bg-violet-50 border-violet-200',
    }),
    []
  );

  const validate = (): string | null => {
    if (params.minMachines < 1) return 'N mínimo debe ser >= 1';
    if (params.maxMachines < params.minMachines) return 'N máximo debe ser >= N mínimo';
    if (params.simHours <= 0) return 'Horas simuladas debe ser > 0';
    if (params.replications < 1) return 'Réplicas debe ser >= 1';
    if (params.idleCostPerHour < 0) return 'Costo ociosa no puede ser negativo';
    if (params.wagePerHour < 0) return 'Salario no puede ser negativo';
    return null;
  };

  const run = () => {
    setError(null);
    const e = validate();
    if (e) return setError(e);

    setIsSimulating(true);
    setTimeout(() => {
      setResult(runMachineMechanicSizing(params));
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div className="mt-10">
        <h2 className="text-3xl font-bold text-gray-900">Asignación de máquinas por mecánico</h2>
        <p className="text-gray-600 mt-2">
          Simulación por eventos: fallas y reparaciones aleatorias (según tabla) y minimización de costo.
        </p>
      </div>

      <TheoryPanel wrap={theme.wrap} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Parámetros */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3">
              <Wrench className="w-6 h-6 text-violet-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Parámetros de simulación</h3>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
            )}

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="N mínimo"
                  value={params.minMachines}
                  integer
                  min={1}
                  onChange={(v) => setParams((p) => ({ ...p, minMachines: Math.max(1, Math.floor(v)) }))}
                  ring={theme.ring}
                />
                <Field
                  label="N máximo"
                  value={params.maxMachines}
                  integer
                  min={1}
                  onChange={(v) => setParams((p) => ({ ...p, maxMachines: Math.max(1, Math.floor(v)) }))}
                  ring={theme.ring}
                />
              </div>

              <Field
                label="Horas simuladas (T)"
                value={params.simHours}
                min={1}
                onChange={(v) => setParams((p) => ({ ...p, simHours: v }))}
                ring={theme.ring}
                tooltip="Ejemplo típico: 10,000 horas para estabilizar el promedio"
              />

              <Field
                label="Réplicas (promedio)"
                value={params.replications}
                integer
                min={1}
                onChange={(v) => setParams((p) => ({ ...p, replications: Math.max(1, Math.floor(v)) }))}
                ring={theme.ring}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Costo ociosa ($/h)"
                  value={params.idleCostPerHour}
                  min={0}
                  onChange={(v) => setParams((p) => ({ ...p, idleCostPerHour: v }))}
                  ring={theme.ring}
                />
                <Field
                  label="Salario mecánico ($/h)"
                  value={params.wagePerHour}
                  min={0}
                  onChange={(v) => setParams((p) => ({ ...p, wagePerHour: v }))}
                  ring={theme.ring}
                />
              </div>
            </div>

            <button
              onClick={run}
              disabled={isSimulating}
              className={`w-full mt-6 ${theme.btn} disabled:opacity-60 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
            >
              <Play className="w-4 h-4" />
              <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}</span>
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !isSimulating && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
              <p className="text-gray-600">Configura parámetros y ejecuta la simulación para ver resultados.</p>
            </div>
          )}

          {result && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Resultados (métricas)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left">Métrica</th>
                        <th className="border p-2 text-left">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.metrics).map(([k, v]) => (
                        <tr key={k}>
                          <td className="border p-2 font-medium">{k}</td>
                          <td className="border p-2">{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Gráfica</h3>
                <MachineMechanicChart
                  labels={result.chart.labels}
                  objectiveCost={result.chart.objectiveCost}
                  idleCostPerHourSystem={result.chart.idleCostPerHourSystem}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Tabla de resultados</h3>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          {result.columns.map((c) => (
                            <th key={c} className="border p-2 text-left whitespace-nowrap">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i} className="odd:bg-white even:bg-gray-50/40">
                            {row.map((cell, j) => (
                              <td key={j} className="border p-2 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mt-2">Mostrando {result.rows.length} filas</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TheoryPanel({ wrap }: { wrap: string }) {
  return (
    <div className={`mt-4 p-6 rounded-lg border ${wrap}`}>
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900">Modelo / Distribuciones</h4>
          <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">{`Entre descomposturas (h) por intervalos:
[6,8] 0.10
[8,10] 0.15
[10,12] 0.24
[12,14] 0.26
[16,18] 0.18
[18,20] 0.07

Reparación (h) por intervalos:
[2,4] 0.15
[4,6] 0.25
[6,8] 0.30
[8,10] 0.20
[10,12] 0.10

Simulación:
- N máquinas operan hasta fallar
- Al fallar: esperan (si mecánico ocupado) y luego se reparan (1 a la vez)
- Ocio de una máquina = tiempo desde falla hasta fin de reparación`}</pre>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900">Función objetivo</h4>
          <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">{`Costo ociosa ($/h):
  C_ocio = 500 * (ocio_total_maquina_h / T)

Salario prorrateado:
  C_sal = 50 / N

Costo objetivo:
  C(N) = C_ocio + C_sal`}</pre>
          <div className="text-xs text-gray-600 mt-2">
            Esto sigue la sugerencia del enunciado: minimizar costo ocioso y salario dividido entre máquinas.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ring,
  tooltip,
  step = 0.1,
  min,
  integer,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  ring: string;
  tooltip?: string;
  step?: number;
  min?: number;
  integer?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}{' '}
        {tooltip ? (
          <Tooltip content={tooltip}>
            <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
          </Tooltip>
        ) : null}
      </label>
      <input
        type="number"
        step={integer ? 1 : step}
        min={min}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 ${ring} focus:border-transparent`}
      />
    </div>
  );
}
