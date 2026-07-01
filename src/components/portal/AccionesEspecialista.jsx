import { useState } from 'react';
import { Loader2, Mail, Phone, User, Send, FileText, ClipboardList, ShieldAlert, Clock, Users, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SelloRiesgo from '@/components/edificio/SelloRiesgo';
import MotivoPendiente, { MOTIVO_LABEL } from './MotivoPendiente';

/**
 * AccionesEspecialista
 * Panel de acciones del voluntario/especialista sobre una solicitud de inspección:
 *  - Ver datos de contacto privados del reportante
 *  - Enviar email al reportante desde la plataforma (con log)
 *  - Agregar nota técnica (queda en la línea de tiempo)
 *  - Marcar / quitar de la cola de inspección presencial
 *
 * Props:
 *  - reporte: ReportesDano
 *  - perfil: PerfilProfesional
 *  - es: idioma
 *  - onActualizado: (id, dataParcial) => void
 */
export default function AccionesEspecialista({ reporte, perfil, es, onActualizado }) {
  const [panel, setPanel] = useState(null); // 'email' | 'nota' | 'pendiente' | null
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState('');

  // Email
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  // Nota
  const [nota, setNota] = useState('');

  const tieneEmail = !!(reporte.reportante_email || '').trim();
  const motivoActual = reporte.inspeccion_estado_pendiente && reporte.inspeccion_estado_pendiente !== 'ninguno' ? reporte.inspeccion_estado_pendiente : '';

  const enviarEmail = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    try {
      const res = await base44.functions.invoke('enviarEmailReportante', {
        reporte_id: reporte.id, mensaje: mensaje.trim(), asunto: asunto.trim(), es,
      });
      if (res?.data?.ok) {
        setOk(es ? 'Correo enviado ✓' : 'Email sent ✓');
        setMensaje(''); setAsunto('');
        setTimeout(() => { setOk(''); setPanel(null); }, 2500);
      } else {
        setOk(es ? 'No se pudo enviar' : 'Could not send');
      }
    } catch {
      setOk(es ? 'No se pudo enviar' : 'Could not send');
    }
    setEnviando(false);
  };

  const guardarNota = async () => {
    if (!nota.trim()) return;
    setEnviando(true);
    try {
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: reporte.id,
        tipo_sitio: 'edificio',
        tipo_accion: 'tengo_actualizacion',
        descripcion: `[NOTA ${(perfil.tipo_perfil || 'especialista').toUpperCase()}] ${nota.trim()}`,
        reportante_nombre: perfil.user_nombre || perfil.user_email,
        fuente: 'especialista',
        es_verificado: true,
      });
      setOk(es ? 'Nota guardada ✓' : 'Note saved ✓');
      setNota('');
      setTimeout(() => { setOk(''); setPanel(null); }, 2500);
    } catch {
      setOk(es ? 'No se pudo guardar' : 'Could not save');
    }
    setEnviando(false);
  };

  return (
    <div className="space-y-3">
      {/* Sello de riesgo: SOLO visible cuando ya fue inspeccionado en persona */}
      {reporte.triage_estado === 'inspeccionado' && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <SelloRiesgo reporte={reporte} size={52} es={es} />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">{es ? 'Sello asignado' : 'Assigned seal'}</p>
            <p className="text-xs text-gray-600">{es ? 'Visible en la ficha pública del edificio' : 'Visible on the public building record'}</p>
          </div>
        </div>
      )}

      {/* Datos de contacto privados */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
        <p className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
          <ShieldAlert size={11} /> {es ? 'Contacto privado del reportante' : 'Reporter private contact'}
        </p>
        {(reporte.reportante_nombre || reporte.reportante_telefono || reporte.reportante_email) ? (
          <div className="space-y-1">
            {reporte.reportante_nombre && (
              <p className="text-xs text-gray-700 flex items-center gap-1.5"><User size={12} className="text-gray-400" /> {reporte.reportante_nombre}</p>
            )}
            {reporte.reportante_telefono && (
              <a href={`tel:${reporte.reportante_telefono}`} className="text-xs text-blue-700 font-semibold flex items-center gap-1.5 hover:underline">
                <Phone size={12} /> {reporte.reportante_telefono}
              </a>
            )}
            {reporte.reportante_email && (
              <p className="text-xs text-gray-700 flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {reporte.reportante_email}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">{es ? 'Sin datos de contacto registrados.' : 'No contact details on record.'}</p>
        )}
      </div>

      {/* Contactos de acceso — visible para el equipo autorizado */}
      {(reporte.contactos_acceso || []).length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1">
            <Users size={11} /> {es ? 'Contactos de acceso al edificio' : 'Building access contacts'} ({reporte.contactos_acceso.length})
          </p>
          {reporte.contactos_acceso.map((c, i) => (
            <div key={i} className="py-1 border-b border-purple-100 last:border-0">
              <p className="text-xs text-gray-800 font-semibold">{c.nombre}{c.rol ? <span className="font-normal text-gray-500"> · {c.rol}</span> : null}</p>
              {c.telefono && <a href={`tel:${c.telefono}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Phone size={10} /> {c.telefono}</a>}
              {c.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {c.email}</p>}
            </div>
          ))}
          {reporte.contactos_token && (
            <a href={`/contactos-acceso?edificio=${reporte.id}&token=${reporte.contactos_token}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-700 font-semibold hover:underline mt-1">
              <ExternalLink size={10} /> {es ? 'Agregar más contactos →' : 'Add more contacts →'}
            </a>
          )}
        </div>
      )}

      {/* Botones de acción */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setPanel(panel === 'email' ? null : 'email')} disabled={!tieneEmail}
          className="flex items-center justify-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed">
          <Send size={13} /> {es ? 'Enviar correo' : 'Send email'}
        </button>
        <button onClick={() => setPanel(panel === 'nota' ? null : 'nota')}
          className="flex items-center justify-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer hover:border-blue-400">
          <FileText size={13} /> {es ? 'Agregar nota' : 'Add note'}
        </button>
      </div>

      {/* Motivo de pendencia — cuando aún no se inspecciona */}
      {reporte.triage_estado !== 'inspeccionado' && (
        <>
          {motivoActual && panel !== 'pendiente' && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Clock size={13} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 flex-1">
                <span className="font-bold">{es ? 'Pendiente:' : 'Pending:'}</span> {MOTIVO_LABEL(motivoActual, es)}
                {reporte.inspeccion_motivo_pendiente ? ` — ${reporte.inspeccion_motivo_pendiente}` : ''}
              </p>
            </div>
          )}
          <button onClick={() => setPanel(panel === 'pendiente' ? null : 'pendiente')}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl cursor-pointer border bg-white border-amber-300 text-amber-700 hover:bg-amber-50">
            <ClipboardList size={13} /> {motivoActual ? (es ? 'Cambiar motivo de pendencia' : 'Change pending reason') : (es ? 'Marcar motivo de pendencia' : 'Set pending reason')}
          </button>
          {panel === 'pendiente' && (
            <MotivoPendiente reporte={reporte} perfil={perfil} es={es} onActualizado={onActualizado} />
          )}
        </>
      )}

      {/* Panel de email */}
      {panel === 'email' && (
        <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {es ? 'El correo se envía al reportante sin mostrar su dirección. Queda registrado en el historial.' : 'The email is sent to the reporter without revealing their address. It is logged in the history.'}
          </p>
          <input value={asunto} onChange={e => setAsunto(e.target.value)}
            placeholder={es ? 'Asunto (opcional)' : 'Subject (optional)'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400" />
          <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={4}
            placeholder={es ? 'Escribe tu mensaje al reportante...' : 'Write your message to the reporter...'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400" />
          <button onClick={enviarEmail} disabled={!mensaje.trim() || enviando}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
            {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {es ? 'Enviar correo' : 'Send email'}
          </button>
        </div>
      )}

      {/* Panel de nota */}
      {panel === 'nota' && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {es ? 'La nota se añade a la línea de tiempo del edificio. No borra notas anteriores.' : 'The note is added to the building timeline. It does not erase previous notes.'}
          </p>
          <textarea value={nota} onChange={e => setNota(e.target.value)} rows={3}
            placeholder={es ? 'Nota técnica...' : 'Technical note...'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400" />
          <button onClick={guardarNota} disabled={!nota.trim() || enviando}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
            {enviando ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            {es ? 'Guardar nota' : 'Save note'}
          </button>
        </div>
      )}

      {ok && <p className="text-xs text-center font-semibold text-green-600">{ok}</p>}
    </div>
  );
}