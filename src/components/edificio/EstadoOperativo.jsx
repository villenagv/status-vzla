import { useState, useEffect } from 'react';
import { Loader2, Zap, Droplets, Flame, Car, AlertTriangle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Configs de estados ──────────────────────────────────────────────────────
const SERVICIO_CONFIG = {
  disponible:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '🟢', es: 'Disponible',    en: 'Available'     },
  no_disponible:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '🔴', es: 'No disponible', en: 'Not available'  },
  intermitente:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '🟡', es: 'Intermitente',  en: 'Intermittent'  },
  suspendido:     { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '🟠', es: 'Suspendido',    en: 'Suspended'     },
  fuga_reportada: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '🔴', es: '⚠️ Fuga rep.',  en: '⚠️ Leak rep.'  },
  no_confirmado:  { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: '⚪', es: 'Sin confirmar', en: 'Unconfirmed'   },
};
const ACCESO_LABELS = {
  normal:         { es: '✅ Paso libre — se llega sin problemas',  en: '✅ Clear path — no issues'           },
  dificultad:     { es: '⚠️ Se puede pasar, pero con dificultad', en: '⚠️ Passable, but with difficulty'    },
  solo_peatonal:  { es: '🚶 Solo a pie — vehículos no pasan',     en: '🚶 On foot only — no vehicles'       },
  bloqueada:      { es: '🚫 Calle bloqueada — no se puede pasar', en: '🚫 Blocked street — cannot pass'     },
  insegura:       { es: '☠️ Peligrosa — no intentes pasar',       en: '☠️ Dangerous — do not attempt'       },
  no_confirmado:  { es: '❓ No sé / no lo vi',                    en: '❓ Unknown / I did not see it'        },
};
const VEHICULOS_LABELS = {
  carros:         { es: '🚗 Sí llegan carros normales',           en: '🚗 Regular cars can reach it'         },
  ambulancias:    { es: '🚑 Sí llegan ambulancias',               en: '🚑 Ambulances can reach it'           },
  camiones:       { es: '🚛 Sí llegan camiones o grúas',          en: '🚛 Trucks / cranes can reach it'      },
  solo_motos:     { es: '🏍️ Solo motos — carros no pasan',        en: '🏍️ Motorcycles only — no cars'        },
  bloqueado:      { es: '🚫 Nada pasa — vía completamente cerrada', en: '🚫 Nothing passes — road closed'    },
  no_confirmado:  { es: '❓ No sé / no lo vi',                    en: '❓ Unknown / I did not see it'        },
};
const TIPO_DANO_LABELS = {
  sin_danos:      { es: 'Sin daños visibles',     en: 'No visible damage'      },
  esteticos:      { es: 'Solo estéticos',         en: 'Cosmetic only'          },
  estructurales:  { es: 'Estructurales',          en: 'Structural'             },
  ambos:          { es: 'Estéticos + estructurales', en: 'Cosmetic + structural'},
  no_confirmado:  { es: 'Sin confirmar',          en: 'Unconfirmed'            },
};

function ServicioChip({ icon: Icon, label, estado, es }) {
  const cfg = SERVICIO_CONFIG[estado] || SERVICIO_CONFIG.no_confirmado;
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl border" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: cfg.color }} />
        <span className="text-xs font-semibold" style={{ color: '#1F2937' }}>{label}</span>
      </div>
      <span className="text-xs font-bold" style={{ color: cfg.color }}>
        {cfg.dot} {es ? cfg.es : cfg.en}
      </span>
    </div>
  );
}

// ── Formulario de actualización rápida ──────────────────────────────────────
function FormActualizacion({ edificioId, es, onGuardado }) {
  const [paso, setPaso] = useState(null); // null = selector categorías
  const [form, setForm] = useState({
    tipo_dano: '', acceso_calle: '', acceso_vehiculos: '',
    electricidad: '', agua: '', gas: '',
    racionamiento_agua: false, racionamiento_electricidad: false, racionamiento_gas: false,
    horario_agua: '', horario_electricidad: '', horario_gas: '',
    notas_acceso: '', notas_racionamiento: '',
    estado_rescate: '', rescate_notas: '', rescate_institucion: '',
    estado_maquinaria: '', tipos_maquinaria_req: [], recursos_adicionales_req: [], maquinaria_notas: '',
    reportante_nombre: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await base44.entities.EstadoOperativoEdificio.create({
        edificio_id: edificioId,
        ...form,
        fuente: 'ciudadano',
      });
      // Si hay fuga de gas, registrar como urgencia en actualizaciones del sitio
      if (form.gas === 'fuga_reportada') {
        await base44.entities.ActualizacionesSitios.create({
          sitio_id: edificioId, tipo_sitio: 'edificio',
          tipo_accion: 'riesgo_marcado',
          descripcion: es ? 'Fuga de gas reportada' : 'Gas leak reported',
          fuente: 'ciudadano',
        });
      }
      setOk(true);
      onGuardado();
    } catch {}
    setGuardando(false);
  };

  if (ok) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
      <p className="text-sm font-bold text-green-700">✅ {es ? '¡Gracias! Estado operativo actualizado.' : 'Thank you! Operational status updated.'}</p>
    </div>
  );

  const categorias = [
    { key: 'danos',       icon: '🏗️', es: 'Tipo de daños',           en: 'Damage type'            },
    { key: 'acceso',      icon: '🚶', es: '¿Cómo está la calle?',    en: 'Street walkability'      },
    { key: 'vehiculos',   icon: '🚗', es: '¿Llega ayuda / vehículos?', en: 'Can vehicles reach it?' },
    { key: 'servicios',   icon: '⚡', es: 'Servicios básicos',        en: 'Basic services'         },
    { key: 'racionamiento', icon: '🕐', es: 'Racionamiento',          en: 'Rationing'              },
    { key: 'rescate',     icon: '🚒', es: 'Equipos de rescate',       en: 'Rescue teams'           },
    { key: 'maquinaria',  icon: '🏗️', es: 'Maquinaria y recursos',   en: 'Machinery & resources'  },
  ];

  return (
    <div className="space-y-3">
      {/* Selector de categoría */}
      <div>
        <p className="text-xs font-bold text-gray-600 mb-2">{es ? '¿Qué quieres actualizar?' : 'What do you want to update?'}</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {categorias.map(c => (
            <button key={c.key} onClick={() => setPaso(paso === c.key ? null : c.key)}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors text-left flex items-center gap-1.5
                ${paso === c.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300'}`}>
              <span>{c.icon}</span>
              <span>{es ? c.es : c.en}</span>
              {paso === c.key ? <ChevronUp size={10} className="ml-auto" /> : <ChevronDown size={10} className="ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Daños */}
      {paso === 'danos' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-gray-700">🏗️ {es ? '¿Qué tipo de daños tiene el edificio?' : 'What type of damage does the building have?'}</p>
          <p className="text-[10px] leading-relaxed" style={{ color: '#4B5563' }}>
            {es ? 'Estéticos: pintura, vidrios, fachada. Estructurales: columnas, paredes, escaleras, grietas grandes.' : 'Cosmetic: paint, glass, facade. Structural: columns, walls, stairs, large cracks.'}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(TIPO_DANO_LABELS).map(([val, lbl]) => (
              <button key={val} onClick={() => set('tipo_dano', val)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${form.tipo_dano === val ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-700'}`}>
                {es ? lbl.es : lbl.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Acceso calle */}
      {paso === 'acceso' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-gray-700">🚶 {es ? '¿Cómo está la calle para llegar al edificio?' : 'How is the street to reach the building?'}</p>
          <p className="text-[10px] leading-relaxed" style={{ color: '#4B5563' }}>
            {es ? 'Cuéntanos si puedes llegar a pie sin problemas, si hay escombros u obstáculos.' : 'Tell us if you can reach it on foot, or if there are debris or obstacles.'}
          </p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(ACCESO_LABELS).map(([val, lbl]) => (
              <button key={val} onClick={() => set('acceso_calle', val)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left ${form.acceso_calle === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                {es ? lbl.es : lbl.en}
              </button>
            ))}
          </div>
          <input value={form.notas_acceso} onChange={e => set('notas_acceso', e.target.value)}
            placeholder={es ? 'Ej: Hay escombros en la entrada, la acera está rota...' : 'E.g.: Debris at entrance, sidewalk is broken...'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
      )}

      {/* Vehículos */}
      {paso === 'vehiculos' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-gray-700">🚗 {es ? '¿Qué tipo de vehículo puede llegar hasta el edificio?' : 'What type of vehicle can reach the building?'}</p>
          <p className="text-[10px] leading-relaxed" style={{ color: '#4B5563' }}>
            {es ? 'Esto ayuda a coordinar ambulancias, bomberos y camiones de rescate. Sé lo más preciso posible.' : 'This helps coordinate ambulances, firefighters and rescue trucks. Be as specific as possible.'}
          </p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(VEHICULOS_LABELS).map(([val, lbl]) => (
              <button key={val} onClick={() => set('acceso_vehiculos', val)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left ${form.acceso_vehiculos === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                {es ? lbl.es : lbl.en}
              </button>
            ))}
          </div>
          {form.acceso_vehiculos === 'bloqueado' && (
            <div className="flex gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2">
              <AlertTriangle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700 font-semibold">{es ? 'Información crítica para rescatistas. Gracias por reportarlo.' : 'Critical info for rescue teams. Thank you for reporting.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Servicios básicos */}
      {paso === 'servicios' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-700">⚡ {es ? '¿Cómo están los servicios en este edificio?' : 'How are the services in this building?'}</p>
            <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: '#4B5563' }}>
              {es ? 'Marca solo lo que sabes con certeza. Si no sabes, deja "No sé".' : 'Only mark what you know for sure. Leave "Unknown" if unsure.'}
            </p>
          </div>
          {[
            {
              key: 'electricidad', icon: '⚡', es: 'Luz / Electricidad', en: 'Electricity / Power',
              opts: [
                { val: 'disponible',    es: '✅ Hay luz — funciona normal',       en: '✅ Power on — working fine'       },
                { val: 'intermitente',  es: '⚡ A veces hay, a veces no',         en: '⚡ Comes and goes'                },
                { val: 'no_disponible', es: '❌ Sin luz — cortaron el servicio',  en: '❌ No power — service cut'        },
                { val: 'no_confirmado', es: '❓ No sé',                           en: '❓ Unknown'                       },
              ],
            },
            {
              key: 'agua', icon: '💧', es: 'Agua corriente', en: 'Running water',
              opts: [
                { val: 'disponible',    es: '✅ Hay agua — sale por el grifo',    en: '✅ Water on — flows from tap'     },
                { val: 'intermitente',  es: '💧 A ratos hay, a ratos no',         en: '💧 Comes and goes'                },
                { val: 'no_disponible', es: '❌ Sin agua — no sale nada',         en: '❌ No water — nothing flows'      },
                { val: 'no_confirmado', es: '❓ No sé',                           en: '❓ Unknown'                       },
              ],
            },
            {
              key: 'gas', icon: '🔥', es: 'Gas doméstico', en: 'Gas service',
              opts: [
                { val: 'disponible',    es: '✅ Gas normal — funciona bien',      en: '✅ Gas on — working fine'         },
                { val: 'suspendido',    es: '🚫 Gas cortado — lo suspendieron',   en: '🚫 Gas cut — service suspended'   },
                { val: 'intermitente',  es: '⚡ Gas intermitente',               en: '⚡ Intermittent gas'              },
                { val: 'fuga_reportada',es: '☠️ FUGA — huele a gas, peligro',   en: '☠️ LEAK — gas smell, danger'      },
                { val: 'no_disponible', es: '❌ Sin gas',                         en: '❌ No gas'                        },
                { val: 'no_confirmado', es: '❓ No sé',                           en: '❓ Unknown'                       },
              ],
            },
          ].map(srv => (
            <div key={srv.key} className="border border-gray-200 rounded-xl bg-white p-3 space-y-2">
              <p className="text-xs font-bold text-gray-700">{srv.icon} {es ? srv.es : srv.en}</p>
              <div className="flex flex-col gap-1.5">
                {srv.opts.map(opt => (
                  <button key={opt.val} onClick={() => set(srv.key, opt.val)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left transition-colors
                      ${form[srv.key] === opt.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {es ? opt.es : opt.en}
                  </button>
                ))}
              </div>
              {srv.key === 'gas' && form.gas === 'fuga_reportada' && (
                <div className="flex gap-1.5 bg-red-50 border-2 border-red-300 rounded-lg px-2.5 py-2">
                  <AlertTriangle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-700 font-bold">{es ? '🚨 URGENCIA: Se notificará como peligro inmediato. Evacúa el edificio ahora.' : '🚨 URGENT: Will be flagged as immediate danger. Evacuate the building now.'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rescate */}
      {paso === 'rescate' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-bold text-red-700">🚒 {es ? '¿Hay equipos de rescate en el sitio?' : 'Are rescue teams at the site?'}</p>
          <p className="text-[10px] leading-relaxed" style={{ color: '#6B7280' }}>
            {es ? 'Esta información ayuda a coordinar recursos y evitar duplicar esfuerzos.' : 'This helps coordinate resources and avoid duplicating efforts.'}
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              { val: 'no_presente',          es: '❌ No hay — ningún equipo en sitio',         en: '❌ None — no team on site'              },
              { val: 'en_camino',            es: '🚐 En camino — llegarán pronto',             en: '🚐 En route — arriving soon'            },
              { val: 'trabajando',           es: '🔴 Activos — trabajando ahora',              en: '🔴 Active — working now'                },
              { val: 'finalizado',           es: '✅ Finalizaron — operación cerrada',         en: '✅ Finished — operation closed'         },
              { val: 'requiere_apoyo_adicional', es: '🆘 Necesita más apoyo urgente',         en: '🆘 Needs additional support urgently'   },
              { val: 'no_confirmado',        es: '❓ No sé',                                   en: '❓ Unknown'                             },
            ].map(opt => (
              <button key={opt.val} onClick={() => set('estado_rescate', opt.val)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left transition-colors
                  ${form.estado_rescate === opt.val ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                {es ? opt.es : opt.en}
              </button>
            ))}
          </div>
          {form.estado_rescate === 'requiere_apoyo_adicional' && (
            <div className="bg-red-100 border-2 border-red-400 rounded-xl px-3 py-2">
              <p className="text-xs font-bold text-red-800">🆘 {es ? 'Se marcará como urgencia crítica y se notificará a los suscriptores.' : 'Will be flagged as critical and subscribers will be notified.'}</p>
            </div>
          )}
          <input value={form.rescate_institucion || ''} onChange={e => set('rescate_institucion', e.target.value)}
            placeholder={es ? 'Equipo o institución presente (ej: Bomberos Caracas, Protección Civil)' : 'Team or institution present (e.g. Fire Dept, Civil Protection)'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500" />
          <textarea rows={2} value={form.rescate_notas || ''} onChange={e => set('rescate_notas', e.target.value)}
            placeholder={es ? 'Notas adicionales sobre el rescate...' : 'Additional notes about the rescue...'}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-red-500" />
        </div>
      )}

      {/* Maquinaria y recursos */}
      {paso === 'maquinaria' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-bold text-orange-800">🏗️ {es ? '¿Se necesita maquinaria o recursos?' : 'Is machinery or resources needed?'}</p>
          <p className="text-[10px] leading-relaxed" style={{ color: '#6B7280' }}>
            {es ? 'Indica el estado y qué se necesita para priorizar la respuesta.' : 'Indicate the status and what is needed to prioritize the response.'}
          </p>
          {/* Estado maquinaria */}
          <div>
            <p className="text-xs font-semibold text-orange-700 mb-1.5">🚛 {es ? '¿Maquinaria pesada?' : 'Heavy machinery?'}</p>
            <div className="flex flex-col gap-1.5">
              {[
                { val: 'no_requerida',          es: '✅ No se necesita',                  en: '✅ Not needed'                },
                { val: 'requerida_no_disponible', es: '🆘 Se necesita — NO hay en sitio', en: '🆘 Needed — NOT available'   },
                { val: 'en_camino',             es: '🚛 En camino al sitio',              en: '🚛 On its way'               },
                { val: 'en_sitio',              es: '✅ Ya está en el sitio',             en: '✅ Already on site'          },
                { val: 'no_confirmado',         es: '❓ No sé',                            en: '❓ Unknown'                  },
              ].map(opt => (
                <button key={opt.val} onClick={() => set('estado_maquinaria', opt.val)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left transition-colors
                    ${form.estado_maquinaria === opt.val ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {es ? opt.es : opt.en}
                </button>
              ))}
            </div>
          </div>
          {/* Tipos de maquinaria */}
          <div>
            <p className="text-xs font-semibold text-orange-700 mb-1.5">{es ? '¿Qué maquinaria se necesita? (selecciona todas las que apliquen)' : 'What machinery is needed? (select all that apply)'}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { val: 'retroexcavadora',    es: '🚜 Retroexcavadora',      en: '🚜 Excavator'        },
                { val: 'grua',               es: '🏗️ Grúa',                en: '🏗️ Crane'           },
                { val: 'ambulancia_rescate', es: '🚑 Ambulancia de rescate', en: '🚑 Rescue ambulance' },
                { val: 'unidad_hidraulica',  es: '🔧 Unidad hidráulica',    en: '🔧 Hydraulic unit'   },
                { val: 'generador',          es: '🔌 Generador',             en: '🔌 Generator'        },
                { val: 'iluminacion',        es: '💡 Iluminación',           en: '💡 Lighting'         },
                { val: 'camion_escombros',   es: '🚛 Camión escombros',      en: '🚛 Debris truck'     },
                { val: 'otro',               es: '🔩 Otro',                  en: '🔩 Other'            },
              ].map(opt => {
                const sel = (form.tipos_maquinaria_req || []).includes(opt.val);
                return (
                  <button key={opt.val} onClick={() => {
                    const cur = form.tipos_maquinaria_req || [];
                    set('tipos_maquinaria_req', sel ? cur.filter(v => v !== opt.val) : [...cur, opt.val]);
                  }} className={`py-2 px-2 rounded-xl text-xs font-semibold border cursor-pointer text-left transition-colors
                    ${sel ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? opt.es : opt.en}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Recursos adicionales */}
          <div>
            <p className="text-xs font-semibold text-orange-700 mb-1.5">{es ? '¿Qué recursos adicionales se necesitan?' : 'What additional resources are needed?'}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { val: 'voluntarios',          es: '🙋 Voluntarios',         en: '🙋 Volunteers'      },
                { val: 'medicos',              es: '👨‍⚕️ Médicos',           en: '👨‍⚕️ Doctors'       },
                { val: 'enfermeros',           es: '🩺 Enfermeros',          en: '🩺 Nurses'          },
                { val: 'agua_potable',         es: '💧 Agua potable',        en: '💧 Drinking water'  },
                { val: 'medicamentos',         es: '💊 Medicamentos',        en: '💊 Medication'      },
                { val: 'camillas',             es: '🛏️ Camillas',            en: '🛏️ Stretchers'     },
                { val: 'cuerdas_rescate',      es: '🪢 Cuerdas / arneses',   en: '🪢 Ropes / harnesses'},
                { val: 'equipo_comunicacion',  es: '📡 Equipos comunicación', en: '📡 Communication'  },
                { val: 'comida',               es: '🍱 Comida',              en: '🍱 Food'            },
                { val: 'otro',                 es: '➕ Otro',                 en: '➕ Other'           },
              ].map(opt => {
                const sel = (form.recursos_adicionales_req || []).includes(opt.val);
                return (
                  <button key={opt.val} onClick={() => {
                    const cur = form.recursos_adicionales_req || [];
                    set('recursos_adicionales_req', sel ? cur.filter(v => v !== opt.val) : [...cur, opt.val]);
                  }} className={`py-2 px-2 rounded-xl text-xs font-semibold border cursor-pointer text-left transition-colors
                    ${sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? opt.es : opt.en}
                  </button>
                );
              })}
            </div>
          </div>
          <textarea rows={2} value={form.maquinaria_notas || ''} onChange={e => set('maquinaria_notas', e.target.value)}
            placeholder={es ? 'Notas adicionales sobre maquinaria y recursos...' : 'Additional notes on machinery and resources...'}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500" />
        </div>
      )}

      {/* Racionamiento */}
      {paso === 'racionamiento' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-bold text-gray-700">🕐 {es ? 'Horarios de racionamiento' : 'Rationing schedules'}</p>
          <p className="text-[10px]" style={{ color: '#4B5563' }}>{es ? 'Si hay cortes programados de agua, luz o gas, ingrésalos para que vecinos puedan organizarse.' : 'If there are scheduled cuts for water, electricity or gas, add them so neighbors can plan.'}</p>
          {[
            { key: 'agua',          ratKey: 'racionamiento_agua',          horKey: 'horario_agua',          icon: '💧', es: 'Agua',         en: 'Water'       },
            { key: 'electricidad',  ratKey: 'racionamiento_electricidad',   horKey: 'horario_electricidad',  icon: '⚡', es: 'Electricidad', en: 'Electricity' },
            { key: 'gas',           ratKey: 'racionamiento_gas',            horKey: 'horario_gas',           icon: '🔥', es: 'Gas',          en: 'Gas'         },
          ].map(srv => (
            <div key={srv.key} className="border border-gray-200 rounded-xl bg-white p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">{srv.icon} {es ? srv.es : srv.en}</p>
                <button onClick={() => set(srv.ratKey, !form[srv.ratKey])}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-colors
                    ${form[srv.ratKey] ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {form[srv.ratKey] ? (es ? '✓ Hay racionamiento' : '✓ Has rationing') : (es ? '¿Hay racionamiento?' : 'Has rationing?')}
                </button>
              </div>
              {form[srv.ratKey] && (
                <input value={form[srv.horKey]} onChange={e => set(srv.horKey, e.target.value)}
                  placeholder={es ? 'Ej: Lun, Mié, Vie — 6:00 AM a 10:00 AM' : 'E.g: Mon, Wed, Fri — 6:00 AM to 10:00 AM'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
              )}
            </div>
          ))}
          <textarea value={form.notas_racionamiento} onChange={e => set('notas_racionamiento', e.target.value)}
            rows={2} placeholder={es ? 'Notas adicionales sobre racionamiento...' : 'Additional notes about rationing...'}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500" />
        </div>
      )}

      {/* Reportante */}
      {paso && (
        <input value={form.reportante_nombre} onChange={e => set('reportante_nombre', e.target.value)}
          placeholder={es ? 'Tu nombre (opcional, no se publica)' : 'Your name (optional, not published)'}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
      )}

      {/* Botón guardar */}
      {paso && (
        <button onClick={guardar} disabled={guardando}
          className="w-full bg-blue-700 text-white text-sm font-bold py-3 rounded-2xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
          {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {es ? 'Guardar actualización' : 'Save update'}
        </button>
      )}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function EstadoOperativo({ edificioId, es }) {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);

  const cargar = async () => {
    try {
      const resultados = await base44.entities.EstadoOperativoEdificio.filter(
        { edificio_id: edificioId }, '-created_date', 1
      );
      if (resultados?.length > 0) setEstado(resultados[0]);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { if (edificioId) cargar(); }, [edificioId]);

  const onGuardado = () => { setEditando(false); cargar(); };

  if (cargando) return (
    <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
  );

  const srv = estado;

  // ── Servicios: mostrar SIEMPRE los tres, con estado actual o "sin confirmar" ──
  const servicios = [
    { key: 'electricidad', icon: Zap,      es: 'Electricidad',   en: 'Electricity'   },
    { key: 'agua',         icon: Droplets, es: 'Agua corriente', en: 'Running water' },
    { key: 'gas',          icon: Flame,    es: 'Gas',            en: 'Gas'           },
  ];

  // Acceso: mostrar siempre que exista dato o como "sin confirmar"
  const accesoCalle    = srv?.acceso_calle    || 'no_confirmado';
  const accesoVehiculos= srv?.acceso_vehiculos|| 'no_confirmado';
  const tipoDano       = srv?.tipo_dano       || 'no_confirmado';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">🏢 {es ? 'Estado operativo' : 'Operational status'}</p>
        <button onClick={() => setEditando(v => !v)}
          className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100">
          {editando ? (es ? 'Cerrar' : 'Close') : (es ? '+ Actualizar' : '+ Update')}
        </button>
      </div>

      {/* ── SERVICIOS BÁSICOS — siempre visibles ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">⚡ {es ? 'Servicios básicos' : 'Basic services'}</p>
        <div className="space-y-1.5">
          {servicios.map(s => (
            <ServicioChip key={s.key} icon={s.icon} label={es ? s.es : s.en} estado={srv?.[s.key] || 'no_confirmado'} es={es} />
          ))}
        </div>
      </div>

      {/* Fuga de gas — alerta crítica */}
      {srv?.gas === 'fuga_reportada' && (
        <div className="flex gap-2 bg-red-50 border-2 border-red-300 rounded-xl px-3 py-2.5">
          <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-700">{es ? '⚠️ FUGA DE GAS REPORTADA — Evacúa de inmediato' : '⚠️ GAS LEAK REPORTED — Evacuate immediately'}</p>
        </div>
      )}

      {/* ── ACCESO — siempre visible ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">🚶 {es ? 'Acceso' : 'Access'}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            <span className="text-[11px] font-semibold text-gray-500">{es ? 'A pie' : 'On foot'}</span>
            <span className="text-[11px] font-bold text-gray-800">{es ? ACCESO_LABELS[accesoCalle]?.es : ACCESO_LABELS[accesoCalle]?.en}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            <span className="text-[11px] font-semibold text-gray-500">🚗</span>
            <span className="text-[11px] font-bold text-gray-800">{es ? VEHICULOS_LABELS[accesoVehiculos]?.es : VEHICULOS_LABELS[accesoVehiculos]?.en}</span>
          </div>
        </div>
        {srv?.notas_acceso && (
          <p className="text-[11px] text-gray-500 mt-1.5 pl-1 italic">{srv.notas_acceso}</p>
        )}
      </div>

      {/* ── TIPO DE DAÑO — siempre visible ── */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
        <span className="text-xs font-semibold text-gray-600">🏗️ {es ? 'Tipo de daño' : 'Damage type'}</span>
        <span className="text-xs font-bold text-gray-800">{es ? TIPO_DANO_LABELS[tipoDano]?.es : TIPO_DANO_LABELS[tipoDano]?.en}</span>
      </div>

      {/* ── RACIONAMIENTO — solo si existe ── */}
      {srv && (srv.racionamiento_agua || srv.racionamiento_electricidad || srv.racionamiento_gas) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">🕐 {es ? 'Racionamiento reportado' : 'Reported rationing'}</p>
          {srv.racionamiento_agua && srv.horario_agua && (
            <p className="text-xs text-orange-800">💧 <strong>{es ? 'Agua:' : 'Water:'}</strong> {srv.horario_agua}</p>
          )}
          {srv.racionamiento_electricidad && srv.horario_electricidad && (
            <p className="text-xs text-orange-800">⚡ <strong>{es ? 'Electricidad:' : 'Electricity:'}</strong> {srv.horario_electricidad}</p>
          )}
          {srv.racionamiento_gas && srv.horario_gas && (
            <p className="text-xs text-orange-800">🔥 <strong>{es ? 'Gas:' : 'Gas:'}</strong> {srv.horario_gas}</p>
          )}
          {srv.notas_racionamiento && (
            <p className="text-[10px] text-orange-600 italic">{srv.notas_racionamiento}</p>
          )}
        </div>
      )}

      {/* ── ESTADO DE RESCATE — siempre visible si hay dato ── */}
      {srv?.estado_rescate && srv.estado_rescate !== 'no_confirmado' && (() => {
        const RESCATE_CFG = {
          no_presente:               { bg: '#F3F4F6', border: '#E5E7EB', color: '#374151', dot: '⚫', es: 'Sin equipo en sitio',           en: 'No team on site'             },
          en_camino:                 { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', dot: '🚐', es: 'Equipo en camino',              en: 'Team en route'               },
          trabajando:                { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', dot: '🔴', es: 'Equipo activo trabajando',      en: 'Team actively working'       },
          finalizado:                { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', dot: '✅', es: 'Operación finalizada',          en: 'Operation finished'          },
          requiere_apoyo_adicional:  { bg: '#FEF2F2', border: '#EF4444', color: '#B91C1C', dot: '🆘', es: '¡SE NECESITA MÁS APOYO!',      en: 'ADDITIONAL SUPPORT NEEDED!' },
        };
        const cfg = RESCATE_CFG[srv.estado_rescate] || RESCATE_CFG.no_presente;
        return (
          <div style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: cfg.color, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🚒 {es ? 'Equipo de rescate' : 'Rescue team'}
            </p>
            <p style={{ fontSize: 13, fontWeight: 800, color: cfg.color, margin: 0 }}>{cfg.dot} {es ? cfg.es : cfg.en}</p>
            {srv.rescate_institucion && <p style={{ fontSize: 11, color: '#4B5563', margin: '3px 0 0' }}>🏛️ {srv.rescate_institucion}</p>}
            {srv.rescate_notas && <p style={{ fontSize: 11, color: '#4B5563', margin: '3px 0 0', fontStyle: 'italic' }}>{srv.rescate_notas}</p>}
          </div>
        );
      })()}

      {/* ── MAQUINARIA Y RECURSOS — visible si hay dato relevante ── */}
      {srv && (srv.estado_maquinaria && srv.estado_maquinaria !== 'no_confirmado' || (srv.tipos_maquinaria_req?.length > 0) || (srv.recursos_adicionales_req?.length > 0)) && (
        <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: '10px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#C2410C', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🏗️ {es ? 'Maquinaria y recursos' : 'Machinery & resources'}
          </p>
          {srv.estado_maquinaria && srv.estado_maquinaria !== 'no_confirmado' && (
            <p style={{ fontSize: 12, fontWeight: 700, color: '#EA580C', margin: '0 0 4px' }}>
              {{
                no_requerida: `✅ ${es ? 'Sin maquinaria requerida' : 'No machinery needed'}`,
                requerida_no_disponible: `🆘 ${es ? 'MAQUINARIA REQUERIDA — no disponible' : 'MACHINERY NEEDED — not available'}`,
                en_camino: `🚛 ${es ? 'Maquinaria en camino' : 'Machinery en route'}`,
                en_sitio: `✅ ${es ? 'Maquinaria ya en sitio' : 'Machinery already on site'}`,
              }[srv.estado_maquinaria] || ''}
            </p>
          )}
          {srv.tipos_maquinaria_req?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
              {srv.tipos_maquinaria_req.map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 600, background: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: 20, padding: '2px 8px' }}>{t.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
          {srv.recursos_adicionales_req?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {srv.recursos_adicionales_req.map(r => (
                <span key={r} style={{ fontSize: 10, fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 8px' }}>{r.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
          {srv.maquinaria_notas && <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0', fontStyle: 'italic' }}>{srv.maquinaria_notas}</p>}
        </div>
      )}

      {!srv && !editando && (
        <p className="text-[11px] text-gray-400 text-center py-1">
          {es ? '⚠️ Sin datos confirmados aún. ¿Puedes ayudar?' : '⚠️ No confirmed data yet. Can you help?'}
          {' '}<button onClick={() => setEditando(true)} className="font-semibold text-blue-600 underline cursor-pointer">{es ? 'Agregar' : 'Add'}</button>
        </p>
      )}

      {editando && (
        <FormActualizacion edificioId={edificioId} es={es} onGuardado={onGuardado} />
      )}
    </div>
  );
}