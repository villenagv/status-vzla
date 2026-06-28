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

// ── ACCIONES PRIMARIAS DE TRIAGE ──
const TRIAGE = [
  {
    to: '/edificios?tab=reportar',
    emoji: '🚨',
    bg: '#C0392B',
    textColor: '#fff',
    subColor: 'rgba(255,255,255,0.82)',
    es: { title: 'Reportar daño o peligro', sub: 'Edificio dañado · Gas · Personas atrapadas · Riesgo eléctrico' },
    en: { title: 'Report damage or hazard', sub: 'Damaged building · Gas · Trapped people · Electrical risk' },
  },
  {
    to: '/buscar-persona',
    emoji: '🔎',
    bg: '#7C3AED',
    textColor: '#fff',
    subColor: 'rgba(255,255,255,0.82)',
    es: { title: 'Buscar a alguien', sub: 'Personas buscadas · Encontradas · Cruces de información' },
    en: { title: 'Search for someone', sub: 'Missing people · Found · Cross-search' },
  },
  {
    to: '/reportar-encontrado',
    emoji: '🙋',
    bg: '#15803D',
    textColor: '#fff',
    subColor: 'rgba(255,255,255,0.82)',
    es: { title: 'Encontré a alguien', sub: 'Vi o tengo información real sobre una persona' },
    en: { title: 'I found someone', sub: 'I saw or have real info about a person' },
  },
  {
    to: '/centros-apoyo',
    emoji: '🏥',
    bg: '#0E7490',
    textColor: '#fff',
    subColor: 'rgba(255,255,255,0.82)',
    es: { title: 'Buscar refugio o ayuda', sub: 'Refugios · Hospitales · Centros de acopio · Agua y comida' },
    en: { title: 'Find shelter or help', sub: 'Shelters · Hospitals · Aid centers · Water & food' },
  },
];

// ── CONSULTA / INFORMACIÓN ──
const PILARES = [
  {
    to: '/edificios',
    emoji: '🏗️',
    borderColor: 'rgba(180,83,9,0.25)',
    badgeBg: 'rgba(251,191,36,0.10)',
    badgeColor: '#B45309',
    es: { badge: 'EDIFICIOS', title: 'Estado de edificios', sub: '¿Puedo entrar? · Daños · Servicios' },
    en: { badge: 'BUILDINGS', title: 'Building status', sub: 'Can I enter? · Damage · Services' },
  },
  {
    to: '/directorio',
    emoji: '📂',
    borderColor: 'rgba(107,114,128,0.22)',
    badgeBg: 'rgba(107,114,128,0.08)',
    badgeColor: '#4B5563',
    es: { badge: 'DIRECTORIO', title: 'Directorio completo', sub: 'Organizaciones · Contactos · Recursos' },
    en: { badge: 'DIRECTORY', title: 'Full directory', sub: 'Organizations · Contacts · Resources' },
  },
  {
    to: '/aliados',
    emoji: '🤝',
    borderColor: 'rgba(21,128,61,0.25)',
    badgeBg: 'rgba(21,128,61,0.08)',
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

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">

        {/* ── HERO ── */}
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(13,34,89,0.08)', color: '#1E40AF', border: '1px solid rgba(30,64,175,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#F5C518' }} />
              {es ? 'Status Vzla · Sistema Activo' : 'Status Vzla · System Active'}
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight mb-1.5" style={{ letterSpacing: '-0.02em', color: '#111827' }}>
            {es ? '¿Qué necesitas hacer ahora?' : 'What do you need to do now?'}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {es
              ? 'Elige una opción. Sin cuenta obligatoria. Funciona con poca señal.'
              : 'Choose an option. No account required. Works with poor signal.'}
          </p>
        </div>

        {/* ── CONTADORES ── */}
        <ContadoresEntrada />

        {/* ── TRIAGE: 4 ACCIONES PRIMARIAS ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: '#9CA3AF' }}>
            {es ? '⚡ Acción inmediata' : '⚡ Immediate action'}
          </p>
          <div className="flex flex-col gap-2.5">
            {TRIAGE.map(item => {
              const txt = es ? item.es : item.en;
              return (
                <Link key={item.to} to={item.to} className="no-underline block" style={{ borderRadius: 16 }}>
                  <div style={{
                    background: item.bg,
                    borderRadius: 16,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: item.textColor, lineHeight: 1.2, marginBottom: 3 }}>
                        {txt.title}
                      </p>
                      <p style={{ fontSize: 11, color: item.subColor, lineHeight: 1.4 }}>
                        {txt.sub}
                      </p>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, flexShrink: 0 }}>›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── CONSULTAR INFORMACIÓN ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: '#9CA3AF' }}>
            {es ? '📋 Consultar información' : '📋 Browse information'}
          </p>
          <div className="flex flex-col gap-2">
            {PILARES.map(item => {
              const txt = es ? item.es : item.en;
              return (
                <Link key={item.to} to={item.to} className="no-underline block" style={{ borderRadius: 12 }}>
                  <div style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${item.borderColor}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: item.badgeBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {item.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block', fontSize: 9, fontWeight: 800,
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                        color: item.badgeColor, marginBottom: 2,
                      }}>
                        {txt.badge}
                      </span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginBottom: 1 }}>
                        {txt.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
                        {txt.sub}
                      </p>
                    </div>
                    <span style={{ color: '#D1D5DB', fontSize: 18, flexShrink: 0 }}>›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── ACCIONES SECUNDARIAS ── */}
        <div className="grid grid-cols-2 gap-2">
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
          <Link to="/voluntario" className="no-underline flex items-center gap-3 px-3.5 py-3.5 rounded-2xl"
            style={{ background: '#F0FDF4', border: '1px solid rgba(21,128,61,0.25)' }}>
            <span style={{ fontSize: 18 }}>🤝</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D', lineHeight: 1.3 }}>
              {es ? 'Ser voluntario' : 'Volunteer'}
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