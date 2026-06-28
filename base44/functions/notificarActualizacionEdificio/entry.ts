import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';

const NIVEL_LABELS = {
  es: { leve: 'Daño leve', moderado: 'Daño moderado', grave: 'Daño grave — NO ENTRAR', critico: 'CRÍTICO — NO ENTRAR', colapsado: 'COLAPSADO — EVACUADO', no_evaluado: 'Sin evaluar' },
  en: { leve: 'Minor damage', moderado: 'Moderate damage', grave: 'Severe damage — DO NOT ENTER', critico: 'CRITICAL — DO NOT ENTER', colapsado: 'COLLAPSED — EVACUATED', no_evaluado: 'Not evaluated' },
};

const ACCION_LABELS = {
  es: {
    persona_herida_recuperada: 'Persona herida recuperada',
    persona_fallecida_recuperada: 'Persona fallecida recuperada',
    personas_atrapadas: 'Personas atrapadas reportadas',
    reportar_urgencia: 'Urgencia reportada',
  },
  en: {
    persona_herida_recuperada: 'Injured person recovered',
    persona_fallecida_recuperada: 'Deceased person recovered',
    personas_atrapadas: 'Trapped people reported',
    reportar_urgencia: 'Emergency reported',
  },
};

function escapeHtml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function extraerContactos(texto, reportanteNombre = '') {
  const body = String(texto || '');
  const telefonos = [...new Set((body.match(/(?:\+?\d[\d\s().-]{6,}\d)/g) || []).map(t => t.replace(/\s+/g, ' ').trim()))];
  const nombres = reportanteNombre ? [reportanteNombre] : [];
  const patrones = [/(?:nombre|contacto|reportante)\s*[:\-]\s*([^\n,;]+)/gi, /(?:preguntar por|hablar con|llamar a)\s+([^\n,;.]+)/gi];
  for (const patron of patrones) {
    let match;
    while ((match = patron.exec(body)) !== null) {
      const nombre = match[1].trim();
      if (nombre && nombre.length <= 60 && !/\d/.test(nombre) && !nombres.includes(nombre)) nombres.push(nombre);
    }
  }
  return telefonos.map((telefono, index) => ({ nombre: nombres[index] || nombres[0] || '', telefono })).slice(0, 5);
}

function renderContactos(contactos, es) {
  if (!contactos.length) return '';
  const rows = contactos.map(c => `<li style="margin:4px 0;font-size:13px;color:#374151;"><strong>${escapeHtml(c.nombre || (es ? 'Contacto' : 'Contact'))}</strong>${c.telefono ? ` · ${escapeHtml(c.telefono)}` : ''}</li>`).join('');
  return `<tr><td style="padding:0 28px 16px;"><div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;"><p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#166534;">${es ? 'Contactos mencionados en la actualización' : 'Contacts mentioned in the update'}</p><ul style="margin:0;padding-left:18px;">${rows}</ul><p style="margin:8px 0 0;font-size:11px;color:#166534;line-height:1.4;">${es ? 'Verifica la información antes de compartirla. Nunca envíes dinero.' : 'Verify this information before sharing it. Never send money.'}</p></div></td></tr>`;
}

function buildHtml({ nombre, estadoLabel, direccion, mensaje, contactos, profileLink, es }) {
  return `<!DOCTYPE html><html lang="${es ? 'es' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F4F4F8;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:24px 16px;"><tr><td align="center"><table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;"><tr><td style="background:#1A1F2E;padding:20px 28px;"><p style="margin:0;color:#fff;font-size:20px;font-weight:900;">STATUS<span style="color:#D48C2E;">VZLA</span><span style="color:#D48C2E;font-size:14px;">.com</span></p><p style="margin:4px 0 0;color:#9CA3AF;font-size:11px;">${es ? 'Sistema de respuesta a emergencias · Venezuela' : 'Emergency response system · Venezuela'}</p></td></tr><tr><td style="padding:24px 28px 12px;"><div style="background:#FDF1F0;border-radius:12px;padding:18px;text-align:center;"><h2 style="margin:0;font-size:20px;font-weight:900;color:#1A1F2E;">${escapeHtml(nombre)}</h2><p style="margin:8px 0 0;display:inline-block;background:#C0392B;color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:50px;">${escapeHtml(estadoLabel)}</p>${direccion ? `<p style="margin:8px 0 0;font-size:12px;color:#6B7280;">📍 ${escapeHtml(direccion)}</p>` : ''}</div></td></tr>${mensaje ? `<tr><td style="padding:0 28px 16px;"><p style="margin:0;font-size:14px;color:#4B5563;line-height:1.5;background:#F9FAFB;border-radius:10px;padding:14px;">"${escapeHtml(mensaje)}"</p></td></tr>` : ''}${renderContactos(contactos, es)}<tr><td style="padding:0 28px 16px;"><a href="${profileLink}" style="display:block;background:#1A1F2E;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">${es ? '🔍 Ver información completa' : '🔍 View full information'}</a></td></tr><tr><td style="padding:0 28px 16px;"><div style="background:#FFF8EE;border:1px solid #F0C8A0;border-radius:10px;padding:12px;"><p style="margin:0;font-size:11px;color:#7A4010;line-height:1.5;">${es ? '⚠️ No entres a estructuras dañadas. Espera a Protección Civil, Bomberos, rescatistas o autoridades competentes.' : '⚠️ Do not enter damaged structures. Wait for Civil Protection, firefighters, rescue teams, or authorized officials.'}</p></div></td></tr><tr><td style="background:#F9FAFB;padding:16px 28px;border-top:1px solid #F3F4F6;"><p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.5;">${es ? 'Mensaje automático de STATUSVZLA.com.' : 'Automatic message from STATUSVZLA.com.'}</p></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { edificio_id, tipo_accion, nivel_dano, direccion, nombre_lugar, descripcion, notas, reportante_nombre, reportante_telefono, telefono_contacto, lang = 'es' } = await req.json();
    if (!edificio_id) return Response.json({ error: 'edificio_id requerido' }, { status: 400 });

    const es = lang !== 'en';
    const nivelDesc = ACCION_LABELS[lang]?.[tipo_accion] || NIVEL_LABELS[lang]?.[nivel_dano] || nivel_dano || (es ? 'Actualización' : 'Update');
    const telefono = reportante_telefono || telefono_contacto || '';
    const mensaje = descripcion || notas || (reportante_nombre ? `Reportado por ${reportante_nombre}${telefono ? ` · ${telefono}` : ''}` : '');
    const contactosDirectos = reportante_nombre || telefono ? [{ nombre: reportante_nombre || '', telefono }] : [];
    const contactos = contactosDirectos.length ? contactosDirectos : extraerContactos([descripcion, notas].filter(Boolean).join('\n'), reportante_nombre || '');

    const emails = new Set();
    const [seguimiento, porCuenta] = await Promise.all([
      base44.asServiceRole.entities.SuscriptoresSeguimiento.filter({ reporte_id: edificio_id, activo: true }),
      base44.asServiceRole.entities.Suscripciones.filter({ edificio_id, activa: true }),
    ]);
    for (const s of seguimiento) {
      const email = s.telefono_whatsapp?.trim();
      if (email && email.includes('@')) emails.add(email);
    }
    for (const s of porCuenta) {
      if (s.email_notificacion?.trim()) emails.add(s.email_notificacion.trim());
    }
    if (emails.size === 0) return Response.json({ ok: true, notificados: 0, motivo: 'sin_suscriptores' });

    const nombre = nombre_lugar || (es ? 'Edificio' : 'Building');
    const subject = es ? `StatusVzla | Edificio: ${nombre} — ${nivelDesc}` : `StatusVzla | Building: ${nombre} — ${nivelDesc}`;
    const body = buildHtml({ nombre, estadoLabel: nivelDesc, direccion, mensaje, contactos, profileLink: `${APP_URL}/edificio?id=${edificio_id}`, es });

    let enviados = 0;
    for (const email of emails) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body, from_name: 'StatusVzla' });
        enviados++;
      } catch (e) {
        console.warn(`Error enviando a ${email}: ${e.message}`);
      }
    }

    // Registrar en LogNotificaciones para métricas globales
    if (enviados > 0) {
      try {
        await base44.asServiceRole.entities.LogNotificaciones.create({
          tipo: 'edificio',
          entidad_id: edificio_id,
          entidad_nombre: nombre_lugar || '',
          emails_enviados: enviados,
          accion: tipo_accion || 'actualizacion',
        });

        // Actualizar contador global cacheado
        const cacheExisting = await base44.asServiceRole.entities.ContadoresCache.filter({ clave: 'emails_enviados_total' });
        if (cacheExisting.length > 0) {
          const nuevo = (cacheExisting[0].valor || 0) + enviados;
          await base44.asServiceRole.entities.ContadoresCache.update(cacheExisting[0].id, { valor: nuevo, ultima_actualizacion: new Date().toISOString() });
        } else {
          await base44.asServiceRole.entities.ContadoresCache.create({ clave: 'emails_enviados_total', valor: enviados, ultima_actualizacion: new Date().toISOString() });
        }
      } catch (e) {
        console.warn('Error registrando log de notificaciones:', e.message);
      }
    }

    return Response.json({ ok: true, notificados: enviados, total: emails.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});