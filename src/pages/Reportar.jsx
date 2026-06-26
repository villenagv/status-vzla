import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const TIPOS = [
  { val: 'Edificio dañado',     es: '🏚️ Edificio dañado',      en: '🏚️ Damaged building' },
  { val: 'Personas atrapadas',  es: '🆘 Personas atrapadas',   en: '🆘 Trapped people' },
  { val: 'Riesgo de gas',       es: '💨 Riesgo de gas',        en: '💨 Gas hazard' },
  { val: 'Riesgo eléctrico',    es: '⚡ Riesgo eléctrico',     en: '⚡ Electrical hazard' },
  { val: 'Incendio',            es: '🔥 Incendio',             en: '🔥 Fire' },
  { val: 'Inundación',          es: '🌊 Inundación',           en: '🌊 Flood' },
  { val: 'Derrumbe',            es: '⛰️ Derrumbe',            en: '⛰️ Collapse' },
  { val: 'Otro',                es: '📍 Otro',                 en: '📍 Other' },
];

const NIVELES = [
  { val: 'leve',     es: 'Leve',     en: 'Minor',       color: 'border-green-400 bg-green-50 text-green-800' },
  { val: 'moderado', es: 'Moderado', en: 'Moderate',    color: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
  { val: 'grave',    es: 'Grave',    en: 'Severe',      color: 'border-orange-400 bg-orange-50 text-orange-800' },
  { val: 'critico',  es: '🔴 Crítico', en: '🔴 Critical', color: 'border-red-500 bg-red-50 text-red-700' },
  { val: 'no_sabe',  es: 'No sé',    en: "Don't know",  color: 'border-gray-300 bg-gray-50 text-gray-600' },
];

const PERSONAS = [
  { val: 'si',      es: '🆘 SÍ, hay personas', en: '🆘 YES, people trapped', selected: 'bg-[#B83A52] border-[#B83A52] text-white' },
  { val: 'voces',   es: '👂 Escuché voces',    en: '👂 Heard voices',         selected: 'bg-[#D48C2E] border-[#D48C2E] text-white' },
  { val: 'no_sabe', es: 'No sé',               en: "Don't know",             selected: 'bg-gray-600 border-gray-600 text-white' },
  { val: 'no',      es: 'No',                  en: 'No',                     selected: 'bg-green-700 border-green-700 text-white' },
];

function FieldLabel({ label, required }) {
  return (
    <label className="block text-sm font-bold text-[#1A1F2E] mb-1.5">
      {label}{required && <span className="text-[#B83A52] ml-0.5">*</span>}
    </label>
  );
}

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

export default function Reportar() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [modoRapido, setModoRapido] = useState(true);
  const [form, setForm] = useState({
    tipo_reporte: '', nivel_dano: '', personas_atrapadas: '',
    riesgo_gas: false, riesgo_electrico: false, riesgo_incendio: false,
    direccion: '', ciudad: '', estado_region: '',
    descripcion: '', nombre_reportante: '', telefono_reportante: '',
    prioridad: 'normal',
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [fotoUrls, setFotoUrls] = useState([]);
  const [reporteId] = useState(() => `emergencia-${Date.now()}`);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcPrioridad = () => {
    if (form.personas_atrapadas === 'si' || form.nivel_dano === 'critico') return 'critica';
    if (form.nivel_dano === 'grave') return 'alta';
    return 'normal';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await base44.entities.InfraestructuraSos.create({
        ...form,
        prioridad: calcPrioridad(),
        estado_reporte: 'no_verificado',
        nivel_verificacion: 'comunidad',
        fuente: 'web_publica',
        foto_url: fotoUrls[0] || '',
      });
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-12 space-y-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-black text-[#1A1F2E]">
          {es ? 'Reporte enviado' : 'Report submitted'}
        </h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          {es
            ? 'Tu información ayudará a coordinar la respuesta. Gracias por reportar.'
            : 'Your information will help coordinate the response. Thank you for reporting.'}
        </p>
        <Link to="/" className="mt-4 bg-[#1A1F2E] text-white px-8 py-4 rounded-2xl font-bold text-base">
          {es ? 'Volver al inicio' : 'Back to home'}
        </Link>
      </div>
    </div>
  );

  const prioridadCalc = calcPrioridad();
  const esCritico = prioridadCalc === 'critica';

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E] cursor-pointer">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          🚨 {es ? 'Reportar emergencia' : 'Report emergency'}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Usa este formulario para reportar daños visibles, personas atrapadas o riesgos como gas, electricidad o colapso.'
            : 'Use this form to report visible damage, trapped people, or hazards like gas, electricity or collapse.'}
        </p>

        {/* Aviso de seguridad — edificios */}
        <div className="flex gap-3 bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 mb-5">
          <AlertTriangle size={18} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#B83A52] mb-0.5">
              {es ? 'NO entres a estructuras dañadas' : 'DO NOT enter damaged structures'}
            </p>
            <p className="text-xs text-[#B83A52] leading-relaxed">
              {es
                ? 'Si hay grietas graves, colapso, olor a gas, cables caídos o incendio — espera a Protección Civil, Bomberos o rescatistas.'
                : 'If there are major cracks, collapse, gas smell, fallen wires or fire — wait for Civil Protection, firefighters or rescue teams.'}
            </p>
          </div>
        </div>

        {/* Modo rápido / completo */}
        <div className="flex rounded-2xl overflow-hidden border-2 border-[#EDEBE8] mb-5 bg-white">
          <button
            type="button"
            onClick={() => setModoRapido(true)}
            className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${modoRapido ? 'bg-[#1A1F2E] text-white' : 'text-gray-500'}`}
          >⚡ {es ? 'Modo rápido' : 'Quick mode'}</button>
          <button
            type="button"
            onClick={() => setModoRapido(false)}
            className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${!modoRapido ? 'bg-[#1A1F2E] text-white' : 'text-gray-500'}`}
          >📋 {es ? 'Modo completo' : 'Full mode'}</button>
        </div>

        {/* Indicador de prioridad en tiempo real */}
        {esCritico && (
          <div className="bg-[#B83A52] text-white rounded-2xl px-4 py-3 mb-4 flex items-center gap-2 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {es ? 'Este reporte será marcado como CRÍTICO' : 'This report will be marked as CRITICAL'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Tipo de reporte */}
          <div>
            <FieldLabel label={es ? 'Tipo de emergencia' : 'Emergency type'} required />
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => set('tipo_reporte', t.val)}
                  className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 transition-colors text-left cursor-pointer ${
                    form.tipo_reporte === t.val
                      ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                      : 'bg-white border-[#EDEBE8] text-gray-700 hover:border-gray-400'
                  }`}
                >{es ? t.es : t.en}</button>
              ))}
            </div>
          </div>

          {/* Nivel de daño */}
          <div>
            <FieldLabel label={es ? 'Nivel de daño' : 'Damage level'} />
            <div className="flex flex-wrap gap-2">
              {NIVELES.map(n => (
                <button
                  key={n.val}
                  type="button"
                  onClick={() => set('nivel_dano', n.val)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${
                    form.nivel_dano === n.val ? n.color : 'bg-white border-[#EDEBE8] text-gray-600'
                  }`}
                >{es ? n.es : n.en}</button>
              ))}
            </div>
          </div>

          {/* Personas atrapadas */}
          <div>
            <FieldLabel label={es ? '¿Hay personas atrapadas?' : 'Are there trapped people?'} />
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => set('personas_atrapadas', p.val)}
                  className={`py-3 px-3 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${
                    form.personas_atrapadas === p.val ? p.selected : 'bg-white border-[#EDEBE8] text-gray-700'
                  }`}
                >{es ? p.es : p.en}</button>
              ))}
            </div>
          </div>

          {/* Riesgos adicionales (modo completo) */}
          {!modoRapido && (
            <div>
              <FieldLabel label={es ? 'Riesgos adicionales' : 'Additional hazards'} />
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'riesgo_gas',       es: '💨 Gas',       en: '💨 Gas' },
                  { key: 'riesgo_electrico',  es: '⚡ Eléctrico', en: '⚡ Electrical' },
                  { key: 'riesgo_incendio',   es: '🔥 Incendio',  en: '🔥 Fire' },
                ].map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => set(r.key, !form[r.key])}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${
                      form[r.key] ? 'bg-[#D48C2E] text-white border-[#D48C2E]' : 'bg-white border-[#EDEBE8] text-gray-600'
                    }`}
                  >{es ? r.es : r.en}</button>
                ))}
              </div>
            </div>
          )}

          {/* Ubicación */}
          <div className="space-y-3">
            <div>
              <FieldLabel label={es ? 'Dirección o referencia' : 'Address or landmark'} required />
              <input
                required
                placeholder={es ? 'Ej: Av. Libertador, edificio azul frente al banco' : 'E.g: Av. Libertador, blue building across from bank'}
                value={form.direccion}
                onChange={e => set('direccion', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label={es ? 'Ciudad' : 'City'} required />
                <input required placeholder="Caracas" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel label={es ? 'Estado' : 'State'} required />
                <input required placeholder="Miranda" value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <FieldLabel label={es ? 'Describe lo que ves (opcional)' : 'Describe what you see (optional)'} />
            <textarea
              rows={3}
              placeholder={es ? 'Ej: El piso 3 colapsó, hay grietas en las columnas, se escuchan voces adentro...' : 'E.g: 3rd floor collapsed, cracks in columns, voices can be heard inside...'}
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Contacto (modo completo) */}
          {!modoRapido && (
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
              <p className="text-sm font-bold text-[#1A1F2E]">{es ? 'Tu información de contacto (opcional, privada)' : 'Your contact info (optional, private)'}</p>
              <p className="text-xs text-gray-400">{es ? 'No se publicará.' : 'Will not be published.'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label={es ? 'Tu nombre' : 'Your name'} />
                  <input placeholder={es ? 'Nombre...' : 'Name...'} value={form.nombre_reportante} onChange={e => set('nombre_reportante', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <FieldLabel label={es ? 'Teléfono' : 'Phone'} />
                  <input placeholder="+58..." value={form.telefono_reportante} onChange={e => set('telefono_reportante', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* Fotos */}
          {!lowBw && (
            <div>
              <FieldLabel label={es ? 'Fotos del lugar (máx. 5, opcional)' : 'Photos of the site (max 5, optional)'} />
              <p className="text-xs text-gray-400 mb-2">{es ? 'No es obligatorio. Solo si tienes señal suficiente.' : 'Not required. Only if you have enough signal.'}</p>
              <FotosDragDrop
                category="emergencias"
                caseId={reporteId}
                caseLabel={`Emergencia-${form.ciudad || 'nuevo'}`}
                maxFiles={5}
                onUploaded={setFotoUrls}
                disabled={enviando}
              />
            </div>
          )}

          {resultado === 'err' && (
            <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 text-sm text-[#B83A52] font-medium">
              ⚠️ {es ? 'Error al enviar. Verifica tu conexión e intenta de nuevo.' : 'Error submitting. Check your connection and try again.'}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || !form.tipo_reporte || !form.direccion || !form.ciudad || !form.estado_region}
            className="w-full bg-[#B83A52] hover:bg-[#9e3046] disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {enviando ? <Loader2 size={20} className="animate-spin" /> : '🚨'}
            {es ? 'Enviar reporte de emergencia' : 'Submit emergency report'}
          </button>

          <p className="text-center text-xs text-gray-400">
            {es ? 'Tus datos de contacto no serán publicados.' : 'Your contact details will not be published.'}
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}