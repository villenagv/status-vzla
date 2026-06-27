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

export default function Footer() {
  const { lang } = useLang();
  const es = lang === 'es';
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

  return (
    <footer style={{ background: '#111318', borderTop: '0.5px solid rgba(255,255,255,0.08)', marginTop: 'auto' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px 8px' }}>

        {/* Toggle teléfonos */}
        <button onClick={() => setMostrarTels(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: 'none', cursor: 'pointer',
          paddingBottom: 10, borderBottom: '0.5px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📞 {es ? 'Teléfonos de emergencia Venezuela' : 'Venezuela emergency phones'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{mostrarTels ? '▲' : '▼'}</span>
        </button>

        {mostrarTels && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 10 }}>
            {EMERGENCIAS.map(e => (
              <a key={e.num} href={`tel:${e.num}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: '#C0392B', borderRadius: 8, padding: '7px 4px', textDecoration: 'none',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{e.num}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.70)' }}>{e.op}</span>
              </a>
            ))}
          </div>
        )}

        {/* Avisos */}
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, marginBottom: 8 }}>
            {es
              ? '♥ Herramienta ciudadana y no partidista. Ante una emergencia médica, llama primero a los organismos de rescate. Verifica siempre la información antes de difundirla.'
              : '♥ A citizen and non-partisan tool. In a medical emergency, call rescue services first. Always verify information before sharing it.'}
          </p>
          <div style={{ background: 'rgba(192,57,43,0.12)', border: '0.5px solid rgba(192,57,43,0.25)', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: '#f4a4b8', lineHeight: 1.4 }}>
              ⚠️ {es
                ? 'Nunca envíes dinero a cambio de información. No autorizamos pagos, rescates privados ni intermediarios anónimos. Si alguien pide dinero, es una estafa.'
                : "Never send money in exchange for information. We do not authorize payments, private rescue fees, or anonymous intermediaries. If someone asks for money, it's a scam."}
            </p>
          </div>
        </div>

        <div style={{ background: 'rgba(36,113,163,0.12)', border: '0.5px solid rgba(36,113,163,0.28)', borderRadius: 6, padding: '8px 12px', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: '#9cc8e6', lineHeight: 1.4 }}>
            ✉️ {es
              ? '¿Tienes varios archivos o listados? Envíalos por correo a '
              : 'Have several files or lists? Send them by email to '}
            <a href="mailto:villenagv@gmail.com" style={{ color: '#cfe9ff', fontWeight: 600 }}>villenagv@gmail.com</a>
          </p>
        </div>

        {/* Formulario de sugerencias */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setMostrarSugerencia(v => !v)} style={{
            background: 'transparent', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 6,
            padding: '6px 12px', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.35)',
            width: '100%', textAlign: 'left',
          }}>
            💡 {es ? 'Tengo una sugerencia o idea de mejora' : 'I have a suggestion or idea'} {mostrarSugerencia ? '▲' : '▼'}
          </button>
          {mostrarSugerencia && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sugOk ? (
                <p style={{ fontSize: 12, color: '#6fcf97', textAlign: 'center', padding: '8px 0' }}>✅ {es ? '¡Gracias! Tu sugerencia fue enviada.' : 'Thanks! Your suggestion was sent.'}</p>
              ) : (
                <>
                  <textarea
                    value={sugerencia}
                    onChange={e => setSugerencia(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={es ? 'Escribe tu idea, sugerencia o reporte de error...' : 'Write your idea, suggestion or bug report...'}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#fff', resize: 'none', outline: 'none', width: '100%' }}
                  />
                  <input
                    value={emailSug}
                    onChange={e => setEmailSug(e.target.value)}
                    placeholder={es ? 'Tu email (opcional, para responderte)' : 'Your email (optional, to reply)'}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '7px 10px', fontSize: 12, color: '#fff', outline: 'none', width: '100%' }}
                  />
                  <button
                    onClick={enviarSugerencia}
                    disabled={!sugerencia.trim() || enviandoSug}
                    style={{ background: '#2471A3', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !sugerencia.trim() || enviandoSug ? 0.5 : 1 }}>
                    {enviandoSug ? (es ? 'Enviando...' : 'Sending...') : (es ? 'Enviar sugerencia' : 'Send suggestion')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)' }}>
            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.28)' }}>Status Venezuela</span> · {es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}
            {/* Punto invisible de acceso al panel de administración */}
            <Link to="/admin" style={{ marginLeft: 4, color: 'transparent', fontSize: 6, userSelect: 'none' }}>·</Link>
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
            {es ? 'Hecho por venezolanos ♥' : 'Made by Venezuelans ♥'}
          </p>
        </div>
      </div>
    </footer>
  );
}