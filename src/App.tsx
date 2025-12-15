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
      
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="/inverse-transform" element={<InverseTransform />} />
          <Route path="/magazine-vendor" element={<MagazineVendor />} />
          <Route path="/investment-project" element={<InvestmentProject />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

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
