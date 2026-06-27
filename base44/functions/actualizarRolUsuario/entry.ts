import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { targetUserId, nuevoRol } = await req.json();
    if (!targetUserId || !nuevoRol) return Response.json({ error: 'Missing params' }, { status: 400 });
    if (!['admin', 'user'].includes(nuevoRol)) return Response.json({ error: 'Invalid role' }, { status: 400 });

    // Actualizar rol en User
    await base44.asServiceRole.entities.User.update(targetUserId, { role: nuevoRol });

    // Sincronizar en PerfilProfesional si existe
    const perfiles = await base44.asServiceRole.entities.PerfilProfesional.filter({ user_id: targetUserId });
    if (perfiles && perfiles.length > 0) {
      await base44.asServiceRole.entities.PerfilProfesional.update(perfiles[0].id, {
        estado_aprobacion: nuevoRol === 'admin' ? 'aprobado' : perfiles[0].estado_aprobacion
      });
    }

    return Response.json({ ok: true, nuevoRol });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});