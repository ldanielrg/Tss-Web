import React from 'react';
import { BarChart } from 'lucide-react';
import type { TruckQueueSummary } from '../types/truckQueueSimulation';

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          Resultados Camiones (N = {summary.nTurnos})
        </h3>

        <div className="px-3 py-1 rounded bg-orange-50 text-orange-700 text-sm font-medium">
          Equipo óptimo: {summary.equipoOptimo} personas
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
            {[3, 4, 5, 6].map((team) => {
              const c = summary.porEquipo[team];
              const best = team === summary.equipoOptimo;

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
    </div>
  );
};

export default TruckQueueResultsPanel;
