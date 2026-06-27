import { useState } from 'react';
import { Loader2, Share2 } from 'lucide-react';

const FOUND_STATES = ['encontrado_con_vida', 'en_hospital_refugio', 'caso_cerrado'];

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

function drawCover(ctx, img, x, y, w, h, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
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

export default function FichaPersonaDescargable({ persona, es }) {
  const [generando, setGenerando] = useState(false);

  const generar = async (usarFoto = true) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    const nombre = persona.nombre_completo || persona.nombre_o_descripcion || (es ? 'Persona reportada' : 'Reported person');
    const esEncontrado = FOUND_STATES.includes(persona.estado_caso) || persona.condicion;
    const estadoColor = esEncontrado ? '#15803D' : '#C0392B';
    const estadoTexto = esEncontrado ? (es ? 'ENCONTRADO' : 'FOUND') : (es ? 'DESAPARECIDO' : 'MISSING');
    const fichaUrl = `https://statusvzla.com/persona?id=${persona.id}`;
    const lugar = [persona.nombre_lugar, persona.ubicacion_actual, persona.ultima_ubicacion_conocida, persona.ciudad, persona.estado_region].filter(Boolean).join(' · ');
    const contacto = esEncontrado
      ? [persona.nombre_lugar, persona.telefono_contacto && `${es ? 'Tel' : 'Phone'}: ${persona.telefono_contacto}`, persona.email_contacto && `Email: ${persona.email_contacto}`].filter(Boolean)
      : [persona.contacto_nombre, persona.contacto_telefono && `${es ? 'Tel' : 'Phone'}: ${persona.contacto_telefono}`, persona.contacto_whatsapp && `WhatsApp: ${persona.contacto_whatsapp}`, persona.contacto_email && `Email: ${persona.contacto_email}`].filter(Boolean);

    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, 1080, 160);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 52px Arial';
    ctx.fillText('STATUS', 68, 96);
    ctx.fillStyle = '#D48C2E';
    ctx.fillText('VZLA', 284, 96);
    ctx.font = '700 22px Arial';
    ctx.fillText('.com', 418, 96);
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = '700 22px Arial';
    ctx.fillText(es ? 'Tarjeta para redes · comparte para ayudar' : 'Social card · share to help', 68, 132);

    ctx.fillStyle = estadoColor;
    ctx.beginPath();
    ctx.roundRect(68, 200, 944, 118, 30);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 56px Arial';
    ctx.fillText(estadoTexto, 98, 276);

    if (usarFoto && (persona.foto_url || persona.foto_url_2)) {
      try {
        const img = await loadImage(persona.foto_url || persona.foto_url_2);
        drawCover(ctx, img, 68, 350, 944, 670, 42);
      } catch {
        usarFoto = false;
      }
    }
    if (!usarFoto) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(68, 350, 944, 670, 42);
      ctx.fill();
      ctx.fillStyle = '#D1D5DB';
      ctx.font = '900 190px Arial';
      ctx.fillText('👤', 415, 745);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 960, 944, 280, 38);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.font = '900 58px Arial';
    let y = wrapText(ctx, nombre, 108, 1040, 864, 66, 2);
    if (persona.apodo) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '700 30px Arial';
      y = wrapText(ctx, `“${persona.apodo}”`, 108, y + 4, 864, 38, 1);
    }
    const datosBasicos = [persona.edad_aprox && `${persona.edad_aprox} ${es ? 'años' : 'yrs'}`, persona.sexo].filter(Boolean).join(' · ');
    if (datosBasicos) {
      ctx.fillStyle = '#374151';
      ctx.font = '800 29px Arial';
      wrapText(ctx, datosBasicos, 108, y + 8, 864, 38, 1);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 1280, 944, 300, 34);
    ctx.fill();
    ctx.fillStyle = estadoColor;
    ctx.font = '900 31px Arial';
    ctx.fillText(esEncontrado ? (es ? 'LUGAR Y CONTACTO' : 'PLACE & CONTACT') : (es ? 'QUIÉN LO BUSCA' : 'WHO IS SEARCHING'), 108, 1340);
    ctx.fillStyle = '#111827';
    ctx.font = '800 34px Arial';
    let contactoY = 1400;
    if (contacto.length) {
      contacto.slice(0, 4).forEach(linea => {
        contactoY = wrapText(ctx, linea, 108, contactoY, 864, 42, 2) + 6;
      });
    } else {
      contactoY = wrapText(ctx, es ? 'Ver detalles en StatusVzla.com' : 'See details at StatusVzla.com', 108, contactoY, 864, 42, 2);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 1615, 944, 138, 30);
    ctx.fill();
    ctx.fillStyle = '#374151';
    ctx.font = '26px Arial';
    wrapText(ctx, lugar ? `${es ? 'Ubicación' : 'Location'}: ${lugar}` : (es ? 'Ubicación pendiente de confirmar' : 'Location pending confirmation'), 108, 1670, 864, 34, 2);

    ctx.fillStyle = '#FDF1F0';
    ctx.beginPath();
    ctx.roundRect(68, 1780, 944, 92, 24);
    ctx.fill();
    ctx.fillStyle = '#7A2A22';
    ctx.font = '800 23px Arial';
    wrapText(ctx, es ? 'Nunca envíes dinero a cambio de información. Verifica antes de compartir.' : 'Never send money in exchange for information. Verify before sharing.', 108, 1822, 864, 30, 2);

    return canvasToBlob(canvas);
  };

  const compartirImagen = async () => {
    try {
      setGenerando(true);
      const blob = await generar(true).catch(() => generar(false));
      const nombre = persona.nombre_completo || persona.nombre_o_descripcion || 'persona';
      const file = new File([blob], `statusvzla-${nombre.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-story.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `StatusVzla · ${nombre}`, text: es ? 'Comparte esta tarjeta para ayudar.' : 'Share this card to help.' });
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } finally {
      setGenerando(false);
    }
  };

  return (
    <button onClick={compartirImagen} disabled={generando} className="col-span-2 flex items-center justify-center gap-2 bg-[#1A1F2E] text-white text-xs font-medium py-2.5 rounded-lg cursor-pointer disabled:opacity-50">
      {generando ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
      {generando ? (es ? 'Generando imagen...' : 'Generating image...') : (es ? 'Compartir imagen 9:16' : 'Share 9:16 image')}
    </button>
  );
}