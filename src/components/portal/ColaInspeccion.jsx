import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Camera, MapPin, CheckCircle, UserCheck, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AccionesEspecialista from './AccionesEspecialista';

const RIESGO_CFG = {
  riesgo_colapso:  { icon: '💥', color: '#7F1D1D', bg: '#FEF2F2', border: '#FECACA', es: 'Riesgo de colapso', en: 'Collapse risk',   orden: 0 },
  riesgo_moderado: { icon: '🟠', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', es: 'Riesgo moderado',   en: 'Moderate risk',   orden: 1 },
  solo_estetico:   { icon: '🟢', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', es: 'Solo estético',     en: 'Cosmetic only',   orden: 2 },
  sin_clasificar:  { icon: '⚪', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', es: 'Sin clasificar',    en: 'Unclassified',    orden: 3 },
};

function TarjetaInspeccion({ reporte, es, perfil, onActualizado }) {
  const [expandido, setExpandido] = useState(false);
  const [notas, setNotas] = useState('');
  const [accion, setAccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [verFotos, setVerFotos] = useState(false);

  const cfg = RIESGO_CFG[reporte.triage_riesgo] || RIESGO_CFG.sin_clasificar;
  const asignadoAMi = reporte.voluntario_asignado_id === perfil.user_id;

  const asignarme = async () => {
    setEnviando(true);
    try {
      await base44.entities.ReportesDano.update(reporte.id, {
        voluntario_asignado_id: perfil.user_id,
        voluntario_asignado_nombre: perfil.user_nombre || perfil.user_email,
      });
      onActualizado(reporte.id, { voluntario_asignado_id: perfil.user_id, voluntario_asignado_nombre: perfil.user_nombre || perfil.user_email });
    } catch {}
    setEnviando(false);
  };

  const marcarInspeccionado = async () => {
    setEnviando(true);
    try {
      await base44.entities.ReportesDano.update(reporte.id, {
        triage_estado: 'inspeccionado',
        requiere_inspeccion_presencial: false,
        nivel_verificacion: 'institucional',
        estado_verificacion: 'verificado',
      });
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: reporte.id,
        tipo_sitio: 'edificio',
        tipo_accion: 'verificado',
        descripcion: `[INSPECCIÓN PRESENCIAL ${(perfil.tipo_perfil || 'especialista').toUpperCase()}] ${notas || (es ? 'Inspección técnica completada' : 'Technical inspection completed')}`,
        reportante_nombre: perfil.user_nombre || perfil.user_email,
        fuente: 'especialista',
        es_verificado: true,
      });
      // Avisar a suscriptores del edificio
      base44.functions.invoke('notificarSuscriptoresPublicacion', {
        edificio_id: reporte.id,
        mensaje: notas || (es ? 'Este edificio fue inspeccionado técnicamente en persona.' : 'This building was inspected on-site by a technician.'),
        asunto: es ? `Inspección técnica completada: ${reporte.nombre_lugar || reporte.direccion}` : `Technical inspection completed: ${reporte.nombre_lugar || reporte.direccion}`,
        remitente_nombre: perfil.user_nombre || perfil.user_email,
      }).catch(() => {});
      onActualizado(reporte.id, { triage_estado: 'inspeccionado' });
    } catch {}
    setEnviando(false);
  };

  return (
    <div className="bg-white border rounded-2xl overflow-hidden mb-3" style={{ borderColor: cfg.border }}>
      <button onClick={() => setExpandido(v => !v)} className="w-full p-4 text-left cursor-pointer hover:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.icon} {es ? cfg.es : cfg.en}
              </span>
              {asignadoAMi && (
                <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{es ? 'ASIGNADO A MÍ' : 'ASSIGNED TO ME'}</span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {reporte.nombre_lugar || reporte.tipo_estructura?.replace(/_/g, ' ') || (es ? 'Sin nombre' : 'Unnamed')}
            </p>
            <p className="text-xs text-gray-400 truncate">📍 {[reporte.direccion, reporte.ciudad, reporte.estado_region].filter(Boolean).join(' · ')}</p>
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

          {/* Asignación */}
          {!reporte.voluntario_asignado_id ? (
            <button onClick={asignarme} disabled={enviando}
              className="w-full bg-blue-50 border border-blue-300 text-blue-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40">
              {enviando ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
              {es ? 'Asignarme esta inspección' : 'Assign this inspection to me'}
            </button>
          ) : null}

          {/* Acciones del especialista: contacto, email, notas, inspección presencial */}
          <AccionesEspecialista reporte={reporte} perfil={perfil} es={es} onActualizado={onActualizado} />

          {/* Marcar inspeccionado */}
          {accion === 'inspeccionar' ? (
            <div className="space-y-2">
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
                placeholder={es ? 'Nota técnica final de la inspección...' : 'Final technical inspection note...'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:border-green-400" />
              <button onClick={marcarInspeccionado} disabled={enviando}
                className="w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
                {enviando ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                {es ? 'Confirmar inspección completada' : 'Confirm inspection completed'}
              </button>
              <button onClick={() => setAccion(null)} className="w-full text-xs text-gray-400 underline cursor-pointer">{es ? 'Cancelar' : 'Cancel'}</button>
            </div>
          ) : (
            <button onClick={() => setAccion('inspeccionar')}
              className="w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2">
              <CheckCircle size={13} /> {es ? 'Marcar como inspeccionado en persona' : 'Mark as inspected on-site'}
            </button>
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
  const [fRiesgo, setFRiesgo] = useState('todos');
  const [fZona, setFZona] = useState('todas');
  const [soloMios, setSoloMios] = useState(false);
  const [pagina, setPagina] = useState(10);

  // Reportes en cola de inspección presencial, sin inspeccionar todavía
  const enCola = reportes.filter(r => r.requiere_inspeccion_presencial && r.triage_estado !== 'inspeccionado');

  const zonas = useMemo(() => {
    const set = new Set();
    enCola.forEach(r => { if (r.ciudad) set.add(r.ciudad); });
    return Array.from(set).sort();
  }, [enCola]);

  const filtrados = enCola
    .filter(r => fRiesgo === 'todos' || r.triage_riesgo === fRiesgo)
    .filter(r => fZona === 'todas' || r.ciudad === fZona)
    .filter(r => !soloMios || r.voluntario_asignado_id === perfil.user_id)
    .sort((a, b) => {
      const oa = (RIESGO_CFG[a.triage_riesgo] || RIESGO_CFG.sin_clasificar).orden;
      const ob = (RIESGO_CFG[b.triage_riesgo] || RIESGO_CFG.sin_clasificar).orden;
      return oa - ob;
    });

  const cColapso = enCola.filter(r => r.triage_riesgo === 'riesgo_colapso').length;
  const cModerado = enCola.filter(r => r.triage_riesgo === 'riesgo_moderado').length;

  return (
    <div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
        <p className="text-xs font-bold text-orange-800 mb-0.5">📋 {es ? 'Cola de inspección presencial' : 'On-site inspection queue'}</p>
        <p className="text-xs text-orange-700 leading-relaxed">
          {es ? 'Edificios que necesitan visita técnica en persona, priorizados por riesgo. Asígnate los de tu zona.'
               : 'Buildings needing an on-site technical visit, prioritized by risk. Assign the ones in your area.'}
        </p>
      </div>

      {/* Resumen prioridad */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-center">
          <p className="text-xl font-black text-red-700">{cColapso}</p>
          <p className="text-[10px] text-red-600 font-semibold">💥 {es ? 'Riesgo colapso' : 'Collapse risk'}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-center">
          <p className="text-xl font-black text-orange-700">{cModerado}</p>
          <p className="text-[10px] text-orange-600 font-semibold">🟠 {es ? 'Riesgo moderado' : 'Moderate risk'}</p>
        </div>
      </div>

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
          <Clock size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{es ? 'No hay inspecciones pendientes en este filtro.' : 'No pending inspections in this filter.'}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{filtrados.length} {es ? 'en cola' : 'in queue'}</p>
          {filtrados.slice(0, pagina).map(r => (
            <TarjetaInspeccion key={r.id} reporte={r} es={es} perfil={perfil} onActualizado={onActualizado} />
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