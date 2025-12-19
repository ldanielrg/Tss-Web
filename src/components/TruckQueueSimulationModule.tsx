// src/components/TruckQueueSimulationModule.tsx
// (Paso 4 incluido dentro del Paso 3: cálculo de costos desde la tabla)

import React, { useEffect, useMemo, useState } from 'react';
import { Play, Truck } from 'lucide-react';
import type {
  TruckQueueParams,
  TruckQueueSummary,
  TruckTeamSize,
  TruckQueueNightDetail,
} from '../types/truckQueueSimulation';
import {
  simulateTruckQueue,
  simulateTruckQueueOneNightDetail,
  INIT_DIST,
  IA_DIST,
  SERVICE_DIST,
  buildDistRows,
} from '../utils/truckQueueSimulator';
import TruckQueueStepOnePanel from './TruckQueueStepOnePanel';

type Props = {
  onSimulated: (summary: TruckQueueSummary) => void;
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
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

function parseHHMM(s: string) {
  const [hh, mm] = s.split(':').map((x) => parseInt(x, 10));
  return { hh: hh || 0, mm: mm || 0 };
}
function minutesToClock(startHHMMSS: string, minutesFromStart: number) {
  const { hh, mm } = parseHHMM(startHHMMSS);
  const start = hh * 60 + mm;
  const total = (start + minutesFromStart) % (24 * 60);
  const H = Math.floor(total / 60);
  const M = total % 60;
  return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`;
}

const TruckQueueSimulationModule: React.FC<Props> = ({ onSimulated, isSimulating, setIsSimulating }) => {
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

  const teamsToShow: TruckTeamSize[] = useMemo(
    () => (params.personas === 'AUTO' ? [3, 4, 5, 6] : [params.personas]),
    [params.personas]
  );

  // Paso 3/4 (detalle 1 noche)
  const [traceTeam, setTraceTeam] = useState<TruckTeamSize>(3);
  const [nightDetail, setNightDetail] = useState<TruckQueueNightDetail | null>(null);

  useEffect(() => {
    if (!teamsToShow.includes(traceTeam)) setTraceTeam(teamsToShow[0]);
  }, [teamsToShow, traceTeam]);

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

  const runOneNightDetail = () => {
    const seedBase = (typeof params.seed === 'number' ? params.seed : 12345) >>> 0;
    const detail = simulateTruckQueueOneNightDetail(params, traceTeam, seedBase + traceTeam * 1000);
    setNightDetail(detail);
  };

  const jornadaEndMin = Math.round(params.duracionJornadaHoras * 60);

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

      {/* PASO 3 + PASO 4 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-orange-800">Paso 3 y 4: Corrida detallada + cálculo de costos (1 noche)</h4>
          <span className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded">
            Tabla + ΣW + costos
          </span>
        </div>

        <div className="bg-white rounded-lg border p-3 flex flex-col md:flex-row gap-3 items-start md:items-end justify-between">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipo para ver detalle</label>
            <select
              value={traceTeam}
              onChange={(e) => setTraceTeam(parseInt(e.target.value, 10) as TruckTeamSize)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {teamsToShow.map((t) => (
                <option key={t} value={t}>
                  {t} personas
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">Usa “Seed” para repetir la misma corrida.</div>
          </div>

          <button
            onClick={runOneNightDetail}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Generar corrida (1 noche)
          </button>
        </div>

        {nightDetail && (
          <>
            {/* Tabla por camión */}
            <div className="bg-white rounded-lg border p-3">
              <h5 className="text-sm font-semibold text-gray-800 mb-2">Tabla de simulación (primeros 30 camiones)</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs md:text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-2 py-2">i</th>
                      <th className="border px-2 py-2">R_IA</th>
                      <th className="border px-2 py-2">IA</th>
                      <th className="border px-2 py-2">Aᵢ</th>
                      <th className="border px-2 py-2">Aᵢ (hora)</th>
                      <th className="border px-2 py-2">R_ST</th>
                      <th className="border px-2 py-2">ST</th>
                      <th className="border px-2 py-2">Sᵢ</th>
                      <th className="border px-2 py-2">Dᵢ</th>
                      <th className="border px-2 py-2">Wᵢ</th>
                      <th className="border px-2 py-2">Break</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nightDetail.trace.slice(0, 30).map((r) => (
                      <tr key={r.i} className={r.breakAplicadoAntesDeEste ? 'bg-orange-50' : ''}>
                        <td className="border px-2 py-2 text-center">{r.i}</td>
                        <td className="border px-2 py-2 text-center font-mono">{r.rIA == null ? '—' : r.rIA.toFixed(4)}</td>
                        <td className="border px-2 py-2 text-center">{r.iaMin ?? '—'}</td>
                        <td className="border px-2 py-2 text-center">{r.llegadaMin}</td>
                        <td className="border px-2 py-2 text-center">{minutesToClock(params.horaInicio, r.llegadaMin)}</td>
                        <td className="border px-2 py-2 text-center font-mono">{r.rST.toFixed(4)}</td>
                        <td className="border px-2 py-2 text-center">{r.stMin}</td>
                        <td className="border px-2 py-2 text-center">{r.inicioMin}</td>
                        <td className="border px-2 py-2 text-center">{r.finMin}</td>
                        <td className="border px-2 py-2 text-center">{r.esperaMin}</td>
                        <td className="border px-2 py-2 text-center">{r.breakAplicadoAntesDeEste ? 'Sí' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                Filas en naranja: el break se aplicó antes de iniciar el servicio de ese camión.
              </div>
            </div>

            {/* PASO 4: cálculo de costos desde la corrida */}
            {(() => {
              const sumW = nightDetail.trace.reduce((a, r) => a + r.esperaMin, 0);
              const lastFinish = nightDetail.trace.reduce((m, r) => Math.max(m, r.finMin), 0);
              const opMin = Math.max(jornadaEndMin, lastFinish);
              const extraMin = Math.max(0, lastFinish - jornadaEndMin);

              const cSalNorm = traceTeam * params.duracionJornadaHoras * params.salarioHora;
              const cSalExtra = traceTeam * (extraMin / 60) * params.salarioExtraHora;
              const cEspera = (sumW / 60) * params.costoEsperaCamionHora;
              const cOper = (opMin / 60) * params.costoOperacionAlmacenHora;
              const cTotal = cSalNorm + cSalExtra + cEspera + cOper;

              return (
                <div className="bg-white rounded-lg border p-3 space-y-2">
                  <h5 className="text-sm font-semibold text-gray-800">Paso 4: Cálculo de costos (desde la tabla)</h5>

                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-gray-50 border rounded">
                      <div className="font-medium">ΣW (min)</div>
                      <div>{sumW} min = {(sumW / 60).toFixed(2)} h</div>
                    </div>
                    <div className="p-2 bg-gray-50 border rounded">
                      <div className="font-medium">FinÚltimo (min)</div>
                      <div>
                        {lastFinish} min ({minutesToClock(params.horaInicio, lastFinish)})
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 border rounded">
                      <div className="font-medium">Fin jornada normal</div>
                      <div>{jornadaEndMin} min ({minutesToClock(params.horaInicio, jornadaEndMin)})</div>
                    </div>
                    <div className="p-2 bg-gray-50 border rounded">
                      <div className="font-medium">Horas extra</div>
                      <div>{extraMin} min = {(extraMin / 60).toFixed(2)} h</div>
                    </div>
                    <div className="p-2 bg-gray-50 border rounded">
                      <div className="font-medium">Tiempo operación</div>
                      <div>{opMin} min = {(opMin / 60).toFixed(2)} h</div>
                    </div>
                    <div className="p-2 bg-gray-50 border rounded">
                      <div className="font-medium">Break</div>
                      <div>
                        {nightDetail.breakBeginMin == null
                          ? 'No se aplicó'
                          : `${minutesToClock(params.horaInicio, nightDetail.breakBeginMin)} – ${minutesToClock(
                              params.horaInicio,
                              nightDetail.breakEndMin!
                            )}`}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs md:text-sm border mt-2">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border px-2 py-2">Componente</th>
                          <th className="border px-2 py-2">Fórmula</th>
                          <th className="border px-2 py-2">Valor (Bs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border px-2 py-2 font-medium">Salario normal</td>
                          <td className="border px-2 py-2 font-mono">
                            n·salarioHora·H = {traceTeam}·{params.salarioHora}·{params.duracionJornadaHoras}
                          </td>
                          <td className="border px-2 py-2 text-right">{cSalNorm.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border px-2 py-2 font-medium">Salario extra</td>
                          <td className="border px-2 py-2 font-mono">
                            n·salExtra·(extraMin/60) = {traceTeam}·{params.salarioExtraHora}·({extraMin}/60)
                          </td>
                          <td className="border px-2 py-2 text-right">{cSalExtra.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border px-2 py-2 font-medium">Espera camión</td>
                          <td className="border px-2 py-2 font-mono">
                            cEspera·(ΣW/60) = {params.costoEsperaCamionHora}·({sumW}/60)
                          </td>
                          <td className="border px-2 py-2 text-right">{cEspera.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border px-2 py-2 font-medium">Operación</td>
                          <td className="border px-2 py-2 font-mono">
                            cOper·(opMin/60) = {params.costoOperacionAlmacenHora}·({opMin}/60)
                          </td>
                          <td className="border px-2 py-2 text-right">{cOper.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border px-2 py-2 font-semibold">Total</td>
                          <td className="border px-2 py-2 font-mono">Suma</td>
                          <td className="border px-2 py-2 text-right font-semibold">{cTotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-xs text-gray-500">
                    Este total coincide con el costo total calculado por el simulador para esta noche.
                  </div>
                </div>
              );
            })()}
          </>
        )}
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
