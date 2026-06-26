import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cris_zona_form';

export default function useZonaForm(stepCount) {
  const [form, setFormRaw] = useState({});
  const [currentStep, setCurrentStepRaw] = useState(0);
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormRaw(parsed.form || {});
        if (parsed.currentStep !== undefined && parsed.currentStep < stepCount) {
          setCurrentStepRaw(parsed.currentStep);
        }
        setPersisted(true);
      }
    } catch (e) { /* ignore */ }
  }, [stepCount]);

  const persist = useCallback((newForm, step) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form: newForm, currentStep: step }));
    } catch (e) { /* ignore */ }
  }, []);

  const setForm = useCallback((updater) => {
    setFormRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persist(next, currentStep);
      return next;
    });
  }, [currentStep, persist]);

  const setCurrentStep = useCallback((fn) => {
    setCurrentStepRaw(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      persist(form, next);
      return next;
    });
  }, [form, persist]);

  const nextStep = useCallback(() => setCurrentStep(s => Math.min(s + 1, stepCount - 1)), [stepCount]);
  const prevStep = useCallback(() => setCurrentStep(s => Math.max(s - 1, 0)), []);

  const clearForm = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    setFormRaw({});
    setCurrentStepRaw(0);
  }, []);

  return { form, setForm, currentStep, setCurrentStep, nextStep, prevStep, persisted, clearForm };
}