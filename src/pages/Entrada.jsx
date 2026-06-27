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

const QUICK = [
  { to: '/personas',            emoji: '👤', es: 'Personas buscadas',      en: 'Missing people',       color: '#7C3AED' },
  { to: '/edificios',           emoji: '🏗️', es: 'Estado de edificios',    en: 'Building status',      color: '#B45309' },
  { to: '/centros-apoyo',       emoji: '🏥', es: 'Centros de apoyo',       en: 'Help centers',         color: '#0E7490' },
  { to: '/directorio',          emoji: '📂', es: 'Directorio completo',    en: 'Full directory',       color: '#374151' },
  { to: '/reportar-encontrado', emoji: '🙋', es: 'Encontré a alguien',     en: 'I found someone',      color: '#15803D' },
  { to: '/buscar-persona',      emoji: '🔎', es: 'Reportar desaparecido',  en: 'Report missing',       color: '#9A3412' },
  { to: '/guia-edificios',      emoji: '📖', es: 'Guía edificios',         en: 'Building guide',       color: '#1D4ED8' },
  { to: '/guia-plataforma',     emoji: '❓', es: 'Cómo usar CRIS',         en: 'How to use CRIS',      color: '#374151' },
];

export default function Entrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      <TopBar />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 flex flex-col gap-6">

        {/* ── HERO ── */}
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(13,34,89,0.6)', color: '#F5C518', border: '1px solid rgba(245,197,24,0.45)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#F5C518' }} />
              {es ? 'Status Vzla · Sistema Activo' : 'Status Vzla · System Active'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            {es ? '¿Cuál es tu\nsituación?' : 'What is your\nsituation?'}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
            {es
              ? 'Selecciona la opción que mejor te describe. Sin cuenta obligatoria.'
              : 'Select the option that best describes you. No account required.'}
          </p>
        </div>

        {/* ── CONTADORES ── */}
        <ContadoresEntrada />

        {/* ── TRIAJE PRINCIPAL ── */}
        <div className="flex flex-col gap-3">

          {/* Zona afectada */}
          <Link to="/zona-afectada" className="no-underline block group" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div className="relative p-5" style={{
              background: 'linear-gradient(135deg, rgba(192,57,43,0.22) 0%, rgba(146,43,33,0.12) 100%)',
              border: '1.5px solid rgba(239,68,68,0.45)',
              borderRadius: 16,
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.30)' }}>
                  🆘
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,0.20)', color: '#FCA5A5' }}>
                    {es ? 'EMERGENCIA ACTIVA' : 'ACTIVE EMERGENCY'}
                  </span>
                  <p className="text-lg font-black text-white leading-snug mb-1.5">
                    {es ? 'Estoy en la zona afectada' : 'I am in the affected area'}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {es
                      ? 'Reportar daño · Necesito ayuda · Encontré a alguien · Ver centros cercanos'
                      : 'Report damage · Need help · Found someone · See nearby centers'}
                  </p>
                </div>
                <span className="text-red-400 text-xl flex-shrink-0 mt-1">›</span>
              </div>
            </div>
          </Link>

          {/* Fuera de zona */}
          <Link to="/fuera-zona" className="no-underline block" style={{ borderRadius: 16 }}>
            <div className="relative p-5" style={{
              background: 'linear-gradient(135deg, rgba(36,113,163,0.20) 0%, rgba(29,78,216,0.10) 100%)',
              border: '1.5px solid rgba(59,130,246,0.40)',
              borderRadius: 16,
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  ✈️
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,0.18)', color: '#93C5FD' }}>
                    {es ? 'ESTOY A SALVO' : 'I AM SAFE'}
                  </span>
                  <p className="text-lg font-black text-white leading-snug mb-1.5">
                    {es ? 'Busco información o quiero ayudar' : 'Looking for info or want to help'}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {es
                      ? 'Buscar personas · Consultar edificios · Subir listas · Apoyar desde lejos'
                      : 'Search people · Check buildings · Upload lists · Support from afar'}
                  </p>
                </div>
                <span className="text-blue-400 text-xl flex-shrink-0 mt-1">›</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ── ACCESOS RÁPIDOS ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {es ? 'Acceso directo' : 'Quick access'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="no-underline flex items-center gap-3 px-3.5 py-3.5 rounded-2xl transition-opacity"
                style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: `${item.color}22`, fontSize: 16 }}>
                  {item.emoji}
                </span>
                <span className="text-xs font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {es ? item.es : item.en}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── TELÉFONOS DE EMERGENCIA ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '16px',
        }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.28)' }}>
            📞 {es ? 'Emergencias Venezuela' : 'Venezuela emergency lines'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TELS.map(({ num, op }) => (
              <a key={num} href={`tel:${num}`} className="no-underline flex flex-col items-center py-3 rounded-xl" style={{ background: '#C0392B' }}>
                <span className="text-sm font-black text-white">{num}</span>
                <span className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{op}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── ANTI-EXTORSIÓN ── */}
        <div style={{
          background: 'rgba(192,57,43,0.08)',
          border: '1px solid rgba(192,57,43,0.25)',
          borderRadius: 12,
          padding: '12px 16px',
        }}>
          <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
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