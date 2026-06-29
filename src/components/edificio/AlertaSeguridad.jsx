import { useState } from 'react';
import { ShieldAlert, X, Phone } from 'lucide-react';

const EMERGENCIAS = [
  { num: '171', op: 'CANTV fijo' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

// ── Nube latente — se muestra siempre encima de la ficha ──
export function NubePeligro({ nivel, personas_atrapadas, es }) {
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(nivel);
  const atrapados = ['si', 'voces', 'posible'].includes(personas_atrapadas);
  if (!noEntrar && !atrapados) return null;

  const esColapsado   = nivel === 'colapsado';
  const esAtrapados   = atrapados;

  const bg     = esAtrapados ? 'rgba(220,38,38,0.97)' : 'rgba(153,27,27,0.95)';
  const border = esAtrapados ? '#ef4444' : '#b91c1c';

  return (
    <div style={{
      background: bg,
      border: `2px solid ${border}`,
      borderRadius: 14,
      padding: '12px 16px',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      boxShadow: '0 4px 18px rgba(220,38,38,0.35)',
    }}>
      {/* Ícono */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 28 }}>{esAtrapados ? '🆘' : esColapsado ? '💥' : '🚫'}</span>
        {noEntrar && (
          <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
            {es ? 'NO ENTRAR' : 'DO NOT ENTER'}
          </span>
        )}
      </div>

      {/* Texto */}
      <div style={{ flex: 1 }}>
        {esAtrapados && (
          <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
            {personas_atrapadas === 'si'
              ? (es ? '🚨 PERSONAS ATRAPADAS CONFIRMADAS' : '🚨 TRAPPED PEOPLE CONFIRMED')
              : (es ? '👂 Se escuchan voces / golpes' : '👂 Voices / knocking heard')}
          </p>
        )}
        <p style={{ fontSize: noEntrar ? 13 : 11, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          {es
            ? 'No entres a esta estructura dañada.'
            : 'Do not enter this damaged structure.'}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
          {es
            ? 'Espera a Protección Civil, Bomberos o rescatistas autorizados. Si hay emergencia activa llama ahora:'
            : 'Wait for Civil Protection, Firefighters or authorized rescue teams. If there is an active emergency, call now:'}
        </p>
        {/* Teléfonos de emergencia compactos */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {EMERGENCIAS.map(e => (
            <a key={e.num} href={`tel:${e.num}`} style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '5px 10px',
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{e.num}</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.65)' }}>{e.op}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modal pop-up de confirmación de seguridad ──
export function ModalSeguridadEdificio({ visible, onConfirmar, onCerrar, es }) {
  if (!visible) return null;
  return (
    <>
      {/* Overlay */}
      <div onClick={onCerrar} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.70)',
        zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {/* Sheet — sube desde abajo */}
        <div onClick={e => e.stopPropagation()} style={{
          background: '#111318', borderRadius: '20px 20px 0 0',
          maxWidth: 520, width: '100%', padding: '24px 20px 32px',
          border: '2px solid rgba(220,38,38,0.50)',
          borderBottom: 'none',
          boxShadow: '0 -8px 40px rgba(220,38,38,0.25)',
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />

          {/* Ícono + título */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>⚠️</span>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#FCA5A5', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {es ? 'Advertencia de seguridad' : 'Safety warning'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              {es ? 'Lee esto antes de continuar' : 'Read this before continuing'}
            </p>
          </div>

          {/* Advertencia principal */}
          <div style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 700, margin: '0 0 6px' }}>
              🚫 {es ? 'NO ENTRAR a la estructura' : 'DO NOT ENTER the structure'}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
              {es
                ? 'No entres a edificios dañados. Si hay grietas graves, colapso parcial, olor a gas, cables caídos, incendio o personas atrapadas, espera a Protección Civil, Bomberos o rescatistas autorizados.'
                : 'Do not enter damaged buildings. If there are major cracks, partial collapse, gas smell, fallen wires, fire, or trapped people, wait for Civil Protection, Firefighters, or authorized rescue teams.'}
            </p>
          </div>

          {/* Números de emergencia */}
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, textAlign: 'center' }}>
            {es ? 'Emergencias' : 'Emergency numbers'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
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

          {/* Botones */}
          <button onClick={onConfirmar} style={{
            width: '100%', padding: '15px 0', borderRadius: 14, fontSize: 14, fontWeight: 800,
            background: '#2471A3', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 10,
          }}>
            ✅ {es ? 'Entendido — Continuar desde lugar seguro' : 'Understood — Continue from a safe location'}
          </button>
          <button onClick={onCerrar} style={{
            width: '100%', padding: '11px 0', borderRadius: 14, fontSize: 13, fontWeight: 600,
            background: 'transparent', color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
          }}>
            {es ? 'Cerrar' : 'Close'}
          </button>
        </div>
      </div>
    </>
  );
}