import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, UserPlus, ChevronDown, ChevronUp, Phone, Mail, Users, AlertTriangle, X } from 'lucide-react';

// ── Entidad usada: PersonaCRIS (vinculada a edificio_id) ──
// Campos clave: nombre, estado_actual, ubicacion_texto (ubic. dentro del edificio),
//   avisar_nombre, avisar_telefono, avisar_email, avisar_relacion, avisar_mensaje,
//   notas_publicas, fuente_inicial

const ESTADO_OPTS = [
  { val: 'necesita_ayuda',         es: '🆘 Atrapada con vida — necesita rescate urgente', en: '🆘 Trapped alive — urgent rescue needed', color: '#DC2626', urgente: true },
  { val: 'atencion_urgente',       es: '🚑 Atrapada / necesita atención médica urgente',  en: '🚑 Trapped / needs urgent medical care',   color: '#EA580C', urgente: true },
  { val: 'herido',                 es: '🩹 Herida / lesionada — localización conocida',   en: '🩹 Injured — location known',               color: '#D97706', urgente: false },
  { val: 'buscado_por_familiar',   es: '🔍 Atrapada desaparecida — sin contacto',         en: '🔍 Trapped missing — no contact',           color: '#7C3AED', urgente: true },
  { val: 'estoy_aqui',             es: '📍 Estoy aquí — dentro del edificio',             en: '📍 I am here — inside the building',         color: '#2563EB', urgente: false },
  { val: 'a_salvo',                es: '✅ Fue rescatada / está a salvo',                 en: '✅ Rescued / is safe',                       color: '#16A34A', urgente: false },
  { val: 'informacion_incompleta', es: '❓ No confirmado / información parcial',          en: '❓ Unconfirmed / partial info',              color: '#6B7280', urgente: false },
];

const RELACION_OPTS = [
  { val: 'familiar',   es: 'Familiar directo',  en: 'Direct family'   },
  { val: 'vecino',     es: 'Vecino/a',          en: 'Neighbor'        },
  { val: 'amigo',      es: 'Amigo/a',           en: 'Friend'          },
  { val: 'voluntario', es: 'Voluntario (cargo info)', en: 'Volunteer (reporting)' },
  { val: 'otro',       es: 'Otro',              en: 'Other'           },
];

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400";

// Estado preseleccionado por defecto: atrapada con vida (máxima urgencia)
const FORM_INIT = {
  nombre: '', estado: 'necesita_ayuda', ubicacion_dentro: '',
  avisar_nombre: '', avisar_telefono: '', avisar_email: '', avisar_relacion: '', avisar_mensaje: '',
  notas: '', fuente: '',
};

function PersonaCard({ persona, es }) {
  const [expanded, setExpanded] = useState(false);
  const est = ESTADO_OPTS.find(e => e.val === persona.estado_actual) || ESTADO_OPTS[ESTADO_OPTS.length - 1];
  const esUrgente = ['necesita_ayuda', 'atencion_urgente'].includes(persona.estado_actual);

  return (
    <div style={{
      border: `1.5px solid ${esUrgente ? '#FCA5A5' : '#E5E7EB'}`,
      borderRadius: 12, background: esUrgente ? '#FFF5F5' : '#FAFAFA',
      marginBottom: 8, overflow: 'hidden',
    }}>
      <button onClick={() => setExpanded(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#fff', background: est.color,
            borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {es ? est.es.split(' ').slice(0, 3).join(' ') : est.en.split(' ').slice(0, 3).join(' ')}
          </span>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {persona.nombre || (es ? 'Persona sin nombre' : 'Unnamed person')}
          </p>
        </div>
        <span style={{ color: '#9CA3AF', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #F3F4F6' }}>
          {persona.ubicacion_texto && (
            <p style={{ fontSize: 11, color: '#6B7280', margin: '8px 0 4px' }}>
              📍 {es ? 'Ubicación en el edificio:' : 'Location in building:'} <strong style={{ color: '#374151' }}>{persona.ubicacion_texto}</strong>
            </p>
          )}
          {persona.notas_publicas && (
            <p style={{ fontSize: 11, color: '#111827', margin: '4px 0', background: '#F3F4F6', borderRadius: 8, padding: '6px 10px', lineHeight: 1.5 }}>
              {persona.notas_publicas}
            </p>
          )}
          {/* Contacto de aviso — visible solo si hay nombre (no datos sensibles) */}
          {persona.avisar_nombre && (
            <p style={{ fontSize: 11, color: '#374151', margin: '6px 0 2px' }}>
              👤 {es ? 'Contacto familiar:' : 'Family contact:'} <strong style={{ color: '#111827' }}>{persona.avisar_nombre}</strong>
              {persona.avisar_relacion && <span style={{ color: '#6B7280' }}> ({persona.avisar_relacion})</span>}
            </p>
          )}
          {persona.fuente_inicial && (
            <p style={{ fontSize: 10, color: '#6B7280', margin: '4px 0 0' }}>
              🔎 {es ? 'Fuente:' : 'Source:'} {persona.fuente_inicial}
            </p>
          )}
          <p style={{ fontSize: 10, color: '#6B7280', margin: '4px 0 0' }}>
            🕐 {new Date(persona.created_date).toLocaleDateString(es ? 'es-VE' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}

export default function PersonasEnEdificio({ edificioId, edificio, es }) {
  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const t = (esStr, enStr) => es ? esStr : enStr;

  useEffect(() => {
    if (!edificioId) return;
    base44.entities.PersonaCRIS.filter({ ubicacion_texto: edificioId }, '-created_date', 50)
      .then(data => setPersonas(data || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [edificioId]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const totalUrgentes = personas.filter(p => ['necesita_ayuda', 'atencion_urgente', 'herido'].includes(p.estado_actual)).length;
  const totalASalvo = personas.filter(p => p.estado_actual === 'a_salvo').length;

  const handleEnviar = async () => {
    if (!form.nombre.trim() && !form.notas.trim()) {
      setError(t('Agrega al menos el nombre o una descripción de la persona.', 'Add at least a name or description of the person.'));
      return;
    }
    if (!form.estado) {
      setError(t('Selecciona el estado de la persona.', 'Select the status of the person.'));
      return;
    }
    setError('');
    setEnviando(true);
    try {
      // Usamos ubicacion_texto como referencia al edificioId para poder filtrar
      // y ubicacion_dentro como descripción del lugar dentro del edificio
      const nueva = await base44.entities.PersonaCRIS.create({
        nombre: form.nombre.trim() || undefined,
        estado_actual: form.estado,
        ubicacion_texto: edificioId, // vinculación al edificio
        ultima_ubicacion_conocida: [edificio?.nombre_lugar, edificio?.direccion, edificio?.ciudad].filter(Boolean).join(', '),
        notas_publicas: [form.ubicacion_dentro ? `Ubicación: ${form.ubicacion_dentro}` : '', form.notas].filter(Boolean).join(' | ') || undefined,
        avisar_nombre: form.avisar_nombre.trim() || undefined,
        avisar_telefono: form.avisar_telefono.trim() || undefined,
        avisar_email: form.avisar_email.trim() || undefined,
        avisar_relacion: form.avisar_relacion || undefined,
        avisar_mensaje: form.avisar_mensaje.trim() || undefined,
        fuente_inicial: form.fuente.trim() || 'ciudadano',
        ciudad: edificio?.ciudad,
        estado_region: edificio?.estado_region,
        nivel_verificacion: 'sin_verificar',
      });

      // Siempre suscribir al familiar si dejó email
      if (form.avisar_email.trim()) {
        base44.functions.invoke('registrarSuscripcionEdificio', {
          edificio_id: edificioId,
          email: form.avisar_email.trim(),
          nombre: form.avisar_nombre.trim() || undefined,
          lang: es ? 'es' : 'en',
        }).catch(() => {});

        // Enviar email de apoyo al familiar
        base44.functions.invoke('emailApoyoFamiliar', {
          email_familiar: form.avisar_email.trim(),
          nombre_persona: form.nombre.trim() || undefined,
          estado: form.estado,
          edificio_id: edificioId,
          nombre_edificio: edificio?.nombre_lugar,
          direccion: edificio?.direccion,
          ciudad: edificio?.ciudad,
          lang: es ? 'es' : 'en',
        }).catch(() => {});
      }

      setPersonas(prev => [nueva, ...prev]);
      setForm(FORM_INIT);
      setMostrarForm(false);
      setEnviado(true);
      setTimeout(() => setEnviado(false), 5000);
    } catch (e) {
      setError(t('Error al guardar. Intenta de nuevo.', 'Error saving. Please try again.'));
    }
    setEnviando(false);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} style={{ color: '#7C3AED', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: 0 }}>
              {t('Personas reportadas en este edificio', 'People reported in this building')}
            </p>
            {!cargando && personas.length > 0 && (
              <p style={{ fontSize: 10, color: '#4B5563', margin: 0 }}>
                {personas.length} {t('registro(s)', 'record(s)')}
                {totalUrgentes > 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}> · {totalUrgentes} {t('urgente(s)', 'urgent')}</span>}
                {totalASalvo > 0 && <span style={{ color: '#16A34A', fontWeight: 700 }}> · {totalASalvo} {t('a salvo', 'safe')}</span>}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => { setMostrarForm(v => !v); setError(''); }} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: mostrarForm ? '#F3F4F6' : '#7C3AED', color: mostrarForm ? '#374151' : '#fff',
          border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          {mostrarForm ? <X size={13} /> : <UserPlus size={13} />}
          {mostrarForm ? t('Cancelar', 'Cancel') : t('Reportar persona', 'Report person')}
        </button>
      </div>

      {/* Aviso anti-extorsión */}
      <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }}>
        <p style={{ fontSize: 10, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
          ⚠️ {t('Nunca envíes dinero a cambio de información. No publiques datos médicos sensibles ni documentos de identidad.',
                 'Never send money in exchange for information. Do not publish sensitive medical data or identity documents.')}
        </p>
      </div>

      {/* Confirmación enviado */}
      {enviado && (
        <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#15803D', margin: '0 0 6px' }}>
            ✅ {t('Registro guardado correctamente.', 'Record saved successfully.')}
          </p>
          <p style={{ fontSize: 12, color: '#166534', margin: 0, lineHeight: 1.6 }}>
            📧 {t(
              'El familiar registrado recibirá un email de apoyo y quedará suscrito automáticamente a las actualizaciones de este edificio. No estás solo/a — estamos ayudando.',
              'The registered family contact will receive a support email and will be automatically subscribed to building updates. You are not alone — we are helping.'
            )}
          </p>
        </div>
      )}

      {/* Formulario de registro */}
      {mostrarForm && (
        <div style={{ background: '#F9FAFB', border: '1.5px solid #DDD6FE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#5B21B6', margin: '0 0 12px' }}>
            {t('Registrar persona en este edificio', 'Register a person in this building')}
          </p>
          <p style={{ fontSize: 11, color: '#4B5563', margin: '0 0 12px', lineHeight: 1.5 }}>
            {t('Solo registra lo que sabes con certeza. Los datos del familiar NO se muestran públicamente.',
               'Only register what you know for sure. Family contact data is NOT shown publicly.')}
          </p>

          {/* Sección A: Datos de la persona */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('A · Datos de la persona', 'A · Person details')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={form.nombre} onChange={e => setF('nombre', e.target.value)}
                placeholder={t('Nombre completo (o "Persona desconocida")', 'Full name (or "Unknown person")')}
                className={inputCls}
              />
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
                  {t('Estado de la persona', 'Person status')} <span style={{ color: '#EF4444' }}>*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {ESTADO_OPTS.map(opt => (
                    <button key={opt.val} onClick={() => setF('estado', opt.val)} style={{
                      padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                      background: form.estado === opt.val ? opt.color : '#F9FAFB',
                      color: form.estado === opt.val ? '#fff' : '#374151',
                      border: `1.5px solid ${form.estado === opt.val ? opt.color : '#E5E7EB'}`,
                    }}>
                      {es ? opt.es : opt.en}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={form.ubicacion_dentro} onChange={e => setF('ubicacion_dentro', e.target.value)}
                placeholder={t('Ubicación dentro del edificio (piso, apartamento, sótano...)', 'Location in building (floor, unit, basement...)')}
                className={inputCls}
              />
              <textarea
                rows={2} value={form.notas} onChange={e => setF('notas', e.target.value)}
                placeholder={t('Notas adicionales (sin datos médicos ni documentos sensibles)', 'Additional notes (no medical data or sensitive documents)')}
                style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', color: '#111827', resize: 'none', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
              />
              <input
                value={form.fuente} onChange={e => setF('fuente', e.target.value)}
                placeholder={t('Fuente del reporte (WhatsApp, testigo, vecino...)', 'Report source (WhatsApp, witness, neighbor...)')}
                className={inputCls}
              />
            </div>
          </div>

          {/* Banner urgente si es atrapada */}
          {ESTADO_OPTS.find(e => e.val === form.estado)?.urgente && (
            <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🆘</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', margin: 0, lineHeight: 1.55 }}>
                {t('Estado urgente seleccionado. El familiar recibirá un email de apoyo inmediato con actualizaciones automáticas.',
                   'Urgent status selected. The family contact will receive an immediate support email with automatic updates.')}
              </p>
            </div>
          )}

          {/* Sección B: Contacto familiar/responsable */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('B · Familiar o responsable a notificar', 'B · Family / contact to notify')}
            </p>
            <p style={{ fontSize: 10, color: '#1D4ED8', margin: '0 0 10px', lineHeight: 1.6, fontWeight: 500 }}>
              🔒 {t('Datos privados — no se muestran públicamente.', 'Private data — not shown publicly.')}<br />
              📧 {t('Si dejas un email, el familiar recibirá un mensaje de apoyo inmediato y quedará suscrito automáticamente a todas las actualizaciones de este edificio.',
                    'If you provide an email, the contact will receive an immediate support message and be automatically subscribed to all updates for this building.')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={form.avisar_nombre} onChange={e => setF('avisar_nombre', e.target.value)}
                placeholder={t('Nombre del familiar o responsable', 'Name of family member or contact')}
                className={inputCls}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  value={form.avisar_telefono} onChange={e => setF('avisar_telefono', e.target.value)}
                  placeholder={t('Teléfono / WhatsApp', 'Phone / WhatsApp')}
                  className={inputCls}
                />
                <input
                  value={form.avisar_email} onChange={e => setF('avisar_email', e.target.value)}
                  type="email"
                  placeholder={t('Email del familiar', 'Family email')}
                  className={inputCls}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#1E40AF', margin: '0 0 5px' }}>
                  {t('Relación con la persona', 'Relationship to the person')}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {RELACION_OPTS.map(r => (
                    <button key={r.val} onClick={() => setF('avisar_relacion', r.val)} style={{
                      padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: form.avisar_relacion === r.val ? '#1D4ED8' : '#fff',
                      color: form.avisar_relacion === r.val ? '#fff' : '#374151',
                      border: `1.5px solid ${form.avisar_relacion === r.val ? '#1D4ED8' : '#D1D5DB'}`,
                    }}>
                      {es ? r.es : r.en}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2} value={form.avisar_mensaje} onChange={e => setF('avisar_mensaje', e.target.value)}
                placeholder={t('Mensaje para el familiar (opcional, privado)', 'Message for family (optional, private)')}
                style={{ width: '100%', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', color: '#111827', resize: 'none', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
              />
            </div>
          </div>

          {/* Nota para voluntarios */}
          {form.avisar_relacion === 'voluntario' && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                ℹ️ {t('Como voluntario, no quedas inscrito como contacto principal. El sistema diferencia entre quien reporta y quien recibe actualizaciones.',
                      'As a volunteer, you are not registered as the main contact. The system differentiates between the reporter and the one who receives updates.')}
              </p>
            </div>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: '#DC2626', margin: 0, fontWeight: 600 }}>⚠️ {error}</p>
            </div>
          )}

          <button onClick={handleEnviar} disabled={enviando} style={{
            width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 800,
            background: enviando ? '#A78BFA' : '#7C3AED', color: '#fff', border: 'none', cursor: enviando ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {enviando ? t('Guardando...', 'Saving...') : t('Guardar registro de persona', 'Save person record')}
          </button>
        </div>
      )}

      {/* Lista de personas */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9CA3AF', fontSize: 13 }}>
          <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />
          {t('Cargando...', 'Loading...')}
        </div>
      ) : personas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            {t('Sin personas registradas aún en este edificio.', 'No people registered yet in this building.')}
          </p>
          <p style={{ fontSize: 11, color: '#7C3AED', margin: '4px 0 0' }}>
            {t('Si sabes de alguien aquí, usa el botón de arriba.', 'If you know someone here, use the button above.')}
          </p>
        </div>
      ) : (
        <div>
          {/* Resumen urgentes */}
          {totalUrgentes > 0 && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', margin: 0 }}>
                🆘 {totalUrgentes} {t('persona(s) marcada(s) como urgente o que necesita ayuda', 'person(s) marked as urgent or needing help')}
              </p>
            </div>
          )}
          {personas.map(p => (
            <PersonaCard key={p.id} persona={p} es={es} />
          ))}
        </div>
      )}
    </div>
  );
}