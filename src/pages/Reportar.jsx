import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const TIPOS = ['Edificio dañado', 'Personas atrapadas', 'Riesgo de gas', 'Riesgo eléctrico', 'Incendio', 'Inundación', 'Derrumbe', 'Otro'];
const TIPOS_EN = ['Damaged building', 'Trapped people', 'Gas hazard', 'Electrical hazard', 'Fire', 'Flood', 'Collapse', 'Other'];
const NIVELES = [
  { val: 'leve', es: 'Leve', en: 'Minor' },
  { val: 'moderado', es: 'Moderado', en: 'Moderate' },
  { val: 'grave', es: 'Grave', en: 'Severe' },
  { val: 'critico', es: 'Crítico', en: 'Critical' },
  { val: 'no_sabe', es: 'No sé', en: "Don't know" },
];
const PERSONAS = [
  { val: 'si', es: 'Sí', en: 'Yes' },
  { val: 'no', es: 'No', en: 'No' },
  { val: 'voces', es: 'Escuché voces', en: 'Heard voices' },
  { val: 'no_sabe', es: 'No sé', en: "Don't know" },
];

export default function Reportar() {
  const { t, lang } = useLang();
  const { lowBw } = useLowBw();
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">{t.enviado_ok}</h2>
        <Link to="/" className="mt-6 inline-block bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">{t.btn_volver}</Link>
      </div>
    </div>
  );

  const tipos = lang === 'es' ? TIPOS : TIPOS_EN;

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        {/* Back */}
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {t.btn_volver}
        </Link>

        {/* Title */}
        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">{t.report_title}</h1>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">{t.report_desc}</p>

        {/* Safety warning */}
        <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 mb-4">
          <AlertTriangle size={16} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] leading-relaxed">{t.report_warning}</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-[#EDEBE8] mb-5 bg-white">
          <button
            type="button"
            onClick={() => setModoRapido(true)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${modoRapido ? 'bg-[#1A1F2E] text-white' : 'text-gray-500'}`}
          >{t.modo_rapido}</button>
          <button
            type="button"
            onClick={() => setModoRapido(false)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${!modoRapido ? 'bg-[#1A1F2E] text-white' : 'text-gray-500'}`}
          >{t.modo_completo}</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_tipo} *</label>
            <select
              required
              value={form.tipo_reporte}
              onChange={e => set('tipo_reporte', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            >
              <option value="">{lang === 'es' ? 'Seleccionar...' : 'Select...'}</option>
              {tipos.map((t, i) => <option key={i} value={TIPOS[i]}>{t}</option>)}
            </select>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_dir} *</label>
            <input
              required
              placeholder={lang === 'es' ? 'Ej: Av. Libertador, edificio azul, frente al banco...' : 'E.g: Av. Libertador, blue building, across from bank...'}
              value={form.direccion}
              onChange={e => set('direccion', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            />
          </div>

          {/* Ciudad + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_ciudad} *</label>
              <input
                required
                placeholder="Caracas"
                value={form.ciudad}
                onChange={e => set('ciudad', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_estado} *</label>
              <input
                required
                placeholder="Miranda"
                value={form.estado_region}
                onChange={e => set('estado_region', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
          </div>

          {/* Nivel daño */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{t.field_nivel_dano}</label>
            <div className="flex flex-wrap gap-2">
              {NIVELES.map(n => (
                <button
                  key={n.val}
                  type="button"
                  onClick={() => set('nivel_dano', n.val)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    form.nivel_dano === n.val
                      ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                      : 'bg-white border-[#EDEBE8] text-gray-600'
                  }`}
                >{lang === 'es' ? n.es : n.en}</button>
              ))}
            </div>
          </div>

          {/* Personas atrapadas */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{t.field_personas}</label>
            <div className="flex flex-wrap gap-2">
              {PERSONAS.map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => set('personas_atrapadas', p.val)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    form.personas_atrapadas === p.val
                      ? p.val === 'si' ? 'bg-[#B83A52] text-white border-[#B83A52]' : 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                      : 'bg-white border-[#EDEBE8] text-gray-600'
                  }`}
                >{lang === 'es' ? p.es : p.en}</button>
              ))}
            </div>
          </div>

          {/* Riesgos */}
          {!modoRapido && (
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{t.field_riesgos}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'riesgo_gas', es: '💨 Gas', en: '💨 Gas' },
                  { key: 'riesgo_electrico', es: '⚡ Eléctrico', en: '⚡ Electrical' },
                  { key: 'riesgo_incendio', es: '🔥 Incendio', en: '🔥 Fire' },
                ].map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => set(r.key, !form[r.key])}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      form[r.key] ? 'bg-[#D48C2E] text-white border-[#D48C2E]' : 'bg-white border-[#EDEBE8] text-gray-600'
                    }`}
                  >{lang === 'es' ? r.es : r.en}</button>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_desc}</label>
            <textarea
              rows={3}
              placeholder={lang === 'es' ? 'Describe lo que viste...' : 'Describe what you saw...'}
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none"
            />
          </div>

          {/* Contacto */}
          {!modoRapido && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_nombre}</label>
                <input
                  placeholder={lang === 'es' ? 'Tu nombre...' : 'Your name...'}
                  value={form.nombre_reportante}
                  onChange={e => set('nombre_reportante', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_tel}</label>
                <input
                  placeholder="+58..."
                  value={form.telefono_reportante}
                  onChange={e => set('telefono_reportante', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
            </div>
          )}

          {/* Fotos — Drive */}
          {!lowBw && (
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {lang === 'es' ? 'Fotos del lugar (máx. 5)' : 'Photos of the site (max 5)'}
              </label>
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
            <div className="bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52]">
              {t.enviado_err}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || !form.tipo_reporte || !form.direccion || !form.ciudad || !form.estado_region}
            className="w-full bg-[#B83A52] hover:bg-[#9e3046] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
          >
            {enviando ? <Loader2 size={18} className="animate-spin" /> : '🚨'}
            {t.btn_enviar}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}