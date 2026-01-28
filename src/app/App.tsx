import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/login';
import { Layout } from './components/layout';
import { Dashboard } from './components/dashboard';
import { PlantasList } from './components/plantas-list';
import { PlantDetail } from './components/plant-detail';
import { Facturas } from './components/facturas';
import { Alertas } from './components/alertas';
import { Settings } from './components/settings';

import { GlobalFinancialAnalysis } from './components/global-financial-analysis';
import { OperationalCosts } from './components/operational-costs';

import { UserProvider } from '@/context/UserContext';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="plantas" element={<PlantasList />} />
            <Route path="planta/:id" element={<PlantDetail />} />
            <Route path="financiero" element={<GlobalFinancialAnalysis />} />
            <Route path="costos" element={<OperationalCosts />} />
            <Route path="facturas" element={<Facturas />} />
            <Route path="reportes" element={<div className="text-center py-12 text-muted-foreground">Reportes - En desarrollo</div>} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

