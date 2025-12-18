import React, { useState } from 'react';
import { Clock, Users, Package, Play, BarChart, Truck, Divide, Server, BookOpen, TrendingUp } from 'lucide-react'; // AGREGUE YO
import { DiscreteEventSimulator } from '../utils/eventSimulator';
import Tooltip from './Tooltip';
import { Outlet } from 'react-router-dom';

// Camiones
import TruckQueueSimulationModule from './TruckQueueSimulationModule';
import TruckQueueResultsPanel from './TruckQueueResultsPanel';
import type { TruckQueueSummary } from '../types/truckQueueSimulation';

// Inventario (q,R)
import InventorySimulationModule from './InventorySimulationModule'; // AGREGUE YO
import InventoryResultsPanel from './InventoryResultsPanel'; // AGREGUE YO
import type { InventorySimulationSummary } from '../types/inventorySimulation'; // AGREGUE YO

//Servicios
import ServiceSystemsModule from './ServiceSystemsModule';
import ComposicionModule from './ComposicionModule';


// Nuevas páginas
import { InverseTransform } from '../pages/InverseTransform';
import { MagazineVendor } from '../pages/MagazineVendor';
import { InvestmentProject } from '../pages/InvestmentProject';


const SimulationModule: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<
    | 'queue'
    | 'inventory'
    | 'camiones'
    | 'inventoryRQ'
    | 'service-serie'
    | 'service-banco'
    | 'service-estacionamiento'
    | 'inverse-transform'
    | 'magazine-vendor'
    | 'investment-project'
    | 'composicion'
  >('queue');

  const [queueParams, setQueueParams] = useState({
    arrivalRate: 2,
    serviceRate: 3,
    simulationTime: 100,
  });

  const [inventoryParams, setInventoryParams] = useState({
    demand: 5,
    leadTime: 2,
    orderPoint: 10,
    orderQuantity: 20,
  });

  const [results, setResults] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Camiones
  const [truckSummary, setTruckSummary] = useState<TruckQueueSummary | null>(null);
  const [truckPersonas, setTruckPersonas] = useState<'AUTO' | 3 | 4 | 5 | 6>('AUTO');

  // Inventario (q,R)
  const [inventorySummary, setInventorySummary] = useState<InventorySimulationSummary | null>(null); // AGREGUE YO

  const runQueueSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const simulator = new DiscreteEventSimulator();
      const events = simulator.simulateQueue(
        queueParams.arrivalRate,
        queueParams.serviceRate,
        queueParams.simulationTime
      );
      setResults(events);
      setIsSimulating(false);
    }, 500);
  };

  const runInventorySimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const events: any[] = [];
      let inventory = inventoryParams.orderQuantity;
      let time = 0;

      for (let i = 0; i < 20; i++) {
        time += Math.random() * 2 + 1;
        const demand = Math.floor(Math.random() * inventoryParams.demand) + 1;
        inventory -= demand;

        events.push({
          time: time.toFixed(2),
          type: 'Demanda',
          description: `Demanda de ${demand} unidades`,
          systemState: { inventario: Math.max(inventory, 0) },
        });

        if (inventory <= inventoryParams.orderPoint) {
          events.push({
            time: time.toFixed(2),
            type: 'Orden',
            description: `Orden de ${inventoryParams.orderQuantity} unidades`,
            systemState: { inventario: Math.max(inventory, 0), pendiente: inventoryParams.orderQuantity },
          });

          time += inventoryParams.leadTime;
          inventory += inventoryParams.orderQuantity;

          events.push({
            time: time.toFixed(2),
            type: 'Llegada',
            description: `Llegan ${inventoryParams.orderQuantity} unidades`,
            systemState: { inventario: inventory },
          });
        }
      }

      setResults(events);
      setIsSimulating(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Módulo C: Simulación de Eventos Discretos</h2>
        </div>
        <p className="text-purple-100">
          Ejecuta simulaciones de sistemas reales: colas de espera y gestión de inventarios.
        </p>
      </div>



      {/* Selector de problema */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Seleccionar Problema de Simulación</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedProblem('queue')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'queue'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Líneas de Espera (M/M/1)</h4>
                <p className="text-sm text-gray-600">Sistema de cola con llegadas Poisson</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedProblem('inventory')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'inventory'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Gestión de Inventarios</h4>
                <p className="text-sm text-gray-600">Sistema EOQ estocástico</p>
              </div>
            </div>
          </button>

          {/* Botón camiones */}
          <button
            onClick={() => setSelectedProblem('camiones')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'camiones'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Truck className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Colas de Camiones</h4>
                <p className="text-sm text-gray-600">Descarga nocturna y costos</p>
              </div>
            </div>
          </button>

          {/* Botón inventario (q,R) */}
          <button
            onClick={() => setSelectedProblem('inventoryRQ')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'inventoryRQ'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Inventario (q, R)</h4>
                <p className="text-sm text-gray-600">Búsqueda óptima por simulación</p>
              </div>
            </div>
          </button>

          {/* Servicios - Serie */}
          <button
            onClick={() => setSelectedProblem('service-serie')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'service-serie'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Server className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Servicio: Serie</h4>
                <p className="text-sm text-gray-600">2 estaciones (Exp + Uniforme)</p>
              </div>
            </div>
          </button>

          {/* Servicios - Banco */}
          <button
            onClick={() => setSelectedProblem('service-banco')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'service-banco'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Server className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Servicio: Banco</h4>
                <p className="text-sm text-gray-600">N cajeros, servicio uniforme</p>
              </div>
            </div>
          </button>

          {/* Servicios - Estacionamiento */}
          <button
            onClick={() => setSelectedProblem('service-estacionamiento')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'service-estacionamiento'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Server className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Servicio: Estacionamiento</h4>
                <p className="text-sm text-gray-600">Capacidad finita (sin cola)</p>
              </div>
            </div>
          </button>

          {/* Botón Transformada Inversa */}
          <button
            onClick={() => setSelectedProblem('inverse-transform')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'inverse-transform'
                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Divide className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Transformada Inversa</h4>
                <p className="text-sm text-gray-600">Generación de variables no estándar</p>
              </div>
            </div>
          </button>

          {/* Botón Inventarios (Vendedor de Revistas) */}
          <button
            onClick={() => setSelectedProblem('magazine-vendor')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'magazine-vendor'
                ? 'border-rose-500 bg-rose-50 text-rose-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Inventarios</h4>
                <p className="text-sm text-gray-600">Modelo del vendedor de revistas</p>
              </div>
            </div>
          </button>

          {/* Botón Inversiones */}
          <button
            onClick={() => setSelectedProblem('investment-project')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'investment-project'
                ? 'border-lime-500 bg-lime-50 text-lime-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Inversiones</h4>
                <p className="text-sm text-gray-600">Análisis de riesgo financiero</p>
              </div>
            </div>
          </button>

          {/* Botón Composicion parte 1_5 */}
          <button
            onClick={() => setSelectedProblem('composicion')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedProblem === 'composicion'
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Divide className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-medium">Composición</h4>
                <p className="text-sm text-gray-600">Trapezoidal (f₁,f₂,f₃)</p>
              </div>
            </div>
          </button>



        </div>

      </div>


      {['inverse-transform', 'magazine-vendor', 'investment-project'].includes(selectedProblem) ? (
        <>
          {selectedProblem === 'inverse-transform' && <InverseTransform />}
          {selectedProblem === 'magazine-vendor' && <MagazineVendor />}
          {selectedProblem === 'investment-project' && <InvestmentProject />}
        </>
      ) : ['service-serie','service-banco','service-estacionamiento'].includes(selectedProblem) ? (
        <ServiceSystemsModule
          initialKind={
            selectedProblem === 'service-serie'
              ? 'serie'
              : selectedProblem === 'service-banco'
              ? 'banco'
              : 'estacionamiento'
          }
          showSelector={false}
        />
      ) : selectedProblem === 'composicion' ? (
        <ComposicionModule />
      ) : (
    

      <div className= "grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {selectedProblem === 'queue' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Parámetros de Cola</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Llegadas (λ)
                    <Tooltip content="Número promedio de clientes que llegan por unidad de tiempo">
                      <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={queueParams.arrivalRate}
                    onChange={(e) =>
                      setQueueParams((prev) => ({
                        ...prev,
                        arrivalRate: parseFloat(e.target.value) || 0.1,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Servicio (μ)
                    <Tooltip content="Número promedio de clientes atendidos por unidad de tiempo">
                      <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={queueParams.serviceRate}
                    onChange={(e) =>
                      setQueueParams((prev) => ({
                        ...prev,
                        serviceRate: parseFloat(e.target.value) || 0.1,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo de Simulación</label>
                  <input
                    type="number"
                    min="10"
                    value={queueParams.simulationTime}
                    onChange={(e) =>
                      setQueueParams((prev) => ({
                        ...prev,
                        simulationTime: parseInt(e.target.value) || 10,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={runQueueSimulation}
                disabled={isSimulating}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}</span>
              </button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Teoría M/M/1</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>ρ = λ/μ =</strong>{' '}
                    {(queueParams.arrivalRate / queueParams.serviceRate).toFixed(3)} (Utilización)
                  </p>
                  <p>
                    <strong>L =</strong>{' '}
                    {(queueParams.arrivalRate / (queueParams.serviceRate - queueParams.arrivalRate)).toFixed(3)} (Clientes en sistema)
                  </p>
                  <p>
                    <strong>W =</strong>{' '}
                    {(1 / (queueParams.serviceRate - queueParams.arrivalRate)).toFixed(3)} (Tiempo en sistema)
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedProblem === 'inventory' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5 text-green-600" />
                <span>Parámetros de Inventario</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Demanda Promedio
                    <Tooltip content="Número promedio de unidades demandadas por período">
                      <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryParams.demand}
                    onChange={(e) =>
                      setInventoryParams((prev) => ({
                        ...prev,
                        demand: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo de Entrega</label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryParams.leadTime}
                    onChange={(e) =>
                      setInventoryParams((prev) => ({
                        ...prev,
                        leadTime: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Punto de Reorden</label>
                  <input
                    type="number"
                    min="0"
                    value={inventoryParams.orderPoint}
                    onChange={(e) =>
                      setInventoryParams((prev) => ({
                        ...prev,
                        orderPoint: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Orden</label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryParams.orderQuantity}
                    onChange={(e) =>
                      setInventoryParams((prev) => ({
                        ...prev,
                        orderQuantity: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={runInventorySimulation}
                disabled={isSimulating}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}</span>
              </button>
            </div>
          )}

          {/* Camiones */}
          {selectedProblem === 'camiones' && (
            <TruckQueueSimulationModule
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              onSimulated={(summary, personas) => {
                setTruckSummary(summary);
                setTruckPersonas(personas);
              }}
            />
          )}

          {/* Inventario (q,R) */}
          {selectedProblem === 'inventoryRQ' && (
            <InventorySimulationModule
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              onSimulated={(summary) => setInventorySummary(summary)}
            />
          )}
        </div>

        {/* Panel de resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resultados camiones */}
          {selectedProblem === 'camiones' && (
            <TruckQueueResultsPanel
              summary={truckSummary}
              isSimulating={isSimulating}
              personas={truckPersonas}
            />
          )}

          {/* Resultados Inventario (q,R) */}
          {selectedProblem === 'inventoryRQ' && (
            <InventoryResultsPanel summary={inventorySummary} isSimulating={isSimulating} />
          )}

          {/* Resultados generales (queue/inventory básico) */}
          {selectedProblem !== 'camiones' && selectedProblem !== 'inventoryRQ' && results.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <BarChart className="w-5 h-5 text-purple-600" />
                <span>Cronograma de Eventos</span>
              </h3>

              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {results.slice(0, 20).map((event, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-8 bg-purple-100 text-purple-700 rounded text-sm font-mono flex items-center justify-center">
                          {event.time}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              event.type === 'Llegada' || event.type === 'Demanda'
                                ? 'bg-blue-100 text-blue-800'
                                : event.type === 'Salida'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {event.type}
                          </span>
                          <span className="text-sm text-gray-700">{event.description}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Estado: {JSON.stringify(event.systemState)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {results.length > 20 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Mostrando los primeros 20 eventos de {results.length} total
                </div>
              )}
            </div>
          )}

          {selectedProblem !== 'camiones' && selectedProblem !== 'inventoryRQ' && results.length === 0 && !isSimulating && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
              <p className="text-gray-600">Configura los parámetros y ejecuta una simulación para ver los resultados.</p>
            </div>
          )}
        </div>
      </div> 
)}
    </div>
  );
};

export default SimulationModule;
