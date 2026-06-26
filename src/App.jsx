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
import EstoyAqui from './pages/EstoyAqui';
import ZonaAfectada from './pages/ZonaAfectada';
import FueraZona from './pages/FueraZona';
import DirectorioEncontrados from './pages/DirectorioEncontrados';
import CentrosApoyo from './pages/CentrosApoyo';
import Login from './pages/Login';
import Register from './pages/Register';
import Personas from './pages/Personas';
import ReportarDano from './pages/ReportarDano';
import Edificios from './pages/Edificios';
import EdificioDetalle from './pages/EdificioDetalle';
import PersonaDetalle from './pages/PersonaDetalle';
import Pista from './pages/Pista';
import Seguimiento from './pages/Seguimiento';
import Suscripciones from './pages/Suscripciones';
import SolicitarInfoEdificio from './pages/SolicitarInfoEdificio';
import AdminDashboard from './pages/AdminDashboard';

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
    <Route path="/estoy-aqui" element={<EstoyAqui />} />
    <Route path="/zona-afectada" element={<ZonaAfectada />} />
    <Route path="/fuera-zona" element={<FueraZona />} />
    <Route path="/directorio-encontrados" element={<DirectorioEncontrados />} />
    <Route path="/centros-apoyo" element={<CentrosApoyo />} />
    <Route path="/personas" element={<Personas />} />
    <Route path="/reportar-dano" element={<ReportarDano />} />
    <Route path="/edificios" element={<Edificios />} />
    <Route path="/edificio" element={<EdificioDetalle />} />
    <Route path="/persona" element={<PersonaDetalle />} />
    <Route path="/pista" element={<Pista />} />
    <Route path="/seguimiento" element={<Seguimiento />} />
    <Route path="/suscripciones" element={<Suscripciones />} />
    <Route path="/solicitar-info-edificio" element={<SolicitarInfoEdificio />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/admin" element={<AdminDashboard />} />
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