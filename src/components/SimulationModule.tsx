import React, { useState } from 'react';
import { Clock, Users, Package, Play, BarChart, Truck } from 'lucide-react';
import { DiscreteEventSimulator } from '../utils/eventSimulator';
import Tooltip from './Tooltip';

const SimulationModule: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<'queue' | 'inventory' | 'camiones'>('queue');
  const [queueParams, setQueueParams] = useState({
    arrivalRate: 2,
    serviceRate: 3,
    simulationTime: 100
  });
  
  const [inventoryParams, setInventoryParams] = useState({
    demand: 5,
    leadTime: 2,
    orderPoint: 10,
    orderQuantity: 20
  });
  
  const [truckParams, setTruckParams] = useState({
    horaInicio: '23:00:00',
    limiteLlegadas: '07:00:00',
    horaBreak: '03:00:00',
    duracionBreak: '00:30:00',
    personas: 3,
    salarioHora: 25.0,
    salarioExtraHora: 37.5,
    costoEsperaCamionHora: 100.0,
    costoOperacionAlmacenHora: 500.0,
    duracionJornadaHoras: 8
  });

  const [results, setResults] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

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
    
    // Simulación básica de inventarios
    setTimeout(() => {
      const events = [];
      let inventory = inventoryParams.orderQuantity;
      let time = 0;
      
      // Generar eventos de demanda
      for (let i = 0; i < 20; i++) {
        time += Math.random() * 2 + 1; // Tiempo entre demandas
        const demand = Math.floor(Math.random() * inventoryParams.demand) + 1;
        inventory -= demand;
        
        events.push({
          time: time.toFixed(2),
          type: 'Demanda',
          description: `Demanda de ${demand} unidades`,
          systemState: { inventario: Math.max(inventory, 0) }
        });

        // Revisar si necesita reordenar
        if (inventory <= inventoryParams.orderPoint) {
          events.push({
            time: time.toFixed(2),
            type: 'Orden',
            description: `Orden de ${inventoryParams.orderQuantity} unidades`,
            systemState: { inventario: Math.max(inventory, 0), pendiente: inventoryParams.orderQuantity }
          });
          
          // Llegada de la orden
          time += inventoryParams.leadTime;
          inventory += inventoryParams.orderQuantity;
          
          events.push({
            time: time.toFixed(2),
            type: 'Llegada',
            description: `Llegan ${inventoryParams.orderQuantity} unidades`,
            systemState: { inventario: inventory }
          });
        }
      }
      
      setResults(events);
      setIsSimulating(false);
    }, 500);
  };

  // Simulación básica CAMIONES ####  BORRAR ESTO Y PONERLO EN OTRO LADO####
  const runTruckSimulation = () => {
    setIsSimulating(true);
    
    // Simulación básica de colas de camiones
    setTimeout(() => {
      const events = [];
      let time = 0;
      
      // Generar eventos de llegada de camiones
      for (let i = 0; i < 15; i++) {
        time += Math.random() * 0.5 + 0.2; // Tiempo entre llegadas
        const tiempoEspera = Math.random() * 2;
        
        events.push({
          time: time.toFixed(2),
          type: 'Llegada',
          description: `Camión ${i + 1} llega al almacén`,
          systemState: { camionesPendientes: Math.max(15 - i, 0), personas: truckParams.personas }
        });
        
        time += tiempoEspera;
        events.push({
          time: time.toFixed(2),
          type: 'Descarga',
          description: `Camión ${i + 1} siendo descargado`,
          systemState: { camionesPendientes: Math.max(14 - i, 0) }
        });
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
        <div className="grid md:grid-cols-3 gap-4">
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
                <h4 className="font-medium">Sistema de Colas Camiones</h4>
                <p className="text-sm text-gray-600">Simulación de despacho de vehículos</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel de configuración */}
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
                    onChange={(e) => setQueueParams(prev => ({
                      ...prev,
                      arrivalRate: parseFloat(e.target.value) || 0.1
                    }))}
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
                    onChange={(e) => setQueueParams(prev => ({
                      ...prev,
                      serviceRate: parseFloat(e.target.value) || 0.1
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo de Simulación
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={queueParams.simulationTime}
                    onChange={(e) => setQueueParams(prev => ({
                      ...prev,
                      simulationTime: parseInt(e.target.value) || 10
                    }))}
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

              {/* Información teórica */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Teoría M/M/1</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>ρ = λ/μ =</strong> {(queueParams.arrivalRate / queueParams.serviceRate).toFixed(3)} (Utilización)</p>
                  <p><strong>L =</strong> {(queueParams.arrivalRate / (queueParams.serviceRate - queueParams.arrivalRate)).toFixed(3)} (Clientes en sistema)</p>
                  <p><strong>W =</strong> {(1 / (queueParams.serviceRate - queueParams.arrivalRate)).toFixed(3)} (Tiempo en sistema)</p>
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
                    onChange={(e) => setInventoryParams(prev => ({
                      ...prev,
                      demand: parseInt(e.target.value) || 1
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo de Entrega
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryParams.leadTime}
                    onChange={(e) => setInventoryParams(prev => ({
                      ...prev,
                      leadTime: parseInt(e.target.value) || 1
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Punto de Reorden
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inventoryParams.orderPoint}
                    onChange={(e) => setInventoryParams(prev => ({
                      ...prev,
                      orderPoint: parseInt(e.target.value) || 0
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de Orden
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryParams.orderQuantity}
                    onChange={(e) => setInventoryParams(prev => ({
                      ...prev,
                      orderQuantity: parseInt(e.target.value) || 1
                    }))}
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

          {selectedProblem === 'camiones' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-orange-600" />
                <span>Parámetros de Simulacion - Camiones</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Inicio (p.m.)
                  </label>
                  <input
                    type="text"
                    value={truckParams.horaInicio }
                    placeholder="HH:mm:ss"
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 cursor-pointer"
                    onClick={() => {
                      const time = prompt('Ingresa la hora (HH:mm):', truckParams.horaInicio);
                      if (time) setTruckParams(prev => ({ ...prev, horaInicio: time }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de Llegadas (a.m.)
                  </label>
                  <input
                    type="text"
                    value={truckParams.limiteLlegadas}
                    placeholder="HH:mm:ss"
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 cursor-pointer"
                    onClick={() => {
                      const time = prompt('Ingresa la hora (HH:mm):', truckParams.limiteLlegadas);
                      if (time) setTruckParams(prev => ({ ...prev, limiteLlegadas: time }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Break (a.m.)
                  </label>
                  <input
                    type="text"
                    value={truckParams.horaBreak }
                    placeholder="HH:mm:ss"
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 cursor-pointer"
                    onClick={() => {
                      const time = prompt('Ingresa la hora (HH:mm):', truckParams.horaBreak);
                      if (time) setTruckParams(prev => ({ ...prev, horaBreak: time }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración de Break (min.)
                  </label>
                  <input
                    type="text"
                    value={truckParams.duracionBreak }
                    placeholder="HH:mm:ss"
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 cursor-pointer"
                    onClick={() => {
                      const time = prompt('Ingresa la duración (HH:mm):', truckParams.duracionBreak);
                      if (time) setTruckParams(prev => ({ ...prev, duracionBreak: time }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personas (3-6)
                  </label>
                  <select
                    value={truckParams.personas}
                    onChange={(e) => setTruckParams(prev => ({
                      ...prev,
                      personas: parseInt(e.target.value)
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value={3}>3 personas</option>
                    <option value={4}>4 personas</option>
                    <option value={5}>5 personas</option>
                    <option value={6}>6 personas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario por Hora (Bs.)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={truckParams.salarioHora}
                    onChange={(e) => setTruckParams(prev => ({
                      ...prev,
                      salarioHora: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario Hora Extra (Bs.)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={truckParams.salarioExtraHora}
                    onChange={(e) => setTruckParams(prev => ({
                      ...prev,
                      salarioExtraHora: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Espera Camión/Hora (Bs.)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={truckParams.costoEsperaCamionHora}
                    onChange={(e) => setTruckParams(prev => ({
                      ...prev,
                      costoEsperaCamionHora: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Operación Almacén/Hora (Bs.)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={truckParams.costoOperacionAlmacenHora}
                    onChange={(e) => setTruckParams(prev => ({
                      ...prev,
                      costoOperacionAlmacenHora: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración Jornada (Horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={truckParams.duracionJornadaHoras}
                    onChange={(e) => setTruckParams(prev => ({
                      ...prev,
                      duracionJornadaHoras: parseFloat(e.target.value) || 1
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={runTruckSimulation}
                disabled={isSimulating}
                className="w-full mt-6 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Panel de resultados */}
        <div className="lg:col-span-2 space-y-6">
          {results.length > 0 && (
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
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            event.type === 'Llegada' || event.type === 'Demanda' 
                              ? 'bg-blue-100 text-blue-800' 
                              : event.type === 'Salida' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {event.type}
                          </span>
                          <span className="text-sm text-gray-700">{event.description}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Estado: {JSON.stringify(event.systemState)}
                        </div>
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

          {results.length === 0 && !isSimulating && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
              <p className="text-gray-600">
                Configura los parámetros y ejecuta una simulación para ver los resultados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationModule;