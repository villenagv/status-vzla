import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Caché en memoria del proceso (dura mientras el worker esté vivo) ──
// No usa ningún crédito de integración — es RAM pura del servidor
let cache = null;
let cacheTs = 0;
const CACHE_TTL = 90 * 60 * 1000; // 90 minutos en ms

Deno.serve(async (req) => {
  // CORS — permite que sitios externos consuman la API
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=5400', // 90 min para CDNs/proxies externos
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ciudad = url.searchParams.get('ciudad') || null;
    const nivel  = url.searchParams.get('nivel')  || null;  // leve|moderado|grave|critico|colapsado
    const tipo   = url.searchParams.get('tipo')   || null;  // edificio_residencial|hospital|etc
    const format = url.searchParams.get('format') || 'json'; // json | geojson

    // ── Servir desde caché si no expiró ──────────────────────────────────
    const ahora = Date.now();
    if (!cache || (ahora - cacheTs) > CACHE_TTL) {
      // Solo aquí se consume 1 llamada a la BD — luego se sirve desde RAM
      const base44 = createClientFromRequest(req);
      const [edificios, refugios] = await Promise.all([
        base44.asServiceRole.entities.ReportesDano.list('-updated_date', 3000),
        base44.asServiceRole.entities.PuntosAyuda.list('-updated_date', 1000),
      ]);

      cache = { edificios, refugios, generado: new Date().toISOString() };
      cacheTs = ahora;
    }

    // ── Filtrar en memoria (costo 0 créditos) ────────────────────────────
    let edificios = cache.edificios;
    let refugios  = cache.refugios;

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

    // ── Mapear solo campos públicos necesarios (sin datos privados) ──────
    const mapEdificio = (e) => ({
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

    const mapRefugio = (r) => ({
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

    // ── Formato GeoJSON (compatible con Leaflet, Mapbox, QGIS) ──────────
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
      const geojson = {
        type: 'FeatureCollection',
        features,
        metadata: {
          fuente: 'StatusVzla.com',
          powered_by: 'StatusVzla.com — Plataforma ciudadana de respuesta a emergencias',
          api_url: 'https://statusvzla.com/functions/apiMapa',
          generado: cache.generado,
          total: features.length,
          cache_ttl_minutos: 90,
        },
      };
      return new Response(JSON.stringify(geojson), { headers: { ...corsHeaders, 'Content-Type': 'application/geo+json; charset=utf-8' } });
    }

    // ── Formato JSON estándar ─────────────────────────────────────────────
    const respuesta = {
      ok: true,
      metadata: {
        fuente: 'StatusVzla.com',
        powered_by: 'StatusVzla.com — Plataforma ciudadana de respuesta a emergencias',
        api_url: 'https://statusvzla.com/functions/apiMapa',
        docs: 'Agrega ?format=geojson para GeoJSON · ?ciudad=Caracas · ?nivel=grave · ?tipo=hospital',
        generado: cache.generado,
        cache_ttl_minutos: 90,
        total_edificios: edificiosMapeados.length,
        total_refugios: refugiosMapeados.length,
      },
      edificios: edificiosMapeados,
      refugios: refugiosMapeados,
    };

    return new Response(JSON.stringify(respuesta), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }
});