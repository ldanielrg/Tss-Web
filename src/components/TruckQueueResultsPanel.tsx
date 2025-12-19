import React from 'react';
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

  const teamsToShow = Object.keys(summary.porEquipo).map(Number).sort((a, b) => a - b);
  const optimalTeam = summary.equipoOptimo;

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
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: false },
    },
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
        title: { display: true, text: 'Monto en Bs.' },
      },
      x: { title: { display: true, text: 'Equipos' } },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
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

      <div className="text-xs text-gray-500">
        Nota: “Espera camión” es el costo por tiempo total de espera acumulado (promedio si N &gt; 1).
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          Costos Totales por Tamaño de Equipo
        </h3>

        <div className="w-full h-80 md:h-96 lg:h-[500px]">
          <Bar data={chartData} options={options} />
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          Métricas de Desempeño por Equipo
        </h3>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs md:text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-1 md:px-2 py-2">Equipo</th>
                <th className="border px-1 md:px-2 py-2">Camiones Atendidos</th>
                <th className="border px-1 md:px-2 py-2">Tiempo Total Espera (h)</th>
                <th className="border px-1 md:px-2 py-2">Tiempo Extra (h)</th>
                <th className="border px-1 md:px-2 py-2">Tiempo Operación (h)</th>
              </tr>
            </thead>
            <tbody>
              {teamsToShow.map((team) => {
                const m = summary.porEquipo[team];
                const best = team === optimalTeam;

                return (
                  <tr key={team} className={best ? 'bg-orange-50' : ''}>
                    <td className="border px-1 md:px-2 py-2 font-medium text-center">{team}</td>
                    <td className="border px-1 md:px-2 py-2 text-center">{Math.floor(m.camionesServidos)}</td>
                    <td className="border px-1 md:px-2 py-2 text-center">{(m.esperaTotalMin / 60).toFixed(2)} h</td>
                    <td className="border px-1 md:px-2 py-2 text-center">{(m.tiempoExtraMin / 60).toFixed(2)} h</td>
                    <td className="border px-1 md:px-2 py-2 text-center">{(m.operacionMin / 60).toFixed(2)} h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          Nota: La fila resaltada corresponde al equipo óptimo ({optimalTeam} personas).
        </div>
      </div>
    </div>
  );
};

export default TruckQueueResultsPanel;
