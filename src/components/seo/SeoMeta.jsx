import { useEffect } from 'react';

/**
 * SeoMeta — Componente invisible que actualiza dinámicamente
 * el <title>, meta description y Open Graph de la página actual.
 * No renderiza nada visible. Solo modifica el <head>.
 */
export default function SeoMeta({ title, description, image, url, type = 'website', lang = 'es' }) {
  useEffect(() => {
    const BASE = 'Status Vzla';
    const fullTitle = title ? `${title} | ${BASE}` : `${BASE} — Emergencias Venezuela`;
    const fullDesc = description || 'Sistema ciudadano de respuesta a emergencias. Reporta daños, busca refugios y coordina ayuda humanitaria en Venezuela.';
    const fullImage = image || 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/3ad9cd0f9_e9380ac80_9BE17DB6-81D0-4B20-8D4A-A9567B0D81A2.jpg';
    const fullUrl = url || window.location.href;

    // Title
    document.title = fullTitle;

    // html lang
    document.documentElement.lang = lang;

    // Helper to set/create meta
    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = selector.match(/\[(.+?)="(.+?)"\]/)?.slice(1) || [];
        if (attrName) el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]',        'content', fullDesc);
    setMeta('meta[property="og:title"]',        'content', fullTitle);
    setMeta('meta[property="og:description"]',  'content', fullDesc);
    setMeta('meta[property="og:image"]',        'content', fullImage);
    setMeta('meta[property="og:url"]',          'content', fullUrl);
    setMeta('meta[property="og:type"]',         'content', type);
    setMeta('meta[property="og:locale"]',       'content', lang === 'en' ? 'en_US' : lang === 'pt' ? 'pt_BR' : 'es_VE');
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', fullDesc);
    setMeta('meta[name="twitter:image"]',       'content', fullImage);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);
  }, [title, description, image, url, type, lang]);

  return null;
}