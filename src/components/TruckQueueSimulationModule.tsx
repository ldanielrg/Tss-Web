// src/components/TruckQueueSimulationModule.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Play, Truck } from 'lucide-react';
import type { TruckQueueParams, TruckQueueSummary, TruckTeamSize } from '../types/truckQueueSimulation';
import { simulateTruckQueue, INIT_DIST, IA_DIST, SERVICE_DIST, buildDistRows } from '../utils/truckQueueSimulator';
import TruckQueueStepOnePanel from './TruckQueueStepOnePanel';

type Props = {
  onSimulated: (summary: TruckQueueSummary) => void;
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;

  /** ✅ NUEVO: para mandar params al padre (panel derecho) */
  onParamsChange?: (params: TruckQueueParams) => void;
};

const DistTable: React.FC<{
  title: string;
  unit: string;
  valueLabel: string;
  rows: ReturnType<typeof buildDistRows>;
}> = ({ title, unit, valueLabel, rows }) => {
  return (
    <div className="bg-white rounded-lg border p-3">
      <h5 className="text-sm font-semibold text-gray-800 mb-2">{title}</h5>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-2">i</th>
              <th className="border px-2 py-2">
                {valueLabel} ({unit})
              </th>
              <th className="border px-2 py-2">P(x)</th>
              <th className="border px-2 py-2">F(x)</th>
              <th className="border px-2 py-2">Intervalo de R</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.i}>
                <td className="border px-2 py-2 text-center">{r.i}</td>
                <td className="border px-2 py-2 text-center font-medium">{r.x}</td>
                <td className="border px-2 py-2 text-center">{r.p.toFixed(2)}</td>
                <td className="border px-2 py-2 text-center">{r.F.toFixed(2)}</td>
                <td className="border px-2 py-2 text-center font-mono">{r.interval}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Regla: generar <strong>R ∈ [0,1)</strong> y elegir el primer valor donde <strong>R &lt; F(x)</strong>.
      </p>
    </div>
  );
};

const TruckQueueSimulationModule: React.FC<Props> = ({
  onSimulated,
  isSimulating,
  setIsSimulating,
  onParamsChange,
}) => {
  const [params, setParams] = useState<TruckQueueParams>({
    horaInicio: '23:00:00',
    limiteLlegadas: '07:00:00',
    horaBreak: '03:00:00',
    duracionBreak: '00:30:00',
    salarioHora: 25,
    salarioExtraHora: 37.5,
    costoEsperaCamionHora: 100,
    costoOperacionAlmacenHora: 500,
    duracionJornadaHoras: 8,
    nTurnos: 60,
    personas: 'AUTO',
    seed: undefined,
  });

  // ✅ Empujar params al padre (para que el panel derecho pueda usarlo)
  useEffect(() => {
    onParamsChange?.(params);
  }, [params, onParamsChange]);

  const teamsToShow: TruckTeamSize[] = useMemo(
    () => (params.personas === 'AUTO' ? [3, 4, 5, 6] : [params.personas]),
    [params.personas]
  );

  const promptTime = (label: string, value: string, key: keyof TruckQueueParams) => {
    const t = prompt(`Ingresa ${label} (HH:mm:ss):`, value);
    if (t) setParams((prev) => ({ ...prev, [key]: t }));
  };

  const run = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const summary = simulateTruckQueue(params);
      onSimulated(summary);
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-4">
      {/* PASO 1 */}
      <TruckQueueStepOnePanel params={params} />

      {/* PASO 2 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-orange-800">Paso 2: Distribuciones y Transformada Inversa</h4>
          <span className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded">
            Tablas + acumuladas
          </span>
        </div>

        <DistTable title="(2.1) Camiones iniciales al abrir" unit={INIT_DIST.unit} valueLabel="N0" rows={buildDistRows(INIT_DIST)} />
        <DistTable title="(2.2) Tiempo entre llegadas" unit={IA_DIST.unit} valueLabel="ΔA" rows={buildDistRows(IA_DIST)} />

        <div className="bg-white rounded-lg border p-3">
          <h5 className="text-sm font-semibold text-gray-800 mb-1">(2.3) Tiempo de servicio según equipo</h5>
          <p className="text-xs text-gray-600">Se usa la tabla del tamaño de equipo.</p>
        </div>

        {teamsToShow.map((t) => (
          <DistTable
            key={t}
            title={SERVICE_DIST[t].label}
            unit={SERVICE_DIST[t].unit}
            valueLabel="ST"
            rows={buildDistRows(SERVICE_DIST[t])}
          />
        ))}
      </div>

      {/* Panel de inputs + botón simular N turnos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Truck className="w-5 h-5 text-orange-600" />
          <span>Parámetros de Simulación - Colas de Camiones</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Inicio</label>
            <input
              type="text"
              value={params.horaInicio}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-pointer"
              onClick={() => promptTime('Hora Inicio', params.horaInicio, 'horaInicio')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Límite de Llegadas</label>
            <input
              type="text"
              value={params.limiteLlegadas}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-pointer"
              onClick={() => promptTime('Límite de Llegadas', params.limiteLlegadas, 'limiteLlegadas')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Break</label>
            <input
              type="text"
              value={params.horaBreak}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-pointer"
              onClick={() => promptTime('Hora Break', params.horaBreak, 'horaBreak')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duración Break (HH:mm:ss)</label>
            <input
              type="text"
              value={params.duracionBreak}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-pointer"
              onClick={() => promptTime('Duración Break', params.duracionBreak, 'duracionBreak')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número de personas (equipo)</label>
            <select
              value={params.personas}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  personas: e.target.value === 'AUTO' ? 'AUTO' : (parseInt(e.target.value, 10) as TruckTeamSize),
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="AUTO">AUTO (comparar 3,4,5,6)</option>
              <option value="3">3 personas</option>
              <option value="4">4 personas</option>
              <option value="5">5 personas</option>
              <option value="6">6 personas</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salario/Hora (Bs.)</label>
              <input
                type="number"
                step="0.5"
                value={params.salarioHora}
                onChange={(e) => setParams((prev) => ({ ...prev, salarioHora: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salario Extra/Hora (Bs.)</label>
              <input
                type="number"
                step="0.5"
                value={params.salarioExtraHora}
                onChange={(e) => setParams((prev) => ({ ...prev, salarioExtraHora: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Espera camión/H (Bs.)</label>
              <input
                type="number"
                step="10"
                value={params.costoEsperaCamionHora}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, costoEsperaCamionHora: parseFloat(e.target.value) || 0 }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operación almacén/H (Bs.)</label>
              <input
                type="number"
                step="10"
                value={params.costoOperacionAlmacenHora}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, costoOperacionAlmacenHora: parseFloat(e.target.value) || 0 }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jornada (horas)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={params.duracionJornadaHoras}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, duracionJornadaHoras: parseFloat(e.target.value) || 1 }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Turnos (N)</label>
              <input
                type="number"
                step="1"
                min="1"
                value={params.nTurnos}
                onChange={(e) => setParams((prev) => ({ ...prev, nTurnos: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seed (opcional)</label>
            <input
              type="number"
              value={params.seed ?? ''}
              placeholder="Ej: 12345"
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  seed: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={isSimulating}
          className="w-full mt-6 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación (N turnos)'}</span>
        </button>
      </div>
    </div>
  );
};

export default TruckQueueSimulationModule;
