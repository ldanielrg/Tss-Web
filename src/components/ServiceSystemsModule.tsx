import React, { useMemo, useState } from 'react';
import { Play, Clock, Server } from 'lucide-react';
import Tooltip from './Tooltip';
import ServiceSystemsChart from './ServiceSystemsChart';
import {
  runSerie,
  runBanco,
  runEstacionamiento,
  type SimulationOutput,
  type SerieParams,
  type BancoParams,
  type EstacionamientoParams,
} from '../utils/serviceSystemsSimulator';

type Kind = 'serie' | 'banco' | 'estacionamiento';

const DEFAULT_SERIE: SerieParams = {
  lambdaPerHour: 20,
  mu1MeanMin: 2,
  s2MinMin: 1,
  s2MaxMin: 3,
  cierreHours: 8,
};

const DEFAULT_BANCO: BancoParams = {
  lambdaPerHour: 40,
  numeroCajeros: 3,
  sMinMin: 0,
  sMaxMin: 1,
  cierreHours: 8,
};

const DEFAULT_EST: EstacionamientoParams = {
  lambdaPerHour: 10,
  capacidad: 6,
  sMinMin: 10,
  sMaxMin: 30,
  cierreHours: 8,
};

export default function ServiceSystemsModule() {
  const [kind, setKind] = useState<Kind>('serie');

  const [serie, setSerie] = useState<SerieParams>({ ...DEFAULT_SERIE });
  const [banco, setBanco] = useState<BancoParams>({ ...DEFAULT_BANCO });
  const [est, setEst] = useState<EstacionamientoParams>({ ...DEFAULT_EST });

  const [result, setResult] = useState<SimulationOutput | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useMemo(() => {
    if (kind === 'serie')
      return {
        btn: 'bg-indigo-600 hover:bg-indigo-700',
        ring: 'focus:ring-indigo-500',
        pill: 'border-indigo-500 bg-indigo-50 text-indigo-700',
      };
    if (kind === 'banco')
      return {
        btn: 'bg-green-600 hover:bg-green-700',
        ring: 'focus:ring-green-500',
        pill: 'border-green-500 bg-green-50 text-green-700',
      };
    return {
      btn: 'bg-orange-600 hover:bg-orange-700',
      ring: 'focus:ring-orange-500',
      pill: 'border-orange-500 bg-orange-50 text-orange-700',
    };
  }, [kind]);

  const validate = (): string | null => {
    if (kind === 'serie') {
      if (serie.lambdaPerHour <= 0) return 'Lambda debe ser > 0';
      if (serie.mu1MeanMin <= 0) return 'Media S1 debe ser > 0';
      if (serie.s2MaxMin <= serie.s2MinMin) return 'S2 max debe ser > S2 min';
      if (serie.cierreHours <= 0) return 'Cierre (horas) debe ser > 0';
    }
    if (kind === 'banco') {
      if (banco.lambdaPerHour <= 0) return 'Lambda debe ser > 0';
      if (banco.numeroCajeros < 1) return 'Cajeros debe ser >= 1';
      if (banco.sMaxMin <= banco.sMinMin) return 'Servicio max debe ser > min';
      if (banco.cierreHours <= 0) return 'Cierre (horas) debe ser > 0';
    }
    if (kind === 'estacionamiento') {
      if (est.lambdaPerHour <= 0) return 'Lambda debe ser > 0';
      if (est.capacidad < 1) return 'Capacidad debe ser >= 1';
      if (est.sMaxMin <= est.sMinMin) return 'Duración max debe ser > min';
      if (est.cierreHours <= 0) return 'Cierre (horas) debe ser > 0';
    }
    return null;
  };

  const run = () => {
    setError(null);
    const e = validate();
    if (e) return setError(e);

    setIsSimulating(true);
    setTimeout(() => {
      if (kind === 'serie') setResult(runSerie(serie));
      if (kind === 'banco') setResult(runBanco(banco));
      if (kind === 'estacionamiento') setResult(runEstacionamiento(est));
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Card de título (sin banner para evitar doble panel) */}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel de parámetros */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Seleccionar Sistema</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600">Serie / Banco / Estacionamiento</p>

            <div className="grid grid-cols-1 gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setKind('serie');
                  setResult(null);
                }}
                className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                  kind === 'serie' ? theme.pill : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Serie</div>
                <div className="text-xs text-gray-500">2 estaciones (Exp + Uniforme)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKind('banco');
                  setResult(null);
                }}
                className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                  kind === 'banco' ? theme.pill : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Banco</div>
                <div className="text-xs text-gray-500">N cajeros, servicio uniforme</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKind('estacionamiento');
                  setResult(null);
                }}
                className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                  kind === 'estacionamiento' ? theme.pill : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Estacionamiento</div>
                <div className="text-xs text-gray-500">Capacidad finita (sin cola)</div>
              </button>
              <hr className="my-4" />
              <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Parámetros de Sistema de Servicio</h3>
              </div>
            </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-4">
              {kind === 'serie' && (
                <>
                  <Field
                    label="Lambda (clientes/hora)"
                    value={serie.lambdaPerHour}
                    onChange={(v) => setSerie((p) => ({ ...p, lambdaPerHour: v }))}
                    ring={theme.ring}
                  />
                  <Field
                    label="Media S1 Exp (min)"
                    value={serie.mu1MeanMin}
                    onChange={(v) => setSerie((p) => ({ ...p, mu1MeanMin: v }))}
                    ring={theme.ring}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="S2 min (min)"
                      value={serie.s2MinMin}
                      onChange={(v) => setSerie((p) => ({ ...p, s2MinMin: v }))}
                      ring={theme.ring}
                    />
                    <Field
                      label="S2 max (min)"
                      value={serie.s2MaxMin}
                      onChange={(v) => setSerie((p) => ({ ...p, s2MaxMin: v }))}
                      ring={theme.ring}
                    />
                  </div>
                  <Field
                    label="Hora de cierre (HORAS)"
                    tooltip="Después del cierre no entran más, pero se atiende lo que ya llegó."
                    value={serie.cierreHours}
                    onChange={(v) => setSerie((p) => ({ ...p, cierreHours: v }))}
                    ring={theme.ring}
                  />
                </>
              )}

              {kind === 'banco' && (
                <>
                  <Field
                    label="Lambda (clientes/hora)"
                    value={banco.lambdaPerHour}
                    onChange={(v) => setBanco((p) => ({ ...p, lambdaPerHour: v }))}
                    ring={theme.ring}
                  />
                  <Field
                    label="Cajeros (N)"
                    value={banco.numeroCajeros}
                    step={1}
                    min={1}
                    integer
                    onChange={(v) => setBanco((p) => ({ ...p, numeroCajeros: Math.max(1, v) }))}
                    ring={theme.ring}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Servicio min (min)"
                      value={banco.sMinMin}
                      onChange={(v) => setBanco((p) => ({ ...p, sMinMin: v }))}
                      ring={theme.ring}
                    />
                    <Field
                      label="Servicio max (min)"
                      value={banco.sMaxMin}
                      onChange={(v) => setBanco((p) => ({ ...p, sMaxMin: v }))}
                      ring={theme.ring}
                    />
                  </div>
                  <Field
                    label="Hora de cierre (HORAS)"
                    value={banco.cierreHours}
                    onChange={(v) => setBanco((p) => ({ ...p, cierreHours: v }))}
                    ring={theme.ring}
                  />
                </>
              )}

              {kind === 'estacionamiento' && (
                <>
                  <Field
                    label="Lambda (vehículos/hora)"
                    value={est.lambdaPerHour}
                    onChange={(v) => setEst((p) => ({ ...p, lambdaPerHour: v }))}
                    ring={theme.ring}
                  />
                  <Field
                    label="Capacidad"
                    value={est.capacidad}
                    step={1}
                    min={1}
                    integer
                    onChange={(v) => setEst((p) => ({ ...p, capacidad: Math.max(1, v) }))}
                    ring={theme.ring}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Duración min (min)"
                      value={est.sMinMin}
                      onChange={(v) => setEst((p) => ({ ...p, sMinMin: v }))}
                      ring={theme.ring}
                    />
                    <Field
                      label="Duración max (min)"
                      value={est.sMaxMin}
                      onChange={(v) => setEst((p) => ({ ...p, sMaxMin: v }))}
                      ring={theme.ring}
                    />
                  </div>
                  <Field
                    label="Hora de cierre (HORAS)"
                    value={est.cierreHours}
                    onChange={(v) => setEst((p) => ({ ...p, cierreHours: v }))}
                    ring={theme.ring}
                  />
                </>
              )}
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
              <p className="text-gray-600">
                Configura los parámetros y ejecuta una simulación para ver los resultados.
              </p>
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

              {result.series?.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-3">Gráfica</h3>
                  <ServiceSystemsChart
                    title={result.kind === 'estacionamiento' ? 'Ocupación vs tiempo' : 'Cola vs tiempo'}
                    series={result.series}
                  />
                </div>
              )}

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

function Field({
  label,
  value,
  onChange,
  tooltip,
  ring,
  step = 0.1,
  min,
  integer = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tooltip?: string;
  ring: string;
  step?: number;
  min?: number;
  integer?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
          </Tooltip>
        )}
      </label>

      <input
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;

          onChange(integer ? Math.trunc(n) : n);
        }}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 ${ring} focus:border-transparent`}
      />
    </div>
  );
}

