import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import { Loader2, ShieldAlert } from 'lucide-react';
import AdminStats from '@/components/admin/AdminStats';
import AdminDataPanel from '@/components/admin/AdminDataPanel';
import CentrosOperativosPanel from '@/components/admin/centros/CentrosOperativosPanel';

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
      { key: 'analytics', label: 'Analítica' },
      { key: 'centros', label: '🏥 Centros operativos' },
      { key: 'manage', label: '⚙️ Gestión de datos' }
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
            {tab === 'centros' && <CentrosOperativosPanel />}
            {tab === 'manage' && <AdminDataPanel />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;