import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { InverseTransform } from './pages/InverseTransform';
import { InvestmentProject } from './pages/InvestmentProject';
import { MagazineVendor } from './pages/MagazineVendor';

const App: React.FC = () => {
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

export default App;
