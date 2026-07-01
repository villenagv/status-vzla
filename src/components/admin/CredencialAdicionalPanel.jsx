import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Send, CheckCircle } from 'lucide-react';

const TIPOS = [
  { val: 'titulo', es: 'Título profesional', en: 'Professional degree' },
  { val: 'carnet', es: 'Carnet de colegiado', en: 'Professional license card' },
  { val: 'certificacion', es: 'Certificación profesional', en: 'Professional certification' },
  { val: 'identificacion', es: 'Identificación', en: 'ID document' },
  { val: 'otro', es: 'Otro documento', en: 'Other document' },
];

function PerfilRow({ perfil, es, onEnviar, enviando }) {
  const [tipo, setTipo] = useState('titulo');
  const [enviado, setEnviado] = useState(false);
  const docs = perfil.documentos_validacion || [];

  const enviar = async () => {
    await onEnviar(perfil.id, tipo);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{perfil.user_nombre || perfil.user_email}</p>
          <p className="text-xs text-gray-400">{perfil.user_email}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {docs.length > 0
              ? `📎 ${docs.length} ${es ? 'documento(s) subido(s)' : 'document(s) uploaded'}`
              : (es ? 'Sin documentos subidos' : 'No documents uploaded')}
          </p>
          {perfil.token_credencial_adicional && !perfil.token_credencial_usado && (
            <p className="text-[10px] font-bold text-amber-600 mt-0.5">
              ⏳ {es ? `Solicitud pendiente: ${TIPOS.find(t => t.val === perfil.tipo_credencial_solicitada)?.es || ''}` : `Pending request: ${TIPOS.find(t => t.val === perfil.tipo_credencial_solicitada)?.en || ''}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
            {TIPOS.map(t => <option key={t.val} value={t.val}>{es ? t.es : t.en}</option>)}
          </select>
          <button onClick={enviar} disabled={enviando}
            className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
            {enviando ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {es ? 'Solicitar' : 'Request'}
          </button>
        </div>
      </div>
      {enviado && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <CheckCircle size={12} className="text-green-600" />
          <p className="text-xs font-semibold text-green-700">{es ? 'Correo enviado.' : 'Email sent.'}</p>
        </div>
      )}
    </div>
  );
}

export default function CredencialAdicionalPanel({ es }) {
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviandoId, setEnviandoId] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    base44.entities.PerfilProfesional.filter({ estado_aprobacion: 'aprobado' }, '-created_date', 300)
      .then(setPerfiles)
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const enviarSolicitud = async (perfil_id, tipo_documento) => {
    setEnviandoId(perfil_id);
    try {
      await base44.functions.invoke('gestionarCredencialAdicional', { accion: 'enviar_solicitud', perfil_id, tipo_documento });
      setPerfiles(prev => prev.map(p => p.id === perfil_id ? { ...p, token_credencial_adicional: 'x', token_credencial_usado: false, tipo_credencial_solicitada: tipo_documento } : p));
    } catch {}
    setEnviandoId(null);
  };

  const perfilesFiltrados = perfiles.filter(p =>
    !filtro || (p.user_nombre || '').toLowerCase().includes(filtro.toLowerCase()) || (p.user_email || '').toLowerCase().includes(filtro.toLowerCase())
  );

  if (cargando) return (
    <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
  );

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-sm font-bold text-blue-900">📄 {es ? 'Solicitar credencial adicional' : 'Request additional credential'}</p>
        <p className="text-xs text-blue-700 mt-0.5">
          {es ? 'Elige el tipo de documento que falta y envía un correo con un enlace personal para que lo suba.'
              : 'Choose the missing document type and send an email with a personal link for them to upload it.'}
        </p>
      </div>

      <input value={filtro} onChange={e => setFiltro(e.target.value)}
        placeholder={es ? 'Buscar por nombre o email...' : 'Search by name or email...'}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-400" />

      {perfilesFiltrados.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📄</p>
          <p className="text-sm">{es ? 'Sin perfiles aprobados.' : 'No approved profiles.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {perfilesFiltrados.map(p => (
            <PerfilRow key={p.id} perfil={p} es={es} onEnviar={enviarSolicitud} enviando={enviandoId === p.id} />
          ))}
        </div>
      )}
    </div>
  );
}