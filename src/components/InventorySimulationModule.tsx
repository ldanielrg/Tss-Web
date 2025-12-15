import React, { useState } from 'react';
import { Play, Package } from 'lucide-react';
import type { InventoryGridSearchParams, InventorySimulationSummary } from '../types/inventorySimulation';
import { gridSearchInventory } from '../utils/inventorySimulator';

type Props = {
  onSimulated: (summary: InventorySimulationSummary) => void;
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
};

const InventorySimulationModule: React.FC<Props> = ({ onSimulated, isSimulating, setIsSimulating }) => {
  const [params, setParams] = useState<InventoryGridSearchParams>({
    inventarioInicial: 150,
    costoOrdenar: 100,
    costoMantenerAnual: 20,
    costoFaltante: 50,
    mesesSimulacion: 12,

    // Experimento (ajusta a lo que te pidan)
    qMin: 50,
    qMax: 200,
    qStep: 10,

    rMin: 20,
    rMax: 100,
    rStep: 5,

    corridas: 200, // puedes subir a 500/1000 si tu PC aguanta
  });

  const run = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const summary = gridSearchInventory(params);
      onSimulated(summary);
      setIsSimulating(false);
    }, 50);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
        <Package className="w-5 h-5 text-amber-600" />
        <span>Parámetros - Inventario (R, q)</span>
      </h3>

      {/* Parámetros base (tu tabla) */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Inventario inicial</label>
          <input
            type="number"
            value={params.inventarioInicial}
            onChange={(e) => setParams(prev => ({ ...prev, inventarioInicial: parseInt(e.target.value) || 0 }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Costo ordenar (Bs/orden)</label>
            <input
              type="number"
              value={params.costoOrdenar}
              onChange={(e) => setParams(prev => ({ ...prev, costoOrdenar: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Costo faltante (Bs/unidad)</label>
            <input
              type="number"
              value={params.costoFaltante}
              onChange={(e) => setParams(prev => ({ ...prev, costoFaltante: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Costo mantener (Bs/unidad/año)</label>
            <input
              type="number"
              value={params.costoMantenerAnual}
              onChange={(e) => setParams(prev => ({ ...prev, costoMantenerAnual: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meses simulación</label>
            <input
              type="number"
              min={1}
              value={params.mesesSimulacion}
              onChange={(e) => setParams(prev => ({ ...prev, mesesSimulacion: parseInt(e.target.value) || 12 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Experimento q y R */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Experimento (búsqueda de q y R)</h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">q min</label>
              <input
                type="number"
                value={params.qMin}
                onChange={(e) => setParams(prev => ({ ...prev, qMin: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">q max</label>
              <input
                type="number"
                value={params.qMax}
                onChange={(e) => setParams(prev => ({ ...prev, qMax: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">q paso</label>
              <input
                type="number"
                value={params.qStep}
                onChange={(e) => setParams(prev => ({ ...prev, qStep: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">R min</label>
              <input
                type="number"
                value={params.rMin}
                onChange={(e) => setParams(prev => ({ ...prev, rMin: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">R max</label>
              <input
                type="number"
                value={params.rMax}
                onChange={(e) => setParams(prev => ({ ...prev, rMax: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">R paso</label>
              <input
                type="number"
                value={params.rStep}
                onChange={(e) => setParams(prev => ({ ...prev, rStep: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Corridas (replicaciones)</label>
            <input
              type="number"
              min={1}
              value={params.corridas}
              onChange={(e) => setParams(prev => ({ ...prev, corridas: parseInt(e.target.value) || 1 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      <button
        onClick={run}
        disabled={isSimulating}
        className="w-full mt-6 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <Play className="w-4 h-4" />
        <span>{isSimulating ? 'Simulando...' : 'Buscar (q, R) óptimos'}</span>
      </button>
    </div>
  );
};

export default InventorySimulationModule;
