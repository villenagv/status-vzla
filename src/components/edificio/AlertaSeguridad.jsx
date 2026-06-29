import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EMERGENCIAS = [
  { num: '171', op: 'CANTV fijo' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

// ── Detecta cuál es la pregunta de mayor prioridad que falta ──
// Prioridad 1: ¿Hay atrapados? (campo no respondido = 'no_sabe' o vacío)
// Prioridad 2: ¿Falta foto de fachada?
export function getPreguntaPrioritaria(edificio) {
  if (!edificio) return null;
  const atrapados = edificio.personas_atrapadas;
  if (!atrapados || atrapados === 'no_sabe') return 'atrapados';
  const fotos = edificio.foto_urls || [];
  if (fotos.length === 0) return 'foto';
  return null;
}

// ── Nube latente — se muestra siempre encima de la ficha ──
export function NubePeligro({ nivel, personas_atrapadas, sinFoto, es }) {
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(nivel);
  const atrapados = ['si', 'voces', 'posible'].includes(personas_atrapadas);
  const faltaFoto = sinFoto && !atrapados; // solo mostramos si no hay urgencia mayor

  if (!noEntrar && !atrapados && !faltaFoto) return null;

  const esAtrapados = atrapados;
  const bg     = esAtrapados ? 'rgba(220,38,38,0.97)' : faltaFoto ? 'rgba(30,58,138,0.90)' : 'rgba(153,27,27,0.95)';
  const border = esAtrapados ? '#ef4444' : faltaFoto ? '#3b82f6' : '#b91c1c';

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
      boxShadow: `0 4px 18px ${esAtrapados ? 'rgba(220,38,38,0.35)' : 'rgba(0,0,0,0.25)'}`,
    }}>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 28 }}>{esAtrapados ? '🆘' : faltaFoto ? '📷' : nivel === 'colapsado' ? '💥' : '🚫'}</span>
        {noEntrar && (
          <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
            {es ? 'NO ENTRAR' : 'DO NOT ENTER'}
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {esAtrapados && (
          <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
            {personas_atrapadas === 'si'
              ? (es ? '🚨 PERSONAS ATRAPADAS CONFIRMADAS' : '🚨 TRAPPED PEOPLE CONFIRMED')
              : (es ? '👂 Se escuchan voces / golpes' : '👂 Voices / knocking heard')}
          </p>
        )}
        {faltaFoto && (
          <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>
            {es ? '📷 Se necesita foto de la fachada' : '📷 Facade photo needed'}
          </p>
        )}
        <p style={{ fontSize: noEntrar ? 13 : 11, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          {faltaFoto
            ? (es ? '¿Sabes si hay personas atrapadas con vida? Buscamos una foto reciente.' : 'Do you know if anyone is trapped alive? We are looking for a recent facade photo.')
            : es ? 'No entres a esta estructura dañada.' : 'Do not enter this damaged structure.'}
        </p>
        {!faltaFoto && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
            {es
              ? 'Espera a Protección Civil, Bomberos o rescatistas autorizados. Si hay emergencia activa llama ahora:'
              : 'Wait for Civil Protection, Firefighters or authorized rescue teams. If there is an active emergency, call now:'}
          </p>
        )}
        {noEntrar && (
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
        )}
      </div>
    </div>
  );
}

// ── Modal pop-up de confirmación con pregunta prioritaria dinámica ──
export function ModalSeguridadEdificio({ visible, onConfirmar, onCerrar, es, preguntaPrioritaria, edificioId, onRespuestaPrioritaria }) {
  const [respAtrapados, setRespAtrapados] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoOk, setFotoOk] = useState(false);

  if (!visible) return null;

  const puedeConfirmar = preguntaPrioritaria === 'atrapados' ? !!respAtrapados : true;

  const handleConfirmar = () => {
    // Si hay respuesta sobre atrapados, la notificamos al padre
    if (preguntaPrioritaria === 'atrapados' && respAtrapados && onRespuestaPrioritaria) {
      onRespuestaPrioritaria({ atrapados: respAtrapados });
    }
    // Si hay foto seleccionada, la subimos en background (no bloqueamos al usuario)
    if (fotoFile && edificioId && !fotoOk) {
      subirFotoBackground(fotoFile, edificioId);
    }
    onConfirmar();
  };

  const subirFotoBackground = async (file, id) => {
    setSubiendoFoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const edificio = await base44.entities.ReportesDano.get(id);
      const fotosActuales = edificio?.foto_urls || [];
      if (fotosActuales.length < 5) {
        await base44.entities.ReportesDano.update(id, {
          foto_urls: [file_url, ...fotosActuales].slice(0, 5),
        });
      }
      setFotoOk(true);
    } catch {}
    setSubiendoFoto(false);
  };

  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.70)',
      zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111318', borderRadius: '20px 20px 0 0',
        maxWidth: 520, width: '100%', padding: '24px 20px 32px',
        border: '2px solid rgba(220,38,38,0.50)',
        borderBottom: 'none',
        boxShadow: '0 -8px 40px rgba(220,38,38,0.25)',
      }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>⚠️</span>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#FCA5A5', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {es ? 'Advertencia de seguridad' : 'Safety warning'}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            {es ? 'Lee esto antes de continuar' : 'Read this before continuing'}
          </p>
        </div>

        {/* Advertencia NO ENTRAR */}
        <div style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 700, margin: '0 0 4px' }}>
            🚫 {es ? 'NO ENTRAR a la estructura' : 'DO NOT ENTER the structure'}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, margin: 0 }}>
            {es
              ? 'No entres a edificios dañados. Espera a Protección Civil, Bomberos o rescatistas autorizados.'
              : 'Do not enter damaged buildings. Wait for Civil Protection, Firefighters, or authorized rescue teams.'}
          </p>
        </div>

        {/* ── PREGUNTA PRIORITARIA DINÁMICA ── */}
        {preguntaPrioritaria === 'atrapados' && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#FCA5A5', margin: '0 0 10px' }}>
              🆘 {es ? 'Pregunta urgente — responde si sabes' : 'Urgent question — answer if you know'}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 10px', lineHeight: 1.45 }}>
              {es ? '¿Sabes si hay personas atrapadas con vida en este edificio?' : 'Do you know if there are people trapped alive in this building?'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { val: 'si',      es: '🚨 Sí, hay atrapados',    en: '🚨 Yes, trapped' },
                { val: 'voces',   es: '👂 Escuché voces/golpes', en: '👂 Heard voices' },
                { val: 'no',      es: '✅ No hay atrapados',     en: '✅ No trapped' },
                { val: 'no_sabe', es: '❓ No sé',                en: '❓ I don\'t know' },
              ].map(op => (
                <button key={op.val} onClick={() => setRespAtrapados(op.val)} style={{
                  padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 120ms',
                  background: respAtrapados === op.val ? (op.val === 'no' ? '#15803D' : op.val === 'no_sabe' ? '#374151' : '#C0392B') : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  border: `1.5px solid ${respAtrapados === op.val ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                }}>
                  {es ? op.es : op.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {preguntaPrioritaria === 'foto' && (
          <div style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(59,130,246,0.30)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#93C5FD', margin: '0 0 6px' }}>
              📷 {es ? 'Se busca foto de la fachada' : 'Facade photo needed'}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {es
                ? '¿Tienes una foto reciente del edificio desde la calle? Agrégala aquí (opcional, desde lugar seguro).'
                : 'Do you have a recent photo of the building from the street? Add it here (optional, from safe location).'}
            </p>
            {!fotoFile ? (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                border: '1.5px dashed rgba(59,130,246,0.45)', borderRadius: 10,
                padding: '12px 0', cursor: 'pointer', fontSize: 12, color: '#93C5FD', fontWeight: 600,
                background: 'rgba(37,99,235,0.06)',
              }}>
                <Camera size={16} />
                {es ? 'Seleccionar foto' : 'Select photo'}
                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setFotoFile(e.target.files[0]); }} />
              </label>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={URL.createObjectURL(fotoFile)} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#86EFAC', margin: 0, fontWeight: 600 }}>
                    ✅ {es ? 'Foto lista — se subirá al confirmar' : 'Photo ready — will upload on confirm'}
                  </p>
                  <button onClick={() => setFotoFile(null)} style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                    {es ? 'Quitar' : 'Remove'}
                  </button>
                </div>
              </div>
            )}
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', marginTop: 8, marginBottom: 0 }}>
              {es ? 'No es obligatorio. Puedes continuar sin foto.' : 'Not required. You can continue without a photo.'}
            </p>
          </div>
        )}

        {/* Números de emergencia compactos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
          {EMERGENCIAS.map(e => (
            <a key={e.num} href={`tel:${e.num}`} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: '#C0392B', borderRadius: 10, padding: '7px 4px', textDecoration: 'none',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{e.num}</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.65)' }}>{e.op}</span>
            </a>
          ))}
        </div>

        {/* Botón confirmar */}
        <button onClick={handleConfirmar} disabled={!puedeConfirmar} style={{
          width: '100%', padding: '15px 0', borderRadius: 14, fontSize: 14, fontWeight: 800,
          background: puedeConfirmar ? '#2471A3' : 'rgba(255,255,255,0.08)',
          color: puedeConfirmar ? '#fff' : 'rgba(255,255,255,0.35)',
          border: 'none', cursor: puedeConfirmar ? 'pointer' : 'default', marginBottom: 10,
          transition: 'all 150ms',
        }}>
          ✅ {es ? 'Entendido — Continuar desde lugar seguro' : 'Understood — Continue from a safe location'}
        </button>

        {preguntaPrioritaria === 'atrapados' && !respAtrapados && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 10, margin: '0 0 10px' }}>
            {es ? 'Responde la pregunta para continuar' : 'Answer the question to continue'}
          </p>
        )}

        <button onClick={onCerrar} style={{
          width: '100%', padding: '11px 0', borderRadius: 14, fontSize: 13, fontWeight: 600,
          background: 'transparent', color: 'rgba(255,255,255,0.50)',
          border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
        }}>
          {es ? 'Cerrar' : 'Close'}
        </button>
      </div>
    </div>
  );
}