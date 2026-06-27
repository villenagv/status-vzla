import { useState } from 'react';
import { Loader2, Share2 } from 'lucide-react';

const ESTADO_LABEL = {
  buscando: { es: 'BUSCANDO INFORMACIÓN', en: 'LOOKING FOR INFORMATION', color: '#C0392B' },
  informacion_recibida: { es: 'INFORMACIÓN RECIBIDA', en: 'INFORMATION RECEIVED', color: '#2471A3' },
  visto_no_confirmado: { es: 'VISTO SIN CONFIRMAR', en: 'SEEN UNCONFIRMED', color: '#D48C2E' },
  encontrado_con_vida: { es: 'ENCONTRADO CON VIDA', en: 'FOUND ALIVE', color: '#15803D' },
  en_hospital_refugio: { es: 'EN HOSPITAL O REFUGIO', en: 'IN HOSPITAL OR SHELTER', color: '#0F766E' },
  fallecido_reportado: { es: 'FALLECIMIENTO REPORTADO', en: 'DEATH REPORTED', color: '#4B5563' },
  caso_cerrado: { es: 'CASO CERRADO', en: 'CASE CLOSED', color: '#6B7280' },
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
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

export default function FichaPersonaDescargable({ persona, es }) {
  const [generando, setGenerando] = useState(false);

  const generar = async () => {
    setGenerando(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    const nombre = persona.nombre_completo || persona.nombre_o_descripcion || (es ? 'Persona reportada' : 'Reported person');
    const fichaUrl = `https://statusvzla.com/persona?id=${persona.id}`;
    const estado = ESTADO_LABEL[persona.estado_caso] || ESTADO_LABEL.buscando;

    ctx.fillStyle = '#F4F4F8';
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, 1080, 170);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 56px Arial';
    ctx.fillText('STATUS', 68, 100);
    ctx.fillStyle = '#D48C2E';
    ctx.fillText('VZLA', 292, 100);
    ctx.font = '700 24px Arial';
    ctx.fillText('.com', 430, 100);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '700 22px Arial';
    ctx.fillText(es ? 'Ficha para compartir · Formato story 9:16' : 'Share card · 9:16 story format', 68, 138);

    ctx.fillStyle = estado.color;
    ctx.beginPath();
    ctx.roundRect(68, 218, 944, 86, 24);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 34px Arial';
    ctx.fillText(estado[es ? 'es' : 'en'], 98, 272);

    try {
      const img = await loadImage(persona.foto_url || persona.foto_url_2);
      drawCover(ctx, img, 68, 342, 944, 560, 36);
    } catch {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(68, 342, 944, 560, 36);
      ctx.fill();
      ctx.fillStyle = '#D1D5DB';
      ctx.font = '900 170px Arial';
      ctx.fillText('👤', 430, 650);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 848, 944, 238, 36);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.font = '900 58px Arial';
    let y = wrapText(ctx, nombre, 108, 925, 864, 66, 2);
    if (persona.apodo) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '700 30px Arial';
      y = wrapText(ctx, `“${persona.apodo}”`, 108, y + 4, 864, 38, 1);
    }
    ctx.fillStyle = '#374151';
    ctx.font = '700 28px Arial';
    const chips = [persona.edad_aprox && `${persona.edad_aprox} ${es ? 'años' : 'yrs'}`, persona.sexo].filter(Boolean).join(' · ');
    if (chips) wrapText(ctx, chips, 108, y + 4, 864, 36, 1);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 1124, 944, 450, 34);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.font = '900 30px Arial';
    ctx.fillText(es ? 'INFORMACIÓN DISPONIBLE' : 'AVAILABLE INFORMATION', 108, 1180);
    ctx.font = '26px Arial';
    ctx.fillStyle = '#374151';
    let infoY = 1235;
    const datos = [
      persona.ultima_ubicacion_conocida && `${es ? 'Última ubicación' : 'Last location'}: ${persona.ultima_ubicacion_conocida}`,
      (persona.ciudad || persona.estado_region) && `${es ? 'Zona' : 'Area'}: ${[persona.ciudad, persona.estado_region].filter(Boolean).join(', ')}`,
      persona.fecha_ultima_vez && `${es ? 'Vista por última vez' : 'Last seen'}: ${persona.fecha_ultima_vez}${persona.hora_ultima_vez ? ` · ${persona.hora_ultima_vez}` : ''}`,
      persona.descripcion_fisica && `${es ? 'Descripción' : 'Description'}: ${persona.descripcion_fisica}`,
      persona.notas_publicas && `${es ? 'Notas' : 'Notes'}: ${persona.notas_publicas}`,
      persona.contacto_nombre && `${es ? 'Contacto' : 'Contact'}: ${persona.contacto_nombre}`,
      persona.contacto_telefono && `${es ? 'Teléfono' : 'Phone'}: ${persona.contacto_telefono}`,
      persona.contacto_email && `${es ? 'Email' : 'Email'}: ${persona.contacto_email}`,
      persona.contacto_whatsapp && `WhatsApp: ${persona.contacto_whatsapp}`,
    ].filter(Boolean);
    datos.slice(0, 9).forEach((dato) => {
      if (infoY < 1540) infoY = wrapText(ctx, dato, 108, infoY, 864, 34, 2) + 8;
    });

    ctx.fillStyle = '#FDF1F0';
    ctx.beginPath();
    ctx.roundRect(68, 1612, 944, 116, 28);
    ctx.fill();
    ctx.fillStyle = '#7A2A22';
    ctx.font = '800 25px Arial';
    wrapText(ctx, es ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni intermediarios anónimos.' : 'Never send money in exchange for information. This platform does not authorize payments or anonymous intermediaries.', 108, 1662, 864, 34, 2);

    ctx.fillStyle = '#111318';
    ctx.beginPath();
    ctx.roundRect(68, 1762, 944, 92, 28);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Arial';
    ctx.fillText(es ? 'VER ACTUALIZACIONES:' : 'VIEW UPDATES:', 108, 1818);
    ctx.fillStyle = '#D48C2E';
    ctx.font = '700 24px Arial';
    ctx.fillText(fichaUrl, 398, 1818);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve({ blob, nombre }) : reject(new Error('No se pudo generar la imagen')), 'image/png');
    });
  };

  const compartirImagen = async () => {
    try {
      const { blob, nombre } = await generar();
      const file = new File([blob], `statusvzla-${nombre.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-story.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `StatusVzla · ${nombre}`, text: es ? 'Comparte esta ficha para ayudar.' : 'Share this record to help.' });
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