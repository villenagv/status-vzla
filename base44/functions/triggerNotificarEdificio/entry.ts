import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Trigger automático para notificaciones de edificios.
 * Se invoca desde dos automaciones entity:
 *   1. ReportesDano      → create / update
 *   2. EstadoOperativoEdificio → create / update
 *   3. ActualizacionesSitios   → create (tipo_sitio = 'edificio')
 *
 * Reglas anti-spam:
 *   - Solo notifica si cambiaron campos críticos (nivel_dano, personas_atrapadas, estado_acceso, etc.)
 *   - Cooldown de 10 min por edificio (clave en ContadoresCache)
 *   - Solo si hay suscriptores activos
 */

const CAMPOS_CRITICOS_REPORTE = [
  'nivel_dano', 'personas_atrapadas', 'riesgo_gas', 'riesgo_electrico',
  'riesgo_incendio', 'estado_verificacion', 'acceso_calle',
];

const CAMPOS_CRITICOS_OPERATIVO = [
  'electricidad', 'agua', 'gas', 'tipo_dano', 'acceso_calle',
  'racionamiento_agua', 'racionamiento_electricidad', 'racionamiento_gas',
];

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data, changed_fields } = payload;
    if (!event || !data) {
      return Response.json({ ok: false, motivo: 'payload_invalido' });
    }

    const entityName = event.entity_name;
    let edificio_id = null;
    let edificioData = null;
    let lang = 'es';
    let tipo_accion = 'actualizacion';
    let descripcion = '';
    let sonCamposCriticos = false;

    // ── CASO 1: ReportesDano actualizado/creado ──
    if (entityName === 'ReportesDano') {
      edificio_id = data.id;
      edificioData = data;

      if (event.type === 'create') {
        sonCamposCriticos = true;
        tipo_accion = 'nuevo_reporte';
        descripcion = data.descripcion || '';
      } else {
        const campos = Array.isArray(changed_fields) ? changed_fields : [];
        sonCamposCriticos = campos.some(c => CAMPOS_CRITICOS_REPORTE.includes(c));
        if (!sonCamposCriticos) {
          return Response.json({ ok: true, motivo: 'sin_cambios_criticos', campos });
        }
        if (campos.includes('nivel_dano')) tipo_accion = 'nuevo_nivel_dano';
        else if (campos.includes('personas_atrapadas')) tipo_accion = 'personas_atrapadas';
        else if (campos.includes('riesgo_gas') || campos.includes('riesgo_electrico') || campos.includes('riesgo_incendio')) tipo_accion = 'riesgo_marcado';
        else tipo_accion = 'estado_cambiado';
      }
    }

    // ── CASO 2: EstadoOperativoEdificio actualizado/creado ──
    else if (entityName === 'EstadoOperativoEdificio') {
      edificio_id = data.edificio_id;
      if (!edificio_id) {
        return Response.json({ ok: false, motivo: 'sin_edificio_id_en_operativo' });
      }

      const campos = Array.isArray(changed_fields) ? changed_fields : [];
      sonCamposCriticos = event.type === 'create' || campos.some(c => CAMPOS_CRITICOS_OPERATIVO.includes(c));
      if (!sonCamposCriticos) {
        return Response.json({ ok: true, motivo: 'sin_cambios_criticos_operativo', campos });
      }

      // Buscar el edificio padre para obtener nombre/dirección
      try {
        edificioData = await base44.asServiceRole.entities.ReportesDano.get(edificio_id);
      } catch {
        edificioData = null;
      }

      // Construir descripción con los servicios que cambiaron
      const partes = [];
      if (data.electricidad && data.electricidad !== 'no_confirmado') partes.push(`Electricidad: ${data.electricidad}`);
      if (data.agua && data.agua !== 'no_confirmado') partes.push(`Agua: ${data.agua}`);
      if (data.gas && data.gas !== 'no_confirmado') partes.push(`Gas: ${data.gas}`);
      if (data.tipo_dano && data.tipo_dano !== 'no_confirmado') partes.push(`Daños: ${data.tipo_dano}`);
      descripcion = partes.join(' · ');
      tipo_accion = 'estado_cambiado';
    }

    // ── CASO 3: ActualizacionesSitios ──
    else if (entityName === 'ActualizacionesSitios' && data.tipo_sitio === 'edificio') {
      edificio_id = data.sitio_id;
      tipo_accion = data.tipo_accion || 'tengo_actualizacion';
      descripcion = data.descripcion || '';
      sonCamposCriticos = true;

      try {
        edificioData = await base44.asServiceRole.entities.ReportesDano.get(edificio_id);
      } catch {
        edificioData = null;
      }
    }

    else {
      return Response.json({ ok: false, motivo: 'entidad_no_manejada', entityName });
    }

    if (!edificio_id) {
      return Response.json({ ok: false, motivo: 'no_edificio_id' });
    }

    // ── COOLDOWN anti-spam ──
    const cooldownKey = `cooldown_notif_edificio_${edificio_id}`;
    try {
      const cooldowns = await base44.asServiceRole.entities.ContadoresCache.filter({ clave: cooldownKey });
      if (cooldowns.length > 0) {
        const ultimaVez = new Date(cooldowns[0].ultima_actualizacion || 0).getTime();
        if (Date.now() - ultimaVez < COOLDOWN_MS) {
          return Response.json({ ok: true, motivo: 'cooldown_activo', proxima_en_ms: COOLDOWN_MS - (Date.now() - ultimaVez) });
        }
        await base44.asServiceRole.entities.ContadoresCache.update(cooldowns[0].id, { ultima_actualizacion: new Date().toISOString() });
      } else {
        await base44.asServiceRole.entities.ContadoresCache.create({ clave: cooldownKey, valor: 1, ultima_actualizacion: new Date().toISOString() });
      }
    } catch (e) {
      console.warn('Cooldown check error:', e.message);
    }

    // ── Llamar a notificarActualizacionEdificio ──
    const payload_notif = {
      edificio_id,
      tipo_accion,
      nivel_dano: edificioData?.nivel_dano || data.nivel_dano || '',
      nombre_lugar: edificioData?.nombre_lugar || data.nombre_lugar || '',
      direccion: edificioData?.direccion || data.direccion || '',
      descripcion,
      reportante_nombre: data.reportante_nombre || '',
      reportante_telefono: data.reportante_telefono || data.reportante_contacto || '',
      lang,
    };

    const result = await base44.asServiceRole.functions.invoke('notificarActualizacionEdificio', payload_notif);
    return Response.json({ ok: true, trigger_resultado: result?.data || result });

  } catch (error) {
    console.error('triggerNotificarEdificio error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});