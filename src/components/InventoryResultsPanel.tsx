import React from 'react';
import { BarChart } from 'lucide-react';
import type { InventorySimulationSummary } from '../types/inventorySimulation';

type Props = {
  summary: InventorySimulationSummary | null;
  isSimulating: boolean;
};

const InventoryResultsPanel: React.FC<Props> = ({ summary, isSimulating }) => {
  if (isSimulating) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <div className="text-gray-400 mb-4">
          <BarChart className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Simulando...</h3>
        <p className="text-gray-600">Buscando (q, R) óptimos por simulación.</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <div className="text-gray-400 mb-4">
          <BarChart className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin resultados</h3>
        <p className="text-gray-600">Configura parámetros y ejecuta la búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabla de simulación mes a mes - ENCIMA */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">
          Tabla de Simulación - q={summary.mejor.q}, R={summary.mejor.R}
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-blue-50">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-left">Mes</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Inventario Inicial</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Rand(Demanda)</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Demanda Base</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Factor Estacional</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Demanda Ajustada</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Inventario Final</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Faltante</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Rand(Lead Time)</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Pedido</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Llegada Orden Mes</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Inventario Promedio</th>
              </tr>
            </thead>
            <tbody>
              {summary.mejorTabla.map((row) => (
                <tr key={row.mes} className={row.mes % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 px-2 py-2 font-medium">{row.mes}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.inventarioInicial}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.randDemanda.toFixed(5)}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.demandaBase}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.factorEstacional.toFixed(2)}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.demandaAjustada}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.inventarioFinal}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.faltante}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {row.randLeadTime !== null ? row.randLeadTime.toFixed(5) : '-'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.pedido}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {row.llegadaOrdenMes !== null ? row.llegadaOrdenMes : '-'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{row.inventarioPromedio.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resultados del Grid - ABAJO */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart className="w-5 h-5 text-amber-600" />
          Resultados Inventario (R, q)
        </h3>

        <div className="px-3 py-1 rounded bg-amber-50 text-amber-700 text-sm font-medium">
          Óptimo: q = {summary.mejor.q} | R = {summary.mejor.R}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Costo promedio mínimo: <span className="font-semibold">{summary.mejor.costoPromedio.toFixed(2)}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-2">q</th>
              <th className="border px-2 py-2">R</th>
              <th className="border px-2 py-2">Ordenar</th>
              <th className="border px-2 py-2">Inventario</th>
              <th className="border px-2 py-2">Faltante</th>
              <th className="border px-2 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {summary.top.map((row, idx) => {
              const best = row.q === summary.mejor.q && row.R === summary.mejor.R;
              return (
                <tr key={`${row.q}-${row.R}-${idx}`} className={best ? 'bg-amber-50' : ''}>
                  <td className="border px-2 py-2 font-medium">{row.q}</td>
                  <td className="border px-2 py-2 font-medium">{row.R}</td>
                  <td className="border px-2 py-2">{row.costoOrdenarProm.toFixed(2)}</td>
                  <td className="border px-2 py-2">{row.costoInventarioProm.toFixed(2)}</td>
                  <td className="border px-2 py-2">{row.costoFaltanteProm.toFixed(2)}</td>
                  <td className="border px-2 py-2 font-semibold">{row.costoPromedio.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">
        Nota: costo inventario usa h mensual = (20/12) y el inventario promedio mensual (InvIni + InvFinal)/2, igual que Excel.
      </div>
      </div>
    </div>
  );
};

export default InventoryResultsPanel;
