import { useState } from 'react';
import { Camera, X, Save, Loader2, MapPin } from 'lucide-react';
import { comprimirFoto } from '@/lib/comprimirFoto';

const RIESGO_OPTS = [
  { val: 'riesgo_colapso',  icon: '💥', es: 'Riesgo de colapso', en: 'Collapse risk',  nivel: 'critico',  prioridad: 'critica', border: '#EF4444', bg: '#FEF2F2', color: '#7F1D1D' },
  { val: 'riesgo_moderado', icon: '🟠', es: 'Riesgo moderado',   en: 'Moderate risk',  nivel: 'moderado', prioridad: 'alta',    border: '#FB923C', bg: '#FFF7ED', color: '#C2410C' },
  { val: 'solo_estetico',   icon: '🟢', es: 'Solo daño estético',en: 'Cosmetic only',  nivel: 'leve',     prioridad: 'normal',  border: '#4ADE80', bg: '#F0FDF4', color: '#15803D' },
];

const TIPO_OPTS = [
  { val: 'edificio_residencial', es: 'Edificio / Apt', en: 'Building / Apt' },
  { val: 'hospital',  es: 'Hospital',  en: 'Hospital' },
  { val: 'escuela',   es: 'Escuela',   en: 'School' },
  { val: 'comercio',  es: 'Comercio',  en: 'Business' },
  { val: 'otro',      es: 'Otro',      en: 'Other' },
];

const MAX_FOTOS = 5;

const VACIO = {
  tipo_estructura: 'edificio_residencial',
  nombre_lugar: '',
  direccion: '',
  ciudad: '',
  estado_region: '',
  triage_riesgo: '',
  personas_atrapadas: 'no_sabe',
  descripcion: '',
};

export default function InspeccionOfflineForm({ es, perfil, onGuardar }) {
  const [form, setForm] = useState(VACIO);
  const [fotos, setFotos] = useState([]);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const rsel = RIESGO_OPTS.find(o => o.val === form.triage_riesgo);

  const agregarFotos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    if (!archivos.length) return;
    setComprimiendo(true);
    const disponibles = MAX_FOTOS - fotos.length;
    const aProcesar = archivos.slice(0, disponibles);
    const comprimidas = [];
    for (const file of aProcesar) {
      try { comprimidas.push(await comprimirFoto(file)); } catch {}
    }
    setFotos(prev => [...prev, ...comprimidas]);
    setComprimiendo(false);
    e.target.value = '';
  };

  const capturarUbicacion = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const guardar = () => {
    if (!form.ciudad.trim() || !form.triage_riesgo) return;
    setGuardando(true);
    const data = {
      tipo_estructura: form.tipo_estructura,
      nombre_lugar: form.nombre_lugar.trim(),
      direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(),
      estado_region: form.estado_region.trim() || form.ciudad.trim(),
      descripcion: form.descripcion.trim(),
      personas_atrapadas: form.personas_atrapadas,
      triage_riesgo: form.triage_riesgo,
      nivel_dano: rsel?.nivel || 'no_evaluado',
      prioridad: rsel?.prioridad || 'normal',
      triage_estado: form.triage_riesgo === 'solo_estetico' ? 'clasificado' : 'en_cola_inspeccion',
      requiere_inspeccion_presencial: form.triage_riesgo !== 'solo_estetico',
      triage_por: perfil?.user_nombre || perfil?.user_email || '',
      triage_fecha: new Date().toISOString(),
      fuente: 'inspeccion_campo',
      ...(lat != null ? { lat, lng, geo_fuente: 'gps_inspector' } : {}),
    };
    onGuardar(data, fotos);
    setForm(VACIO);
    setFotos([]);
    setLat(null);
    setLng(null);
    setGuardando(false);
  };

  const puedeGuardar = form.ciudad.trim() && form.triage_riesgo;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs font-bold text-blue-800 mb-0.5">🏗️ {es ? 'Nueva inspección de campo' : 'New field inspection'}</p>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          {es ? 'Llena lo esencial y guarda en tu dispositivo. Funciona sin señal. Luego súbelas todas juntas.'
              : 'Fill the essentials and save on your device. Works without signal. Upload them all together later.'}
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

      {/* Nombre / dirección */}
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

      {/* Ubicación GPS */}
      <button onClick={capturarUbicacion} type="button"
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 cursor-pointer">
        <MapPin size={13} /> {lat != null ? (es ? `Ubicación guardada ✓` : 'Location saved ✓') : (es ? 'Capturar mi ubicación GPS' : 'Capture my GPS location')}
      </button>

      {/* Riesgo (triaje) */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{es ? 'Clasificación de riesgo *' : 'Risk classification *'}</label>
        <div className="space-y-1.5 mt-1.5">
          {RIESGO_OPTS.map(opt => (
            <button key={opt.val} onClick={() => set('triage_riesgo', opt.val)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 13px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${form.triage_riesgo === opt.val ? opt.border : '#E5E7EB'}`,
                background: form.triage_riesgo === opt.val ? opt.bg : '#fff',
              }}>
              <span style={{ fontSize: 14, marginRight: 6 }}>{opt.icon}</span>
              <span className="text-xs font-bold" style={{ color: form.triage_riesgo === opt.val ? opt.color : '#374151' }}>
                {es ? opt.es : opt.en}
              </span>
            </button>
          ))}
        </div>
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
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{es ? `Fotos (${fotos.length}/${MAX_FOTOS})` : `Photos (${fotos.length}/${MAX_FOTOS})`}</label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {fotos.map((f, i) => (
            <div key={i} className="relative">
              <img src={f} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
              <button onClick={() => setFotos(prev => prev.filter((_, x) => x !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer">
                <X size={11} />
              </button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <label className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:border-blue-400">
              {comprimiendo ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span className="text-[10px] mt-1">{es ? 'Tomar foto' : 'Take photo'}</span>
              <input type="file" accept="image/*" capture="environment" multiple onChange={agregarFotos} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <button onClick={guardar} disabled={!puedeGuardar || guardando}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
        {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {es ? 'Guardar en mi dispositivo' : 'Save on my device'}
      </button>
      {!puedeGuardar && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">{es ? 'Completa ciudad y clasificación de riesgo.' : 'Fill in city and risk classification.'}</p>
      )}
    </div>
  );
}