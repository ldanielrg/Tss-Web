import React, { useState } from 'react';
import { Play, Truck } from 'lucide-react';
import type { TruckQueueParams, TruckQueueSummary } from '../types/truckQueueSimulation';
import { simulateTruckQueue } from '../utils/truckQueueSimulator';

type Props = {
  /** devuelve el resumen al padre para pintarlo donde quiera */
  onSimulated: (summary: TruckQueueSummary, personas: TruckQueueParams['personas']) => void;
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
};

const TruckQueueSimulationModule: React.FC<Props> = ({ onSimulated, isSimulating, setIsSimulating }) => {
  const [params, setParams] = useState<TruckQueueParams>({
    horaInicio: '23:00:00',
    limiteLlegadas: '07:00:00',
    horaBreak: '03:00:00',
    duracionBreak: '00:30:00',
    //nPersonas: 3,
    salarioHora: 25,
    salarioExtraHora: 37.5,
    costoEsperaCamionHora: 100,
    costoOperacionAlmacenHora: 500,
    duracionJornadaHoras: 8,
    nTurnos: 60,
    personas: 'AUTO',
  });

  const promptTime = (label: string, value: string, key: keyof TruckQueueParams) => {
    const t = prompt(`Ingresa ${label} (HH:mm:ss):`, value);
    if (t) setParams(prev => ({ ...prev, [key]: t }));
  };

  const run = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const summary = simulateTruckQueue(params);
      onSimulated(summary, params.personas);
      setIsSimulating(false);
    }, 200);
  };

  return (
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

        {/* ✅ Selección de equipo */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de personas (equipo)
        </label>
        <select
            value={params.personas}
            onChange={(e) =>
            setParams((prev) => ({
                ...prev,
                personas: e.target.value === 'AUTO' ? 'AUTO' : (parseInt(e.target.value, 10) as 3 | 4 | 5 | 6),
            }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
            <option value="AUTO">Seleccionar (3 a 6) empleados</option>
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
              onChange={(e) => setParams(prev => ({ ...prev, salarioHora: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salario Extra/Hora (Bs.)</label>
            <input
              type="number"
              step="0.5"
              value={params.salarioExtraHora}
              onChange={(e) => setParams(prev => ({ ...prev, salarioExtraHora: parseFloat(e.target.value) || 0 }))}
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
              onChange={(e) => setParams(prev => ({ ...prev, costoEsperaCamionHora: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operación almacén/H (Bs.)</label>
            <input
              type="number"
              step="10"
              value={params.costoOperacionAlmacenHora}
              onChange={(e) => setParams(prev => ({ ...prev, costoOperacionAlmacenHora: parseFloat(e.target.value) || 0 }))}
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
              onChange={(e) => setParams(prev => ({ ...prev, duracionJornadaHoras: parseFloat(e.target.value) || 1 }))}
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
              onChange={(e) => setParams(prev => ({ ...prev, nTurnos: parseInt(e.target.value) || 1 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      <button
        onClick={run}
        disabled={isSimulating}
        className="w-full mt-6 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <Play className="w-4 h-4" />
        <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}</span>
      </button>
    </div>
  );
};

export default TruckQueueSimulationModule;
