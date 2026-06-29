import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RESCATE_OPTS = [
  { val: 'no_presente',             es: '❌ No hay — ningún equipo en sitio',      en: '❌ None — no team on site'           },
  { val: 'en_camino',               es: '🚐 En camino — llegarán pronto',          en: '🚐 En route — arriving soon'         },
  { val: 'trabajando',              es: '🔴 Activos — trabajando ahora',            en: '🔴 Active — working now'             },
  { val: 'finalizado',              es: '✅ Finalizaron — operación cerrada',       en: '✅ Finished — operation closed'      },
  { val: 'requiere_apoyo_adicional',es: '🆘 Necesita más apoyo urgente',           en: '🆘 Needs additional support urgently'},
  { val: 'no_confirmado',           es: '❓ No sé',                                 en: '❓ Unknown'                          },
];

const MAQUINARIA_OPTS = [
  { val: 'no_requerida',            es: '✅ No se necesita',                       en: '✅ Not needed'                       },
  { val: 'requerida_no_disponible', es: '🆘 Se necesita — NO hay en sitio',        en: '🆘 Needed — NOT available'           },
  { val: 'en_camino',               es: '🚛 En camino al sitio',                   en: '🚛 On its way'                       },
  { val: 'en_sitio',                es: '✅ Ya está en el sitio',                  en: '✅ Already on site'                  },
  { val: 'no_confirmado',           es: '❓ No sé',                                 en: '❓ Unknown'                          },
];

const TIPOS_MAQ = [
  { val: 'retroexcavadora',    es: '🚜 Retroexcavadora',       en: '🚜 Excavator'         },
  { val: 'grua',               es: '🏗️ Grúa',                 en: '🏗️ Crane'            },
  { val: 'ambulancia_rescate', es: '🚑 Ambulancia rescate',    en: '🚑 Rescue ambulance'  },
  { val: 'unidad_hidraulica',  es: '🔧 Unidad hidráulica',     en: '🔧 Hydraulic unit'    },
  { val: 'generador',          es: '🔌 Generador',              en: '🔌 Generator'         },
  { val: 'iluminacion',        es: '💡 Iluminación',            en: '💡 Lighting'          },
  { val: 'camion_escombros',   es: '🚛 Camión escombros',       en: '🚛 Debris truck'      },
  { val: 'otro',               es: '🔩 Otro',                   en: '🔩 Other'             },
];

const RECURSOS_OPTS = [
  { val: 'voluntarios',         es: '🙋 Voluntarios',          en: '🙋 Volunteers'        },
  { val: 'medicos',             es: '👨‍⚕️ Médicos',            en: '👨‍⚕️ Doctors'         },
  { val: 'enfermeros',          es: '🩺 Enfermeros',           en: '🩺 Nurses'            },
  { val: 'agua_potable',        es: '💧 Agua potable',         en: '💧 Drinking water'    },
  { val: 'medicamentos',        es: '💊 Medicamentos',         en: '💊 Medication'        },
  { val: 'camillas',            es: '🛏️ Camillas',             en: '🛏️ Stretchers'       },
  { val: 'cuerdas_rescate',     es: '🪢 Cuerdas / arneses',    en: '🪢 Ropes / harnesses' },
  { val: 'equipo_comunicacion', es: '📡 Comunicación',          en: '📡 Communication'     },
  { val: 'comida',              es: '🍱 Comida',               en: '🍱 Food'              },
  { val: 'otro',                es: '➕ Otro',                  en: '➕ Other'             },
];

function toggleArr(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function PanelRescateInline({ edificioId, edificio, es, onGuardado }) {
  const [expandido, setExpandido] = useState(false);
  const [form, setForm] = useState({
    estado_rescate: '',
    rescate_institucion: '',
    rescate_notas: '',
    estado_maquinaria: '',
    tipos_maquinaria_req: [],
    recursos_adicionales_req: [],
    maquinaria_notas: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const hayDato = form.estado_rescate || form.estado_maquinaria ||
    form.tipos_maquinaria_req.length > 0 || form.recursos_adicionales_req.length > 0;

  const guardar = async () => {
    if (!hayDato) return;
    setGuardando(true);
    try {
      await base44.entities.EstadoOperativoEdificio.create({
        edificio_id: edificioId,
        estado_rescate: form.estado_rescate || undefined,
        rescate_institucion: form.rescate_institucion || undefined,
        rescate_notas: form.rescate_notas || undefined,
        estado_maquinaria: form.estado_maquinaria || undefined,
        tipos_maquinaria_req: form.tipos_maquinaria_req.length > 0 ? form.tipos_maquinaria_req : undefined,
        recursos_adicionales_req: form.recursos_adicionales_req.length > 0 ? form.recursos_adicionales_req : undefined,
        maquinaria_notas: form.maquinaria_notas || undefined,
        fuente: 'ciudadano',
      });

      // Registrar urgencia en historial del sitio si requiere apoyo adicional
      if (form.estado_rescate === 'requiere_apoyo_adicional' || form.estado_maquinaria === 'requerida_no_disponible') {
        await base44.entities.ActualizacionesSitios.create({
          sitio_id: edificioId,
          tipo_sitio: 'edificio',
          tipo_accion: 'reportar_urgencia',
          descripcion: es
            ? `Urgencia: ${form.estado_rescate === 'requiere_apoyo_adicional' ? 'Rescate necesita apoyo adicional' : ''} ${form.estado_maquinaria === 'requerida_no_disponible' ? '· Maquinaria requerida no disponible' : ''}`.trim()
            : `Urgent: ${form.estado_rescate === 'requiere_apoyo_adicional' ? 'Rescue needs additional support' : ''} ${form.estado_maquinaria === 'requerida_no_disponible' ? '· Machinery needed not available' : ''}`.trim(),
          fuente: 'ciudadano',
        });
        // Actualizar prioridad del edificio a crítica
        await base44.entities.ReportesDano.update(edificioId, { prioridad: 'critica' });
      }

      setGuardado(true);
      setExpandido(false);
      if (onGuardado) onGuardado();
    } catch {}
    setGuardando(false);
  };

  if (guardado) return (
    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', margin: 0 }}>
        ✅ {es ? '¡Gracias! Info de rescate guardada.' : 'Thanks! Rescue info saved.'}
      </p>
    </div>
  );

  return (
    <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
      {/* Header toggle */}
      <button onClick={() => setExpandido(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🚒</span>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#374151', margin: 0 }}>
              {es ? '¿Hay rescatistas o maquinaria en el lugar?' : 'Are there rescue teams or machinery on site?'}
            </p>
            <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>
              {es ? 'Ayuda a coordinar la respuesta de emergencia.' : 'Help coordinate the emergency response.'}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>{expandido ? '▲' : '▼'}</span>
      </button>

      {expandido && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Sección A: Rescate */}
          <div style={{ paddingTop: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              🚒 {es ? '¿Hay equipos de rescate en el sitio?' : 'Are rescue teams at the site?'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {RESCATE_OPTS.map(o => (
                <button key={o.val} onClick={() => set('estado_rescate', o.val)} style={{
                  padding: '8px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                  background: form.estado_rescate === o.val ? (o.val === 'requiere_apoyo_adicional' ? '#dc2626' : '#2563eb') : '#ffffff',
                  color: form.estado_rescate === o.val ? '#fff' : '#374151',
                  border: `1.5px solid ${form.estado_rescate === o.val ? (o.val === 'requiere_apoyo_adicional' ? '#dc2626' : '#2563eb') : '#e5e7eb'}`,
                }}>{es ? o.es : o.en}</button>
              ))}
            </div>
            {form.estado_rescate === 'requiere_apoyo_adicional' && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '8px 12px', marginTop: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', margin: 0 }}>
                  🆘 {es ? 'Se registrará como urgencia crítica.' : 'Will be logged as critical urgency.'}
                </p>
              </div>
            )}
            {(form.estado_rescate && form.estado_rescate !== 'no_confirmado' && form.estado_rescate !== 'no_presente') && (
              <input value={form.rescate_institucion} onChange={e => set('rescate_institucion', e.target.value)}
                placeholder={es ? 'Equipo / institución (ej: Bomberos Caracas)' : 'Team / institution (e.g. Fire Dept Caracas)'}
                style={{ width: '100%', marginTop: 6, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 11px', fontSize: 12, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            )}
          </div>

          {/* Sección B: Maquinaria */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              🏗️ {es ? '¿Se necesita maquinaria pesada?' : 'Is heavy machinery needed?'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {MAQUINARIA_OPTS.map(o => (
                <button key={o.val} onClick={() => set('estado_maquinaria', o.val)} style={{
                  padding: '8px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                  background: form.estado_maquinaria === o.val ? (o.val === 'requerida_no_disponible' ? '#dc2626' : '#2563eb') : '#ffffff',
                  color: form.estado_maquinaria === o.val ? '#fff' : '#374151',
                  border: `1.5px solid ${form.estado_maquinaria === o.val ? (o.val === 'requerida_no_disponible' ? '#dc2626' : '#2563eb') : '#e5e7eb'}`,
                }}>{es ? o.es : o.en}</button>
              ))}
            </div>
          </div>

          {/* Tipos de maquinaria — solo si requerida */}
          {(form.estado_maquinaria === 'requerida_no_disponible' || form.estado_maquinaria === 'en_camino') && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
                {es ? '¿Qué tipo de maquinaria? (selecciona todas)' : 'What type of machinery? (select all that apply)'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {TIPOS_MAQ.map(o => {
                  const sel = form.tipos_maquinaria_req.includes(o.val);
                  return (
                    <button key={o.val} onClick={() => set('tipos_maquinaria_req', toggleArr(form.tipos_maquinaria_req, o.val))} style={{
                      padding: '7px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                      background: sel ? '#2563eb' : '#ffffff',
                      color: sel ? '#fff' : '#374151',
                      border: `1.5px solid ${sel ? '#2563eb' : '#e5e7eb'}`,
                    }}>{es ? o.es : o.en}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sección C: Recursos adicionales */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              📦 {es ? '¿Qué recursos adicionales se necesitan?' : 'What additional resources are needed?'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {RECURSOS_OPTS.map(o => {
                const sel = form.recursos_adicionales_req.includes(o.val);
                return (
                  <button key={o.val} onClick={() => set('recursos_adicionales_req', toggleArr(form.recursos_adicionales_req, o.val))} style={{
                    padding: '7px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                    background: sel ? '#2563eb' : '#ffffff',
                    color: sel ? '#fff' : '#374151',
                    border: `1.5px solid ${sel ? '#2563eb' : '#e5e7eb'}`,
                  }}>{es ? o.es : o.en}</button>
                );
              })}
            </div>
          </div>

          {/* Notas opcionales */}
          <textarea rows={2} value={form.maquinaria_notas} onChange={e => set('maquinaria_notas', e.target.value)}
            placeholder={es ? 'Notas adicionales (opcional)...' : 'Additional notes (optional)...'}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 11px', fontSize: 12, color: '#111827', resize: 'none', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />

          {/* Botón guardar */}
          <button onClick={guardar} disabled={guardando || !hayDato} style={{
            width: '100%', padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 800,
            background: (!hayDato || guardando) ? '#93c5fd' : '#2563eb',
            color: '#fff', border: 'none', cursor: (!hayDato || guardando) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {guardando ? (es ? 'Guardando...' : 'Saving...') : `📡 ${es ? 'Enviar información de rescate' : 'Send rescue info'}`}
          </button>

          <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
            {es ? '"No sé" también ayuda. Todo dato cuenta.' : '"Unknown" also helps. Every piece of info matters.'}
          </p>
        </div>
      )}
    </div>
  );
}