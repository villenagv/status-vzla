// Cache de 6 horas para contadores — sin llamadas a API hasta que expire
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

export function getCached(key) {
  try {
    const raw = localStorage.getItem(`cris_cache_${key}`);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return value;
  } catch {
    return null;
  }
}

export function setCached(key, value) {
  try {
    localStorage.setItem(`cris_cache_${key}`, JSON.stringify({ value, ts: Date.now() }));
  } catch {}
}

export function getNextRefreshIn(key) {
  try {
    const raw = localStorage.getItem(`cris_cache_${key}`);
    if (!raw) return null;
    const { ts } = JSON.parse(raw);
    const remaining = CACHE_TTL_MS - (Date.now() - ts);
    if (remaining <= 0) return null;
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return `${h}h ${m}m`;
  } catch {
    return null;
  }
}