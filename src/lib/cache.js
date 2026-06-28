// Caché local para contadores — TTL configurable por llamada
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos por defecto

export function getCached(key) {
  try {
    const raw = localStorage.getItem(`cris_cache_${key}`);
    if (!raw) return null;
    const { value, ts, ttl } = JSON.parse(raw);
    const useTtl = ttl || DEFAULT_TTL_MS;
    if (Date.now() - ts > useTtl) return null;
    return value;
  } catch {
    return null;
  }
}

export function setCached(key, value, ttlMs) {
  try {
    localStorage.setItem(`cris_cache_${key}`, JSON.stringify({
      value,
      ts: Date.now(),
      ttl: ttlMs || DEFAULT_TTL_MS,
    }));
  } catch {}
}

export function getNextRefreshIn(key) {
  try {
    const raw = localStorage.getItem(`cris_cache_${key}`);
    if (!raw) return null;
    const { ts, ttl } = JSON.parse(raw);
    const useTtl = ttl || DEFAULT_TTL_MS;
    const remaining = useTtl - (Date.now() - ts);
    if (remaining <= 0) return null;
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  } catch {
    return null;
  }
}