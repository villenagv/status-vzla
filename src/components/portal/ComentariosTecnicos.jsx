import { useState } from 'react';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Comentarios técnicos de voluntarios/profesionales sobre un reporte.
// Se agregan al array comentarios_tecnicos sin borrar los anteriores.
export default function ComentariosTecnicos({ reporte, perfil, es, onActualizado }) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const comentarios = reporte.comentarios_tecnicos || [];

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const nuevo = { texto: texto.trim(), autor: perfil.user_nombre || perfil.user_email, fecha: new Date().toISOString() };
      const lista = [...comentarios, nuevo];
      await base44.entities.ReportesDano.update(reporte.id, { comentarios_tecnicos: lista });
      onActualizado(reporte.id, { comentarios_tecnicos: lista });
      setTexto('');
    } catch {}
    setEnviando(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
        <MessageSquare size={13} /> {es ? 'Comentarios técnicos' : 'Technical comments'} {comentarios.length > 0 ? `(${comentarios.length})` : ''}
      </p>
      {comentarios.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {comentarios.slice().reverse().map((c, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-700 leading-relaxed">{c.texto}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.autor}{c.fecha ? ` · ${new Date(c.fecha).toLocaleDateString(es ? 'es-VE' : 'en-US')}` : ''}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2}
          placeholder={es ? 'Escribe un comentario técnico...' : 'Write a technical comment...'}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400" />
        <button onClick={enviar} disabled={!texto.trim() || enviando}
          className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-3 rounded-lg disabled:opacity-40 cursor-pointer flex-shrink-0 flex items-center justify-center">
          {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}