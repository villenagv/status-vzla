import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, AlertTriangle, Camera, X, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', icon: '🟡', label: { es: 'Daño leve',     en: 'Minor damage'   } },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', icon: '🟠', label: { es: 'Daño moderado', en: 'Moderate damage' } },
  grave:       { color: '#C0392B', bg: '#FDEDEC', icon: '🔴', label: { es: 'Daño grave',    en: 'Severe damage'   } },
  critico:     { color: '#922B21', bg: '#FDEDEC', icon: '🚨', label: { es: 'CRÍTICO',       en: 'CRITICAL'        } },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', icon: '💥', label: { es: 'COLAPSADO',     en: 'COLLAPSED'       } },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', icon: '⚪', label: { es: 'Sin evaluar',   en: 'Not evaluated'   } },
  no_sabe:     { color: '#7F8C8D', bg: '#F2F3F4', icon: '⚪', label: { es: 'Sin datos',     en: 'No data'         } },
};

const EVALUACION_OPTS = [
  { val: 'seguro',            icon: '✅', color: '#16A34A', bgColor: '#F0FDF4', border: '#86EFAC', es: 'SEGURO — Se puede entrar',            en: 'SAFE — Entry allowed' },
  { val: 'precaucion',        icon: '⚠️', color: '#CA8A04', bgColor: '#FEFCE8', border: '#FDE047', es: 'PRECAUCIÓN — Entrada con cuidado',    en: 'CAUTION — Enter carefully' },
  { val: 'entrada_limitada',  icon: '⛔', color: '#EA580C', bgColor: '#FFF7ED', border: '#FDBA74', es: 'ENTRADA LIMITADA — Solo rescatistas',  en: 'LIMITED — Rescue teams only' },
  { val: 'inseguro',          icon: '🚫', color: '#DC2626', bgColor: '#FEF2F2', border: '#FCA5A5', es: 'INSEGURO — NO ENTRAR',                en: 'UNSAFE — DO NOT ENTER' },
  { val: 'colapso_inminente', icon: '💥', color: '#7F1D1D', bgColor: '#FCECEC', border: '#EF4444', es: 'COLAPSO INMINENTE — Evacuar zona',    en: 'IMMINENT COLLAPSE — Evacuate area' },
];

function TarjetaEdificio({ reporte, es, perfil, onEvaluado }) {
  const [expandido, setExpandido] = useState(false);
  const [evaluacion, setEvaluacion] = useState('');
  const [notas, setNotas] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [enviandoEval, setEnviandoEval] = useState(false);
  const [enviandoNotif, setEnviandoNotif] = useState(false);
  const [evalOk, setEvalOk] = useState(false);
  const [notifOk, setNotifOk] = useState(false);
  const [fotosTab, setFotosTab] = useState(false);

  const cfg = DANO_CONFIG[reporte.nivel_dano] || DANO_CONFIG.no_evaluado;
  const evalSeleccionada = EVALUACION_OPTS.find(e => e.val === evaluacion);

  const enviarEvaluacion = async () => {
    if (!evaluacion) return;
    setEnviandoEval(true);
    try {
      // Mapear evaluación a nivel de daño y estado de acceso
      const nivelMap = {
        seguro: 'leve', precaucion: 'moderado', entrada_limitada: 'grave',
        inseguro: 'critico', colapso_inminente: 'colapsado',
      };
      const accesoMap = {
        seguro: 'entrada_autorizada', precaucion: 'entrada_limitada',
        entrada_limitada: 'solo_rescatistas', inseguro: 'no_entrar', colapso_inminente: 'no_entrar',
      };

      await base44.entities.ActualizacionesSitios.create({
        sitio_id: reporte.id,
        tipo_sitio: 'edificio',
        tipo_accion: 'verificado',
        descripcion: `[${es ? perfil.tipo_perfil.toUpperCase() : perfil.tipo_perfil.toUpperCase()} EVALUACIÓN] ${notas || evalSeleccionada?.[es ? 'es' : 'en']}`,
        nivel_dano_anterior: reporte.nivel_dano,
        nivel_dano_nuevo: nivelMap[evaluacion],
        reportante_nombre: perfil.user_nombre || perfil.user_email,
        fuente: 'especialista',
        es_verificado: true,
      });

      await base44.entities.ReportesDano.update(reporte.id, {
        nivel_dano: nivelMap[evaluacion],
        estado_acceso: accesoMap[evaluacion],
        nivel_verificacion: 'institucional',
        estado_verificacion: 'verificado',
      });

      setEvalOk(true);
      onEvaluado(reporte.id, nivelMap[evaluacion]);
    } catch {}
    setEnviandoEval(false);
  };

  const enviarNotificacion = async () => {
    if (!notifMsg.trim()) return;
    setEnviandoNotif(true);
    try {
      await base44.functions.invoke('notificarSuscriptoresPublicacion', {
        edificio_id: reporte.id,
        mensaje: notifMsg,
        asunto: `Evaluación especialista: ${reporte.nombre_lugar || reporte.direccion}`,
        remitente_nombre: perfil.user_nombre || perfil.user_email,
      });
      setNotifOk(true);
      setNotifMsg('');
      setTimeout(() => setNotifOk(false), 3000);
    } catch {}
    setEnviandoNotif(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3">
      {/* Cabecera */}
      <button
        onClick={() => setExpandido(v => !v)}
        className="w-full p-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
                {es ? cfg.label.es : cfg.label.en}
              </span>
              {reporte.nivel_verificacion === 'institucional' && (
                <span className="text-[9px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">🛡️ {es ? 'Verificado' : 'Verified'}</span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {reporte.nombre_lugar || reporte.tipo_estructura?.replace(/_/g, ' ') || (es ? 'Sin nombre' : 'Unnamed')}
            </p>
            <p className="text-xs text-gray-400 truncate">📍 {[reporte.direccion, reporte.ciudad].filter(Boolean).join(' · ')}</p>
            {reporte.personas_atrapadas === 'si' && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertTriangle size={9} /> {es ? '¡PERSONAS ATRAPADAS!' : 'TRAPPED PEOPLE!'}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {reporte.foto_urls?.length > 0 && (
              <span className="text-[9px] text-gray-400">📷 {reporte.foto_urls.length}</span>
            )}
            <span className="text-gray-400 text-sm">{expandido ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {/* Cuerpo expandido */}
      {expandido && (
        <div className="border-t border-gray-100 p-4 space-y-4">

          {/* Fotos */}
          {reporte.foto_urls?.length > 0 && (
            <div>
              <button onClick={() => setFotosTab(v => !v)} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-2 cursor-pointer">
                <Camera size={13} /> {fotosTab ? (es ? 'Ocultar fotos' : 'Hide photos') : `${es ? 'Ver' : 'View'} ${reporte.foto_urls.length} ${es ? 'foto(s)' : 'photo(s)'}`}
              </button>
              {fotosTab && (
                <div className="grid grid-cols-3 gap-2">
                  {reporte.foto_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {reporte.descripcion && (
            <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{reporte.descripcion}</p>
          )}

          {/* Evaluación estructural */}
          {!evalOk ? (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">
                {es ? '🏛️ Evaluación estructural — ¿Cuál es tu diagnóstico?' : '🏛️ Structural assessment — What is your diagnosis?'}
              </p>
              <div className="space-y-1.5 mb-3">
                {EVALUACION_OPTS.map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setEvaluacion(opt.val)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px',
                      borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `2px solid ${evaluacion === opt.val ? opt.border : '#E5E7EB'}`,
                      background: evaluacion === opt.val ? opt.bgColor : '#fff',
                      color: evaluacion === opt.val ? opt.color : '#374151',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span>{opt.icon}</span>
                    {es ? opt.es : opt.en}
                  </button>
                ))}
              </div>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={2}
                placeholder={es ? 'Notas técnicas de evaluación (opcional)...' : 'Technical assessment notes (optional)...'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:border-blue-400 mb-2"
              />
              <button
                onClick={enviarEvaluacion}
                disabled={!evaluacion || enviandoEval}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                {enviandoEval ? <Loader2 size={13} className="animate-spin" /> : '📋'}
                {es ? 'Registrar evaluación' : 'Register assessment'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <CheckCircle size={20} className="text-green-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-green-700">{es ? '✅ Evaluación registrada.' : '✅ Assessment registered.'}</p>
            </div>
          )}

          {/* Notificar suscriptores */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <Bell size={13} /> {es ? 'Notificar a suscriptores por email' : 'Notify subscribers by email'}
            </p>
            {notifOk ? (
              <p className="text-xs text-green-600 font-bold">✅ {es ? '¡Notificaciones enviadas!' : 'Notifications sent!'}</p>
            ) : (
              <div className="flex gap-2">
                <textarea
                  value={notifMsg}
                  onChange={e => setNotifMsg(e.target.value)}
                  rows={2}
                  placeholder={es ? 'Mensaje para los suscriptores de este edificio...' : 'Message to subscribers of this building...'}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={enviarNotificacion}
                  disabled={!notifMsg.trim() || enviandoNotif}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 cursor-pointer flex-shrink-0 flex items-center gap-1"
                >
                  {enviandoNotif ? <Loader2 size={12} className="animate-spin" /> : '📨'}
                  {es ? 'Enviar' : 'Send'}
                </button>
              </div>
            )}
          </div>

          <Link to={`/edificio?id=${reporte.id}`} className="block text-center text-xs text-blue-600 font-semibold no-underline hover:underline mt-1">
            {es ? 'Ver ficha completa →' : 'View full record →'}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function TareasEspecialista({ perfil, es }) {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('pendientes');
  const [pagina, setPagina] = useState(10);

  useEffect(() => {
    base44.entities.ReportesDano.list('-created_date', 150)
      .then(d => setReportes(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const onEvaluado = (id, nuevoNivel) => {
    setReportes(prev => prev.map(r => r.id === id ? { ...r, nivel_dano: nuevoNivel, nivel_verificacion: 'institucional' } : r));
  };

  const filtrados = reportes.filter(r => {
    if (filtro === 'pendientes') return r.nivel_verificacion !== 'institucional';
    if (filtro === 'criticos') return ['critico', 'colapsado', 'grave'].includes(r.nivel_dano);
    if (filtro === 'atrapados') return ['si', 'voces'].includes(r.personas_atrapadas);
    if (filtro === 'verificados') return r.nivel_verificacion === 'institucional';
    return true;
  });

  const pendientes = reportes.filter(r => r.nivel_verificacion !== 'institucional').length;
  const criticos = reportes.filter(r => ['critico', 'colapsado', 'grave'].includes(r.nivel_dano)).length;
  const conAtrapados = reportes.filter(r => ['si', 'voces'].includes(r.personas_atrapadas)).length;

  const CHIPS = [
    { key: 'pendientes',  label: es ? `⚪ Por evaluar (${pendientes})`       : `⚪ Pending (${pendientes})`,          color: 'gray'   },
    { key: 'criticos',    label: es ? `🚨 Críticos (${criticos})`            : `🚨 Critical (${criticos})`,           color: 'red'    },
    { key: 'atrapados',   label: es ? `🆘 Atrapados (${conAtrapados})`       : `🆘 Trapped (${conAtrapados})`,        color: 'orange' },
    { key: 'verificados', label: es ? `🛡️ Verificados`                       : `🛡️ Verified`,                         color: 'teal'   },
    { key: 'todos',       label: es ? `Todos (${reportes.length})`           : `All (${reportes.length})`,            color: 'gray'   },
  ];

  const colorMap = {
    red:    (a) => a ? 'bg-red-600 text-white border-red-600'         : 'bg-white text-red-600 border-red-300',
    orange: (a) => a ? 'bg-orange-600 text-white border-orange-600'   : 'bg-white text-orange-700 border-orange-300',
    teal:   (a) => a ? 'bg-teal-600 text-white border-teal-600'       : 'bg-white text-teal-700 border-teal-300',
    gray:   (a) => a ? 'bg-gray-800 text-white border-gray-800'       : 'bg-white text-gray-600 border-gray-300',
  };

  return (
    <div>
      {/* Info rol */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <p className="text-xs font-bold text-blue-800 mb-0.5">
          {perfil.tipo_perfil === 'ingeniero' ? '⚙️' : '📐'} {es ? `Modo especialista: ${perfil.tipo_perfil}` : `Specialist mode: ${perfil.tipo_perfil}`}
        </p>
        <p className="text-xs text-blue-700 leading-relaxed">
          {es ? 'Puedes evaluar daños estructurales, marcar edificios como seguros/inseguros y notificar a suscriptores.'
               : 'You can assess structural damage, mark buildings as safe/unsafe, and notify subscribers.'}
        </p>
      </div>

      {/* Chips filtro */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CHIPS.map(chip => {
          const activo = filtro === chip.key;
          return (
            <button key={chip.key} onClick={() => { setFiltro(chip.key); setPagina(10); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${colorMap[chip.color](activo)}`}>
              {chip.label}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="text-center py-10"><Loader2 size={22} className="animate-spin text-gray-400 mx-auto" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-gray-500">{es ? 'No hay edificios en este filtro.' : 'No buildings in this filter.'}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{filtrados.length} {es ? 'edificio(s)' : 'building(s)'}</p>
          {filtrados.slice(0, pagina).map(r => (
            <TarjetaEdificio key={r.id} reporte={r} es={es} perfil={perfil} onEvaluado={onEvaluado} />
          ))}
          {filtrados.length > pagina && (
            <button onClick={() => setPagina(v => v + 10)}
              className="w-full py-3 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
              {es ? `Ver ${Math.min(10, filtrados.length - pagina)} más →` : `Load ${Math.min(10, filtrados.length - pagina)} more →`}
            </button>
          )}
        </>
      )}
    </div>
  );
}