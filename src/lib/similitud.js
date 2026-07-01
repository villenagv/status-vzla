// Utilidades compartidas de búsqueda y detección de duplicados (edificios y personas).
// Centraliza la normalización de texto para que todas las barras de búsqueda
// y validaciones de duplicados de la plataforma se comporten igual.

const ABREVIACIONES = {
  'av': 'avenida', 'ave': 'avenida', 'avda': 'avenida', 'cll': 'calle', 'cl': 'calle',
  'urb': 'urbanizacion', 'edif': 'edificio', 'res': 'residencias', 'cc': 'centro comercial',
};

export function normalizarTexto(str) {
  let s = (str || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  s = s.split(' ').map(w => ABREVIACIONES[w] || w).join(' ');
  return s;
}

// Similitud 0-1 entre dos textos (nombres, direcciones, descripciones).
export function similitudTexto(a, b) {
  const na = normalizarTexto(a), nb = normalizarTexto(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wA = na.split(' '), wB = nb.split(' ');
  const matches = wA.filter(w => w.length > 2 && wB.some(wb => wb.startsWith(w) || w.startsWith(wb)));
  return matches.length / Math.max(wA.length, wB.length);
}

// true si ambas ciudades parecen ser la misma (o si falta el dato en alguna, no descarta).
export function esMismaCiudad(a, b) {
  const na = normalizarTexto(a), nb = normalizarTexto(b);
  if (!na || !nb) return true;
  return na === nb || na.includes(nb) || nb.includes(na);
}