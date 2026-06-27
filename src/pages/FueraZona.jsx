import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Search, MapPin, Phone, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const RELACION = ['Mamá', 'Papá', 'Hijo/a', 'Hermano/a', 'Pareja', 'Abuelo/a', 'Tío/a', 'Vecino/a', 'Otro'];
const RELACION_EN = ['Mom', 'Dad', 'Son/Daughter', 'Brother/Sister', 'Partner', 'Grandparent', 'Uncle/Aunt', 'Neighbor', 'Other'];

const ACCIONES = [
  {
    id: 'buscar',
    emoji: '🔎',
    bg: '#6C3483',
    es: 'Busco a alguien en la zona afectada',
    en: "I'm looking for someone in the affected area",
    sub_es: 'Registra la búsqueda · Recibe alertas',
    sub_en: 'Register the search · Get alerts',
  },
  {
    id: 'consultar',
    emoji: '📋',
    bg: '#1A5276',
    es: 'Consultar edificios, personas o centros',
    en: 'Search buildings, people, or centers',
    sub_es: 'Ver listados · Buscar por ciudad o nombre',
    sub_en: 'View lists · Search by city or name',
  },
  {
    id: 'mensaje',
    emoji: '💬',
    bg: '#1A5C3A',
    es: 'Dejar un mensaje para que me encuentren',
    en: 'Leave a message so my family can find me',
    sub_es: 'Estoy a salvo · Quiero que sepan dónde estoy',
    sub_en: "I'm safe · I want them to know where I am",
  },
  {
    id: 'ayudar',
    emoji: '🤝',
    bg: '#7B3A9E',
    es: 'Soy voluntario o quiero aportar',
    en: 'I am a volunteer or want to contribute',
    sub_es: 'Registrar listados · Subir información',
    sub_en: 'Register lists · Upload information',
  },
];

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

const PERSONA_ESTADO = {
  buscando: { es: '🔴 Sin contacto', en: '🔴 Missing', cls: 'bg-red-100 text-red-700' },
  informacion_recibida: { es: '🔵 Con pistas', en: '🔵 Has leads', cls: 'bg-blue-100 text-blue-700' },
  visto_no_confirmado: { es: '🟠 Visto', en: '🟠 Seen', cls: 'bg-orange-100 text-orange-700' },
  encontrado_con_vida: { es: '✅ Localizado', en: '✅ Located', cls: 'bg-green-100 text-green-800' },
  en_hospital_refugio: { es: '🏥 En refugio', en: '🏥 In shelter', cls: 'bg-teal-100 text-teal-800' },
  fallecido_reportado: { es: '⚫ Fallecido rep.', en: '⚫ Death reported', cls: 'bg-gray-200 text-gray-700' },
};

const PAGE_SIZE = 10;

// ── Buscador unificado ────────────────────────────────────────────────────────
function BuscadorUnificado({ es, lowBw }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('personas');
  const [personas, setPersonas] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [centros, setCentros] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [pageP, setPageP] = useState(1);
  const [pageE, setPageE] = useState(1);
  const [pageC, setPageC] = useState(1);

  const buscar = async () => {
    if (!query.trim()) return;
    setBuscando(true);
    const q = query.toLowerCase();
    try {
      const [per, edif, cent] = await Promise.all([
        base44.entities.PersonasBuscadas.list('-updated_date', 300),
        base44.entities.InfraestructuraSos.list('-created_date', 200),
        base44.entities.PuntosAyuda.list('-updated_date', 200),
      ]);
      setPersonas(per.filter(x =>
        (x.nombre_completo || '').toLowerCase().includes(q) ||
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.ultima_ubicacion_conocida || '').toLowerCase().includes(q)
      ).filter(x => x.estado_caso !== 'caso_cerrado'));
      setEdificios(edif.filter(x =>
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.estado_region || '').toLowerCase().includes(q) ||
        (x.direccion || '').toLowerCase().includes(q)
      ));
      setCentros(cent.filter(x =>
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.nombre_lugar || '').toLowerCase().includes(q) ||
        (x.tipo_lugar || '').toLowerCase().includes(q)
      ));
      setPageP(1); setPageE(1); setPageC(1);
      setBuscado(true);
    } catch {}
    setBuscando(false);
  };

  const total = personas.length + edificios.length + centros.length;

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          placeholder={es ? 'Ciudad, nombre, barrio, municipio...' : 'City, name, neighborhood, municipality...'}
          className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
        />
        <button
          onClick={buscar}
          disabled={buscando || !query.trim()}
          className="bg-[#1A5276] text-white px-4 py-3 rounded-xl flex items-center gap-1 disabled:opacity-50"
        >
          {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">{es ? 'Presiona Enter o toca el botón para buscar.' : 'Press Enter or tap the button to search.'}</p>

      {buscado && !buscando && (
        <>
          <div className="flex gap-1.5 mb-4">
            {[
              { val: 'personas', es: `👤 Personas (${personas.length})`, en: `👤 People (${personas.length})` },
              { val: 'edificios', es: `🏗️ Daños (${edificios.length})`, en: `🏗️ Damage (${edificios.length})` },
              { val: 'centros', es: `🏥 Centros (${centros.length})`, en: `🏥 Centers (${centros.length})` },
            ].map(t => (
              <button key={t.val} onClick={() => setTab(t.val)}
                className={`flex-1 text-xs font-bold py-2 rounded-xl border-2 transition-colors ${tab === t.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
                {es ? t.es : t.en}
              </button>
            ))}
          </div>

          {total === 0 && (
            <div className="text-center py-8 space-y-3">
              <p className="text-3xl">🔍</p>
              <p className="text-sm font-bold text-gray-500">{es ? `Sin resultados para "${query}"` : `No results for "${query}"`}</p>
              <div className="flex flex-col gap-2 items-center">
                <Link to="/buscar-persona" className="text-xs text-[#6C3483] font-bold bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl no-underline">
                  {es ? '→ Registrar persona buscada' : '→ Register missing person'}
                </Link>
                <Link to="/reportar" className="text-xs text-[#B83A52] font-bold bg-red-50 border border-red-200 px-4 py-2 rounded-xl no-underline">
                  {es ? '→ Reportar emergencia' : '→ Report emergency'}
                </Link>
              </div>
            </div>
          )}

          {tab === 'personas' && (
            <div className="space-y-2">
              {personas.slice(0, pageP * PAGE_SIZE).map(p => {
                const st = PERSONA_ESTADO[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm text-[#1A1F2E]">{p.nombre_completo}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>{es ? st.es : st.en}</span>
                    </div>
                    <p className="text-xs text-gray-400"><MapPin size={10} className="inline mr-1" />{p.ultima_ubicacion_conocida} · {p.ciudad}</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                      <p className="text-[10px] text-amber-800 font-semibold">⚠️ {es ? 'Nunca pagues dinero por información.' : 'Never pay money for information.'}</p>
                    </div>
                    <Link to={`/persona?id=${p.id}`} className="block text-xs font-bold text-center text-[#6C3483] bg-purple-50 border border-purple-200 py-2 rounded-xl no-underline">
                      {es ? 'Ver perfil →' : 'View profile →'}
                    </Link>
                  </div>
                );
              })}
              {personas.length > pageP * PAGE_SIZE && (
                <button onClick={() => setPageP(p => p + 1)} className="w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl bg-white">
                  {es ? `Ver más (${personas.length - pageP * PAGE_SIZE})` : `Show more (${personas.length - pageP * PAGE_SIZE})`}
                </button>
              )}
            </div>
          )}

          {tab === 'edificios' && (
            <div className="space-y-2">
              {edificios.slice(0, pageE * PAGE_SIZE).map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-[#1A1F2E]">{r.tipo_reporte}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.prioridad === 'critica' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.prioridad === 'critica' ? (es ? '🔴 Crítico' : '🔴 Critical') : r.prioridad}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400"><MapPin size={10} className="inline mr-1" />{r.ciudad}, {r.estado_region}</p>
                  {r.personas_atrapadas === 'si' && (
                    <span className="inline-block text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      🆘 {es ? 'Atrapados' : 'Trapped'}
                    </span>
                  )}
                </div>
              ))}
              {edificios.length > pageE * PAGE_SIZE && (
                <button onClick={() => setPageE(p => p + 1)} className="w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl bg-white">
                  {es ? `Ver más (${edificios.length - pageE * PAGE_SIZE})` : `Show more (${edificios.length - pageE * PAGE_SIZE})`}
                </button>
              )}
            </div>
          )}

          {tab === 'centros' && (
            <div className="space-y-2">
              {centros.slice(0, pageC * PAGE_SIZE).map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 space-y-1.5">
                  <p className="font-bold text-sm text-[#1A1F2E]">{c.nombre_lugar}</p>
                  <p className="text-xs text-gray-400">{c.tipo_lugar} · {c.ciudad}</p>
                  {c.telefono_publico && (
                    <a href={`tel:${c.telefono_publico}`} className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gray-900 px-3 py-1.5 rounded-lg no-underline">
                      <Phone size={10} /> {c.telefono_publico}
                    </a>
                  )}
                </div>
              ))}
              {centros.length > pageC * PAGE_SIZE && (
                <button onClick={() => setPageC(p => p + 1)} className="w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl bg-white">
                  {es ? `Ver más (${centros.length - pageC * PAGE_SIZE})` : `Show more (${centros.length - pageC * PAGE_SIZE})`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Formulario mensaje familiar ───────────────────────────────────────────────
function FormMensajeFamiliar({ es, onBack }) {
  const [form, setForm] = useState({ mi_nombre: '', mi_telefono: '', mi_email: '', mi_ciudad: '', mi_pais: '' });
  const [familiares, setFamiliares] = useState([{ nombre: '', apellido: '', relacion: '', edad: '', ultima_ubicacion: '' }]);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setFamiliar = (i, k, v) => setFamiliares(prev => prev.map((f, idx) => idx === i ? { ...f, [k]: v } : f));
  const addFamiliar = () => setFamiliares(prev => [...prev, { nombre: '', apellido: '', relacion: '', edad: '', ultima_ubicacion: '' }]);
  const removeFamiliar = (i) => setFamiliares(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(false);
    try {
      for (const fam of familiares) {
        if (!fam.nombre) continue;
        await base44.entities.AlertaFamiliar.create({
          persona_buscada_nombre: fam.nombre,
          persona_buscada_apellido: fam.apellido,
          persona_buscada_edad: fam.edad,
          ultima_ubicacion: fam.ultima_ubicacion,
          familiar_nombre: form.mi_nombre,
          familiar_relacion: fam.relacion,
          familiar_telefono: form.mi_telefono,
          familiar_email: form.mi_email,
          familiar_ciudad: form.mi_ciudad,
          familiar_pais: form.mi_pais,
          esta_fuera_zona: true,
          mensaje_para_buscado: mensaje || (es ? 'Estoy fuera de la zona. Estoy bien. Te estoy buscando.' : "I'm outside the area. I'm safe. I'm looking for you."),
          estado_alerta: 'activa',
        });
      }
      setOk(true);
    } catch {
      setError(true);
    }
    setEnviando(false);
  };

  if (ok) return (
    <div className="text-center py-8 space-y-3">
      <p className="text-4xl">✅</p>
      <p className="text-lg font-black text-[#1A1F2E]">{es ? 'Mensaje registrado.' : 'Message registered.'}</p>
      <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
        {es
          ? 'Si tu familiar usa CRIS, podremos mostrarle que lo estás buscando.'
          : 'If your family member uses CRIS, we can show them that you are looking for them.'}
      </p>
      <button onClick={onBack} className="text-sm text-gray-400 underline cursor-pointer">{es ? '← Volver' : '← Back'}</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
        <p className="text-xs text-blue-800 font-medium">🔒 {es ? 'Tus datos no se publicarán públicamente.' : 'Your data will not be shown publicly.'}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-black text-[#1A1F2E]">{es ? '1. Tu información' : '1. Your information'}</p>
        <input placeholder={es ? 'Tu nombre' : 'Your name'} value={form.mi_nombre} onChange={e => set('mi_nombre', e.target.value)} className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder={es ? 'Tu teléfono' : 'Your phone'} value={form.mi_telefono} onChange={e => set('mi_telefono', e.target.value)} className={inputCls} />
          <input type="email" placeholder={es ? 'Tu email' : 'Your email'} value={form.mi_email} onChange={e => set('mi_email', e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder={es ? 'Tu ciudad' : 'Your city'} value={form.mi_ciudad} onChange={e => set('mi_ciudad', e.target.value)} className={inputCls} />
          <input placeholder={es ? 'País' : 'Country'} value={form.mi_pais} onChange={e => set('mi_pais', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-black text-[#1A1F2E]">{es ? '2. ¿A quién buscas?' : '2. Who are you looking for?'}</p>
        {familiares.map((fam, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500">{es ? `Familiar ${i + 1}` : `Family member ${i + 1}`}</p>
              {familiares.length > 1 && (
                <button type="button" onClick={() => removeFamiliar(i)} className="text-red-500 cursor-pointer"><Trash2 size={14} /></button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={es ? 'Nombre' : 'First name'} value={fam.nombre} onChange={e => setFamiliar(i, 'nombre', e.target.value)} className={inputCls} />
              <input placeholder={es ? 'Apellido' : 'Last name'} value={fam.apellido} onChange={e => setFamiliar(i, 'apellido', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={fam.relacion} onChange={e => setFamiliar(i, 'relacion', e.target.value)} className={inputCls}>
                <option value="">{es ? 'Relación' : 'Relation'}</option>
                {(es ? RELACION : RELACION_EN).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input placeholder={es ? 'Edad aprox.' : 'Approx. age'} value={fam.edad} onChange={e => setFamiliar(i, 'edad', e.target.value)} className={inputCls} />
            </div>
            <input placeholder={es ? 'Última ubicación conocida' : 'Last known location'} value={fam.ultima_ubicacion} onChange={e => setFamiliar(i, 'ultima_ubicacion', e.target.value)} className={inputCls} />
          </div>
        ))}
        <button type="button" onClick={addFamiliar}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 cursor-pointer">
          <Plus size={14} /> {es ? 'Agregar otro familiar' : 'Add another family member'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-bold text-[#1A1F2E] mb-1.5">{es ? 'Mensaje para ellos (opcional)' : 'Message for them (optional)'}</label>
        <textarea rows={3}
          placeholder={es ? 'Estoy fuera de la zona. Estoy bien. Te estoy buscando...' : "I'm outside the area. I'm safe. I'm looking for you..."}
          value={mensaje} onChange={e => setMensaje(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none resize-none" />
      </div>

      {error && <p className="text-xs text-red-600 font-semibold">⚠️ {es ? 'Error al enviar. Intenta de nuevo.' : 'Error submitting. Try again.'}</p>}

      <button type="submit" disabled={enviando}
        className="w-full bg-[#1A1F2E] text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50">
        {enviando ? <Loader2 size={18} className="animate-spin" /> : '💬'}
        {es ? 'Registrar mensaje' : 'Register message'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-400 py-2 cursor-pointer">{es ? '← Volver' : '← Back'}</button>
    </form>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function FueraZona() {
  const { lang } = useLang();
  const es = lang === 'es';
  const { lowBw } = useLowBw();
  const [accion, setAccion] = useState(null);

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-xl font-black text-[#1A1F2E] mb-1">
          ✈️ {es ? 'Fuera de la zona / Quiero ayudar' : "Outside the area / I want to help"}
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          {es
            ? 'Estás a salvo o fuera de la zona afectada. Selecciona lo que necesitas hacer.'
            : 'You are safe or outside the affected area. Select what you need to do.'}
        </p>

        {/* Selector de acción */}
        {!accion && (
          <div className="space-y-3">
            {ACCIONES.map(a => (
              <button
                key={a.id}
                onClick={() => setAccion(a.id)}
                className="w-full flex items-center gap-4 rounded-2xl p-4 text-left border-0 cursor-pointer"
                style={{ background: a.bg }}
              >
                <span className="text-3xl flex-shrink-0">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-base text-white leading-tight">{es ? a.es : a.en}</p>
                  {!lowBw && (
                    <p className="text-xs mt-0.5 text-white opacity-60">{es ? a.sub_es : a.sub_en}</p>
                  )}
                </div>
                <span className="text-white opacity-40 text-xl flex-shrink-0">›</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Buscar / Consultar ── */}
        {(accion === 'buscar' || accion === 'consultar') && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>
            <h2 className="text-base font-black text-[#1A1F2E] mb-1">
              {accion === 'buscar' ? '🔎' : '📋'}{' '}
              {es
                ? (accion === 'buscar' ? 'Buscar persona' : 'Consultar información')
                : (accion === 'buscar' ? 'Search person' : 'Search information')}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {es
                ? 'Escribe el nombre de una persona, ciudad, barrio o zona.'
                : 'Enter the name of a person, city, neighborhood, or area.'}
            </p>
            <BuscadorUnificado es={es} lowBw={lowBw} />

            <div className="mt-5 border-t border-gray-200 pt-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{es ? 'Acciones adicionales' : 'Additional actions'}</p>
              <Link to="/personas" className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 no-underline">
                <span className="text-sm font-semibold text-[#1A1F2E]">👤 {es ? 'Directorio completo de personas' : 'Full people directory'}</span>
                <span className="text-gray-400">›</span>
              </Link>
              <Link to="/edificios" className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 no-underline">
                <span className="text-sm font-semibold text-[#1A1F2E]">🏗️ {es ? 'Estado de edificios' : 'Building status'}</span>
                <span className="text-gray-400">›</span>
              </Link>
              <Link to="/centros-apoyo" className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 no-underline">
                <span className="text-sm font-semibold text-[#1A1F2E]">🏥 {es ? 'Directorio de centros de apoyo' : 'Help centers directory'}</span>
                <span className="text-gray-400">›</span>
              </Link>
              <Link to="/buscar-persona" className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 no-underline">
                <span className="text-sm font-bold text-[#6C3483]">+ {es ? 'Registrar persona buscada' : 'Register missing person'}</span>
                <span className="text-purple-400">›</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── Dejar mensaje ── */}
        {accion === 'mensaje' && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>
            <h2 className="text-base font-black text-[#1A1F2E] mb-1">💬 {es ? 'Dejar mensaje para mi familiar' : 'Leave message for my family'}</h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              {es
                ? 'Registra que estás buscando a alguien. Si tu familiar usa CRIS, podremos conectarlos.'
                : 'Register that you are looking for someone. If your family member uses CRIS, we can connect you.'}
            </p>
            <FormMensajeFamiliar es={es} onBack={() => setAccion(null)} />
          </div>
        )}

        {/* ── Voluntario / Ayudar ── */}
        {accion === 'ayudar' && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center space-y-3 mb-4">
              <p className="text-4xl">🤝</p>
              <p className="font-black text-lg text-[#1A1F2E]">{es ? '¡Gracias por querer ayudar!' : 'Thank you for wanting to help!'}</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {es
                  ? 'Puedes contribuir reportando personas encontradas, registrando centros de ayuda o cargando listados institucionales.'
                  : 'You can contribute by reporting found people, registering help centers, or uploading institutional lists.'}
              </p>
            </div>
            <div className="space-y-2">
              <Link to="/reportar-encontrado" className="block bg-[#1A7A4A] text-white font-black py-4 rounded-2xl text-center text-sm no-underline">
                🙋 {es ? 'Reportar persona encontrada' : 'Report found person'}
              </Link>
              <Link to="/institucional" className="block bg-[#1A5276] text-white font-bold py-4 rounded-2xl text-center text-sm no-underline">
                🏛️ {es ? 'Registrar centro de apoyo' : 'Register help center'}
              </Link>
              <Link to="/voluntario" className="block bg-white border-2 border-gray-200 text-[#1A1F2E] font-bold py-4 rounded-2xl text-center text-sm no-underline">
                📋 {es ? 'Cargar listado institucional' : 'Upload institutional list'}
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}