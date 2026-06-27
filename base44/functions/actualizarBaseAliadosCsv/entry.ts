import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CACHE_KEY = 'base_aliados_cris_csv';
const SIX_HOURS = 6 * 60 * 60 * 1000;

const DATASETS = [
  { entity: 'PersonasBuscadas', label: 'personas_buscadas', fields: ['nombre_completo', 'apodo', 'edad_aprox', 'sexo', 'descripcion_fisica', 'ultima_ubicacion_conocida', 'ciudad', 'estado_region', 'fecha_ultima_vez', 'estado_caso', 'notas_publicas', 'fuente'] },
  { entity: 'PersonasEncontradas', label: 'personas_encontradas', fields: ['nombre_o_descripcion', 'condicion', 'ubicacion_actual', 'tipo_lugar', 'nombre_lugar', 'ciudad', 'estado_region', 'descripcion_fisica', 'edad_aprox', 'sexo', 'notas_publicas', 'nivel_verificacion', 'fuente'] },
  { entity: 'PersonaRegistrada', label: 'listados_institucionales', fields: ['institucion_nombre', 'nombre_completo', 'edad_aprox', 'sexo', 'condicion', 'sera_trasladado', 'destino_traslado', 'ciudad', 'estado_region', 'observaciones', 'nivel_verificacion', 'fuente'] },
  { entity: 'PersonaCRIS', label: 'registro_cris', fields: ['nombre', 'apellido', 'apodo', 'edad_aproximada', 'sexo', 'descripcion_fisica', 'ropa_descripcion', 'estado_actual', 'nivel_verificacion', 'codigo_cris', 'ciudad', 'estado_region', 'ubicacion_texto', 'ultima_ubicacion_conocida', 'centro_apoyo', 'fuente_inicial', 'notas_publicas'] },
  { entity: 'PuntosAyuda', label: 'centros_ayuda', fields: ['tipo_lugar', 'nombre_lugar', 'tipo_entidad', 'estado_operativo', 'capacidad_maxima', 'personas_actuales', 'espacio_disponible', 'servicios_disponibles', 'necesidades_urgentes', 'direccion', 'referencia', 'descripcion_como_llegar', 'ciudad', 'estado_region', 'horario_apertura', 'horario_cierre', 'opera_24h', 'dias_activos', 'telefono_publico', 'fuente', 'nivel_verificacion', 'requiere_actualizacion', 'ultima_actualizacion', 'necesita_suministros', 'necesita_voluntarios'] },
  { entity: 'ReportesDano', label: 'edificios_danados', fields: ['tipo_estructura', 'nombre_lugar', 'nivel_dano', 'estado_acceso', 'personas_atrapadas', 'riesgo_gas', 'riesgo_electrico', 'riesgo_incendio', 'riesgo_colapso', 'descripcion', 'direccion', 'referencia', 'ciudad', 'estado_region', 'prioridad', 'estado_verificacion', 'nivel_verificacion', 'fuente'] },
  { entity: 'InfraestructuraSos', label: 'infraestructura_sos', fields: ['tipo_reporte', 'categoria', 'nivel_dano', 'personas_atrapadas', 'riesgo_electrico', 'riesgo_gas', 'riesgo_incendio', 'acceso_sitio', 'requiere_maquinaria', 'direccion', 'referencia', 'ciudad', 'estado_region', 'prioridad', 'estado_reporte', 'nivel_verificacion', 'fuente', 'rol_reportante', 'descripcion'] },
  { entity: 'SolicitudesInfoEdificio', label: 'solicitudes_info_edificio', fields: ['nombre_lugar', 'direccion', 'ciudad', 'estado_region', 'descripcion', 'estado_solicitud', 'reporte_encontrado_id', 'fuente'] },
  { entity: 'OfertasAyuda', label: 'ofertas_ayuda', fields: ['tipo_ayuda', 'descripcion', 'disponibilidad', 'ciudad_origen', 'puede_llegar_a', 'estado', 'fuente'] },
  { entity: 'ActualizacionesSitios', label: 'actualizaciones_sitios', fields: ['sitio_id', 'tipo_sitio', 'tipo_accion', 'descripcion', 'nivel_dano_anterior', 'nivel_dano_nuevo', 'personas_atrapadas_anterior', 'personas_atrapadas_nuevo', 'es_sensible', 'es_verificado', 'fuente'] },
];

const csvValue = (value) => {
  if (value === undefined || value === null) return '""';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const pickPublicFields = (record, fields) => {
  const data = {};
  fields.forEach((field) => {
    if (record[field] !== undefined && record[field] !== null && record[field] !== '') data[field] = record[field];
  });
  return data;
};

const primaryName = (record) => record.nombre_completo || record.nombre_o_descripcion || record.nombre_lugar || record.nombre || record.institucion_nombre || record.tipo_reporte || record.tipo_ayuda || '';
const primaryStatus = (record) => record.estado_caso || record.condicion || record.estado_actual || record.estado_operativo || record.nivel_dano || record.estado_reporte || record.estado || '';
const primaryLocation = (record) => record.ultima_ubicacion_conocida || record.ubicacion_actual || record.ubicacion_texto || record.direccion || record.referencia || record.centro_apoyo || '';

async function safeList(base44, dataset) {
  try {
    return await base44.asServiceRole.entities[dataset.entity].list('-updated_date', 5000);
  } catch (error) {
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch (error) {}

    const cachedList = await base44.asServiceRole.entities.ArchivoAliados.filter({ clave: CACHE_KEY }, '-updated_date', 1);
    const cached = cachedList[0];
    const cachedTime = cached?.generated_at ? new Date(cached.generated_at).getTime() : 0;
    const isFresh = cached?.file_url && Date.now() - cachedTime < SIX_HOURS;

    if (isFresh && payload.force !== true) {
      return Response.json({ ...cached, from_cache: true });
    }

    const rows = [[
      'dataset', 'record_id', 'created_date', 'updated_date', 'nombre', 'estado', 'ciudad', 'estado_region', 'ubicacion', 'fuente', 'nivel_verificacion', 'detalle_publico_json'
    ]];
    const summary = {};
    let totalRecords = 0;

    for (const dataset of DATASETS) {
      const records = await safeList(base44, dataset);
      summary[dataset.label] = records.length;
      totalRecords += records.length;
      records.forEach((record) => {
        rows.push([
          dataset.label,
          record.id || '',
          record.created_date || '',
          record.updated_date || '',
          primaryName(record),
          primaryStatus(record),
          record.ciudad || '',
          record.estado_region || '',
          primaryLocation(record),
          record.fuente || record.fuente_inicial || '',
          record.nivel_verificacion || record.estado_verificacion || '',
          pickPublicFields(record, dataset.fields),
        ]);
      });
    }

    const csv = rows.map((row) => row.map(csvValue).join(',')).join('\n');
    const file = new File([csv], 'cris_base_aliados.csv', { type: 'text/csv;charset=utf-8' });
    const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const data = {
      clave: CACHE_KEY,
      file_url: upload.file_url,
      generated_at: new Date().toISOString(),
      total_records: totalRecords,
      total_rows: rows.length - 1,
      status: 'activo',
      summary_json: JSON.stringify(summary),
    };

    const saved = cached
      ? await base44.asServiceRole.entities.ArchivoAliados.update(cached.id, data)
      : await base44.asServiceRole.entities.ArchivoAliados.create(data);

    return Response.json({ ...saved, from_cache: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});