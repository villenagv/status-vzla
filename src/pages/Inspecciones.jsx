import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldAlert, ChevronLeft, HardHat } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import CentroTriage from '@/components/portal/CentroTriage';

// Página dedicada y exclusiva para inspecciones estructurales.
// Solo accesible para ingenieros / arquitectos aprobados (o admins).
export default function Inspecciones() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        if (!u) { window.location.href = '/login'; return; }
        setUser(u);
        const perfiles = await base44.entities.PerfilProfesional.filter({ user_id: u.id }).catch(() => []);
        setPerfil(perfiles?.[0] || null);
      })
      .catch(() => { window.location.href = '/login'; })
      .finally(() => setCargando(false));
  }, []);

  const isAdmin = user?.role === 'admin';
  const esEspecialista = perfil && ['ingeniero', 'arquitecto'].includes(perfil.tipo_perfil);
  const especialistaAprobado = esEspecialista && perfil.estado_aprobacion === 'aprobado';
  const tieneAcceso = isAdmin || especialistaAprobado;
  const pendiente = esEspecialista && perfil.estado_aprobacion === 'pendiente';

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
    </div>
  );

  // ── Sin acceso ──
  if (!tieneAcceso) return (
    <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex-1">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <ShieldAlert size={36} className="text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            {pendiente
              ? t('Perfil en revisión', 'Profile under review')
              : t('Acceso restringido', 'Restricted access')}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {pendiente
              ? t('Tu perfil de especialista está pendiente de aprobación. Podrás procesar inspecciones cuando el administrador lo apruebe.',
                   'Your specialist profile is pending approval. You will be able to process inspections once an administrator approves it.')
              : t('Esta sección es exclusiva para ingenieros y arquitectos verificados. Si eres profesional, completa tu identificación.',
                   'This section is exclusive to verified engineers and architects. If you are a professional, complete your identification.')}
          </p>
          {!pendiente && (
            <Link to="/identificacion-profesional"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl no-underline transition-colors">
              <HardHat size={15} /> {t('Identificarme como profesional', 'Identify as a professional')}
            </Link>
          )}
          <Link to="/portal-voluntario" className="block text-xs text-gray-400 hover:text-gray-700 mt-4 no-underline">
            ← {t('Volver al portal', 'Back to portal')}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  // ── Con acceso: centro de inspecciones ──
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-2xl mx-auto w-full px-4 py-5 flex-1">
        <Link to="/portal-voluntario" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {t('Portal', 'Portal')}
        </Link>

        {/* Encabezado */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0" style={{ background: '#1D4ED8' }}>
              {perfil?.tipo_perfil === 'arquitecto' ? '📐' : isAdmin ? '⚙️' : '⚙️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{t('Centro de inspecciones', 'Inspection center')}</p>
              <p className="text-xs text-gray-400 truncate">{user?.full_name || user?.email}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: '#1D4ED8', color: '#fff' }}>
                {isAdmin ? t('Admin', 'Admin') : t(perfil.tipo_perfil, perfil.tipo_perfil)}
              </span>
            </div>
          </div>
        </div>

        {/* Aviso seguridad */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            ⚠️ {t('No entres a estructuras dañadas. Si hay grietas graves, colapso, olor a gas, cables caídos o personas atrapadas, espera a las autoridades.',
                   'Do not enter damaged structures. If there are major cracks, collapse, gas smell, fallen wires, or trapped people, wait for the authorities.')}
          </p>
        </div>

        <CentroTriage
          perfil={perfil ? { ...perfil, user_id: perfil.user_id || user?.id } : { tipo_perfil: 'admin', user_id: user?.id, user_nombre: user?.full_name, user_email: user?.email }}
          es={es}
          vistaInicial="panel"
          isAdmin={isAdmin}
        />
      </div>
      <Footer />
    </div>
  );
}