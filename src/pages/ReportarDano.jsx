import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const TIPO_REPORTE = [
  { val: 'grietas',       es: '🏚️ Edificio con grietas',           en: '🏚️ Building with cracks' },
  { val: 'colapso_parcial',es:'🏗️ Edificio parcialmente colapsado', en: '🏗️ Partially collapsed building' },
  { val: 'colapso_total', es: '💥 Edificio totalmente colapsado',    en: '💥 Totally collapsed building' },
  { val: 'vivienda',      es: '🏠 Vivienda dañada',                 en: '🏠 Damaged home' },
  { val: 'calle',         es: '🛣️ Calle bloqueada',                 en: '🛣️ Blocked street' },
  { val: 'puente',        es: '🌉 Puente o vía dañada',             en: '🌉 Damaged bridge or road' },
  { val: 'electrico',     es: '⚡ Poste o cable eléctrico caído',    en: '⚡ Fallen pole or power line' },
  { val: 'gas',           es: '💨 Fuga de gas',                     en: '💨 Gas leak' },
  { val: 'incendio',      es: '🔥 Riesgo de incendio',             en: '🔥 Fire hazard' },
  { val: 'atrapados',     es: '🆘 Personas atrapadas',             en: '🆘 Trapped people' },
  { val: 'otro',          es: '📋 Otro',                            en: '📋 Other' },
];

const NIVEL_DANO = [
  { val: 'leve',     es: 'Leve — grietas menores, estructura en pie',    en: 'Minor — small cracks, structure standing', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  { val: 'moderado', es: 'Moderado — paredes dañadas, riesgo visible',   en: 'Moderate — damaged walls, visible risk',   color: 'bg-orange-50 border-orange-300 text-orange-800' },
  { val: 'grave',    es: 'Grave — parte del edificio colapsó',           en: 'Severe — part of the building collapsed',  color: 'bg-red-50 border-red-300 text-red-800' },
  { val: 'critico',  es: 'Crítico — colapso total o personas atrapadas', en: 'Critical — total collapse or trapped people', color: 'bg-red-100 border-red-500 text-red-900' },
  { val: 'no_sabe',  es: 'No sé evaluar',                               en: "I can't evaluate",                         color: 'bg-gray-50 border-gray-300 text-gray-700' },
];

const ATRAPADOS = [
  { val: 'si',       es: 'Sí, confirmado',                     en: 'Yes, confirmed',              color: 'border-red-500 bg-red-50 text-red-800' },
  { val: 'no',       es: 'No',                                  en: 'No',                          color: 'border-green-400 bg-green-50 text-green-800' },
  { val: 'no_sabe',  es: 'No se sabe',                          en: 'Unknown',                     color: 'border-gray-300 bg-gray-50 text-gray-700' },
  { val: 'voces',    es: 'Se escuchan voces o golpes',           en: 'Voices or knocking heard',    color: 'border-red-500 bg-red-50 text-red-800' },
  { val: 'familiares',es:'Familiares reportan personas dentro',  en: 'Family reports people inside', color: 'border-orange-400 bg-orange-50 text-orange-800' },
];

const ACCESO = [
  { val: 'accesible',   es: '✅ Sí, accesible',          en: '✅ Yes, accessible' },
  { val: 'pie',         es: '🚶 Solo a pie',             en: '🚶 On foot only' },
  { val: 'bloqueado',   es: '🚧 Calle bloqueada',        en: '🚧 Blocked street' },
  { val: 'maquinaria',  es: '🚛 Requiere maquinaria',    en: '🚛 Requires machinery' },
  { val: 'electrico',   es: '⚡ Riesgo eléctrico',        en: '⚡ Electrical hazard' },
  { val: 'gas',         es: '💨 Riesgo de gas',           en: '💨 Gas hazard' },
  { val: 'incendio',    es: '🔥 Riesgo de incendio',     en: '🔥 Fire hazard' },
];

const ROL = [
  { val: 'vecino',      es: 'Vecino/a',           en: 'Neighbor' },
  { val: 'familiar',    es: 'Familiar',           en: 'Family member' },
  { val: 'rescatista',  es: 'Rescatista',         en: 'Rescuer' },
  { val: 'medico',      es: 'Médico/a',           en: 'Medical staff' },
  { val: 'bombero',     es: 'Bombero/a',          en: 'Firefighter' },
  { val: 'voluntario',  es: 'Voluntario/a',       en: 'Volunteer' },
  { val: 'institucion', es: 'Institución',        en: 'Institution' },
  { val: 'otro',        es: 'Otro',               en: 'Other' },
];

const CRITICOS = ['colapso_total', 'atrapados', 'gas', 'incendio', 'electrico'];
const CRITICOS_ATRAPADOS = ['si', 'voces', 'familiares'];

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

function genCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function ReportarDano() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState('');
  const [nivel, setNivel] = useState('');
  const [atrapados, setAtrapados] = useState('');
  const [acceso, setAcceso] = useState([]);
  const [form, setForm] = useState({ direccion: '', ciudad: '', estado_region: '', referencia: '', descripcion: '', nombre: '', contacto: '', rol: '' });
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAcceso = (v) => setAcceso(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const esCritico = CRITICOS.includes(tipo) || CRITICOS_ATRAPADOS.includes(atrapados) || nivel === 'critico';

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      set('referencia', `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
    });
  };

  const handleSubmit = async () => {
    setEnviando(true);
    const codigoNuevo = genCodigo();
    try {
      await base44.entities.ReportesDano.create({
        tipo_estructura: tipo || 'otro',
        nivel_dano: nivel || 'no_evaluado',
        personas_atrapadas: atrapados || 'no_sabe',
        acceso_sitio: acceso,
        direccion: form.direccion,
        ciudad: form.ciudad,
        estado_region: form.estado_region,
        referencia: form.referencia,
        descripcion: form.descripcion,
        reportante_nombre: form.nombre,
        prioridad: esCritico ? 'critica' : (nivel === 'grave' ? 'alta' : 'normal'),
        estado_verificacion: 'recibido',
        nivel_verificacion: 'sin_verificar',
        fuente: 'ciudadano',
      });
      setCodigo(codigoNuevo);
    } catch {}
    setEnviando(false);
  };

  if (codigo) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-4 py-12 max-w-sm mx-auto w-full">
        <div className="text-6xl">{esCritico ? '🚨' : '✅'}</div>
        <h2 className="text-2xl font-black text-[#1A1F2E]">
          {esCritico ? (es ? '¡Alerta crítica enviada!' : 'Critical alert sent!') : (es ? 'Reporte enviado.' : 'Report sent.')}
        </h2>
        {esCritico && (
          <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 w-full">
            <p className="text-sm font-bold text-[#B83A52]">
              {es
                ? '⚠️ Este reporte fue marcado como CRÍTICO y notificado al equipo de respuesta.'
                : '⚠️ This report was marked CRITICAL and notified to the response team.'}
            </p>
          </div>
        )}
        <div className="bg-white border-2 border-[#1A1F2E] rounded-2xl p-4 w-full">
          <p className="text-xs text-gray-500 mb-1">{es ? 'Tu código de seguimiento:' : 'Your tracking code:'}</p>
          <p className="text-3xl font-black text-[#1A1F2E] tracking-widest">{codigo}</p>
          <p className="text-xs text-gray-400 mt-1">{es ? 'Guárdalo para consultar actualizaciones' : 'Save it to check updates'}</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {es
            ? 'Advertencia: No entres a estructuras dañadas. Si hay peligro inmediato, contacta a Protección Civil o Bomberos.'
            : 'Warning: Do not enter damaged structures. If there is immediate danger, contact Civil Protection or Firefighters.'}
        </p>
        <Link to="/" className="w-full bg-[#1A1F2E] text-white font-black py-4 rounded-2xl text-base">
          {es ? 'Volver al inicio' : 'Back to home'}
        </Link>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-xl font-black text-[#1A1F2E] mb-1">
          🚨 {es ? 'Reportar daño o riesgo' : 'Report damage or risk'}
        </h1>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          {es
            ? 'Usa este formulario para reportar daños visibles, personas atrapadas o riesgos. No entres a edificios dañados.'
            : 'Use this form to report visible damage, trapped people or hazards. Do not enter damaged buildings.'}
        </p>

        {/* Advertencia edificios */}
        <div className="flex gap-2 bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl px-4 py-3 mb-4">
          <AlertTriangle size={16} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] font-semibold leading-relaxed">
            {es
              ? 'No entres a estructuras dañadas. Si hay grietas graves, colapso, gas, cables o personas atrapadas — espera a Protección Civil, Bomberos o rescatistas.'
              : 'Do not enter damaged structures. If there are major cracks, collapse, gas, wires or trapped people — wait for Civil Protection, firefighters or rescue teams.'}
          </p>
        </div>

        {/* Progreso */}
        <div className="flex gap-1 mb-5">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${paso >= n ? 'bg-[#B83A52]' : 'bg-[#EDEBE8]'}`} />
          ))}
        </div>

        <div className="space-y-4">

          {/* PASO 1: Tipo */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4">
            <h3 className="text-sm font-black text-[#1A1F2E] mb-3">
              1. {es ? '¿Qué estás reportando?' : 'What are you reporting?'} <span className="text-[#B83A52]">*</span>
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {TIPO_REPORTE.map(t => (
                <button key={t.val} type="button" onClick={() => { setTipo(t.val); setPaso(Math.max(paso, 2)); }}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border-2 text-left transition-colors cursor-pointer ${
                    tipo === t.val ? 'bg-[#B83A52] text-white border-[#B83A52]' : 'bg-white border-[#EDEBE8] text-gray-700 hover:border-gray-400'
                  }`}>
                  {es ? t.es : t.en}
                </button>
              ))}
            </div>
          </div>

          {/* PASO 2: Nivel de daño */}
          {paso >= 2 && (
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4">
              <h3 className="text-sm font-black text-[#1A1F2E] mb-3">
                2. {es ? 'Nivel de daño visible' : 'Visible damage level'} <span className="text-[#B83A52]">*</span>
              </h3>
              <div className="flex flex-col gap-2">
                {NIVEL_DANO.map(n => (
                  <button key={n.val} type="button" onClick={() => { setNivel(n.val); setPaso(Math.max(paso, 3)); }}
                    className={`py-3 px-4 rounded-xl text-sm font-bold border-2 text-left transition-colors cursor-pointer ${
                      nivel === n.val ? n.color + ' border-2' : 'bg-white border-[#EDEBE8] text-gray-700'
                    }`}>
                    {es ? n.es : n.en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3: Atrapados */}
          {paso >= 3 && (
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4">
              <h3 className="text-sm font-black text-[#1A1F2E] mb-3">
                3. {es ? '¿Hay personas atrapadas?' : 'Are there trapped people?'} <span className="text-[#B83A52]">*</span>
              </h3>
              <div className="flex flex-col gap-2">
                {ATRAPADOS.map(a => (
                  <button key={a.val} type="button" onClick={() => { setAtrapados(a.val); setPaso(Math.max(paso, 4)); }}
                    className={`py-3 px-4 rounded-xl text-sm font-bold border-2 text-left transition-colors cursor-pointer ${
                      atrapados === a.val ? a.color : 'bg-white border-[#EDEBE8] text-gray-700'
                    }`}>
                    {es ? a.es : a.en}
                  </button>
                ))}
              </div>
              {CRITICOS_ATRAPADOS.includes(atrapados) && (
                <div className="mt-3 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl px-3 py-2">
                  <p className="text-xs text-[#B83A52] font-bold">
                    🚨 {es
                      ? 'ALERTA CRÍTICA — Este reporte será enviado inmediatamente al equipo de respuesta.'
                      : 'CRITICAL ALERT — This report will be immediately sent to the response team.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASO 4: Acceso y ubicación */}
          {paso >= 4 && (
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
              <h3 className="text-sm font-black text-[#1A1F2E]">
                4. {es ? 'Acceso y ubicación' : 'Access and location'} <span className="text-[#B83A52]">*</span>
              </h3>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">{es ? '¿El sitio es accesible?' : 'Is the site accessible?'}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ACCESO.map(a => (
                    <button key={a.val} type="button" onClick={() => toggleAcceso(a.val)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border-2 text-left cursor-pointer ${acceso.includes(a.val) ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'}`}>
                      {es ? a.es : a.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1F2E] mb-1.5">
                  {es ? 'Dirección o referencia' : 'Address or reference'} <span className="text-[#B83A52]">*</span>
                </label>
                <input value={form.direccion} onChange={e => set('direccion', e.target.value)} required
                  placeholder={es ? 'Ej: Edif. Las Torres, Av. Principal, frente al metro' : 'E.g: Las Torres building, Main Ave, next to metro'}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1F2E] mb-1.5">{es ? 'Ciudad' : 'City'} <span className="text-[#B83A52]">*</span></label>
                  <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} required placeholder="La Guaira" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1F2E] mb-1.5">{es ? 'Estado' : 'State'} <span className="text-[#B83A52]">*</span></label>
                  <input value={form.estado_region} onChange={e => set('estado_region', e.target.value)} required placeholder="Vargas" className={inputCls} />
                </div>
              </div>
              <button type="button" onClick={handleGPS}
                className="flex items-center gap-2 text-xs font-bold text-[#1A4A8A] bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl w-full justify-center">
                <MapPin size={14} /> {es ? 'Usar mi ubicación GPS ahora' : 'Use my GPS location now'}
              </button>
              {form.referencia && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-xl">📍 {form.referencia}</p>}
            </div>
          )}

          {/* PASO 5: Datos del reportante */}
          {paso >= 4 && (
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
              <h3 className="text-sm font-black text-[#1A1F2E]">
                5. {es ? 'Tus datos (privados, nunca públicos)' : 'Your data (private, never public)'}
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <p className="text-xs text-blue-800 font-medium">
                  🔒 {es ? 'Tu nombre y contacto son privados. Solo lo ven los moderadores.' : 'Your name and contact are private. Only moderators see them.'}
                </p>
              </div>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                className={inputCls} />
              <input value={form.contacto} onChange={e => set('contacto', e.target.value)}
                placeholder={es ? 'Teléfono, WhatsApp o email (opcional)' : 'Phone, WhatsApp or email (optional)'}
                className={inputCls} />
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">{es ? 'Tu rol:' : 'Your role:'}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROL.map(r => (
                    <button key={r.val} type="button" onClick={() => set('rol', r.val)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border-2 cursor-pointer ${form.rol === r.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'}`}>
                      {es ? r.es : r.en}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1A1F2E] mb-1.5">
                  {es ? 'Descripción breve (máx. 200 caracteres, opcional)' : 'Brief description (max 200 chars, optional)'}
                </label>
                <textarea rows={3} maxLength={200} value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                  placeholder={es ? 'Describe brevemente lo que ves...' : 'Briefly describe what you see...'}
                  className="w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none placeholder-gray-400" />
                <p className="text-right text-[10px] text-gray-400">{form.descripcion.length}/200</p>
              </div>
            </div>
          )}

          {/* Botón enviar */}
          {tipo && nivel && atrapados && form.direccion && form.ciudad && form.estado_region && (
            <button
              type="button"
              onClick={() => { setPaso(5); handleSubmit(); }}
              disabled={enviando}
              className={`w-full font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${
                esCritico
                  ? 'bg-[#B83A52] hover:bg-[#9e3046] text-white'
                  : 'bg-[#1A1F2E] hover:bg-[#2d3549] text-white'
              }`}>
              {enviando ? <Loader2 size={20} className="animate-spin" /> : (esCritico ? '🚨' : '📋')}
              {esCritico
                ? (es ? 'Enviar alerta crítica' : 'Send critical alert')
                : (es ? 'Enviar reporte' : 'Submit report')}
            </button>
          )}

          {(!tipo || !nivel || !atrapados || !form.direccion || !form.ciudad) && (
            <p className="text-center text-xs text-gray-400">
              {es ? 'Completa los campos marcados con * para enviar' : 'Fill in fields marked with * to submit'}
            </p>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}