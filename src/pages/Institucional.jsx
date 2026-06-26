import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const TIPOS_LUGAR = [
  { es: 'Refugio', en: 'Shelter' },
  { es: 'Hospital', en: 'Hospital' },
  { es: 'Comedor', en: 'Food center' },
  { es: 'Centro de acopio', en: 'Supply depot' },
  { es: 'Centro de donaciones', en: 'Donation point' },
  { es: 'Albergue', en: 'Shelter/Hostel' },
  { es: 'Otro', en: 'Other' },
];

const SERVICIOS_ES = ['Agua potable', 'Comida', 'Camas', 'Atención médica', 'Medicamentos', 'Ropa', 'Carga de celular', 'Información', 'Transporte'];
const SERVICIOS_EN = ['Drinking water', 'Food', 'Beds', 'Medical care', 'Medicines', 'Clothing', 'Phone charging', 'Information', 'Transport'];

const ESTADOS_OP = [
  { val: 'abierto', es: '✅ Abierto', en: '✅ Open' },
  { val: 'saturado', es: '⚠️ Saturado', en: '⚠️ Saturated' },
  { val: 'cerrado', es: '🔒 Cerrado', en: '🔒 Closed' },
];

export default function Institucional() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    nombre_lugar: '', tipo_lugar: '', estado_operativo: 'abierto',
    capacidad_maxima: '', personas_actuales: '',
    servicios_disponibles: [], necesidades_urgentes: '',
    direccion: '', ciudad: '', estado_region: '',
    telefono_publico: '', whatsapp: '',
    descripcion_como_llegar: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [fotoUrls, setFotoUrls] = useState([]);
  const [sitioId] = useState(() => `punto-${Date.now()}`);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleServicio = (s) => {
    setForm(f => ({
      ...f,
      servicios_disponibles: f.servicios_disponibles.includes(s)
        ? f.servicios_disponibles.filter(x => x !== s)
        : [...f.servicios_disponibles, s]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await base44.entities.PuntosAyuda.create({
        ...form,
        personas_actuales: form.personas_actuales ? Number(form.personas_actuales) : undefined,
        fuente: 'registro_institucional',
        nivel_verificacion: 'no_verificado',
        ultima_actualizacion: new Date().toISOString(),
        foto_principal_url: fotoUrls[0] || '',
        fotos_adicionales_urls: fotoUrls.slice(1),
      });
      setResultado('ok');
    } catch {
      setResultado('err');
    } finally {
      setEnviando(false);
    }
  };

  const servicios = lang === 'es' ? SERVICIOS_ES : SERVICIOS_EN;

  if (resultado === 'ok') return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">{lang === 'es' ? 'Punto de ayuda registrado.' : 'Help point registered.'}</h2>
        <p className="text-sm text-gray-500 mb-6">{lang === 'es' ? 'Será verificado pronto y aparecerá públicamente.' : 'It will be verified soon and appear publicly.'}</p>
        <Link to="/" className="bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">{t.btn_volver}</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {t.btn_volver}
        </Link>

        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">{t.inst_title}</h1>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">{t.inst_desc}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_nombre_lugar} *</label>
            <input
              required
              placeholder={lang === 'es' ? 'Ej: Refugio Municipal El Valle' : 'E.g: El Valle Municipal Shelter'}
              value={form.nombre_lugar}
              onChange={e => set('nombre_lugar', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            />
          </div>

          {/* Tipo lugar */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{t.field_tipo_lugar} *</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_LUGAR.map(tl => (
                <button
                  key={tl.es}
                  type="button"
                  onClick={() => set('tipo_lugar', tl.es)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    form.tipo_lugar === tl.es
                      ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                      : 'bg-white border-[#EDEBE8] text-gray-600'
                  }`}
                >{lang === 'es' ? tl.es : tl.en}</button>
              ))}
            </div>
          </div>

          {/* Estado operativo */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{t.field_estado_op}</label>
            <div className="flex gap-2">
              {ESTADOS_OP.map(e => (
                <button
                  key={e.val}
                  type="button"
                  onClick={() => set('estado_operativo', e.val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm border font-medium transition-colors ${
                    form.estado_operativo === e.val
                      ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                      : 'bg-white border-[#EDEBE8] text-gray-600'
                  }`}
                >{lang === 'es' ? e.es : e.en}</button>
              ))}
            </div>
          </div>

          {/* Capacidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_capacidad}</label>
              <input
                type="number"
                placeholder="100"
                value={form.capacidad_maxima}
                onChange={e => set('capacidad_maxima', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{lang === 'es' ? 'Personas ahora' : 'People now'}</label>
              <input
                type="number"
                placeholder="45"
                value={form.personas_actuales}
                onChange={e => set('personas_actuales', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
          </div>

          {/* Servicios */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{t.field_servicios}</label>
            <div className="flex flex-wrap gap-2">
              {servicios.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleServicio(SERVICIOS_ES[i])}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    form.servicios_disponibles.includes(SERVICIOS_ES[i])
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white border-[#EDEBE8] text-gray-600'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_dir} *</label>
            <input
              required
              placeholder={lang === 'es' ? 'Calle, edificio, referencia visible...' : 'Street, building, visible landmark...'}
              value={form.direccion}
              onChange={e => set('direccion', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            />
          </div>

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

          {/* Contacto */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{t.field_contacto}</label>
            <input
              placeholder="WhatsApp o teléfono público"
              value={form.whatsapp || form.telefono_publico}
              onChange={e => set('whatsapp', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            />
          </div>

          {/* Cómo llegar */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
              {lang === 'es' ? 'Cómo llegar (opcional)' : 'How to get there (optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={lang === 'es' ? 'Instrucciones claras para llegar al lugar...' : 'Clear directions to reach the place...'}
              value={form.descripcion_como_llegar}
              onChange={e => set('descripcion_como_llegar', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none"
            />
          </div>

          {/* Fotos — Drive */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
              {lang === 'es' ? 'Fotos del sitio (máx. 3, opcional)' : 'Site photos (max 3, optional)'}
            </label>
            <FotosDragDrop
              category="puntos-ayuda"
              caseId={sitioId}
              caseLabel={form.nombre_lugar || 'punto-nuevo'}
              maxFiles={3}
              onUploaded={setFotoUrls}
              disabled={enviando}
            />
          </div>

          {resultado === 'err' && (
            <div className="bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52]">
              {t.enviado_err}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || !form.nombre_lugar || !form.tipo_lugar || !form.ciudad || !form.estado_region || !form.direccion}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
          >
            {enviando ? <Loader2 size={18} className="animate-spin" /> : '🏥'}
            {t.btn_guardar}
          </button>
        </form>
      </div>
    </div>
  );
}