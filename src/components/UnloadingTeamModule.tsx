// src/components/UnloadingTeamModule.tsx
import React, { useMemo, useState } from 'react';
import { Play, Clock, Truck, Users } from 'lucide-react';
import Tooltip from './Tooltip';
import UnloadingTeamChart from './UnloadingTeamChart';
import { runUnloadingTeamSizing, type UnloadingTeamParams, type Workers, type UnloadingTeamOutput } from '../utils/unloadingTeamSimulator';

const DEFAULT: UnloadingTeamParams = {
  lambdaPerHour: 2,
  shifts: 100,
  shiftHours: 8,
  wagePerHour: 25,
  waitingCostPerHour: 50,
  workersOptions: [3, 4, 5, 6],
  replications: 30,
};

export default function UnloadingTeamModule() {
  const [params, setParams] = useState<UnloadingTeamParams>({ ...DEFAULT });
  const [result, setResult] = useState<UnloadingTeamOutput | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useMemo(
    () => ({
      btn: 'bg-orange-600 hover:bg-orange-700',
      ring: 'focus:ring-orange-500',
      pill: 'border-orange-500 bg-orange-50 text-orange-700',
    }),
    []
  );

  const validate = (): string | null => {
    if (params.lambdaPerHour <= 0) return 'λ debe ser > 0';
    if (params.shiftHours <= 0) return 'Horas por turno debe ser > 0';
    if (params.shifts < 1) return 'Turnos debe ser >= 1';
    if (params.replications < 1) return 'Réplicas debe ser >= 1';
    if (!params.workersOptions?.length) return 'Selecciona al menos un tamaño de equipo';
    return null;
  };

  const run = () => {
    setError(null);
    const e = validate();
    if (e) return setError(e);

    setIsSimulating(true);
    setTimeout(() => {
      setResult(runUnloadingTeamSizing(params));
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mt-10">
        <h2 className="text-3xl font-bold text-gray-900">Tamaño óptimo de equipo de descarga</h2>
        <p className="text-gray-600 mt-2">
          Llegadas Poisson (λ camiones/h), servicio uniforme (depende de #trabajadores) y minimización de costo total.
        </p>
      </div>

      <TheoryPanel params={params} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel de parámetros */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3">
              <Truck className="w-6 h-6 text-orange-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Parámetros de simulación</h3>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
            )}

            <div className="mt-5 space-y-4">
              <Field
                label="λ (camiones/hora)"
                value={params.lambdaPerHour}
                onChange={(v) => setParams((p) => ({ ...p, lambdaPerHour: v }))}
                ring={theme.ring}
                tooltip="Proceso Poisson: interarribos ~ Exponencial con media 1/λ"
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Turnos (n)"
                  value={params.shifts}
                  integer
                  min={1}
                  step={1}
                  onChange={(v) => setParams((p) => ({ ...p, shifts: Math.max(1, Math.floor(v)) }))}
                  ring={theme.ring}
                />
                <Field
                  label="Horas/turno"
                  value={params.shiftHours}
                  min={0.1}
                  onChange={(v) => setParams((p) => ({ ...p, shiftHours: v }))}
                  ring={theme.ring}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Salario ($/h por trabajador)"
                  value={params.wagePerHour}
                  min={0}
                  onChange={(v) => setParams((p) => ({ ...p, wagePerHour: v }))}
                  ring={theme.ring}
                />
                <Field
                  label="Costo espera ($/h)"
                  value={params.waitingCostPerHour}
                  min={0}
                  onChange={(v) => setParams((p) => ({ ...p, waitingCostPerHour: v }))}
                  ring={theme.ring}
                />
              </div>

              <Field
                label="Réplicas (promedio)"
                value={params.replications}
                integer
                min={1}
                step={1}
                onChange={(v) => setParams((p) => ({ ...p, replications: Math.max(1, Math.floor(v)) }))}
                ring={theme.ring}
                tooltip="Aumenta para estabilizar resultados (menos variación aleatoria)."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <span>Trabajadores a probar</span>
                  <Tooltip content="Se simula cada tamaño y se compara el costo total">
                    <span className="text-gray-400 cursor-help">ⓘ</span>
                  </Tooltip>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((w) => {
                    const ww = w as Workers;
                    const active = params.workersOptions.includes(ww);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() =>
                          setParams((p) => {
                            const has = p.workersOptions.includes(ww);
                            const next = has ? p.workersOptions.filter((x) => x !== ww) : [...p.workersOptions, ww];
                            next.sort((a, b) => a - b);
                            return { ...p, workersOptions: next as Workers[] };
                          })
                        }
                        className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm ${
                          active ? theme.pill : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Servicio uniforme según el tamaño del equipo (3..6).
                </div>
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

        {/* Panel de resultados */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !isSimulating && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
              <p className="text-gray-600">Configura los parámetros y ejecuta una simulación para ver los resultados.</p>
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
                <UnloadingTeamChart
                  title="Costo vs número de trabajadores"
                  labels={result.chart.labels}
                  totalCost={result.chart.totalCost}
                  laborCost={result.chart.laborCost}
                  waitingCost={result.chart.waitingCost}
                />
                <div className="text-sm text-gray-500 mt-2">
                  Recomendación: el mínimo del <strong>costo total</strong> define el tamaño óptimo del equipo.
                </div>
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

                <div className="text-sm text-gray-500 mt-2">
                  Mostrando {result.rows.length} filas (scroll dentro de la tabla)
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TheoryPanel({ params }: { params: UnloadingTeamParams }) {
  const fmt = (x: number, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '-');

  return (
    <div className="mt-4 p-6 rounded-lg border bg-orange-50 border-orange-200">
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Modelo / Distribuciones
          </h4>

          <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">{`Llegadas:
- Proceso Poisson con λ (camiones/hora)
- Interarribo (h): T = -ln(U)/λ

Servicio (depende del equipo):
- 3 trabajadores: U(20,30) min
- 4 trabajadores: U(15,25) min
- 5 trabajadores: U(10,20) min
- 6 trabajadores: U(5,15)  min

Horizon:
- Turno nocturno: ${fmt(params.shiftHours, 2)} h
- # turnos: ${Math.floor(params.shifts)}
- Total simulado: ${fmt(params.shiftHours * params.shifts, 2)} h`}</pre>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900">Costo total</h4>

          <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">{`Costo mano de obra:
  C_lab = workers * wagePerHour * shiftHours * shifts

Costo por espera (camión-hora):
  C_wait = waitingCostPerHour * (∫ Q(t) dt)

Costo total:
  C_total = C_lab + C_wait`}</pre>

          <div className="text-xs text-gray-600 mt-2">
            Aquí ∫Q(t)dt se calcula por eventos discretos: acumulando el área de la cola entre eventos.
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
