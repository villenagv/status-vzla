/**
 * useInspeccionQueue — Caja de salida (Outbox) para inspecciones de edificios offline.
 *
 * Guarda inspecciones completas (datos + fotos como base64) en localStorage.
 * El usuario puede acumular varias inspecciones sin conexión y sincronizarlas
 * en lote cuando recupere señal.
 *
 * Cada item: { id, status, created_at, data: {...campos ReportesDano}, fotos: [base64...], error }
 *   status: 'pendiente' (listo para subir) | 'sincronizado' | 'error'
 */
import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'svzla_inspecciones_outbox';

function leer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function escribir(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function useInspeccionQueue() {
  const [items, setItems] = useState(leer);

  // Sincroniza estado entre pestañas
  useEffect(() => {
    const onStorage = (e) => { if (e.key === STORAGE_KEY) setItems(leer()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persistir = useCallback((next) => {
    escribir(next);
    setItems(next);
  }, []);

  // Agregar una inspección a la cola
  const agregar = useCallback((data, fotos = []) => {
    const item = {
      id: `insp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'pendiente',
      created_at: new Date().toISOString(),
      data,
      fotos,
      error: null,
    };
    const next = [item, ...leer()];
    escribir(next);
    setItems(next);
    return item.id;
  }, []);

  // Editar una inspección pendiente
  const editar = useCallback((id, data, fotos) => {
    const next = leer().map(it => it.id === id
      ? { ...it, data: { ...it.data, ...data }, ...(fotos !== undefined ? { fotos } : {}), status: 'pendiente', error: null }
      : it);
    persistir(next);
  }, [persistir]);

  // Eliminar de la cola
  const eliminar = useCallback((id) => {
    persistir(leer().filter(it => it.id !== id));
  }, [persistir]);

  // Marcar resultado de sincronización
  const marcar = useCallback((id, status, error = null) => {
    const next = leer().map(it => it.id === id ? { ...it, status, error } : it);
    persistir(next);
  }, [persistir]);

  // Limpiar todos los sincronizados
  const limpiarSincronizados = useCallback(() => {
    persistir(leer().filter(it => it.status !== 'sincronizado'));
  }, [persistir]);

  const pendientes = items.filter(i => i.status === 'pendiente' || i.status === 'error');

  return { items, pendientes, agregar, editar, eliminar, marcar, limpiarSincronizados };
}