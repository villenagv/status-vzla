import { useState } from 'react';
import { Loader2, MapPin, CheckCircle2, ShieldAlert, ChevronRight, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { comprimirFoto, dataURLaFile } from '@/lib/comprimirFoto';
import { GRUPOS_FOTOS, SENALES_PELIGRO, MAX_FOTOS_TOTAL } from './guiaFotos';
import GrupoFotos from './GrupoFotos';

const TIPO_OPTS = [
  { val: 'edificio_residencial', es: 'Edificio / Apt', en: 'Building / Apt' },
  { val: 'hospital',  es: 'Hospital',  en: 'Hospital' },
  { val: 'escuela',   es: 'Escuela',   en: 'School' },
  { val: 'comercio',  es: 'Comercio',  en: 'Business' },
  { val: 'otro',      es: 'Otro',      en: 'Other' },
];

// Estilo común: letras negras sobre fondo blanco
const INPUT = 'w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

const TOTAL_PASOS = 5; // 4 grupos de fotos + 1 de contacto/envío

/**
 * Formulario público por pasos para PEDIR una inspección de daños.
 * Acepta `prefill` con los datos del edificio para precargar todo lo posible.
 * Al enviar crea un ReportesDano (la automatización dispara la notificación + asignación).
 */
export default function SolicitarInspeccion({ es, prefill = {}, onListo }) {
  const [paso, setPaso] = useState(0);
  const [form, setForm] = useState({
    tipo_estructura: prefill.tipo_estructura || 'edificio_residencial',
    nombre_lugar: prefill.nombre_lugar || '',
    direccion: prefill.direccion || '',
    ciudad: prefill.ciudad || '',
    estado_region: prefill.estado_region || '',
    descripcion: prefill.descripcion || '',
    personas_atrapadas: prefill.personas_atrapadas || 'no_sabe',
    reportante_nombre: '',
    reportante_telefono: '',
    reportante_email: '',
  });
  // fotos por grupo: { fachada: [{url, subiendo}], estructural: [...], ... }
  const [fotosPorGrupo, setFotosPorGrupo] = useState(
    GRUPOS_FOTOS.reduce((acc, g) => ({ ...acc, [g.key]: [] }), {})
  );
  const [subiendoGrupo, setSubiendoGrupo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const totalFotos = Object.values(fotosPorGrupo).reduce((n, arr) => n + arr.length, 0);

  const agregarFotos = async (grupoKey, files) => {
    const espacio = MAX_FOTOS_TOTAL - totalFotos;
    const archivos = files.slice(0, Math.max(0, espacio));
    if (!archivos.length) return;
    setSubiendoGrupo(grupoKey);
    for (const file of archivos) {
      try {
        const dataURL = await comprimirFoto(file, 1280, 0.7);
        const comprimido = dataURLaFile(dataURL, `inspeccion_${Date.now()}.jpg`);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: comprimido });
        if (file_url) setFotosPorGrupo(prev => ({ ...prev, [grupoKey]: [...prev[grupoKey], { url: file_url }] }));
      } catch {}
    }
    setSubiendoGrupo(null);
  };

  const quitarFoto = (grupoKey, index) => {
    setFotosPorGrupo(prev => ({ ...prev, [grupoKey]: prev[grupoKey].filter((_, i) => i !== index) }));
  };

  // Aplanar todas las URLs (fachada primero para que sea la foto de portada)
  const todasLasUrls = () => GRUPOS_FOTOS.flatMap(g => fotosPorGrupo[g.key].map(f => f.url));

  const puedeEnviar = form.ciudad.trim() && (form.reportante_email.trim() || form.reportante_telefono.trim());

  const enviar = async () => {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(false);
    try {
      await base44.entities.ReportesDano.create({
        tipo_estructura: form.tipo_estructura,
        nombre_lugar: form.nombre_lugar.trim(),
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        estado_region: form.estado_region.trim() || form.ciudad.trim(),
        descripcion: form.descripcion.trim(),
        personas_atrapadas: form.personas_atrapadas,
        foto_urls: todasLasUrls().slice(0, MAX_FOTOS_TOTAL),
        reportante_nombre: form.reportante_nombre.trim(),
        reportante_telefono: form.reportante_telefono.trim(),
        reportante_email: form.reportante_email.trim(),
        ...(prefill.lat != null ? { lat: prefill.lat, lng: prefill.lng } : {}),
        triage_estado: 'pendiente_triage',
        requiere_inspeccion_presencial: true,
        estado_verificacion: 'recibido',
        nivel_verificacion: 'sin_verificar',
        fuente: 'solicitud_inspeccion',
      });
      setExito(true);
      onListo?.();
    } catch {
      setError(true);
    }
    setEnviando(false);
  };

  // ── PANTALLA DE CONFIRMACIÓN ──
  if (exito) {
    return (
      <div className="bg-white border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={30} className="text-green-600" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          {es ? 'Recibimos tu solicitud ✅' : 'We received your request ✅'}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          {es
            ? 'Tu información está guardada de forma segura. Nuestro equipo técnico analizará las imágenes y datos enviados.'
            : 'Your information is securely stored. Our technical team will analyze the submitted images and data.'}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-left space-y-1.5 mb-4">
          <p className="text-xs text-blue-800 leading-relaxed">
            📩 {es ? 'Te enviamos un correo de confirmación.' : 'We sent you a confirmation email.'}
          </p>
          <p className="text-xs text-blue-800 leading-relaxed">
            🤝 {es
              ? 'Asignamos tu caso a un voluntario del equipo, que te contactará lo antes posible para coordinar los próximos pasos o una visita presencial.'
              : 'We assigned your case to a volunteer who will contact you as soon as possible to coordinate next steps or an on-site visit.'}
          </p>
        </div>
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-left">
          <ShieldAlert size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {es
              ? 'No entres a estructuras dañadas. Si hay grietas graves, olor a gas, cables caídos o personas atrapadas, espera a Protección Civil (171), Bomberos o rescatistas autorizados.'
              : 'Do not enter damaged structures. If there are major cracks, gas smell, fallen wires, or trapped people, wait for Civil Protection (171), firefighters, or authorized rescue teams.'}
          </p>
        </div>
      </div>
    );
  }

  const fachadaLista = fotosPorGrupo.fachada.length > 0;

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
            {es ? `Paso ${paso + 1} de ${TOTAL_PASOS}` : `Step ${paso + 1} of ${TOTAL_PASOS}`}
          </p>
          <p className="text-[11px] text-gray-500">{totalFotos}/{MAX_FOTOS_TOTAL} {es ? 'fotos' : 'photos'}</p>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((paso + 1) / TOTAL_PASOS) * 100}%` }} />
        </div>
      </div>

      {/* ── PASO 0: Datos del lugar + guía de seguridad ── */}
      {paso === 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm font-bold text-blue-900 mb-1">📸 {es ? 'Pedir inspección de daños' : 'Request a damage inspection'}</p>
            <p className="text-xs text-blue-800 leading-relaxed">
              {es
                ? 'Te guiaremos paso a paso para tomar las fotos correctas. Cuéntanos primero dónde está la estructura.'
                : 'We will guide you step by step to take the right photos. First, tell us where the structure is.'}
            </p>
          </div>

          {/* Señales de peligro */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-bold text-red-800 mb-1.5">🚨 {es ? 'Seguridad primero — NO entres si ves:' : 'Safety first — do NOT enter if you see:'}</p>
            <ul className="space-y-0.5">
              {(es ? SENALES_PELIGRO.es : SENALES_PELIGRO.en).map((s, i) => (
                <li key={i} className="text-[11px] text-red-700 leading-relaxed flex gap-1.5"><span>•</span><span>{s}</span></li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            {/* Tipo */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{es ? 'Tipo de estructura' : 'Structure type'}</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {TIPO_OPTS.map(t => (
                  <button key={t.val} type="button" onClick={() => set('tipo_estructura', t.val)}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${form.tipo_estructura === t.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>
                    {es ? t.es : t.en}
                  </button>
                ))}
              </div>
            </div>

            <input value={form.nombre_lugar} onChange={e => set('nombre_lugar', e.target.value)}
              placeholder={es ? 'Nombre del lugar (ej: Residencias El Ávila)' : 'Place name (e.g. El Ávila Building)'} className={INPUT} />
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
              placeholder={es ? 'Dirección / referencia' : 'Address / reference'} className={INPUT} />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                placeholder={es ? 'Ciudad *' : 'City *'} className={INPUT} />
              <input value={form.estado_region} onChange={e => set('estado_region', e.target.value)}
                placeholder={es ? 'Estado / región' : 'State / region'} className={INPUT} />
            </div>

            {/* Personas atrapadas */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{es ? '¿Personas atrapadas?' : 'Trapped people?'}</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[
                  { v: 'no', es: 'No', en: 'No' },
                  { v: 'si', es: 'Sí', en: 'Yes' },
                  { v: 'voces', es: 'Se oyen voces', en: 'Voices heard' },
                  { v: 'no_sabe', es: 'No sé', en: 'Unknown' },
                ].map(o => (
                  <button key={o.v} type="button" onClick={() => set('personas_atrapadas', o.v)}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${form.personas_atrapadas === o.v ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                    {es ? o.es : o.en}
                  </button>
                ))}
              </div>
            </div>

            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              placeholder={es ? 'Notas (grietas, daños visibles, gas, etc.)' : 'Notes (cracks, visible damage, gas, etc.)'}
              className={INPUT + ' resize-none'} />
          </div>
        </div>
      )}

      {/* ── PASOS 1–4: Grupos de fotos ── */}
      {paso >= 1 && paso <= GRUPOS_FOTOS.length && (() => {
        const grupo = GRUPOS_FOTOS[paso - 1];
        return (
          <GrupoFotos
            grupo={grupo}
            es={es}
            fotos={fotosPorGrupo[grupo.key]}
            subiendo={subiendoGrupo === grupo.key}
            onAgregar={(files) => agregarFotos(grupo.key, files)}
            onQuitar={(i) => quitarFoto(grupo.key, i)}
            disabled={totalFotos >= MAX_FOTOS_TOTAL}
          />
        );
      })()}

      {/* ── ÚLTIMO PASO: Contacto + envío ── */}
      {paso === TOTAL_PASOS - 1 && (
        <div className="bg-white border border-blue-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-blue-900">🔒 {es ? 'Tus datos de contacto (privados)' : 'Your contact info (private)'}</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            {es ? 'Te contactaremos por aquí para coordinar la inspección. No se muestran públicamente.' : 'We will reach you here to coordinate the inspection. Never shown publicly.'}
          </p>
          <input value={form.reportante_nombre} onChange={e => set('reportante_nombre', e.target.value)}
            placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'} className={INPUT} />
          <input value={form.reportante_telefono} onChange={e => set('reportante_telefono', e.target.value)}
            placeholder={es ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'} className={INPUT} />
          <input value={form.reportante_email} onChange={e => set('reportante_email', e.target.value)} type="email"
            placeholder={es ? 'Email *' : 'Email *'} className={INPUT} />

          {error && (
            <p className="text-xs text-red-600 text-center pt-1">{es ? 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.' : 'Could not send. Check your connection and try again.'}</p>
          )}
        </div>
      )}

      {/* ── NAVEGACIÓN ── */}
      <div className="flex gap-2">
        {paso > 0 && (
          <button type="button" onClick={() => setPaso(p => p - 1)}
            className="flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 text-sm font-semibold py-3 px-4 rounded-xl cursor-pointer hover:bg-gray-50">
            <ChevronLeft size={15} /> {es ? 'Atrás' : 'Back'}
          </button>
        )}

        {paso < TOTAL_PASOS - 1 ? (
          <button type="button"
            onClick={() => {
              if (paso === 0 && !form.ciudad.trim()) return;
              setPaso(p => p + 1);
            }}
            disabled={paso === 0 && !form.ciudad.trim()}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer">
            {paso === 0 ? (es ? 'Continuar' : 'Continue') : (es ? 'Siguiente paso' : 'Next step')} <ChevronRight size={15} />
          </button>
        ) : (
          <button type="button" onClick={enviar} disabled={!puedeEnviar || enviando || subiendoGrupo}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer">
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
            {es ? 'Enviar solicitud' : 'Send request'}
          </button>
        )}
      </div>

      {/* Aviso de validación en paso 0 */}
      {paso === 0 && !form.ciudad.trim() && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">{es ? 'Escribe al menos la ciudad para continuar.' : 'Enter at least the city to continue.'}</p>
      )}
      {/* Aviso obligatoria fachada */}
      {paso === 1 && !fachadaLista && (
        <p className="text-[11px] text-amber-600 text-center -mt-2">{es ? 'La foto de fachada ayuda mucho al inspector, pero puedes continuar si no la tienes.' : 'The façade photo helps the inspector a lot, but you can continue without it.'}</p>
      )}
      {/* Aviso de validación en último paso */}
      {paso === TOTAL_PASOS - 1 && !puedeEnviar && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">{es ? 'Completa la ciudad y un dato de contacto (email o teléfono).' : 'Fill in the city and one contact (email or phone).'}</p>
      )}

      {subiendoGrupo && (
        <p className="text-[11px] text-gray-500 text-center">📷 {es ? 'Comprimiendo y subiendo fotos...' : 'Compressing and uploading photos...'}</p>
      )}
    </div>
  );
}