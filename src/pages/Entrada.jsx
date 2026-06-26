import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';

/**
 * Pantalla de triage — carga instantánea
 * Sin TopBar, sin Footer, sin recursos externos, sin mapa
 * 4 tarjetas de modo que caben sin scroll en 375px
 */
export default function Entrada() {
  const { lang, toggle: toggleLang } = useLang();
  const es = lang === 'es';

  const MODOS = [
    {
      to: '/zona-afectada',
      emoji: '🆘',
      colorBg: 'var(--emergency-accent)',
      colorSubtitle: 'rgba(255,255,255,0.75)',
      titulo: es ? 'Estoy en zona afectada' : 'I am in the affected area',
      subtitulo: es
        ? 'Reporta daños, pide ayuda o informa un refugio cercano'
        : 'Report damage, ask for help or report a nearby shelter',
    },
    {
      to: '/consultar',
      emoji: '🔍',
      colorBg: 'var(--consulta-accent)',
      colorSubtitle: 'rgba(255,255,255,0.75)',
      titulo: es ? 'Busco información de una zona' : 'I need info about an area',
      subtitulo: es
        ? 'Estado de edificios, refugios activos y zonas reportadas'
        : 'Building status, active shelters and reported areas',
    },
    {
      to: '/institucional',
      emoji: '🏛️',
      colorBg: 'var(--inst-accent)',
      colorSubtitle: 'rgba(255,255,255,0.75)',
      titulo: es ? 'Soy institución o punto de ayuda' : 'I am an institution or help point',
      subtitulo: es
        ? 'Registra tu refugio, hospital, comedor o centro de donaciones'
        : 'Register your shelter, hospital, food center or donation point',
    },
    {
      to: '/personas',
      emoji: '👤',
      colorBg: 'var(--personas-accent)',
      colorSubtitle: 'rgba(255,255,255,0.75)',
      titulo: es ? 'Busco o reporto a una persona' : 'I search or report a person',
      subtitulo: es
        ? 'Reporta a alguien sin contacto o avisa que fue encontrado'
        : 'Report someone missing or notify they were found',
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111318' }}>

      {/* ── Header mínimo ── */}
      <header style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Status<span style={{ color: 'var(--dano-amarillo)' }}>Vzla</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.2 }}>
            CRIS · {es ? 'Centro de reportes de emergencia' : 'Emergency reporting center'}
          </div>
        </div>
        <button
          onClick={toggleLang}
          style={{
            fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
            border: '0.5px solid rgba(255,255,255,0.20)', color: 'rgba(255,255,255,0.55)',
            background: 'transparent', cursor: 'pointer',
          }}
        >
          {es ? 'EN' : 'ES'}
        </button>
      </header>

      {/* ── Banner de alerta activa ── */}
      <div style={{
        background: 'var(--emergency-accent)', padding: '8px 16px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.02em' }}>
          🔴 {es
            ? 'Terremoto activo · La Guaira, Caracas, Yaracuy · 24 junio 2026'
            : 'Active earthquake · La Guaira, Caracas, Yaracuy · June 24 2026'}
        </p>
      </div>

      {/* ── Tagline ── */}
      <div style={{ padding: '14px 16px 6px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
          {es
            ? 'Reconectemos a cada familia. Informemos cada zona.'
            : 'Reconnect every family. Inform every area.'}
        </p>
      </div>

      {/* ── Las 4 tarjetas de modo ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px 4px', gap: 8 }}>
        {MODOS.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="entry-card"
            style={{ background: m.colorBg, border: 'none', flex: 1, minHeight: 72, maxHeight: 110 }}
          >
            <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{m.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                {m.titulo}
              </p>
              <p style={{ fontSize: 11, color: m.colorSubtitle, marginTop: 3, lineHeight: 1.4 }}>
                {m.subtitulo}
              </p>
            </div>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>›</span>
          </Link>
        ))}
      </main>

      {/* ── Teléfonos de emergencia ── */}
      <div style={{ padding: '10px 12px 4px' }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, textAlign: 'center' }}>
          {es ? 'Líneas de emergencia Venezuela' : 'Venezuela emergency lines'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
          {[['171','CANTV'],['*1','Movilnet'],['112','Digitel'],['911','Movistar']].map(([num, op]) => (
            <a key={num} href={`tel:${num}`} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'var(--emergency-accent)', borderRadius: 8, padding: '7px 4px',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{num}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.70)' }}>{op}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Anti-extorsión ── */}
      <div style={{ margin: '8px 12px 4px', background: 'rgba(192,57,43,0.12)', border: '0.5px solid rgba(192,57,43,0.30)', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ fontSize: 11, color: '#f4a4b8', lineHeight: 1.4, textAlign: 'center' }}>
          ⚠️ {es
            ? 'Nunca envíes dinero a cambio de información. Si alguien lo pide, es una estafa.'
            : 'Never send money for information. Anyone asking for money is a scammer.'}
        </p>
      </div>

      {/* ── Acceso institucional ── */}
      <div style={{ textAlign: 'center', padding: '6px 16px 14px' }}>
        <Link to="/login" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecoration: 'underline' }}>
          {es ? 'Acceso institucional / Administrador' : 'Institutional access / Admin'}
        </Link>
      </div>
    </div>
  );
}