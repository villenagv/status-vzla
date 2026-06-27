import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, MapPin, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const ESTADO_OPCIONES = [
  { val: 'a_salvo',          es: '✅ Estoy bien',                       en: '✅ I am OK' },
  { val: 'herido',           es: '🟡 Estoy herido/a, pero consciente',  en: '🟡 Injured but conscious' },
  { val: 'atencion_urgente', es: '🔴 Necesito atención médica urgente', en: '🔴 Need urgent medical attention' },
  { val: 'necesita_ayuda',   es: '🆘 Necesito ayuda para moverme',     en: '🆘 Need help moving' },
];

const UBICACION_TIPO = [
  { val: 'hospital',    es: '🏥 Hospital',            en: '🏥 Hospital' },
  { val: 'cdi',         es: '💊 CDI / ambulatorio',   en: '💊 Medical center' },
  { val: 'refugio',     es: '🏠 Refugio',             en: '🏠 Shelter' },
  { val: 'escuela',     es: '🏫 Escuela / liceo',     en: '🏫 School' },
  { val: 'iglesia',     es: '⛪ Iglesia',             en: '⛪ Church' },
  { val: 'plaza',       es: '🌳 Plaza / parque',      en: '🌳 Plaza / park' },
  { val: 'casa_vecino', es: '🏡 Casa de vecino',      en: '🏡 Neighbor\'s home' },
  { val: 'calle',       es: '🛣️ Calle / zona abierta',en: '🛣️ Street / open area' },
  { val: 'no_sabe',     es: '❓ No sé exactamente',   en: '❓ Not sure exactly' },
];

const NECESIDADES = [
  { val: 'agua',           es: '💧 Agua',            en: '💧 Water' },
  { val: 'comida',         es: '🍞 Comida',          en: '🍞 Food' },
  { val: 'medicinas',      es: '💊 Medicinas',       en: '💊 Medicine' },
  { val: 'traslado',       es: '🚗 Traslado',        en: '🚗 Transport' },
  { val: 'ninos',          es: '👶 Estoy con niños', en: '👶 With children' },
  { val: 'adultos_mayores',es: '👴 Adultos mayores', en: '👴 Elderly' },
];

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

function genCodigo() {
  return 'CRIS-' + Math.random().toString(36).toUpperCase().slice(2, 8);
}

export default function EstoyAqui() {
  const { lang } = useLang();
  const es = lang === 'es';

  // ── Fase 1: buscar ficha existente ──────────────────────────────────────────
  const [fase, setFase] = useState('buscar'); // 'buscar' | 'nueva' | 'actualizar'
  const [busqNombre, setBusqNombre] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [coincidencias, setCoincidencias] = useState([]);
  const [fichaExistente, setFichaExistente] = useState(null);
  const [buscado, setBuscado] = useState(false);

  // ── Fase 2: formulario ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    nombre: '', apellido: '', apodo: '', edad_aproximada: '',
    telefono_parcial: '', familiar_nombre: '', avisar_email: '',
    ubicacion_tipo: '', ubicacion_texto: '', ciudad: '', estado_region: '',
    estado_actual: '', necesidades: [], mensaje: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [codigoCRIS, setCodigoCRIS] = useState(null);
  const [error, setError] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleNec = (val) => setForm(f => ({
    ...f, necesidades: f.necesidades.includes(val)
      ? f.necesidades.filter(n => n !== val)
      : [...f.necesidades, val],
  }));

  // ── Buscar ficha existente ──────────────────────────────────────────────────
  const buscarFicha = async () => {
    if (busqNombre.trim().length < 2) return;
    setBuscando(true);
    setBuscado(false);
    try {
      const [cris, buscadas] = await Promise.all([
        base44.entities.PersonaCRIS.list('-updated_date', 200),
        base44.entities.PersonasBuscadas.list('-updated_date', 200),
      ]);
      const q = busqNombre.toLowerCase();
      const resCris = cris.filter(p =>
        (p.nombre || '').toLowerCase().includes(q) ||
        (p.apellido || '').toLowerCase().includes(q) ||
        (p.apodo || '').toLowerCase().includes(q)
      ).map(p => ({ ...p, _fuente: 'PersonaCRIS' }));
      const resBusc = buscadas.filter(p =>
        (p.nombre_completo || '').toLowerCase().includes(q)
      ).map(p => ({ ...p, nombre: p.nombre_completo, _fuente: 'PersonasBuscadas' }));
      setCoincidencias([...resCris, ...resBusc].slice(0, 8));
      setBuscado(true);
    } catch {}
    setBuscando(false);
  };

  // ── Actualizar ficha existente ──────────────────────────────────────────────
  const actualizarFicha = async () => {
    if (!fichaExistente || !form.estado_actual) return;
    setEnviando(true);
    setError(false);
    const codigo = fichaExistente.codigo_cris || genCodigo();
    try {
      const ubicacionTexto = `${form.ubicacion_tipo ? form.ubicacion_tipo + ' — ' : ''}${form.ubicacion_texto}`;
      if (fichaExistente._fuente === 'PersonaCRIS') {
        await base44.entities.PersonaCRIS.update(fichaExistente.id, {
          estado_actual: form.estado_actual || 'estoy_aqui',
          ubicacion_texto: ubicacionTexto || fichaExistente.ubicacion_texto,
          ciudad: form.ciudad || fichaExistente.ciudad,
          estado_region: form.estado_region || fichaExistente.estado_region,
          notas_publicas: form.mensaje || fichaExistente.notas_publicas,
          avisar_email: form.avisar_email || fichaExistente.avisar_email,
          avisar_nombre: form.familiar_nombre || fichaExistente.avisar_nombre,
        });
      } else {
        // PersonasBuscadas → crear PersonaCRIS vinculada
        await base44.entities.PersonaCRIS.create({
          nombre: fichaExistente.nombre_completo,
          ciudad: form.ciudad || fichaExistente.ciudad,
          estado_region: form.estado_region || fichaExistente.estado_region,
          ubicacion_texto: ubicacionTexto,
          estado_actual: form.estado_actual || 'estoy_aqui',
          nivel_verificacion: 'sin_verificar',
          codigo_cris: codigo,
          fuente_inicial: 'ciudadano',
          notas_publicas: form.mensaje,
          avisar_email: form.avisar_email,
          avisar_nombre: form.familiar_nombre,
        });
        // Actualizar el caso en PersonasBuscadas
        await base44.entities.PersonasBuscadas.update(fichaExistente.id, {
          estado_caso: 'encontrado_con_vida',
        });
      }
      await base44.entities.EventoHistorial.create({
        persona_id: fichaExistente.id,
        tipo_evento: 'actualizacion_estado',
        descripcion: `${es ? 'Actualización desde "Estoy aquí":' : 'Update from "I am here":'} ${form.estado_actual}. ${form.mensaje || ''}`.trim(),
        ubicacion_texto: ubicacionTexto,
        ciudad: form.ciudad,
        fuente: 'ciudadano',
        nivel_confianza: 'alto',
        es_sensible: false,
        reportante_nombre: fichaExistente.nombre || fichaExistente.nombre_completo,
      });
      if (form.avisar_email?.trim()) {
        try {
          await base44.functions.invoke('enviarAvisoFamiliar', {
            email_destino: form.avisar_email.trim(),
            nombre_reportante: fichaExistente.nombre || fichaExistente.nombre_completo,
            relacion: form.familiar_nombre || '',
            mensaje: form.mensaje || '',
            codigo_cris: codigo,
            persona_id: fichaExistente.id,
            nombre_persona: fichaExistente.nombre || fichaExistente.nombre_completo,
            lang,
          });
        } catch {}
      }
      setCodigoCRIS(codigo);
    } catch {
      setError(true);
    }
    setEnviando(false);
  };

  // ── Crear ficha nueva ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(false);
    const codigo = genCodigo();
    try {
      const ubicacionTexto = `${form.ubicacion_tipo ? form.ubicacion_tipo + ' — ' : ''}${form.ubicacion_texto}`;
      const persona = await base44.entities.PersonaCRIS.create({
        nombre: form.nombre,
        apellido: form.apellido,
        apodo: form.apodo,
        edad_aproximada: form.edad_aproximada,
        telefono_parcial: form.telefono_parcial,
        ubicacion_texto: ubicacionTexto,
        ciudad: form.ciudad,
        estado_region: form.estado_region,
        estado_actual: form.estado_actual || 'estoy_aqui',
        nivel_verificacion: 'sin_verificar',
        codigo_cris: codigo,
        fuente_inicial: 'ciudadano',
        notas_publicas: form.mensaje,
        avisar_email: form.avisar_email,
        avisar_nombre: form.familiar_nombre,
      });
      await base44.entities.EventoHistorial.create({
        persona_id: persona.id,
        tipo_evento: 'estoy_aqui',
        descripcion: form.mensaje || (es ? 'La persona reportó que está viva y registró su ubicación.' : 'Person reported being alive and registered their location.'),
        ubicacion_texto: form.ubicacion_texto,
        ciudad: form.ciudad,
        fuente: 'ciudadano',
        nivel_confianza: 'medio',
        es_sensible: false,
        reportante_nombre: `${form.nombre} ${form.apellido}`.trim(),
      });
      if (form.avisar_email?.trim() && (form.familiar_nombre?.trim() || form.nombre?.trim())) {
        try {
          await base44.functions.invoke('enviarAvisoFamiliar', {
            email_destino: form.avisar_email.trim(),
            nombre_reportante: form.nombre,
            relacion: form.familiar_nombre || '',
            mensaje: form.mensaje || '',
            codigo_cris: codigo,
            persona_id: persona.id,
            nombre_persona: form.nombre || '',
            lang,
          });
        } catch {}
      }
      setCodigoCRIS(codigo);
    } catch {
      setError(true);
    }
    setEnviando(false);
  };

  // ── Pantalla de éxito ───────────────────────────────────────────────────────
  if (codigoCRIS) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-5 py-12">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-black text-[#1A1F2E]">
          {fase === 'actualizar'
            ? (es ? 'Ficha actualizada.' : 'Record updated.')
            : (es ? 'Tu reporte fue registrado.' : 'Your report was registered.')}
        </h2>
        <div className="bg-[#1A1F2E] text-white rounded-2xl px-6 py-4 w-full max-w-xs">
          <p className="text-xs text-gray-400 mb-1">{es ? 'Tu código CRIS:' : 'Your CRIS code:'}</p>
          <p className="text-2xl font-black tracking-widest">{codigoCRIS}</p>
          <p className="text-xs text-gray-400 mt-1">{es ? 'Guarda este código. Te permite actualizar tu ficha.' : 'Save this code. It lets you update your record.'}</p>
        </div>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          {es
            ? 'Tu ficha es tu pasaporte de rastreo. Quien te busca podrá encontrarte usando tu nombre en el directorio.'
            : 'Your record is your tracking passport. Anyone searching for you can find you by name in the directory.'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link to="/fuera-zona" className="bg-[#D48C2E] text-white font-black py-4 rounded-2xl text-center text-sm no-underline">
            {es ? '→ Buscar a mi familia fuera de la zona' : '→ Find my family outside the area'}
          </Link>
          <Link to="/" className="bg-[#1A1F2E] text-white font-bold py-3 rounded-2xl text-center text-sm no-underline">
            {es ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          📍 {es ? 'Estoy aquí / Encuéntrame' : 'I am here / Find me'}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Avisa que estás vivo/a, dónde estás y qué necesitas. Si ya tienes una ficha, búscala para actualizarla en vez de crear una nueva.'
            : 'Let people know you are alive, where you are, and what you need. If you already have a record, find it to update it instead of creating a new one.'}
        </p>

        {/* ── FASE 1: Buscar ficha existente ── */}
        {fase === 'buscar' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E]">
                🔍 {es ? '¿Ya tienes una ficha en CRIS?' : 'Do you already have a CRIS record?'}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {es
                  ? 'Busca tu nombre. Si apareces en el sistema, actualiza tu ficha existente. Así evitamos duplicados y tu familia te encuentra más fácil.'
                  : 'Search your name. If you appear in the system, update your existing record. This avoids duplicates and helps your family find you.'}
              </p>
              <div className="flex gap-2">
                <input
                  value={busqNombre}
                  onChange={e => setBusqNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarFicha()}
                  placeholder={es ? 'Tu nombre completo...' : 'Your full name...'}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
                <button onClick={buscarFicha} disabled={buscando}
                  className="bg-[#1A1F2E] text-white px-4 py-3 rounded-xl flex items-center gap-1 disabled:opacity-50">
                  {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </button>
              </div>

              {buscado && coincidencias.length === 0 && (
                <p className="text-xs text-gray-400">{es ? 'No se encontraron fichas con ese nombre.' : 'No records found with that name.'}</p>
              )}

              {coincidencias.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-amber-700">
                    ⚠️ {es ? 'Encontramos estas fichas — ¿eres tú?' : 'We found these records — is that you?'}
                  </p>
                  {coincidencias.map(p => (
                    <div key={p.id} className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1F2E] truncate">
                          {p.nombre} {p.apellido || ''}
                          {p._fuente === 'PersonasBuscadas' && (
                            <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                              {es ? 'Te buscan' : 'Being searched'}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400">{p.ciudad || ''} {p.estado_region || ''} {p.estado_actual ? `· ${p.estado_actual}` : ''}</p>
                      </div>
                      <button
                        onClick={() => { setFichaExistente(p); setFase('actualizar'); }}
                        className="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 cursor-pointer"
                      >
                        {es ? 'Soy yo' : "That's me"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFase('nueva')}
                className="w-full bg-[#1A1F2E] text-white font-black py-4 rounded-2xl text-base cursor-pointer"
              >
                📍 {es ? 'No estoy en la lista — crear nueva ficha' : 'I am not listed — create new record'}
              </button>
              {buscado && (
                <p className="text-center text-xs text-gray-400">
                  {es ? 'Si no apareciste, crea una nueva ficha abajo.' : "If you didn't appear, create a new record below."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── FASE 2A: Actualizar ficha existente ── */}
        {fase === 'actualizar' && fichaExistente && (
          <div className="space-y-4">
            <button onClick={() => setFase('buscar')} className="text-sm text-gray-400 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar ficha' : 'Change record'}
            </button>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-green-800 mb-1">✅ {es ? 'Actualizando ficha de:' : 'Updating record for:'}</p>
              <p className="text-base font-black text-[#1A1F2E]">
                {fichaExistente.nombre} {fichaExistente.apellido || ''}
              </p>
              {fichaExistente._fuente === 'PersonasBuscadas' && (
                <p className="text-xs text-red-700 mt-1 font-semibold">
                  🔴 {es ? 'Hay alguien buscándote activamente.' : 'Someone is actively searching for you.'}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E]">{es ? '¿Cómo estás ahora?' : 'How are you now?'}</p>
              <div className="flex flex-col gap-2">
                {ESTADO_OPCIONES.map(o => (
                  <button key={o.val} type="button" onClick={() => set('estado_actual', o.val)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold border-2 text-left transition-colors cursor-pointer ${form.estado_actual === o.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? o.es : o.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E] flex items-center gap-2">
                <MapPin size={14} className="text-[#D48C2E]" /> {es ? '¿Dónde estás ahora?' : 'Where are you now?'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {UBICACION_TIPO.map(u => (
                  <button key={u.val} type="button" onClick={() => set('ubicacion_tipo', u.val)}
                    className={`py-2 rounded-xl text-xs font-bold border-2 text-center cursor-pointer ${form.ubicacion_tipo === u.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? u.es : u.en}
                  </button>
                ))}
              </div>
              <input placeholder={es ? 'Referencia del lugar...' : 'Location reference...'} value={form.ubicacion_texto} onChange={e => set('ubicacion_texto', e.target.value)} className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder={es ? 'Ciudad' : 'City'} value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
                <input placeholder={es ? 'Estado' : 'State'} value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Avisar familiar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E]">📧 {es ? 'Avisar a familiar' : 'Notify family'}</p>
              <input placeholder={es ? 'Nombre del familiar' : 'Family member name'} value={form.familiar_nombre} onChange={e => set('familiar_nombre', e.target.value)} className={inputCls} />
              <input type="email" placeholder={es ? 'Email del familiar' : "Family member's email"} value={form.avisar_email} onChange={e => set('avisar_email', e.target.value)} className={inputCls} />
            </div>

            <textarea rows={3}
              placeholder={es ? 'Mensaje adicional (opcional)...' : 'Additional message (optional)...'}
              value={form.mensaje} onChange={e => set('mensaje', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none resize-none" />

            {error && <p className="text-xs text-red-600 font-semibold">⚠️ {es ? 'Error al actualizar. Intenta de nuevo.' : 'Error updating. Try again.'}</p>}

            <button
              onClick={actualizarFicha}
              disabled={enviando || !form.estado_actual}
              className="w-full bg-green-700 disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {enviando ? <Loader2 size={20} className="animate-spin" /> : '📍'}
              {es ? 'Actualizar mi ficha' : 'Update my record'}
            </button>
          </div>
        )}

        {/* ── FASE 2B: Nueva ficha ── */}
        {fase === 'nueva' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button type="button" onClick={() => setFase('buscar')} className="text-sm text-gray-400 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Buscar ficha existente' : 'Search existing record'}
            </button>

            {/* Quién eres */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E]">{es ? '1. ¿Quién eres?' : '1. Who are you?'}</p>
              <p className="text-xs text-gray-400">{es ? 'Todo es opcional. Escribe solo lo que recuerdes.' : 'Everything is optional. Write only what you remember.'}</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={es ? 'Nombre' : 'First name'} value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
                <input placeholder={es ? 'Apellido' : 'Last name'} value={form.apellido} onChange={e => set('apellido', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={es ? 'Apodo (opcional)' : 'Nickname (opt.)'} value={form.apodo} onChange={e => set('apodo', e.target.value)} className={inputCls} />
                <input placeholder={es ? 'Edad aprox.' : 'Approx. age'} value={form.edad_aproximada} onChange={e => set('edad_aproximada', e.target.value)} className={inputCls} />
              </div>
              <input placeholder={es ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'} value={form.telefono_parcial} onChange={e => set('telefono_parcial', e.target.value)} className={inputCls} />
            </div>

            {/* Dónde estás */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E] flex items-center gap-2">
                <MapPin size={14} className="text-[#D48C2E]" /> {es ? '2. ¿Dónde estás?' : '2. Where are you?'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {UBICACION_TIPO.map(u => (
                  <button key={u.val} type="button" onClick={() => set('ubicacion_tipo', u.val)}
                    className={`py-2 rounded-xl text-xs font-bold border-2 text-center cursor-pointer ${form.ubicacion_tipo === u.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? u.es : u.en}
                  </button>
                ))}
              </div>
              <input placeholder={es ? 'Referencia del lugar (cerca de, frente a...)' : 'Location reference (near, across from...)'} value={form.ubicacion_texto} onChange={e => set('ubicacion_texto', e.target.value)} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Ciudad" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
                <input placeholder={es ? 'Estado' : 'State'} value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Cómo estás */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E]">{es ? '3. ¿Cómo estás?' : '3. How are you?'}</p>
              <div className="flex flex-col gap-2">
                {ESTADO_OPCIONES.map(o => (
                  <button key={o.val} type="button" onClick={() => set('estado_actual', o.val)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold border-2 text-left cursor-pointer ${form.estado_actual === o.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? o.es : o.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Necesidades */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E]">{es ? '4. ¿Qué necesitas?' : '4. What do you need?'}</p>
              <div className="grid grid-cols-2 gap-2">
                {NECESIDADES.map(n => (
                  <button key={n.val} type="button" onClick={() => toggleNec(n.val)}
                    className={`py-3 rounded-xl text-sm font-bold border-2 cursor-pointer ${form.necesidades.includes(n.val) ? 'bg-[#D48C2E] text-white border-[#D48C2E]' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? n.es : n.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Avisar familiar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-black text-[#1A1F2E]">📧 {es ? '5. Avisar a un familiar' : '5. Notify a family member'}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <p className="text-xs text-blue-800 font-medium">🔒 {es ? 'El email no se publica. Solo se usa para enviar el aviso.' : 'Email is not published. Only used to send the notice.'}</p>
              </div>
              <input placeholder={es ? 'Nombre del familiar' : 'Family member name'} value={form.familiar_nombre} onChange={e => set('familiar_nombre', e.target.value)} className={inputCls} />
              <input type="email" placeholder={es ? 'Email del familiar' : "Family member's email"} value={form.avisar_email} onChange={e => set('avisar_email', e.target.value)} className={inputCls} />
            </div>

            <textarea rows={3}
              placeholder={es ? 'Mensaje opcional (aparecerá en tu ficha pública)...' : 'Optional message (will appear in your public record)...'}
              value={form.mensaje} onChange={e => set('mensaje', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none resize-none" />

            {error && <p className="text-xs text-red-600 font-semibold">⚠️ {es ? 'Error al enviar. Intenta de nuevo.' : 'Error submitting. Try again.'}</p>}

            <button type="submit" disabled={enviando}
              className="w-full bg-[#B83A52] disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg flex items-center justify-center gap-2 cursor-pointer">
              {enviando ? <Loader2 size={20} className="animate-spin" /> : '📍'}
              {es ? 'Publicar que estoy aquí' : 'Publish that I am here'}
            </button>

            <div className="bg-blue-50 rounded-2xl px-4 py-3">
              <p className="text-xs text-blue-800 font-medium">
                🔒 {es ? 'Tu teléfono y datos privados no se mostrarán públicamente.' : 'Your phone and private data will not be shown publicly.'}
              </p>
            </div>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}