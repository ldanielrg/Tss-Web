// src/components/ServiceSystemsModule.tsx
import React, { useMemo, useState } from 'react';
import { Settings, Play, Info, Network, Building2, CarFront, RefreshCcw } from 'lucide-react';
import Tooltip from './Tooltip';
import ServiceSystemsChart from './ServiceSystemsChart';
import type {
  SystemKind,
  SerieParams,
  BancoParams,
  EstacionamientoParams,
  SimulationOutput,
} from '../utils/serviceSystemsSimulator';
import { runSerie, runBanco, runEstacionamiento } from '../utils/serviceSystemsSimulator';

/** Defaults */
const DEFAULT_SERIE: SerieParams = {
  lambdaPerHour: 20,
  mu1MeanMin: 2,
  s2MinMin: 1,
  s2MaxMin: 2,
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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100" type="button">
            <span aria-hidden>✕</span>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

const num2 = (n: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n);

export default function ServiceSystemsModule() {
  const [kind, setKind] = useState<SystemKind>('serie');

  const [serie, setSerie] = useState<SerieParams>({ ...DEFAULT_SERIE });
  const [banco, setBanco] = useState<BancoParams>({ ...DEFAULT_BANCO });
  const [est, setEst] = useState<EstacionamientoParams>({ ...DEFAULT_EST });

  const [result, setResult] = useState<SimulationOutput | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const header = useMemo(() => {
    if (kind === 'serie') return { icon: <Network className="h-6 w-6" />, title: 'Sistema en serie (2 estaciones)' };
    if (kind === 'banco') return { icon: <Building2 className="h-6 w-6" />, title: 'Banco (N cajeros)' };
    return { icon: <CarFront className="h-6 w-6" />, title: 'Estacionamiento (capacidad C)' };
  }, [kind]);

  function validar(): string | null {
    if (kind === 'serie') {
      if (serie.lambdaPerHour <= 0) return 'λ debe ser > 0.';
      if (serie.mu1MeanMin <= 0) return 'Media S1 debe ser > 0.';
      if (serie.s2MaxMin <= serie.s2MinMin) return 'S2 max debe ser > S2 min.';
      if (serie.cierreHours <= 0) return 'Cierre (h) debe ser > 0.';
    }
    if (kind === 'banco') {
      if (banco.lambdaPerHour <= 0) return 'λ debe ser > 0.';
      if (banco.numeroCajeros <= 0) return 'Cajeros debe ser >= 1.';
      if (banco.sMaxMin <= banco.sMinMin) return 'Servicio max debe ser > servicio min.';
      if (banco.cierreHours <= 0) return 'Cierre (h) debe ser > 0.';
    }
    if (kind === 'estacionamiento') {
      if (est.lambdaPerHour <= 0) return 'λ debe ser > 0.';
      if (est.capacidad <= 0) return 'Capacidad debe ser >= 1.';
      if (est.sMaxMin <= est.sMinMin) return 'Duración max debe ser > duración min.';
      if (est.cierreHours <= 0) return 'Cierre (h) debe ser > 0.';
    }
    return null;
  }

  function ejecutar() {
    setError(null);
    const e = validar();
    if (e) return setError(e);

    if (kind === 'serie') setResult(runSerie(serie));
    if (kind === 'banco') setResult(runBanco(banco));
    if (kind === 'estacionamiento') setResult(runEstacionamiento(est));
  }

  React.useEffect(() => {
    ejecutar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sampleRows = result?.rows?.slice(0, 20) ?? [];
  const more = result ? Math.max(0, result.rows.length - sampleRows.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header card (igual estilo a TruckCompositionModule) */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-900 p-3 text-white">{header.icon}</div>
            <div>
              <h2 className="text-xl font-semibold">Simulación aplicada: colas y servicios</h2>
              <p className="text-gray-600">
                3 ejercicios: Serie / Banco / Estacionamiento. Tiempo final reportado en horas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" /> Configurar
            </button>
            <button
              type="button"
              onClick={ejecutar}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
            >
              <Play className="h-4 w-4" /> Ejecutar
            </button>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Info className="h-4 w-4" /> Info
            </button>
          </div>
        </div>

        {/* Selector (3 botones) */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-lg border px-3 py-2 text-sm ${kind === 'serie' ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
            onClick={() => setKind('serie')}
            type="button"
          >
            Serie
          </button>
          <button
            className={`rounded-lg border px-3 py-2 text-sm ${kind === 'banco' ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'}`}
            onClick={() => setKind('banco')}
            type="button"
          >
            Banco
          </button>
          <button
            className={`rounded-lg border px-3 py-2 text-sm ${kind === 'estacionamiento' ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50'}`}
            onClick={() => setKind('estacionamiento')}
            type="button"
          >
            Estacionamiento
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}
      </div>

      {/* Resultados: tabla separada de métricas + gráfica */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tabla 1 (muestra) */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold">
            Tabla 1: muestra del proceso (primeras 20 filas)
            <Tooltip content="Se muestran las primeras 20 filas como en tus programas Java, pero los datos completos quedan en memoria.">
              <span className="ml-2 text-gray-400 cursor-help">ⓘ</span>
            </Tooltip>
          </h3>

          {!result ? (
            <p className="text-gray-500">Sin resultados todavía.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {result.columns.map((c) => (
                        <th key={c} className="border p-2">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, idx) => (
                      <tr key={idx}>
                        {row.map((cell, j) => (
                          <td key={j} className="border p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                    {result.rows.length === 0 && (
                      <tr>
                        <td className="border p-3 text-gray-500" colSpan={result.columns.length}>
                          Sin filas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {more > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  . ({more} registros más) .
                </div>
              )}
            </>
          )}
        </div>

        {/* Gráfica */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold">Gráfica</h3>
          {!result || result.series.length === 0 ? (
            <p className="text-gray-500">Sin datos.</p>
          ) : (
            <ServiceSystemsChart
              title={
                result.kind === 'estacionamiento'
                  ? 'Ocupación vs tiempo'
                  : 'Longitud de cola vs tiempo'
              }
              series={result.series[0]}
            />
          )}
          <p className="mt-3 text-sm text-gray-600">
            Eje X en horas. Puedes cambiar λ, servicio y hora de cierre desde Configurar.
          </p>
        </div>
      </div>

      {/* Métricas separadas (como pediste) */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold">Resultados (métricas)</h3>
        {!result ? (
          <p className="text-gray-500">Sin resultados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border p-2">Métrica</th>
                  <th className="border p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.metrics).map(([k, v]) => (
                  <tr key={k}>
                    <td className="border p-2 font-medium">{k}</td>
                    <td className="border p-2">{typeof v === 'number' ? num2(v) : String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INFO modal */}
      {showInfo && (
        <Modal title="Información del problema" onClose={() => setShowInfo(false)}>
          <div className="space-y-3 text-sm leading-6 text-gray-800">
            {kind === 'serie' && (
              <>
                <p><strong>Sistema en serie:</strong> 2 estaciones en secuencia. Llegadas Poisson, S1 Exp(media), S2 Uniforme.</p>
                <p><strong>Cierre:</strong> después del cierre no entran más clientes, pero el sistema atiende la cola hasta vaciar.</p>
              </>
            )}
            {kind === 'banco' && (
              <>
                <p><strong>Banco:</strong> 1 cola FCFS y N cajeros. Llegadas Poisson, servicio Uniforme.</p>
                <p>La tabla replica las columnas del muestreo del Java (pero en horas).</p>
              </>
            )}
            {kind === 'estacionamiento' && (
              <>
                <p><strong>Estacionamiento:</strong> capacidad C. Si llega y está lleno, se pierde (sin cola).</p>
                <p>Métricas: P(lleno), P(disponible), ⟨ocupados⟩ y perdidos (%).</p>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIG modal */}
      {showConfig && (
        <Modal title="Configuración de parámetros" onClose={() => setShowConfig(false)}>
          <ConfigPanel
            kind={kind}
            serie={serie}
            banco={banco}
            est={est}
            onChangeSerie={setSerie}
            onChangeBanco={setBanco}
            onChangeEst={setEst}
            onReset={() => {
              setSerie({ ...DEFAULT_SERIE });
              setBanco({ ...DEFAULT_BANCO });
              setEst({ ...DEFAULT_EST });
            }}
            onClose={() => setShowConfig(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function ConfigPanel({
  kind,
  serie,
  banco,
  est,
  onChangeSerie,
  onChangeBanco,
  onChangeEst,
  onReset,
  onClose,
}: {
  kind: SystemKind;
  serie: SerieParams;
  banco: BancoParams;
  est: EstacionamientoParams;
  onChangeSerie: (p: SerieParams) => void;
  onChangeBanco: (p: BancoParams) => void;
  onChangeEst: (p: EstacionamientoParams) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [seedEnabled, setSeedEnabled] = useState<boolean>(
    kind === 'serie' ? Boolean(serie.seed) : kind === 'banco' ? Boolean(banco.seed) : Boolean(est.seed)
  );

  const setSeed = (val?: number) => {
    if (kind === 'serie') onChangeSerie({ ...serie, seed: val });
    if (kind === 'banco') onChangeBanco({ ...banco, seed: val });
    if (kind === 'estacionamiento') onChangeEst({ ...est, seed: val });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          <strong>Nota:</strong> el cierre está en <strong>HORAS</strong>. Servicios siguen en minutos (como Java), pero la salida se muestra en horas.
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" /> Valores por defecto
        </button>
      </div>

      {kind === 'serie' && (
        <div className="rounded-lg border p-3 space-y-3">
          <h4 className="font-medium">Serie</h4>

          <label className="text-sm block">
            λ (clientes/hora)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={serie.lambdaPerHour}
              onChange={(e) => onChangeSerie({ ...serie, lambdaPerHour: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm block">
            Media S1 Exp (min)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={serie.mu1MeanMin}
              onChange={(e) => onChangeSerie({ ...serie, mu1MeanMin: Number(e.target.value) })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm block">
              S2 min (min)
              <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
                value={serie.s2MinMin}
                onChange={(e) => onChangeSerie({ ...serie, s2MinMin: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm block">
              S2 max (min)
              <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
                value={serie.s2MaxMin}
                onChange={(e) => onChangeSerie({ ...serie, s2MaxMin: Number(e.target.value) })}
              />
            </label>
          </div>

          <label className="text-sm block">
            Hora de cierre (h)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={serie.cierreHours}
              onChange={(e) => onChangeSerie({ ...serie, cierreHours: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      {kind === 'banco' && (
        <div className="rounded-lg border p-3 space-y-3">
          <h4 className="font-medium">Banco</h4>

          <label className="text-sm block">
            λ (clientes/hora)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={banco.lambdaPerHour}
              onChange={(e) => onChangeBanco({ ...banco, lambdaPerHour: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm block">
            Cajeros (N)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={banco.numeroCajeros}
              onChange={(e) => onChangeBanco({ ...banco, numeroCajeros: Math.max(1, Number(e.target.value)) })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm block">
              Servicio min (min)
              <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
                value={banco.sMinMin}
                onChange={(e) => onChangeBanco({ ...banco, sMinMin: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm block">
              Servicio max (min)
              <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
                value={banco.sMaxMin}
                onChange={(e) => onChangeBanco({ ...banco, sMaxMin: Number(e.target.value) })}
              />
            </label>
          </div>

          <label className="text-sm block">
            Hora de cierre (h)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={banco.cierreHours}
              onChange={(e) => onChangeBanco({ ...banco, cierreHours: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      {kind === 'estacionamiento' && (
        <div className="rounded-lg border p-3 space-y-3">
          <h4 className="font-medium">Estacionamiento</h4>

          <label className="text-sm block">
            λ (vehículos/hora)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={est.lambdaPerHour}
              onChange={(e) => onChangeEst({ ...est, lambdaPerHour: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm block">
            Capacidad (C)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={est.capacidad}
              onChange={(e) => onChangeEst({ ...est, capacidad: Math.max(1, Number(e.target.value)) })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm block">
              Duración min (min)
              <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
                value={est.sMinMin}
                onChange={(e) => onChangeEst({ ...est, sMinMin: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm block">
              Duración max (min)
              <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
                value={est.sMaxMin}
                onChange={(e) => onChangeEst({ ...est, sMaxMin: Number(e.target.value) })}
              />
            </label>
          </div>

          <label className="text-sm block">
            Hora de cierre (h)
            <input className="mt-1 w-full rounded-md border px-2 py-1" type="number"
              value={est.cierreHours}
              onChange={(e) => onChangeEst({ ...est, cierreHours: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Semilla (opcional)</span>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={seedEnabled} onChange={(e) => {
              setSeedEnabled(e.target.checked);
              if (!e.target.checked) setSeed(undefined);
            }} />
            <span className="text-xs text-gray-600">usar</span>
          </label>
        </div>

        <input
          className="w-full rounded-md border px-2 py-1 disabled:bg-gray-50"
          type="number"
          disabled={!seedEnabled}
          value={
            (kind === 'serie' ? (serie.seed ?? 123) : kind === 'banco' ? (banco.seed ?? 123) : (est.seed ?? 123))
          }
          onChange={(e) => setSeed(Number(e.target.value))}
        />
        <p className="text-xs text-gray-500">Si activas semilla, obtendrás resultados repetibles.</p>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50" type="button">
          Cerrar
        </button>
      </div>
    </div>
  );
}
