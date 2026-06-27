import { useState } from 'react';
import { X, Bell, Share2, Pencil, ChevronRight, Loader2, Check, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import NotificarmeEmail from '@/components/svzla/NotificarmeEmail';

/**
 * Modal de acciones para una ficha del directorio.
 * Funciona tanto para personas (cualquier fuente) como para edificios.
 *
 * Props:
 *   item       — objeto unificado con _fuente, _nombre, id, etc.
 *   tipo       — 'persona' | 'edificio'
 *   onClose    — función para cerrar el modal
 */
export default function FichaAccionesModal({ item, tipo, onClose }) {
  const { lang } = useLang();
  const es = lang === 'es';

  const [actualizandoEdificio, setActualizandoEdificio] = useState(false);
  const [updateForm, setUpdateForm] = useState({ tipo: '', nivel: '', desc: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Estado actualización persona (para cualquier fuente)
  const [actualizandoPersona, setActualizandoPersona] = useState(false);
  const [personaForm, setPersonaForm] = useState({ estado: '', descripcion: '', nombre: '', contacto: '' });
  const [enviandoPersona, setEnviandoPersona] = useState(false);
  const [enviandoPersonaOk, setEnviandoPersonaOk] = useState(false);

  const compartir = () => {
    if (tipo === 'persona' && item._fuente === 'busqueda') {
      const url = `${window.location.origin}/persona?id=${item.id}`;
      const texto = es
        ? `🔴 ¿Lo/la has visto? ${item._nombre} · Última vez en ${item.ciudad || '?'}. ${url}`
        : `🔴 Have you seen them? ${item._nombre} · Last seen in ${item.ciudad || '?'}. ${url}`;
      if (navigator.share) navigator.share({ title: `CRIS · ${item._nombre}`, text: texto });
      else navigator.clipboard?.writeText(texto);
    } else {
      const url = window.location.origin + (tipo === 'edificio' ? `/edificio?id=${item.id}` : `/persona?id=${item.id}`);
      const texto = `${item._nombre} · ${item.ciudad || ''} ${url}`;
      if (navigator.share) navigator.share({ title: item._nombre, text: texto });
      else navigator.clipboard?.writeText(texto);
    }
    onClose();
  };

  const enviarActualizacionEdificio = async () => {
    if (!updateForm.tipo || !item.id) return;
    setEnviando(true);
    try {
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: item.id, tipo_sitio: 'edificio',
        tipo_accion: updateForm.tipo,
        descripcion: updateForm.desc,
        nivel_dano_nuevo: updateForm.nivel || undefined,
        fuente: 'ciudadano',
      });
      if (updateForm.nivel) {
        await base44.entities.ReportesDano.update(item.id, { nivel_dano: updateForm.nivel }).catch(() => {});
      }
      await base44.functions.invoke('notificarActualizacionEdificio', {
        edificio_id: item.id,
        tipo_accion: updateForm.tipo,
        nivel_dano: updateForm.nivel || item.nivel_dano,
        nombre_lugar: item._nombre,
        descripcion: updateForm.desc,
        lang,
      }).catch(() => {});
      setEnviado(true);
    } catch {}
    setEnviando(false);
  };

  const enviarActualizacionPersona = async () => {
    if (!item.id) return;
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
      // Registrar evento en historial
      await base44.entities.EventoHistorial.create({
        persona_id: item.id,
        tipo_evento: 'actualizado',
        descripcion: personaForm.descripcion || (es ? 'Actualización enviada desde directorio.' : 'Update sent from directory.'),
        reportante_nombre: personaForm.nombre,
        reportante_contacto: personaForm.contacto,
        fuente: 'vecino',
      }).catch(() => {});
      // Notificar suscriptores
      await base44.functions.invoke('notificarActualizacion', {
        persona_id: item.id,
        descripcion: personaForm.descripcion || (es ? `Actualización de estado: ${personaForm.estado}` : `Status update: ${personaForm.estado}`),
        lang,
      }).catch(() => {});
      setEnviandoPersonaOk(true);
    } catch {}
    setEnviandoPersona(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              {tipo === 'persona' ? (es ? 'Persona' : 'Person') : (es ? 'Edificio' : 'Building')}
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
              {/* Ver ficha completa — solo busqueda tiene detalle propio */}
              {item._fuente === 'busqueda' && (
                <Link
                  to={`/persona?id=${item.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between bg-[#1A1F2E] text-white rounded-2xl px-4 py-3.5 no-underline"
                >
                  <span className="text-sm font-bold">📋 {es ? 'Ver ficha completa' : 'View full record'}</span>
                  <ChevronRight size={16} />
                </Link>
              )}

              {/* Encontré a esta persona */}
              {item._fuente === 'busqueda' && (
                <Link
                  to={`/reportar-encontrado?persona=${item.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between bg-green-600 text-white rounded-2xl px-4 py-3.5 no-underline"
                >
                  <span className="text-sm font-bold">✋ {es ? 'La/lo encontré' : 'I found them'}</span>
                  <ChevronRight size={16} />
                </Link>
              )}

              {/* Tengo una pista */}
              {item._fuente === 'busqueda' && (
                <Link
                  to={`/pista?persona=${item.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between bg-blue-600 text-white rounded-2xl px-4 py-3.5 no-underline"
                >
                  <span className="text-sm font-bold">💡 {es ? 'Tengo una pista' : 'I have a lead'}</span>
                  <ChevronRight size={16} />
                </Link>
              )}

              {/* Actualizar estado (todos los tipos) */}
              {!actualizandoPersona && !enviandoPersonaOk && (
                <button
                  onClick={() => setActualizandoPersona(true)}
                  className="flex items-center justify-between w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 cursor-pointer"
                >
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

                  {/* Estado (solo para personas buscadas) */}
                  {item._fuente === 'busqueda' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 'informacion_recibida', es: '🔵 Info recibida', en: '🔵 Info received' },
                        { val: 'visto_no_confirmado',  es: '🟠 Visto sin confirmar', en: '🟠 Seen unconfirmed' },
                        { val: 'encontrado_con_vida',  es: '✅ Encontrado', en: '✅ Found alive' },
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

                  <textarea
                    rows={2}
                    value={personaForm.descripcion}
                    onChange={e => setPersonaForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder={es ? 'Describe lo que sabes (sin datos sensibles)...' : 'Describe what you know (no sensitive data)...'}
                    className="w-full border border-amber-300 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white"
                  />
                  <input
                    value={personaForm.nombre}
                    onChange={e => setPersonaForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                    className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none bg-white"
                  />
                  <input
                    value={personaForm.contacto}
                    onChange={e => setPersonaForm(f => ({ ...f, contacto: e.target.value }))}
                    placeholder={es ? 'Tu contacto (opcional, privado)' : 'Your contact (optional, private)'}
                    className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={enviarActualizacionPersona}
                      disabled={enviandoPersona || (!personaForm.estado && !personaForm.descripcion)}
                      className="flex-1 bg-amber-600 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                    >
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

              {/* Notificarme */}
              <NotificarmeEmail entidadId={item.id} tipoReporte="persona" />

              {/* Compartir */}
              <button
                onClick={compartir}
                className="flex items-center justify-center gap-2 w-full bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 cursor-pointer"
              >
                <Share2 size={13} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">{es ? 'Compartir' : 'Share'}</span>
              </button>
            </>
          )}

          {/* ── ACCIONES EDIFICIO ── */}
          {tipo === 'edificio' && (
            <>
              {/* Ver detalle completo */}
              <Link
                to={`/edificio?id=${item.id}`}
                onClick={onClose}
                className="flex items-center justify-between bg-[#1A1F2E] text-white rounded-2xl px-4 py-3.5 no-underline"
              >
                <span className="text-sm font-bold">🏗️ {es ? 'Ver ficha completa' : 'View full record'}</span>
                <ChevronRight size={16} />
              </Link>

              {/* Alerta si hay atrapados */}
              {item.hayAtrapados && (
                <div className="bg-red-600 text-white rounded-2xl px-4 py-3 text-sm font-black text-center">
                  🆘 {es ? 'PERSONAS ATRAPADAS REPORTADAS' : 'TRAPPED PEOPLE REPORTED'}
                </div>
              )}

              {/* Actualizar inline */}
              {!actualizandoEdificio && !enviado && (
                <button
                  onClick={() => setActualizandoEdificio(true)}
                  className="flex items-center justify-between w-full bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 cursor-pointer"
                >
                  <span className="text-sm font-bold text-blue-800">
                    <Pencil size={13} className="inline mr-1.5" />
                    {es ? 'Tengo una actualización' : 'I have an update'}
                  </span>
                  <ChevronRight size={16} className="text-blue-400" />
                </button>
              )}

              {actualizandoEdificio && !enviado && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-800">✏️ {es ? 'Actualización del edificio' : 'Building update'}</p>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { val: 'tengo_actualizacion',   es: '🔄 Tengo info',       en: '🔄 Have info' },
                      { val: 'reportar_urgencia',      es: '🚨 Urgencia',         en: '🚨 Emergency' },
                      { val: 'personas_atrapadas',     es: '🆘 Hay atrapados',    en: '🆘 Trapped' },
                      { val: 'confirmo_mismo_estado',  es: '✅ Sigue igual',      en: '✅ Still same' },
                      { val: 'informacion_incorrecta', es: '⚠️ Info incorrecta',  en: '⚠️ Wrong info' },
                      { val: 'riesgo_marcado',         es: '💨 Nuevo riesgo',     en: '💨 New hazard' },
                    ].map(t => (
                      <button key={t.val}
                        onClick={() => setUpdateForm(f => ({ ...f, tipo: f.tipo === t.val ? '' : t.val }))}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.tipo === t.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                        {es ? t.es : t.en}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 'leve',     es: '🟡 Leve',     en: '🟡 Minor' },
                      { val: 'moderado', es: '🟠 Moderado',  en: '🟠 Moderate' },
                      { val: 'grave',    es: '🔴 Grave',     en: '🔴 Severe' },
                      { val: 'critico',  es: '🔴 Crítico',   en: '🔴 Critical' },
                      { val: 'colapsado',es: '💥 Colapsado', en: '💥 Collapsed' },
                      { val: '',         es: '— Sin cambio', en: '— No change' },
                    ].map(n => (
                      <button key={n.val}
                        onClick={() => setUpdateForm(f => ({ ...f, nivel: f.nivel === n.val ? '' : n.val }))}
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.nivel === n.val && n.val ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                        {es ? n.es : n.en}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={updateForm.desc}
                    onChange={e => setUpdateForm(f => ({ ...f, desc: e.target.value }))}
                    placeholder={es ? 'Describe lo que observaste...' : 'Describe what you observed...'}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={enviarActualizacionEdificio}
                      disabled={enviando || !updateForm.tipo}
                      className="flex-1 bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                    >
                      {enviando ? <Loader2 size={13} className="animate-spin" /> : '📡'}
                      {es ? 'Enviar' : 'Send'}
                    </button>
                    <button onClick={() => setActualizandoEdificio(false)} className="text-xs text-gray-400 underline cursor-pointer px-2">
                      {es ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {enviado && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5">
                  <Check size={14} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">{es ? 'Actualización enviada.' : 'Update sent.'}</span>
                </div>
              )}

              {/* Notificarme */}
              <NotificarmeEmail entidadId={item.id} tipoReporte="dano" />

              {/* Compartir */}
              <button
                onClick={compartir}
                className="flex items-center justify-center gap-2 w-full bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 cursor-pointer"
              >
                <Share2 size={13} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">{es ? 'Compartir' : 'Share'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}