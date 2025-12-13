import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Calculator, BookOpen, Clock, Github } from 'lucide-react';

import ConceptualModule from './components/ConceptualModule';
import GeneratorModule from './components/GeneratorModule';
import SimulationModule from './components/SimulationModule';

// NUEVO: Parte 1 (Tkinter -> Web) en ruta aparte
import Parte1Layout from './simulstat_parte1/pages/Parte1Layout';
import Parte1Home from './simulstat_parte1/pages/Parte1Home.tsx';
import Opcion1 from './simulstat_parte1/pages/Opcion1.tsx';
import Opcion2 from './simulstat_parte1/pages/Opcion2.tsx';
import Opcion3 from './simulstat_parte1/pages/Opcion3.tsx';
import Opcion4 from './simulstat_parte1/pages/Opcion4.tsx';

function HomeTabs() {
  const [activeModule, setActiveModule] = useState<'concepts' | 'generator' | 'simulation'>('concepts');

  const modules = [
    {
      id: 'concepts' as const,
      name: 'Módulo A: Conceptos',
      icon: <BookOpen className="w-5 h-5" />,
      description: 'Fundamentos teóricos'
    },
    {
      id: 'generator' as const,
      name: 'Módulo B: Generador',
      icon: <Calculator className="w-5 h-5" />,
      description: 'Variables aleatorias'
    },
    {
      id: 'simulation' as const,
      name: 'Módulo C: Simulación',
      icon: <Clock className="w-5 h-5" />,
      description: 'Eventos discretos'
    }
  ];

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'concepts':
        return <ConceptualModule />;
      case 'generator':
        return <GeneratorModule />;
      case 'simulation':
        return <SimulationModule />;
      default:
        return <ConceptualModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SimulStat</h1>
                <p className="text-sm text-gray-500">Entorno Interactivo de Simulación Estadística</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Basado en metodología Coss Bú</span>
              <a 
                href="https://github.com" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeModule === module.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {module.icon}
                  <div className="text-left">
                    <div className="font-medium">{module.name}</div>
                    <div className="text-xs opacity-75">{module.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveModule()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              <p>Herramienta educativa para simulación estadística y análisis de sistemas estocásticos.</p>
              <p className="mt-1">Implementa métodos de generación de variables aleatorias y simulación de eventos discretos.</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Requerimientos Funcionales:</span>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">RF-01</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">RF-02</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">RF-03</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">RF-04</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">RF-06</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tu app actual queda en "/" */}
        <Route path="/" element={<HomeTabs />} />

        {/* Nueva ruta para tu Tkinter -> Web */}
        <Route path="/simulstat/parte1" element={<Parte1Layout />}>
          <Route index element={<Parte1Home />} />
          <Route path="opcion-1" element={<Opcion1 />} />
          <Route path="opcion-2" element={<Opcion2 />} />
          <Route path="opcion-3" element={<Opcion3 />} />
          <Route path="opcion-4" element={<Opcion4 />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
