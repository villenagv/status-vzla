import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import HerramientasCarga from '@/components/voluntario/HerramientasCarga';

const ACCIONES = [
  {
    to: '/reportar-encontrado',
    icon: '🔍',
    bg: '#5B21B6',
    border: '#7C3AED',
    label: { es: 'Reportar persona encontrada', en: 'Report found person' },
    desc: { es: 'Indica quién fue visto o encontrado, su estado y ubicación. Conecta con familias que lo buscan.', en: 'Report who was seen or found, their status and location. Connect with families searching for them.' },
    badge: { es: 'Personas', en: 'People' },
  },
  {
    to: '/registro-institucional',
    icon: '📋',
    bg: '#0F766E',
    border: '#14B8A6',
    label: { es: 'Subir listado de personas en mi centro', en: 'Upload list of people at my center' },
    desc: { es: 'Registra tu refugio, hospital o centro y sube el listado de personas que tienes a cargo. CSV, Excel o foto.', en: 'Register your shelter, hospital or center and upload the list of people in your care. CSV, Excel or photo.' },
    badge: { es: 'Institucional', en: 'Institutional' },
  },
  {
    to: '/institucional',
    icon: '🏥',
    bg: '#166534',
    border: '#22C55E',
    label: { es: 'Registrar centro de apoyo', en: 'Register support center' },
    desc: { es: 'Agrega un refugio, hospital, comedor o punto de ayuda a la plataforma con su ubicación, estado y contacto.', en: 'Add a shelter, hospital, food center or help point with location, status and contact.' },
    badge: { es: 'Centros', en: 'Centers' },
  },
];

export default function Voluntario() {
  const { lang } = useLang();
  const es = lang === 'es';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0F1117' }}>
      <TopBar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-5 no-underline"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          ← {es ? 'Inicio' : 'Home'}
        </Link>

        {/* Header */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #2563EB 100%)', border: '1px solid rgba(124,58,237,0.4)' }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🤝</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(196,181,253,0.8)' }}>
                {es ? 'Modo voluntario' : 'Volunteer mode'}
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">
                {es ? 'Soy voluntario o personal de apoyo' : 'I am a volunteer or support staff'}
              </h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
            {es
              ? 'Registra personas encontradas, sube listados y mantén los centros de apoyo actualizados.'
              : 'Record found people, upload lists and keep support centers updated.'}
          </p>
        </div>

        {/* Advertencia de privacidad */}
        <div className="rounded-xl p-3 mb-5 flex gap-3" style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: '#FCD34D' }}>{es ? 'Privacidad y seguridad' : 'Privacy and security'}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(253,230,138,0.85)' }}>
              {es
                ? 'Nunca compartas teléfonos, correos o datos médicos sensibles públicamente. '
                : 'Never share phones, emails or sensitive medical data publicly. '}
              <strong style={{ color: '#FCD34D' }}>{es ? 'No pidas ni aceptes dinero por información.' : 'Do not ask for or accept money for information.'}</strong>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {es ? 'Elige una acción' : 'Choose an action'}
        </p>
        <div className="space-y-3 mb-5">
          {ACCIONES.map((a) => (
            <Link key={a.to} to={a.to} className="flex items-start gap-4 rounded-2xl p-4 no-underline group transition-all"
              style={{ background: a.bg, border: `1px solid ${a.border}` }}>
              <span className="text-2xl flex-shrink-0 mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white leading-tight">{es ? a.label.es : a.label.en}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                    {es ? a.badge.es : a.badge.en}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {es ? a.desc.es : a.desc.en}
                </p>
              </div>
              <span className="text-xl flex-shrink-0 mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>›</span>
            </Link>
          ))}
        </div>

        {/* Instrucciones claras antes de actuar */}
        <div className="rounded-2xl p-4 mb-5 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {es ? 'Antes de empezar — Lee esto:' : 'Before you start — Read this:'}
          </p>
          {[
            { icon: '✅', text: es ? 'Solo reporta lo que sabes con certeza. Si no estás seguro, escribe "No sé" o "No disponible".' : 'Only report what you know for certain. If unsure, write "Unknown" or "Not available".' },
            { icon: '🔒', text: es ? 'No escribas teléfonos ni correos de personas en campos públicos. La plataforma los protege automáticamente.' : 'Do not write personal phones or emails in public fields. The platform protects them automatically.' },
            { icon: '🚫', text: es ? 'Nunca aceptes ni pidas dinero a cambio de información. Si alguien lo hace, repórtalo.' : 'Never accept or ask for money in exchange for information. If someone does, report it.' },
            { icon: '📱', text: es ? 'Si tienes mala señal, usa el modo bajo consumo (botón ⚡ arriba). El formulario se guarda automáticamente.' : 'If you have a bad signal, use low-bandwidth mode (⚡ button above). The form auto-saves.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Herramientas de carga rápida */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {es ? '🛠️ Tienes una lista desordenada?' : '🛠️ Have a disorganized list?'}
        </p>
        <div className="mb-5">
          <HerramientasCarga />
        </div>

        {/* Recordatorio institucional */}
        <div className="rounded-xl p-4 flex gap-3" style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <span className="text-base flex-shrink-0 mt-0.5">💡</span>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: '#93C5FD' }}>{es ? '¿Datos de una institución?' : 'Institution data?'}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(147,197,253,0.80)' }}>
              {es
                ? 'Si representas a Protección Civil, Bomberos, un hospital o refugio habilitado, tus registros son marcados como institucionales. Coordina con el administrador.'
                : 'If you represent Civil Protection, Firefighters, a public hospital or enabled shelter, your records are marked as institutional. Coordinate with the administrator.'}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}