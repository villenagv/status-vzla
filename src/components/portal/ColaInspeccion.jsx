import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Camera, MapPin, CheckCircle, UserCheck, Clock, Users, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AccionesEspecialista from './AccionesEspecialista';
import FormularioInspeccion from './FormularioInspeccion';
import FichaAuditoriaInspeccion from './FichaAuditoriaInspeccion';
import { MOTIVO_LABEL } from './MotivoPendiente';

const RIESGO_CFG = {
  riesgo_colapso:  { icon: '💥', color: '#7F1D1D', bg: '#FEF2F2', border: '#FECACA', es: 'Riesgo de colapso', en: 'Collapse risk',   orden: 0 },
  riesgo_moderado: { icon: '🟠', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', es: 'Riesgo moderado',   en: 'Moderate risk',   orden: 1 },
  solo_estetico:   { icon: '🟢', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', es: 'Solo estético',     en: 'Cosmetic only',   orden: 2 },
  sin_clasificar:  { icon: '⚪', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', es: 'Sin clasificar',    en: 'Unclassified',    orden: 3 },
};

const SEVERIDAD_LBL = {
  leve:     { es: '🟢 Leve',    en: '🟢 Minor'    },
  moderado: { es: '🟠 Moderado', en: '🟠 Moderate' },
  grave:    { es: '🔴 Grave',   en: '🔴 Severe'   },
  critico:  { es: '💥 Crítico', en: '💥 Critical' },
};
const TIPO_DANO_LBL = {
  sin_danos:   { es: 'Sin daños',             en: 'No damage'           },
  estetico:    { es: 'Solo estético',         en: 'Cosmetic only'       },
  estructural: { es: 'Estructural',           en: 'Structural'          },
  ambos:       { es: 'Estético y estructural', en: 'Cosmetic & structural' },
};

function TarjetaInspeccion({ reporte, es, perfil, onActualizado, completada }) {
  const [expandido, setExpandido] = useState(false);
  const [accion, setAccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [verFotos, setVerFotos] = useState(false);

  const cfg = RIESGO_CFG[reporte.triage_riesgo] || RIESGO_CFG.sin_clasificar;
  const asignadoAMi = reporte.voluntario_asignado_id === perfil.user_id;
  const motivo = reporte.inspeccion_estado_pendiente && reporte.inspeccion_estado_pendiente !== 'ninguno' ? reporte.inspeccion_estado_pendiente : '';

  const [confirmando, setConfirmando] = useState(false);

  const asignarme = async () => {
    setEnviando(true);
    try {
      // 1. Actualizar en BD
      await base44.entities.ReportesDano.update(reporte.id, {
        voluntario_asignado_id: perfil.user_id,
        voluntario_asignado_nombre: perfil.user_nombre || perfil.user_email,
        triage_estado: 'en_cola_inspeccion',
      });
      onActualizado(reporte.id, {
        voluntario_asignado_id: perfil.user_id,
        voluntario_asignado_nombre: perfil.user_nombre || perfil.user_email,
        triage_estado: 'en_cola_inspeccion',
      });
      // 2. Disparar correos al inspector y al reportante
      base44.functions.invoke('notificarAsignacionInspeccion', {
        reporte_id: reporte.id,
        inspector_id: perfil.user_id,
        inspector_nombre: perfil.user_nombre || perfil.user_email,
        inspector_email: perfil.user_email,
        inspector_telefono: perfil.telefono_contacto || '',
        inspector_especialidad: perfil.especialidad || perfil.tipo_perfil || '',
      }).catch(() => {});
      setConfirmando(false);
    } catch {}
    setEnviando(false);
  };

  return (
    <div className="bg-white border rounded-2xl overflow-hidden mb-3" style={{ borderColor: completada ? '#BBF7D0' : cfg.border }}>
      <button onClick={() => setExpandido(v => !v)} className="w-full p-4 text-left cursor-pointer hover:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {completada ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✅ {es ? 'Inspeccionado' : 'Inspected'}</span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon} {es ? cfg.es : cfg.en}
                </span>
              )}
              {asignadoAMi && (
                <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{es ? 'ASIGNADO A MÍ' : 'ASSIGNED TO ME'}</span>
              )}
              {!completada && motivo && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full">⏳ {MOTIVO_LABEL(motivo, es)}</span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {reporte.nombre_lugar || reporte.tipo_estructura?.replace(/_/g, ' ') || (es ? 'Sin nombre' : 'Unnamed')}
            </p>
            <p className="text-xs text-gray-400 truncate">📍 {[reporte.direccion, reporte.ciudad, reporte.estado_region].filter(Boolean).join(' · ')}</p>
            {/* Resultado de inspección (si completada) */}
            {completada && reporte.inspeccion_severidad && reporte.inspeccion_severidad !== 'sin_definir' && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                {(SEVERIDAD_LBL[reporte.inspeccion_severidad] || {})[es ? 'es' : 'en']}
                {reporte.inspeccion_tipo_dano && reporte.inspeccion_tipo_dano !== 'sin_definir' ? ` · ${(TIPO_DANO_LBL[reporte.inspeccion_tipo_dano] || {})[es ? 'es' : 'en']}` : ''}
              </p>
            )}
            {reporte.voluntario_asignado_nombre && !asignadoAMi && (
              <p className="text-[10px] text-gray-400 mt-0.5">👤 {es ? 'Asignado a' : 'Assigned to'} {reporte.voluntario_asignado_nombre}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {reporte.foto_urls?.length > 0 && <span className="text-[9px] text-gray-400">📷 {reporte.foto_urls.length}</span>}
            <span className="text-gray-400 text-sm">{expandido ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {reporte.triage_notas && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{es ? 'Notas del triaje' : 'Triage notes'}</p>
              <p className="text-xs text-gray-600">{reporte.triage_notas}</p>
              {reporte.triage_por && <p className="text-[10px] text-gray-400 mt-1">— {reporte.triage_por}</p>}
            </div>
          )}

          {/* Ficha completa del reporte — todas las preguntas, con lo faltante en amarillo */}
          <FichaAuditoriaInspeccion reporte={reporte} es={es} />

          {/* Informe de inspección (si completada) */}
          {completada && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-green-700 uppercase mb-1">{es ? 'Resultado de la inspección' : 'Inspection result'}</p>
              <p className="text-xs text-gray-700">
                <strong>{es ? 'Severidad:' : 'Severity:'}</strong> {(SEVERIDAD_LBL[reporte.inspeccion_severidad] || {})[es ? 'es' : 'en'] || '—'}
              </p>
              <p className="text-xs text-gray-700">
                <strong>{es ? 'Tipo de daño:' : 'Damage type:'}</strong> {(TIPO_DANO_LBL[reporte.inspeccion_tipo_dano] || {})[es ? 'es' : 'en'] || '—'}
              </p>
              {reporte.inspeccion_notas && <p className="text-xs text-gray-600 mt-1">{reporte.inspeccion_notas}</p>}
              {reporte.inspeccion_por && <p className="text-[10px] text-gray-400 mt-1">— {reporte.inspeccion_por}</p>}
            </div>
          )}

          {reporte.foto_urls?.length > 0 && (
            <div>
              <button onClick={() => setVerFotos(v => !v)} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-2 cursor-pointer">
                <Camera size={13} /> {verFotos ? (es ? 'Ocultar fotos' : 'Hide photos') : `${es ? 'Ver' : 'View'} ${reporte.foto_urls.length} ${es ? 'foto(s)' : 'photo(s)'}`}
              </button>
              {verFotos && (
                <div className="grid grid-cols-3 gap-2">
                  {reporte.foto_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contactos de acceso */}
          {reporte.contactos_token && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-purple-700 uppercase mb-1 flex items-center gap-1">
                <Users size={11} /> {es ? 'Contactos de acceso' : 'Access contacts'} ({(reporte.contactos_acceso || []).length})
              </p>
              {(reporte.contactos_acceso || []).length > 0 ? (
                <div className="space-y-1 mb-2">
                  {(reporte.contactos_acceso || []).map((c, i) => (
                    <div key={i} className="text-xs text-gray-700">
                      <span className="font-semibold">{c.nombre}</span>
                      {c.rol ? <span className="text-gray-400"> · {c.rol}</span> : null}
                      {c.telefono ? <a href={`tel:${c.telefono}`} className="text-blue-600 ml-2 hover:underline">{c.telefono}</a> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-2">{es ? 'Aún no hay contactos registrados.' : 'No contacts registered yet.'}</p>
              )}
              <a
                href={`/contactos-acceso?edificio=${reporte.id}&token=${reporte.contactos_token}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-700 font-semibold hover:underline"
              >
                <ExternalLink size={11} /> {es ? 'Ver / agregar contactos →' : 'View / add contacts →'}
              </a>
            </div>
          )}

          {/* Asignación */}
          {!completada && !reporte.voluntario_asignado_id && (
            confirmando ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <p className="text-xs text-blue-800 font-semibold">
                  {es ? '¿Confirmas que tomas esta inspección? Se enviarán correos al reportante y a ti.' : 'Confirm you are taking this inspection? Emails will be sent to the reporter and to you.'}
                </p>
                <div className="flex gap-2">
                  <button onClick={asignarme} disabled={enviando}
                    className="flex-1 bg-blue-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40">
                    {enviando ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                    {es ? 'Sí, tomo el caso' : 'Yes, I take it'}
                  </button>
                  <button onClick={() => setConfirmando(false)}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 text-xs font-bold py-2 rounded-xl cursor-pointer">
                    {es ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmando(true)} disabled={enviando}
                className="w-full bg-blue-50 border border-blue-300 text-blue-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40">
                <UserCheck size={13} />
                {es ? 'Tomar esta inspección' : 'Take this inspection'}
              </button>
            )
          )}

          {/* Acciones del especialista: contacto, email, notas, motivo pendiente */}
          <AccionesEspecialista reporte={reporte} perfil={perfil} es={es} onActualizado={onActualizado} />

          {/* Declarar inspeccionado — solo si aún no lo está */}
          {!completada && (
            accion === 'inspeccionar' ? (
              <FormularioInspeccion reporte={reporte} perfil={perfil} es={es}
                onCancelar={() => setAccion(null)} onActualizado={onActualizado} />
            ) : (
              <button onClick={() => setAccion('inspeccionar')}
                className="w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2">
                <CheckCircle size={13} /> {es ? 'Declarar inspeccionado' : 'Declare inspected'}
              </button>
            )
          )}

          <Link to={`/edificio?id=${reporte.id}`} className="block text-center text-xs text-blue-600 font-semibold no-underline hover:underline">
            {es ? 'Ver ficha completa →' : 'View full record →'}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ColaInspeccion({ perfil, es, reportes, onActualizado }) {
  const [tab, setTab] = useState('pendientes'); // 'pendientes' | 'completadas'
  const [fRiesgo, setFRiesgo] = useState('todos');
  const [fZona, setFZona] = useState('todas');
  const [soloMios, setSoloMios] = useState(false);
  const [pagina, setPagina] = useState(10);

  // Pendientes: en cola y no inspeccionadas. Completadas: inspeccionadas.
  const pendientes = reportes.filter(r => r.requiere_inspeccion_presencial && r.triage_estado !== 'inspeccionado');
  const completadas = reportes.filter(r => r.triage_estado === 'inspeccionado');
  const base = tab === 'pendientes' ? pendientes : completadas;

  const zonas = useMemo(() => {
    const set = new Set();
    base.forEach(r => { if (r.ciudad) set.add(r.ciudad); });
    return Array.from(set).sort();
  }, [base]);

  const filtrados = base
    .filter(r => fRiesgo === 'todos' || r.triage_riesgo === fRiesgo)
    .filter(r => fZona === 'todas' || r.ciudad === fZona)
    .filter(r => !soloMios || r.voluntario_asignado_id === perfil.user_id)
    .sort((a, b) => {
      const oa = (RIESGO_CFG[a.triage_riesgo] || RIESGO_CFG.sin_clasificar).orden;
      const ob = (RIESGO_CFG[b.triage_riesgo] || RIESGO_CFG.sin_clasificar).orden;
      return oa - ob;
    });

  const cColapso = pendientes.filter(r => r.triage_riesgo === 'riesgo_colapso').length;
  const cSinContacto = pendientes.filter(r => r.inspeccion_estado_pendiente === 'sin_contacto').length;

  const cambiarTab = (t) => { setTab(t); setPagina(10); setFRiesgo('todos'); setFZona('todas'); setSoloMios(false); };

  return (
    <div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
        <p className="text-xs font-bold text-orange-800 mb-0.5">📋 {es ? 'Inspecciones presenciales' : 'On-site inspections'}</p>
        <p className="text-xs text-orange-700 leading-relaxed">
          {es ? 'Edificios que necesitan visita técnica, priorizados por riesgo. Declara el resultado, o marca el motivo si sigue pendiente.'
               : 'Buildings needing an on-site visit, prioritized by risk. Declare the result, or set the reason if still pending.'}
        </p>
      </div>

      {/* Pestañas Pendientes / Completadas */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => cambiarTab('pendientes')}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl border cursor-pointer transition-colors ${tab === 'pendientes' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300'}`}>
          ⏳ {es ? 'Pendientes' : 'Pending'} ({pendientes.length})
        </button>
        <button onClick={() => cambiarTab('completadas')}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl border cursor-pointer transition-colors ${tab === 'completadas' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>
          ✅ {es ? 'Hechas' : 'Done'} ({completadas.length})
        </button>
      </div>

      {/* Resumen prioridad (solo en pendientes) */}
      {tab === 'pendientes' && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-black text-red-700">{cColapso}</p>
            <p className="text-[10px] text-red-600 font-semibold">💥 {es ? 'Riesgo colapso' : 'Collapse risk'}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-black text-amber-700">{cSinContacto}</p>
            <p className="text-[10px] text-amber-600 font-semibold">📵 {es ? 'Sin contacto' : 'No contact'}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'todos', es: 'Todos', en: 'All' },
            { key: 'riesgo_colapso', es: '💥 Colapso', en: '💥 Collapse' },
            { key: 'riesgo_moderado', es: '🟠 Moderado', en: '🟠 Moderate' },
            { key: 'solo_estetico', es: '🟢 Estético', en: '🟢 Cosmetic' },
          ].map(c => (
            <button key={c.key} onClick={() => { setFRiesgo(c.key); setPagina(10); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors ${fRiesgo === c.key ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}>
              {es ? c.es : c.en}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-full px-3 py-1.5">
            <MapPin size={12} className="text-gray-400" />
            <select value={fZona} onChange={e => { setFZona(e.target.value); setPagina(10); }}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer">
              <option value="todas">{es ? 'Todas las zonas' : 'All areas'}</option>
              {zonas.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <button onClick={() => { setSoloMios(v => !v); setPagina(10); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${soloMios ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
            {es ? 'Asignados a mí' : 'Assigned to me'}
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl">
          {tab === 'pendientes' ? <Clock size={28} className="text-gray-300 mx-auto mb-2" /> : <CheckCircle size={28} className="text-gray-300 mx-auto mb-2" />}
          <p className="text-sm text-gray-500">
            {tab === 'pendientes'
              ? (es ? 'No hay inspecciones pendientes en este filtro.' : 'No pending inspections in this filter.')
              : (es ? 'Aún no hay inspecciones completadas en este filtro.' : 'No completed inspections in this filter yet.')}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{filtrados.length} {tab === 'pendientes' ? (es ? 'en cola' : 'in queue') : (es ? 'completadas' : 'completed')}</p>
          {filtrados.slice(0, pagina).map(r => (
            <TarjetaInspeccion key={r.id} reporte={r} es={es} perfil={perfil} onActualizado={onActualizado} completada={tab === 'completadas'} />
          ))}
          {filtrados.length > pagina && (
            <button onClick={() => setPagina(v => v + 10)}
              className="w-full py-3 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
              {es ? `Ver ${Math.min(10, filtrados.length - pagina)} más →` : `Load ${Math.min(10, filtrados.length - pagina)} more →`}
            </button>
          )}
        </>
      )}
    </div>
  );
}