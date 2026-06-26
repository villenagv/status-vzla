import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || '').split(' ');
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

export default function FichaPersonaDescargable({ persona, es }) {
  const [generando, setGenerando] = useState(false);

  const descargar = async () => {
    setGenerando(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    const nombre = persona.nombre_completo || persona.nombre_o_descripcion || (es ? 'Persona reportada' : 'Reported person');
    const fichaUrl = `https://statusvzla.com/persona?id=${persona.id}`;

    ctx.fillStyle = '#F4F4F8';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, 1080, 154);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 54px Arial';
    ctx.fillText('STATUS', 68, 92);
    ctx.fillStyle = '#D48C2E';
    ctx.fillText('VZLA', 280, 92);
    ctx.font = '700 24px Arial';
    ctx.fillText('.com', 410, 92);
    ctx.fillStyle = '#C0392B';
    ctx.fillRect(68, 196, 944, 76);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 34px Arial';
    ctx.fillText(es ? '¿HAS VISTO A ESTA PERSONA?' : 'HAVE YOU SEEN THIS PERSON?', 92, 245);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(68, 310, 944, 808, 34);
    ctx.fill();

    try {
      const img = await loadImage(persona.foto_url || persona.foto_url_2);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(118, 360, 360, 360, 28);
      ctx.clip();
      const ratio = Math.max(360 / img.width, 360 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, 118 + (360 - w) / 2, 360 + (360 - h) / 2, w, h);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.roundRect(118, 360, 360, 360, 28);
      ctx.fill();
      ctx.fillStyle = '#6B7280';
      ctx.font = '900 112px Arial';
      ctx.fillText('👤', 240, 585);
    }

    ctx.fillStyle = '#111827';
    ctx.font = '900 54px Arial';
    wrapText(ctx, nombre, 520, 392, 430, 62, 3);
    ctx.font = '700 28px Arial';
    ctx.fillStyle = '#C0392B';
    ctx.fillText(es ? 'BUSCANDO INFORMACIÓN' : 'LOOKING FOR INFORMATION', 520, 580);
    ctx.fillStyle = '#374151';
    ctx.font = '28px Arial';
    let y = 650;
    if (persona.edad_aprox) y = wrapText(ctx, `${es ? 'Edad aprox.:' : 'Approx. age:'} ${persona.edad_aprox}`, 520, y, 430, 38, 1);
    if (persona.ultima_ubicacion_conocida) y = wrapText(ctx, `${es ? 'Última zona:' : 'Last area:'} ${persona.ultima_ubicacion_conocida}`, 520, y + 10, 430, 38, 3);
    if (persona.ciudad || persona.estado_region) y = wrapText(ctx, `📍 ${[persona.ciudad, persona.estado_region].filter(Boolean).join(', ')}`, 520, y + 10, 430, 38, 2);

    ctx.fillStyle = '#FDF1F0';
    ctx.beginPath();
    ctx.roundRect(118, 770, 844, 150, 22);
    ctx.fill();
    ctx.fillStyle = '#7A2A22';
    ctx.font = '700 27px Arial';
    wrapText(ctx, es ? 'Nunca envíes dinero a cambio de información. Reporta datos reales en la plataforma.' : 'Never send money for information. Report real information on the platform.', 150, 820, 780, 38, 3);

    ctx.fillStyle = '#111318';
    ctx.beginPath();
    ctx.roundRect(118, 970, 844, 90, 20);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 30px Arial';
    ctx.fillText(es ? 'REPORTAR INFORMACIÓN:' : 'REPORT INFORMATION:', 150, 1027);
    ctx.fillStyle = '#D48C2E';
    ctx.font = '700 25px Arial';
    ctx.fillText(fichaUrl, 150, 1098);

    ctx.fillStyle = '#6B7280';
    ctx.font = '24px Arial';
    wrapText(ctx, es ? 'Comparte esta imagen para ayudar a encontrar información verificada.' : 'Share this image to help gather verified information.', 92, 1212, 896, 34, 2);

    const link = document.createElement('a');
    link.download = `statusvzla-${nombre.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setGenerando(false);
  };

  return (
    <button onClick={descargar} disabled={generando} className="col-span-2 flex items-center justify-center gap-2 bg-[#1A1F2E] text-white text-xs font-medium py-2.5 rounded-lg cursor-pointer disabled:opacity-50">
      {generando ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {generando ? (es ? 'Generando...' : 'Generating...') : (es ? 'Descargar ficha para redes' : 'Download social card')}
    </button>
  );
}