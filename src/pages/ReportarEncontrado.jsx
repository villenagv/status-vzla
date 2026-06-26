import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, ShieldAlert, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const CONDICION = [
  { val: 'a_salvo', es: '✅ A salvo', en: '✅ Safe', color: 'bg-green-600 border-green-600 text-white' },
  { val: 'herido_leve', es: '🟡 Herido leve', en: '🟡 Mildly injured', color: 'bg-yellow-500 border-yellow-500 text-white' },
  { val: 'herido_grave', es: '🔴 Herido grave', en: '🔴 Seriously injured', color: 'bg-orange-600 border-orange-600 text-white' },
  { val: 'fallecido_reportado', es: '⚫ Fallecido (reportado)', en: '⚫ Deceased (reported)', color: 'bg-gray-700 border-gray-700 text-white' },
  { val: 'no_identificado', es: '❓ No identificado', en: '❓ Unidentified', color: 'bg-gray-400 border-gray-400 text-white' },
];

const TIPO_LUGAR = [
  { val: 'refugio', es: '🏠 Refugio', en: '🏠 Shelter' },
  { val: 'hospital', es: '🏥 Hospital', en: '🏥 Hospital' },
  { val: 'centro_acopio', es: '📦 Centro de acopio', en: '📦 Supply center' },
  { val: 'domicilio', es: '🏡 Domicilio', en: '🏡 Home' },
  { val: 'via_publica', es: '🛣️ Vía pública', en: '🛣️ Public area' },
  { val: 'otro', es: '📍 Otro', en: '📍 Other' },
];

export default function ReportarEncontrado() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [personasEncontradas, setPersonasEncontradas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [personaVinculada, setPersonaVinculada] = useState(null);

  const [form, setForm] = useState({
    nombre_o_descripcion: '',
    condicion: '',
    tipo_lugar: '',
    nombre_lugar: '',
    ubicacion_actual: '',
    ciudad: '',
    estado_region: '',
    telefono_contacto: '',
    email_contacto: '',
    descripcion_fisica: '',
    edad_aprox: '',
    sexo: '',
    notas_publicas: '',
    reportado_por_nombre: '',
    reportado_por_telefono: '',
    reportado_por_email: '',
  });

  const [fotoUrls, setFotoUrls] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [fotoId] = useState(() => `encontrado-${Date.now()}`);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buscarEnLista = async () => {
    if (busquedaNombre.trim().length < 2) return;
    setBuscando(true);
    try {
      const todas = await base44.entities.PersonasBuscadas.list();
      const q = busquedaNombre.toLowerCase();
      setPersonasEncontradas(todas.filter(p =>
        p.nombre_completo?.toLowerCase().includes(q) ||
        p.apodo?.toLowerCase().includes(q)
      ));
    } catch {}
    setBuscando(false);
  };

  const vincular = (persona) => {
    setPersonaVinculada(persona);
    set('nombre_o_descripcion', persona.nombre_completo);
    setPersonasEncontradas([]);
    setBusquedaNombre('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.condicion) return;
    setEnviando(true);
    try {
      const reporte = await base44.entities.PersonasEncontradas.create({
        ...form,
        foto_url: fotoUrls[0] || '',
        persona_buscada_id: personaVinculada?.id || '',
        fuente: 'web_publica',
        nivel_verificacion: 'comunidad',
      });

      // If linked to a searched person, update their status and notify subscribers
      if (personaVinculada?.id) {
        const nuevoEstado = form.condicion === 'a_salvo' ? 'encontrado_con_vida'
          : form.condicion === 'herido_leve' || form.condicion === 'herido_grave' ? 'en_hospital_refugio'
          : form.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
          : 'informacion_recibida';

        await base44.entities.PersonasBuscadas.update(personaVinculada.id, {
          estado_caso: nuevoEstado,
        });

        // Notify all subscribers
        await base44.functions.invoke('notificarActualizacion', {
          persona_id: personaVinculada.id,
          tipo_evento: 'persona_encontrada',
          datos_persona: {
            nombre_completo: personaVinculada.nombre_completo,
            estado_caso: nuevoEstado,
            condicion: form.condicion,
            ubicacion: form.nombre_lugar || form.ubicacion_actual,
          },
        });
      }

      setResultado('ok');
    } catch {
      setResultado('err');
    } finally {
      setEnviando(false);
    }
  };

  if (resultado === 'ok') return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">
          {es ? 'Reporte enviado. Gracias.' : 'Report submitted. Thank you.'}
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          {es
            ? 'Si esta persona estaba en lista de búsqueda, sus familiares serán notificados por email.'
            : 'If this person was on a missing list, their family will be notified by email.'}
        </p>
        <Link to="/" className="bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">
          {es ? 'Volver al inicio' : 'Back to home'}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">
          {es ? '🙋 Encontré o vi a alguien' : '🙋 I found or saw someone'}
        </h1>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          {es
            ? 'Usa este formulario si viste, encontraste o tienes información real sobre una persona. No publiques rumores. Tus datos de contacto no se publicarán.'
            : 'Use this form if you saw, found or have real information about a person. Do not post rumors. Your contact details will not be published.'}
        </p>

        {/* Anti-extortion */}
        <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 mb-5">
          <ShieldAlert size={16} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] leading-relaxed">
            {es
              ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.'
              : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Buscar en lista de desaparecidos ── */}
          <div className="bg-[#F0F4FD] border border-[#B0C4E8] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">
              {es ? '¿Está esta persona en lista de búsqueda?' : 'Is this person on a missing list?'}
            </h3>
            <p className="text-xs text-gray-600">
              {es
                ? 'Busca por nombre para vincular tu reporte. Si está registrada, sus familiares recibirán una notificación automática.'
                : 'Search by name to link your report. If registered, their family will receive an automatic notification.'}
            </p>

            {personaVinculada ? (
              <div className="bg-white rounded-xl border border-green-200 p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-green-700">✅ {personaVinculada.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{personaVinculada.ultima_ubicacion_conocida} · {personaVinculada.ciudad}</p>
                </div>
                <button type="button" onClick={() => setPersonaVinculada(null)} className="text-xs text-gray-400 hover:text-red-500 underline flex-shrink-0">
                  {es ? 'Cambiar' : 'Change'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={busquedaNombre}
                  onChange={e => setBusquedaNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarEnLista())}
                  placeholder={es ? 'Nombre de la persona...' : 'Person\'s name...'}
                  className="flex-1 border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
                <button type="button" onClick={buscarEnLista} disabled={buscando} className="bg-[#1A1F2E] text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
                  <Search size={14} /> {es ? 'Buscar' : 'Search'}
                </button>
              </div>
            )}

            {personasEncontradas.length > 0 && (
              <div className="space-y-2">
                {personasEncontradas.map(p => (
                  <div key={p.id} className="bg-white border border-[#EDEBE8] rounded-xl p-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1A1F2E]">{p.nombre_completo}</p>
                      <p className="text-xs text-gray-500">{p.ultima_ubicacion_conocida} · {p.ciudad}{p.edad_aprox ? ` · ${p.edad_aprox}` : ''}</p>
                    </div>
                    <button type="button" onClick={() => vincular(p)} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0">
                      {es ? 'Esta persona' : 'This person'}
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setPersonasEncontradas([])} className="w-full text-xs text-gray-400 py-1">
                  {es ? 'No está en la lista — continuar sin vincular' : 'Not on list — continue without linking'}
                </button>
              </div>
            )}
          </div>

          {/* ── Sección 1: Datos de la persona vista ── */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">
              {es ? '1. Datos de la persona que encontraste' : '1. Information about the person you found'}
            </h3>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Nombre o descripción' : 'Name or description'} *
              </label>
              <input
                required
                placeholder={es ? 'Nombre completo, o descripción si no sabes quién es' : 'Full name, or description if unknown'}
                value={form.nombre_o_descripcion}
                onChange={e => set('nombre_o_descripcion', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Edad aprox.' : 'Approx. age'}</label>
                <input placeholder={es ? 'Ej: 40 años' : 'E.g: 40 yrs'} value={form.edad_aprox} onChange={e => set('edad_aprox', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Sexo' : 'Sex'}</label>
                <select value={form.sexo} onChange={e => set('sexo', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]">
                  <option value="">{es ? 'No sé' : "Don't know"}</option>
                  <option value="femenino">{es ? 'Femenino' : 'Female'}</option>
                  <option value="masculino">{es ? 'Masculino' : 'Male'}</option>
                  <option value="otro">{es ? 'Otro' : 'Other'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Descripción física (opcional)' : 'Physical description (optional)'}
              </label>
              <textarea rows={2} placeholder={es ? 'Ropa, cabello, señas particulares...' : 'Clothing, hair, distinguishing marks...'} value={form.descripcion_fisica} onChange={e => set('descripcion_fisica', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none" />
            </div>
          </div>

          {/* ── Sección 2: Condición ── */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '2. ¿Cómo está?' : '2. What is their condition?'} *</h3>
            <div className="flex flex-col gap-2">
              {CONDICION.map(c => (
                <button
                  key={c.val}
                  type="button"
                  onClick={() => set('condicion', c.val)}
                  className={`w-full py-3 rounded-xl text-sm font-semibold border-2 transition-colors text-left px-4 ${
                    form.condicion === c.val ? c.color : 'bg-white border-[#EDEBE8] text-gray-700'
                  }`}
                >{es ? c.es : c.en}</button>
              ))}
            </div>
          </div>

          {/* ── Sección 3: Ubicación actual ── */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '3. ¿Dónde está ahora?' : '3. Where are they now?'}</h3>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{es ? 'Tipo de lugar' : 'Type of place'}</label>
              <div className="flex flex-wrap gap-2">
                {TIPO_LUGAR.map(tl => (
                  <button
                    key={tl.val}
                    type="button"
                    onClick={() => set('tipo_lugar', tl.val)}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      form.tipo_lugar === tl.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'
                    }`}
                  >{es ? tl.es : tl.en}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Nombre del lugar (si lo sabes)' : 'Place name (if known)'}</label>
              <input placeholder={es ? 'Ej: Hospital Pérez Carreño, Refugio El Valle...' : 'E.g: Pérez Carreño Hospital, El Valle Shelter...'} value={form.nombre_lugar} onChange={e => set('nombre_lugar', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Dirección o referencia' : 'Address or landmark'}</label>
              <input placeholder={es ? 'Calle, avenida, referencia...' : 'Street, avenue, landmark...'} value={form.ubicacion_actual} onChange={e => set('ubicacion_actual', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Ciudad' : 'City'} *</label>
                <input required placeholder="Caracas" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Estado' : 'State'} *</label>
                <input required placeholder="Miranda" value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Teléfono de contacto' : 'Contact phone'}</label>
                <input placeholder="+58..." value={form.telefono_contacto} onChange={e => set('telefono_contacto', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Email de contacto' : 'Contact email'}</label>
                <input type="email" placeholder="correo@..." value={form.email_contacto} onChange={e => set('email_contacto', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Información adicional (opcional, pública)' : 'Additional info (optional, public)'}</label>
            <textarea rows={2} placeholder={es ? 'Ej: Está consciente, tiene documentos, pide que contacten a su familia...' : 'E.g: Conscious, has ID, asking to contact family...'} value={form.notas_publicas} onChange={e => set('notas_publicas', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none" />
          </div>

          {/* Foto */}
          {!lowBw && (
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Foto (opcional, máx. 2)' : 'Photo (optional, max 2)'}</label>
              <FotosDragDrop category="encontrados" caseId={fotoId} caseLabel={form.nombre_o_descripcion || 'encontrado'} maxFiles={2} onUploaded={setFotoUrls} disabled={enviando} />
            </div>
          )}

          {/* Sección 4: Quien reporta */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '4. Tu información (quien reporta)' : '4. Your information (reporter)'}</h3>
            <p className="text-xs text-gray-400">{es ? 'No se publicará. Solo para verificación.' : 'Not published. For verification only.'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Tu nombre' : 'Your name'}</label>
                <input placeholder={es ? 'Nombre...' : 'Name...'} value={form.reportado_por_nombre} onChange={e => set('reportado_por_nombre', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Tu teléfono' : 'Your phone'}</label>
                <input placeholder="+58..." value={form.reportado_por_telefono} onChange={e => set('reportado_por_telefono', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Tu email' : 'Your email'}</label>
              <input type="email" placeholder="correo@..." value={form.reportado_por_email} onChange={e => set('reportado_por_email', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
            </div>
          </div>

          {resultado === 'err' && (
            <div className="bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52]">
              {es ? 'Error al enviar. Verifica tu conexión.' : 'Error submitting. Check your connection.'}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || !form.nombre_o_descripcion || !form.condicion || !form.ciudad || !form.estado_region}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
          >
            {enviando ? <Loader2 size={18} className="animate-spin" /> : '🙋'}
            {es ? 'Enviar reporte' : 'Submit report'}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            {es ? 'Tus datos de contacto no se publicarán.' : 'Your contact details will not be published.'}
          </p>
        </form>
      </div>
    </div>
  );
}