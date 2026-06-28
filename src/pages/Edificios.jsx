import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, CheckCircle, ChevronLeft, MapPin, Loader2, ShieldAlert, Camera, X, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}
function similitud(a, b) {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wA = na.split(' '), wB = nb.split(' ');
  return wA.filter(w => w.length > 3 && wB.includes(w)).length / Math.max(wA.length, wB.length);
}

const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', cardBorder: '#D4AC0D', label: { es: 'Daño leve',     en: 'Minor damage'   }, icon: '🟡', acceso: { es: 'Entrada con precaución', en: 'Enter with caution' } },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', cardBorder: '#E67E22', label: { es: 'Daño moderado', en: 'Moderate damage' }, icon: '🟠', acceso: { es: 'Entrada limitada',       en: 'Limited entry'      } },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', cardBorder: '#E74C3C', label: { es: 'Daño grave',    en: 'Severe damage'   }, icon: '🔴', acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER'       } },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', cardBorder: '#922B21', label: { es: 'CRÍTICO',       en: 'CRITICAL'        }, icon: '🚨', acceso: { es: 'NO ENTRAR — PELIGRO',    en: 'DO NOT ENTER'       } },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin evaluar',   en: 'Not evaluated'   }, icon: '⚪', acceso: { es: 'Sin verificar',          en: 'Unverified'         } },
  no_sabe:     { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin datos',     en: 'No data'         }, icon: '⚪', acceso: { es: 'Sin información',        en: 'No information'     } },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', cardBorder: '#4A0E0E', label: { es: 'COLAPSADO',     en: 'COLLAPSED'       }, icon: '💥', acceso: { es: 'NO ENTRAR — COLAPSADO',  en: 'DO NOT ENTER'       } },
};

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

const PERSONA_ESTADO = {
  buscando:             { es: 'Buscando',            en: 'Searching',       cls: 'bg-yellow-100 text-yellow-800' },
  informacion_recibida: { es: 'Info recibida',       en: 'Info received',   cls: 'bg-blue-100 text-blue-700'    },
  visto_no_confirmado:  { es: 'Visto sin confirmar', en: 'Seen unconfirmed',cls: 'bg-orange-100 text-orange-700'},
  encontrado_con_vida:  { es: 'Encontrado ✅',       en: 'Found alive ✅',  cls: 'bg-green-100 text-green-800'  },
  en_hospital_refugio:  { es: 'Hospital/refugio',    en: 'Hospital/Shelter',cls: 'bg-teal-100 text-teal-800'   },
  fallecido_reportado:  { es: 'Fallecimiento rep.',  en: 'Death reported',  cls: 'bg-gray-200 text-gray-700'   },
};

const inputCls = "w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder-gray-400";
const MAX_FOTOS = 5;

// ── Orden de prioridad para sorting ──
const PRIORIDAD_SORT = { critico: 0, colapsado: 1, grave: 2, moderado: 3, leve: 4, no_evaluado: 5, no_sabe: 6 };

export default function Edificios() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || (params.get('modo') === 'request' ? 'solicitar' : 'directorio');

  const [tab, setTab] = useState(initialTab);

  // ── DIRECTORIO ──
  const [todos, setTodos] = useState([]);
  const [cargandoDir, setCargandoDir] = useState(true);
  const [filtroDir, setFiltroDir] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('todos'); // 'todos' | 'criticos' | 'atrapados' | 'sin_verificar' | 'con_contactos'
  const [ordenDir, setOrdenDir] = useState('recientes'); // 'prioridad' | 'recientes'
  const [pageDir, setPageDir] = useState(12);

  // ── PERSONAS ──
  const [personas, setPersonas] = useState([]);
  const [encontrados, setEncontrados] = useState([]);
  const [cargandoPer, setCargandoPer] = useState(true);
  const [filtroPer, setFiltroPer] = useState('');
  const [pagePer, setPagePer] = useState(8);

  // ── SOLICITUDES PENDIENTES ──
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSols, setCargandoSols] = useState(true);

  // ── Utilidad tiempo relativo ──
  const tiempoRelativo = (fecha) => {
    if (!fecha) return '';
    const diff = Date.now() - new Date(fecha).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d > 0) return es ? `hace ${d}d` : `${d}d ago`;
    if (h > 0) return es ? `hace ${h}h` : `${h}h ago`;
    if (m < 1) return es ? 'ahora' : 'now';
    return es ? `hace ${m}m` : `${m}m ago`;
  };

  useEffect(() => {
    base44.entities.ReportesDano.list('-updated_date', 300)
      .then(d => setTodos(d || []))
      .catch(() => {})
      .finally(() => setCargandoDir(false));
    Promise.all([
      base44.entities.PersonasBuscadas.list('-created_date', 100),
      base44.entities.PersonasEncontradas.list('-created_date', 50),
    ]).then(([b, e]) => {
      setPersonas((b || []).filter(p => p.estado_caso !== 'caso_cerrado'));
      setEncontrados(e || []);
    }).catch(() => {}).finally(() => setCargandoPer(false));
    base44.entities.SolicitudesInfoEdificio.filter({ estado_solicitud: 'pendiente' }, '-created_date', 10)
      .then(sols => { if (sols) setSolicitudes(sols.filter(s => s.nombre_lugar && !s.reporte_encontrado_id)); })
      .catch(() => {}).finally(() => setCargandoSols(false));
  }, []);

  // ── CONSULTAR ──
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // ── SUSCRIPCIÓN ──
  const [subEmail, setSubEmail] = useState('');
  const [subPara, setSubPara] = useState(null);
  const [subEnviando, setSubEnviando] = useState(false);
  const [subOk, setSubOk] = useState(false);

  const suscribirse = async (reporteId) => {
    if (!subEmail.trim()) return;
    setSubEnviando(true);
    try {
      await base44.entities.SuscriptoresSeguimiento.create({ reporte_id: reporteId, tipo_reporte: 'dano', telefono_whatsapp: subEmail.trim(), activo: true });
      setSubOk(true);
      setTimeout(() => setSubOk(false), 3000);
    } catch {}
    setSubEnviando(false);
    setSubEmail('');
    setSubPara(null);
  };

  const buscarEdificio = async () => {
    if (!query.trim()) return;
    setBuscando(true); setBuscado(false);
    try {
      const q = normalizar(query);
      const enc = todos.filter(r => {
        const dir = normalizar(r.direccion || '');
        const ciudad = normalizar(r.ciudad || '');
        const nombre = normalizar(r.nombre_lugar || '');
        return similitud(q, dir) > 0.4 || similitud(q, ciudad) > 0.6 || similitud(q, nombre) > 0.5 || dir.includes(q) || ciudad.includes(q) || nombre.includes(q);
      }).sort((a, b) => (PRIORIDAD_SORT[a.nivel_dano] ?? 5) - (PRIORIDAD_SORT[b.nivel_dano] ?? 5));
      setResultados(enc);
    } catch {}
    setBuscando(false); setBuscado(true);
  };

  // ── REPORTAR: FLUJO DE 3 ETAPAS ──
  const [etapa, setEtapa] = useState('validacion'); // 'validacion' | 'resultados' | 'formulario'
  const [valNombre, setValNombre] = useState('');
  const [valDireccion, setValDireccion] = useState('');
  const [posiblesDups, setPosiblesDups] = useState([]);
  const [buscandoDup, setBuscandoDup] = useState(false);
  const [dupBuscado, setDupBuscado] = useState(false);

  // Formulario completo (etapa 3)
  const [nombreLugar, setNombreLugar] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipo, setTipo] = useState('');
  const [nivel, setNivel] = useState('');
  const [atrapados, setAtrapados] = useState('');
  const [riesgoGas, setRiesgoGas] = useState(false);
  const [riesgoElec, setRiesgoElec] = useState(false);
  const [riesgoIncendio, setRiesgoIncendio] = useState(false);
  const [accesoCalle, setAccesoCalle] = useState('');
  const [accesoVehiculos, setAccesoVehiculos] = useState('');
  const [notasAcceso, setNotasAcceso] = useState('');
  const [electricidad, setElectricidad] = useState('');
  const [agua, setAgua] = useState('');
  const [gas, setGas] = useState('');
  const [racionamientoAgua, setRacionamientoAgua] = useState(false);
  const [racionamientoElec, setRacionamientoElec] = useState(false);
  const [horarioAgua, setHorarioAgua] = useState('');
  const [horarioElec, setHorarioElec] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estado, setEstado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [repNombre, setRepNombre] = useState('');
  const [repTelefono, setRepTelefono] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [contactosAcceso, setContactosAcceso] = useState([]);
  const CONTACTO_VACIO = { nombre: '', telefono: '', email: '', rol: '' };
  const agregarContacto = () => setContactosAcceso(prev => [...prev, { ...CONTACTO_VACIO }]);
  const quitarContacto = (i) => setContactosAcceso(prev => prev.filter((_, idx) => idx !== i));
  const setContacto = (i, k, v) => setContactosAcceso(prev => prev.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(null);

  const esCritico = nivel === 'critico' || nivel === 'grave' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces';

  // ── ETAPA 1: Validación de duplicados ──
  const verificarEdificio = async () => {
    if (!valDireccion.trim()) return;
    setBuscandoDup(true);
    setDupBuscado(false);
    try {
      const q = normalizar(valDireccion + ' ' + valNombre);
      const dups = todos.filter(r => {
        const dir = normalizar(r.direccion || '');
        const nombre = normalizar(r.nombre_lugar || '');
        return similitud(q, dir) > 0.45 || similitud(q, nombre) > 0.5 || dir.includes(q.slice(0, 10));
      }).sort((a, b) => (PRIORIDAD_SORT[a.nivel_dano] ?? 5) - (PRIORIDAD_SORT[b.nivel_dano] ?? 5));
      setPosiblesDups(dups);
      setDupBuscado(true);
      setEtapa('resultados');
    } catch {}
    setBuscandoDup(false);
  };

  // Ir a formulario con datos precargados
  const irAFormulario = () => {
    setNombreLugar(valNombre);
    setDireccion(valDireccion);
    setEtapa('formulario');
  };

  // ── SUBIR FOTOS ──
  const subirFoto = async (file) => {
    if (fotos.length >= MAX_FOTOS) return;
    const id = Date.now();
    setFotos(prev => [...prev, { id, url: null, uploading: true, error: false, preview: URL.createObjectURL(file) }]);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFotos(prev => prev.map(f => f.id === id ? { ...f, url: file_url, uploading: false } : f));
    } catch {
      setFotos(prev => prev.map(f => f.id === id ? { ...f, uploading: false, error: true } : f));
    }
  };
  const handleFotoInput = (e) => {
    Array.from(e.target.files || []).slice(0, MAX_FOTOS - fotos.length).forEach(subirFoto);
    e.target.value = '';
  };
  const quitarFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));

  // ── RESET ──
  const resetForm = () => {
    setEtapa('validacion');
    setValNombre(''); setValDireccion('');
    setPosiblesDups([]); setDupBuscado(false);
    setTipo(''); setNivel(''); setAtrapados('');
    setRiesgoGas(false); setRiesgoElec(false); setRiesgoIncendio(false);
    setAccesoCalle(''); setAccesoVehiculos(''); setNotasAcceso('');
    setElectricidad(''); setAgua(''); setGas('');
    setRacionamientoAgua(false); setRacionamientoElec(false);
    setHorarioAgua(''); setHorarioElec('');
    setCiudad(''); setEstado(''); setDescripcion('');
    setRepNombre(''); setRepTelefono(''); setRepEmail('');
    setFotos([]); setContactosAcceso([]);
  };

  // ── ENVIAR ──
  const handleSubmit = async () => {
    setEnviando(true);
    try {
      const prioridad = (nivel === 'critico' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces') ? 'critica' : nivel === 'grave' ? 'alta' : 'normal';
      const foto_urls = fotos.filter(f => f.url).map(f => f.url);
      const contactosFiltrados = contactosAcceso.filter(c => c.nombre.trim() || c.telefono.trim() || c.email.trim());
      const nuevo = await base44.entities.ReportesDano.create({
        tipo_estructura: tipo || 'otro', nombre_lugar: valNombre,
        nivel_dano: nivel || 'no_evaluado', personas_atrapadas: atrapados || 'no_sabe',
        riesgo_gas: riesgoGas, riesgo_electrico: riesgoElec, riesgo_incendio: riesgoIncendio,
        acceso_calle: accesoCalle || 'no_sabe',
        acceso_vehiculos: accesoVehiculos || 'no_sabe',
        notas_acceso: notasAcceso,
        electricidad: electricidad || 'no_confirmado',
        agua: agua || 'no_confirmado',
        gas: gas || 'no_confirmado',
        direccion: valDireccion, ciudad, estado_region: estado, descripcion, foto_urls, prioridad,
        reportante_nombre: repNombre, reportante_telefono: repTelefono, reportante_email: repEmail,
        contactos_acceso: contactosFiltrados,
        estado_verificacion: 'recibido', nivel_verificacion: 'sin_verificar', fuente: 'ciudadano',
      });
      setTodos(prev => [nuevo, ...prev]);
      setExito(true);
    } catch { setExito(false); }
    setEnviando(false);
  };

  const cfg = (d) => DANO_CONFIG[d] || DANO_CONFIG.no_evaluado;

  // ── Filtros directorio ──
  const criticos = todos.filter(r => ['critico', 'colapsado', 'grave'].includes(r.nivel_dano));
  const conAtrapados = todos.filter(r => ['si', 'voces'].includes(r.personas_atrapadas));
  const sinVerificar = todos.filter(r => r.nivel_verificacion === 'sin_verificar' || !r.nivel_verificacion);
  const conContactos = todos.filter(r => r.contactos_acceso?.length > 0);

  const dirBase = todos.filter(r => {
    if (!filtroDir.trim()) return true;
    const q = filtroDir.toLowerCase();
    return (r.direccion || '').toLowerCase().includes(q) || (r.ciudad || '').toLowerCase().includes(q) || (r.nombre_lugar || '').toLowerCase().includes(q);
  });
  const dirFiltrados = dirBase.filter(r => {
    if (filtroRapido === 'criticos') return ['critico', 'colapsado', 'grave'].includes(r.nivel_dano);
    if (filtroRapido === 'atrapados') return ['si', 'voces'].includes(r.personas_atrapadas);
    if (filtroRapido === 'sin_verificar') return r.nivel_verificacion === 'sin_verificar' || !r.nivel_verificacion;
    if (filtroRapido === 'con_contactos') return r.contactos_acceso?.length > 0;
    return true;
  }).sort((a, b) => {
    if (ordenDir === 'recientes') {
      return new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date);
    }
    return (PRIORIDAD_SORT[a.nivel_dano] ?? 5) - (PRIORIDAD_SORT[b.nivel_dano] ?? 5);
  });

  const perFiltradas = [...personas, ...encontrados].filter(p => {
    if (!filtroPer.trim()) return true;
    const q = filtroPer.toLowerCase();
    return (p.nombre_completo || p.nombre_o_descripcion || '').toLowerCase().includes(q) || (p.ciudad || '').toLowerCase().includes(q);
  });

  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {/* Encabezado */}
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-2">
            <ChevronLeft size={15} /> {t('Inicio', 'Home', 'Início')}
          </Link>
          <h1 className="text-xl font-bold text-gray-900">🏗️ {t('Edificios y estructuras', 'Buildings & structures', 'Edifícios e estruturas')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('Directorio de edificios reportados · Consulta y reporta daños.', 'Directory of reported buildings · Check and report damage.', 'Diretório de edifícios reportados · Consulte e reporte danos.')}</p>
        </div>

        {/* Banner guía de seguridad */}
        <Link to="/guia-edificios"
          className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 mb-4 no-underline">
          <span className="text-xl flex-shrink-0">📖</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white leading-tight">
              {t('¿Sabes cómo evaluar un edificio dañado?', 'Do you know how to evaluate a damaged building?', 'Sabe como avaliar um edifício danificado?')}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('Ver guía de seguridad estructural →', 'View structural safety guide →', 'Ver guia de segurança estrutural →')}
            </p>
          </div>
          <span className="text-gray-500 text-sm flex-shrink-0">›</span>
        </Link>

        {/* Alerta */}
        <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 font-medium leading-relaxed">
            {t('No entres a estructuras dañadas. Si hay grietas graves, gas, cables o atrapados — llama a Protección Civil (171) o Bomberos.',
               'Do not enter damaged structures. If there are cracks, gas, wires or trapped people — call Civil Protection (171) or Firefighters.',
               'Não entre em estruturas danificadas. Se houver rachaduras graves, gás, fios ou pessoas presas — ligue para Proteção Civil (171) ou Bombeiros.')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {[
            { key: 'directorio', label: t('📋 Directorio', '📋 Directory', '📋 Diretório') },
            { key: 'consultar',  label: t('🔍 Buscar',    '🔍 Search',    '🔍 Buscar')    },
            { key: 'reportar',   label: t('🚨 Reportar',  '🚨 Report',    '🚨 Reportar')  },
            { key: 'solicitar',  label: t('📋 Solicitar', '📋 Request',   '📋 Solicitar') },
          ].map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${tab === tb.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* ── DIRECTORIO ── */}
        {tab === 'directorio' && (
          <div>
            {/* Barra búsqueda + botón reportar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input value={filtroDir} onChange={e => { setFiltroDir(e.target.value); setPageDir(12); }}
                placeholder={t('Buscar por nombre, dirección, ciudad...', 'Search by name, address, city...', 'Buscar por nome, endereço, cidade...')}
                className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder-gray-400" />
              <button onClick={() => setTab('reportar')} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap flex-shrink-0">
                + {t('Reportar daño', 'Report damage', 'Reportar dano')}
              </button>
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{t('Ordenar:', 'Sort:', 'Ordenar:')}</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                <button onClick={() => { setOrdenDir('prioridad'); setPageDir(12); }}
                  className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${ordenDir === 'prioridad' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  🚨 {t('Prioridad', 'Priority', 'Prioridade')}
                </button>
                <button onClick={() => { setOrdenDir('recientes'); setPageDir(12); }}
                  className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors border-l border-gray-200 ${ordenDir === 'recientes' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  🕐 {t('Recientes', 'Recent', 'Recentes')}
                </button>
              </div>
            </div>

            {/* Chips de filtro rápido con contadores */}
            <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-1">
              {[
                { key: 'todos',         label: t(`Todos (${todos.length})`, `All (${todos.length})`, `Todos (${todos.length})`), color: 'gray' },
                { key: 'criticos',      label: t(`🚨 Críticos (${criticos.length})`, `🚨 Critical (${criticos.length})`, `🚨 Críticos (${criticos.length})`), color: 'red' },
                { key: 'atrapados',     label: t(`🆘 Atrapados (${conAtrapados.length})`, `🆘 Trapped (${conAtrapados.length})`, `🆘 Presos (${conAtrapados.length})`), color: 'orange' },
                { key: 'con_contactos', label: t(`📞 Con contactos (${conContactos.length})`, `📞 With contacts (${conContactos.length})`, `📞 Com contatos (${conContactos.length})`), color: 'teal' },
                { key: 'sin_verificar', label: t(`⚪ Sin verificar (${sinVerificar.length})`, `⚪ Unverified (${sinVerificar.length})`, `⚪ Sem verificar (${sinVerificar.length})`), color: 'gray' },
              ].map(chip => {
                const active = filtroRapido === chip.key;
                const colorMap = {
                  red:    active ? 'bg-red-600 text-white border-red-600'         : 'bg-white text-red-600 border-red-300',
                  orange: active ? 'bg-orange-600 text-white border-orange-600'   : 'bg-white text-orange-700 border-orange-300',
                  teal:   active ? 'bg-teal-700 text-white border-teal-700'       : 'bg-white text-teal-700 border-teal-300',
                  gray:   active ? 'bg-gray-800 text-white border-gray-800'       : 'bg-white text-gray-600 border-gray-300',
                };
                return (
                  <button key={chip.key} onClick={() => { setFiltroRapido(chip.key); setPageDir(12); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${colorMap[chip.color]}`}>
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {cargandoDir ? (
              <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                {t('Cargando directorio...', 'Loading directory...', 'Carregando diretório...')}
              </div>
            ) : dirFiltrados.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
                <p className="text-2xl mb-2">🏗️</p>
                <p>{t('Sin reportes para este filtro.', 'No reports for this filter.', 'Sem relatórios para este filtro.')}</p>
                <button onClick={() => setTab('reportar')} className="text-blue-600 underline text-sm mt-2 cursor-pointer">
                  {t('Ser el primero en reportar →', 'Be the first to report →', 'Seja o primeiro a reportar →')}
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  {dirFiltrados.length} {t(
                    `edificio(s) · ${ordenDir === 'recientes' ? 'más recientes primero' : 'ordenados por prioridad'}`,
                    `building(s) · ${ordenDir === 'recientes' ? 'most recent first' : 'sorted by priority'}`,
                    `edifício(s) · ${ordenDir === 'recientes' ? 'mais recentes primeiro' : 'ordenados por prioridade'}`
                  )}
                </p>

                {/* Grid con borde de color por nivel de daño */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {dirFiltrados.slice(0, pageDir).map(r => {
                    const c = cfg(r.nivel_dano);
                    const noEntrar = ['grave', 'critico', 'colapsado'].includes(r.nivel_dano);
                    const esCrit = noEntrar || r.prioridad === 'critica';
                    return (
                      <Link key={r.id} to={`/edificio?id=${r.id}`}
                        className="bg-white rounded-xl overflow-hidden no-underline hover:shadow-md transition-shadow flex flex-col"
                        style={{ border: `2px solid ${esCrit ? c.cardBorder : '#E5E7EB'}` }}>
                        {/* Foto o placeholder de color */}
                        {r.foto_urls?.length > 0 ? (
                          <div className="relative">
                            <img src={r.foto_urls[0]} alt="" className="w-full h-28 object-cover" loading="lazy" />
                            {r.foto_urls.length > 1 && (
                              <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                                +{r.foto_urls.length - 1}📷
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-28 flex flex-col items-center justify-center gap-1" style={{ background: c.bg }}>
                            <span className="text-3xl">{c.icon}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: c.color }}>
                              {t(c.label.es, c.label.en, c.label.es)}
                            </span>
                          </div>
                        )}

                        <div className="p-3 flex-1 flex flex-col gap-1">
                          {/* Badge NO ENTRAR */}
                          {esCrit && (
                            <span className="self-start text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded">
                              🚫 {t('NO ENTRAR', 'DO NOT ENTER', 'NÃO ENTRAR')}
                            </span>
                          )}

                          {/* Nombre */}
                          <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                            {r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || t('Sin nombre', 'Unnamed', 'Sem nome')}
                          </p>

                          {/* Tipo de estructura */}
                          {r.tipo_estructura && (
                            <p className="text-[10px] text-gray-400 truncate capitalize">{r.tipo_estructura.replace(/_/g, ' ')}</p>
                          )}

                          {/* Ubicación */}
                          <p className="text-[10px] text-gray-400 truncate">📍 {[r.direccion, r.ciudad].filter(Boolean).join(' · ') || '—'}</p>

                          {/* Badge nivel daño */}
                          <span className="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-auto"
                            style={{ color: c.color, borderColor: c.border, background: c.bg }}>
                            {c.icon} {t(c.label.es, c.label.en, c.label.es)}
                          </span>

                          {/* Íconos de riesgo */}
                          {(r.riesgo_gas || r.riesgo_electrico || r.riesgo_incendio || r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces') && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {(r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces') && (
                                <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full font-bold">🆘</span>
                              )}
                              {r.riesgo_gas      && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded-full">💨</span>}
                              {r.riesgo_electrico && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-full">⚡</span>}
                              {r.riesgo_incendio  && <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full">🔥</span>}
                            </div>
                          )}

                          {/* Verificación */}
                          {r.nivel_verificacion === 'institucional' && (
                            <span className="text-[9px] text-teal-700 font-semibold">🛡️ {t('Verificado', 'Verified', 'Verificado')}</span>
                          )}

                          {/* Fila inferior: tiempo + contactos + notificarme */}
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                            <span className="text-[9px] text-gray-400">
                              🕐 {tiempoRelativo(r.updated_date || r.created_date)}
                            </span>
                            <div className="flex items-center gap-1">
                              {r.contactos_acceso?.length > 0 && (
                                <span className="text-[9px] text-teal-600 font-semibold">
                                  📞 {r.contactos_acceso.length}
                                </span>
                              )}
                              <Link
                                to={`/edificio?id=${r.id}`}
                                onClick={e => e.stopPropagation()}
                                className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full no-underline hover:bg-blue-100 flex items-center gap-0.5"
                              >
                                🔔 {t('Avisar', 'Alert', 'Avisar')}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {dirFiltrados.length > pageDir && (
                  <button onClick={() => setPageDir(v => v + 12)}
                    className="w-full py-3 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
                    {t(`Ver ${Math.min(12, dirFiltrados.length - pageDir)} más`, `Load ${Math.min(12, dirFiltrados.length - pageDir)} more`, `Ver ${Math.min(12, dirFiltrados.length - pageDir)} mais`)}
                  </button>
                )}
              </>
            )}

            {/* Solicitudes pendientes */}
            {!cargandoSols && solicitudes.length > 0 && (
              <div className="mt-8 mb-6">
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                  <span className="text-base">🧑‍🤝‍🧑</span>
                  <div>
                    <p className="text-xs font-bold text-purple-800">{t('Vecinos están buscando información', 'Neighbors are looking for information', 'Vizinhos buscam informações')}</p>
                    <p className="text-[11px] text-purple-600">{t('¿Conoces alguno? Tu información ayuda a la comunidad.', 'Do you know any? Your info helps the community.', 'Você conhece algum? Sua informação ajuda a comunidade.')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {solicitudes.slice(0, 5).map(s => (
                    <Link key={s.id} to={`/edificio?id=${s.id}`}
                      className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3 no-underline hover:bg-amber-100 transition-colors gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{s.nombre_lugar}</p>
                        <p className="text-xs text-gray-500 truncate">📍 {s.direccion || t('Sin dirección', 'No address', 'Sem endereço')} · {s.ciudad}</p>
                      </div>
                      <span className="text-xs font-semibold bg-purple-700 text-white px-3 py-1.5 rounded-lg flex-shrink-0">
                        {t('Tengo info →', 'I have info →', 'Tenho info →')}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla de personas */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-base font-bold text-gray-800">👤 {t('Personas buscadas y encontradas', 'Missing & Found people', 'Pessoas procuradas e encontradas')}</h2>
                <input value={filtroPer} onChange={e => { setFiltroPer(e.target.value); setPagePer(8); }}
                  placeholder={t('Filtrar por nombre, ciudad...', 'Filter by name, city...', 'Filtrar por nome, cidade...')}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 w-full sm:w-64" />
              </div>
              {cargandoPer ? (
                <div className="text-center py-6 text-gray-400 text-sm">{t('Cargando...', 'Loading...', 'Carregando...')}</div>
              ) : (
                <>
                  <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Nombre', 'Name', 'Nome')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Edad', 'Age', 'Idade')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Última ubicación', 'Last location', 'Última localização')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Estado', 'Status', 'Estado')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Tipo', 'Type', 'Tipo')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {perFiltradas.slice(0, pagePer).map(p => {
                          const esBuscada = !!p.nombre_completo;
                          const nombre = p.nombre_completo || p.nombre_o_descripcion || '—';
                          const estado_caso = p.estado_caso || p.condicion;
                          const st = PERSONA_ESTADO[estado_caso] || { es: estado_caso || '—', en: estado_caso || '—', cls: 'bg-gray-100 text-gray-600' };
                          return (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900 text-xs">{nombre}</p>
                                {p.sexo && <p className="text-[10px] text-gray-400">{p.sexo}</p>}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">{p.edad_aprox || '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                <p>{p.ultima_ubicacion_conocida || p.ubicacion_actual || '—'}</p>
                                <p className="text-gray-400">{p.ciudad}{p.estado_region ? `, ${p.estado_region}` : ''}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{es ? st.es : st.en}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${esBuscada ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                  {esBuscada ? t('Buscada', 'Missing', 'Procurada') : t('Encontrada', 'Found', 'Encontrada')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden space-y-2 mb-4">
                    {perFiltradas.slice(0, pagePer).map(p => {
                      const esBuscada = !!p.nombre_completo;
                      const nombre = p.nombre_completo || p.nombre_o_descripcion || '—';
                      const estado_caso = p.estado_caso || p.condicion;
                      const st = PERSONA_ESTADO[estado_caso] || { es: estado_caso || '—', en: estado_caso || '—', cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p>
                            <p className="text-xs text-gray-400 truncate">📍 {p.ultima_ubicacion_conocida || p.ubicacion_actual || '—'} · {p.ciudad}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{es ? st.es : st.en}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${esBuscada ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {esBuscada ? t('Buscada', 'Missing', 'Procurada') : t('Encontrada', 'Found', 'Encontrada')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {perFiltradas.length > pagePer && (
                    <button onClick={() => setPagePer(v => v + 8)} className="w-full py-2.5 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
                      {t(`Ver ${Math.min(8, perFiltradas.length - pagePer)} más`, `Load ${Math.min(8, perFiltradas.length - pagePer)} more`, `Ver ${Math.min(8, perFiltradas.length - pagePer)} mais`)}
                    </button>
                  )}
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <Link to="/buscar-persona" className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-semibold no-underline hover:bg-amber-100">
                      + {t('Reportar persona buscada', 'Report missing person', 'Reportar pessoa procurada')}
                    </Link>
                    <Link to="/reportar-encontrado" className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg font-semibold no-underline hover:bg-green-100">
                      + {t('Reportar persona encontrada', 'Report found person', 'Reportar pessoa encontrada')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── CONSULTAR ── */}
        {tab === 'consultar' && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1">{t('¿Es seguro este edificio?', 'Is this building safe?', 'Este edifício é seguro?')}</h2>
              <p className="text-sm text-gray-500 mb-4">{t('Escribe la dirección, nombre o zona para ver si hay reportes.', 'Type the address, name or area to see if there are reports.', 'Digite o endereço, nome ou área para ver se há relatórios.')}</p>
              <div className="flex gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarEdificio()}
                  placeholder={t('Ej: Edif. Las Torres, Av. Principal, La Guaira...', 'E.g: Las Torres building, Main Ave, La Guaira...', 'Ex: Ed. Las Torres, Av. Principal, La Guaira...')}
                  className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600" />
                <button onClick={buscarEdificio} disabled={buscando}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                  {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  {t('Buscar', 'Search', 'Buscar')}
                </button>
              </div>
            </div>
            {buscado && !buscando && resultados.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800 text-sm">{t('Sin reportes de daño para esta búsqueda.', 'No damage reports found for this search.', 'Nenhum relatório de dano para esta busca.')}</p>
                <p className="text-xs text-green-600 mt-1">{t('Esto no garantiza que sea 100% seguro. Si ves daños, repórtalos.', 'This does not guarantee 100% safety. If you see damage, report it.', 'Isso não garante 100% de segurança. Se ver danos, reporte.')}</p>
                <button onClick={() => setTab('reportar')} className="mt-3 text-sm text-blue-700 underline cursor-pointer">{t('Reportar daño →', 'Report damage →', 'Reportar dano →')}</button>
              </div>
            )}
            {resultados.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{resultados.length} {t('reporte(s)', 'report(s)', 'relatório(s)')}</p>
                {resultados.map(r => {
                  const c = cfg(r.nivel_dano);
                  const noEntrar = ['grave', 'critico', 'colapsado'].includes(r.nivel_dano);
                  return (
                    <div key={r.id} style={{ background: c.bg, borderColor: c.border }} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{c.icon}</span>
                            <span className="font-bold text-sm" style={{ color: c.color }}>{t(c.label.es, c.label.en, c.label.es)}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{r.nombre_lugar || r.tipo_estructura}</p>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><MapPin size={10} />{r.direccion} · {r.ciudad}, {r.estado_region}</p>
                        </div>
                        {noEntrar && (
                          <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0 text-center leading-tight">
                            {t('NO\nENTRAR', 'DO NOT\nENTER', 'NÃO\nENTRAR')}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {r.personas_atrapadas === 'si'    && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🚨 {t('Atrapados', 'Trapped', 'Presos')}</span>}
                        {r.riesgo_gas                     && <span className="text-xs bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">💨 Gas</span>}
                        {r.riesgo_electrico               && <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">⚡</span>}
                        {r.riesgo_incendio                && <span className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">🔥</span>}
                      </div>
                      {r.foto_urls?.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {r.foto_urls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          ))}
                          {r.foto_urls.length > 3 && <span className="text-xs text-gray-400 self-center">+{r.foto_urls.length - 3}</span>}
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: c.border }}>
                        <p className="text-xs font-medium" style={{ color: c.color }}>🚪 {t(c.acceso.es, c.acceso.en, c.acceso.es)}</p>
                        {r.descripcion && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.descripcion}</p>}
                      </div>
                      {subPara?.id === r.id && (
                        <div className="mt-3 flex gap-2">
                          <input value={subEmail} onChange={e => setSubEmail(e.target.value)}
                            placeholder={t('Tu email...', 'Your email...', 'Seu email...')}
                            className="flex-1 border-2 border-gray-300 rounded-lg px-2.5 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-blue-600 placeholder-gray-400" />
                          <button onClick={() => suscribirse(r.id)} disabled={subEnviando}
                            className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-40 cursor-pointer">
                            {t('Suscribir', 'Subscribe', 'Inscrever')}
                          </button>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between items-center">
                        {subOk && subPara?.id === r.id && <span className="text-xs text-green-600 font-medium">✅ {t('Suscrito.', 'Subscribed.', 'Inscrito.')}</span>}
                        {(!subPara || subPara.id !== r.id) && (
                          <button onClick={() => setSubPara({ id: r.id })} className="text-[11px] text-blue-600 underline cursor-pointer">
                            🔔 {t('Avísame si cambia el estado', 'Notify me of changes', 'Me avise se mudar')}
                          </button>
                        )}
                        <Link to={`/edificio?id=${r.id}`} className="text-[11px] text-blue-600 font-semibold no-underline hover:underline">
                          {t('Ver ficha completa →', 'View full record →', 'Ver ficha completa →')}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SOLICITAR ── */}
        {tab === 'solicitar' && (
          <div className="text-center py-8">
            <p className="text-2xl mb-3">📋</p>
            <p className="text-sm text-gray-500 mb-4">
              {t('¿No encuentras un edificio en el directorio? Solicita que lo incluyamos.',
                 "Can't find a building in the directory? Request it and we'll add it.",
                 'Não encontrou um edifício no diretório? Solicite que o incluamos.')}
            </p>
            <Link to="/solicitar-info-edificio"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 rounded-xl text-sm no-underline transition-colors">
              📋 {t('Solicitar información de un edificio', 'Request building information', 'Solicitar informações de um edifício')}
            </Link>
          </div>
        )}

        {/* ── REPORTAR ── FLUJO DE 3 ETAPAS */}
        {tab === 'reportar' && (
          <div className="max-w-2xl">
            {exito === true && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-4">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold text-green-800 text-lg mb-1">{t('Reporte enviado.', 'Report submitted.', 'Relatório enviado.')}</h3>
                <p className="text-sm text-green-700 mb-3">{t('Gracias. Tu reporte ayuda a que otras personas eviten el peligro.', 'Thank you. Your report helps others avoid danger.', 'Obrigado. Seu relatório ajuda outras pessoas a evitar o perigo.')}</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { resetForm(); setExito(null); }} className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    {t('Reportar otro', 'Report another', 'Reportar outro')}
                  </button>
                  <button onClick={() => setTab('directorio')} className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer">
                    {t('Ver directorio', 'View directory', 'Ver diretório')}
                  </button>
                </div>
              </div>
            )}

            {exito !== true && (
              <>
                {/* ── ETAPA 1: VALIDACIÓN ── */}
                {etapa === 'validacion' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h2 className="text-base font-bold text-gray-800 mb-1">
                        {t('Verificar si el lugar ya existe', 'Check if the place already exists', 'Verificar se o local já existe')}
                      </h2>
                      <p className="text-sm text-gray-500 mb-4">
                        {t('Primero verificamos si este lugar ya fue reportado. Así evitamos duplicados y mantenemos la información actualizada.',
                           'First we check if this place was already reported. This avoids duplicates and keeps information up to date.',
                           'Primeiro verificamos se este local já foi reportado. Assim evitamos duplicatas e mantemos as informações atualizadas.')}
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Nombre del lugar (si lo sabes)', 'Place name (if known)', 'Nome do lugar (se souber)')}</label>
                          <input value={valNombre} onChange={e => { setValNombre(e.target.value); setEtapa('validacion'); }}
                            onKeyDown={e => e.key === 'Enter' && verificarEdificio()}
                            placeholder={t('Ej: Hospital Central, Edificio Las Torres...', 'E.g: Central Hospital, Las Torres building...', 'Ex: Hospital Central, Edifício Las Torres...')}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Dirección o zona', 'Address or area', 'Endereço ou área')} <span className="text-red-500">*</span></label>
                          <input value={valDireccion} onChange={e => { setValDireccion(e.target.value); setEtapa('validacion'); }}
                            onKeyDown={e => e.key === 'Enter' && verificarEdificio()}
                            placeholder={t('Ej: Av. Soublette, frente al mercado, La Guaira', 'E.g: Soublette Ave, next to market, La Guaira', 'Ex: Av. Soublette, em frente ao mercado, La Guaira')}
                            className={inputCls} />
                        </div>
                        <button onClick={verificarEdificio} disabled={buscandoDup || !valDireccion.trim()}
                          className="btn-primary bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-40">
                          {buscandoDup ? <Loader2 size={16} className="animate-spin" /> : '🔍'}
                          {buscandoDup ? t('Verificando...', 'Checking...', 'Verificando...') : t('Verificar lugar', 'Check place', 'Verificar local')}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 text-center">{t('Tu privacidad importa. No compartimos tus datos sin tu consentimiento.', 'Your privacy matters. We do not share your data without consent.', 'Sua privacidade importa. Não compartilhamos seus dados sem consentimento.')}</p>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 2: RESULTADOS ── */}
                {etapa === 'resultados' && (
                  <div className="space-y-4">
                    {buscandoDup ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                        {t('Verificando duplicados...', 'Checking for duplicates...', 'Verificando duplicatas...')}
                      </div>
                    ) : posiblesDups.length > 0 ? (
                      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 space-y-3">
                        <div className="flex gap-2 items-start">
                          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-amber-800">
                              {t(`Encontramos ${posiblesDups.length} reporte(s) similar(es)`, `We found ${posiblesDups.length} similar report(s)`, `Encontramos ${posiblesDups.length} relatório(s) similar(es)`)}
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">{t('Selecciona uno para agregar tu información o crea un reporte nuevo.', 'Select one to add your info or create a new report.', 'Selecione um para adicionar suas informações ou crie um novo relatório.')}</p>
                          </div>
                        </div>
                        {posiblesDups.slice(0, 4).map(d => {
                          const c = cfg(d.nivel_dano);
                          const esNoEntrar = ['grave', 'critico', 'colapsado'].includes(d.nivel_dano);
                          return (
                            <div key={d.id} className="bg-white border border-amber-300 rounded-xl p-3">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">{d.nombre_lugar || d.tipo_estructura?.replace(/_/g, ' ') || t('Sin nombre', 'Unnamed', 'Sem nome')}</p>
                                  <p className="text-xs text-gray-500 truncate">📍 {d.direccion || '—'} · {d.ciudad || '—'}</p>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
                                  {c.icon} {t(c.label.es, c.label.en, c.label.es)}
                                </span>
                              </div>
                              {esNoEntrar && <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded">🚫 {t('NO ENTRAR', 'DO NOT ENTER', 'NÃO ENTRAR')}</span>}
                              {(d.personas_atrapadas === 'si' || d.personas_atrapadas === 'voces') && (
                                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full ml-1">🆘</span>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Link to={`/edificio?id=${d.id}`}
                                  className="flex-1 text-center text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold no-underline hover:bg-blue-700 transition-colors">
                                  👁️ {t('Ver y actualizar', 'View & update', 'Ver e atualizar')}
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                        <button onClick={irAFormulario}
                          className="w-full text-sm font-bold bg-white border-2 border-amber-400 text-amber-800 hover:bg-amber-50 py-3 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
                          ➕ {t('No es el mismo — Reportar edificio nuevo', 'It is different — Report new building', 'Não é o mesmo — Reportar novo edifício')}
                        </button>
                        <button onClick={() => setEtapa('validacion')}
                          className="w-full text-xs text-gray-400 underline cursor-pointer">
                          {t('Volver a buscar', 'Search again', 'Voltar a buscar')}
                        </button>
                      </div>
                    ) : (
                      /* Sin duplicados encontrados — ir directo al formulario */
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                        <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
                        <p className="font-bold text-green-800 text-sm">
                          {t('Sin reportes previos para este lugar.', 'No previous reports for this place.', 'Nenhum relatório anterior para este local.')}
                        </p>
                        <p className="text-xs text-green-600 mt-1 mb-4">
                          {t('Puedes crear un nuevo reporte. Toda la información ayuda.', 'You can create a new report. All information helps.', 'Você pode criar um novo relatório. Toda informação ajuda.')}
                        </p>
                        <button onClick={irAFormulario}
                          className="bg-green-700 hover:bg-green-800 text-white text-sm font-bold px-8 py-3.5 rounded-xl cursor-pointer transition-colors">
                          ➕ {t('Crear reporte de daño', 'Create damage report', 'Criar relatório de dano')}
                        </button>
                        <button onClick={() => setEtapa('validacion')}
                          className="block mx-auto mt-3 text-xs text-gray-400 underline cursor-pointer">
                          {t('Buscar otro lugar', 'Search another place', 'Buscar outro local')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ETAPA 3: FORMULARIO COMPLETO ── */}
                {etapa === 'formulario' && (
                  <div className="space-y-4">
                    {/* Barra de progreso */}
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => setEtapa('validacion')} className="text-xs text-gray-400 underline cursor-pointer flex items-center gap-1">
                        <ChevronLeft size={12} /> {t('Volver', 'Back', 'Voltar')}
                      </button>
                      <div className="flex-1 text-right">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {t('Nuevo reporte', 'New report', 'Novo relatório')}
                        </span>
                      </div>
                    </div>

                    {/* Advertencia de seguridad */}
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex gap-3">
                      <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800 font-medium leading-relaxed">
                        {t('No entres a estructuras dañadas. Si hay grietas graves, olor a gas, cables caídos, incendio o personas atrapadas — espera a Protección Civil (171), Bomberos o rescatistas autorizados.',
                           'Do not enter damaged structures. If there are major cracks, gas smell, fallen wires, fire or trapped people — wait for Civil Protection (171), Firefighters or authorized rescue teams.',
                           'Não entre em estruturas danificadas. Se houver rachaduras graves, cheiro de gás, fios caídos, incêndio ou pessoas presas — aguarde Proteção Civil (171), Bombeiros ou equipes de resgate autorizadas.')}
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

                    {/* 2. Confirmar ubicación */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800">2. {t('Ubicación', 'Location', 'Localização')} <span className="text-red-500">*</span></h3>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Nombre del lugar', 'Place name', 'Nome do lugar')}</label>
                        <input value={valNombre} onChange={e => setValNombre(e.target.value)}
                          placeholder={t('Ej: Edificio Las Torres', 'E.g: Las Torres building', 'Ex: Edifício Las Torres')}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Dirección o referencia', 'Address or reference', 'Endereço ou referência')}</label>
                        <p className="text-xs text-green-600 mb-1 flex items-center gap-1"><CheckCircle size={10} />{valDireccion}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Ciudad', 'City', 'Cidade')} <span className="text-red-600">*</span></label>
                          <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="La Guaira" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Estado', 'State', 'Estado')} <span className="text-red-600">*</span></label>
                          <input value={estado} onChange={e => setEstado(e.target.value)} placeholder="Vargas" className={inputCls} />
                        </div>
                      </div>
                    </div>

                    {/* 3. Nivel */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">3. {t('Nivel de daño visible', 'Visible damage level', 'Nível de dano visível')} <span className="text-red-500">*</span></h3>
                      <div className="space-y-2">
                        {NIVEL_OPTS.map(n => (
                          <button key={n.val} onClick={() => setNivel(n.val)}
                            className={`w-full py-3 px-4 rounded-lg text-sm text-left border cursor-pointer transition-colors ${nivel === n.val
                              ? n.val === 'critico' ? 'bg-red-700 text-white border-red-700' : n.val === 'grave' ? 'bg-red-500 text-white border-red-500' : n.val === 'moderado' ? 'bg-orange-500 text-white border-orange-500' : n.val === 'leve' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-gray-600 text-white border-gray-600'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
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
                          { val: riesgoGas,      set: setRiesgoGas,      label: { es: '💨 Olor a gas',               en: '💨 Gas smell',      pt: '💨 Cheiro de gás'     } },
                          { val: riesgoElec,     set: setRiesgoElec,     label: { es: '⚡ Cables caídos / eléctrico', en: '⚡ Fallen wires',    pt: '⚡ Fios caídos'       } },
                          { val: riesgoIncendio, set: setRiesgoIncendio, label: { es: '🔥 Riesgo de incendio',        en: '🔥 Fire hazard',     pt: '🔥 Risco de incêndio' } },
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
                        <p className="text-xs font-semibold text-gray-700 mb-2">🚶 {t('¿Cómo está la calle para llegar?', 'How is the street to get there?', 'Como está a rua para chegar?')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { val: 'normal',        es: '✅ Libre, sin problema',          en: '✅ Clear, no issues'          },
                            { val: 'dificultad',    es: '⚠️ Se puede, con dificultad',     en: '⚠️ Passable, with difficulty' },
                            { val: 'solo_peatonal', es: '🚶 Solo a pie',                    en: '🚶 On foot only'              },
                            { val: 'bloqueada',     es: '🚫 Bloqueada — no pasa nadie',    en: '🚫 Blocked — no one passes'  },
                            { val: 'insegura',      es: '☠️ Peligrosa — no intentes',      en: '☠️ Dangerous — do not try'   },
                            { val: 'no_sabe',       es: '❓ No sé',                          en: '❓ Unknown'                   },
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
                        <p className="text-[10px] text-gray-400 mb-2">{t('Ayuda a coordinar ambulancias y rescatistas.', 'Helps coordinate ambulances and rescue teams.', 'Ajuda a coordenar ambulâncias e equipes de resgate.')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { val: 'carros',      es: '🚗 Carros normales',                en: '🚗 Regular cars'              },
                            { val: 'ambulancias', es: '🚑 Ambulancias',                    en: '🚑 Ambulances'                },
                            { val: 'solo_motos',  es: '🏍️ Solo motos',                    en: '🏍️ Motorcycles only'          },
                            { val: 'bloqueado',   es: '🚫 Nada puede pasar',               en: '🚫 Nothing can pass'          },
                            { val: 'no_sabe',     es: '❓ No sé',                          en: '❓ Unknown'                   },
                          ].map(a => (
                            <button key={a.val} onClick={() => setAccesoVehiculos(a.val)}
                              className={`py-2 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${accesoVehiculos === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                              {es ? a.es : a.en}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">📝 {t('Nota sobre acceso (opcional)', 'Access note (optional)', 'Nota de acesso (opcional)')}</label>
                        <input value={notasAcceso} onChange={e => setNotasAcceso(e.target.value)}
                          placeholder={t('Ej: Hay escombros en la entrada, acera rota...', 'E.g.: Debris at entrance, broken sidewalk...', 'Ex: Escombros na entrada, calçada quebrada...')}
                          className={inputCls} />
                      </div>
                    </div>

                    {/* 7. Servicios básicos */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-800">7. {t('Servicios básicos', 'Basic services', 'Serviços básicos')}</h3>
                      <p className="text-xs text-gray-400 -mt-2">{t('Marca solo lo que sabes con certeza.', 'Only mark what you know for sure.', 'Marque apenas o que sabe com certeza.')}</p>

                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">⚡ {t('Electricidad', 'Electricity', 'Eletricidade')}</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {[
                            { val: 'disponible',    es: '✅ Hay luz',       en: '✅ Has power'    },
                            { val: 'intermitente',  es: '⚡ Intermitente',  en: '⚡ Intermittent' },
                            { val: 'no_disponible', es: '❌ Sin luz',       en: '❌ No power'     },
                            { val: 'no_confirmado', es: '❓ No sé',         en: '❓ Unknown'      },
                          ].map(o => (
                            <button key={o.val} onClick={() => setElectricidad(o.val)}
                              className={`py-2 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${electricidad === o.val ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white border-gray-200 text-gray-700 hover:border-yellow-300'}`}>
                              {es ? o.es : o.en}
                            </button>
                          ))}
                        </div>
                        {electricidad === 'intermitente' && (
                          <div className="space-y-2 mt-1">
                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                              <input type="checkbox" checked={racionamientoElec} onChange={e => setRacionamientoElec(e.target.checked)} className="rounded" />
                              {t('Hay racionamiento eléctrico', 'Electricity is rationed', 'Há racionamento elétrico')}
                            </label>
                            {racionamientoElec && (
                              <input value={horarioElec} onChange={e => setHorarioElec(e.target.value)}
                                placeholder={t('Horario: ej. 6am-10am y 6pm-10pm', 'Schedule: e.g. 6am-10am and 6pm-10pm', 'Horário: ex. 6h-10h e 18h-22h')} className={inputCls} />
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">💧 {t('Agua corriente', 'Running water', 'Água corrente')}</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {[
                            { val: 'disponible',    es: '✅ Hay agua',      en: '✅ Has water'    },
                            { val: 'intermitente',  es: '💧 Intermitente',  en: '💧 Intermittent' },
                            { val: 'no_disponible', es: '❌ Sin agua',      en: '❌ No water'     },
                            { val: 'no_confirmado', es: '❓ No sé',         en: '❓ Unknown'      },
                          ].map(o => (
                            <button key={o.val} onClick={() => setAgua(o.val)}
                              className={`py-2 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${agua === o.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                              {es ? o.es : o.en}
                            </button>
                          ))}
                        </div>
                        {agua === 'intermitente' && (
                          <div className="space-y-2 mt-1">
                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                              <input type="checkbox" checked={racionamientoAgua} onChange={e => setRacionamientoAgua(e.target.checked)} className="rounded" />
                              {t('Hay racionamiento de agua', 'Water is rationed', 'Há racionamento de água')}
                            </label>
                            {racionamientoAgua && (
                              <input value={horarioAgua} onChange={e => setHorarioAgua(e.target.value)}
                                placeholder={t('Horario: ej. Martes y viernes 5am-8am', 'Schedule: e.g. Tue & Fri 5am-8am', 'Horário: ex. Ter e Sex 5h-8h')} className={inputCls} />
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">🔥 {t('Gas doméstico', 'Gas service', 'Gás doméstico')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { val: 'disponible',     es: '✅ Gas normal',    en: '✅ Gas on'     },
                            { val: 'suspendido',     es: '🚫 Gas cortado',   en: '🚫 Gas cut'   },
                            { val: 'fuga_reportada', es: '☠️ FUGA de gas',   en: '☠️ GAS LEAK'  },
                            { val: 'no_disponible',  es: '❌ Sin gas',       en: '❌ No gas'    },
                            { val: 'no_confirmado',  es: '❓ No sé',         en: '❓ Unknown'   },
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
                            <p className="text-xs text-red-700 font-bold">{t('🚨 URGENTE: Evacúa el área. Llama a Bomberos.', '🚨 URGENT: Evacuate the area. Call Firefighters.', '🚨 URGENTE: Evacue a área. Ligue para os Bombeiros.')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 8. Fotos */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">8. {t('Fotos del daño (máx. 5, opcional)', 'Photos of damage (max 5, optional)', 'Fotos do dano (máx. 5, opcional)')}</h3>
                      <p className="text-xs text-gray-400 mb-3">{t('Solo desde un lugar seguro. No entres al edificio.', 'Only from a safe location. Do not enter the building.', 'Somente de um lugar seguro. Não entre no edifício.')}</p>
                      {fotos.length < MAX_FOTOS && (
                        <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors mb-3">
                          <Camera size={20} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{t('Agregar fotos', 'Add photos', 'Adicionar fotos')}</p>
                            <p className="text-xs text-gray-400">{MAX_FOTOS - fotos.length} {t('espacio(s) restante(s)', 'slot(s) remaining', 'espaço(s) restante(s)')}</p>
                          </div>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFotoInput} />
                        </label>
                      )}
                      {fotos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {fotos.map(f => (
                            <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              {f.preview && <img src={f.preview} alt="" className="w-full h-full object-cover" />}
                              {f.uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-white" /></div>}
                              {f.error && <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center"><span className="text-white text-xs font-bold">!</span></div>}
                              {!f.uploading && <button onClick={() => quitarFoto(f.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer hover:bg-red-700"><X size={10} /></button>}
                              {f.url && !f.uploading && <div className="absolute bottom-1 left-1 w-3 h-3 rounded-full bg-green-500" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 9. Contactos de acceso */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">9. {t('¿Quién puede dar acceso para inspección?', 'Who can grant access for inspection?', 'Quem pode dar acesso para inspeção?')}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t('Agrega personas (conserje, propietario, vecino). Datos privados — no se muestran públicamente.',
                             'Add people (caretaker, owner, neighbor). Private data — not shown publicly.',
                             'Adicione pessoas (zelador, proprietário, vizinho). Dados privados.')}
                        </p>
                      </div>
                      {contactosAcceso.length === 0 && (
                        <p className="text-xs text-gray-400 italic">{t('Ningún contacto. Opcional pero útil.', 'No contacts. Optional but useful.', 'Nenhum contato. Opcional mas útil.')}</p>
                      )}
                      <div className="space-y-3">
                        {contactosAcceso.map((c, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-700">👤 {t(`Contacto ${i + 1}`, `Contact ${i + 1}`, `Contato ${i + 1}`)}</p>
                              <button onClick={() => quitarContacto(i)} className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer px-1">✕</button>
                            </div>
                            <input value={c.nombre} onChange={e => setContacto(i, 'nombre', e.target.value)}
                              placeholder={t('Nombre completo *', 'Full name *', 'Nome completo *')} className={inputCls} />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={c.telefono} onChange={e => setContacto(i, 'telefono', e.target.value)}
                                placeholder={t('Teléfono / WhatsApp', 'Phone / WhatsApp', 'Telefone / WhatsApp')} className={inputCls} />
                              <input value={c.email} onChange={e => setContacto(i, 'email', e.target.value)} placeholder="Email" className={inputCls} />
                            </div>
                            <input value={c.rol} onChange={e => setContacto(i, 'rol', e.target.value)}
                              placeholder={t('Rol: conserje, propietario, vecino...', 'Role: caretaker, owner, neighbor...', 'Papel: zelador, proprietário, vizinho...')} className={inputCls} />
                          </div>
                        ))}
                      </div>
                      {contactosAcceso.length < 5 && (
                        <button onClick={agregarContacto}
                          className="w-full py-2.5 text-sm text-blue-700 border border-blue-200 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 font-semibold">
                          + {t('Agregar contacto de acceso', 'Add access contact', 'Adicionar contato de acesso')}
                        </button>
                      )}
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <span className="text-amber-600 text-xs flex-shrink-0 mt-0.5">🔒</span>
                        <p className="text-[10px] text-amber-800 leading-relaxed">
                          {t('Datos privados. Solo los verán voluntarios e ingenieros autorizados para inspección.',
                             'Private data. Only authorized volunteers and engineers for inspection will see it.',
                             'Dados privados. Apenas voluntários e engenheiros autorizados para inspeção verão.')}
                        </p>
                      </div>
                    </div>

                    {/* 10. Descripción y datos */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800">10. {t('Descripción y tus datos', 'Description and your info', 'Descrição e seus dados')}</h3>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('Describe lo que ves (opcional)', 'Describe what you see (optional)', 'Descreva o que você vê (opcional)')}</label>
                        <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={200}
                          placeholder={t('Ej: Fachada colapsada, cables caídos, se escuchan voces...', 'E.g: Facade collapsed, wires on street, voices heard...', 'Ex: Fachada colapsada, fios caídos, ouvem-se vozes...')}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 resize-none placeholder-gray-400" />
                        <p className="text-right text-xs text-gray-400">{descripcion.length}/200</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-blue-800">🔒 {t('Tus datos de contacto (privados)', 'Your contact info (private)', 'Seus dados de contato (privados)')}</p>
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                          🏠 {t('Si vives aquí, trataremos de contactarte para coordinar la inspección.', 'If you live here, we will try to contact you to coordinate the inspection.', 'Se você mora aqui, tentaremos contatá-lo para coordenar a inspeção.')}
                        </p>
                        <input value={repNombre} onChange={e => setRepNombre(e.target.value)} placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')} className={inputCls} />
                        <input value={repTelefono} onChange={e => setRepTelefono(e.target.value)} placeholder={t('Teléfono / WhatsApp — para coordinar inspección', 'Phone / WhatsApp — to coordinate inspection', 'Telefone / WhatsApp — para coordenar inspeção')} className={inputCls} />
                        <input value={repEmail} onChange={e => setRepEmail(e.target.value)} placeholder={t('Email — para coordinar inspección', 'Email — to coordinate inspection', 'Email — para coordenar inspeção')} className={inputCls} />
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          {t('✅ Tus datos no se muestran públicamente.', '✅ Your data is not displayed publicly.', '✅ Seus dados não são exibidos publicamente.')}
                        </p>
                      </div>
                    </div>

                    {esCritico && (
                      <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3">
                        <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-700">{t('⚠️ Este reporte será marcado como CRÍTICO. Llama primero a Protección Civil (171) o Bomberos.', '⚠️ This report will be marked CRITICAL. Call Civil Protection (171) or Firefighters first.', '⚠️ Este relatório será marcado como CRÍTICO. Ligue primeiro para Proteção Civil (171) ou Bombeiros.')}</p>
                      </div>
                    )}

                    <button onClick={handleSubmit}
                      disabled={enviando || !tipo || !nivel || !atrapados || !ciudad || !estado || fotos.some(f => f.uploading) || contactosAcceso.some(c => !c.nombre.trim() && (c.telefono.trim() || c.email.trim()))}
                      className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors ${esCritico ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}>
                      {enviando ? <Loader2 size={18} className="animate-spin" /> : (esCritico ? '🚨' : '📋')}
                      {fotos.some(f => f.uploading) ? t('Subiendo fotos...', 'Uploading photos...', 'Enviando fotos...')
                        : esCritico ? t('Enviar alerta crítica', 'Send critical alert', 'Enviar alerta crítico')
                        : t('Enviar reporte de daño', 'Submit damage report', 'Enviar relatório de dano')}
                    </button>
                    {(!tipo || !nivel || !atrapados || !ciudad || !estado) && (
                      <p className="text-center text-xs text-gray-400">{t('Completa los campos obligatorios (*) para enviar.', 'Fill in required fields (*) to submit.', 'Preencha os campos obrigatórios (*) para enviar.')}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}