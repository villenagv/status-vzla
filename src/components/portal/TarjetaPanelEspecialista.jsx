import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Camera, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ComentariosTecnicos from './ComentariosTecnicos';
import { evalCfg, ESTATUS_OPTS } from './evaluacionConfig';

const TIPO_EVAL_BOTONES = [
  { val: 'evaluacion_digital',    es: '💻 Evaluación digital',    en: '💻 Digital evaluation' },
  { val: 'evaluacion_presencial', es: '🏗️ Evaluación presencial', en: '🏗️ On-site evaluation' },
  { val: 'no_concluyente',        es: '❓ No concluyente',        en: '❓ Not conclusive' },
  { val: 'urgente',               es: '🚨 Marcar urgente',        en: '🚨 Mark urgent' },
];

export default function TarjetaPanelEspecialista({ reporte, es, perfil, onActualizado }) {
  const [expandido, setExpandido] = useState(false);
  const [verFotos, setVerFotos] = useState(false);
  const [guardandoTipo, setGuardandoTipo] = useState(false);
  const [guardandoEstatus, setGuardandoEstatus] = useState(false);
  const [derivacion, setDerivacion] = useState(reporte.derivacion_recomendada || '');
  const [guardandoDerivacion, setGuardandoDerivacion] = useState(false);
  const [derivacionOk, setDerivacionOk] = useState(false);
  const [solicitud, setSolicitud] = useState('');
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [solicitudOk, setSolicitudOk] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const cfg = evalCfg(reporte.tipo_evaluacion);

  const log = async (texto) => {
    try {
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: reporte.id, tipo_sitio: 'edificio', tipo_accion: 'tengo_actualizacion',
        descripcion: texto, reportante_nombre: perfil.user_nombre || perfil.user_email,
        fuente: 'especialista', es_verificado: true,
      });
    } catch {}
  };

  const marcarTipoEvaluacion = async (val) => {
    setGuardandoTipo(true);
    try {
      await base44.entities.ReportesDano.update(reporte.id, { tipo_evaluacion: val });
      const label = TIPO_EVAL_BOTONES.find(b => b.val === val);
      await log(`[PANEL ESPECIALISTA] ${es ? 'Estado cambiado a' : 'Status changed to'}: ${label ? (es ? label.es : label.en) : val}`);
      onActualizado(reporte.id, { tipo_evaluacion: val });
    } catch {}
    setGuardandoTipo(false);
  };

  const cambiarEstatus = async (val) => {
    setGuardandoEstatus(true);
    try {
      await base44.entities.ReportesDano.update(reporte.id, { estado_verificacion: val });
      onActualizado(reporte.id, { estado_verificacion: val });
    } catch {}
    setGuardandoEstatus(false);
  };

  const marcarVerificado = async () => {
    setVerificando(true);
    try {
      await base44.entities.ReportesDano.update(reporte.id, { nivel_verificacion: 'institucional', estado_verificacion: 'verificado' });
      await log(`[PANEL ESPECIALISTA] ${es ? 'Caso marcado como verificado' : 'Case marked as verified'}`);
      onActualizado(reporte.id, { nivel_verificacion: 'institucional', estado_verificacion: 'verificado' });
    } catch {}
    setVerificando(false);
  };

  const guardarDerivacion = async () => {
    if (!derivacion.trim()) return;
    setGuardandoDerivacion(true);
    try {
      await base44.entities.ReportesDano.update(reporte.id, { derivacion_recomendada: derivacion.trim() });
      await log(`[DERIVACIÓN RECOMENDADA] ${derivacion.trim()}`);
      onActualizado(reporte.id, { derivacion_recomendada: derivacion.trim() });
      setDerivacionOk(true);
      setTimeout(() => setDerivacionOk(false), 2500);
    } catch {}
    setGuardandoDerivacion(false);
  };

  const solicitarInfo = async () => {
    if (!solicitud.trim() || !reporte.reportante_email) return;
    setEnviandoSolicitud(true);
    try {
      const res = await base44.functions.invoke('enviarEmailReportante', {
        reporte_id: reporte.id, mensaje: solicitud.trim(),
        asunto: es ? 'Necesitamos más información sobre tu reporte' : 'We need more information about your report', es,
      });
      if (res?.data?.ok) { setSolicitudOk(true); setSolicitud(''); setTimeout(() => setSolicitudOk(false), 2500); }
    } catch {}
    setEnviandoSolicitud(false);
  };

  return (
    <div className="bg-white border-2 rounded-2xl overflow-hidden mb-3" style={{ borderColor: cfg.border }}>
      <button onClick={() => setExpandido(v => !v)} className="w-full p-4 text-left cursor-pointer hover:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              {cfg.icon} {es ? cfg.label.es : cfg.label.en}
            </span>
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
            {reporte.prioridad === 'critica' && <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">{es ? 'CRÍTICO' : 'CRITICAL'}</span>}
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

          {reporte.descripcion && <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{reporte.descripcion}</p>}

          {/* Tipo de evaluación */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">{es ? 'Marcar tipo de evaluación' : 'Mark evaluation type'}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TIPO_EVAL_BOTONES.map(b => (
                <button key={b.val} onClick={() => marcarTipoEvaluacion(b.val)} disabled={guardandoTipo}
                  className={`text-xs font-semibold py-2 px-2 rounded-lg border cursor-pointer disabled:opacity-40 ${reporte.tipo_evaluacion === b.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}>
                  {es ? b.es : b.en}
                </button>
              ))}
            </div>
          </div>

          {/* Estatus + verificar */}
          <div className="flex items-center gap-2">
            <select value={reporte.estado_verificacion || 'recibido'} onChange={e => cambiarEstatus(e.target.value)} disabled={guardandoEstatus}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
              {ESTATUS_OPTS.map(o => <option key={o.val} value={o.val}>{es ? o.es : o.en}</option>)}
            </select>
            <button onClick={marcarVerificado} disabled={verificando || reporte.nivel_verificacion === 'institucional'}
              className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-40 cursor-pointer flex-shrink-0">
              {verificando ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {reporte.nivel_verificacion === 'institucional' ? (es ? 'Verificado' : 'Verified') : (es ? 'Verificar' : 'Verify')}
            </button>
          </div>

          {/* Comentarios técnicos */}
          <div className="border-t border-gray-100 pt-3">
            <ComentariosTecnicos reporte={reporte} perfil={perfil} es={es} onActualizado={onActualizado} />
          </div>

          {/* Solicitar más información */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-700 mb-2">{es ? 'Solicitar más información al reportante' : 'Request more info from reporter'}</p>
            {!reporte.reportante_email ? (
              <p className="text-[11px] text-gray-400">{es ? 'El reportante no dejó un correo de contacto.' : 'The reporter did not leave a contact email.'}</p>
            ) : solicitudOk ? (
              <p className="text-xs font-semibold text-green-600">✅ {es ? 'Solicitud enviada.' : 'Request sent.'}</p>
            ) : (
              <div className="flex gap-2">
                <textarea value={solicitud} onChange={e => setSolicitud(e.target.value)} rows={2}
                  placeholder={es ? '¿Qué información necesitas?' : 'What information do you need?'}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400" />
                <button onClick={solicitarInfo} disabled={!solicitud.trim() || enviandoSolicitud}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3 rounded-lg disabled:opacity-40 cursor-pointer flex-shrink-0 flex items-center justify-center">
                  {enviandoSolicitud ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            )}
          </div>

          {/* Derivación recomendada */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-700 mb-2">{es ? 'Recomendar derivación a autoridad/organización' : 'Recommend referral to authority/organization'}</p>
            <div className="flex gap-2">
              <input value={derivacion} onChange={e => setDerivacion(e.target.value)}
                placeholder={es ? 'Ej: Protección Civil, Bomberos...' : 'E.g: Civil Protection, Fire Dept...'}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400" />
              <button onClick={guardarDerivacion} disabled={!derivacion.trim() || guardandoDerivacion}
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-3 rounded-lg disabled:opacity-40 cursor-pointer flex-shrink-0">
                {guardandoDerivacion ? <Loader2 size={13} className="animate-spin" /> : (es ? 'Guardar' : 'Save')}
              </button>
            </div>
            {derivacionOk && <p className="text-[11px] font-semibold text-green-600 mt-1">✅ {es ? 'Guardado.' : 'Saved.'}</p>}
          </div>

          <Link to={`/edificio?id=${reporte.id}`} className="block text-center text-xs text-blue-600 font-semibold no-underline hover:underline">
            {es ? 'Ver ficha completa →' : 'View full record →'}
          </Link>
        </div>
      )}
    </div>
  );
}