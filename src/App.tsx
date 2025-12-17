import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { InverseTransform } from './pages/InverseTransform';
import { InvestmentProject } from './pages/InvestmentProject';
import { MagazineVendor } from './pages/MagazineVendor';

import Parte1Layout from './simulstat_parte1/pages/Parte1Layout';
import Parte1Home from './simulstat_parte1/pages/Parte1Home.tsx';
import Opcion1 from './simulstat_parte1/pages/Opcion1.tsx';
import Opcion2 from './simulstat_parte1/pages/Opcion2.tsx';
import Opcion3 from './simulstat_parte1/pages/Opcion3.tsx';
import Opcion4 from './simulstat_parte1/pages/Opcion4.tsx';
import Camiones from './components/TruckCompositionModule.tsx';
import Actividad1_8 from './pages/Actividad1-8.tsx';
import Actividad1_1 from './pages/Actividad1-1.tsx';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="/inverse-transform" element={<InverseTransform />} />
          <Route path="/magazine-vendor" element={<MagazineVendor />} />
          <Route path="/investment-project" element={<InvestmentProject />} />
        </Route>
        <Route path="/simulstat/parte1" element={<Parte1Layout />}>
          <Route index element={<Parte1Home />} />
          <Route path="opcion-1" element={<Opcion1 />} />
          <Route path="opcion-2" element={<Opcion2 />} />
          <Route path="opcion-3" element={<Opcion3 />} />
          <Route path="opcion-4" element={<Opcion4 />} />
        </Route>
        <Route path="/camiones" element={<Camiones />} />
        <Route path="/actividad1-8" element={<Actividad1_8 />} />
        <Route path="/actividad1-1" element={<Actividad1_1 />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
