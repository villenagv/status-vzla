import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.2.1';

/**
 * generarInformeInspeccion
 *
 * Genera el informe técnico de inspección de un edificio en PDF, lo sube al
 * almacenamiento, lo adjunta a la ficha (inspeccion_pdf_url) y lo envía por
 * email al solicitante de la inspección.
 *
 * PRIVACIDAD: el PDF NO incluye datos personales ni de contacto de quien pidió
 * la inspección (nombre, teléfono, email del reportante). Solo datos técnicos
 * públicos del edificio + el resultado de la inspección.
 *
 * Payload: { reporte_id }
 */

const APP_URL = 'https://status-vzla.base44.app';

const SELLOS = {
  solo_estetico:   { url: 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/6aaef027d_leve.png',     label: 'Daños leves' },
  riesgo_moderado: { url: 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/f506fefef_moderado.png', label: 'Daños moderados' },
  riesgo_colapso:  { url: 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/c6581332b_colapso.png',  label: 'Severo riesgo de colapso' },
};
const SEVERIDAD_A_SELLO = { leve: 'solo_estetico', moderado: 'riesgo_moderado', grave: 'riesgo_colapso', critico: 'riesgo_colapso' };

const SEVERIDAD_LBL = { leve: 'Leve', moderado: 'Moderado', grave: 'Grave', critico: 'Crítico' };
const TIPO_DANO_LBL = { sin_danos: 'Sin daños', estetico: 'Solo estético', estructural: 'Estructural', ambos: 'Estético y estructural' };

const AREA_LBL: Record<string, string> = {
  cimentacion: 'Cimentación', columnas: 'Columnas', vigas: 'Vigas', muros_carga: 'Muros de carga',
  losas_techos: 'Losas / Techos', fachada: 'Fachada / Revestimiento', ventanas: 'Ventanas',
  balcones: 'Balcones', cornisas: 'Cornisas / Aleros', electricas: 'Instalaciones eléctricas',
  hidraulicas: 'Hidráulicas / Sanitarias', gas: 'Gas', iluminacion: 'Iluminación', ascensores: 'Ascensores',
  pisos: 'Pisos', techos_falsos: 'Techos falsos', escaleras: 'Escaleras / Pasamanos',
  areas_comunes: 'Áreas comunes', general: 'Vista general', otro: 'Otro',
};

async function fetchImageDataURL(url: string): Promise<{ dataURL: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const b64 = btoa(binary);
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const mime = ct.includes('png') ? 'image/png' : 'image/jpeg';
    return { dataURL: `data:${mime};base64,${b64}`, w: 0, h: 0 };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const reporteId = body?.reporte_id || body?.event?.entity_id;
    if (!reporteId) return Response.json({ error: 'Falta reporte_id' }, { status: 400 });

    const rep = await base44.asServiceRole.entities.ReportesDano.get(reporteId).catch(() => null);
    if (!rep) return Response.json({ error: 'Reporte no encontrado' }, { status: 404 });

    const historial = await base44.asServiceRole.entities.ActualizacionesSitios.filter({ sitio_id: reporteId }, '-created_date', 30).catch(() => []);
    const comentarios = Array.isArray(rep.comentarios_tecnicos) ? rep.comentarios_tecnicos : [];

    const detalle = Array.isArray(rep.inspeccion_detalle_fotos) ? rep.inspeccion_detalle_fotos : [];
    const sev = rep.inspeccion_severidad && rep.inspeccion_severidad !== 'sin_definir' ? rep.inspeccion_severidad : null;
    const selloKey = sev ? SEVERIDAD_A_SELLO[sev] : null;

    // ── Construcción del PDF ──
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    const ensureSpace = (need: number) => {
      if (y + need > pageH - margin) { doc.addPage(); y = margin; }
    };

    // Cabecera
    doc.setFillColor(13, 34, 89);
    doc.rect(0, 0, pageW, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Status Vzla', margin, 34);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe Técnico de Inspección', margin, 52);
    y = 90;

    // Sello de riesgo (si aplica)
    if (selloKey && SELLOS[selloKey]) {
      const img = await fetchImageDataURL(SELLOS[selloKey].url);
      if (img) {
        try {
          const fmt = img.dataURL.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(img.dataURL, fmt, pageW - margin - 80, y, 80, 80);
        } catch { /* sello opcional */ }
      }
    }

    // Datos del edificio (técnicos, sin datos personales)
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    const nombre = rep.nombre_lugar || (rep.tipo_estructura || 'Estructura').replace(/_/g, ' ');
    doc.text(doc.splitTextToSize(nombre, pageW - margin * 2 - 90), margin, y + 14);
    y += 36;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    const ubic = [rep.direccion, rep.ciudad, rep.estado_region].filter(Boolean).join(', ');
    if (ubic) { doc.text(doc.splitTextToSize(ubic, pageW - margin * 2 - 90), margin, y); y += 16; }
    if (selloKey && SELLOS[selloKey]) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 34, 89);
      doc.text(`Clasificación: ${SELLOS[selloKey].label}`, margin, y);
      y += 16;
    }
    y = Math.max(y, 180);

    // ── Ficha resumen del caso ──
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text('Ficha resumen del caso', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const TIPO_ESTRUCTURA_LBL: Record<string, string> = {
      edificio_residencial: 'Edificio residencial', hospital: 'Hospital', escuela: 'Escuela', iglesia: 'Iglesia',
      comercio: 'Comercio', calle_via: 'Calle / Vía', puente: 'Puente', servicio_publico: 'Servicio público',
      refugio: 'Refugio', otro: 'Otro',
    };
    const ESTADO_LBL: Record<string, string> = {
      recibido: 'Recibido', verificado: 'Verificado', duplicado: 'Duplicado', falso: 'Falso', resuelto: 'Resuelto',
    };
    const fichaFilas: [string, string][] = [
      ['Código de reporte', rep.codigo_reporte || '—'],
      ['Estado actual', ESTADO_LBL[rep.estado_verificacion] || rep.estado_verificacion || '—'],
      ['Ubicación aproximada', [rep.ciudad, rep.estado_region].filter(Boolean).join(', ') || '—'],
      ['Tipo de edificación', TIPO_ESTRUCTURA_LBL[rep.tipo_estructura] || (rep.tipo_estructura || '—').replace(/_/g, ' ')],
      ['Pisos totales', rep.pisos_totales || '—'],
      ['Piso desde donde se reportó', rep.piso_reporta || '—'],
      ['Piso(s) afectado(s)', rep.pisos_afectados || '—'],
      ['Descripción del daño', rep.descripcion || '—'],
      ['Fotos cargadas', String((rep.foto_urls || []).length + detalle.length)],
      ['Prioridad', (rep.prioridad || 'normal').toUpperCase()],
      ['Tipo de evaluación', (rep.tipo_evaluacion || 'pendiente_asignacion').replace(/_/g, ' ')],
      ['Profesional / voluntario asignado', rep.voluntario_asignado_nombre || rep.inspeccion_por || '—'],
      ['Derivación recomendada', rep.derivacion_recomendada ? rep.derivacion_recomendada.replace(/_/g, ' ') : '—'],
      ['Fecha de creación', rep.created_date ? new Date(rep.created_date).toLocaleString('es-VE') : '—'],
      ['Última actualización', rep.updated_date ? new Date(rep.updated_date).toLocaleString('es-VE') : '—'],
      ['Fecha de cierre', rep.triage_estado === 'inspeccionado' && rep.inspeccion_fecha ? new Date(rep.inspeccion_fecha).toLocaleString('es-VE') : '—'],
    ];
    fichaFilas.forEach(([k, v]) => {
      ensureSpace(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`${k}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(String(v), pageW - margin * 2 - 160), margin + 160, y);
      y += 15;
    });

    // Comentarios técnicos
    if (comentarios.length > 0) {
      y += 6;
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text('Comentarios técnicos', margin, y);
      y += 16;
      doc.setFontSize(9);
      comentarios.forEach((c: any) => {
        ensureSpace(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(`${c.autor || '—'} — ${c.fecha ? new Date(c.fecha).toLocaleString('es-VE') : ''}`, margin, y);
        y += 12;
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(c.texto || '', pageW - margin * 2);
        lines.forEach((ln: string) => { ensureSpace(12); doc.text(ln, margin, y); y += 12; });
        y += 4;
      });
    }

    // Historial de cambios (línea de tiempo)
    if (historial.length > 0) {
      y += 6;
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text('Historial de cambios', margin, y);
      y += 16;
      doc.setFontSize(9);
      historial.forEach((h: any) => {
        ensureSpace(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(`${h.created_date ? new Date(h.created_date).toLocaleString('es-VE') : ''} — ${(h.tipo_accion || '').replace(/_/g, ' ')}`, margin, y);
        y += 12;
        if (h.descripcion) {
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(h.descripcion, pageW - margin * 2);
          lines.forEach((ln: string) => { ensureSpace(12); doc.text(ln, margin, y); y += 12; });
        }
        y += 4;
      });
    }

    // Recomendaciones preliminares y advertencia legal
    y += 6;
    ensureSpace(50);
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(59, 130, 246);
    const recTxt = rep.derivacion_recomendada
      ? `Se recomienda derivar este caso a: ${rep.derivacion_recomendada.replace(/_/g, ' ')}.`
      : 'Sin recomendación de derivación registrada.';
    const recLines = doc.splitTextToSize(recTxt, pageW - margin * 2 - 20);
    const recH = 20 + recLines.length * 11;
    doc.roundedRect(margin, y, pageW - margin * 2, recH, 6, 6, 'FD');
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Recomendaciones preliminares', margin + 10, y + 13);
    doc.setFont('helvetica', 'normal');
    let ry = y + 25;
    recLines.forEach((ln: string) => { doc.text(ln, margin + 10, ry); ry += 11; });
    y += recH + 10;

    ensureSpace(50);
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    const disclaimerLines = doc.splitTextToSize(
      'Esta ficha es un resumen informativo generado por voluntarios/profesionales de Status Vzla y NO sustituye una evaluación de ingeniería estructural profesional. Los resultados están sujetos a verificación en sitio por autoridades competentes.',
      pageW - margin * 2 - 20
    );
    const discH = 16 + disclaimerLines.length * 11;
    doc.roundedRect(margin, y, pageW - margin * 2, discH, 6, 6, 'FD');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8.5);
    let dy = y + 14;
    disclaimerLines.forEach((ln: string) => { doc.text(ln, margin + 10, dy); dy += 11; });
    y += discH + 10;

    // Resumen del resultado
    ensureSpace(20);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text('Resultado de la inspección', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const filas = [
      ['Severidad confirmada', sev ? (SEVERIDAD_LBL[sev] || sev) : '—'],
      ['Tipo de daño', rep.inspeccion_tipo_dano && rep.inspeccion_tipo_dano !== 'sin_definir' ? (TIPO_DANO_LBL[rep.inspeccion_tipo_dano] || rep.inspeccion_tipo_dano) : '—'],
      ['Inspeccionado por', rep.inspeccion_por || '—'],
      ['Fecha', rep.inspeccion_fecha ? new Date(rep.inspeccion_fecha).toLocaleString('es-VE') : '—'],
    ];
    filas.forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${k}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(String(v), pageW - margin * 2 - 130), margin + 130, y);
      y += 15;
    });

    // Informe técnico general
    if (rep.inspeccion_notas) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Informe técnico general:', margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(rep.inspeccion_notas, pageW - margin * 2);
      lines.forEach((ln: string) => { ensureSpace(14); doc.text(ln, margin, y); y += 13; });
    }

    // Aviso de seguridad
    y += 10;
    ensureSpace(60);
    doc.setFillColor(254, 249, 240);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, y, pageW - margin * 2, 48, 6, 6, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(9);
    const avisoLines = doc.splitTextToSize(
      'AVISO DE SEGURIDAD: No entres a estructuras dañadas. Si hay grietas graves, olor a gas, cables caídos, incendio o personas atrapadas, espera a Protección Civil (171), Bomberos o rescatistas autorizados.',
      pageW - margin * 2 - 20
    );
    let ay = y + 16;
    avisoLines.forEach((ln: string) => { doc.text(ln, margin + 10, ay); ay += 11; });
    y += 60;

    // Galería foto por foto, con área y nota
    if (detalle.length > 0) {
      doc.addPage(); y = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(`Evidencia fotográfica (${detalle.length})`, margin, y);
      y += 24;

      const imgW = pageW - margin * 2;
      for (let i = 0; i < detalle.length; i++) {
        const d = detalle[i];
        const img = await fetchImageDataURL(d.url);
        const areaTxt = AREA_LBL[d.area] || d.area || 'Sin área';

        // Encabezado de la foto
        ensureSpace(40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(13, 34, 89);
        doc.text(`Foto ${i + 1} — ${areaTxt}`, margin, y);
        y += 14;

        // Imagen
        if (img) {
          const ih = 200;
          ensureSpace(ih + 8);
          try {
            const fmt = img.dataURL.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(img.dataURL, fmt, margin, y, imgW, ih);
            y += ih + 8;
          } catch { /* si falla, seguimos solo con texto */ }
        }

        // Nota
        if (d.nota) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);
          const lines = doc.splitTextToSize(d.nota, imgW);
          lines.forEach((ln: string) => { ensureSpace(12); doc.text(ln, margin, y); y += 12; });
        }
        y += 14;
      }
    }

    // Pie
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('Status Vzla · Plataforma ciudadana de emergencias · No partidista · Sin fines de lucro', margin, pageH - 20);
      doc.text(`${p} / ${totalPages}`, pageW - margin - 20, pageH - 20);
    }

    // ── Subir PDF ──
    const pdfBytes = doc.output('arraybuffer');
    const pdfFile = new File([pdfBytes], `informe_inspeccion_${reporteId}.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });

    const ahora = new Date().toISOString();
    await base44.asServiceRole.entities.ReportesDano.update(reporteId, {
      inspeccion_pdf_url: file_url,
      inspeccion_pdf_fecha: ahora,
    }).catch(() => {});

    // ── Email al solicitante (sin exponer sus datos en el cuerpo) ──
    let emailEnviado = false;
    const solicitanteEmail = (rep.reportante_email || '').trim();
    if (solicitanteEmail && file_url) {
      const lugar = rep.nombre_lugar || rep.direccion || rep.ciudad || 'la estructura reportada';
      const sevTxt = sev ? (SEVERIDAD_LBL[sev] || sev) : '—';
      const claseTxt = selloKey && SELLOS[selloKey] ? SELLOS[selloKey].label : '—';
      const inner = `
        <h1 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 12px;">Informe de inspección listo 📄</h1>
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 12px;">La inspección técnica de <b>${lugar}</b> ha sido completada.</p>
        <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;margin:0 0 14px;">
          <tr><td style="padding:5px 0;color:#6b7280;">Severidad:</td><td style="padding:5px 0;font-weight:700;">${sevTxt}</td></tr>
          <tr><td style="padding:5px 0;color:#6b7280;">Clasificación:</td><td style="padding:5px 0;font-weight:700;">${claseTxt}</td></tr>
        </table>
        <a href="${file_url}" style="display:block;text-align:center;background:#1d4ed8;color:#fff;font-weight:700;font-size:14px;padding:13px;border-radius:10px;text-decoration:none;">Descargar informe PDF →</a>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:14px 0 0;">También puedes ver la ficha pública: <a href="${APP_URL}/edificio?id=${reporteId}" style="color:#1d4ed8;">abrir ficha</a>.</p>
        <p style="font-size:12px;color:#92400e;background:#fef9f0;border:1px solid #f59e0b40;border-radius:8px;padding:10px 12px;line-height:1.5;margin:16px 0 0;">⚠️ No entres a estructuras dañadas. Si hay grietas graves, olor a gas, cables caídos, incendio o personas atrapadas, espera a Protección Civil (171), Bomberos o rescatistas autorizados.</p>`;
      const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0D2259;padding:18px 24px;"><span style="font-size:18px;font-weight:800;color:#fff;">📍 Status<span style="color:#F5C518;"> Vzla</span></span></div>
        <div style="padding:24px;">${inner}</div>
        <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="font-size:11px;color:#9ca3af;margin:0;">Status Vzla · Plataforma ciudadana de emergencias · No partidista · Sin fines de lucro</p></div>
      </div>`;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: solicitanteEmail,
          subject: `Informe de inspección — ${rep.nombre_lugar || rep.ciudad || 'Status Vzla'}`,
          body: html,
        });
        emailEnviado = true;
      } catch { /* el PDF igual queda en la ficha */ }
    }

    await base44.asServiceRole.entities.LogNotificaciones.create({
      tipo: 'edificio',
      entidad_id: reporteId,
      entidad_nombre: rep.nombre_lugar || rep.direccion || rep.ciudad || '—',
      emails_enviados: emailEnviado ? 1 : 0,
      accion: 'informe_inspeccion_generado',
      detalles: `PDF generado (${detalle.length} fotos). Email al solicitante: ${emailEnviado ? solicitanteEmail : 'no enviado'}.`,
    }).catch(() => {});

    return Response.json({ ok: true, pdf_url: file_url, email_enviado: emailEnviado, fotos: detalle.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});