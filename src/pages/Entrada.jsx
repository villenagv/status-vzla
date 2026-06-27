import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Link } from 'react-router-dom';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import ContadoresEntrada from '@/components/svzla/ContadoresEntrada';

const TELS = [
  { num: '171', op: 'CANTV' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

const PILARES = [
  {
    to: '/edificios',
    emoji: '🏗️',
    color: '#92400E',
    borderColor: 'rgba(180,83,9,0.30)',
    bg: 'rgba(251,191,36,0.08)',
    badgeBg: 'rgba(180,83,9,0.12)',
    badgeColor: '#B45309',
    es: { badge: 'EDIFICIOS', title: 'Estado de edificios', sub: 'Daños · Acceso · Servicios · ¿Puedo entrar?' },
    en: { badge: 'BUILDINGS', title: 'Building status', sub: 'Damage · Access · Services · Can I enter?' },
  },
  {
    to: '/centros-apoyo',
    emoji: '🏥',
    color: '#0E7490',
    borderColor: 'rgba(14,116,144,0.30)',
    bg: 'rgba(14,116,144,0.06)',
    badgeBg: 'rgba(14,116,144,0.12)',
    badgeColor: '#0E7490',
    es: { badge: 'CENTROS DE APOYO', title: 'Refugios y hospitales', sub: 'Dónde ir · Capacidad · Qué ofrecen' },
    en: { badge: 'HELP CENTERS', title: 'Shelters & hospitals', sub: 'Where to go · Capacity · What they offer' },
  },
  {
    to: '/directorio',
    emoji: '📂',
    color: '#374151',
    borderColor: 'rgba(107,114,128,0.28)',
    bg: 'rgba(107,114,128,0.06)',
    badgeBg: 'rgba(107,114,128,0.12)',
    badgeColor: '#4B5563',
    es: { badge: 'DIRECTORIO', title: 'Directorio completo', sub: 'Organizaciones · Contactos · Recursos' },
    en: { badge: 'DIRECTORY', title: 'Full directory', sub: 'Organizations · Contacts · Resources' },
  },
  {
    to: '/aliados',
    emoji: '🤝',
    color: '#15803D',
    borderColor: 'rgba(21,128,61,0.28)',
    bg: 'rgba(21,128,61,0.06)',
    badgeBg: 'rgba(21,128,61,0.12)',
    badgeColor: '#15803D',
    es: { badge: 'ALIADOS', title: 'Organizaciones aliadas', sub: 'ONGs · Voluntarios · Instituciones' },
    en: { badge: 'PARTNERS', title: 'Partner organizations', sub: 'NGOs · Volunteers · Institutions' },
  },
];

export default function Entrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F6F8' }}>
      <TopBar />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 flex flex-col gap-6">

        {/* ── HERO ── */}
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(13,34,89,0.08)', color: '#1E40AF', border: '1px solid rgba(30,64,175,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#F5C518' }} />
              {es ? 'Status Vzla · Sistema Activo' : 'Status Vzla · System Active'}
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-2" style={{ letterSpacing: '-0.02em', color: '#111827' }}>
            {es ? '¿Qué necesitas\nencontrar?' : 'What do you\nneed to find?'}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {es
              ? 'Información en tiempo real sobre edificios, refugios y centros de apoyo. Sin cuenta obligatoria.'
              : 'Real-time information about buildings, shelters and support centers. No account required.'}
          </p>
        </div>

        {/* ── CONTADORES ── */}
        <ContadoresEntrada />

        {/* ── ACCIÓN RÁPIDA DE EMERGENCIA ── */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)',
          border: '1.5px solid rgba(239,68,68,0.30)',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🆘</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#991B1B', marginBottom: 2 }}>
              {es ? 'Reportar daño o peligro ahora' : 'Report damage or danger now'}
            </p>
            <p style={{ fontSize: 11, color: '#B91C1C', lineHeight: 1.4, opacity: 0.75 }}>
              {es ? 'Edificio dañado · Gas · Personas atrapadas · Riesgo eléctrico' : 'Damaged building · Gas · Trapped people · Electrical risk'}
            </p>
          </div>
          <Link to="/reportar-dano" style={{
            flexShrink: 0,
            background: '#C0392B',
            color: '#fff',
            fontWeight: 800,
            fontSize: 12,
            padding: '8px 14px',
            borderRadius: 10,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            {es ? 'Reportar' : 'Report'}
          </Link>
        </div>

        {/* ── 4 PILARES PRINCIPALES ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>
            {es ? 'Consultar información' : 'Browse information'}
          </p>
          <div className="flex flex-col gap-2.5">
            {PILARES.map(item => {
              const txt = es ? item.es : item.en;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="no-underline block"
                  style={{ borderRadius: 14 }}
                >
                  <div style={{
                    background: item.bg,
                    border: `1.5px solid ${item.borderColor}`,
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {/* Icono */}
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                      background: item.badgeBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {item.emoji}
                    </div>

                    {/* Texto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 9, fontWeight: 800,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: item.badgeColor,
                        marginBottom: 3,
                      }}>
                        {txt.badge}
                      </span>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 3 }}>
                        {txt.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
                        {txt.sub}
                      </p>
                    </div>

                    {/* Flecha */}
                    <span style={{ color: '#D1D5DB', fontSize: 18, flexShrink: 0 }}>›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── ACCIONES SECUNDARIAS ── */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/reportar-dano" className="no-underline flex items-center gap-3 px-3.5 py-3.5 rounded-2xl"
            style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.25)' }}>
            <span style={{ fontSize: 18 }}>🚨</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', lineHeight: 1.3 }}>
              {es ? 'Reportar daño' : 'Report damage'}
            </span>
          </Link>
          <Link to="/guia-plataforma" className="no-underline flex items-center gap-3 px-3.5 py-3.5 rounded-2xl"
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 18 }}>❓</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: 1.3 }}>
              {es ? 'Cómo usar la app' : 'How to use the app'}
            </span>
          </Link>
          <Link to="/guia-edificios" className="no-underline flex items-center gap-3 px-3.5 py-3.5 rounded-2xl"
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 18 }}>📖</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: 1.3 }}>
              {es ? 'Guía edificios' : 'Building guide'}
            </span>
          </Link>
          <Link to="/contactanos" className="no-underline flex items-center gap-3 px-3.5 py-3.5 rounded-2xl"
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 18 }}>✉️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: 1.3 }}>
              {es ? 'Contáctanos' : 'Contact us'}
            </span>
          </Link>
        </div>

        {/* ── TELÉFONOS DE EMERGENCIA ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>
            📞 {es ? 'Emergencias Venezuela' : 'Venezuela emergency lines'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TELS.map(({ num, op }) => (
              <a key={num} href={`tel:${num}`} className="no-underline flex flex-col items-center py-3 rounded-xl" style={{ background: '#C0392B' }}>
                <span className="text-sm font-black text-white">{num}</span>
                <span className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{op}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── ANTI-EXTORSIÓN ── */}
        <div style={{
          background: '#FEF9F0',
          border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: 12,
          padding: '12px 16px',
        }}>
          <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
            ⚠️ {es
              ? 'Nunca envíes dinero a cambio de información. Si alguien pide dinero para localizar a alguien, es una estafa.'
              : "Never send money in exchange for information. If someone asks for money to locate a person, it's a scam."}
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}