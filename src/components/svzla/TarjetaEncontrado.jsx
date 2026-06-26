import { useRef } from 'react';
import { Share2, X, MapPin, Clock } from 'lucide-react';
import { useLang } from '@/lib/LangContext';

/**
 * Props:
 *   persona: PersonasEncontradas record
 *   onClose: () => void
 */

const CONDICION_LABEL = {
  a_salvo:             { es: '✅ A salvo',           en: '✅ Safe',              bg: '#2E7D32', text: '#fff' },
  herido_leve:         { es: '🟡 Herido leve',        en: '🟡 Mildly injured',    bg: '#B8860B', text: '#fff' },
  herido_grave:        { es: '🔴 Herido grave',        en: '🔴 Seriously injured', bg: '#B83A52', text: '#fff' },
  fallecido_reportado: { es: '⚫ Fallecido (reportado)', en: '⚫ Deceased (reported)', bg: '#374151', text: '#fff' },
  no_identificado:     { es: '❓ No identificado',    en: '❓ Unidentified',       bg: '#6B7280', text: '#fff' },
};

export default function TarjetaEncontrado({ persona, onClose }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const cardRef = useRef();

  const cond = CONDICION_LABEL[persona.condicion] || { es: persona.condicion, en: persona.condicion, bg: '#1A1F2E', text: '#fff' };
  const condLabel = es ? cond.es : cond.en;

  const lugar = [persona.nombre_lugar, persona.ciudad, persona.estado_region].filter(Boolean).join(', ');
  const fecha = persona.updated_date
    ? new Date(persona.updated_date).toLocaleDateString(es ? 'es-VE' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  // Texto para compartir por mensaje
  const shareText = es
    ? `📢 CRIS · statusvzla.com\n\n¡Persona encontrada!\n\n👤 ${persona.nombre_o_descripcion}${persona.edad_aprox ? ` · ${persona.edad_aprox} años` : ''}${persona.sexo ? ` · ${persona.sexo}` : ''}\n\nEstado: ${condLabel}\n📍 ${lugar || 'Ubicación no especificada'}\n\nSi la reconoces, revisa el directorio o reporta información en statusvzla.com`
    : `📢 CRIS · statusvzla.com\n\nPerson found!\n\n👤 ${persona.nombre_o_descripcion}${persona.edad_aprox ? ` · ${persona.edad_aprox} years` : ''}${persona.sexo ? ` · ${persona.sexo}` : ''}\n\nStatus: ${condLabel}\n📍 ${lugar || 'Location not specified'}\n\nIf you recognize them, check the directory or report information at statusvzla.com`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: es ? 'Persona encontrada · CRIS' : 'Person found · CRIS', text: shareText, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard?.writeText(shareText);
      alert(es ? 'Texto copiado al portapapeles.' : 'Text copied to clipboard.');
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard?.writeText(shareText);
    alert(es ? '✅ Texto copiado. Pégalo en WhatsApp, Telegram o Instagram.' : '✅ Text copied. Paste it in WhatsApp, Telegram or Instagram.');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {es ? 'Tarjeta · Persona encontrada' : 'Card · Person found'}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* La tarjeta visual */}
        <div ref={cardRef} className="mx-4 mb-3 rounded-2xl overflow-hidden border-2 border-[#EDEBE8]">
          {/* Cabecera de la tarjeta */}
          <div className="bg-[#1A1F2E] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">CRIS · statusvzla.com</p>
              <p className="text-sm font-black text-white mt-0.5">
                {es ? '🙋 Persona encontrada' : '🙋 Person found'}
              </p>
            </div>
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full"
              style={{ backgroundColor: cond.bg, color: cond.text }}
            >
              {condLabel}
            </span>
          </div>

          {/* Foto + datos */}
          <div className="bg-white px-4 py-4 space-y-3">
            <div className="flex gap-3 items-start">
              {persona.foto_url ? (
                <img
                  src={persona.foto_url}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-[#EDEBE8] flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#F4F4F8] border border-[#EDEBE8] flex items-center justify-center text-3xl flex-shrink-0">
                  👤
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-base text-[#1A1F2E] leading-tight">{persona.nombre_o_descripcion}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {persona.edad_aprox && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                      {persona.edad_aprox} {es ? 'años' : 'yrs'}
                    </span>
                  )}
                  {persona.sexo && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold capitalize">
                      {persona.sexo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {persona.descripcion_fisica && (
              <p className="text-xs text-gray-500 leading-relaxed border-t border-[#EDEBE8] pt-2">
                {persona.descripcion_fisica}
              </p>
            )}

            {lugar && (
              <div className="flex items-start gap-1.5 text-xs text-gray-600">
                <MapPin size={12} className="text-[#D48C2E] flex-shrink-0 mt-0.5" />
                <span>{lugar}</span>
              </div>
            )}

            {persona.nombre_lugar && (
              <div className="bg-[#F0F4FD] rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-blue-800">
                  {es ? '📍 Está en:' : '📍 Located at:'} {persona.nombre_lugar}
                </p>
              </div>
            )}

            {persona.notas_publicas && (
              <p className="text-xs text-gray-500 italic">"{persona.notas_publicas}"</p>
            )}

            {fecha && (
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock size={9} /> {es ? 'Reportado el' : 'Reported on'} {fecha}
              </p>
            )}
          </div>

          {/* Footer de la tarjeta */}
          <div className="bg-[#F4F4F8] px-4 py-2.5">
            <p className="text-[10px] text-gray-500 text-center">
              {es
                ? '⚠️ Nunca envíes dinero a cambio de información · statusvzla.com'
                : '⚠️ Never send money for information · statusvzla.com'}
            </p>
          </div>
        </div>

        {/* Botones de compartir */}
        <div className="px-4 pb-5 space-y-2">
          <p className="text-xs font-bold text-gray-500 text-center mb-3">
            {es ? '📤 Compartir en 1 clic' : '📤 Share in 1 click'}
          </p>

          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl transition-colors cursor-pointer text-sm"
          >
            📱 WhatsApp
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1F2E] hover:bg-[#2d3549] text-white font-bold py-3 rounded-2xl transition-colors cursor-pointer text-sm"
          >
            <Share2 size={15} />
            {es ? 'Compartir (otras apps)' : 'Share (other apps)'}
          </button>

          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-[#EDEBE8] text-[#1A1F2E] font-bold py-3 rounded-2xl transition-colors cursor-pointer text-sm hover:bg-gray-50"
          >
            📋 {es ? 'Copiar texto para pegar' : 'Copy text to paste'}
          </button>
        </div>
      </div>
    </div>
  );
}