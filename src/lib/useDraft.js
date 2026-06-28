/**
 * useDraft — persiste un borrador de formulario en localStorage
 * Uso: const [draft, setDraft, clearDraft] = useDraft('key', initialValue)
 * - draft: valor actual (desde localStorage o initialValue)
 * - setDraft(updates): merge parcial, persiste automáticamente
 * - clearDraft(): limpia el borrador
 */
import { useState, useCallback } from 'react';

export function useDraft(key, initialValue = {}) {
  const storageKey = `svzla_draft_${key}`;

  const [draft, setDraftState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Solo restaurar si tiene datos (no vacío)
        if (parsed && Object.keys(parsed).some(k => parsed[k] !== '' && parsed[k] !== false && parsed[k] !== null)) {
          return { ...initialValue, ...parsed };
        }
      }
    } catch {}
    return initialValue;
  });

  const hasDraft = (() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return parsed && Object.keys(parsed).some(k => parsed[k] !== '' && parsed[k] !== false && parsed[k] !== null && parsed[k] !== undefined);
    } catch { return false; }
  })();

  const setDraft = useCallback((updates) => {
    setDraftState(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    setDraftState(initialValue);
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey, initialValue]);

  return [draft, setDraft, clearDraft, hasDraft];
}