import { useLang } from '@/lib/LangContext';
import { useState } from 'react';

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

        {/* Bottom */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)' }}>
            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.28)' }}>Status Venezuela</span> · {es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
            {es ? 'Hecho por venezolanos ♥' : 'Made by Venezuelans ♥'}
          </p>
        </div>
      </div>
    </footer>
  );
}