import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const ACCIONES = [
  {
    to: '/reportar-encontrado',
    icon: '🔍',
    bg: 'bg-purple-600',
    label: { es: 'Reportar persona encontrada', en: 'Report found person' },
    desc: { es: 'Indica quién fue visto o encontrado, su estado y ubicación. Conecta con familias que lo buscan.', en: 'Report who was seen or found, their status and location. Connect with families searching for them.' },
  },
  {
    to: '/registro-institucional',
    icon: '📋',
    bg: 'bg-teal-600',
    label: { es: 'Subir listado de personas en mi centro', en: 'Upload list of people at my center' },
    desc: { es: 'Registra tu refugio, hospital o centro y sube el listado de personas que tienes a cargo. CSV, Excel o foto.', en: 'Register your shelter, hospital or center and upload the list of people in your care. CSV, Excel or photo.' },
  },
  {
    to: '/institucional',
    icon: '🏥',
    bg: 'bg-green-700',
    label: { es: 'Registrar centro de apoyo', en: 'Register support center' },
    desc: { es: 'Agrega un refugio, hospital, comedor o punto de ayuda a la plataforma con su ubicación, estado y contacto.', en: 'Add a shelter, hospital, food center or help point with location, status and contact.' },
  },
];

export default function Voluntario() {
  const { lang } = useLang();
  const es = lang === 'es';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-900 mb-4">
          ← {es ? 'Inicio' : 'Home'}
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl">🤝</span>
          <h1 className="text-2xl font-bold text-gray-900">{es ? 'Soy voluntario o personal de apoyo' : 'I am a volunteer or support staff'}</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {es
            ? 'Usa esta sección para registrar la información de personas encontradas, subir listados de centros de apoyo y mantener actualizada la plataforma con datos verificables.'
            : 'Use this section to record information about found people, upload aid center lists and keep the platform updated with verifiable data.'}
        </p>

        {/* Advertencia de privacidad */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex gap-3">
          <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="text-xs font-bold text-amber-800 mb-1">{es ? 'Privacidad y seguridad' : 'Privacy and security'}</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              {es
                ? 'Nunca compartas teléfonos, correos o datos médicos sensibles de forma pública. Las instituciones registradas pasan por verificación. '
                : 'Never share phones, emails or sensitive medical data publicly. Registered institutions go through verification. '}
              <strong>{es ? 'No pidas ni aceptes dinero por información.' : 'Do not ask for or accept money for information.'}</strong>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{es ? 'Elige una acción' : 'Choose an action'}</p>
        <div className="space-y-3 mb-6">
          {ACCIONES.map((a) => (
            <Link key={a.to} to={a.to} style={{ background: a.bg }} className="flex items-start gap-3 rounded-xl p-4 text-white no-underline hover:opacity-90 active:scale-[0.99] transition-all">
              <span className="text-2xl flex-shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{es ? a.label.es : a.label.en}</p>
                <p className="text-xs mt-1 opacity-70 leading-relaxed">{es ? a.desc.es : a.desc.en}</p>
              </div>
              <span className="text-lg opacity-30 flex-shrink-0">›</span>
            </Link>
          ))}
        </div>

        {/* Recordatorio de verificación */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-3">
          <span className="text-base flex-shrink-0 mt-0.5">💡</span>
          <div>
            <p className="text-xs font-bold text-blue-800 mb-1">{es ? '¿Datos de una institución?' : 'Institution data?'}</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              {es
                ? 'Si representas oficialmente a Protección Civil, Bomberos, un hospital público o refugio habilitado, tus registros son marcados como institucionales. Coordina con el administrador de la plataforma.'
                : 'If you officially represent Civil Protection, Firefighters, a public hospital or enabled shelter, your records are marked as institutional. Coordinate with the platform administrator.'}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}