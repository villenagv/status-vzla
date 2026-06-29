import { useState } from 'react';
import { Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EMERGENCIAS = [
  { num: '171', op: 'CANTV fijo' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

// ── Detecta todos los campos críticos que faltan, en orden de prioridad ──
export function getPreguntaPrioritaria(edificio) {
  if (!edificio) return null;
  const atrapados = edificio.personas_atrapadas;
  if (!atrapados || atrapados === 'no_sabe') return 'atrapados';
  const fotos = edificio.foto_urls || [];
  if (fotos.length === 0) return 'foto';
  return null;
}

// Devuelve lista de preguntas incompletas secundarias (para la sección amarilla)
export function getInfoFaltante(edificio) {
  if (!edificio) return [];
  const faltante = [];

  // ¿Acceso a la calle?
  if (!edificio.acceso_calle || edificio.acceso_calle === 'no_sabe' || edificio.acceso_calle === 'no_verificado') {
    faltante.push('acceso_calle');
  }
  // ¿Gas?
  if (!edificio.gas || edificio.gas === 'no_confirmado') {
    faltante.push('gas');
  }
  // ¿Electricidad?
  if (!edificio.electricidad || edificio.electricidad === 'no_confirmado') {
    faltante.push('electricidad');
  }
  // ¿Agua?
  if (!edificio.agua || edificio.agua === 'no_confirmado') {
    faltante.push('agua');
  }

  return faltante;
}

// ── Nube latente — se muestra siempre encima de la ficha ──
export function NubePeligro({ nivel, personas_atrapadas, sinFoto, es }) {
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(nivel);
  const atrapados = ['si', 'voces', 'posible'].includes(personas_atrapadas);
  const faltaFoto = sinFoto && !atrapados;

  if (!noEntrar && !atrapados && !faltaFoto) return null;

  const esAtrapados = atrapados;
  const bg     = esAtrapados ? 'rgba(220,38,38,0.97)' : faltaFoto ? 'rgba(30,58,138,0.90)' : 'rgba(153,27,27,0.95)';
  const border = esAtrapados ? '#ef4444' : faltaFoto ? '#3b82f6' : '#b91c1c';

  return (
    <div style={{
      background: bg, border: `2px solid ${border}`, borderRadius: 14,
      padding: '12px 16px', marginBottom: 12,
      display: 'flex', alignItems: 'flex-start', gap: 12,
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

// ── Sección amarilla de información faltante (se muestra dentro o fuera del modal) ──
function SeccionInfoFaltante({ edificio, edificioId, es, onDatoGuardado }) {
  const faltante = getInfoFaltante(edificio);
  const [respuestas, setRespuestas] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoOk, setFotoOk] = useState(false);

  // Solo si hay edificio con fotos pero sin info secundaria, o si hay pregunta de foto
  const pregPrincipal = getPreguntaPrioritaria(edificio);
  const faltaFotoEnSec = pregPrincipal === 'foto'; // ya se maneja arriba en rojo, la movemos aquí solo si no es el bloque rojo
  const itemsFaltantes = [
    ...faltante,
    ...(faltaFotoEnSec ? ['foto'] : []),
  ];

  if (itemsFaltantes.length === 0) return null;

  const setResp = (campo, valor) => setRespuestas(p => ({ ...p, [campo]: valor }));

  const guardarRespuestas = async () => {
    if (!edificioId) return;
    setGuardando(true);
    try {
      const updateData = {};
      if (respuestas.acceso_calle) updateData.acceso_calle = respuestas.acceso_calle;
      if (respuestas.gas) updateData.gas = respuestas.gas;
      if (respuestas.electricidad) updateData.electricidad = respuestas.electricidad;
      if (respuestas.agua) updateData.agua = respuestas.agua;

      if (Object.keys(updateData).length > 0) {
        await base44.entities.ReportesDano.update(edificioId, updateData);
      }

      // Foto en background
      if (fotoFile && !fotoOk) {
        (async () => {
          try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file: fotoFile });
            const ed = await base44.entities.ReportesDano.get(edificioId);
            const existentes = ed?.foto_urls || [];
            if (existentes.length < 5) {
              await base44.entities.ReportesDano.update(edificioId, {
                foto_urls: [file_url, ...existentes].slice(0, 5),
              });
            }
            setFotoOk(true);
          } catch {}
        })();
      }

      setGuardado(true);
      if (onDatoGuardado) onDatoGuardado(updateData);
      setTimeout(() => setGuardado(false), 4000);
    } catch {}
    setGuardando(false);
  };

  const hayRespuesta = Object.keys(respuestas).length > 0 || fotoFile;

  const ACCESO_OPTS = [
    { val: 'normal',        es: '✅ Libre', en: '✅ Clear' },
    { val: 'dificultad',    es: '⚠️ Dificultad', en: '⚠️ Difficult' },
    { val: 'solo_peatonal', es: '🚶 Solo a pie', en: '🚶 On foot' },
    { val: 'bloqueada',     es: '🚫 Bloqueada', en: '🚫 Blocked' },
    { val: 'no_sabe',       es: '❓ No sé', en: '❓ Unknown' },
  ];
  const SERV_OPTS = [
    { val: 'disponible',    es: '✅ Disponible', en: '✅ Available' },
    { val: 'no_disponible', es: '❌ Sin servicio', en: '❌ No service' },
    { val: 'intermitente',  es: '⚡ Intermitente', en: '⚡ Intermittent' },
    { val: 'no_confirmado', es: '❓ No sé', en: '❓ Unknown' },
  ];

  return (
    <div style={{
      background: '#1C1200',
      borderTop: 'none',
      padding: '14px 0 0',
    }}>
      {/* Encabezado amarillo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>📋</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            {es ? '¿Puedes completar esta info?' : 'Can you complete this info?'}
          </p>
          <p style={{ fontSize: 11, color: '#FCD34D', margin: 0, fontWeight: 600 }}>
            {es ? 'Ayuda a otros a tomar mejores decisiones' : 'Help others make better decisions'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Acceso a la calle */}
        {faltante.includes('acceso_calle') && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: '0 0 6px' }}>
              🚶 {es ? '¿Cómo está la calle / acceso a pie?' : 'How is the street / foot access?'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {ACCESO_OPTS.map(o => (
                <button key={o.val} onClick={() => setResp('acceso_calle', o.val)} style={{
                  padding: '8px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  background: respuestas.acceso_calle === o.val ? '#D97706' : '#2D1A00',
                  color: '#FFFFFF',
                  border: `2px solid ${respuestas.acceso_calle === o.val ? '#FFFFFF' : '#92400E'}`,
                }}>
                  {es ? o.es : o.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gas */}
        {faltante.includes('gas') && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: '0 0 6px' }}>
              💨 {es ? '¿Hay olor a gas o fuga reportada?' : 'Is there a gas smell or reported leak?'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {[
                { val: 'fuga_reportada', es: '🚨 Sí, hay fuga', en: '🚨 Leak reported' },
                { val: 'suspendido',     es: '🔴 Gas suspendido', en: '🔴 Gas off' },
                { val: 'disponible',     es: '✅ Gas normal', en: '✅ Gas OK' },
                { val: 'no_confirmado',  es: '❓ No sé', en: '❓ Unknown' },
              ].map(o => (
                <button key={o.val} onClick={() => setResp('gas', o.val)} style={{
                  padding: '8px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  background: respuestas.gas === o.val ? '#D97706' : '#2D1A00',
                  color: '#FFFFFF',
                  border: `2px solid ${respuestas.gas === o.val ? '#FFFFFF' : '#92400E'}`,
                }}>
                  {es ? o.es : o.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Electricidad */}
        {faltante.includes('electricidad') && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: '0 0 6px' }}>
              ⚡ {es ? '¿Hay electricidad / cables caídos?' : 'Is there power / fallen wires?'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {SERV_OPTS.map(o => (
                <button key={o.val} onClick={() => setResp('electricidad', o.val)} style={{
                  padding: '8px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  background: respuestas.electricidad === o.val ? '#D97706' : '#2D1A00',
                  color: '#FFFFFF',
                  border: `2px solid ${respuestas.electricidad === o.val ? '#FFFFFF' : '#92400E'}`,
                }}>
                  {es ? o.es : o.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agua */}
        {faltante.includes('agua') && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: '0 0 6px' }}>
              💧 {es ? '¿Hay agua disponible?' : 'Is water available?'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {SERV_OPTS.map(o => (
                <button key={o.val} onClick={() => setResp('agua', o.val)} style={{
                  padding: '8px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  background: respuestas.agua === o.val ? '#D97706' : '#2D1A00',
                  color: '#FFFFFF',
                  border: `2px solid ${respuestas.agua === o.val ? '#FFFFFF' : '#92400E'}`,
                }}>
                  {es ? o.es : o.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Foto de fachada (si no hay foto y no se capturó en el bloque rojo) */}
        {faltaFotoEnSec && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: '0 0 6px' }}>
              📷 {es ? '¿Tienes foto del edificio (desde lugar seguro)?' : 'Do you have a building photo (from safe location)?'}
            </p>
            {!fotoFile ? (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                border: '1.5px dashed rgba(251,146,60,0.45)', borderRadius: 10,
                padding: '10px 0', cursor: 'pointer', fontSize: 11, color: '#FDE68A', fontWeight: 600,
                background: 'rgba(180,83,9,0.08)',
              }}>
                <Camera size={14} />
                {es ? 'Seleccionar foto (opcional)' : 'Select photo (optional)'}
                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setFotoFile(e.target.files[0]); }} />
              </label>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={URL.createObjectURL(fotoFile)} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#86EFAC', margin: 0, fontWeight: 600 }}>✅ {es ? 'Lista para subir' : 'Ready to upload'}</p>
                  <button onClick={() => setFotoFile(null)} style={{ fontSize: 10, color: 'rgba(253,230,138,0.55)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {es ? 'Quitar' : 'Remove'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón guardar */}
      {hayRespuesta && !guardado && (
        <button onClick={guardarRespuestas} disabled={guardando} style={{
          marginTop: 14, width: '100%', padding: '13px 0', borderRadius: 12,
          fontSize: 13, fontWeight: 800, cursor: guardando ? 'default' : 'pointer',
          background: guardando ? '#92400E' : '#D97706',
          color: '#FFFFFF', border: '2px solid #FCD34D',
        }}>
          {guardando ? (es ? 'Guardando...' : 'Saving...') : `📡 ${es ? 'Enviar información' : 'Send info'}`}
        </button>
      )}
      {guardado && (
        <p style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#86EFAC', textAlign: 'center' }}>
          ✅ {es ? '¡Gracias! Información guardada.' : 'Thanks! Info saved.'}
        </p>
      )}
      <p style={{ fontSize: 11, color: '#FCD34D', margin: '10px 0 0', textAlign: 'center', fontWeight: 500 }}>
        {es ? 'Solo responde si estás seguro/a. "No sé" también ayuda.' : 'Only answer if you are sure. "Unknown" also helps.'}
      </p>
    </div>
  );
}

// ── Modal principal con sección roja de seguridad + sección amarilla integrada ──
export function ModalSeguridadEdificio({ visible, onConfirmar, onCerrar, es, preguntaPrioritaria, edificioId, onRespuestaPrioritaria, edificio }) {
  const [respAtrapados, setRespAtrapados] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoOk, setFotoOk] = useState(false);

  if (!visible) return null;

  // El modal requiere respuesta de atrapados para continuar (si aplica)
  const puedeConfirmar = preguntaPrioritaria === 'atrapados' ? !!respAtrapados : true;
  // ¿Hay info faltante secundaria que mostrar en amarillo?
  const infoFaltante = edificio ? getInfoFaltante(edificio) : [];
  // La foto se muestra en amarillo solo si NO se está pidiendo en el bloque rojo
  const mostrarFotoEnAmarillo = preguntaPrioritaria === 'foto';
  const haySeccionAmarilla = infoFaltante.length > 0 || mostrarFotoEnAmarillo;

  const handleConfirmar = () => {
    if (preguntaPrioritaria === 'atrapados' && respAtrapados && onRespuestaPrioritaria) {
      onRespuestaPrioritaria({ atrapados: respAtrapados });
    }
    if (fotoFile && edificioId && !fotoOk) {
      subirFotoBackground(fotoFile, edificioId, setFotoOk);
    }
    onConfirmar();
  };

  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
      zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        maxWidth: 520, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 0,
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* ── TARJETA ROJA: Seguridad ── */}
        <div style={{
          background: '#1A0000',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 20px',
          border: '2px solid #EF4444',
          borderBottom: '1px solid #7F1D1D',
          boxShadow: '0 -8px 40px rgba(239,68,68,0.40)',
        }}>
          <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, margin: '0 auto 20px' }} />
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>⚠️</span>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {es ? 'Advertencia de seguridad' : 'Safety warning'}
            </p>
            <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0, fontWeight: 600 }}>
              {es ? 'Lee esto antes de continuar' : 'Read this before continuing'}
            </p>
          </div>

          <div style={{ background: '#7F1D1D', border: '2px solid #EF4444', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 800, margin: '0 0 4px' }}>
              🚫 {es ? 'NO ENTRAR a la estructura' : 'DO NOT ENTER the structure'}
            </p>
            <p style={{ fontSize: 12, color: '#FEE2E2', lineHeight: 1.55, margin: 0 }}>
              {es
                ? 'No entres a edificios dañados. Espera a Protección Civil, Bomberos o rescatistas autorizados.'
                : 'Do not enter damaged buildings. Wait for Civil Protection, Firefighters, or authorized rescue teams.'}
            </p>
          </div>

          {/* Pregunta roja prioritaria: atrapados */}
          {preguntaPrioritaria === 'atrapados' && (
            <div style={{ background: '#450A0A', border: '2px solid #EF4444', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#FCA5A5', margin: '0 0 8px' }}>
                🆘 {es ? 'Pregunta urgente — responde si sabes' : 'Urgent question — answer if you know'}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.45 }}>
                {es ? '¿Sabes si hay personas atrapadas con vida en este edificio?' : 'Do you know if there are people trapped alive in this building?'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { val: 'si',      es: '🚨 Sí, hay atrapados',    en: '🚨 Yes, trapped' },
                  { val: 'voces',   es: '👂 Escuché voces/golpes', en: '👂 Heard voices' },
                  { val: 'no',      es: '✅ No hay atrapados',     en: '✅ No trapped' },
                  { val: 'no_sabe', es: '❓ No sé',                en: "❓ I don't know" },
                ].map(op => (
                  <button key={op.val} onClick={() => setRespAtrapados(op.val)} style={{
                    padding: '11px 8px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', textAlign: 'left',
                    background: respAtrapados === op.val
                      ? (op.val === 'no' ? '#15803D' : op.val === 'no_sabe' ? '#1F2937' : '#B91C1C')
                      : '#2D0000',
                    color: '#FFFFFF',
                    border: `2px solid ${respAtrapados === op.val ? '#FFFFFF' : '#7F1D1D'}`,
                  }}>
                    {es ? op.es : op.en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Números de emergencia */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
            {EMERGENCIAS.map(e => (
              <a key={e.num} href={`tel:${e.num}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: '#991B1B', border: '2px solid #EF4444', borderRadius: 10, padding: '8px 4px', textDecoration: 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{e.num}</span>
                <span style={{ fontSize: 9, color: '#FCA5A5', fontWeight: 600 }}>{e.op}</span>
              </a>
            ))}
          </div>

          {/* Botón confirmar */}
          <div style={{ marginTop: 16 }}>
            <button onClick={handleConfirmar} disabled={!puedeConfirmar} style={{
              width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 15, fontWeight: 800,
              background: puedeConfirmar ? '#1D4ED8' : '#1F2937',
              color: puedeConfirmar ? '#FFFFFF' : '#6B7280',
              border: puedeConfirmar ? '2px solid #3B82F6' : '2px solid #374151',
              cursor: puedeConfirmar ? 'pointer' : 'default', marginBottom: 10,
            }}>
              ✅ {es ? 'Entendido — Continuar desde lugar seguro' : 'Understood — Continue from a safe location'}
            </button>
            {preguntaPrioritaria === 'atrapados' && !respAtrapados && (
              <p style={{ fontSize: 11, color: '#FCA5A5', textAlign: 'center', margin: '0 0 10px', fontWeight: 600 }}>
                {es ? 'Responde la pregunta para continuar' : 'Answer the question to continue'}
              </p>
            )}
            <button onClick={onCerrar} style={{
              width: '100%', padding: '12px 0', borderRadius: 14, fontSize: 13, fontWeight: 700,
              background: '#111827', color: '#D1D5DB',
              border: '2px solid #374151', cursor: 'pointer',
            }}>
              {es ? 'Cerrar' : 'Close'}
            </button>
          </div>
        </div>{/* fin tarjeta roja */}

        {/* ── TARJETA AMARILLA: Información faltante (debajo, separada) ── */}
        {haySeccionAmarilla && edificio && (
          <div style={{
            background: '#1C1200',
            border: '2px solid #F59E0B',
            borderTop: '1px solid #92400E',
            borderRadius: '0 0 20px 20px',
            padding: '0 20px 28px',
          }}>
            <SeccionInfoFaltante
              edificio={edificio}
              edificioId={edificioId}
              es={es}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bloque amarillo inline en la ficha (sin modal) ──
export function InfoFaltanteInline({ edificio, edificioId, es, faltante, onDatoGuardado }) {
  const [respuestas, setRespuestas] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [expandido, setExpandido] = useState(false);

  const setResp = (campo, valor) => setRespuestas(p => ({ ...p, [campo]: valor }));
  const hayRespuesta = Object.keys(respuestas).length > 0 || fotoFile;

  const guardar = async () => {
    setGuardando(true);
    try {
      const updateData = {};
      if (respuestas.atrapados) updateData.personas_atrapadas = respuestas.atrapados;
      if (respuestas.acceso_calle) updateData.acceso_calle = respuestas.acceso_calle;
      if (respuestas.gas) updateData.gas = respuestas.gas;
      if (respuestas.electricidad) updateData.electricidad = respuestas.electricidad;
      if (respuestas.agua) updateData.agua = respuestas.agua;
      if (Object.keys(updateData).length > 0) {
        await base44.entities.ReportesDano.update(edificioId, updateData);
      }
      if (fotoFile) {
        (async () => {
          try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file: fotoFile });
            const ed = await base44.entities.ReportesDano.get(edificioId);
            const existentes = ed?.foto_urls || [];
            if (existentes.length < 5) {
              const updated = await base44.entities.ReportesDano.update(edificioId, { foto_urls: [file_url, ...existentes].slice(0, 5) });
              if (onDatoGuardado) onDatoGuardado({ foto_urls: updated.foto_urls });
            }
          } catch {}
        })();
      }
      setGuardado(true);
      if (onDatoGuardado) onDatoGuardado(updateData);
      setTimeout(() => setGuardado(false), 4000);
    } catch {}
    setGuardando(false);
  };

  const ACCESO_OPTS = [
    { val: 'normal', es: '✅ Libre', en: '✅ Clear' },
    { val: 'dificultad', es: '⚠️ Dificultad', en: '⚠️ Difficult' },
    { val: 'solo_peatonal', es: '🚶 Solo a pie', en: '🚶 On foot' },
    { val: 'bloqueada', es: '🚫 Bloqueada', en: '🚫 Blocked' },
    { val: 'no_sabe', es: '❓ No sé', en: '❓ Unknown' },
  ];
  const SERV_OPTS = [
    { val: 'disponible', es: '✅ Sí', en: '✅ Yes' },
    { val: 'no_disponible', es: '❌ No', en: '❌ No' },
    { val: 'intermitente', es: '⚡ Intermitente', en: '⚡ Intermittent' },
    { val: 'no_confirmado', es: '❓ No sé', en: '❓ Unknown' },
  ];

  return (
    <div style={{
      background: 'rgba(120,53,15,0.18)',
      border: '2px solid rgba(251,146,60,0.55)',
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Header siempre visible */}
      <button onClick={() => setExpandido(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📋</span>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 900, color: '#FDE68A', margin: 0 }}>
              {es ? `${faltante.length} campo${faltante.length > 1 ? 's' : ''} sin información` : `${faltante.length} field${faltante.length > 1 ? 's' : ''} missing`}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(253,230,138,0.65)', margin: 0 }}>
              {es ? '¿Puedes completarla? Ayuda a otros.' : 'Can you fill this in? Help others.'}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#FDE68A', fontWeight: 700 }}>{expandido ? '▲' : '▼'}</span>
      </button>

      {/* Contenido expandible */}
      {expandido && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {faltante.includes('atrapados') && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FDE68A', margin: '0 0 6px' }}>
                🆘 {es ? '¿Hay personas atrapadas?' : 'Are people trapped?'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[{ val: 'si', es: '🚨 Sí', en: '🚨 Yes' }, { val: 'voces', es: '👂 Voces/golpes', en: '👂 Voices' }, { val: 'no', es: '✅ No', en: '✅ No' }, { val: 'no_sabe', es: '❓ No sé', en: '❓ Unknown' }].map(o => (
                  <button key={o.val} onClick={() => setResp('atrapados', o.val)} style={{
                    padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: respuestas.atrapados === o.val ? '#C0392B' : 'rgba(255,255,255,0.07)',
                    color: '#fff', border: `1.5px solid ${respuestas.atrapados === o.val ? '#C0392B' : 'rgba(251,146,60,0.30)'}`,
                  }}>{es ? o.es : o.en}</button>
                ))}
              </div>
            </div>
          )}

          {faltante.includes('acceso_calle') && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FDE68A', margin: '0 0 6px' }}>
                🚶 {es ? '¿Cómo está la calle?' : 'How is street access?'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ACCESO_OPTS.map(o => (
                  <button key={o.val} onClick={() => setResp('acceso_calle', o.val)} style={{
                    padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: respuestas.acceso_calle === o.val ? '#D97706' : 'rgba(255,255,255,0.07)',
                    color: '#fff', border: `1.5px solid ${respuestas.acceso_calle === o.val ? '#D97706' : 'rgba(251,146,60,0.30)'}`,
                  }}>{es ? o.es : o.en}</button>
                ))}
              </div>
            </div>
          )}

          {faltante.includes('gas') && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FDE68A', margin: '0 0 6px' }}>
                💨 {es ? '¿Hay olor a gas?' : 'Gas smell?'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[{ val: 'fuga_reportada', es: '🚨 Fuga', en: '🚨 Leak' }, { val: 'suspendido', es: '🔴 Suspendido', en: '🔴 Off' }, { val: 'disponible', es: '✅ Normal', en: '✅ OK' }, { val: 'no_confirmado', es: '❓ No sé', en: '❓ Unknown' }].map(o => (
                  <button key={o.val} onClick={() => setResp('gas', o.val)} style={{
                    padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: respuestas.gas === o.val ? '#D97706' : 'rgba(255,255,255,0.07)',
                    color: '#fff', border: `1.5px solid ${respuestas.gas === o.val ? '#D97706' : 'rgba(251,146,60,0.30)'}`,
                  }}>{es ? o.es : o.en}</button>
                ))}
              </div>
            </div>
          )}

          {faltante.includes('electricidad') && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FDE68A', margin: '0 0 6px' }}>
                ⚡ {es ? '¿Hay electricidad?' : 'Is there power?'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {SERV_OPTS.map(o => (
                  <button key={o.val} onClick={() => setResp('electricidad', o.val)} style={{
                    padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: respuestas.electricidad === o.val ? '#D97706' : 'rgba(255,255,255,0.07)',
                    color: '#fff', border: `1.5px solid ${respuestas.electricidad === o.val ? '#D97706' : 'rgba(251,146,60,0.30)'}`,
                  }}>{es ? o.es : o.en}</button>
                ))}
              </div>
            </div>
          )}

          {faltante.includes('agua') && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FDE68A', margin: '0 0 6px' }}>
                💧 {es ? '¿Hay agua?' : 'Is there water?'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {SERV_OPTS.map(o => (
                  <button key={o.val} onClick={() => setResp('agua', o.val)} style={{
                    padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: respuestas.agua === o.val ? '#D97706' : 'rgba(255,255,255,0.07)',
                    color: '#fff', border: `1.5px solid ${respuestas.agua === o.val ? '#D97706' : 'rgba(251,146,60,0.30)'}`,
                  }}>{es ? o.es : o.en}</button>
                ))}
              </div>
            </div>
          )}

          {faltante.includes('foto') && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FDE68A', margin: '0 0 6px' }}>
                📷 {es ? '¿Tienes foto del edificio?' : 'Do you have a building photo?'}
              </p>
              {!fotoFile ? (
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: '1.5px dashed rgba(251,146,60,0.45)', borderRadius: 10,
                  padding: '10px 0', cursor: 'pointer', fontSize: 11, color: '#FDE68A', fontWeight: 600,
                  background: 'rgba(180,83,9,0.08)',
                }}>
                  <Camera size={14} />
                  {es ? 'Subir foto (opcional)' : 'Upload photo (optional)'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setFotoFile(e.target.files[0]); }} />
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={URL.createObjectURL(fotoFile)} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                  <p style={{ fontSize: 11, color: '#86EFAC', margin: 0, fontWeight: 600 }}>✅ {es ? 'Lista' : 'Ready'}</p>
                  <button onClick={() => setFotoFile(null)} style={{ fontSize: 10, color: 'rgba(253,230,138,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}>{es ? 'Quitar' : 'Remove'}</button>
                </div>
              )}
            </div>
          )}

          {guardado ? (
            <p style={{ fontSize: 12, fontWeight: 700, color: '#86EFAC', textAlign: 'center', margin: 0 }}>
              ✅ {es ? '¡Gracias! Guardado.' : 'Thanks! Saved.'}
            </p>
          ) : hayRespuesta && (
            <button onClick={guardar} disabled={guardando} style={{
              width: '100%', padding: '11px 0', borderRadius: 12,
              fontSize: 12, fontWeight: 800, cursor: guardando ? 'default' : 'pointer',
              background: guardando ? 'rgba(217,119,6,0.4)' : '#D97706',
              color: '#fff', border: 'none',
            }}>
              {guardando ? (es ? 'Guardando...' : 'Saving...') : `📡 ${es ? 'Enviar información' : 'Send info'}`}
            </button>
          )}
          <p style={{ fontSize: 10, color: 'rgba(253,230,138,0.40)', textAlign: 'center', margin: 0 }}>
            {es ? '"No sé" también ayuda.' : '"Unknown" also helps.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper fuera del componente para no recrear en cada render
async function subirFotoBackground(file, id, setFotoOk) {
  try {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const edificio = await base44.entities.ReportesDano.get(id);
    const fotosActuales = edificio?.foto_urls || [];
    if (fotosActuales.length < 5) {
      await base44.entities.ReportesDano.update(id, {
        foto_urls: [file_url, ...fotosActuales].slice(0, 5),
      });
    }
    if (setFotoOk) setFotoOk(true);
  } catch {}
}