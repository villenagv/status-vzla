import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const TIPOS_LUGAR = [
  { es: 'Refugio',            en: 'Shelter',          emoji: '🏠' },
  { es: 'Hospital',           en: 'Hospital',         emoji: '🏥' },
  { es: 'Farmacia',           en: 'Pharmacy',         emoji: '💊' },
  { es: 'Supermercado',       en: 'Supermarket',      emoji: '🛒' },
  { es: 'Comedor',            en: 'Food center',      emoji: '🍽️' },
  { es: 'Centro de acopio',   en: 'Supply depot',     emoji: '📦' },
  { es: 'Centro de donaciones', en: 'Donation point', emoji: '🤝' },
  { es: 'Bodega / Abasto',    en: 'Grocery store',    emoji: '🏪' },
  { es: 'Albergue',           en: 'Shelter/Hostel',   emoji: '🛏️' },
  { es: 'Punto de agua',      en: 'Water point',      emoji: '💧' },
  { es: 'Otro',               en: 'Other',            emoji: '📍' },
];

const DIAS_SEMANA_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_SEMANA_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DIAS_VALS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

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
    instagram: '', facebook: '', telegram: '', sitio_web: '',
    descripcion_como_llegar: '',
    opera_24h: false,
    horario_apertura: '', horario_cierre: '',
    dias_activos: [],
    nota_horario: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [fotoUrls, setFotoUrls] = useState([]);
  const [sitioId] = useState(() => `punto-${Date.now()}`);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDia = (val) => {
    setForm(f => ({
      ...f,
      dias_activos: f.dias_activos.includes(val)
        ? f.dias_activos.filter(d => d !== val)
        : [...f.dias_activos, val]
    }));
  };

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
        opera_24h: form.opera_24h,
        horario_apertura: form.opera_24h ? '' : form.horario_apertura,
        horario_cierre: form.opera_24h ? '' : form.horario_cierre,
        dias_activos: form.opera_24h ? [] : form.dias_activos,
        nota_horario: form.nota_horario,
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
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors cursor-pointer ${
                    form.tipo_lugar === tl.es
                      ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                      : 'bg-white border-[#EDEBE8] text-gray-600'
                  }`}
                >{tl.emoji} {lang === 'es' ? tl.es : tl.en}</button>
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

          {/* Redes sociales */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">
              🌐 {lang === 'es' ? 'Redes sociales y contacto digital' : 'Social media & online contact'}
            </h3>
            <p className="text-xs text-gray-400">
              {lang === 'es' ? 'Opcional. Ayuda a que la gente te encuentre y verifique.' : 'Optional. Helps people find and verify you.'}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base w-6 text-center">📸</span>
                <input
                  placeholder="Instagram: @nombre_del_sitio"
                  value={form.instagram}
                  onChange={e => set('instagram', e.target.value)}
                  className="flex-1 border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base w-6 text-center">📘</span>
                <input
                  placeholder="Facebook: facebook.com/pagina"
                  value={form.facebook}
                  onChange={e => set('facebook', e.target.value)}
                  className="flex-1 border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base w-6 text-center">✈️</span>
                <input
                  placeholder="Telegram: t.me/canal o @usuario"
                  value={form.telegram}
                  onChange={e => set('telegram', e.target.value)}
                  className="flex-1 border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base w-6 text-center">🔗</span>
                <input
                  placeholder={lang === 'es' ? 'Sitio web: https://...' : 'Website: https://...'}
                  value={form.sitio_web}
                  onChange={e => set('sitio_web', e.target.value)}
                  className="flex-1 border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">
              🕐 {lang === 'es' ? 'Horario de atención' : 'Operating hours'}
            </h3>
            <p className="text-xs text-gray-400">
              {lang === 'es' ? 'Indica cuándo está abierto. Muy útil para farmacias, supermercados y sitios de ayuda.' : 'Indicate when it is open. Very useful for pharmacies, supermarkets and help sites.'}
            </p>

            {/* Opera 24h */}
            <button
              type="button"
              onClick={() => set('opera_24h', !form.opera_24h)}
              className={`w-full py-3 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${
                form.opera_24h ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-white border-[#EDEBE8] text-gray-700'
              }`}
            >
              {form.opera_24h ? '✅' : '⬜'} {lang === 'es' ? 'Abierto las 24 horas' : 'Open 24 hours'}
            </button>

            {!form.opera_24h && (
              <>
                {/* Días activos */}
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-2">{lang === 'es' ? 'Días que opera:' : 'Days open:'}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(lang === 'es' ? DIAS_SEMANA_ES : DIAS_SEMANA_EN).map((dia, i) => (
                      <button
                        key={DIAS_VALS[i]}
                        type="button"
                        onClick={() => toggleDia(DIAS_VALS[i])}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer ${
                          form.dias_activos.includes(DIAS_VALS[i])
                            ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                            : 'bg-white border-[#EDEBE8] text-gray-600'
                        }`}
                      >{dia}</button>
                    ))}
                  </div>
                </div>

                {/* Horas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{lang === 'es' ? 'Abre a las' : 'Opens at'}</label>
                    <input
                      type="time"
                      value={form.horario_apertura}
                      onChange={e => set('horario_apertura', e.target.value)}
                      className="w-full border-2 border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{lang === 'es' ? 'Cierra a las' : 'Closes at'}</label>
                    <input
                      type="time"
                      value={form.horario_cierre}
                      onChange={e => set('horario_cierre', e.target.value)}
                      className="w-full border-2 border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Nota de horario */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                {lang === 'es' ? 'Nota sobre el horario (opcional)' : 'Schedule note (optional)'}
              </label>
              <textarea
                rows={2}
                placeholder={lang === 'es'
                  ? 'Ej: Los sábados solo abren hasta mediodía. Farmacia de guardia solo de noche. Cierran para almorzar de 12 a 2.'
                  : 'E.g: Saturdays only open until noon. Night pharmacy on duty only. Closed for lunch 12–2pm.'}
                value={form.nota_horario}
                onChange={e => set('nota_horario', e.target.value)}
                className="w-full border-2 border-[#EDEBE8] rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none placeholder-gray-400"
              />
            </div>
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