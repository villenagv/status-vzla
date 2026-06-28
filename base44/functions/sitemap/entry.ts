import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE_URL = 'https://statusvzla.com';

function xmlEscape(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function urlEntry(loc, lastmod, priority = '0.7', changefreq = 'daily') {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async (req) => {
  try {
    // Permitir acceso sin auth para que los bots de Google puedan acceder
    const base44 = createClientFromRequest(req);

    // Páginas estáticas de alta prioridad
    const staticPages = [
      { path: '/',                priority: '1.0', freq: 'daily'   },
      { path: '/consultar',       priority: '0.9', freq: 'daily'   },
      { path: '/edificios',       priority: '0.9', freq: 'hourly'  },
      { path: '/personas',        priority: '0.9', freq: 'hourly'  },
      { path: '/directorio',      priority: '0.8', freq: 'hourly'  },
      { path: '/centros-apoyo',   priority: '0.8', freq: 'daily'   },
      { path: '/mapa-danos',      priority: '0.8', freq: 'daily'   },
      { path: '/aliados',         priority: '0.7', freq: 'weekly'  },
      { path: '/guia-edificios',  priority: '0.6', freq: 'weekly'  },
      { path: '/guia-plataforma', priority: '0.6', freq: 'weekly'  },
      { path: '/sobre',           priority: '0.5', freq: 'monthly' },
      { path: '/contactanos',     priority: '0.5', freq: 'monthly' },
      { path: '/voluntario',      priority: '0.6', freq: 'weekly'  },
      { path: '/reportar-dano',   priority: '0.7', freq: 'daily'   },
      { path: '/buscar-persona',  priority: '0.7', freq: 'daily'   },
      { path: '/estoy-aqui',      priority: '0.7', freq: 'daily'   },
    ];

    // Cargar entidades dinámicas en paralelo
    const [edificios, personas, centros] = await Promise.all([
      base44.asServiceRole.entities.ReportesDano.list('-updated_date', 500).catch(() => []),
      base44.asServiceRole.entities.PersonasBuscadas.list('-updated_date', 500).catch(() => []),
      base44.asServiceRole.entities.PuntosAyuda.list('-updated_date', 200).catch(() => []),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const entries = [];

    // Páginas estáticas
    for (const page of staticPages) {
      entries.push(urlEntry(`${BASE_URL}${page.path}`, today, page.priority, page.freq));
    }

    // Páginas de edificios dinámicas
    for (const e of edificios) {
      const lastmod = (e.updated_date || e.created_date || '').split('T')[0] || today;
      const isCritical = ['critico', 'colapsado', 'grave'].includes(e.nivel_dano);
      entries.push(urlEntry(
        `${BASE_URL}/edificio?id=${e.id}`,
        lastmod,
        isCritical ? '0.9' : '0.7',
        isCritical ? 'hourly' : 'daily'
      ));
    }

    // Páginas de personas dinámicas
    for (const p of personas) {
      const lastmod = (p.updated_date || p.created_date || '').split('T')[0] || today;
      const isActive = ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(p.estado_caso);
      entries.push(urlEntry(
        `${BASE_URL}/persona?id=${p.id}`,
        lastmod,
        isActive ? '0.9' : '0.6',
        isActive ? 'hourly' : 'daily'
      ));
    }

    // Centros de ayuda
    for (const c of centros) {
      const lastmod = (c.updated_date || c.created_date || '').split('T')[0] || today;
      entries.push(urlEntry(`${BASE_URL}/centros-apoyo`, lastmod, '0.8', 'daily'));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'noindex', // El sitemap en sí no necesita indexarse
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});