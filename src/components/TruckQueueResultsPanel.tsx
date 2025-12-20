import React, { useEffect, useMemo, useState } from 'react';
import { BarChart } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type {
  TruckQueueSummary,
  TruckQueueParams,
  TruckTeamSize,
  TruckQueueNightDetail,
} from '../types/truckQueueSimulation';
import { simulateTruckQueueOneNightDetail } from '../utils/truckQueueSimulator';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  summary: TruckQueueSummary | null;
  isSimulating: boolean;
  params?: TruckQueueParams | null;
};

// Convierte "HH:MM:SS" a objeto {hh, mm, ss}
function parseHMS(s: string) {
  const parts = (s || '').split(':');
  const hh = parseInt(parts[0] || '0', 10);
  const mm = parseInt(parts[1] || '0', 10);
  const ss = parseInt(parts[2] || '0', 10);
  return {
    hh: Number.isFinite(hh) ? hh : 0,
    mm: Number.isFinite(mm) ? mm : 0,
    ss: Number.isFinite(ss) ? ss : 0,
  };
}

function minutesToClock(startHHMMSS: string, minutesFromStart: number) {
  const { hh, mm, ss } = parseHMS(startHHMMSS);
  const startSec = hh * 3600 + mm * 60 + ss;
  const totalSec = (startSec + Math.round(minutesFromStart * 60)) % (24 * 3600);
  const H = Math.floor(totalSec / 3600);
  const M = Math.floor((totalSec % 3600) / 60);
  const S = totalSec % 60;
  return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}:${String(S).padStart(2, '0')}`;
}

function minutesToDuration(min: number) {
  const totalSec = Math.max(0, Math.round(min * 60));
  const H = Math.floor(totalSec / 3600);
  const M = Math.floor((totalSec % 3600) / 60);
  const S = totalSec % 60;
  return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}:${String(S).padStart(2, '0')}`;
}

const TruckQueueResultsPanel: React.FC<Props> = ({ summary, isSimulating, params }) => {
  const [teamForTurns, setTeamForTurns] = useState<number>(3);
  const [traceTeam, setTraceTeam] = useState<TruckTeamSize>(3);
  const [nightDetail, setNightDetail] = useState<TruckQueueNightDetail | null>(null);
  const [simulationCounter, setSimulationCounter] = useState<number>(0);

  const teamsToShow = useMemo<TruckTeamSize[]>(() => {
    if (!summary) return [3, 4, 5, 6];

    const ks = Object.keys(summary.porEquipo)
      .map((x) => Number(x))
      .filter((n): n is TruckTeamSize => n === 3 || n === 4 || n === 5 || n === 6)
      .sort((a, b) => a - b);

    return ks.length ? ks : [3, 4, 5, 6];
  }, [summary]);

  const optimalTeam = useMemo(() => {
    if (!summary) return teamsToShow[0];
    return summary.equipoOptimo as TruckTeamSize;
  }, [summary, teamsToShow]);

  useEffect(() => {
    if (!teamsToShow.includes(teamForTurns as TruckTeamSize)) setTeamForTurns(teamsToShow[0]);
  }, [teamsToShow, teamForTurns]);

  useEffect(() => {
    if (!teamsToShow.includes(traceTeam)) setTraceTeam(teamsToShow[0]);
  }, [teamsToShow, traceTeam]);

  useEffect(() => {
    setSimulationCounter(0);
    setNightDetail(null);
  }, [traceTeam]);

  if (isSimulating) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <div className="text-gray-400 mb-4">
          <BarChart className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Simulando...</h3>
        <p className="text-gray-600">Ejecutando simulación de colas de camiones.</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <div className="text-gray-400 mb-4">
          <BarChart className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
        <p className="text-gray-600">Configura parámetros y ejecuta la simulación para ver resultados.</p>
      </div>
    );
  }
  // Gráfico de barras de costos por equipo
  const costos = teamsToShow.map((team) => summary.porEquipo[team].costoTotal);
  const maxCosto = Math.max(...costos);
  const minCosto = Math.min(...costos);
  const padding = (maxCosto - minCosto) * 0.1 || maxCosto * 0.1;

  const chartData = {
    labels: teamsToShow.map((team) => `${team} personas`),
    datasets: [
      {
        label: 'Costo Total (Bs.)',
        data: costos,
        backgroundColor: teamsToShow.map((team) =>
          team === optimalTeam ? 'rgba(249, 115, 22, 0.7)' : 'rgba(59, 130, 246, 0.7)'
        ),
        borderColor: teamsToShow.map((team) =>
          team === optimalTeam ? 'rgb(249, 115, 22)' : 'rgb(59, 130, 246)'
        ),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' as const } },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.max(0, minCosto - padding),
        max: maxCosto + padding,
        ticks: {
          callback: function (value: any) {
            return 'Bs. ' + Number(value).toFixed(2);
          },
        },
      },
    },
  };

  // Paso 6: ahorro vs segundo mejor
  const sortedByCost = [...teamsToShow].sort(
    (a, b) => summary.porEquipo[a].costoTotal - summary.porEquipo[b].costoTotal
  );
  const secondBest = sortedByCost.length > 1 ? sortedByCost[1] : sortedByCost[0];
  const ahorroVsSecond = summary.porEquipo[secondBest].costoTotal - summary.porEquipo[optimalTeam].costoTotal;

  // Paso 5: turnos
  const turns = summary.porTurno ?? {};
  const hasTurns = Object.keys(turns).length > 0;
  const turnsRows = hasTurns ? (turns[teamForTurns] ?? []) : [];
  const k = Math.min(10, turnsRows.length);

  const canRunDetail = !!params;

  const runOneNightDetail = () => {
    if (!params) return;
    const seedBase = (typeof params.seed === 'number' ? params.seed : 12345) >>> 0;
    const newCount = simulationCounter + 1;
    setSimulationCounter(newCount);
    const detail = simulateTruckQueueOneNightDetail(params, traceTeam, seedBase + traceTeam * 1000 + newCount);
    setNightDetail(detail);
  };

  const jornadaEndMin = params ? Math.round(params.duracionJornadaHoras * 60) : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-orange-800">
            Detallada Corrida/Costos (1 noche), segun el tamaño de equipo: {traceTeam} personas
          </h4>
          <span className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded">
            Tabla + ΣW + costos
          </span>
        </div>

        {!canRunDetail ? (
          <div className="bg-white border rounded p-3 text-sm text-gray-700">
            No se recibieron los parámetros todavía. Abre el panel izquierdo (Camiones) para que se carguen.
          </div>
        ) : (
          <>
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
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-orange-300"
              >
                Generar corrida (1 noche)
              </button>
            </div>

            {nightDetail && params && (
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="bg-purple-700 text-white font-semibold text-sm px-3 py-2">
                  TABLA DE SIMULACIÓN PARA {traceTeam} PERSONAS, QUE ESTÁN EN SERVICIO
                </div>

                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="min-w-full text-xs sm:text-sm border-t">
                    <thead className="bg-purple-600 text-white">
                      <tr>
                        <th className="border px-2 py-2">Aleatorio</th>
                        <th className="border px-2 py-2">T/Llegada</th>
                        <th className="border px-2 py-2">TD&apos;Llegada</th>
                        <th className="border px-2 py-2">Ini D&apos; Serv.</th>
                        <th className="border px-2 py-2">Aleatorio</th>
                        <th className="border px-2 py-2">TD&apos; Serv.</th>
                        <th className="border px-2 py-2">Term D&apos; Serv.</th>
                        <th className="border px-2 py-2">OcioD&apos; Pers.</th>
                        <th className="border px-2 py-2">TD&apos; espera Cam.</th>
                        <th className="border px-2 py-2">Log. De Fila</th>
                      </tr>
                    </thead>

                    <tbody>
                      {nightDetail.trace.slice(0, 30).map((r, idx, arr) => {
                        const tLlegMin = r.iaMin ?? r.llegadaMin;
                        const prevFin = idx === 0 ? 0 : arr[idx - 1].finMin;
                        const ocioMin = Math.max(0, r.inicioMin - prevFin);

                        let enSistema = 0;
                        for (let j = 0; j < idx; j++) {
                          if (arr[j].finMin > r.llegadaMin) enSistema++;
                        }
                        const logFila = Math.max(0, enSistema - 1);

                        const tdRand = 'border px-2 py-2 text-center bg-cyan-50 font-mono';
                        const tdDur = 'border px-2 py-2 text-center bg-orange-50 font-mono';
                        const tdTime = 'border px-2 py-2 text-center font-mono';
                        const tdPlain = 'border px-2 py-2 text-center';

                        return (
                          <tr key={r.i} className={r.breakAplicadoAntesDeEste ? 'bg-orange-100/40' : ''}>

                            <td className={tdRand}>{r.rIA == null ? '—' : r.rIA.toFixed(2)}</td>
                    
                            <td className={tdDur}>{minutesToDuration(tLlegMin)}</td>

                            <td className={tdTime}>{minutesToClock(params.horaInicio, r.llegadaMin)}</td>
               
                            <td className={tdTime}>{minutesToClock(params.horaInicio, r.inicioMin)}</td>
                      
                            <td className={tdRand}>{r.rST.toFixed(2)}</td>

                            <td className={tdDur}>{minutesToDuration(r.stMin)}</td>

                            <td className={tdTime}>{minutesToClock(params.horaInicio, r.finMin)}</td>

                   
                            <td className={tdTime}>{minutesToDuration(ocioMin)}</td>
                          
                            <td className={tdTime}>{minutesToDuration(r.esperaMin)}</td>

                          
                            <td className={tdPlain}>{logFila}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-3 py-2 text-xs text-gray-500">
                  Nota: filas sombreadas indican que el break se aplicó antes de iniciar el servicio de ese camión.
                </div>
              </div>
            )}

            {/* Paso 4: costos desde corrida */}
            {nightDetail && params && (
              (() => {
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
                    <h5 className="text-sm font-semibold text-gray-800">Paso 4: Cálculo de costos (desde la corrida)</h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="p-2 bg-gray-50 border rounded">
                        <div className="font-medium">ΣW</div>
                        <div>{minutesToDuration(sumW)}</div>
                      </div>
                      <div className="p-2 bg-gray-50 border rounded">
                        <div className="font-medium">Fin último servicio</div>
                        <div>{minutesToClock(params.horaInicio, lastFinish)}</div>
                      </div>
                      <div className="p-2 bg-gray-50 border rounded">
                        <div className="font-medium">Horas extra</div>
                        <div>{minutesToDuration(extraMin)}</div>
                      </div>
                      <div className="p-2 bg-gray-50 border rounded">
                        <div className="font-medium">Tiempo operación</div>
                        <div>{minutesToDuration(opMin)}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto -mx-3 md:mx-0">
                      <table className="min-w-full text-xs sm:text-sm border mt-2">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border px-2 py-2">Componente</th>
                            <th className="border px-2 py-2">Valor (Bs.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border px-2 py-2 font-medium">Salario normal</td>
                            <td className="border px-2 py-2 text-right">{cSalNorm.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="border px-2 py-2 font-medium">Salario extra</td>
                            <td className="border px-2 py-2 text-right">{cSalExtra.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="border px-2 py-2 font-medium">Espera camión</td>
                            <td className="border px-2 py-2 text-right">{cEspera.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="border px-2 py-2 font-medium">Operación</td>
                            <td className="border px-2 py-2 text-right">{cOper.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="border px-2 py-2 font-semibold">Total</td>
                            <td className="border px-2 py-2 text-right font-semibold">{cTotal.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()
            )}
          </>
        )}
      </div>

      {/*COSTOS PROMEDIO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-600" />
            Costos por Tamaño de Equipo (N = {summary.nTurnos} turnos)
          </h3>
          <div className="px-3 py-1 rounded bg-orange-50 text-orange-700 text-sm font-medium">
            Equipo óptimo: {optimalTeam} personas
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="min-w-full text-xs sm:text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-2">Equipo</th>
                <th className="border px-2 py-2">Sal. normal</th>
                <th className="border px-2 py-2">Sal. extra</th>
                <th className="border px-2 py-2">Espera camión</th>
                <th className="border px-2 py-2">Operación</th>
                <th className="border px-2 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {teamsToShow.map((team) => {
                const c = summary.porEquipo[team];
                const best = team === optimalTeam;
                return (
                  <tr key={team} className={best ? 'bg-orange-50' : ''}>
                    <td className="border px-2 py-2 font-medium">{team}</td>
                    <td className="border px-2 py-2">{c.salarioNormal.toFixed(2)}</td>
                    <td className="border px-2 py-2">{c.salarioExtra.toFixed(2)}</td>
                    <td className="border px-2 py-2">{c.costoEspera.toFixed(2)}</td>
                    <td className="border px-2 py-2">{c.costoOperacion.toFixed(2)}</td>
                    <td className="border px-2 py-2 font-semibold">{c.costoTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Gráfico */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-600" />
            Costos Totales por Tamaño de Equipo
          </h3>

          <div className="w-full h-80 md:h-96 lg:h-[500px]">
            <Bar data={chartData} options={options} />
          </div>
        </div>

        {/* Paso 5 */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-6 space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-600" />
            Paso 5: Resultados por turno (muestras)
          </h3>

          {!hasTurns ? (
            <p className="text-sm text-gray-600">No hay datos por turno disponibles.</p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-3 md:items-end justify-between">
                <div className="w-full md:w-64">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Equipo para ver turnos</label>
                  <select
                    value={teamForTurns}
                    onChange={(e) => setTeamForTurns(parseInt(e.target.value, 10))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {teamsToShow.map((t) => (
                      <option key={t} value={t}>
                        {t} personas
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-gray-500">
                  Mostrando los primeros {k} turnos (de {turnsRows.length}).
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full text-xs sm:text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-2 py-2">Turno</th>
                      <th className="border px-2 py-2">Camiones</th>
                      <th className="border px-2 py-2">ΣW (h)</th>
                      <th className="border px-2 py-2">Extra (h)</th>
                      <th className="border px-2 py-2">Operación (h)</th>
                      <th className="border px-2 py-2">Costo total (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnsRows.slice(0, k).map((r, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-2 text-center">{idx + 1}</td>
                        <td className="border px-2 py-2 text-center">{r.camionesServidos}</td>
                        <td className="border px-2 py-2 text-center">{(r.esperaTotalMin / 60).toFixed(2)}</td>
                        <td className="border px-2 py-2 text-center">{(r.tiempoExtraMin / 60).toFixed(2)}</td>
                        <td className="border px-2 py-2 text-center">{(r.operacionMin / 60).toFixed(2)}</td>
                        <td className="border px-2 py-2 text-right font-semibold">{r.costoTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-6 space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-600" />
            Detalle del equipo mas óptimo
          </h3>

          <p className="text-sm text-gray-700">
            El equipo óptimo es <strong>{optimalTeam} personas</strong> porque tiene el{' '}
            <strong>menor costo total promedio</strong>.
          </p>

          <p className="text-sm text-gray-700">
            Comparado con el segundo mejor ({secondBest} personas), el ahorro promedio es aproximadamente{' '}
            <strong>Bs. {ahorroVsSecond.toFixed(2)}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TruckQueueResultsPanel;
