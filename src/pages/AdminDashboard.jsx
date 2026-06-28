import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import { Loader2, ShieldAlert } from 'lucide-react';
import AdminStats from '@/components/admin/AdminStats';
import AdminDataPanel from '@/components/admin/AdminDataPanel';
import CentrosOperativosPanel from '@/components/admin/centros/CentrosOperativosPanel';
import GestionVoluntarios from '@/components/admin/GestionVoluntarios';
import SubidaMasivaEdificios from '@/components/admin/SubidaMasivaEdificios';
import GestionUsuarios from '@/components/admin/GestionUsuarios';
import VoluntariosDetalle from '@/components/admin/VoluntariosDetalle';
import GeocodificarPanel from '@/components/admin/GeocodificarPanel';
import ImportacionVzla from '@/components/admin/ImportacionVzla';

const ADMIN_EMAIL = 'villenagv@gmail.com';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('analytics');
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        if (u?.role !== 'admin' && u?.email !== ADMIN_EMAIL) {
          navigate('/');
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (user?.role !== 'admin' && user?.email !== ADMIN_EMAIL) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
            <p className="text-4xl mb-2">🔒</p>
            <ShieldAlert size={48} className="text-red-500 mb-4" />
            <h1 className="text-xl font-bold">Acceso Denegado</h1>
            <p className="text-gray-600">No tienes permiso para ver esta página.</p>
        </div>
    );
  }
  
  const tabs = [
      { key: 'analytics',   label: '📊 Analítica'           },
      { key: 'usuarios',    label: '👥 Usuarios'            },
      { key: 'voluntarios', label: '🤝 Voluntarios'         },
      { key: 'centros',     label: '🏥 Centros'             },
      { key: 'manage',      label: '⚙️ Datos'               },
      { key: 'edificios_masivo', label: '🏗️ Edificios'     },
      { key: 'importar_vzla', label: '🇻🇪 Importar VZ'       },
      { key: 'dossier',    label: '📋 Dossier'              },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <TopBar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de Administrador</h1>

        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map(t => (
                    <button 
                        key={t.key}
                        onClick={() => setTab(t.key)} 
                        className={`${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {t.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="py-8">
            {tab === 'analytics' && <AdminStats />}
            {tab === 'usuarios' && <GestionUsuarios es={true} />}
            {tab === 'voluntarios' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Solicitudes y perfiles de voluntarios</h2>
                  <VoluntariosDetalle es={true} />
                </div>
                <div className="border-t border-gray-200 pt-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">🤝 Panel de voluntarios (legacy)</h2>
                  <GestionVoluntarios es={true} />
                </div>
              </div>
            )}
            {tab === 'centros' && <CentrosOperativosPanel />}
            {tab === 'manage' && <AdminDataPanel />}
            {tab === 'edificios_masivo' && (
              <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SubidaMasivaEdificios />
                <GeocodificarPanel />
              </div>
            )}
            {tab === 'importar_vzla' && (
              <div style={{ maxWidth: 720, margin: '0 auto', background: '#0D1117', borderRadius: 18, padding: 24 }}>
                <ImportacionVzla />
              </div>
            )}
            {tab === 'dossier' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">Dossier visual de auditoría interna del sistema CRIS. Solo visible para administradores.</p>
                <iframe
                  src="/auditoria_cris_visual.html"
                  title="Dossier visual CRIS"
                  className="w-full rounded-xl border border-gray-200"
                  style={{ height: '80vh' }}
                />
              </div>
            )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;