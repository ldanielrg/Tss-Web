import React, { useMemo, useState } from 'react';
import { Truck, Settings, Play, Info, RefreshCcw, X } from 'lucide-react';
import TruckCostChart from './TruckCostChart';
import type { DistributionRow, TruckSimulationParams, TruckSimulationResult } from '../utils/truckSimulator';
import { runTruckSimulation } from '../utils/truckSimulator';

//pagina para integrar con las demas
const DEFAULT_PARAMS: TruckSimulationParams = {
  numSimulaciones: 1000,
  diasTrabajo: 250,
  costoCamion: 100000,
  costoExternoTon: 100,
  maxCamiones: 30,
};

const DEFAULT_PRODUCCION: DistributionRow[] = [
  { p: 0.10, min: 50, max: 55 },
  { p: 0.25, min: 55, max: 60 },
  { p: 0.55, min: 60, max: 65 },
  { p: 0.90, min: 65, max: 70 },
  { p: 0.98, min: 75, max: 80 },
  { p: 1.0, min: 80, max: 85 },
];

const DEFAULT_CAPACIDAD: DistributionRow[] = [
  { p: 0.30, min: 4.0, max: 4.5 },
  { p: 0.70, min: 4.5, max: 5.0 },
  { p: 0.90, min: 5.0, max: 5.5 },
  { p: 1.0, min: 5.5, max: 6.0 },
];

const moneyFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const num2 = (n: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n);
const num4 = (n: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 }).format(n);

function cloneDist(d: DistributionRow[]) {
  return d.map((x) => ({ ...x }));
}

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
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100"
            aria-label="Cerrar"
            type="button"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
        // scroll
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}


function DistTable({
  title,
  value,
  onChange,
}: {
  title: string;
  value: DistributionRow[];
  onChange: (next: DistributionRow[]) => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <button
          type="button"
          onClick={() => onChange([...value, { p: 1, min: 0, max: 0 }])}
          className="rounded-md bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-800"
        >
          + fila
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="border p-2">Prob. acum.</th>
              <th className="border p-2">Mín</th>
              <th className="border p-2">Máx</th>
              <th className="border p-2"></th>
            </tr>
          </thead>
          <tbody>
            {value.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2">
                  <input
                    className="w-28 rounded-md border px-2 py-1"
                    type="number"
                    step="0.01"
                    value={row.p}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      const next = value.map((r, i) => (i === idx ? { ...r, p } : r));
                      onChange(next);
                    }}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-28 rounded-md border px-2 py-1"
                    type="number"
                    step="0.01"
                    value={row.min}
                    onChange={(e) => {
                      const min = Number(e.target.value);
                      const next = value.map((r, i) => (i === idx ? { ...r, min } : r));
                      onChange(next);
                    }}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-28 rounded-md border px-2 py-1"
                    type="number"
                    step="0.01"
                    value={row.max}
                    onChange={(e) => {
                      const max = Number(e.target.value);
                      const next = value.map((r, i) => (i === idx ? { ...r, max } : r));
                      onChange(next);
                    }}
                  />
                </td>
                <td className="border p-2">
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== idx))}
                    className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                    title="Eliminar fila"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {value.length === 0 && (
              <tr>
                <td className="border p-2 text-gray-500" colSpan={4}>
                  Sin filas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        Nota: en el modelo original las probabilidades son acumuladas y se compara con R (0..1).
      </p>
    </div>
  );
}

const TruckCompositionModule: React.FC = () => {
  const [params, setParams] = useState<TruckSimulationParams>({ ...DEFAULT_PARAMS });
  const [produccionDist, setProduccionDist] = useState<DistributionRow[]>(cloneDist(DEFAULT_PRODUCCION));
  const [capacidadDist, setCapacidadDist] = useState<DistributionRow[]>(cloneDist(DEFAULT_CAPACIDAD));

  const [result, setResult] = useState<TruckSimulationResult | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decisionText = useMemo(() => {
    if (!result) return null;
    return `🚛 El número óptimo de camiones es: ${result.bestCamiones} (Costo esperado = ${moneyFmt.format(
      result.bestCosto
    )})`;
  }, [result]);

  function validarDistribucion(dist: DistributionRow[]): string | null {
    if (dist.length === 0) return 'La distribución no puede estar vacía.';
    let prev = 0;
    for (let i = 0; i < dist.length; i++) {
      const { p, min, max } = dist[i];
      if (!Number.isFinite(p) || !Number.isFinite(min) || !Number.isFinite(max)) return 'Hay valores inválidos.';
      if (p <= 0 || p > 1) return 'Las probabilidades acumuladas deben estar en (0, 1].';
      if (p < prev) return 'Las probabilidades acumuladas deben ser no-decrecientes.';
      if (min > max) return 'En algún rango: min > max.';
      prev = p;
    }
    if (Math.abs(dist[dist.length - 1].p - 1) > 1e-9) return 'La última probabilidad acumulada debería ser 1.';
    return null;
  }

  function ejecutar() {
    setError(null);

    if (params.numSimulaciones <= 0 || params.diasTrabajo <= 0 || params.maxCamiones <= 0) {
      setError('Revisa: numSimulaciones, diasTrabajo y maxCamiones deben ser > 0.');
      return;
    }
    const e1 = validarDistribucion(produccionDist);
    if (e1) return setError(`Distribución de producción: ${e1}`);
    const e2 = validarDistribucion(capacidadDist);
    if (e2) return setError(`Distribución de capacidad: ${e2}`);

    const r = runTruckSimulation(params, produccionDist, capacidadDist);
    setResult(r);
  }

  React.useEffect(() => {
    ejecutar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-900 p-3 text-white">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Método de composición: optimización de camiones</h2>
              <p className="text-gray-600">
                Simulación Monte Carlo para estimar el costo total esperado por número de camiones.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Configurar
            </button>
            <button
              type="button"
              onClick={ejecutar}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
            >
              <Play className="h-4 w-4" />
              Ejecutar
            </button>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Info className="h-4 w-4" />
              Info
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {decisionText && <div className="rounded-lg bg-blue-50 p-3 text-blue-900">{decisionText}</div>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold">Tabla 1: primeras 20 iteraciones (1 camión)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border p-2">Iter</th>
                  <th className="border p-2">R1 Prod</th>
                  <th className="border p-2">Producción</th>
                  <th className="border p-2">R2 Cap</th>
                  <th className="border p-2">Capacidad</th>
                  <th className="border p-2">Excedente</th>
                  <th className="border p-2">Costo ext. día</th>
                </tr>
              </thead>
              <tbody>
                {result?.sample?.map((r) => (
                  <tr key={r.iteracion}>
                    <td className="border p-2">{r.iteracion}</td>
                    <td className="border p-2">{num4(r.r1Prod)}</td>
                    <td className="border p-2">{num2(r.produccion)}</td>
                    <td className="border p-2">{num4(r.r2Capacidad)}</td>
                    <td className="border p-2">{num2(r.capacidadCamion)}</td>
                    <td className="border p-2">{num2(r.excedente)}</td>
                    <td className="border p-2">{num2(r.costoExternoDia)}</td>
                  </tr>
                ))}
                {!result && (
                  <tr>
                    <td colSpan={7} className="border p-3 text-gray-500">
                      Sin resultados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold">Gráfica</h3>
          {result ? <TruckCostChart summary={result.summary} /> : <p className="text-gray-500">Sin datos.</p>}
          <p className="mt-3 text-sm text-gray-600">
            Cada punto es el costo total esperado: costo fijo (camiones) + costo externo esperado anual.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold">Tabla 2: costos promedio por número de camiones</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="border p-2">Camiones</th>
                <th className="border p-2">Costo camiones</th>
                <th className="border p-2">Costo externo promedio</th>
                <th className="border p-2">Costo total promedio</th>
              </tr>
            </thead>
            <tbody>
              {result?.summary?.map((r) => (
                <tr key={r.camiones}>
                  <td className="border p-2">{r.camiones}</td>
                  <td className="border p-2">{moneyFmt.format(r.costoCamiones)}</td>
                  <td className="border p-2">{moneyFmt.format(r.costoExternoProm)}</td>
                  <td className="border p-2 font-medium">{moneyFmt.format(r.costoTotalProm)}</td>
                </tr>
              ))}
              {!result && (
                <tr>
                  <td colSpan={4} className="border p-3 text-gray-500">
                    Sin resultados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInfo && (
        <Modal title="Información del problema" onClose={() => setShowInfo(false)}>
          <div className="space-y-3 text-sm leading-6 text-gray-800">
            <p>
              <strong>Objetivo:</strong> determinar el número óptimo de camiones para minimizar el costo total
              (compra de camiones + subcontratación por excedente).
            </p>
            <p>
              <strong>Variables aleatorias:</strong>
              <br />• Producción diaria (toneladas) según distribución por intervalos.
              <br />• Capacidad por camión (toneladas) según distribución por intervalos.
            </p>
            <p>
              <strong>Cálculos:</strong>
              <br />• Capacidad total = capacidadCamión × númeroCamiones
              <br />• Excedente = max(0, producción − capacidadTotal)
              <br />• Costo externo día = excedente × costoExternoTon
              <br />• Costo externo anual esperado = promedio(costo externo día) × díasTrabajo
              <br />• Costo total esperado = costo camiones + costo externo anual esperado
            </p>
            <p className="text-gray-600">
              Interpretación: pocos camiones ⇒ alto costo externo; muchos camiones ⇒ alto costo fijo. El óptimo
              balancea ambos.
            </p>
          </div>
        </Modal>
      )}

      {showConfig && (
        <Modal title="Configuración de parámetros" onClose={() => setShowConfig(false)}>
          <ConfigPanel
            initialParams={params}
            initialProduccion={produccionDist}
            initialCapacidad={capacidadDist}
            onCancel={() => setShowConfig(false)}
            onSave={(nextParams, nextProd, nextCap) => {
              setParams(nextParams);
              setProduccionDist(nextProd);
              setCapacidadDist(nextCap);
              setShowConfig(false);
            }}
            onReset={() => {
              setParams({ ...DEFAULT_PARAMS });
              setProduccionDist(cloneDist(DEFAULT_PRODUCCION));
              setCapacidadDist(cloneDist(DEFAULT_CAPACIDAD));
            }}
          />
        </Modal>
      )}
    </div>
  );
};

function ConfigPanel({
  initialParams,
  initialProduccion,
  initialCapacidad,
  onCancel,
  onSave,
  onReset,
}: {
  initialParams: TruckSimulationParams;
  initialProduccion: DistributionRow[];
  initialCapacidad: DistributionRow[];
  onCancel: () => void;
  onSave: (p: TruckSimulationParams, prod: DistributionRow[], cap: DistributionRow[]) => void;
  onReset: () => void;
}) {
  const [p, setP] = useState<TruckSimulationParams>({ ...initialParams });
  const [prod, setProd] = useState<DistributionRow[]>(cloneDist(initialProduccion));
  const [cap, setCap] = useState<DistributionRow[]>(cloneDist(initialCapacidad));
  const [seedEnabled, setSeedEnabled] = useState(Boolean(initialParams.seed));
  const [localError, setLocalError] = useState<string | null>(null);

  function guardar() {
    setLocalError(null);

    const validNums =
      Number.isFinite(p.numSimulaciones) &&
      Number.isFinite(p.diasTrabajo) &&
      Number.isFinite(p.costoCamion) &&
      Number.isFinite(p.costoExternoTon) &&
      Number.isFinite(p.maxCamiones);

    if (!validNums) return setLocalError('Hay parámetros inválidos.');
    if (p.numSimulaciones <= 0 || p.diasTrabajo <= 0 || p.maxCamiones <= 0) {
      return setLocalError('numSimulaciones, diasTrabajo y maxCamiones deben ser > 0.');
    }

    const next = { ...p };
    if (!seedEnabled) delete (next as any).seed;
    onSave(next, prod, cap);
  }

  return (
    <div className="space-y-6">
      {localError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{localError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <h4 className="mb-3 font-medium">Parámetros básicos</h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-gray-700">N° simulaciones</span>
              <input
                className="mt-1 w-full rounded-md border px-2 py-1"
                type="number"
                value={p.numSimulaciones}
                onChange={(e) => setP((s) => ({ ...s, numSimulaciones: Number(e.target.value) }))}
              />
            </label>

            <label className="text-sm">
              <span className="text-gray-700">Días trabajo / año</span>
              <input
                className="mt-1 w-full rounded-md border px-2 py-1"
                type="number"
                value={p.diasTrabajo}
                onChange={(e) => setP((s) => ({ ...s, diasTrabajo: Number(e.target.value) }))}
              />
            </label>

            <label className="text-sm">
              <span className="text-gray-700">Costo por camión</span>
              <input
                className="mt-1 w-full rounded-md border px-2 py-1"
                type="number"
                value={p.costoCamion}
                onChange={(e) => setP((s) => ({ ...s, costoCamion: Number(e.target.value) }))}
              />
            </label>

            <label className="text-sm">
              <span className="text-gray-700">Costo externo por tonelada</span>
              <input
                className="mt-1 w-full rounded-md border px-2 py-1"
                type="number"
                value={p.costoExternoTon}
                onChange={(e) => setP((s) => ({ ...s, costoExternoTon: Number(e.target.value) }))}
              />
            </label>

            <label className="text-sm">
              <span className="text-gray-700">Máximo camiones</span>
              <input
                className="mt-1 w-full rounded-md border px-2 py-1"
                type="number"
                value={p.maxCamiones}
                onChange={(e) => setP((s) => ({ ...s, maxCamiones: Number(e.target.value) }))}
              />
            </label>

            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Semilla (opcional)</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={seedEnabled}
                    onChange={(e) => setSeedEnabled(e.target.checked)}
                  />
                  <span className="text-xs text-gray-600">usar</span>
                </label>
              </div>
              <input
                className="mt-1 w-full rounded-md border px-2 py-1 disabled:bg-gray-50"
                type="number"
                disabled={!seedEnabled}
                value={p.seed ?? 123}
                onChange={(e) => setP((s) => ({ ...s, seed: Number(e.target.value) }))}
              />
              <p className="mt-1 text-xs text-gray-500">Si activas semilla, obtendrás resultados repetibles.</p>
            </div>
          </div>

          <div className="mt-3 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
            <p>
              <strong>Tip:</strong> si subes maxCamiones mucho y numSimulaciones también, la simulación puede tardar
              más (es maxCamiones × numSimulaciones iteraciones).
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <DistTable title="Distribución de producción diaria (ton)" value={prod} onChange={setProd} />
          <DistTable title="Distribución de capacidad por camión (ton)" value={cap} onChange={setCap} />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Valores por defecto
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export default TruckCompositionModule;
