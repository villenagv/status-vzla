import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Caché en memoria del proceso (0 créditos BD mientras el worker esté vivo) ──
let memCache = null;
let memCacheTs = 0;
const MEM_TTL = 60 * 60 * 1000; // 60 minutos

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, max-age=3600',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ciudad  = url.searchParams.get('ciudad')  || null;
    const nivel   = url.searchParams.get('nivel')   || null;
    const tipo    = url.searchParams.get('tipo')    || null;
    const format  = url.searchParams.get('format')  || 'json';

    const ahora = Date.now();

    // ── Capa 1: caché en memoria del proceso ────────────────────────────
    if (!memCache || (ahora - memCacheTs) > MEM_TTL) {

      // ── Capa 2: caché persistente en ArchivoAliados ──────────────────
      const base44 = createClientFromRequest(req);
      let datosCargados = false;

      try {
        const cacheRows = await base44.asServiceRole.entities.ArchivoAliados.filter({ clave: 'api_mapa_cache' }, '-created_date', 1);
        if (cacheRows && cacheRows.length > 0) {
          const row = cacheRows[0];
          const generadoTs = new Date(row.generated_at).getTime();
          if ((ahora - generadoTs) < MEM_TTL && row.summary_json) {
            memCache = JSON.parse(row.summary_json);
            memCacheTs = generadoTs;
            datosCargados = true;
          }
        }
      } catch (_) {
        // Si falla lectura de caché, continúa a consultar BD
      }

      // ── Capa 3: consulta BD real (solo si ambas cachés expiraron) ────
      if (!datosCargados) {
        const base44fresh = createClientFromRequest(req);
        const [edificios, refugios] = await Promise.all([
          base44fresh.asServiceRole.entities.ReportesDano.list('-updated_date', 3000),
          base44fresh.asServiceRole.entities.PuntosAyuda.list('-updated_date', 1000),
        ]);

        memCache = { edificios, refugios, generado: new Date().toISOString() };
        memCacheTs = ahora;

        // Persistir en ArchivoAliados para sobrevivir reinicios del worker
        try {
          const summary = JSON.stringify(memCache);
          const cacheRows = await base44fresh.asServiceRole.entities.ArchivoAliados.filter({ clave: 'api_mapa_cache' }, '-created_date', 1);
          if (cacheRows && cacheRows.length > 0) {
            await base44fresh.asServiceRole.entities.ArchivoAliados.update(cacheRows[0].id, {
              summary_json: summary,
              generated_at: memCache.generado,
              total_records: edificios.length,
            });
          } else {
            await base44fresh.asServiceRole.entities.ArchivoAliados.create({
              clave: 'api_mapa_cache',
              file_url: 'internal://cache',
              summary_json: summary,
              generated_at: memCache.generado,
              total_records: edificios.length,
              status: 'activo',
            });
          }
        } catch (_) {
          // No bloquear la respuesta si falla persistir caché
        }
      }
    }

    // ── Filtrar en memoria (0 créditos BD) ──────────────────────────────
    let edificios = memCache.edificios;
    let refugios  = memCache.refugios;

    if (ciudad) {
      const c = ciudad.toLowerCase();
      edificios = edificios.filter(e => (e.ciudad || '').toLowerCase().includes(c));
      refugios  = refugios.filter(r  => (r.ciudad || '').toLowerCase().includes(c));
    }
    if (nivel) {
      edificios = edificios.filter(e => e.nivel_dano === nivel);
    }
    if (tipo) {
      edificios = edificios.filter(e => e.tipo_estructura === tipo);
    }

    // ── Mapear solo campos públicos ───────────────────────────────────────
    const mapEdificio = (e, i) => ({
      numero: i + 1,
      id: e.id,
      tipo: 'edificio',
      nombre: e.nombre_lugar || null,
      tipo_estructura: e.tipo_estructura,
      nivel_dano: e.nivel_dano || 'no_evaluado',
      estado_acceso: e.estado_acceso || 'no_verificado',
      personas_atrapadas: e.personas_atrapadas || 'no_sabe',
      riesgos: {
        gas: e.riesgo_gas || false,
        electrico: e.riesgo_electrico || false,
        incendio: e.riesgo_incendio || false,
        colapso: e.riesgo_colapso || false,
      },
      servicios: {
        electricidad: e.electricidad || 'no_confirmado',
        agua: e.agua || 'no_confirmado',
        gas: e.gas || 'no_confirmado',
      },
      ubicacion: {
        direccion: e.direccion || null,
        ciudad: e.ciudad || null,
        estado_region: e.estado_region || null,
        lat: e.lat || null,
        lng: e.lng || null,
      },
      nivel_verificacion: e.nivel_verificacion || 'sin_verificar',
      actualizado: e.updated_date || e.created_date,
      url: `https://statusvzla.com/edificio?id=${e.id}`,
    });

    const mapRefugio = (r, i) => ({
      numero: i + 1,
      id: r.id,
      tipo: 'refugio',
      nombre: r.nombre_lugar,
      tipo_lugar: r.tipo_lugar,
      estado_operativo: r.estado_operativo || 'no_verificado',
      servicios: r.servicios_disponibles || [],
      necesidades: r.necesidades_urgentes || [],
      capacidad: r.capacidad_maxima || null,
      personas_actuales: r.personas_actuales || null,
      horario: r.opera_24h ? '24h' : `${r.horario_apertura || '?'} - ${r.horario_cierre || '?'}`,
      contacto: {
        whatsapp: r.whatsapp || null,
        telefono: r.telefono_publico || null,
      },
      ubicacion: {
        direccion: r.direccion || null,
        ciudad: r.ciudad || null,
        estado_region: r.estado_region || null,
        lat: r.lat || null,
        lng: r.lng || null,
      },
      nivel_verificacion: r.nivel_verificacion || 'no_verificado',
      actualizado: r.updated_date || r.created_date,
      url: `https://statusvzla.com/centros-apoyo?id=${r.id}`,
    });

    const edificiosMapeados = edificios.map(mapEdificio);
    const refugiosMapeados  = refugios.map(mapRefugio);

    const metaBase = {
      fuente: 'StatusVzla.com',
      powered_by: 'StatusVzla.com — Plataforma ciudadana de respuesta a emergencias',
      api_url: 'https://statusvzla.com/functions/apiMapa',
      generado: memCache.generado,
      cache_ttl_minutos: 60,
      docs: '?format=list · ?format=geojson · ?ciudad=Caracas · ?nivel=grave · ?tipo=hospital',
    };

    // ── FORMAT: list ─────────────────────────────────────────────────────
    if (format === 'list') {
      return new Response(JSON.stringify({
        ok: true,
        metadata: { ...metaBase, total: edificiosMapeados.length },
        edificios: edificiosMapeados,
      }), { status: 200, headers: corsHeaders });
    }

    // ── FORMAT: geojson ──────────────────────────────────────────────────
    if (format === 'geojson') {
      const features = [
        ...edificiosMapeados
          .filter(e => e.ubicacion.lat && e.ubicacion.lng)
          .map(e => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [e.ubicacion.lng, e.ubicacion.lat] },
            properties: { ...e, ubicacion: undefined },
          })),
        ...refugiosMapeados
          .filter(r => r.ubicacion.lat && r.ubicacion.lng)
          .map(r => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [r.ubicacion.lng, r.ubicacion.lat] },
            properties: { ...r, ubicacion: undefined },
          })),
      ];
      return new Response(JSON.stringify({
        type: 'FeatureCollection',
        features,
        metadata: { ...metaBase, total: features.length },
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/geo+json; charset=utf-8' } });
    }

    // ── FORMAT: json (default) ───────────────────────────────────────────
    return new Response(JSON.stringify({
      ok: true,
      metadata: {
        ...metaBase,
        total_edificios: edificiosMapeados.length,
        total_refugios: refugiosMapeados.length,
      },
      edificios: edificiosMapeados,
      refugios: refugiosMapeados,
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }
});