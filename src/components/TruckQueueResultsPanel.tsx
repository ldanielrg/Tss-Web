import React, { useEffect, useMemo, useState } from 'react';
import { BarChart } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { TruckQueueSummary } from '../types/truckQueueSimulation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  summary: TruckQueueSummary | null;
  isSimulating: boolean;
};

const TruckQueueResultsPanel: React.FC<Props> = ({ summary, isSimulating }) => {
  // ✅ HOOKS SIEMPRE ARRIBA (sin returns antes)
  const [teamForTurns, setTeamForTurns] = useState<number>(3);

  const teamsToShow = useMemo(() => {
    if (!summary) return [3, 4, 5, 6]; // fallback estable
    return Object.keys(summary.porEquipo).map(Number).sort((a, b) => a - b);
  }, [summary]);

  const optimalTeam = useMemo(() => {
    if (!summary) return teamsToShow[0];
    return summary.equipoOptimo;
  }, [summary, teamsToShow]);

  useEffect(() => {
    // Mantener teamForTurns válido aunque cambie summary/equipos disponibles
    if (!teamsToShow.includes(teamForTurns)) {
      setTeamForTurns(teamsToShow[0]);
    }
  }, [teamsToShow, teamForTurns]);

  // ✅ Ahora sí: returns condicionales (después de hooks)
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

  // =========================
  // Ya existe summary desde aquí
  // =========================
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      {/* Tabla de costos promedio */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          Costos por Tamaño de Equipo (N = {summary.nTurnos} turnos)
        </h3>

        <div className="px-3 py-1 rounded bg-orange-50 text-orange-700 text-sm font-medium">
          Equipo óptimo: {optimalTeam} personas
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
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

      {/* Paso 5: Turnos */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipo para ver turnos</label>
                <select
                  value={teamForTurns}
                  onChange={(e) => setTeamForTurns(parseInt(e.target.value, 10))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
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

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm border">
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

            {summary.stats?.[teamForTurns] && (
              <div className="text-sm text-gray-700">
                <div>
                  <strong>Promedio (costo total):</strong> Bs. {summary.porEquipo[teamForTurns].costoTotal.toFixed(2)}
                </div>
                <div>
                  <strong>Desv. estándar:</strong> Bs. {summary.stats[teamForTurns].stdCostoTotal.toFixed(2)}
                </div>
                <div>
                  <strong>IC 95% aprox:</strong> [Bs. {summary.stats[teamForTurns].ci95Low.toFixed(2)} , Bs.{' '}
                  {summary.stats[teamForTurns].ci95High.toFixed(2)}]
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Paso 6: Decisión */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-6 space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          Paso 6: Selección del equipo óptimo
        </h3>

        <p className="text-sm text-gray-700">
          El equipo óptimo es <strong>{optimalTeam} personas</strong> porque tiene el <strong>menor costo total promedio</strong>.
        </p>

        <p className="text-sm text-gray-700">
          Comparado con el segundo mejor ({secondBest} personas), el ahorro promedio es aproximadamente{' '}
          <strong>Bs. {ahorroVsSecond.toFixed(2)}</strong>.
        </p>

        <div className="text-xs text-gray-500">
          Nota: con más turnos (N mayor) el promedio se estabiliza y el intervalo de confianza se hace más estrecho.
        </div>
      </div>
    </div>
  );
};

export default TruckQueueResultsPanel;
