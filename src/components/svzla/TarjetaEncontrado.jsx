import { useEffect, useState } from 'react';
import { Copy, Download, Loader2, Share2, X } from 'lucide-react';
import { useLang } from '@/lib/LangContext';

const CONDICION_LABEL = {
  a_salvo: { es: 'A SALVO', en: 'SAFE', bg: '#15803D' },
  herido_leve: { es: 'HERIDO LEVE', en: 'MILDLY INJURED', bg: '#B8860B' },
  herido_grave: { es: 'HERIDO GRAVE', en: 'SERIOUSLY INJURED', bg: '#B83A52' },
  fallecido_reportado: { es: 'FALLECIMIENTO REPORTADO', en: 'DEATH REPORTED', bg: '#374151' },
  no_identificado: { es: 'NO IDENTIFICADO', en: 'UNIDENTIFIED', bg: '#6B7280' },
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(' ').filter(Boolean);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + ' ';
      y += lineHeight;
      lines++;
      if (lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('sin foto'));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawCover(ctx, img, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  const ratio = Math.max(w / img.width, h / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen')), 'image/png');
    } catch (error) {
      reject(error);
    }
  });
}

export default function TarjetaEncontrado({ persona, onClose }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const [previewUrl, setPreviewUrl] = useState('');
  const [blob, setBlob] = useState(null);
  const [generando, setGenerando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const cond = CONDICION_LABEL[persona.condicion] || { es: persona.condicion || 'REGISTRO', en: persona.condicion || 'RECORD', bg: '#1A1F2E' };
  const nombre = persona.nombre_o_descripcion || (es ? 'Persona encontrada' : 'Found person');
  const lugar = [persona.nombre_lugar, persona.ubicacion_actual, persona.ciudad, persona.estado_region].filter(Boolean).join(' · ');
  const fecha = persona.updated_date ? new Date(persona.updated_date).toLocaleDateString(es ? 'es-VE' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const pageUrl = 'https://statusvzla.com/directorio-encontrados';

  const shareText = es
    ? `📢 Persona encontrada en CRIS\n\n${nombre}${persona.edad_aprox ? ` · ${persona.edad_aprox} años` : ''}${persona.sexo ? ` · ${persona.sexo}` : ''}\nEstado: ${cond.es}\n${lugar ? `📍 ${lugar}\n` : ''}\nVer más: ${pageUrl}\n\nNunca envíes dinero a cambio de información.`
    : `📢 Found person on CRIS\n\n${nombre}${persona.edad_aprox ? ` · ${persona.edad_aprox} yrs` : ''}${persona.sexo ? ` · ${persona.sexo}` : ''}\nStatus: ${cond.en}\n${lugar ? `📍 ${lugar}\n` : ''}\nSee more: ${pageUrl}\n\nNever send money in exchange for information.`;

  const generarImagen = async (usarFoto = true) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F4F4F8';
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, 1080, 180);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 56px Arial';
    ctx.fillText('STATUS', 68, 105);
    ctx.fillStyle = '#D48C2E';
    ctx.fillText('VZLA', 292, 105);
    ctx.font = '700 24px Arial';
    ctx.fillText('.com', 430, 105);
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = '700 23px Arial';
    ctx.fillText(es ? 'Tarjeta para redes · comparte para ayudar' : 'Social card · share to help', 68, 142);

    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.roundRect(68, 230, 944, 118, 30);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 56px Arial';
    ctx.fillText(es ? 'ENCONTRADO' : 'FOUND', 98, 305);

    if (usarFoto && (persona.foto_url || persona.foto_url_2)) {
      try {
        const img = await loadImage(persona.foto_url || persona.foto_url_2);
        drawCover(ctx, img, 68, 360, 944, 610, 38);
      } catch {
        usarFoto = false;
      }
    }
    if (!usarFoto) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(68, 360, 944, 610, 38);
      ctx.fill();
      ctx.fillStyle = '#D1D5DB';
      ctx.font = '900 180px Arial';
      ctx.fillText('👤', 420, 710);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 910, 944, 260, 36);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.font = '900 58px Arial';
    let y = wrapText(ctx, nombre, 108, 990, 864, 66, 2);
    ctx.fillStyle = '#374151';
    ctx.font = '700 28px Arial';
    const chips = [persona.edad_aprox && `${persona.edad_aprox} ${es ? 'años' : 'yrs'}`, persona.sexo].filter(Boolean).join(' · ');
    if (chips) y = wrapText(ctx, chips, 108, y + 6, 864, 36, 1);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 1210, 944, 360, 34);
    ctx.fill();
    ctx.fillStyle = '#15803D';
    ctx.font = '900 31px Arial';
    ctx.fillText(es ? 'LUGAR Y CONTACTO' : 'PLACE & CONTACT', 108, 1268);
    ctx.font = '27px Arial';
    ctx.fillStyle = '#374151';
    let infoY = 1325;
    [
      lugar && `${es ? 'Lugar' : 'Place'}: ${lugar}`,
      persona.telefono_contacto && `${es ? 'Teléfono' : 'Phone'}: ${persona.telefono_contacto}`,
      persona.email_contacto && `Email: ${persona.email_contacto}`,
      `${es ? 'Condición' : 'Condition'}: ${es ? cond.es : cond.en}`,
      persona.descripcion_fisica && `${es ? 'Descripción' : 'Description'}: ${persona.descripcion_fisica}`,
      persona.notas_publicas && `${es ? 'Notas' : 'Notes'}: ${persona.notas_publicas}`,
      fecha && `${es ? 'Actualizado' : 'Updated'}: ${fecha}`,
    ].filter(Boolean).forEach((dato) => {
      if (infoY < 1545) infoY = wrapText(ctx, dato, 108, infoY, 864, 34, 2) + 8;
    });

    ctx.fillStyle = '#FDF1F0';
    ctx.beginPath();
    ctx.roundRect(68, 1612, 944, 118, 28);
    ctx.fill();
    ctx.fillStyle = '#7A2A22';
    ctx.font = '800 25px Arial';
    wrapText(ctx, es ? 'Nunca envíes dinero a cambio de información. Verifica antes de compartir.' : 'Never send money in exchange for information. Verify before sharing.', 108, 1662, 864, 34, 2);

    ctx.fillStyle = '#111318';
    ctx.beginPath();
    ctx.roundRect(68, 1762, 944, 92, 28);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Arial';
    ctx.fillText(es ? 'VER DIRECTORIO:' : 'VIEW DIRECTORY:', 108, 1818);
    ctx.fillStyle = '#D48C2E';
    ctx.font = '700 24px Arial';
    ctx.fillText(pageUrl, 365, 1818);

    return canvasToBlob(canvas);
  };

  useEffect(() => {
    let active = true;
    setGenerando(true);
    generarImagen(true)
      .catch(() => generarImagen(false))
      .then(imageBlob => {
        if (!active) return;
        const url = URL.createObjectURL(imageBlob);
        setBlob(imageBlob);
        setPreviewUrl(url);
      })
      .finally(() => active && setGenerando(false));
    return () => { active = false; };
  }, [persona.id, lang]);

  const compartirImagen = async () => {
    if (!blob) return;
    const file = new File([blob], `cris-persona-encontrada-${persona.id}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: es ? 'Persona encontrada · CRIS' : 'Found person · CRIS', text: es ? 'Comparte esta tarjeta para ayudar.' : 'Share this card to help.' });
    } else {
      descargarImagen();
    }
  };

  const descargarImagen = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cris-persona-encontrada-${persona.id}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copiarTexto = () => {
    navigator.clipboard?.writeText(shareText);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full max-h-[94vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-black text-[#1A1F2E]">{es ? 'Ver y compartir tarjeta' : 'View and share card'}</p>
            <p className="text-[11px] text-gray-400">{es ? 'Imagen vertical 9:16 lista para stories' : 'Vertical 9:16 image ready for stories'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 flex justify-center">
          {generando ? (
            <div className="w-full aspect-[9/16] rounded-2xl bg-white flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 size={22} className="animate-spin" />
              <p className="text-xs">{es ? 'Preparando tarjeta...' : 'Preparing card...'}</p>
            </div>
          ) : (
            <img src={previewUrl} alt="" className="w-full max-h-[62vh] object-contain rounded-2xl shadow border border-gray-200 bg-white" />
          )}
        </div>

        <div className="px-4 py-4 space-y-2 border-t border-gray-100">
          <button onClick={compartirImagen} disabled={!blob || generando} className="w-full flex items-center justify-center gap-2 bg-[#1A1F2E] text-white font-black py-3.5 rounded-2xl disabled:opacity-50 text-sm">
            <Share2 size={15} /> {es ? 'Compartir imagen' : 'Share image'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={descargarImagen} disabled={!blob || generando} className="flex items-center justify-center gap-2 bg-white border-2 border-[#EDEBE8] text-[#1A1F2E] font-bold py-3 rounded-2xl disabled:opacity-50 text-sm">
              <Download size={14} /> {es ? 'Descargar' : 'Download'}
            </button>
            <button onClick={copiarTexto} className="flex items-center justify-center gap-2 bg-white border-2 border-[#EDEBE8] text-[#1A1F2E] font-bold py-3 rounded-2xl text-sm">
              <Copy size={14} /> {copiado ? (es ? 'Copiado' : 'Copied') : (es ? 'Texto' : 'Text')}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            {es ? 'Si tu teléfono no permite compartir imagen directo, descárgala y súbela a la historia.' : 'If your phone cannot share the image directly, download it and upload it to your story.'}
          </p>
        </div>
      </div>
    </div>
  );
}