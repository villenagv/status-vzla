/**
 * useOffline — detecta si el usuario está sin conexión
 * Retorna: { offline, retrying, retry }
 */
import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const goOnline  = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const retry = useCallback(async (fn) => {
    if (!navigator.onLine) return false;
    setRetrying(true);
    try { await fn(); return true; }
    catch { return false; }
    finally { setRetrying(false); }
  }, []);

  return { offline, retrying, retry };
}