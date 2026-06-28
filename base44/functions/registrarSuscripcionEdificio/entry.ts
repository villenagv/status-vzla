import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Registra una suscripción a un edificio.
 * - Verifica si el email ya está suscrito (deduplicación).
 * - Crea registro en SuscriptoresSeguimiento.
 * - También crea/actualiza en Suscripciones si el usuario tiene cuenta.
 * - Retorna el conteo actualizado de suscriptores del edificio.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { edificio_id, email, nombre, lang = 'es' } = await req.json();

    if (!edificio_id || !email) {
      return Response.json({ error: 'edificio_id y email son requeridos' }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    // Verificar duplicado en SuscriptoresSeguimiento
    const existentes = await base44.asServiceRole.entities.SuscriptoresSeguimiento.filter({
      reporte_id: edificio_id,
      activo: true,
    });

    const yaExiste = existentes.some(s =>
      s.telefono_whatsapp?.trim().toLowerCase() === emailNorm
    );

    if (yaExiste) {
      return Response.json({
        ok: true,
        ya_suscrito: true,
        total_suscriptores: existentes.length,
      });
    }

    // Crear registro en SuscriptoresSeguimiento
    await base44.asServiceRole.entities.SuscriptoresSeguimiento.create({
      reporte_id: edificio_id,
      tipo_reporte: 'dano',
      telefono_whatsapp: emailNorm,
      nombre_suscriptor: nombre?.trim() || '',
      activo: true,
      fuente: 'notificame',
    });

    // Si el usuario tiene cuenta, también asociar en Suscripciones para multi-edificio
    try {
      const usuarios = await base44.asServiceRole.entities.User?.filter?.({ email: emailNorm });
      if (usuarios && usuarios.length > 0) {
        const user = usuarios[0];
        const subExistente = await base44.asServiceRole.entities.Suscripciones.filter({
          user_id: user.id,
          edificio_id,
        });
        if (!subExistente || subExistente.length === 0) {
          await base44.asServiceRole.entities.Suscripciones.create({
            user_id: user.id,
            edificio_id,
            email_notificacion: emailNorm,
            activa: true,
          });
        }
      }
    } catch {
      // No bloqueante — el usuario puede no tener cuenta todavía
    }

    // Conteo actualizado
    const totalAfter = existentes.length + 1;

    return Response.json({
      ok: true,
      ya_suscrito: false,
      total_suscriptores: totalAfter,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});