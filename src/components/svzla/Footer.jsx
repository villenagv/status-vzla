import { useLang } from '@/lib/LangContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const EMERGENCIAS = [
  { num: '171', op: 'CANTV fijo' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

const LINKS = [
  { to: '/personas',        es: 'Personas buscadas',  en: 'Missing people'  },
  { to: '/edificios',       es: 'Edificios',          en: 'Buildings'       },
  { to: '/centros-apoyo',   es: 'Centros de apoyo',   en: 'Help centers'    },
  { to: '/directorio',      es: 'Directorio',         en: 'Directory'       },
  { to: '/guia-plataforma', es: 'Guía de uso',        en: 'User guide'      },
  { to: '/contactanos',     es: 'Contáctanos',        en: 'Contact us'      },
  { to: '/sobre',           es: 'Sobre nosotros',     en: 'About us'        },
  { to: '/aliados',         es: 'Aliados',            en: 'Partners'        },
];

export default function Footer() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const [mostrarTels, setMostrarTels] = useState(false);
  const [mostrarSugerencia, setMostrarSugerencia] = useState(false);
  const [sugerencia, setSugerencia] = useState('');
  const [emailSug, setEmailSug] = useState('');
  const [enviandoSug, setEnviandoSug] = useState(false);
  const [sugOk, setSugOk] = useState(false);

  const enviarSugerencia = async () => {
    if (!sugerencia.trim()) return;
    setEnviandoSug(true);
    try {
      await base44.entities.Sugerencias.create({ mensaje: sugerencia.trim(), email_contacto: emailSug.trim(), lang });
      setSugOk(true);
      setSugerencia('');
      setEmailSug('');
      setTimeout(() => { setSugOk(false); setMostrarSugerencia(false); }, 3000);
    } catch {}
    setEnviandoSug(false);
  };

  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  return (
    <footer style={{ background: '#0D1117', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 'auto' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 20px' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0D2259', border: '2px solid #F5C518', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>📍</div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Status<span style={{ color: '#F5C518' }}> Vzla</span></span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, maxWidth: 260, margin: 0 }}>
              {t('Plataforma ciudadana de respuesta a emergencias. No partidista · Sin fines de lucro.',
                 'Citizen emergency response platform. Non-partisan · Non-profit.',
                 'Plataforma cidadã de resposta a emergências. Não partidária · Sem fins lucrativos.')}
            </p>
          </div>
          <Link to="/admin" style={{ color: 'transparent', fontSize: 6, userSelect: 'none' }}>·</Link>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 20 }}>
          {LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
              {es ? l.es : l.en}
            </Link>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }} />

        {/* Emergencias toggle */}
        <button onClick={() => setMostrarTels(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: mostrarTels ? 10 : 14,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📞 {t('Teléfonos de emergencia', 'Emergency phones', 'Telefones de emergência')}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{mostrarTels ? '▲' : '▼'}</span>
        </button>

        {mostrarTels && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {EMERGENCIAS.map(e => (
              <a key={e.num} href={`tel:${e.num}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: '#C0392B', borderRadius: 10, padding: '8px 4px', textDecoration: 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{e.num}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)' }}>{e.op}</span>
              </a>
            ))}
          </div>
        )}

        {/* Anti-fraude */}
        <div style={{ background: 'rgba(192,57,43,0.09)', border: '1px solid rgba(192,57,43,0.20)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: '#FCA5A5', lineHeight: 1.5, margin: 0 }}>
            ⚠️ {t('Nunca envíes dinero a cambio de información. No autorizamos pagos, rescates privados ni intermediarios anónimos.',
                   'Never send money in exchange for information. We do not authorize payments, private rescues, or anonymous intermediaries.',
                   'Nunca envie dinheiro em troca de informações. Não autorizamos pagamentos, resgates privados ou intermediários anônimos.')}
          </p>
        </div>

        {/* Email */}
        <div style={{ background: 'rgba(36,113,163,0.09)', border: '1px solid rgba(36,113,163,0.22)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: '#93C5FD', lineHeight: 1.5, margin: 0 }}>
            ✉️ {t('¿Tienes listas o archivos para subir? Escríbenos a ', 'Have lists or files to upload? Email us at ', 'Tem listas ou arquivos para enviar? Escreva para ')}
            <a href="mailto:villenagv@gmail.com" style={{ color: '#BAE6FD', fontWeight: 700 }}>villenagv@gmail.com</a>
          </p>
        </div>

        {/* Sugerencias */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setMostrarSugerencia(v => !v)} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8,
            padding: '7px 13px', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.60)',
            width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>💡 {t('Tengo una sugerencia', 'I have a suggestion', 'Tenho uma sugestão')}</span>
            <span>{mostrarSugerencia ? '▲' : '▼'}</span>
          </button>
          {mostrarSugerencia && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sugOk ? (
                <p style={{ fontSize: 12, color: '#6fcf97', textAlign: 'center', padding: '8px 0' }}>
                  ✅ {t('¡Gracias! Tu sugerencia fue enviada.', 'Thanks! Your suggestion was sent.', 'Obrigado! Sua sugestão foi enviada.')}
                </p>
              ) : (
                <>
                  <textarea value={sugerencia} onChange={e => setSugerencia(e.target.value)} rows={3} maxLength={500}
                    placeholder={t('Tu idea, sugerencia o reporte de error...', 'Your idea, suggestion or bug report...', 'Sua ideia, sugestão ou relatório de erro...')}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 11px', fontSize: 12, color: '#fff', resize: 'none', outline: 'none', width: '100%' }} />
                  <input value={emailSug} onChange={e => setEmailSug(e.target.value)}
                    placeholder={t('Tu email (opcional)', 'Your email (optional)', 'Seu email (opcional)')}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 11px', fontSize: 12, color: '#fff', outline: 'none', width: '100%' }} />
                  <button onClick={enviarSugerencia} disabled={!sugerencia.trim() || enviandoSug}
                    style={{ background: '#2471A3', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !sugerencia.trim() || enviandoSug ? 0.5 : 1 }}>
                    {enviandoSug ? t('Enviando...', 'Sending...', 'Enviando...') : t('Enviar sugerencia', 'Send suggestion', 'Enviar sugestão')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
            © 2024–2025 Status Vzla · {t('Hecho por venezolanos ♥', 'Made by Venezuelans ♥', 'Feito por venezuelanos ♥')}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            {t('No partidista · Sin fines de lucro', 'Non-partisan · Non-profit', 'Não partidário · Sem fins lucrativos')}
          </p>
        </div>
      </div>
    </footer>
  );
}