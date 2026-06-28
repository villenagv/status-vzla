import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_EMAIL = 'villenagv@gmail.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.email !== ADMIN_EMAIL && user.role !== 'admin') {
      return Response.json({ error: 'Solo el administrador puede usar esta función.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, edificios } = body;

    // ── ACCIÓN: insertar un lote pequeño ya normalizado desde el frontend ──
    if (action === 'insertar_lote') {
      if (!edificios || !Array.isArray(edificios)) {
        return Response.json({ error: 'Se requiere un array "edificios"' }, { status: 400 });
      }

      const creados = [];
      const errores = [];

      for (const e of edificios) {
        try {
          await base44.asServiceRole.entities.ReportesDano.create(e);
          creados.push(e.nombre_lugar);
        } catch (err) {
          errores.push({ nombre: e.nombre_lugar, error: err.message });
        }
      }

      return Response.json({
        status: 'success',
        guardados: creados.length,
        errores: errores.length,
        detalles_errores: errores,
      });
    }

    // ── ACCIÓN: obtener IDs existentes para deduplicación en el cliente ──
    if (action === 'obtener_existentes') {
      const existentes = await base44.asServiceRole.entities.ReportesDano.list('-created_date', 5000);
      const resumen = (existentes || []).map(e => ({
        id: e.id,
        nombre_lugar: e.nombre_lugar || '',
        direccion: e.direccion || '',
        ciudad: e.ciudad || '',
      }));
      return Response.json({ status: 'success', existentes: resumen });
    }

    return Response.json({ error: 'Acción no reconocida. Usa: insertar_lote | obtener_existentes' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});