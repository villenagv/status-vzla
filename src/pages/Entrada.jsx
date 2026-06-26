import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';

const MODOS = [
  {
    to: '/zona-afectada',
    emoji: '🆘',
    bg: '#C0392B',
    label: { es: 'EMERGENCIA', en: 'EMERGENCY' },
    titulo: { es: 'Estoy en zona afectada', en: 'I am in the affected area' },
    subtitulo: {
      es: 'Reporta daños · Pide ayuda · Informa refugio cercano',
      en: 'Report damage · Ask for help · Report nearby shelter',
    },
  },
  {
    to: '/consultar',
    emoji: '🔍',
    bg: '#1A5276',
    label: { es: 'CONSULTAR', en: 'SEARCH INFO' },
    titulo: { es: 'Busco información de una zona', en: 'I need info about an area' },
    subtitulo: {
      es: 'Edificios · Refugios activos · Zonas reportadas',
      en: 'Buildings · Active shelters · Reported areas',
    },
  },
  {
    to: '/personas',
    emoji: '👤',
    bg: '#6C3483',
    label: { es: 'PERSONAS', en: 'PEOPLE' },
    titulo: { es: 'Busco o reporto a una persona', en: 'I search or report a person' },
    subtitulo: {
      es: 'Persona sin contacto · Alguien encontrado · Estado de familiar',
      en: 'Missing person · Someone found · Family status',
    },
  },
  {
    to: '/institucional',
    emoji: '🏛️',
    bg: '#1A5C3A',
    label: { es: 'INSTITUCIÓN', en: 'INSTITUTION' },
    titulo: { es: 'Soy institución o punto de ayuda', en: 'I am an institution or help point' },
    subtitulo: {
      es: 'Refugio · Hospital · Comedor · Centro de donaciones',
      en: 'Shelter · Hospital · Food center · Donation point',
    },
  },
];

const TELS = [
  { num: '171', op: 'CANTV' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

export default function Entrada() {
  const { lang, toggle: toggleLang } = useLang();
  const es = lang === 'es';

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0D1117',
      maxWidth: 480,
      margin: '0 auto',
    }}>

      {/* ── Header ── */}
      <header style={{
        padding: '14px 16px 12px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Status<span style={{ color: '#E8B84B' }}>Vzla</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            CRIS · {es ? 'Red de información de emergencia' : 'Emergency information network'}
          </div>
        </div>
        <button
          onClick={toggleLang}
          style={{
            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.60)',
            background: 'rgba(255,255,255,0.06)', cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          {es ? 'EN' : 'ES'}
        </button>
      </header>

      {/* ── Alerta activa ── */}
      <div style={{
        background: '#C0392B',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>🔴</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: 0 }}>
            {es ? 'TERREMOTO ACTIVO' : 'ACTIVE EARTHQUAKE'}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.80)', margin: 0, marginTop: 1 }}>
            {es ? 'La Guaira · Caracas · Yaracuy · 24 junio 2026' : 'La Guaira · Caracas · Yaracuy · June 24 2026'}
          </p>
        </div>
      </div>

      {/* ── Pregunta principal ── */}
      <div style={{ padding: '16px 16px 8px' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.4, margin: 0 }}>
          {es ? '¿Cuál es tu situación?' : 'What is your situation?'}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: '3px 0 0' }}>
          {es ? 'Toca la opción que mejor te describe' : 'Tap the option that best describes you'}
        </p>
      </div>

      {/* ── Tarjetas de modo ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 12px 8px', gap: 8 }}>
        {MODOS.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: m.bg,
              borderRadius: 14,
              padding: '16px 16px 15px',
              textDecoration: 'none',
              flex: 1,
              minHeight: 76,
              maxHeight: 106,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Acento de fondo sutil */}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
              background: 'rgba(255,255,255,0.05)', borderRadius: '0 14px 14px 0',
            }} />

            <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{m.emoji}</span>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Label de categoría */}
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.10em',
                color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase',
                display: 'block', marginBottom: 3,
              }}>
                {es ? m.label.es : m.label.en}
              </span>
              {/* Título principal */}
              <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.25, margin: 0 }}>
                {es ? m.titulo.es : m.titulo.en}
              </p>
              {/* Subtítulo */}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 1.4 }}>
                {es ? m.subtitulo.es : m.subtitulo.en}
              </p>
            </div>

            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.40)', flexShrink: 0, fontWeight: 300 }}>›</span>
          </Link>
        ))}
      </main>

      {/* ── Teléfonos de emergencia ── */}
      <div style={{ padding: '10px 12px 6px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, textAlign: 'center' }}>
          📞 {es ? 'Llamadas de emergencia' : 'Emergency calls'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {TELS.map(({ num, op }) => (
            <a key={num} href={`tel:${num}`} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: '#C0392B', borderRadius: 10, padding: '8px 4px',
              textDecoration: 'none', gap: 2,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{num}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.02em' }}>{op}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Anti-extorsión ── */}
      <div style={{
        margin: '8px 12px 4px',
        background: 'rgba(192,57,43,0.15)',
        border: '1px solid rgba(192,57,43,0.35)',
        borderRadius: 10,
        padding: '9px 13px',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠️</span>
        <p style={{ fontSize: 11, color: '#F1948A', lineHeight: 1.45, margin: 0 }}>
          {es
            ? 'Nunca envíes dinero a cambio de información. Si alguien lo pide, es una estafa.'
            : 'Never send money for information. If someone asks, it is a scam.'}
        </p>
      </div>

      {/* ── Footer discreto ── */}
      <div style={{ textAlign: 'center', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <Link to="/login" style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)', textDecoration: 'underline' }}>
          {es ? 'Acceso institucional / Administrador' : 'Institutional access / Admin'}
        </Link>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', margin: 0 }}>
          StatusVzla · CRIS · {es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}
        </p>
      </div>
    </div>
  );
}