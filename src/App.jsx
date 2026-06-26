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

// Public app — no authentication gate needed for emergency access
const PublicApp = () => (
  <Routes>
    <Route path="/" element={<Entrada />} />
    <Route path="/reportar" element={<Reportar />} />
    <Route path="/consultar" element={<Consultar />} />
    <Route path="/institucional" element={<Institucional />} />
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