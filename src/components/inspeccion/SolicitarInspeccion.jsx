import { useState } from 'react';
import { Loader2, Camera, X, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TIPO_OPTS = [
  { val: 'edificio_residencial', es: 'Edificio / Apt', en: 'Building / Apt' },
  { val: 'hospital',  es: 'Hospital',  en: 'Hospital' },
  { val: 'escuela',   es: 'Escuela',   en: 'School' },
  { val: 'comercio',  es: 'Comercio',  en: 'Business' },
  { val: 'otro',      es: 'Otro',      en: 'Other' },
];

const MAX_FOTOS = 5;

/**
 * Formulario público para PEDIR una inspección de daños.
 * Acepta `prefill` con los datos del edificio para precargar todo lo posible.
 * Al enviar crea un ReportesDano (la automatización dispara la notificación + asignación).
 */
export default function SolicitarInspeccion({ es, prefill = {}, onListo }) {
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
  const [fotos, setFotos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const agregarFotos = async (e) => {
    const archivos = Array.from(e.target.files || []).slice(0, MAX_FOTOS - fotos.length);
    if (!archivos.length) return;
    setSubiendo(true);
    for (const file of archivos) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) setFotos(prev => [...prev, file_url]);
      } catch {}
    }
    setSubiendo(false);
    e.target.value = '';
  };

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
        foto_urls: fotos,
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-sm font-bold text-blue-900 mb-1">📸 {es ? 'Pedir inspección de daños' : 'Request a damage inspection'}</p>
        <p className="text-xs text-blue-800 leading-relaxed">
          {es
            ? 'Cuéntanos dónde está la estructura, toma fotos de los daños y déjanos cómo contactarte. Nuestro equipo técnico analizará tu reporte y te contactará lo antes posible para coordinar una visita.'
            : 'Tell us where the structure is, take photos of the damage, and leave us your contact. Our technical team will review your report and contact you as soon as possible to coordinate a visit.'}
        </p>
      </div>

      {/* Tipo */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{es ? 'Tipo de estructura' : 'Structure type'}</label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {TIPO_OPTS.map(t => (
            <button key={t.val} onClick={() => set('tipo_estructura', t.val)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${form.tipo_estructura === t.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>
              {es ? t.es : t.en}
            </button>
          ))}
        </div>
      </div>

      {/* Ubicación */}
      <input value={form.nombre_lugar} onChange={e => set('nombre_lugar', e.target.value)}
        placeholder={es ? 'Nombre del lugar (ej: Residencias El Ávila)' : 'Place name (e.g. El Ávila Building)'}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
      <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
        placeholder={es ? 'Dirección / referencia' : 'Address / reference'}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
          placeholder={es ? 'Ciudad *' : 'City *'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
        <input value={form.estado_region} onChange={e => set('estado_region', e.target.value)}
          placeholder={es ? 'Estado / región' : 'State / region'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
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
            <button key={o.v} onClick={() => set('personas_atrapadas', o.v)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${form.personas_atrapadas === o.v ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
      </div>

      <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
        placeholder={es ? 'Notas (grietas, daños visibles, gas, etc.)' : 'Notes (cracks, visible damage, gas, etc.)'}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400" />

      {/* Fotos */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{es ? `Fotos de daños (${fotos.length}/${MAX_FOTOS})` : `Damage photos (${fotos.length}/${MAX_FOTOS})`}</label>
        <p className="text-[10px] text-gray-400 mb-1.5">{es ? 'Opcional · Solo desde un lugar seguro, no entres al edificio.' : 'Optional · Only from a safe place, do not enter the building.'}</p>
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
              <button onClick={() => setFotos(prev => prev.filter((_, x) => x !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer">
                <X size={11} />
              </button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <label className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:border-blue-400">
              {subiendo ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span className="text-[10px] mt-1">{es ? 'Tomar foto' : 'Take photo'}</span>
              <input type="file" accept="image/*" capture="environment" multiple onChange={agregarFotos} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Contacto */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
        <p className="text-xs font-bold text-blue-900">🔒 {es ? 'Tus datos de contacto (privados)' : 'Your contact info (private)'}</p>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          {es ? 'Te contactaremos por aquí para coordinar la inspección. No se muestran públicamente.' : 'We will reach you here to coordinate the inspection. Never shown publicly.'}
        </p>
        <input value={form.reportante_nombre} onChange={e => set('reportante_nombre', e.target.value)}
          placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
        <input value={form.reportante_telefono} onChange={e => set('reportante_telefono', e.target.value)}
          placeholder={es ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
        <input value={form.reportante_email} onChange={e => set('reportante_email', e.target.value)} type="email"
          placeholder={es ? 'Email *' : 'Email *'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
      </div>

      {error && (
        <p className="text-xs text-red-600 text-center">{es ? 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.' : 'Could not send. Check your connection and try again.'}</p>
      )}

      <button onClick={enviar} disabled={!puedeEnviar || enviando || subiendo}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
        {enviando ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
        {es ? 'Enviar solicitud de inspección' : 'Send inspection request'}
      </button>
      {!puedeEnviar && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">{es ? 'Completa la ciudad y un dato de contacto (email o teléfono).' : 'Fill in the city and one contact (email or phone).'}</p>
      )}
    </div>
  );
}