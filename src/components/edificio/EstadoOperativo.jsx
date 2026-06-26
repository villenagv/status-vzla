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
  normal:         { es: 'Acceso normal',          en: 'Normal access'          },
  dificultad:     { es: 'Con dificultad',         en: 'With difficulty'        },
  solo_peatonal:  { es: 'Solo peatonal',          en: 'Pedestrian only'        },
  bloqueada:      { es: 'Calle bloqueada',        en: 'Blocked street'         },
  insegura:       { es: 'Calle insegura',         en: 'Unsafe street'          },
  no_confirmado:  { es: 'Sin confirmar',          en: 'Unconfirmed'            },
};
const VEHICULOS_LABELS = {
  carros:         { es: '🚗 Pueden llegar carros',          en: '🚗 Cars can access'           },
  ambulancias:    { es: '🚑 Pueden llegar ambulancias',     en: '🚑 Ambulances can access'     },
  camiones:       { es: '🚛 Pueden llegar camiones',        en: '🚛 Trucks can access'         },
  solo_motos:     { es: '🏍️ Solo motos o peatones',         en: '🏍️ Motorcycles/pedestrians'   },
  bloqueado:      { es: '🚫 Vía bloqueada',                 en: '🚫 Road blocked'              },
  no_confirmado:  { es: '❓ Sin confirmar',                 en: '❓ Unconfirmed'               },
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
        <span className="text-xs font-semibold text-gray-700">{label}</span>
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
    { key: 'danos',       icon: '🏗️', es: 'Tipo de daños',      en: 'Damage type'     },
    { key: 'acceso',      icon: '🚶', es: 'Acceso por calle',    en: 'Street access'   },
    { key: 'vehiculos',   icon: '🚗', es: 'Llegada de vehículos',en: 'Vehicle access'  },
    { key: 'servicios',   icon: '⚡', es: 'Servicios básicos',   en: 'Basic services'  },
    { key: 'racionamiento', icon: '🕐', es: 'Racionamiento',     en: 'Rationing'       },
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
          <p className="text-[10px] text-gray-500 leading-relaxed">
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
          <p className="text-xs font-bold text-gray-700">🚶 {es ? '¿Se puede acceder al edificio por la calle?' : 'Can you access the building by street?'}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(ACCESO_LABELS).map(([val, lbl]) => (
              <button key={val} onClick={() => set('acceso_calle', val)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${form.acceso_calle === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                {es ? lbl.es : lbl.en}
              </button>
            ))}
          </div>
          <input value={form.notas_acceso} onChange={e => set('notas_acceso', e.target.value)}
            placeholder={es ? 'Detalles del acceso (opcional)' : 'Access details (optional)'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none" />
        </div>
      )}

      {/* Vehículos */}
      {paso === 'vehiculos' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-gray-700">🚗 {es ? '¿Pueden llegar vehículos de ayuda?' : 'Can rescue vehicles reach the building?'}</p>
          <p className="text-[10px] text-gray-500">{es ? 'Importante para coordinar ambulancias y ayuda.' : 'Important for coordinating ambulances and aid.'}</p>
          <div className="grid grid-cols-1 gap-1.5">
            {Object.entries(VEHICULOS_LABELS).map(([val, lbl]) => (
              <button key={val} onClick={() => set('acceso_vehiculos', val)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left ${form.acceso_vehiculos === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                {es ? lbl.es : lbl.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Servicios básicos */}
      {paso === 'servicios' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-bold text-gray-700">⚡ {es ? 'Estado de servicios básicos' : 'Basic services status'}</p>
          {[
            { key: 'electricidad', icon: '⚡', es: 'Electricidad', en: 'Electricity', opts: ['disponible','no_disponible','intermitente','no_confirmado'] },
            { key: 'agua',         icon: '💧', es: 'Agua corriente', en: 'Running water', opts: ['disponible','no_disponible','intermitente','no_confirmado'] },
            { key: 'gas',          icon: '🔥', es: 'Gas',          en: 'Gas',         opts: ['disponible','no_disponible','suspendido','fuga_reportada','no_confirmado'] },
          ].map(srv => (
            <div key={srv.key}>
              <p className="text-[10px] font-bold text-gray-600 mb-1.5">{srv.icon} {es ? srv.es : srv.en}</p>
              <div className="flex flex-wrap gap-1.5">
                {srv.opts.map(opt => {
                  const cfg = SERVICIO_CONFIG[opt];
                  const selected = form[srv.key] === opt;
                  return (
                    <button key={opt} onClick={() => set(srv.key, opt)}
                      className={`py-1.5 px-3 rounded-xl text-[10px] font-semibold border cursor-pointer transition-colors
                        ${selected ? 'text-white' : 'bg-white text-gray-600'}`}
                      style={selected ? { background: cfg.color, borderColor: cfg.color } : { borderColor: '#e5e7eb' }}>
                      {cfg.dot} {es ? cfg.es : cfg.en}
                    </button>
                  );
                })}
              </div>
              {srv.key === 'gas' && form.gas === 'fuga_reportada' && (
                <div className="mt-1.5 flex gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                  <AlertTriangle size={11} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-700 font-semibold">{es ? '⚠️ Se marcará como urgencia. Evacúa el edificio.' : '⚠️ Will be flagged as urgent. Evacuate the building.'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Racionamiento */}
      {paso === 'racionamiento' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-bold text-gray-700">🕐 {es ? 'Horarios de racionamiento' : 'Rationing schedules'}</p>
          <p className="text-[10px] text-gray-500">{es ? 'Si hay cortes programados de agua, luz o gas, ingrésalos para que vecinos puedan organizarse.' : 'If there are scheduled cuts for water, electricity or gas, add them so neighbors can plan.'}</p>
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
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              )}
            </div>
          ))}
          <textarea value={form.notas_racionamiento} onChange={e => set('notas_racionamiento', e.target.value)}
            rows={2} placeholder={es ? 'Notas adicionales sobre racionamiento...' : 'Additional notes about rationing...'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none" />
        </div>
      )}

      {/* Reportante */}
      {paso && (
        <input value={form.reportante_nombre} onChange={e => set('reportante_nombre', e.target.value)}
          placeholder={es ? 'Tu nombre (opcional, no se publica)' : 'Your name (optional, not published)'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none" />
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
  const tieneData = srv && (
    srv.electricidad !== 'no_confirmado' || srv.agua !== 'no_confirmado' ||
    srv.gas !== 'no_confirmado' || srv.acceso_calle !== 'no_confirmado' || srv.tipo_dano !== 'no_confirmado'
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">🏢 {es ? 'Estado operativo' : 'Operational status'}</p>
        <button onClick={() => setEditando(v => !v)}
          className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100">
          {editando ? (es ? 'Cerrar' : 'Close') : (es ? 'Actualizar' : 'Update')}
        </button>
      </div>

      {!tieneData && !editando && (
        <div className="text-center py-3">
          <p className="text-xs text-gray-400">{es ? 'Aún no hay datos operativos. ¿Puedes ayudar?' : 'No operational data yet. Can you help?'}</p>
          <button onClick={() => setEditando(true)} className="text-xs font-semibold text-blue-600 underline underline-offset-2 mt-1 cursor-pointer">
            {es ? 'Agregar información' : 'Add information'}
          </button>
        </div>
      )}

      {tieneData && !editando && (
        <div className="space-y-2">
          {/* Daños */}
          {srv.tipo_dano && srv.tipo_dano !== 'no_confirmado' && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-gray-600">🏗️ {es ? 'Daños' : 'Damage'}</span>
              <span className="text-xs font-bold text-gray-800">{es ? TIPO_DANO_LABELS[srv.tipo_dano]?.es : TIPO_DANO_LABELS[srv.tipo_dano]?.en}</span>
            </div>
          )}

          {/* Acceso */}
          {(srv.acceso_calle && srv.acceso_calle !== 'no_confirmado') && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-gray-600">🚶 {es ? 'Acceso' : 'Access'}</span>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-800">{es ? ACCESO_LABELS[srv.acceso_calle]?.es : ACCESO_LABELS[srv.acceso_calle]?.en}</p>
                {srv.acceso_vehiculos && srv.acceso_vehiculos !== 'no_confirmado' && (
                  <p className="text-[10px] text-gray-500">{es ? VEHICULOS_LABELS[srv.acceso_vehiculos]?.es : VEHICULOS_LABELS[srv.acceso_vehiculos]?.en}</p>
                )}
              </div>
            </div>
          )}

          {/* Servicios — semáforo */}
          <div className="space-y-1.5">
            {srv.electricidad && srv.electricidad !== 'no_confirmado' && (
              <ServicioChip icon={Zap} label={es ? 'Electricidad' : 'Electricity'} estado={srv.electricidad} es={es} />
            )}
            {srv.agua && srv.agua !== 'no_confirmado' && (
              <ServicioChip icon={Droplets} label={es ? 'Agua corriente' : 'Running water'} estado={srv.agua} es={es} />
            )}
            {srv.gas && srv.gas !== 'no_confirmado' && (
              <ServicioChip icon={Flame} label={es ? 'Gas' : 'Gas'} estado={srv.gas} es={es} />
            )}
          </div>

          {/* Racionamiento */}
          {(srv.racionamiento_agua || srv.racionamiento_electricidad || srv.racionamiento_gas) && (
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

          {/* Fuga de gas — alerta crítica */}
          {srv.gas === 'fuga_reportada' && (
            <div className="flex gap-2 bg-red-50 border-2 border-red-300 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700">{es ? '⚠️ FUGA DE GAS REPORTADA — Evacúa de inmediato' : '⚠️ GAS LEAK REPORTED — Evacuate immediately'}</p>
            </div>
          )}
        </div>
      )}

      {editando && (
        <FormActualizacion edificioId={edificioId} es={es} onGuardado={onGuardado} />
      )}
    </div>
  );
}