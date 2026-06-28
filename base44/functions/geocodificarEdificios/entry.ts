import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeConNominatim(ciudad, estado, direccion) {
  const query = direccion
    ? `${direccion}, ${ciudad}, ${estado}, Venezuela`
    : `${ciudad}, ${estado}, Venezuela`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ve&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CRIS-Venezuela-Emergency/1.0 (cris@statusvzla.com)' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), fuente: 'nominatim' };
  }
  return null;
}

async function geocodeConIA(ciudad, estado, direccion) {
  const prompt = `Eres un experto en geografía venezolana. Dado el siguiente lugar en Venezuela, devuelve ÚNICAMENTE un JSON con las coordenadas geográficas aproximadas. No incluyas texto adicional, solo el JSON.

Lugar: ${direccion ? direccion + ', ' : ''}${ciudad}, ${estado}, Venezuela

Responde exactamente en este formato: {"lat": 10.1234, "lng": -66.5678}

Si no puedes determinarlo con certeza razonable, responde: {"lat": null, "lng": null}`;

  const result = await fetch('https://api.base44.com/v1/integrations/core/invoke-llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, response_json_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } } })
  });
  // Se llama vía SDK de base44, no directamente — esta ruta es fallback via InvokeLLM
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Solo administradores' }, { status: 403 });

    // Obtener parámetros opcionales
    const body = await req.json().catch(() => ({}));
    const limite = body.limite || 200; // procesar máximo N registros por llamada

    // Leer registros sin coordenadas
    let todos = [];
    let skip = 0;
    const pageSize = 50;
    while (true) {
      const page = await base44.asServiceRole.entities.ReportesDano.list('-created_date', pageSize, skip);
      if (!page || page.length === 0) break;
      const sinCoords = page.filter(r => !r.lat && !r.lng && r.ciudad);
      todos = todos.concat(sinCoords);
      if (page.length < pageSize || todos.length >= limite) break;
      skip += pageSize;
    }

    // Limitar al máximo configurado
    const aGeocod = todos.slice(0, limite);
    let ok = 0;
    let fail = 0;
    const errores = [];

    for (const r of aGeocod) {
      try {
        let coords = null;

        // Intento 1: Nominatim con dirección + ciudad
        coords = await geocodeConNominatim(r.ciudad, r.estado_region || '', r.direccion || '');
        await sleep(1100); // respetar límite de Nominatim

        // Intento 2: Nominatim solo con ciudad si falló
        if (!coords && r.ciudad) {
          coords = await geocodeConNominatim(r.ciudad, r.estado_region || '', '');
          await sleep(1100);
        }

        if (coords && coords.lat && coords.lng) {
          await base44.asServiceRole.entities.ReportesDano.update(r.id, {
            lat: coords.lat,
            lng: coords.lng,
            geo_fuente: coords.fuente
          });
          ok++;
        } else {
          fail++;
          errores.push({ id: r.id, ciudad: r.ciudad });
        }
      } catch (err) {
        fail++;
        errores.push({ id: r.id, ciudad: r.ciudad, error: err.message });
        await sleep(1100);
      }
    }

    return Response.json({
      procesados: aGeocod.length,
      exitosos: ok,
      fallidos: fail,
      errores: errores.slice(0, 10),
      mensaje: `Geocodificación completada: ${ok} de ${aGeocod.length} registros actualizados.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});