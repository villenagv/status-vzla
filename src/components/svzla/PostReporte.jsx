import { Link } from 'react-router-dom';
import { Share2, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function PostReporte({ reporte, es }) {
  const [copiado, setCopiado] = useState(false);

  const shareUrl = `${window.location.origin}/persona?id=${reporte.id}`;
  const shareMsg = es
    ? `🚨 Estoy vivo/a — Código CRIS: ${reporte.codigo}`
    : `🚨 I am alive — CRIS Code: ${reporte.codigo}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareMsg}\n${shareUrl}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = `${shareMsg}\n${shareUrl}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-5 py-8 max-w-lg mx-auto w-full">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">✅</div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">
          {es ? 'Reporte enviado con éxito' : 'Report sent successfully'}
        </h2>
        <p className="text-sm text-gray-500 mb-2">
          {es ? 'Tu información se registró y está visible para equipos de respuesta.' : 'Your info is recorded and visible to response teams.'}
        </p>
      </div>

      {/* Código CRIS */}
      <div className="bg-gray-900 text-white rounded-xl p-5 text-center mb-6">
        <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">🆔 {es ? 'Tu código CRIS' : 'Your CRIS code'}</p>
        <p className="text-2xl font-black tracking-widest">{reporte.codigo}</p>
        <p className="text-xs text-gray-400 mt-2">
          {es ? 'Guárdalo para actualizar tu estado más tarde.' : 'Save it to update your status later.'}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {/* Compartir con familia */}
        <button onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
          <Share2 size={16} /> {copiado ? (es ? '✅ ¡Copiado!' : '✅ Copied!') : (es ? '📱 Compartir con un familiar' : '📱 Share with a family member')}
        </button>

        {/* Actualizar estado */}
        <Link to={`/actualizar-estado?id=${reporte.id}&token=${reporte.codigo}`}
          className="block text-center bg-gray-900 text-white rounded-xl py-3.5 text-sm font-semibold no-underline hover:opacity-90">
          🔄 {es ? 'Actualizar mi estado' : 'Update my status'}
        </Link>

        {/* Agregar familiar que busco */}
        <Link to={`/buscar-persona?persona_cris_id=${reporte.id}`}
          className="block text-center border border-gray-900 text-gray-900 rounded-xl py-3.5 text-sm font-semibold no-underline hover:bg-gray-50">
          🔍 {es ? 'Agregar familiar que busco' : 'Add family I seek'}
        </Link>

        {/* Reportar traslado */}
        <Link to={`/actualizar-estado?id=${reporte.id}&token=${reporte.codigo}`}
          className="block text-center border border-gray-200 text-gray-600 rounded-xl py-3.5 text-sm font-semibold no-underline hover:bg-gray-50">
          🚗 {es ? 'Reportar traslado' : 'Report transfer'}
        </Link>

        {/* Ver centros cercanos */}
        <Link to="/centros-apoyo"
          className="flex items-center justify-center gap-2 bg-green-700 text-white rounded-xl py-3.5 text-sm font-semibold no-underline hover:opacity-90">
          <MapPin size={16} /> {es ? 'Ver centros de apoyo cercanos' : 'View nearby support centers'}
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-center">
        ⚠️ {es ? 'Nunca envíes dinero a cambio de información. Si alguien te pide dinero, repórtalo.' : 'Never send money for information. If someone asks, report it.'}
      </div>

      <Link to="/" className="mt-6 text-center text-sm text-gray-500 hover:text-gray-900 no-underline">
        ← {es ? 'Volver al inicio' : 'Back to home'}
      </Link>
    </div>
  );
}