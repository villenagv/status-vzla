import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_EMAIL = 'villenagv@gmail.com';
const FIXED_RECIPIENTS = ['luken.quintana@hachaymacheteve.com', ADMIN_EMAIL];

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value) ? value.join(' | ') : String(value);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.email !== ADMIN_EMAIL)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const edificios = await base44.asServiceRole.entities.ReportesDano.list('-created_date', 2000);

    const columns = [
      'codigo_reporte', 'nombre_lugar', 'tipo_estructura', 'direccion', 'ciudad', 'estado_region',
      'nivel_dano', 'estado_acceso', 'personas_atrapadas', 'prioridad', 'nivel_verificacion',
      'triage_estado', 'requiere_inspeccion_presencial', 'inspeccion_estado_pendiente',
      'inspeccion_severidad', 'inspeccion_tipo_dano', 'inspeccion_por', 'inspeccion_fecha',
      'created_date', 'fotos', 'fotos_inspeccion', 'pdf_inspeccion', 'ficha_url',
    ];

    const rows = edificios.map((e) => {
      const fotosInspeccion = (e.inspeccion_detalle_fotos || []).map((f) => f.url).filter(Boolean);
      return {
        codigo_reporte: e.codigo_reporte,
        nombre_lugar: e.nombre_lugar,
        tipo_estructura: e.tipo_estructura,
        direccion: e.direccion,
        ciudad: e.ciudad,
        estado_region: e.estado_region,
        nivel_dano: e.nivel_dano,
        estado_acceso: e.estado_acceso,
        personas_atrapadas: e.personas_atrapadas,
        prioridad: e.prioridad,
        nivel_verificacion: e.nivel_verificacion,
        triage_estado: e.triage_estado,
        requiere_inspeccion_presencial: e.requiere_inspeccion_presencial ? 'si' : 'no',
        inspeccion_estado_pendiente: e.inspeccion_estado_pendiente,
        inspeccion_severidad: e.inspeccion_severidad,
        inspeccion_tipo_dano: e.inspeccion_tipo_dano,
        inspeccion_por: e.inspeccion_por,
        inspeccion_fecha: e.inspeccion_fecha,
        created_date: e.created_date,
        fotos: e.foto_urls || [],
        fotos_inspeccion: fotosInspeccion,
        pdf_inspeccion: e.inspeccion_pdf_url || '',
        ficha_url: `https://statusvzla.com/edificio?id=${e.id}`,
      };
    });

    const csvLines = [columns.join(',')];
    for (const row of rows) {
      csvLines.push(columns.map((c) => csvEscape(row[c])).join(','));
    }
    const csvContent = csvLines.join('\n');

    const fecha = new Date().toISOString().slice(0, 10);
    const fileName = `edificios_inspecciones_${fecha}.csv`;
    const file = new File([csvContent], fileName, { type: 'text/csv' });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    const extras = await base44.asServiceRole.entities.ExportacionDestinatarios.filter({ activo: true });
    const extraEmails = extras.map((r) => r.email).filter(Boolean);
    const recipients = Array.from(new Set([...FIXED_RECIPIENTS, ...extraEmails]));

    const subject = `Exportación de edificios e inspecciones — ${fecha}`;
    const body = `Se generó una nueva exportación de edificios e inspecciones (${rows.length} registros).\n\nDescarga el archivo CSV aquí:\n${file_url}\n\nEl CSV incluye enlaces a las fotos, fotos de inspección y PDF de la ficha técnica de cada edificio.\n\n— Status Vzla`;

    for (const to of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body, from_name: 'Status Vzla' }).catch(() => {});
    }

    return Response.json({ success: true, total_registros: rows.length, file_url, recipients });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});