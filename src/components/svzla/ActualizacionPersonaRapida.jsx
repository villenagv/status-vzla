import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ActualizacionPersonaRapida({ persona, es, onClose, onSaved }) {
  const [tipo, setTipo] = useState(persona._modo || 'actualizacion');
  const [ubicacion, setUbicacion] = useState(persona.ultima_ubicacion_conocida || '');
  const [contacto, setContacto] = useState('');
  const [reportante, setReportante] = useState('');
  const [condicion, setCondicion] = useState('a_salvo');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    if (!ubicacion.trim() || !contacto.trim()) return setError(es ? 'Indica ubicación actual y un medio de contacto.' : 'Add current location and one contact method.');
    setEnviando(true); setError('');
    const esBusqueda = persona._fuente === 'busqueda';
    const estadoNuevo = tipo === 'encontrado' ? (condicion === 'a_salvo' ? 'encontrado_con_vida' : condicion === 'no_identificado' ? 'informacion_recibida' : 'en_hospital_refugio') : 'informacion_recibida';
    const mensaje = notas.trim() || (tipo === 'encontrado' ? (es ? 'Reportaron que la persona fue encontrada.' : 'The person was reported found.') : (es ? 'Hay nueva información sobre esta persona.' : 'There is new information about this person.'));
    try {
      if (tipo === 'encontrado') {
        await base44.entities.PersonasEncontradas.create({
          nombre_o_descripcion: persona.nombre_completo,
          condicion,
          ubicacion_actual: ubicacion.trim(),
          tipo_lugar: condicion === 'a_salvo' ? 'refugio' : 'hospital',
          nombre_lugar: ubicacion.trim(),
          ciudad: persona.ciudad || 'No indicada',
          estado_region: persona.estado_region || 'No indicado',
          persona_buscada_id: esBusqueda ? persona.id : '',
          reportado_por_nombre: reportante.trim(),
          reportante_contacto_privado: contacto.trim(),
          reportado_por_telefono: contacto.trim(),
          notas_publicas: mensaje,
          nivel_verificacion: 'comunidad',
          fuente: 'web_publica',
        });
      }
      if (esBusqueda) {
        await base44.entities.PersonasBuscadas.update(persona.id, { estado_caso: estadoNuevo });
        await base44.entities.PistasPersonas.create({ persona_id: persona.id, tipo_pista: tipo === 'encontrado' ? 'vi_directamente' : 'informacion_ubicacion', ubicacion_pista: ubicacion.trim(), estado_persona_pista: condicion === 'a_salvo' ? 'a_salvo' : condicion === 'no_identificado' ? 'no_se' : 'lesiones_leves', descripcion: mensaje, contacto_informante: contacto.trim(), nombre_informante: reportante.trim() });
      }
      await base44.functions.invoke('notificarTodo', { tipo: 'persona', entidad_id: esBusqueda ? persona.id : persona.id, nombre: persona.nombre_completo, estado_label: tipo === 'encontrado' ? (es ? 'Encontrada con nueva ubicación' : 'Found with new location') : (es ? 'Nueva información recibida' : 'New information received'), estado_color: tipo === 'encontrado' ? '#2E7D32' : '#3B72C4', ubicacion: ubicacion.trim(), mensaje, contactos: [{ nombre: reportante.trim() || (es ? 'Reportante' : 'Reporter'), telefono: contacto.trim() }], lang: es ? 'es' : 'en' }).catch(() => {});
      onSaved?.({ ...persona, estado_caso: estadoNuevo, ultima_ubicacion_conocida: ubicacion.trim() });
      onClose();
    } catch (e) { setError(es ? 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.' : 'Could not submit. Check your connection and try again.'); }
    setEnviando(false);
  };

  return <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-3">
    <div className="bg-white rounded-2xl w-full max-w-md p-4 shadow-xl">
      <div className="flex justify-between gap-3 mb-3"><div><h2 className="font-black text-[#1A1F2E]">{es ? 'Actualizar persona' : 'Update person'}</h2><p className="text-xs text-gray-500">{persona.nombre_completo}</p></div><button onClick={onClose} className="text-gray-400 text-xl">×</button></div>
      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">⚠️ {es ? 'Nunca envíes dinero a cambio de información. Tus datos ayudan a verificar.' : 'Never send money in exchange for information. Your details help verify.'}</p>
      <div className="grid grid-cols-2 gap-2 mb-3"><button onClick={() => setTipo('actualizacion')} className={`rounded-xl py-2 text-xs font-bold border ${tipo === 'actualizacion' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>{es ? 'Tengo datos' : 'I have info'}</button><button onClick={() => setTipo('encontrado')} className={`rounded-xl py-2 text-xs font-bold border ${tipo === 'encontrado' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>{es ? 'La encontré' : 'I found them'}</button></div>
      {tipo === 'encontrado' && <select value={condicion} onChange={e => setCondicion(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2"><option value="a_salvo">{es ? 'A salvo' : 'Safe'}</option><option value="herido_leve">{es ? 'Herida leve' : 'Minor injury'}</option><option value="herido_grave">{es ? 'Herida grave' : 'Serious injury'}</option><option value="no_identificado">{es ? 'No estoy seguro' : 'Not sure'}</option></select>}
      <input value={ubicacion} onChange={e => setUbicacion(e.target.value)} placeholder={es ? 'Ubicación actual: refugio, hospital, zona...' : 'Current location: shelter, hospital, area...'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2" />
      <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder={es ? 'Teléfono, email o red social para verificar' : 'Phone, email or social handle to verify'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2" />
      <input value={reportante} onChange={e => setReportante(e.target.value)} placeholder={es ? 'Tu nombre o institución (opcional)' : 'Your name or institution (optional)'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2" />
      <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} placeholder={es ? 'Dato verificable o instrucción breve...' : 'Verifiable detail or short instruction...'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2" />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button onClick={enviar} disabled={enviando} className="w-full bg-[#1A1F2E] text-white rounded-xl py-3 text-sm font-black disabled:opacity-50">{enviando ? (es ? 'Enviando...' : 'Sending...') : (es ? 'Enviar y notificar seguidores' : 'Send and notify followers')}</button>
    </div>
  </div>;
}