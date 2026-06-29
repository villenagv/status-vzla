import { useState } from 'react';
import { Loader2, MapPin, CheckCircle2, ShieldAlert, ChevronRight, ChevronLeft, Plus, Save, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { comprimirFoto, dataURLaFile } from '@/lib/comprimirFoto';
import { useInspeccionQueue } from '@/lib/useInspeccionQueue';
import { useOffline } from '@/lib/useOffline';
import { GRUPOS_FOTOS, SENALES_PELIGRO, MAX_FOTOS_TOTAL } from './guiaFotos';
import GrupoFotos from './GrupoFotos';
import BuscadorEdificio from './BuscadorEdificio';
import ColaInspecciones from './ColaInspecciones';

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

const FORM_INICIAL = (prefill = {}) => ({
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

/**
 * Formulario público por pasos para PEDIR una inspección de daños.
 * Funciona offline: cada edificio se guarda en una cola local (outbox) con sus fotos
 * en base64, y el usuario sube uno o varios cuando recupera señal.
 * Permite inspeccionar varios edificios en una sola sesión ("Guardar y añadir otro").
 */
export default function SolicitarInspeccion({ es, prefill = {}, onListo }) {
  const { offline } = useOffline();
  const { items, pendientes, agregar, marcar, eliminar, limpiarSincronizados } = useInspeccionQueue();

  const [paso, setPaso] = useState(0);
  const [form, setForm] = useState(FORM_INICIAL(prefill));
  // fotos por grupo: { fachada: [{dataURL, comprimiendo, descripcion}], estructural: [...], ... }
  const [fotosPorGrupo, setFotosPorGrupo] = useState(
    GRUPOS_FOTOS.reduce((acc, g) => ({ ...acc, [g.key]: [] }), {})
  );
  const [comprimiendoGrupo, setComprimiendoGrupo] = useState(null);
  const [edificioExistente, setEdificioExistente] = useState(null); // reporte ya registrado elegido
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false); // confirmación de "guardado en cola"

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Al elegir un edificio ya registrado: precargamos sus datos
  const seleccionarEdificio = (reporte) => {
    setEdificioExistente(reporte);
    if (!reporte) return;
    setForm(f => ({
      ...f,
      tipo_estructura: reporte.tipo_estructura || f.tipo_estructura,
      nombre_lugar: reporte.nombre_lugar || f.nombre_lugar,
      direccion: reporte.direccion || f.direccion,
      ciudad: reporte.ciudad || f.ciudad,
      estado_region: reporte.estado_region || f.estado_region,
    }));
  };

  const totalFotos = Object.values(fotosPorGrupo).reduce((n, arr) => n + arr.length, 0);

  const agregarFotos = async (grupoKey, files) => {
    const espacio = MAX_FOTOS_TOTAL - totalFotos;
    const archivos = files.slice(0, Math.max(0, espacio));
    if (!archivos.length) return;
    setComprimiendoGrupo(grupoKey);
    for (const file of archivos) {
      try {
        const dataURL = await comprimirFoto(file, 1280, 0.7);
        setFotosPorGrupo(prev => ({ ...prev, [grupoKey]: [...prev[grupoKey], { dataURL, descripcion: '' }] }));
      } catch { /* ignoramos la foto que falle */ }
    }
    setComprimiendoGrupo(null);
  };

  const quitarFoto = (grupoKey, index) => {
    setFotosPorGrupo(prev => ({ ...prev, [grupoKey]: prev[grupoKey].filter((_, i) => i !== index) }));
  };

  const describirFoto = (grupoKey, index, texto) => {
    setFotosPorGrupo(prev => ({
      ...prev,
      [grupoKey]: prev[grupoKey].map((f, i) => i === index ? { ...f, descripcion: texto } : f),
    }));
  };

  // Aplana fotos (fachada primero) → [{ dataURL, descripcion, grupo }]
  const fotosAplanadas = () =>
    GRUPOS_FOTOS.flatMap(g => fotosPorGrupo[g.key].map(f => ({
      dataURL: f.dataURL,
      descripcion: f.descripcion?.trim() || '',
      grupo: es ? g.es.titulo : g.en.titulo,
    })));

  // Construye la descripción enriquecida con las ubicaciones de los daños por foto
  const descripcionConDetalles = () => {
    const detalles = fotosAplanadas()
      .filter(f => f.descripcion)
      .map(f => `• [${f.grupo}] ${f.descripcion}`);
    const base = form.descripcion.trim();
    if (!detalles.length) return base;
    const encabezado = es ? 'Ubicación de los daños:' : 'Damage locations:';
    return [base, `${encabezado}\n${detalles.join('\n')}`].filter(Boolean).join('\n\n');
  };

  const puedeGuardar = form.ciudad.trim() && form.reportante_nombre.trim() && form.reportante_telefono.trim() && form.reportante_email.trim();

  // Datos que van a ReportesDano (sin fotos: esas se suben al sincronizar)
  const construirData = () => ({
    tipo_estructura: form.tipo_estructura,
    nombre_lugar: form.nombre_lugar.trim(),
    direccion: form.direccion.trim(),
    ciudad: form.ciudad.trim(),
    estado_region: form.estado_region.trim() || form.ciudad.trim(),
    descripcion: descripcionConDetalles(),
    personas_atrapadas: form.personas_atrapadas,
    reportante_nombre: form.reportante_nombre.trim(),
    reportante_telefono: form.reportante_telefono.trim(),
    reportante_email: form.reportante_email.trim(),
    ...(prefill.lat != null ? { lat: prefill.lat, lng: prefill.lng } : {}),
  });

  // Sube directamente (online) — crea/actualiza el ReportesDano de inmediato
  const subirAhora = async () => {
    const urls = [];
    for (const f of fotosAplanadas()) {
      try {
        const file = dataURLaFile(f.dataURL, `inspeccion_${Date.now()}.jpg`);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) urls.push(file_url);
      } catch { /* seguimos */ }
    }
    if (edificioExistente) {
      const fotosPrev = edificioExistente.foto_urls || [];
      await base44.entities.ReportesDano.update(edificioExistente.id, {
        foto_urls: [...fotosPrev, ...urls].slice(0, MAX_FOTOS_TOTAL),
        descripcion: [edificioExistente.descripcion, descripcionConDetalles()].filter(Boolean).join('\n— '),
        personas_atrapadas: form.personas_atrapadas !== 'no_sabe' ? form.personas_atrapadas : edificioExistente.personas_atrapadas,
        requiere_inspeccion_presencial: true,
        reportante_nombre: form.reportante_nombre.trim(),
        reportante_telefono: form.reportante_telefono.trim(),
        reportante_email: form.reportante_email.trim(),
      });
    } else {
      await base44.entities.ReportesDano.create({
        ...construirData(),
        foto_urls: urls.slice(0, MAX_FOTOS_TOTAL),
        triage_estado: 'pendiente_triage',
        requiere_inspeccion_presencial: true,
        estado_verificacion: 'recibido',
        nivel_verificacion: 'sin_verificar',
        fuente: 'solicitud_inspeccion',
      });
    }
  };

  // Limpia el formulario para empezar un edificio nuevo
  const reiniciar = () => {
    setForm(FORM_INICIAL());
    setFotosPorGrupo(GRUPOS_FOTOS.reduce((acc, g) => ({ ...acc, [g.key]: [] }), {}));
    setEdificioExistente(null);
    setPaso(0);
    setGuardadoOk(false);
  };

  // Guarda en la cola local SIEMPRE (aunque haya señal) para subir más tarde
  const guardarParaLuego = () => {
    if (!puedeGuardar) return;
    agregar(construirData(), fotosAplanadas().map(f => ({ dataURL: f.dataURL, descripcion: f.descripcion })));
    setGuardadoOk('final');
  };

  // Guarda este edificio (en cola si offline, o sube directo si online) y deja añadir otro
  const guardarEdificio = async ({ continuar }) => {
    if (!puedeGuardar) return;
    setGuardando(true);
    try {
      if (offline) {
        // Guardar en la cola local con fotos base64 (no se puede subir todavía)
        agregar(construirData(), fotosAplanadas().map(f => ({ dataURL: f.dataURL, descripcion: f.descripcion })));
      } else {
        await subirAhora();
        onListo?.();
      }
      if (continuar) {
        reiniciar();
        setGuardadoOk(true);
        setTimeout(() => setGuardadoOk(false), 3500);
      } else {
        setGuardadoOk('final');
      }
    } catch {
      // Si falla la subida online, lo dejamos en la cola para reintentar
      agregar(construirData(), fotosAplanadas().map(f => ({ dataURL: f.dataURL, descripcion: f.descripcion })));
      if (continuar) reiniciar();
      else setGuardadoOk('final');
    }
    setGuardando(false);
  };

  // ── PANTALLA DE CONFIRMACIÓN FINAL ──
  if (guardadoOk === 'final') {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-green-200 rounded-2xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={30} className="text-green-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">
            {offline
              ? (es ? 'Guardado en este dispositivo ✅' : 'Saved on this device ✅')
              : (es ? 'Recibimos tu solicitud ✅' : 'We received your request ✅')}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {offline
              ? (es ? 'No tienes conexión ahora. Tus inspecciones quedaron guardadas. Cuando recuperes señal, presiona "Subir todo" en la cola de envíos.' : 'You are offline now. Your inspections are saved. When you regain signal, press "Upload all" in the queue below.')
              : (es ? 'Nuestro equipo técnico analizará las imágenes y datos enviados, y te contactará para coordinar los próximos pasos.' : 'Our technical team will analyze the submitted images and data, and contact you to coordinate next steps.')}
          </p>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-left">
            <ShieldAlert size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {es
                ? 'No entres a estructuras dañadas. Si hay grietas graves, olor a gas, cables caídos o personas atrapadas, espera a Protección Civil (171), Bomberos o rescatistas autorizados.'
                : 'Do not enter damaged structures. If there are major cracks, gas smell, fallen wires, or trapped people, wait for Civil Protection (171), firefighters, or authorized rescue teams.'}
            </p>
          </div>
        </div>

        <ColaInspecciones es={es} offline={offline} items={items} pendientes={pendientes}
          onMarcar={marcar} onEliminar={eliminar} onLimpiar={limpiarSincronizados} />

        <button type="button" onClick={reiniciar}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 text-sm font-bold py-3 rounded-xl cursor-pointer hover:bg-gray-50">
          <Plus size={16} /> {es ? 'Inspeccionar otro edificio' : 'Inspect another building'}
        </button>
      </div>
    );
  }

  const fachadaLista = fotosPorGrupo.fachada.length > 0;

  return (
    <div className="space-y-4">
      {/* Aviso de que se guardó un edificio y se puede añadir otro */}
      {guardadoOk === true && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-800 leading-relaxed">
            {offline
              ? (es ? 'Edificio guardado en la cola. Puedes registrar otro.' : 'Building saved to the queue. You can register another.')
              : (es ? 'Edificio enviado. Puedes registrar otro.' : 'Building sent. You can register another.')}
          </p>
        </div>
      )}

      {/* Cola de envíos pendientes (siempre visible si hay algo) */}
      {items.length > 0 && (
        <ColaInspecciones es={es} offline={offline} items={items} pendientes={pendientes}
          onMarcar={marcar} onEliminar={eliminar} onLimpiar={limpiarSincronizados} />
      )}

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

            <BuscadorEdificio es={es} valor={form.nombre_lugar}
              onCambiarNombre={v => set('nombre_lugar', v)}
              onSeleccionar={seleccionarEdificio}
              seleccionado={edificioExistente} />
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
              placeholder={es ? 'Notas generales (grietas, daños visibles, gas, etc.)' : 'General notes (cracks, visible damage, gas, etc.)'}
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
            subiendo={comprimiendoGrupo === grupo.key}
            onAgregar={(files) => agregarFotos(grupo.key, files)}
            onQuitar={(i) => quitarFoto(grupo.key, i)}
            onDescribir={(i, t) => describirFoto(grupo.key, i, t)}
            disabled={totalFotos >= MAX_FOTOS_TOTAL}
          />
        );
      })()}

      {/* ── ÚLTIMO PASO: Contacto + envío ── */}
      {paso === TOTAL_PASOS - 1 && (
        <div className="bg-white border border-blue-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-blue-900">🔒 {es ? 'Tus datos de contacto (privados)' : 'Your contact info (private)'}</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            {es ? 'Te contactaremos por aquí para coordinar la inspección. No se muestran públicamente. Los tres campos son obligatorios.' : 'We will reach you here to coordinate the inspection. Never shown publicly. All three fields are required.'}
          </p>
          <input value={form.reportante_nombre} onChange={e => set('reportante_nombre', e.target.value)}
            placeholder={es ? 'Tu nombre *' : 'Your name *'} className={INPUT} />
          <input value={form.reportante_telefono} onChange={e => set('reportante_telefono', e.target.value)}
            placeholder={es ? 'Teléfono / WhatsApp *' : 'Phone / WhatsApp *'} className={INPUT} />
          <input value={form.reportante_email} onChange={e => set('reportante_email', e.target.value)} type="email"
            placeholder={es ? 'Email *' : 'Email *'} className={INPUT} />
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
          <div className="flex-1 flex flex-col gap-2">
            <button type="button" onClick={() => guardarEdificio({ continuar: false })} disabled={!puedeGuardar || guardando || comprimiendoGrupo}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer">
              {guardando ? <Loader2 size={15} className="animate-spin" /> : offline ? <Save size={15} /> : <MapPin size={15} />}
              {offline
                ? (es ? 'Guardar y terminar' : 'Save and finish')
                : edificioExistente
                  ? (es ? 'Consolidar información' : 'Consolidate info')
                  : (es ? 'Enviar solicitud' : 'Send request')}
            </button>
            <button type="button" onClick={() => guardarEdificio({ continuar: true })} disabled={!puedeGuardar || guardando || comprimiendoGrupo}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer hover:bg-gray-50">
              <Plus size={15} /> {es ? 'Guardar y añadir otro edificio' : 'Save and add another building'}
            </button>
            {/* Con señal: opción de NO subir ahora y dejarlo en la cola para más tarde */}
            {!offline && (
              <button type="button" onClick={guardarParaLuego} disabled={!puedeGuardar || guardando || comprimiendoGrupo}
                className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer hover:bg-amber-100">
                <Clock size={15} /> {es ? 'Guardar para subir más tarde' : 'Save to upload later'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Avisos de validación */}
      {paso === 0 && !form.ciudad.trim() && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">{es ? 'Escribe al menos la ciudad para continuar.' : 'Enter at least the city to continue.'}</p>
      )}
      {paso === 1 && !fachadaLista && (
        <p className="text-[11px] text-amber-600 text-center -mt-2">{es ? 'La foto de fachada ayuda mucho al inspector, pero puedes continuar si no la tienes.' : 'The façade photo helps the inspector a lot, but you can continue without it.'}</p>
      )}
      {paso === TOTAL_PASOS - 1 && !puedeGuardar && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">{es ? 'Completa nombre, teléfono y email para guardar.' : 'Fill in name, phone and email to save.'}</p>
      )}

      {comprimiendoGrupo && (
        <p className="text-[11px] text-gray-500 text-center">📷 {es ? 'Comprimiendo fotos...' : 'Compressing photos...'}</p>
      )}
    </div>
  );
}