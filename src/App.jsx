import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { LangProvider } from '@/lib/LangContext';
import { LowBwProvider } from '@/lib/LowBwContext';

// Pages — all public, no auth required
import Entrada from './pages/Entrada';
import Reportar from './pages/Reportar';
import Consultar from './pages/Consultar';
import Institucional from './pages/Institucional';
import BuscarPersona from './pages/BuscarPersona';
import MiPerfil from './pages/MiPerfil';
import PortalInstitucional from './pages/PortalInstitucional';
import ReportarEncontrado from './pages/ReportarEncontrado';
import ActualizarEstado from './pages/ActualizarEstado';
import Dashboard from './pages/Dashboard';
import RegistroInstitucional from './pages/RegistroInstitucional';

// Public app — no authentication gate needed for emergency access
const PublicApp = () => (
  <Routes>
    <Route path="/" element={<Entrada />} />
    <Route path="/reportar" element={<Reportar />} />
    <Route path="/consultar" element={<Consultar />} />
    <Route path="/institucional" element={<Institucional />} />
    <Route path="/buscar-persona" element={<BuscarPersona />} />
    <Route path="/mi-perfil" element={<MiPerfil />} />
    <Route path="/portal-institucional" element={<PortalInstitucional />} />
    <Route path="/reportar-encontrado" element={<ReportarEncontrado />} />
    <Route path="/actualizar-estado" element={<ActualizarEstado />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/registro-institucional" element={<RegistroInstitucional />} />
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <LowBwProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <PublicApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </LowBwProvider>
      </LangProvider>
    </AuthProvider>
  );
}

export default App;