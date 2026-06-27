import { useState } from 'react';
import { X, Bell, Share2, Pencil, ChevronRight, Loader2, Check, MapPin, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import NotificarmeEmail from '@/components/svzla/NotificarmeEmail';

export default function FichaAccionesModal({ item, tipo, onClose }) {
  const { lang } = useLang();
  const es = lang === 'es';

  // ── EDIFICIO ──
  const [actualizandoEdificio, setActualizandoEdificio] = useState(false);
  const [edificioForm, setEdificioForm] = useState({
    tipoAccion: '', nivelDano: '', atrapados: '', riesgos: [],
    electricidad: '', agua: '', gas: '', notasServicios: '',
    accesoVias: '', descripcion: '',
    nombre: '', telefono: '', email: '', redSocial: '',
    fotoUrls: [],
  });
  const [enviandoEdificio, setEnviandoEdificio] = useState(false);
  const [enviandoEdificioOk, setEnviandoEdificioOk] = useState(false);

  // ── PERSONA — actualización general ──
  const [actualizandoPersona, setActualizandoPersona] = useState(false);
  const [personaForm, setPersonaForm] = useState({ estado: '', descripcion: '', nombre: '', contacto: '' });
  const [enviandoPersona, setEnviandoPersona] = useState(false);
  const [enviandoPersonaOk, setEnviandoPersonaOk] = useState(false);

  // ── PERSONA — encontré a alguien ──
  const [reportandoEncontrado, setReportandoEncontrado] = useState(false);
  const [encontradoForm, setEncontradoForm] = useState({
    condicion: '', lugar: '', notas: '',
    nombre: '', telefono: '', email: '',
  });
  const [enviandoEncontrado, setEnviandoEncontrado] = useState(false);
  const [enviandoEncontradoOk, setEnviandoEncontradoOk] = useState(false);

  const [copiado, setCopiado] = useState(false);

  const compartir = () => {
    const url = tipo === 'edificio'
      ? `${window.location.origin}/edificio?id=${item.id}`
      : `${window.location.origin}/persona?id=${item.id}`;
    const texto = tipo === 'persona' && item._fuente === 'busqueda'
      ? (es ? `🔴 ¿Lo/la has visto? ${item._nombre} · Última vez en ${item.ciudad || '?'}. ${url}` : `🔴 Have you seen them? ${item._nombre} · Last seen in ${item.ciudad || '?'}. ${url}`)
      : `${item._nombre} · ${item.ciudad || ''} ${url}`;
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const toggleRiesgo = (r) => {
    setEdificioForm(f => ({
      ...f,
      riesgos: f.riesgos.includes(r) ? f.riesgos.filter(x => x !== r) : [...f.riesgos, r],
    }));
  };

  const enviarActualizacionEdificio = async () => {
    if (!edificioForm.tipoAccion) return;
    setEnviandoEdificio(true);
    try {
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: item.id,
        tipo_sitio: 'edificio',
        tipo_accion: edificioForm.tipoAccion,
        descripcion: [
          edificioForm.descripcion,
          edificioForm.notasServicios ? (es ? `Servicios: ${edificioForm.notasServicios}` : `Services: ${edificioForm.notasServicios}`) : '',
          edificioForm.accesoVias ? (es ? `Acceso vías: ${edificioForm.accesoVias}` : `Road access: ${edificioForm.accesoVias}`) : '',
        ].filter(Boolean).join(' | '),
        nivel_dano_nuevo: edificioForm.nivelDano || undefined,
        personas_atrapadas_nuevo: edificioForm.atrapados || undefined,
        es_sensible: ['personas_atrapadas', 'persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(edificioForm.tipoAccion),
        reportante_nombre: edificioForm.nombre || undefined,
        reportante_contacto: [edificioForm.telefono, edificioForm.email, edificioForm.redSocial].filter(Boolean).join(' / ') || undefined,
        fuente: 'ciudadano',
      });
      if (edificioForm.nivelDano) {
        await base44.entities.ReportesDano.update(item.id, {
          nivel_dano: edificioForm.nivelDano,
          riesgo_gas: edificioForm.riesgos.includes('gas'),
          riesgo_electrico: edificioForm.riesgos.includes('electrico'),
          riesgo_incendio: edificioForm.riesgos.includes('incendio'),
          personas_atrapadas: edificioForm.atrapados || undefined,
        }).catch(() => {});
      }
      if (edificioForm.notasServicios || edificioForm.electricidad || edificioForm.agua || edificioForm.gas) {
        await base44.entities.EstadoOperativoEdificio.create({
          edificio_id: item.id,
          electricidad: edificioForm.electricidad || 'no_confirmado',
          agua: edificioForm.agua || 'no_confirmado',
          gas: edificioForm.gas || 'no_confirmado',
          notas_racionamiento: edificioForm.notasServicios || undefined,
          acceso_calle: edificioForm.accesoVias ? 'dificultad' : 'no_confirmado',
          notas_acceso: edificioForm.accesoVias || undefined,
          reportante_nombre: edificioForm.nombre || undefined,
          reportante_contacto: edificioForm.telefono || edificioForm.email || undefined,
          fuente: 'ciudadano',
        }).catch(() => {});
      }
      await base44.functions.invoke('notificarActualizacionEdificio', {
        edificio_id: item.id,
        tipo_accion: edificioForm.tipoAccion,
        nivel_dano: edificioForm.nivelDano || item.nivel_dano,
        nombre_lugar: item._nombre,
        descripcion: edificioForm.descripcion,
        lang,
      }).catch(() => {});
      setEnviandoEdificioOk(true);
    } catch {}
    setEnviandoEdificio(false);
  };

  const enviarActualizacionPersona = async () => {
    if (!personaForm.estado && !personaForm.descripcion) return;
    setEnviandoPersona(true);
    try {
      const entityName = item._fuente === 'busqueda' ? 'PersonasBuscadas'
        : item._fuente === 'cris' ? 'PersonaCRIS'
        : item._fuente === 'institucional' ? 'PersonaRegistrada'
        : 'PersonasEncontradas';
      const updateData = {};
      if (personaForm.estado) {
        if (entityName === 'PersonasBuscadas') updateData.estado_caso = personaForm.estado;
        else if (entityName === 'PersonaCRIS') updateData.estado_actual = personaForm.estado;
        else if (entityName === 'PersonaRegistrada') updateData.condicion = personaForm.estado;
      }
      if (personaForm.descripcion) updateData.notas_publicas = personaForm.descripcion;
      if (Object.keys(updateData).length > 0) {
        await base44.entities[entityName].update(item.id, updateData);
      }
      await base44.entities.EventoHistorial.create({
        persona_id: item.id,
        tipo_evento: 'actualizado',
        descripcion: personaForm.descripcion || (es ? 'Actualización enviada desde directorio.' : 'Update sent from directory.'),
        reportante_nombre: personaForm.nombre,
        reportante_contacto: personaForm.contacto,
        fuente: 'vecino',
      }).catch(() => {});
      await base44.functions.invoke('notificarActualizacion', {
        persona_id: item.id,
        descripcion: personaForm.descripcion || (es ? `Actualización: ${personaForm.estado}` : `Status update: ${personaForm.estado}`),
        lang,
      }).catch(() => {});
      setEnviandoPersonaOk(true);
    } catch {}
    setEnviandoPersona(false);
  };

  const enviarEncontrado = async () => {
    if (!encontradoForm.condicion && !encontradoForm.lugar) return;
    setEnviandoEncontrado(true);
    try {
      await base44.entities.PersonasEncontradas.create({
        nombre_o_descripcion: item._nombre || item.nombre_completo,
        condicion: encontradoForm.condicion || 'a_salvo',
        ubicacion_actual: encontradoForm.lugar,
        ciudad: item.ciudad || '',
        estado_region: item.estado_region || '',
        notas_publicas: encontradoForm.notas || undefined,
        persona_buscada_id: item.id,
        reportado_por_nombre: encontradoForm.nombre || undefined,
        reportado_por_telefono: encontradoForm.telefono || undefined,
        reportado_por_email: encontradoForm.email || undefined,
        nivel_verificacion: 'comunidad',
        fuente: 'directorio_modal',
      });
      if (item._fuente === 'busqueda') {
        await base44.entities.PersonasBuscadas.update(item.id, {
          estado_caso: encontradoForm.condicion === 'fallecido_reportado' ? 'fallecido_reportado' : 'informacion_recibida',
        }).catch(() => {});
      }
      await base44.entities.EventoHistorial.create({
        persona_id: item.id,
        tipo_evento: 'persona_encontrada',
        descripcion: (es ? `Reportado encontrado/a en: ${encontradoForm.lugar}.` : `Reported found at: ${encontradoForm.lugar}.`) + (encontradoForm.notas ? ` ${encontradoForm.notas}` : ''),
        reportante_nombre: encontradoForm.nombre,
        reportante_contacto: encontradoForm.telefono || encontradoForm.email,
        fuente: 'directorio_modal',
      }).catch(() => {});
      await base44.functions.invoke('notificarActualizacion', {
        persona_id: item.id,
        descripcion: es ? `✅ Reporte de hallazgo: ${encontradoForm.lugar}` : `✅ Found report: ${encontradoForm.lugar}`,
        lang,
      }).catch(() => {});
      setEnviandoEncontradoOk(true);
    } catch {}
    setEnviandoEncontrado(false);
  };

  const esBuscando = item._fuente === 'busqueda' && !['encontrado_con_vida', 'en_hospital_refugio', 'caso_cerrado'].includes(item.estado_caso);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              {tipo === 'persona' ? (es ? 'Persona' : 'Person') : (es ? 'Edificio / Estructura' : 'Building / Structure')}
            </p>
            <h2 className="text-base font-black text-[#1A1F2E] leading-tight truncate">{item._nombre}</h2>
            {(item.ciudad || item.ultima_ubicacion_conocida || item.direccion) && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin size={9} />
                {[item.direccion || item.ultima_ubicacion_conocida, item.ciudad].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer flex-shrink-0">
            <X size={14} className="text-gray-600" />
          </button>
        </div>

        {/* Scroll body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">

          {/* ── ACCIONES PERSONA ── */}
          {tipo === 'persona' && (
            <>
              {/* Anti-extorsión */}
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="text-amber-600 flex-shrink-0 text-sm">⚠️</span>
                <p className="text-[11px] text-amber-800 leading-snug">
                  {es
                    ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.'
                    : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
                </p>
              </div>

              {/* Ver ficha completa */}
              {item._fuente === 'busqueda' && (
                <Link to={`/persona?id=${item.id}`} onClick={onClose}
                  className="flex items-center justify-between bg-[#1A1F2E] text-white rounded-2xl px-4 py-3.5 no-underline">
                  <span className="text-sm font-bold">📋 {es ? 'Ver ficha completa' : 'View full record'}</span>
                  <ChevronRight size={16} />
                </Link>
              )}

              {/* ── ENCONTRÉ A ESTA PERSONA (inline) ── */}
              {esBuscando && !actualizandoPersona && !enviandoPersonaOk && !enviandoEncontradoOk && (
                <>
                  {!reportandoEncontrado ? (
                    <button onClick={() => setReportandoEncontrado(true)}
                      className="flex items-center justify-between w-full bg-green-600 text-white rounded-2xl px-4 py-3.5 cursor-pointer">
                      <span className="text-sm font-bold">✋ {es ? 'La/lo encontré — reportar ahora' : 'I found them — report now'}</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-black text-green-900 uppercase tracking-wide">
                        ✋ {es ? '¿Dónde y cómo la/lo encontraste?' : 'Where and how did you find them?'}
                      </p>
                      <p className="text-[11px] text-green-700 leading-snug">
                        {es
                          ? 'Solo comparte información que hayas visto o verificado. No publiques rumores. Tus datos serán privados.'
                          : 'Only share information you have seen or verified. Do not spread rumors. Your contact info will be private.'}
                      </p>

                      {/* Condición */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{es ? 'Condición' : 'Condition'}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { val: 'a_salvo',         es: '✅ A salvo',             en: '✅ Safe' },
                            { val: 'herido_leve',      es: '🩹 Herido leve',         en: '🩹 Minor injury' },
                            { val: 'herido_grave',     es: '🚑 Herido grave',         en: '🚑 Serious injury' },
                            { val: 'fallecido_reportado', es: '⚫ Fallecido (rep.)',  en: '⚫ Deceased (rep.)' },
                            { val: 'no_identificado',  es: '❓ No identificado',      en: '❓ Unidentified' },
                          ].map(c => (
                            <button key={c.val}
                              onClick={() => setEncontradoForm(f => ({ ...f, condicion: f.condicion === c.val ? '' : c.val }))}
                              className={`py-2 px-2 rounded-xl text-xs font-semibold border cursor-pointer text-left ${encontradoForm.condicion === c.val ? 'bg-green-700 text-white border-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                              {es ? c.es : c.en}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lugar */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{es ? 'Lugar donde la/lo viste *' : 'Where you saw them *'}</p>
                        <input
                          value={encontradoForm.lugar}
                          onChange={e => setEncontradoForm(f => ({ ...f, lugar: e.target.value }))}
                          placeholder={es ? 'Ej: Refugio Cruz Roja, Av. Principal, Maiquetía' : 'E.g.: Red Cross shelter, Main Ave, Maiquetia'}
                          className="w-full border border-green-300 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none bg-white"
                        />
                      </div>

                      {/* Notas */}
                      <textarea
                        rows={2}
                        value={encontradoForm.notas}
                        onChange={e => setEncontradoForm(f => ({ ...f, notas: e.target.value }))}
                        placeholder={es ? 'Información adicional (estado, acompañantes, etc.)...' : 'Additional info (status, companions, etc.)...'}
                        className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white"
                      />

                      {/* Datos reportante (privados) */}
                      <div className="bg-white border border-green-200 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                          🔒 {es ? 'Tus datos — privados, nunca se publican' : 'Your info — private, never published'}
                        </p>
                        <input value={encontradoForm.nombre} onChange={e => setEncontradoForm(f => ({ ...f, nombre: e.target.value }))}
                          placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none" />
                        <input value={encontradoForm.telefono} onChange={e => setEncontradoForm(f => ({ ...f, telefono: e.target.value }))}
                          placeholder={es ? 'Teléfono / WhatsApp (opcional)' : 'Phone / WhatsApp (optional)'}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none" />
                        <input value={encontradoForm.email} onChange={e => setEncontradoForm(f => ({ ...f, email: e.target.value }))}
                          placeholder={es ? 'Email (opcional)' : 'Email (optional)'}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none" />
                      </div>

                      <div className="flex gap-2">
                        <button onClick={enviarEncontrado}
                          disabled={enviandoEncontrado || (!encontradoForm.condicion && !encontradoForm.lugar)}
                          className="flex-1 bg-green-700 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5">
                          {enviandoEncontrado ? <Loader2 size={13} className="animate-spin" /> : '📡'}
                          {es ? 'Enviar reporte' : 'Send report'}
                        </button>
                        <button onClick={() => setReportandoEncontrado(false)} className="text-xs text-gray-400 underline cursor-pointer px-2">
                          {es ? 'Cancelar' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {enviandoEncontradoOk && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-2xl px-4 py-3.5">
                  <Check size={14} className="text-green-600" />
                  <div>
                    <p className="text-sm font-black text-green-800">{es ? '¡Reporte enviado!' : 'Report sent!'}</p>
                    <p className="text-xs text-green-600">{es ? 'El familiar será notificado si hay suscripción activa.' : 'Family will be notified if subscribed.'}</p>
                  </div>
                </div>
              )}

              {/* Tengo una pista */}
              {esBuscando && (
                <Link to={`/pista?persona=${item.id}`} onClick={onClose}
                  className="flex items-center justify-between bg-blue-600 text-white rounded-2xl px-4 py-3.5 no-underline">
                  <span className="text-sm font-bold">💡 {es ? 'Tengo una pista' : 'I have a lead'}</span>
                  <ChevronRight size={16} />
                </Link>
              )}

              {/* Actualizar estado */}
              {!actualizandoPersona && !enviandoPersonaOk && !reportandoEncontrado && (
                <button onClick={() => setActualizandoPersona(true)}
                  className="flex items-center justify-between w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 cursor-pointer">
                  <span className="text-sm font-bold text-amber-800">
                    <Pencil size={13} className="inline mr-1.5" />
                    {es ? 'Tengo información / actualización' : 'I have info / an update'}
                  </span>
                  <ChevronRight size={16} className="text-amber-500" />
                </button>
              )}

              {actualizandoPersona && !enviandoPersonaOk && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-800">✏️ {es ? 'Enviar actualización' : 'Send update'}</p>
                  {item._fuente === 'busqueda' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 'informacion_recibida', es: '🔵 Info recibida',     en: '🔵 Info received' },
                        { val: 'visto_no_confirmado',  es: '🟠 Visto sin confirmar', en: '🟠 Seen unconfirmed' },
                        { val: 'encontrado_con_vida',  es: '✅ Encontrado',         en: '✅ Found alive' },
                        { val: 'en_hospital_refugio',  es: '🏥 En hospital/refugio', en: '🏥 In hospital/shelter' },
                      ].map(s => (
                        <button key={s.val}
                          onClick={() => setPersonaForm(f => ({ ...f, estado: f.estado === s.val ? '' : s.val }))}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border cursor-pointer ${personaForm.estado === s.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-700'}`}>
                          {es ? s.es : s.en}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea rows={2} value={personaForm.descripcion}
                    onChange={e => setPersonaForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder={es ? 'Describe lo que sabes (sin datos sensibles)...' : 'Describe what you know (no sensitive data)...'}
                    className="w-full border border-amber-300 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white" />
                  <input value={personaForm.nombre} onChange={e => setPersonaForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                    className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none bg-white" />
                  <input value={personaForm.contacto} onChange={e => setPersonaForm(f => ({ ...f, contacto: e.target.value }))}
                    placeholder={es ? 'Tu contacto (opcional, privado)' : 'Your contact (optional, private)'}
                    className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none bg-white" />
                  <div className="flex gap-2">
                    <button onClick={enviarActualizacionPersona}
                      disabled={enviandoPersona || (!personaForm.estado && !personaForm.descripcion)}
                      className="flex-1 bg-amber-600 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1">
                      {enviandoPersona ? <Loader2 size={13} className="animate-spin" /> : '📡'}
                      {es ? 'Enviar' : 'Send'}
                    </button>
                    <button onClick={() => setActualizandoPersona(false)} className="text-xs text-gray-400 underline cursor-pointer px-2">
                      {es ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {enviandoPersonaOk && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5">
                  <Check size={14} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">{es ? 'Actualización enviada.' : 'Update sent.'}</span>
                </div>
              )}

              <NotificarmeEmail entidadId={item.id} tipoReporte="persona" />
              <button onClick={compartir}
                className="flex items-center justify-center gap-2 w-full bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 cursor-pointer">
                <Share2 size={13} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">{copiado ? (es ? '✅ Enlace copiado' : '✅ Link copied') : (es ? 'Copiar enlace' : 'Copy link')}</span>
              </button>
            </>
          )}

          {/* ── ACCIONES EDIFICIO ── */}
          {tipo === 'edificio' && (
            <>
              {/* Ver detalle completo */}
              <Link to={`/edificio?id=${item.id}`} onClick={onClose}
                className="flex items-center justify-between bg-[#1A1F2E] text-white rounded-2xl px-4 py-3.5 no-underline">
                <span className="text-sm font-bold">🏗️ {es ? 'Ver ficha completa' : 'View full record'}</span>
                <ChevronRight size={16} />
              </Link>

              {/* Alerta si hay atrapados */}
              {item.hayAtrapados && (
                <div className="bg-red-600 text-white rounded-2xl px-4 py-3 text-sm font-black text-center">
                  🆘 {es ? 'PERSONAS ATRAPADAS REPORTADAS' : 'TRAPPED PEOPLE REPORTED'}
                </div>
              )}

              {/* Advertencia seguridad edificios */}
              <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertTriangle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-800 leading-snug">
                  {es
                    ? 'No entres a estructuras dañadas. Si hay gas, cables caídos o personas atrapadas, espera a Protección Civil o Bomberos.'
                    : 'Do not enter damaged structures. If there is gas, fallen wires or trapped people, wait for Civil Protection or firefighters.'}
                </p>
              </div>

              {/* Formulario actualización edificio */}
              {!actualizandoEdificio && !enviandoEdificioOk && (
                <button onClick={() => setActualizandoEdificio(true)}
                  className="flex items-center justify-between w-full bg-blue-50 border-2 border-blue-300 rounded-2xl px-4 py-3.5 cursor-pointer">
                  <span className="text-sm font-bold text-blue-800">
                    <Pencil size={13} className="inline mr-1.5" />
                    {es ? 'Tengo una actualización' : 'I have an update'}
                  </span>
                  <ChevronRight size={16} className="text-blue-400" />
                </button>
              )}

              {actualizandoEdificio && !enviandoEdificioOk && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-blue-900 uppercase tracking-wide">
                      📋 {es ? 'Tu actualización' : 'Your update'}
                    </p>
                    <button onClick={() => setActualizandoEdificio(false)} className="text-xs text-gray-400 underline cursor-pointer">
                      {es ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>

                  {/* Tipo de acción */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{es ? '¿Qué quieres reportar?' : 'What do you want to report?'}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 'tengo_actualizacion',          es: '🔄 Tengo info nueva',         en: '🔄 I have new info' },
                        { val: 'reportar_urgencia',             es: '🚨 Urgencia',                  en: '🚨 Emergency' },
                        { val: 'personas_atrapadas',            es: '🆘 Hay atrapados',             en: '🆘 Trapped people' },
                        { val: 'persona_herida_recuperada',     es: '🩹 Recuperaron herido/a',      en: '🩹 Injured recovered' },
                        { val: 'persona_fallecida_recuperada',  es: '⚫ Recuperaron fallecido/a',   en: '⚫ Deceased recovered' },
                        { val: 'riesgo_marcado',                es: '💨 Nuevo riesgo',              en: '💨 New hazard' },
                      ].map(t => (
                        <button key={t.val}
                          onClick={() => setEdificioForm(f => ({ ...f, tipoAccion: f.tipoAccion === t.val ? '' : t.val }))}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer text-left ${edificioForm.tipoAccion === t.val ? 'bg-blue-700 text-white border-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                          {es ? t.es : t.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nivel de daño */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{es ? 'Nivel de daño actual' : 'Current damage level'}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { val: 'leve',      es: '🟡 Leve',      en: '🟡 Minor' },
                        { val: 'moderado',  es: '🟠 Moderado',   en: '🟠 Moderate' },
                        { val: 'grave',     es: '🔴 Grave',      en: '🔴 Severe' },
                        { val: 'critico',   es: '🔴 Crítico',    en: '🔴 Critical' },
                        { val: 'colapsado', es: '💥 Colapsado',  en: '💥 Collapsed' },
                        { val: '',          es: '— Sin cambio',  en: '— No change' },
                      ].map(n => (
                        <button key={n.val}
                          onClick={() => setEdificioForm(f => ({ ...f, nivelDano: f.nivelDano === n.val ? '' : n.val }))}
                          className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${edificioForm.nivelDano === n.val && n.val !== '' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                          {es ? n.es : n.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ¿Personas atrapadas? */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{es ? '¿Personas atrapadas?' : 'Trapped people?'}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 'si',     es: '🚨 Sí',           en: '🚨 Yes' },
                        { val: 'voces',  es: '👂 Voces/golpes',  en: '👂 Voices/sounds' },
                        { val: 'no',     es: '✅ No',            en: '✅ No' },
                        { val: 'no_sabe',es: '❓ No sé',         en: '❓ Unknown' },
                      ].map(a => (
                        <button key={a.val}
                          onClick={() => setEdificioForm(f => ({ ...f, atrapados: f.atrapados === a.val ? '' : a.val }))}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border cursor-pointer ${edificioForm.atrapados === a.val ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                          {es ? a.es : a.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Riesgos activos */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{es ? 'Riesgos activos' : 'Active hazards'}</p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { val: 'gas',      es: '💨 Gas',      en: '💨 Gas' },
                        { val: 'electrico',es: '⚡ Eléctrico', en: '⚡ Electrical' },
                        { val: 'incendio', es: '🔥 Incendio',  en: '🔥 Fire' },
                      ].map(r => (
                        <button key={r.val} onClick={() => toggleRiesgo(r.val)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${edificioForm.riesgos.includes(r.val) ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                          {es ? r.es : r.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Acceso por vías */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{es ? 'Acceso por vías' : 'Road access'}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 'normal',       es: '🟢 Normal',            en: '🟢 Normal' },
                        { val: 'dificultad',   es: '🟡 Con dificultad',    en: '🟡 With difficulty' },
                        { val: 'solo_peatonal',es: '🚶 Solo peatonal',     en: '🚶 Pedestrian only' },
                        { val: 'bloqueada',    es: '🔴 Bloqueada',         en: '🔴 Blocked' },
                      ].map(a => (
                        <button key={a.val}
                          onClick={() => setEdificioForm(f => ({ ...f, accesoVias: f.accesoVias === a.val ? '' : a.val }))}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border cursor-pointer ${edificioForm.accesoVias === a.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-700'}`}>
                          {es ? a.es : a.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Servicios básicos */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{es ? 'Servicios básicos' : 'Basic services'}</p>
                    <div className="space-y-2">
                      {[
                        { key: 'electricidad', es: '⚡ Electricidad', en: '⚡ Electricity' },
                        { key: 'agua',         es: '💧 Agua',         en: '💧 Water' },
                        { key: 'gas',          es: '🔥 Gas (servicio)', en: '🔥 Gas (service)' },
                      ].map(s => (
                        <div key={s.key} className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-gray-600 w-28 flex-shrink-0">{es ? s.es : s.en}</p>
                          <div className="flex gap-1 flex-wrap">
                            {[
                              { val: 'disponible',   es: '✅ Disponible',   en: '✅ Available' },
                              { val: 'intermitente', es: '⚡ Intermitente', en: '⚡ Intermittent' },
                              { val: 'no_disponible',es: '❌ No hay',       en: '❌ Unavailable' },
                            ].map(o => (
                              <button key={o.val}
                                onClick={() => setEdificioForm(f => ({ ...f, [s.key]: f[s.key] === o.val ? '' : o.val }))}
                                className={`py-1 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${edificioForm[s.key] === o.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
                                {es ? o.es : o.en}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <textarea rows={2} value={edificioForm.notasServicios}
                      onChange={e => setEdificioForm(f => ({ ...f, notasServicios: e.target.value }))}
                      placeholder={es ? 'Notas de racionamiento o horarios (ej: agua 6am–8am)...' : 'Rationing notes or schedules (e.g.: water 6am–8am)...'}
                      className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white mt-2" />
                  </div>

                  {/* Descripción general */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{es ? 'Describe lo que viste o sabes' : 'Describe what you saw or know'}</p>
                    <textarea rows={3} value={edificioForm.descripcion}
                      onChange={e => setEdificioForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder={es ? 'Sé específico: grietas, accesos, olores, ruidos, personas...' : 'Be specific: cracks, access, smells, noises, people...'}
                      className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white" />
                  </div>

                  {/* Datos reportante */}
                  <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      🔒 {es ? 'Tus datos — privados, no se publican' : 'Your info — private, not published'}
                    </p>
                    <input value={edificioForm.nombre} onChange={e => setEdificioForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder={es ? 'Nombre (opcional)' : 'Name (optional)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none" />
                    <input value={edificioForm.telefono} onChange={e => setEdificioForm(f => ({ ...f, telefono: e.target.value }))}
                      placeholder={es ? 'Teléfono / WhatsApp (opcional)' : 'Phone / WhatsApp (optional)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none" />
                    <input value={edificioForm.email} onChange={e => setEdificioForm(f => ({ ...f, email: e.target.value }))}
                      placeholder={es ? 'Email (opcional)' : 'Email (optional)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none" />
                    <input value={edificioForm.redSocial} onChange={e => setEdificioForm(f => ({ ...f, redSocial: e.target.value }))}
                      placeholder={es ? 'Red social: @usuario (opcional)' : 'Social media: @user (optional)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none" />
                  </div>

                  <p className="text-[10px] text-gray-400 italic">
                    📷 {es ? 'Para adjuntar fotos del lugar, usa la ficha completa del edificio.' : 'To attach photos, use the full building record.'}
                  </p>

                  <button onClick={enviarActualizacionEdificio}
                    disabled={enviandoEdificio || !edificioForm.tipoAccion}
                    className="w-full bg-blue-700 text-white text-sm font-black py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
                    {enviandoEdificio ? <Loader2 size={14} className="animate-spin" /> : '📡'}
                    {es ? 'Enviar actualización' : 'Send update'}
                  </button>
                </div>
              )}

              {enviandoEdificioOk && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5">
                  <Check size={14} className="text-green-600" />
                  <div>
                    <p className="text-sm font-black text-green-800">{es ? '¡Actualización enviada!' : 'Update sent!'}</p>
                    <p className="text-xs text-green-600">{es ? 'Los suscriptores serán notificados.' : 'Subscribers will be notified.'}</p>
                  </div>
                </div>
              )}

              <NotificarmeEmail entidadId={item.id} tipoReporte="dano" />
              <button onClick={compartir}
                className="flex items-center justify-center gap-2 w-full bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 cursor-pointer">
                <Share2 size={13} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">{copiado ? (es ? '✅ Enlace copiado' : '✅ Link copied') : (es ? 'Copiar enlace' : 'Copy link')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}