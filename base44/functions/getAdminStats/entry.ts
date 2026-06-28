import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.email !== 'villenagv@gmail.com')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const serviceRoleClient = base44.asServiceRole;
    const MAX_COUNT = 2000;

    const counters = { personas: 0, personasBuscadas: 0, reportesDano: 0, suscripciones: 0, puntosAyuda: 0, encontrados: 0, usuariosRegistrados: 0, voluntariosActivos: 0, emailsEnviados: 0, solicitudes: 0 };

    try { counters.personas = await serviceRoleClient.entities.PersonaCRIS.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.personasBuscadas = await serviceRoleClient.entities.PersonasBuscadas.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.reportesDano = await serviceRoleClient.entities.ReportesDano.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.suscripciones = await serviceRoleClient.entities.Suscripciones.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.puntosAyuda = await serviceRoleClient.entities.PuntosAyuda.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.encontrados = await serviceRoleClient.entities.PersonasEncontradas.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.alertas = await serviceRoleClient.entities.AlertaFamiliar.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.solicitudes = await serviceRoleClient.entities.SolicitudesInfoEdificio.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}

    // Nuevas métricas
    try { counters.usuariosRegistrados = await serviceRoleClient.entities.User.list(null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try { counters.voluntariosActivos = await serviceRoleClient.entities.SolicitudVoluntario.filter({ estado: 'aprobado' }, null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}
    try {
      // Sumar emails desde LogNotificaciones
      const logs = await serviceRoleClient.entities.LogNotificaciones.list(null, MAX_COUNT).catch(() => []);
      counters.emailsEnviados = logs.reduce((sum, l) => sum + (l.emails_enviados || 0), 0);
      // También verificar cache si disponible
      const cacheEmail = await serviceRoleClient.entities.ContadoresCache.filter({ clave: 'emails_enviados_total' }).catch(() => []);
      if (cacheEmail.length > 0) counters.emailsEnviados = Math.max(counters.emailsEnviados, cacheEmail[0].valor || 0);
    } catch {}
    try { counters.suscriptoresEdificios = await serviceRoleClient.entities.SuscriptoresSeguimiento.filter({ activo: true }, null, MAX_COUNT).then(r => r.length).catch(() => 0); } catch {}

    return new Response(JSON.stringify(counters), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});