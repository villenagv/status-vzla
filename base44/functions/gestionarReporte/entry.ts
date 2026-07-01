import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Endpoint privilegiado para acciones administrativas sobre un reporte de daño:
// cambiar estatus, asignar voluntario, cerrar, marcar privado.
// Solo admins pueden ejecutar estas acciones. Cada cambio queda registrado
// en la línea de tiempo (ActualizacionesSitios) para auditoría.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { reporte_id, accion, data } = await req.json();
    if (!reporte_id || !accion) return Response.json({ error: 'Faltan parámetros' }, { status: 400 });

    const reporte = await base44.asServiceRole.entities.ReportesDano.get(reporte_id);
    if (!reporte) return Response.json({ error: 'Reporte no encontrado' }, { status: 404 });

    let updateData = {};
    let descripcion = '';

    if (accion === 'cambiar_estado') {
      updateData = { estado_verificacion: data?.estado_verificacion };
      descripcion = `Estatus cambiado a "${data?.estado_verificacion}" por ${user.full_name || user.email}`;
    } else if (accion === 'asignar_voluntario') {
      updateData = { voluntario_asignado_id: data?.voluntario_asignado_id || '', voluntario_asignado_nombre: data?.voluntario_asignado_nombre || '' };
      descripcion = data?.voluntario_asignado_nombre
        ? `Caso asignado a ${data.voluntario_asignado_nombre} por ${user.full_name || user.email}`
        : `Asignación removida por ${user.full_name || user.email}`;
    } else if (accion === 'cerrar') {
      updateData = { estado_verificacion: 'resuelto' };
      descripcion = `Reporte cerrado por ${user.full_name || user.email}`;
    } else if (accion === 'marcar_privado') {
      updateData = { es_privado: !!data?.es_privado };
      descripcion = data?.es_privado
        ? `Reporte marcado como privado por ${user.full_name || user.email}`
        : `Reporte hecho público de nuevo por ${user.full_name || user.email}`;
    } else {
      return Response.json({ error: 'Acción no reconocida' }, { status: 400 });
    }

    const actualizado = await base44.asServiceRole.entities.ReportesDano.update(reporte_id, updateData);

    await base44.asServiceRole.entities.ActualizacionesSitios.create({
      sitio_id: reporte_id,
      tipo_sitio: 'edificio',
      tipo_accion: 'estado_cambiado',
      descripcion,
      es_verificado: true,
      reportante_nombre: user.full_name || user.email,
      fuente: 'admin',
    }).catch(() => {});

    return Response.json({ ok: true, reporte: actualizado });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});