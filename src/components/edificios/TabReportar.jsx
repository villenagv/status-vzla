import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ChevronLeft, MapPin, Loader2, ShieldAlert, Camera, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useDraft } from '@/lib/useDraft';

const TIPO_OPTS = [
  { val: 'edificio_residencial', es: '🏠 Edificio residencial', en: '🏠 Residential building' },
  { val: 'hospital',             es: '🏥 Hospital / CDI',        en: '🏥 Hospital / Clinic'    },
  { val: 'escuela',              es: '🏫 Escuela / Liceo',       en: '🏫 School'               },
  { val: 'iglesia',              es: '⛪ Iglesia',               en: '⛪ Church'               },
  { val: 'comercio',             es: '🏪 Comercio',             en: '🏪 Business'             },
  { val: 'calle_via',            es: '🛣️ Calle / Vía',          en: '🛣️ Street / Road'        },
  { val: 'puente',               es: '🌉 Puente',                en: '🌉 Bridge'               },
  { val: 'servicio_publico',     es: '🔌 Servicio público',     en: '🔌 Public utility'       },
  { val: 'otro',                 es: '📋 Otro',                 en: '📋 Other'                },
];
const NIVEL_OPTS = [
  { val: 'leve',      es: 'Leve — grietas pequeñas, estructura firme',    en: 'Minor — small cracks, structure firm'    },
  { val: 'moderado',  es: 'Moderado — paredes o piso dañados',            en: 'Moderate — walls or floor damaged'       },
  { val: 'grave',     es: 'Grave — parte colapsó o riesgo alto',          en: 'Severe — partial collapse or high risk'  },
  { val: 'critico',   es: 'Crítico — colapso total o personas atrapadas', en: 'Critical — total collapse or trapped'    },
  { val: 'no_sabe',   es: 'No sé / No pude evaluar',                      en: "Don't know / Can't evaluate"             },
  { val: 'colapsado', es: '💥 Colapsado — estructura derrumbada',         en: '💥 Collapsed — structure down'           },
];
const ATRAPADOS_OPTS = [
  { val: 'si',         es: '🚨 Sí, confirmado',                   en: '🚨 Yes, confirmed'              },
  { val: 'voces',      es: '👂 Se escuchan voces o golpes',        en: '👂 Voices or knocking heard'    },
  { val: 'familiares', es: '👨‍👩‍👧 Familiares dicen que hay alguien', en: '👨‍👩‍👧 Family says someone is inside' },
  { val: 'no',         es: '✅ No',                                en: '✅ No'                          },
  { val: 'no_sabe',    es: '❓ No se sabe',                       en: '❓ Unknown'                     },
];

const inputCls = "w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder-gray-400";
const PRIORIDAD_SORT = { critico: 0, colapsado: 1, grave: 2, moderado: 3, leve: 4, no_evaluado: 5, no_sabe: 6 };

function normalizar(str) {
  let s = (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const ABREV = { 'av': 'avenida', 'ave': 'avenida', 'cll': 'calle', 'urb': 'urbanizacion', 'edif': 'edificio' };
  s = s.split(' ').map(w => ABREV[w] || w).join(' ');
  return s;
}
function similitud(a, b) {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wA = na.split(' '), wB = nb.split(' ');
  const matches = wA.filter(w => w.length > 2 && wB.some(wb => wb.startsWith(w) || w.startsWith(wb)));
  return matches.length / Math.max(wA.length, wB.length);
}

const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', cardBorder: '#D4AC0D', label: { es: 'Daño leve',     en: 'Minor damage'   }, icon: '🟡' },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', cardBorder: '#E67E22', label: { es: 'Daño moderado', en: 'Moderate damage' }, icon: '🟠' },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', cardBorder: '#E74C3C', label: { es: 'Daño grave',    en: 'Severe damage'   }, icon: '🔴' },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', cardBorder: '#922B21', label: { es: 'CRÍTICO',       en: 'CRITICAL'        }, icon: '🚨' },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin evaluar',   en: 'Not evaluated'   }, icon: '⚪' },
  no_sabe:     { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin datos',     en: 'No data'         }, icon: '⚪' },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', cardBorder: '#4A0E0E', label: { es: 'COLAPSADO',     en: 'COLLAPSED'       }, icon: '💥' },
};
const cfg = (d) => DANO_CONFIG[d] || DANO_CONFIG.no_evaluado;

export default function TabReportar({ todos, setTab, lang, t }) {
  const es = lang === 'es';
  const pt = lang === 'pt';
  const DRAFT_INIT = { valNombre: '', valDireccion: '', tipo: '', nivel: '', atrapados: '', ciudad: '', estado: '', descripcion: '', repNombre: '', repTelefono: '', repEmail: '', accesoCalle: '', accesoVehiculos: '', notasAcceso: '', electricidad: '', agua: '', gas: '', riesgoGas: false, riesgoElec: false, riesgoIncendio: false, racionamientoAgua: false, racionamientoElec: false, horarioAgua: '', horarioElec: '' };
  const [draft, setDraft, clearDraft, hasDraft] = useDraft('edificios-reporte', DRAFT_INIT);

  const valNombre = draft.valNombre; const setValNombre = v => setDraft({ valNombre: v });
  const valDireccion = draft.valDireccion; const setValDireccion = v => setDraft({ valDireccion: v });
  const tipo = draft.tipo; const setTipo = v => setDraft({ tipo: v });
  const nivel = draft.nivel; const setNivel = v => setDraft({ nivel: v });
  const atrapados = draft.atrapados; const setAtrapados = v => setDraft({ atrapados: v });
  const riesgoGas = draft.riesgoGas; const setRiesgoGas = v => setDraft({ riesgoGas: typeof v === 'function' ? v(draft.riesgoGas) : v });
  const riesgoElec = draft.riesgoElec; const setRiesgoElec = v => setDraft({ riesgoElec: typeof v === 'function' ? v(draft.riesgoElec) : v });
  const riesgoIncendio = draft.riesgoIncendio; const setRiesgoIncendio = v => setDraft({ riesgoIncendio: typeof v === 'function' ? v(draft.riesgoIncendio) : v });
  const accesoCalle = draft.accesoCalle; const setAccesoCalle = v => setDraft({ accesoCalle: v });
  const accesoVehiculos = draft.accesoVehiculos; const setAccesoVehiculos = v => setDraft({ accesoVehiculos: v });
  const notasAcceso = draft.notasAcceso; const setNotasAcceso = v => setDraft({ notasAcceso: v });
  const electricidad = draft.electricidad; const setElectricidad = v => setDraft({ electricidad: v });
  const agua = draft.agua; const setAgua = v => setDraft({ agua: v });
  const gas = draft.gas; const setGas = v => setDraft({ gas: v });
  const racionamientoAgua = draft.racionamientoAgua; const setRacionamientoAgua = v => setDraft({ racionamientoAgua: v });
  const racionamientoElec = draft.racionamientoElec; const setRacionamientoElec = v => setDraft({ racionamientoElec: v });
  const horarioAgua = draft.horarioAgua; const setHorarioAgua = v => setDraft({ horarioAgua: v });
  const horarioElec = draft.horarioElec; const setHorarioElec = v => setDraft({ horarioElec: v });
  const ciudad = draft.ciudad; const setCiudad = v => setDraft({ ciudad: v });
  const estado = draft.estado; const setEstado = v => setDraft({ estado: v });
  const descripcion = draft.descripcion; const setDescripcion = v => setDraft({ descripcion: v });
  const repNombre = draft.repNombre; const setRepNombre = v => setDraft({ repNombre: v });
  const repTelefono = draft.repTelefono; const setRepTelefono = v => setDraft({ repTelefono: v });
  const repEmail = draft.repEmail; const setRepEmail = v => setDraft({ repEmail: v });

  const [contactosAcceso, setContactosAcceso] = useState([]);
  const CONTACTO_VACIO = { nombre: '', telefono: '', email: '', rol: '' };
  const agregarContacto = () => setContactosAcceso(prev => [...prev, { ...CONTACTO_VACIO }]);
  const quitarContacto = (i) => setContactosAcceso(prev => prev.filter((_, idx) => idx !== i));
  const setContacto = (i, k, v) => setContactosAcceso(prev => prev.map((c, idx) => idx === i ? { ...c, [k]: v } : c));

  const [fotoFachada, setFotoFachada] = useState(null);
  const [fotosDano, setFotosDano] = useState([]);
  const MAX_DANO = 4;
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(null);
  const [etapa, setEtapa] = useState('validacion');
  const [posiblesDups, setPosiblesDups] = useState([]);
  const [buscandoDup, setBuscandoDup] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoEstado, setGeoEstado] = useState('idle');
  const geoTimerRef = useRef(null);

  const ciudadesDisponibles = [...new Set(todos.map(r => r.ciudad).filter(Boolean))].sort();
  const esCritico = nivel === 'critico' || nivel === 'grave' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces';

  const geocodificarDireccion = useCallback(async (dir, ciudadVal, estadoVal) => {
    const q = [dir, ciudadVal, estadoVal, 'Venezuela'].filter(Boolean).join(', ');
    if (q.replace(/,\s*/g, '').length < 5) return;
    setGeoEstado('buscando');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=ve&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'CRIS-Venezuela-Emergency/1.0' } });
      const data = await res.json();
      if (data?.length > 0) { setGeoCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name?.split(',').slice(0, 2).join(',') }); setGeoEstado('ok'); return; }
    } catch {}
    try {
      const r = await base44.integrations.Core.InvokeLLM({ prompt: `Coordenadas GPS de "${[dir, ciudadVal, estadoVal].filter(Boolean).join(', ')}" Venezuela. SOLO JSON: {"lat": 0.0, "lng": 0.0}`, response_json_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } } });
      if (r?.lat && r?.lng) { setGeoCoords({ lat: r.lat, lng: r.lng, label: `${ciudadVal || ''} (IA)` }); setGeoEstado('ok'); return; }
    } catch {}
    setGeoEstado('error');
  }, []);

  useEffect(() => {
    if (etapa !== 'formulario') return;
    clearTimeout(geoTimerRef.current);
    if (!ciudad && !valDireccion) return;
    geoTimerRef.current = setTimeout(() => geocodificarDireccion(valDireccion, ciudad, estado), 900);
    return () => clearTimeout(geoTimerRef.current);
  }, [ciudad, valDireccion, estado, etapa, geocodificarDireccion]);

  const verificarEdificio = async () => {
    if (!valDireccion.trim()) return;
    setBuscandoDup(true);
    const q = normalizar(valDireccion + ' ' + valNombre);
    const dups = todos.filter(r => {
      const dir = normalizar(r.direccion || '');
      const nombre = normalizar(r.nombre_lugar || '');
      return similitud(q, dir) > 0.45 || similitud(q, nombre) > 0.5 || dir.includes(q.slice(0, 10));
    }).sort((a, b) => (PRIORIDAD_SORT[a.nivel_dano] ?? 5) - (PRIORIDAD_SORT[b.nivel_dano] ?? 5));
    setPosiblesDups(dups);
    setEtapa('resultados');
    setBuscandoDup(false);
  };

  const subirFoto = async (file, setFn, maxCheck) => {
    if (maxCheck && maxCheck()) return;
    const id = Date.now() + Math.random();
    const entry = { id, url: null, uploading: true, error: false, preview: URL.createObjectURL(file) };
    setFn(prev => Array.isArray(prev) ? [...prev, entry] : entry);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFn(prev => Array.isArray(prev) ? prev.map(f => f.id === id ? { ...f, url: file_url, uploading: false } : f) : (prev?.id === id ? { ...prev, url: file_url, uploading: false } : prev));
    } catch {
      setFn(prev => Array.isArray(prev) ? prev.map(f => f.id === id ? { ...f, uploading: false, error: true } : f) : (prev?.id === id ? { ...prev, uploading: false, error: true } : prev));
    }
  };

  const resetForm = () => { setEtapa('validacion'); setPosiblesDups([]); clearDraft(); setFotoFachada(null); setFotosDano([]); setContactosAcceso([]); };

  const handleSubmit = async () => {
    setEnviando(true);
    try {
      const prioridad = (nivel === 'critico' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces') ? 'critica' : nivel === 'grave' ? 'alta' : 'normal';
      const foto_urls = [...(fotoFachada?.url ? [fotoFachada.url] : []), ...fotosDano.filter(f => f.url).map(f => f.url)];
      const contactosFiltrados = contactosAcceso.filter(c => c.nombre.trim() || c.telefono.trim() || c.email.trim());
      await base44.entities.ReportesDano.create({
        tipo_estructura: tipo || 'otro', nombre_lugar: valNombre,
        nivel_dano: nivel || 'no_evaluado', personas_atrapadas: atrapados || 'no_sabe',
        riesgo_gas: riesgoGas, riesgo_electrico: riesgoElec, riesgo_incendio: riesgoIncendio,
        acceso_calle: accesoCalle || 'no_sabe', acceso_vehiculos: accesoVehiculos || 'no_sabe', notas_acceso: notasAcceso,
        electricidad: electricidad || 'no_confirmado', agua: agua || 'no_confirmado', gas: gas || 'no_confirmado',
        direccion: valDireccion, ciudad, estado_region: estado, descripcion, foto_urls, prioridad,
        ...(geoCoords ? { lat: geoCoords.lat, lng: geoCoords.lng, geo_fuente: 'nominatim_form' } : {}),
        reportante_nombre: repNombre, reportante_telefono: repTelefono, reportante_email: repEmail,
        contactos_acceso: contactosFiltrados, estado_verificacion: 'recibido', nivel_verificacion: 'sin_verificar', fuente: 'ciudadano',
      });
      setExito(true);
    } catch { setExito(false); }
    setEnviando(false);
  };

  if (exito === true) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-4">
      <div className="text-4xl mb-3">✅</div>
      <h3 className="font-bold text-green-800 text-lg mb-1">{t('Reporte enviado.', 'Report submitted.', 'Relatório enviado.')}</h3>
      <p className="text-sm text-green-700 mb-3">{t('Gracias. Tu reporte ayuda a que otras personas eviten el peligro.', 'Thank you. Your report helps others avoid danger.', 'Obrigado. Seu relatório ajuda outras pessoas a evitar o perigo.')}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { resetForm(); setExito(null); }} className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer">{t('Reportar otro', 'Report another', 'Reportar outro')}</button>
        <button onClick={() => setTab('directorio')} className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer">{t('Ver directorio', 'View directory', 'Ver diretório')}</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl">
      {/* Borrador */}
      {hasDraft && etapa === 'validacion' && (valNombre || valDireccion || tipo || nivel) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3 flex items-center justify-between gap-2">
          <p className="text-xs text-blue-800 font-semibold">📝 {t('Tienes un borrador guardado.', 'You have a saved draft.', 'Você tem um rascunho salvo.')}</p>
          <button onClick={resetForm} className="text-xs text-blue-600 underline cursor-pointer">{t('Limpiar', 'Clear', 'Limpar')}</button>
        </div>
      )}

      {/* ETAPA 1 */}
      {etapa === 'validacion' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-bold text-gray-800 mb-1">{t('Verificar si el lugar ya existe', 'Check if the place already exists', 'Verificar se o local já existe')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('Primero verificamos si este lugar ya fue reportado para evitar duplicados.', 'First we check if this place was already reported to avoid duplicates.', 'Primeiro verificamos se este local já foi reportado.')}</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Nombre del lugar', 'Place name', 'Nome do lugar')}</label>
              <input value={valNombre} onChange={e => setValNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && verificarEdificio()}
                placeholder={t('Ej: Hospital Central, Edificio Las Torres...', 'E.g: Central Hospital, Las Torres building...', 'Ex: Hospital Central...')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Dirección o zona', 'Address or area', 'Endereço ou área')} <span className="text-red-500">*</span></label>
              <input value={valDireccion} onChange={e => setValDireccion(e.target.value)} onKeyDown={e => e.key === 'Enter' && verificarEdificio()}
                placeholder={t('Ej: Av. Soublette, frente al mercado, La Guaira', 'E.g: Soublette Ave, next to market, La Guaira', 'Ex: Av. Soublette, em frente ao mercado')} className={inputCls} />
            </div>
            <button onClick={verificarEdificio} disabled={buscandoDup || !valDireccion.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
              {buscandoDup ? <Loader2 size={16} className="animate-spin" /> : '🔍'}
              {buscandoDup ? t('Verificando...', 'Checking...', 'Verificando...') : t('Verificar lugar', 'Check place', 'Verificar local')}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2 */}
      {etapa === 'resultados' && (
        <div className="space-y-4">
          {posiblesDups.length > 0 ? (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 space-y-3">
              <div className="flex gap-2 items-start">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">{t(`Encontramos ${posiblesDups.length} reporte(s) similar(es)`, `We found ${posiblesDups.length} similar report(s)`, `Encontramos ${posiblesDups.length} relatório(s) similar(es)`)}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{t('Selecciona uno para agregar tu información o crea un reporte nuevo.', 'Select one to add your info or create a new report.', 'Selecione um para adicionar suas informações ou crie um novo.')}</p>
                </div>
              </div>
              {posiblesDups.slice(0, 4).map(d => {
                const c = cfg(d.nivel_dano);
                return (
                  <div key={d.id} className="bg-white border border-amber-300 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{d.nombre_lugar || d.tipo_estructura?.replace(/_/g, ' ') || t('Sin nombre', 'Unnamed', 'Sem nome')}</p>
                        <p className="text-xs text-gray-500 truncate">📍 {d.direccion || '—'} · {d.ciudad || '—'}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>{c.icon} {t(c.label.es, c.label.en, c.label.es)}</span>
                    </div>
                    {['grave', 'critico', 'colapsado'].includes(d.nivel_dano) && <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded">🚫 {t('NO ENTRAR', 'DO NOT ENTER', 'NÃO ENTRAR')}</span>}
                    <div className="flex gap-2 mt-2">
                      <Link to={`/edificio?id=${d.id}`} className="flex-1 text-center text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold no-underline hover:bg-blue-700">
                        👁️ {t('Ver y actualizar', 'View & update', 'Ver e atualizar')}
                      </Link>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => setEtapa('formulario')} className="w-full text-sm font-bold bg-white border-2 border-amber-400 text-amber-800 hover:bg-amber-50 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2">
                ➕ {t('No es el mismo — Reportar edificio nuevo', 'It is different — Report new building', 'Não é o mesmo — Reportar novo edifício')}
              </button>
              <button onClick={() => setEtapa('validacion')} className="w-full text-xs text-gray-400 underline cursor-pointer">{t('Volver a buscar', 'Search again', 'Voltar a buscar')}</button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-800 text-sm">{t('Sin reportes previos para este lugar.', 'No previous reports for this place.', 'Nenhum relatório anterior para este local.')}</p>
              <button onClick={() => setEtapa('formulario')} className="mt-4 bg-green-700 hover:bg-green-800 text-white text-sm font-bold px-8 py-3.5 rounded-xl cursor-pointer">
                ➕ {t('Crear reporte de daño', 'Create damage report', 'Criar relatório de dano')}
              </button>
              <button onClick={() => setEtapa('validacion')} className="block mx-auto mt-3 text-xs text-gray-400 underline cursor-pointer">{t('Buscar otro lugar', 'Search another place', 'Buscar outro local')}</button>
            </div>
          )}
        </div>
      )}

      {/* ETAPA 3: FORMULARIO */}
      {etapa === 'formulario' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setEtapa('validacion')} className="text-xs text-gray-400 underline cursor-pointer flex items-center gap-1"><ChevronLeft size={12} /> {t('Volver', 'Back', 'Voltar')}</button>
            <div className="flex-1 text-right"><span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t('Nuevo reporte', 'New report', 'Novo relatório')}</span></div>
          </div>

          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex gap-3">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 font-medium leading-relaxed">
              {t('No entres a estructuras dañadas. Si hay grietas graves, olor a gas, cables caídos, incendio o personas atrapadas — espera a Protección Civil (171), Bomberos o rescatistas autorizados.',
                 'Do not enter damaged structures. If there are major cracks, gas smell, fallen wires, fire or trapped people — wait for Civil Protection (171) or authorized rescue teams.',
                 'Não entre em estruturas danificadas. Se houver rachaduras graves, cheiro de gás, fios caídos, incêndio ou pessoas presas — aguarde autoridades.')}
            </p>
          </div>

          {/* 1. Tipo */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">1. {t('¿Qué tipo de estructura es?', 'What type of structure?', 'Que tipo de estrutura?')} <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPO_OPTS.map(tb => (
                <button key={tb.val} onClick={() => setTipo(tb.val)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${tipo === tb.val ? 'bg-blue-700 text-white border-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                  {es ? tb.es : tb.en}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Ubicación */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">2. {t('Ubicación', 'Location', 'Localização')} <span className="text-red-500">*</span></h3>
            <input value={valNombre} onChange={e => setValNombre(e.target.value)} placeholder={t('Nombre del lugar', 'Place name', 'Nome do lugar')} className={inputCls} />
            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10} />{valDireccion}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Ciudad', 'City', 'Cidade')} <span className="text-red-600">*</span></label>
                <input list="ciudades-lista-rep" value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="La Guaira" className={inputCls} />
                <datalist id="ciudades-lista-rep">{ciudadesDisponibles.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Estado', 'State', 'Estado')} <span className="text-red-600">*</span></label>
                <input value={estado} onChange={e => setEstado(e.target.value)} placeholder="Vargas" className={inputCls} />
              </div>
            </div>
            {geoEstado === 'buscando' && <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"><Loader2 size={11} className="animate-spin text-blue-500" /><span className="text-xs text-blue-700">{t('Buscando coordenadas...', 'Finding coordinates...', 'Buscando coordenadas...')}</span></div>}
            {geoEstado === 'ok' && geoCoords && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <MapPin size={11} className="text-green-600" />
                <span className="text-xs text-green-700 font-medium">📍 {geoCoords.lat.toFixed(4)}, {geoCoords.lng.toFixed(4)}{geoCoords.label && ` · ${geoCoords.label}`}</span>
                <button onClick={() => { setGeoCoords(null); setGeoEstado('idle'); }} className="ml-auto text-gray-400 text-xs cursor-pointer">✕</button>
              </div>
            )}
          </div>

          {/* 3. Nivel */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">3. {t('Nivel de daño visible', 'Visible damage level', 'Nível de dano visível')} <span className="text-red-500">*</span></h3>
            <div className="space-y-2">
              {NIVEL_OPTS.map(n => (
                <button key={n.val} onClick={() => setNivel(n.val)}
                  className={`w-full py-3 px-4 rounded-lg text-sm text-left border cursor-pointer transition-colors ${nivel === n.val ? (n.val === 'critico' ? 'bg-red-700 text-white border-red-700' : n.val === 'grave' ? 'bg-red-500 text-white border-red-500' : n.val === 'moderado' ? 'bg-orange-500 text-white border-orange-500' : n.val === 'leve' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-gray-600 text-white border-gray-600') : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                  {es ? n.es : n.en}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Atrapados */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">4. {t('¿Hay personas atrapadas?', 'Are there trapped people?', 'Há pessoas presas?')} <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ATRAPADOS_OPTS.map(a => (
                <button key={a.val} onClick={() => setAtrapados(a.val)}
                  className={`py-3 px-4 rounded-lg text-sm text-left border cursor-pointer transition-colors ${atrapados === a.val ? (a.val === 'si' || a.val === 'voces') ? 'bg-red-600 text-white border-red-600' : 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                  {es ? a.es : a.en}
                </button>
              ))}
            </div>
            {(atrapados === 'si' || atrapados === 'voces') && (
              <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-3">
                <p className="text-sm font-bold text-red-700">🚨 {t('Llama ahora a Protección Civil (171) o Bomberos.', 'Call Civil Protection (171) or Firefighters now.', 'Ligue agora para Proteção Civil (171) ou Bombeiros.')}</p>
              </div>
            )}
          </div>

          {/* 5. Riesgos */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">5. {t('Riesgos adicionales', 'Additional hazards', 'Riscos adicionais')}</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { val: riesgoGas,      set: setRiesgoGas,      label: { es: '💨 Olor a gas',               en: '💨 Gas smell',   pt: '💨 Cheiro de gás'     } },
                { val: riesgoElec,     set: setRiesgoElec,     label: { es: '⚡ Cables caídos / eléctrico', en: '⚡ Fallen wires', pt: '⚡ Fios caídos'       } },
                { val: riesgoIncendio, set: setRiesgoIncendio, label: { es: '🔥 Riesgo de incendio',        en: '🔥 Fire hazard',  pt: '🔥 Risco de incêndio' } },
              ].map((r, i) => (
                <button key={i} onClick={() => r.set(v => !v)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${r.val ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'}`}>
                  {pt ? r.label.pt : es ? r.label.es : r.label.en}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Acceso */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">6. {t('Acceso al lugar', 'Access to the site', 'Acesso ao local')}</h3>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">🚶 {t('¿Cómo está la calle?', 'How is the street?', 'Como está a rua?')}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'normal',        es: '✅ Libre', en: '✅ Clear' },
                  { val: 'dificultad',    es: '⚠️ Con dificultad', en: '⚠️ With difficulty' },
                  { val: 'solo_peatonal', es: '🚶 Solo a pie', en: '🚶 On foot only' },
                  { val: 'bloqueada',     es: '🚫 Bloqueada', en: '🚫 Blocked' },
                  { val: 'insegura',      es: '☠️ Peligrosa', en: '☠️ Dangerous' },
                  { val: 'no_sabe',       es: '❓ No sé', en: '❓ Unknown' },
                ].map(a => (
                  <button key={a.val} onClick={() => setAccesoCalle(a.val)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${accesoCalle === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                    {es ? a.es : a.en}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">🚗 {t('¿Qué vehículo puede llegar?', 'What vehicle can reach it?', 'Que veículo pode chegar?')}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'carros',      es: '🚗 Carros', en: '🚗 Cars' },
                  { val: 'ambulancias', es: '🚑 Ambulancias', en: '🚑 Ambulances' },
                  { val: 'solo_motos',  es: '🏍️ Solo motos', en: '🏍️ Motorcycles only' },
                  { val: 'bloqueado',   es: '🚫 Nada', en: '🚫 Nothing' },
                  { val: 'no_sabe',     es: '❓ No sé', en: '❓ Unknown' },
                ].map(a => (
                  <button key={a.val} onClick={() => setAccesoVehiculos(a.val)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${accesoVehiculos === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                    {es ? a.es : a.en}
                  </button>
                ))}
              </div>
            </div>
            <input value={notasAcceso} onChange={e => setNotasAcceso(e.target.value)}
              placeholder={t('Nota sobre acceso (opcional)', 'Access note (optional)', 'Nota de acesso (opcional)')} className={inputCls} />
          </div>

          {/* 7. Servicios */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">7. {t('Servicios básicos', 'Basic services', 'Serviços básicos')}</h3>
            <p className="text-xs text-gray-400 -mt-2">{t('Marca solo lo que sabes con certeza.', 'Only mark what you know for sure.', 'Marque apenas o que sabe com certeza.')}</p>
            {[
              { label: '⚡', title: t('Electricidad', 'Electricity', 'Eletricidade'), val: electricidad, set: setElectricidad, color: 'yellow', opts: [
                { val: 'disponible', es: '✅ Hay luz', en: '✅ Has power' }, { val: 'intermitente', es: '⚡ Intermitente', en: '⚡ Intermittent' },
                { val: 'no_disponible', es: '❌ Sin luz', en: '❌ No power' }, { val: 'no_confirmado', es: '❓ No sé', en: '❓ Unknown' },
              ], racion: racionamientoElec, setRacion: setRacionamientoElec, horario: horarioElec, setHorario: setHorarioElec, labelRacion: t('Hay racionamiento eléctrico', 'Electricity is rationed', 'Há racionamento elétrico'), placeholderH: t('Horario: ej. 6am-10am', 'Schedule: e.g. 6am-10am', 'Horário: ex. 6h-10h') },
              { label: '💧', title: t('Agua corriente', 'Running water', 'Água corrente'), val: agua, set: setAgua, color: 'blue', opts: [
                { val: 'disponible', es: '✅ Hay agua', en: '✅ Has water' }, { val: 'intermitente', es: '💧 Intermitente', en: '💧 Intermittent' },
                { val: 'no_disponible', es: '❌ Sin agua', en: '❌ No water' }, { val: 'no_confirmado', es: '❓ No sé', en: '❓ Unknown' },
              ], racion: racionamientoAgua, setRacion: setRacionamientoAgua, horario: horarioAgua, setHorario: setHorarioAgua, labelRacion: t('Hay racionamiento de agua', 'Water is rationed', 'Há racionamento de água'), placeholderH: t('Horario: ej. Martes 5am-8am', 'Schedule: e.g. Tue 5am-8am', 'Horário: ex. Ter 5h-8h') },
            ].map(srv => (
              <div key={srv.label}>
                <p className="text-xs font-semibold text-gray-700 mb-2">{srv.label} {srv.title}</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {srv.opts.map(o => (
                    <button key={o.val} onClick={() => srv.set(o.val)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${srv.val === o.val ? `bg-${srv.color}-600 text-white border-${srv.color}-600` : `bg-white border-gray-200 text-gray-700 hover:border-${srv.color}-300`}`}>
                      {es ? o.es : o.en}
                    </button>
                  ))}
                </div>
                {srv.val === 'intermitente' && (
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={srv.racion} onChange={e => srv.setRacion(e.target.checked)} className="rounded" />
                      {srv.labelRacion}
                    </label>
                    {srv.racion && <input value={srv.horario} onChange={e => srv.setHorario(e.target.value)} placeholder={srv.placeholderH} className={inputCls} />}
                  </div>
                )}
              </div>
            ))}
            {/* Gas */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">🔥 {t('Gas doméstico', 'Gas service', 'Gás doméstico')}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'disponible', es: '✅ Gas normal', en: '✅ Gas on' }, { val: 'suspendido', es: '🚫 Gas cortado', en: '🚫 Gas cut' },
                  { val: 'fuga_reportada', es: '☠️ FUGA de gas', en: '☠️ GAS LEAK' }, { val: 'no_disponible', es: '❌ Sin gas', en: '❌ No gas' },
                  { val: 'no_confirmado', es: '❓ No sé', en: '❓ Unknown' },
                ].map(o => (
                  <button key={o.val} onClick={() => setGas(o.val)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${gas === o.val ? (o.val === 'fuga_reportada' ? 'bg-red-700 text-white border-red-700' : 'bg-orange-600 text-white border-orange-600') : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'}`}>
                    {es ? o.es : o.en}
                  </button>
                ))}
              </div>
              {gas === 'fuga_reportada' && (
                <div className="mt-2 flex gap-2 bg-red-50 border-2 border-red-300 rounded-xl px-3 py-2">
                  <AlertTriangle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-bold">{t('🚨 URGENTE: Evacúa el área. Llama a Bomberos.', '🚨 URGENT: Evacuate. Call Firefighters.', '🚨 URGENTE: Evacue. Ligue para Bombeiros.')}</p>
                </div>
              )}
            </div>
          </div>

          {/* 8. Fotos */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-0.5">8. {t('Fotos del edificio', 'Building photos', 'Fotos do edifício')}</h3>
              <p className="text-xs text-gray-400">{t('Solo desde un lugar seguro. No entres al edificio.', 'Only from a safe location.', 'Somente de um lugar seguro.')}</p>
            </div>
            {/* Fachada */}
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">🏠 {t('Foto de la fachada', 'Building front photo', 'Foto da fachada')} <span className="text-amber-500 font-black">★ Recomendada</span></p>
              {!fotoFachada ? (
                <label className="flex items-center gap-3 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-4 cursor-pointer hover:border-amber-400 transition-colors">
                  <Camera size={22} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">{t('Subir foto de fachada', 'Upload front photo', 'Enviar foto da fachada')}</p>
                    <p className="text-xs text-amber-600">{t('1 foto · Desde la calle', '1 photo · From the street', '1 foto · Da rua')}</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(f, setFotoFachada, null); e.target.value = ''; }} />
                </label>
              ) : (
                <div className="relative w-full rounded-xl overflow-hidden bg-gray-100 border-2 border-amber-300" style={{ height: 160 }}>
                  <img src={fotoFachada.preview} alt="fachada" className="w-full h-full object-cover" />
                  {fotoFachada.uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white" /></div>}
                  {fotoFachada.url && !fotoFachada.uploading && <div className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ {t('Subida', 'Uploaded', 'Enviada')}</div>}
                  <button onClick={() => setFotoFachada(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={12} /></button>
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">🏠 FACHADA</div>
                </div>
              )}
            </div>
            {/* Daños */}
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">📸 {t('Fotos de los daños', 'Damage photos', 'Fotos dos danos')} <span className="text-gray-400 font-normal">({t('opcional, máx. 4', 'optional, max 4', 'opcional, máx. 4')})</span></p>
              <div className="grid grid-cols-4 gap-2">
                {fotosDano.map(f => (
                  <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {f.preview && <img src={f.preview} alt="" className="w-full h-full object-cover" />}
                    {f.uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white" /></div>}
                    {!f.uploading && <button onClick={() => setFotosDano(prev => prev.filter(x => x.id !== f.id))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={9} /></button>}
                    {f.url && !f.uploading && <div className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-green-500" />}
                  </div>
                ))}
                {fotosDano.length < MAX_DANO && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors gap-1">
                    <Camera size={16} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">{t('Agregar', 'Add', 'Adicionar')}</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => { Array.from(e.target.files || []).slice(0, MAX_DANO - fotosDano.length).forEach(f => subirFoto(f, setFotosDano, () => fotosDano.length >= MAX_DANO)); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* 9. Contactos */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">9. {t('¿Quién puede dar acceso para inspección?', 'Who can grant access for inspection?', 'Quem pode dar acesso para inspeção?')}</h3>
            <p className="text-xs text-gray-500">{t('Datos privados — no se muestran públicamente.', 'Private data — not shown publicly.', 'Dados privados.')}</p>
            {contactosAcceso.length === 0 && <p className="text-xs text-gray-400 italic">{t('Ningún contacto. Opcional pero útil.', 'No contacts. Optional but useful.', 'Nenhum contato. Opcional mas útil.')}</p>}
            {contactosAcceso.map((c, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700">👤 {t(`Contacto ${i + 1}`, `Contact ${i + 1}`, `Contato ${i + 1}`)}</p>
                  <button onClick={() => quitarContacto(i)} className="text-red-400 text-xs font-bold cursor-pointer px-1">✕</button>
                </div>
                <input value={c.nombre} onChange={e => setContacto(i, 'nombre', e.target.value)} placeholder={t('Nombre completo', 'Full name', 'Nome completo')} className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={c.telefono} onChange={e => setContacto(i, 'telefono', e.target.value)} placeholder={t('Teléfono', 'Phone', 'Telefone')} className={inputCls} />
                  <input value={c.email} onChange={e => setContacto(i, 'email', e.target.value)} placeholder="Email" className={inputCls} />
                </div>
                <input value={c.rol} onChange={e => setContacto(i, 'rol', e.target.value)} placeholder={t('Rol: conserje, propietario...', 'Role: caretaker, owner...', 'Papel: zelador, proprietário...')} className={inputCls} />
              </div>
            ))}
            {contactosAcceso.length < 5 && (
              <button onClick={agregarContacto} className="w-full py-2.5 text-sm text-blue-700 border border-blue-200 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 font-semibold">
                + {t('Agregar contacto de acceso', 'Add access contact', 'Adicionar contato de acesso')}
              </button>
            )}
          </div>

          {/* 10. Descripción */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">10. {t('Descripción y tus datos', 'Description and your info', 'Descrição e seus dados')}</h3>
            <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={200}
              placeholder={t('Describe lo que ves (opcional)', 'Describe what you see (optional)', 'Descreva o que você vê (opcional)')}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 resize-none placeholder-gray-400" />
            <p className="text-right text-xs text-gray-400">{descripcion.length}/200</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-blue-800">🔒 {t('Tus datos de contacto (privados)', 'Your contact info (private)', 'Seus dados de contato (privados)')}</p>
              <input value={repNombre} onChange={e => setRepNombre(e.target.value)} placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')} className={inputCls} />
              <input value={repTelefono} onChange={e => setRepTelefono(e.target.value)} placeholder={t('Teléfono / WhatsApp', 'Phone / WhatsApp', 'Telefone / WhatsApp')} className={inputCls} />
              <input value={repEmail} onChange={e => setRepEmail(e.target.value)} placeholder={t('Email', 'Email', 'Email')} className={inputCls} />
              <p className="text-[10px] text-gray-500">{t('✅ Tus datos no se muestran públicamente.', '✅ Your data is not displayed publicly.', '✅ Seus dados não são exibidos publicamente.')}</p>
            </div>
          </div>

          {esCritico && (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3">
              <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{t('⚠️ Este reporte será marcado como CRÍTICO. Llama primero a Protección Civil (171) o Bomberos.', '⚠️ This report will be marked CRITICAL. Call Civil Protection (171) or Firefighters first.', '⚠️ Este relatório será marcado como CRÍTICO. Ligue primeiro para Proteção Civil (171).')}</p>
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={enviando || !tipo || !nivel || !atrapados || !ciudad || !estado || fotoFachada?.uploading || fotosDano.some(f => f.uploading)}
            className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors ${esCritico ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}>
            {enviando ? <Loader2 size={18} className="animate-spin" /> : (esCritico ? '🚨' : '📋')}
            {(fotoFachada?.uploading || fotosDano.some(f => f.uploading)) ? t('Subiendo fotos...', 'Uploading photos...', 'Enviando fotos...')
              : esCritico ? t('Enviar alerta crítica', 'Send critical alert', 'Enviar alerta crítico')
              : t('Enviar reporte de daño', 'Submit damage report', 'Enviar relatório de dano')}
          </button>
          {(!tipo || !nivel || !atrapados || !ciudad || !estado) && (
            <p className="text-center text-xs text-gray-400">{t('Completa los campos obligatorios (*) para enviar.', 'Fill in required fields (*) to submit.', 'Preencha os campos obrigatórios (*) para enviar.')}</p>
          )}
        </div>
      )}
    </div>
  );
}