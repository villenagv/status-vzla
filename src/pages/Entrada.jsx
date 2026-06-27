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

export default function Entrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#111318' }}>
      <TopBar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-5">

        {/* Encabezado */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Status Venezuela · CRIS
          </p>
          <h1 className="text-2xl font-black text-white leading-tight mb-1">
            {es ? '¿Cuál es tu situación?' : 'What is your situation?'}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {es
              ? 'Selecciona la opción que mejor te describe. Sin registro obligatorio.'
              : 'Select the option that best describes you. No account required.'}
          </p>
        </div>

        {/* Contadores */}
        <ContadoresEntrada />

        {/* ─── TRIAJE PRINCIPAL ─── */}
        <div className="grid grid-cols-1 gap-3">

          {/* OPCIÓN 1 — Zona afectada */}
          <Link
            to="/zona-afectada"
            className="no-underline block rounded-2xl p-5 border-2 border-red-500"
            style={{ background: 'rgba(192,57,43,0.15)' }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">🆘</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-0.5">
                  {es ? 'Emergencia activa' : 'Active emergency'}
                </p>
                <p className="text-lg font-black text-white leading-tight mb-1">
                  {es ? 'Estoy en la zona afectada' : 'I am in the affected area'}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {es
                    ? 'Reportar daño · Necesito ayuda · Encontré a alguien · Centros de apoyo cerca'
                    : 'Report damage · Need help · I found someone · Nearby help centers'}
                </p>
              </div>
              <span className="text-xl text-red-400 flex-shrink-0">›</span>
            </div>
          </Link>

          {/* OPCIÓN 2 — Fuera de zona */}
          <Link
            to="/fuera-zona"
            className="no-underline block rounded-2xl p-5 border-2 border-blue-500"
            style={{ background: 'rgba(36,113,163,0.15)' }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">✈️</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">
                  {es ? 'Estoy a salvo / fuera de la zona' : 'I am safe / outside the area'}
                </p>
                <p className="text-lg font-black text-white leading-tight mb-1">
                  {es ? 'Busco información o quiero ayudar' : 'I need info or want to help'}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {es
                    ? 'Buscar personas · Consultar edificios · Registrar listados · Apoyar desde lejos'
                    : 'Search people · Check buildings · Register lists · Support from afar'}
                </p>
              </div>
              <span className="text-xl text-blue-400 flex-shrink-0">›</span>
            </div>
          </Link>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }} />

        {/* Accesos rápidos secundarios */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {es ? 'Accesos directos' : 'Quick access'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/personas',           emoji: '👤', es: 'Personas buscadas',     en: 'Missing people' },
              { to: '/edificios',          emoji: '🏗️', es: 'Estado de edificios',   en: 'Building status' },
              { to: '/centros-apoyo',      emoji: '🏥', es: 'Centros de apoyo',      en: 'Help centers' },
              { to: '/reportar-encontrado',emoji: '🙋', es: 'Encontré a alguien',    en: 'I found someone' },
              { to: '/buscar-persona',     emoji: '🔎', es: 'Reportar desaparecido', en: 'Report missing' },
              { to: '/institucional',      emoji: '🏛️', es: 'Soy institución',       en: 'I am an institution' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="no-underline flex items-center gap-2.5 rounded-xl px-3 py-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
              >
                <span className="text-base flex-shrink-0">{item.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
                  {es ? item.es : item.en}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Teléfonos de emergencia */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '14px 16px' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
            📞 {es ? 'Emergencias Venezuela' : 'Venezuela emergency lines'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TELS.map(({ num, op }) => (
              <a key={num} href={`tel:${num}`} className="flex flex-col items-center no-underline rounded-xl py-3" style={{ background: '#C0392B' }}>
                <span className="text-sm font-black text-white">{num}</span>
                <span className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{op}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Aviso anti-extorsión */}
        <div style={{ background: 'rgba(192,57,43,0.10)', border: '0.5px solid rgba(192,57,43,0.30)', borderRadius: 12, padding: '10px 14px' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#f4a4b8' }}>
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