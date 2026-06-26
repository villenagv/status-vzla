import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, ArrowRight, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import StepEstado from '@/components/svzla/step/StepEstado';
import StepPeligro from '@/components/svzla/step/StepPeligro';
import StepNecesidad from '@/components/svzla/step/StepNecesidad';
import StepFamilia from '@/components/svzla/step/StepFamilia';
import StepCentro from '@/components/svzla/step/StepCentro';
import StepPrivacidad from '@/components/svzla/step/StepPrivacidad';
import useZonaForm from '@/components/svzla/useZonaForm';
import PostReporte from '@/components/svzla/PostReporte';
import NudgeBar from '@/components/svzla/NudgeBar';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import { generarcodigo, guardarcodigo } from '@/lib/codigos';

const TOTAL_STEPS = 7;

const STEP_TITLES = {
  0: { es: '¿Cómo estás ahora?', en: 'How are you now?' },
  1: { es: '¿Estás en un lugar seguro?', en: 'Are you in a safe place?' },
  2: { es: '¿Qué necesitas ahora?', en: 'What do you need now?' },
  3: { es: '¿A quién avisar o buscar?', en: 'Who to alert or look for?' },
  4: { es: '¿Estás en un centro de apoyo?', en: 'Are you in a support center?' },
  5: { es: 'Privacidad y comunicación', en: 'Privacy & communication' },
  6: { es: 'Revisión y envío', en: 'Review and submit' },
};

export default function ZonaAfectada() {
  const { lang } = useLang();
  const es = lang === 'es';
  const { lowBw } = useLowBw();
  const { form, setForm, currentStep, nextStep, prevStep, persisted, clearForm } = useZonaForm(TOTAL_STEPS);
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(null);
  const [error, setError] = useState(false);
  const [subModo, setSubModo] = useState('');
  const formRef = useRef(null);

  const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleArr = (k, val) => setForm(prev => ({
    ...prev, [k]: prev[k]?.includes(val) ? prev[k].filter(x => x !== val) : [...(prev[k] || []), val]
  }));

  const handleSubmit = async () => {
    setEnviando(true);
    setError(false);
    try {
      const isCritico = ['herido_atencion', 'atrapado', 'no_puedo_caminar', 'inconsciente'].includes(form.estado_fisico);
      const persona = await base44.entities.PersonaCRIS.create({
        nombre: form.nombre,
        ciudad: form.ciudad || form.ubicacion,
        estado_region: form.estado,
        ubicacion_texto: form.ubicacion || form.ubicacion_antes,
        ultima_ubicacion_conocida: form.ubicacion_antes,
        estado_actual: isCritico ? 'atencion_urgente' : (form.estado_fisico === 'a_salvo' ? 'a_salvo' : 'estoy_aqui'),
        nivel_verificacion: 'sin_verificar',
        fuente_inicial: 'ciudadano',
        condiciones_medicas: form.condiciones_medicas?.length ? form.condiciones_medicas.join(', ') : '',
        condicion_especial: form.medicamento_urgente || '',
        es_menor: form.con_ninos === 'si',
        avisar_nombre: form.avisar_nombre || '',
        avisar_email: form.avisar_email || '',
        avisar_telefono: form.avisar_telefono || '',
        avisar_mensaje: form.avisar_mensaje || form.mensaje_rápido || '',
        avisar_relacion: form.avisar_relacion || '',
        notas_publicas: [
          `${form.estado_fisico || ''}${form.lugar_seguro ? ' — ' + form.lugar_seguro : ''}`,
          form.necesidades?.length ? `Necesita: ${form.necesidades.join(', ')}.` : '',
          form.centro_nombre ? `En ${form.centro_nombre}.` : '',
          form.mensaje_rápido || '',
        ].filter(Boolean).join(' ').trim(),
      });
      await base44.entities.EventoHistorial.create({
        persona_id: persona.id,
        tipo_evento: 'reportado',
        descripcion: `Estado: ${form.estado_fisico}. Peligro: ${form.lugar_seguro}. Necesidades: ${(form.necesidades || []).join(', ')}.`,
        ubicacion_texto: form.ubicacion || form.ubicacion_antes,
        fuente: 'ciudadano',
        nivel_confianza: 'medio',
        es_sensible: form.medicamento_urgente ? true : false,
      });
      const codigo = generarcodigo(persona.id);
      setOk({ id: persona.id, codigo, nombre: persona.nombre });
      guardarcodigo(persona.id, codigo);

      // Enviar email al contacto que eligió avisar
      if (form.avisar_email?.trim()) {
        try {
          await base44.functions.invoke('enviarAvisoFamiliar', {
            email_destino: form.avisar_email.trim(),
            nombre_reportante: form.avisar_nombre || form.nombre || '',
            relacion: form.avisar_relacion || '',
            mensaje: form.avisar_mensaje || form.mensaje_rápido || '',
            codigo_cris: codigo,
            persona_id: persona.id,
            nombre_persona: form.nombre || '',
            lang: lang,
          });
        } catch {
          // email falla silenciosamente — el reporte ya se guardó
        }
      }
      clearForm();
    } catch {
      setError(true);
    }
    setEnviando(false);
  };

  if (ok) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <PostReporte reporte={ok} es={es} lowBw={lowBw} />
    </div>
  );

  const canSubmit = currentStep === TOTAL_STEPS - 1 || (form.estado_fisico && form.ubicacion);
  const esCritico = ['herido_atencion', 'atrapado', 'no_puedo_caminar', 'inconsciente'].includes(form.estado_fisico) || form.lugar_seguro === 'no';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-900 mb-3">
          <ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}
        </Link>

        <h1 className="text-xl font-black text-gray-900 mb-2">
          🆘 {es ? 'Estoy en zona afectada' : 'I am in the affected area'}
        </h1>

        {/* Persistencia */}
        {persisted && currentStep > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 mb-3 flex items-center gap-2">
            💾 {es ? 'Tu información se guarda automáticamente. Si se pierde la señal, podrás continuar.' : 'Your info saves automatically. If the signal drops, you can continue.'}
          </div>
        )}

        {/* Sub-menú inicial */}
        {currentStep === 0 && !form.estado_fisico && (
          <div className="space-y-2 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            ⚡ {es ? 'Responde solo lo que puedas. Ningún dato es obligatorio.' : 'Answer only what you can. No field is required.'}
          </div>
        )}

        {/* Advertencia crítica */}
        {esCritico && (
          <div className="flex gap-3 bg-red-50 border-2 border-red-300 rounded-xl p-3 mb-4">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700 leading-relaxed">
              {es
                ? '⚠️ Si tu vida corre peligro, busca ayuda inmediata con Protección Civil (171) o Bomberos. Completa esto solo si puedes hacerlo de forma segura.'
                : '⚠️ If your life is in danger, seek immediate help from Civil Protection (171) or Firefighters. Complete this only if you can do so safely.'}
            </p>
          </div>
        )}

        {/* Nudges de seguridad */}
        <NudgeBar es={es} estadoFisico={form.estado_fisico} lugarSeguro={form.lugar_seguro} bateria={form.bateria_senal} />

        {/* Formulario progresivo */}
        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); currentStep < TOTAL_STEPS - 1 ? nextStep() : handleSubmit(); }} className="space-y-4">
          <ProgressBar step={currentStep} total={TOTAL_STEPS} es={es} />

          {/* Paso 0: Estado físico + urgencia */}
          {currentStep === 0 && <StepEstado form={form} setForm={setForm} setVal={setVal} es={es} />}

          {/* Paso 1: Peligro alrededor */}
          {currentStep === 1 && <StepPeligro form={form} setVal={setVal} es={es} />}

          {/* Paso 2: Necesidades */}
          {currentStep === 2 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <StepNecesidad form={form} setVal={setVal} es={es} />
                  <p className="text-xs text-gray-400 mt-2">{es ? 'Información adicional' : 'Additional info'}</p>
              <input value={form.acompanado || ''} onChange={e => setVal('acompanado', e.target.value)}
                placeholder={es ? 'Ej: con 2 vecinos heridos' : 'E.g: with 2 injured neighbors'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900 mt-1" />
            </div>
          )}

          {/* Paso 3: Familia - busca + avisar */}
          {currentStep === 3 && <StepFamilia form={form} setVal={setVal} es={es} />}

          {/* Paso 4: Centro de apoyo */}
          {currentStep === 4 && <StepCentro form={form} setVal={setVal} es={es} />}

          {/* Paso 5: Privacidad y batería */}
          {currentStep === 5 && <StepPrivacidad form={form} setVal={setVal} toggleArr={toggleArr} es={es} />}

          {/* Paso 6: Revisión */}
          {currentStep === 6 && <ReviewStep form={form} es={es} />}

          {/* Botones */}
          {currentStep < TOTAL_STEPS && (
            <div className={`flex gap-3 ${currentStep === 0 ? '' : ''}`}>
              {currentStep > 0 && (
                <button type="button" onClick={prevStep} className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">
                  ← {es ? 'Atrás' : 'Back'}
                </button>
              )}
              <button type="submit" disabled={enviando}
                className={`flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer ${esCritico ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
                {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
                {currentStep < TOTAL_STEPS - 1 ? (
                  <>{es ? 'Siguiente' : 'Next'} <ChevronRight size={16} /></>
                ) : (
                  <><Send size={16} /> {es ? 'Enviar reporte' : 'Submit report'}</>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium flex items-center gap-2">
              ⚠️ {es ? 'No se pudo enviar. Verifica tu conexión e intenta de nuevo.' : 'Could not send. Check your connection and try again.'}
            </div>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}

function ProgressBar({ step, total, es }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 rounded-full transition-all duration-200" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <span className="text-xs text-gray-400 font-medium flex-shrink-0">{step + 1}/{total}</span>
    </div>
  );
}

function ReviewStep({ form, es }) {
  const items = [
    { label: { es: 'Estado físico', en: 'Physical state' }, val: form.estado_fisico },
    { label: { es: '¿Lugar seguro?', en: 'Safe place?' }, val: form.lugar_seguro },
    { label: { es: 'Necesidades', en: 'Needs' }, val: form.necesidades?.length ? form.necesidades.join(', ') : '-' },
    { label: { es: 'Ubicación', en: 'Location' }, val: form.ubicacion || '-' },
    { label: { es: 'Contacto a avisar', en: 'Contact to alert' }, val: form.avisar_nombre || '-' },
    { label: { es: 'Correo para aviso', en: 'Email for notice' }, val: form.avisar_email || '-' },
    { label: { es: 'Centro de apoyo', en: 'Support center' }, val: form.centro_nombre || '-' },
    { label: { es: 'Avisar a', en: 'Notify' }, val: form.avisar_nombre || '-' },
  ];
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-1">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{es ? 'Revisa antes de enviar' : 'Review before sending'}</h3>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
          <span className="text-xs text-gray-500">{es ? item.label.es : item.label.en}</span>
          <span className="text-xs font-medium text-gray-900">{item.val}</span>
        </div>
      ))}
    </div>
  );
}