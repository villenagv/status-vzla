import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AccionesEspecialista from './AccionesEspecialista';

// Opciones de triaje rápido — clasificación inicial online
export const TRIAGE_OPTS = [
  {
    val: 'riesgo_colapso', icon: '💥', color: '#7F1D1D', bg: '#FEF2F2', border: '#EF4444',
    es: 'RIESGO DE COLAPSO', en: 'COLLAPSE RISK',
    desc: { es: 'Inspección presencial inmediata', en: 'Immediate on-site inspection' },
    prioridad: 'critica', nivel: 'critico',
  },
  {
    val: 'riesgo_moderado', icon: '🟠', color: '#C2410C', bg: '#FFF7ED', border: '#FB923C',
    es: 'RIESGO MODERADO', en: 'MODERATE RISK',
    desc: { es: 'Requiere visita técnica (prioritaria)', en: 'Needs technical visit (priority)' },
    prioridad: 'alta', nivel: 'moderado',
  },
  {
    val: 'solo_estetico', icon: '🟢', color: '#15803D', bg: '#F0FDF4', border: '#4ADE80',
    es: 'SOLO DAÑO ESTÉTICO', en: 'COSMETIC DAMAGE ONLY',
    desc: { es: 'No urgente — seguimiento', en: 'Not urgent — follow-up' },
    prioridad: 'normal', nivel: 'leve',
  },
];

const DANO_CONFIG = {
  leve:        { color: '#B7950B', icon: '🟡', label: { es: 'Daño leve',     en: 'Minor' } },
  moderado:    { color: '#CA6F1E', icon: '🟠', label: { es: 'Daño moderado', en: 'Moderate' } },
  grave:       { color: '#C0392B', icon: '🔴', label: { es: 'Daño grave',    en: 'Severe' } },
  critico:     { color: '#922B21', icon: '🚨', label: { es: 'Crítico',       en: 'Critical' } },
  colapsado:   { color: '#4A0E0E', icon: '💥', label: { es: 'Colapsado',     en: 'Collapsed' } },
  no_evaluado: { color: '#7F8C8D', icon: '⚪', label: { es: 'Sin evaluar',   en: 'Not evaluated' } },
};

function TarjetaTriage({ reporte, es, perfil, onTriaged }) {
  const [expandido, setExpandido] = useState(false);
  const [riesgo, setRiesgo] = useState('');
  const [presencial, setPresencial] = useState(true);
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verFotos, setVerFotos] = useState(false);
  const [guardado, setGuardado] = useState(null); // datos tras guardar triaje

  const cfg = DANO_CONFIG[reporte.nivel_dano] || DANO_CONFIG.no_evaluado;
  const sel = TRIAGE_OPTS.find(o => o.val === riesgo);

  // Si elige riesgo de colapso, la inspección presencial es forzada
  const presencialFinal = riesgo === 'riesgo_colapso' ? true : riesgo === 'solo_estetico' ? presencial : true;

  const guardar = async () => {
    if (!riesgo || !sel) return;
    setEnviando(true);
    try {
      const reqInsp = riesgo === 'solo_estetico' ? presencial : true;
      await base44.entities.ReportesDano.update(reporte.id, {
        triage_estado: reqInsp ? 'en_cola_inspeccion' : 'clasificado',
        triage_riesgo: riesgo,
        triage_notas: notas,
        triage_por: perfil.user_nombre || perfil.user_email,
        triage_fecha: new Date().toISOString(),
        requiere_inspeccion_presencial: reqInsp,
        prioridad: sel.prioridad,
        nivel_dano: reporte.nivel_dano === 'no_evaluado' ? sel.nivel : reporte.nivel_dano,
      });
      // Registrar evento en la línea de tiempo
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: reporte.id,
        tipo_sitio: 'edificio',
        tipo_accion: 'verificado',
        descripcion: `[TRIAGE ${(perfil.tipo_perfil || 'especialista').toUpperCase()}] ${es ? sel.es : sel.en}${notas ? ` — ${notas}` : ''}`,
        reportante_nombre: perfil.user_nombre || perfil.user_email,
        fuente: 'especialista',
        es_verificado: true,
      });
      setGuardado({
        triage_riesgo: riesgo,
        requiere_inspeccion_presencial: reqInsp,
        triage_estado: reqInsp ? 'en_cola_inspeccion' : 'clasificado',
      });
      onTriaged(reporte.id, riesgo, reqInsp, sel.prioridad);
    } catch {}
    setEnviando(false);
  };

  // Tras guardar, mezclamos lo guardado al reporte para las acciones del especialista
  const reporteActual = guardado ? { ...reporte, ...guardado } : reporte;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3">
      <button onClick={() => setExpandido(v => !v)} className="w-full p-4 text-left cursor-pointer hover:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: cfg.color, fontSize: 15 }}>{cfg.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
                {es ? cfg.label.es : cfg.label.en}
              </span>
              {reporte.prioridad === 'critica' && (
                <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">{es ? 'CRÍTICO' : 'CRITICAL'}</span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {reporte.nombre_lugar || reporte.tipo_estructura?.replace(/_/g, ' ') || (es ? 'Sin nombre' : 'Unnamed')}
            </p>
            <p className="text-xs text-gray-400 truncate">📍 {[reporte.direccion, reporte.ciudad].filter(Boolean).join(' · ')}</p>
            {['si', 'voces'].includes(reporte.personas_atrapadas) && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertTriangle size={9} /> {es ? '¡PERSONAS ATRAPADAS!' : 'TRAPPED PEOPLE!'}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {reporte.foto_urls?.length > 0 && <span className="text-[9px] text-gray-400">📷 {reporte.foto_urls.length}</span>}
            <span className="text-gray-400 text-sm">{expandido ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-100 p-4 space-y-4">
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

          {reporte.descripcion && (
            <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{reporte.descripcion}</p>
          )}

          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">
              {es ? '🔍 Triaje rápido — Clasifica el riesgo según las fotos y datos' : '🔍 Quick triage — Classify risk from photos and data'}
            </p>
            <div className="space-y-1.5 mb-3">
              {TRIAGE_OPTS.map(opt => (
                <button key={opt.val} onClick={() => setRiesgo(opt.val)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${riesgo === opt.val ? opt.border : '#E5E7EB'}`,
                    background: riesgo === opt.val ? opt.bg : '#fff',
                  }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 15 }}>{opt.icon}</span>
                    <span className="text-xs font-bold" style={{ color: riesgo === opt.val ? opt.color : '#374151' }}>
                      {es ? opt.es : opt.en}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 ml-6">{es ? opt.desc.es : opt.desc.en}</p>
                </button>
              ))}
            </div>

            {/* Para estético: opción de mandar igual a inspección o no */}
            {riesgo === 'solo_estetico' && (
              <label className="flex items-center gap-2 text-xs text-gray-600 mb-2 cursor-pointer">
                <input type="checkbox" checked={presencial} onChange={e => setPresencial(e.target.checked)} className="rounded" />
                {es ? 'Aun así, enviar a cola de inspección presencial' : 'Still send to on-site inspection queue'}
              </label>
            )}
            {riesgo && riesgo !== 'solo_estetico' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
                <p className="text-[11px] text-amber-700 font-semibold">
                  📋 {es ? 'Se enviará a la cola de inspección presencial.' : 'Will be sent to the on-site inspection queue.'}
                </p>
              </div>
            )}

            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder={es ? 'Notas técnicas del triaje (opcional)...' : 'Technical triage notes (optional)...'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:border-blue-400 mb-2" />

            {guardado ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <CheckCircle size={15} className="text-green-600" />
                <p className="text-xs font-semibold text-green-700">{es ? 'Triaje guardado. El sello aparece en la ficha del edificio.' : 'Triage saved. The seal now shows on the building record.'}</p>
              </div>
            ) : (
              <button onClick={guardar} disabled={!riesgo || enviando}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
                {enviando ? <Loader2 size={13} className="animate-spin" /> : '✓'}
                {es ? 'Guardar triaje' : 'Save triage'}
              </button>
            )}
          </div>

          {/* Acciones del especialista: contacto, email, notas, inspección presencial */}
          <div className="border-t border-gray-100 pt-3">
            <AccionesEspecialista reporte={reporteActual} perfil={perfil} es={es} onActualizado={(id, d) => setGuardado(g => ({ ...g, ...d }))} />
          </div>

          <Link to={`/edificio?id=${reporte.id}`} className="block text-center text-xs text-blue-600 font-semibold no-underline hover:underline">
            {es ? 'Ver ficha completa →' : 'View full record →'}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function TriageRapido({ perfil, es, reportes, onTriaged }) {
  const [pagina, setPagina] = useState(10);

  // Solo reportes pendientes de triaje — los críticos/atrapados primero
  const pendientes = reportes
    .filter(r => (r.triage_riesgo || 'sin_clasificar') === 'sin_clasificar')
    .sort((a, b) => {
      const urg = x => (['si', 'voces'].includes(x.personas_atrapadas) ? 0 : ['critico', 'colapsado'].includes(x.nivel_dano) ? 1 : ['grave'].includes(x.nivel_dano) ? 2 : 3);
      return urg(a) - urg(b);
    });

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <p className="text-xs font-bold text-blue-800 mb-0.5">🔍 {es ? 'Cola de triaje técnico' : 'Technical triage queue'}</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          {es ? 'Revisa fotos y datos en línea y clasifica cada edificio. Los de riesgo de colapso y moderado pasan a inspección presencial prioritaria.'
               : 'Review photos and data online and classify each building. Collapse-risk and moderate-risk ones move to priority on-site inspection.'}
        </p>
      </div>

      {pendientes.length === 0 ? (
        <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl">
          <CheckCircle size={28} className="text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{es ? '¡Todo clasificado! No hay edificios por triar.' : 'All classified! No buildings to triage.'}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{pendientes.length} {es ? 'por clasificar' : 'to classify'}</p>
          {pendientes.slice(0, pagina).map(r => (
            <TarjetaTriage key={r.id} reporte={r} es={es} perfil={perfil} onTriaged={onTriaged} />
          ))}
          {pendientes.length > pagina && (
            <button onClick={() => setPagina(v => v + 10)}
              className="w-full py-3 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
              {es ? `Ver ${Math.min(10, pendientes.length - pagina)} más →` : `Load ${Math.min(10, pendientes.length - pagina)} more →`}
            </button>
          )}
        </>
      )}
    </div>
  );
}