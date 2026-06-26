import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2, MapPin, Clock, AlertTriangle, Phone, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const ESTADO_CONFIG = {
  buscando:             { es: '🔴 Sin contacto',           en: '🔴 Missing',               cls: 'bg-red-100 text-red-800 border-red-200' },
  informacion_recibida: { es: '🔵 Con pistas',             en: '🔵 Has leads',              cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  visto_no_confirmado:  { es: '🟠 Visto sin confirmar',    en: '🟠 Seen unconfirmed',       cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  encontrado_con_vida:  { es: '✅ Localizado a salvo',     en: '✅ Located safe',           cls: 'bg-green-100 text-green-800 border-green-200' },
  en_hospital_refugio:  { es: '🏥 En hospital/refugio',    en: '🏥 In hospital/shelter',   cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  fallecido_reportado:  { es: '⚫ Fallecido (reportado)',  en: '⚫ Deceased (reported)',    cls: 'bg-gray-200 text-gray-700 border-gray-300' },
  caso_cerrado:         { es: '🔒 Caso cerrado',           en: '🔒 Case closed',           cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d} día${d > 1 ? 's' : ''}` : `${d} day${d > 1 ? 's' : ''} ago`;
  if (h > 0) return es ? `hace ${h} hora${h > 1 ? 's' : ''}` : `${h} hour${h > 1 ? 's' : ''} ago`;
  return es ? `hace ${m} min` : `${m} min ago`;
}

export default function PersonaDetalle() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const { lang } = useLang();
  const es = lang === 'es';

  const [persona, setPersona] = useState(null);
  const [pistas, setPistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [telSub, setTelSub] = useState('');
  const [suscrito, setSuscrito] = useState(false);
  const [suscribiendo, setSuscribiendo] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      base44.entities.PersonasBuscadas.get(id),
      base44.entities.PistasPersonas.filter({ persona_id: id }, '-created_date', 20).catch(() => []),
    ]).then(([p, pis]) => {
      setPersona(p);
      setPistas(pis);
    }).catch(() => {}).finally(() => setCargando(false));
  }, [id]);

  const copiarEnlace = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartir = () => {
    if (!persona) return;
    const texto = es
      ? `🔴 ¿La/lo has visto? ${persona.nombre_completo}${persona.edad_aprox ? ` · ${persona.edad_aprox} años` : ''} · Última vez en ${persona.ultima_ubicacion_conocida}, ${persona.ciudad}. Contacto: ${persona.contacto_telefono || 'ver enlace'}. Comparte si lo/la reconoces. ${window.location.href}`
      : `🔴 Have you seen them? ${persona.nombre_completo}${persona.edad_aprox ? ` · ${persona.edad_aprox} yrs` : ''} · Last seen in ${persona.ultima_ubicacion_conocida}, ${persona.ciudad}. Contact: ${persona.contacto_telefono || 'see link'}. Share if you recognize them. ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: `CRIS · ${persona.nombre_completo}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      alert(es ? 'Texto copiado para compartir' : 'Text copied to share');
    }
  };

  const suscribirse = async () => {
    if (!telSub.trim() || !id) return;
    setSuscribiendo(true);
    try {
      await base44.entities.SuscriptoresSeguimiento.create({
        reporte_id: id,
        tipo_reporte: 'persona',
        telefono_whatsapp: telSub.trim(),
        activo: true,
      });
      setSuscrito(true);
    } catch {}
    setSuscribiendo(false);
  };

  if (cargando) return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        {es ? 'Cargando ficha...' : 'Loading record...'}
      </div>
    </div>
  );

  if (!persona) return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-4xl">🔍</p>
        <p className="font-semibold text-gray-700">{es ? 'Ficha no encontrada.' : 'Record not found.'}</p>
        <Link to="/personas" className="text-blue-600 underline text-sm">{es ? '← Volver al directorio' : '← Back to directory'}</Link>
      </div>
    </div>
  );

  const st = ESTADO_CONFIG[persona.estado_caso] || ESTADO_CONFIG['buscando'];
  const esBuscando = ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(persona.estado_caso);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/personas" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800">
          <ChevronLeft size={16} /> {es ? 'Directorio de personas' : 'People directory'}
        </Link>

        {/* ENCABEZADO */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex gap-4 items-start">
            {persona.foto_url ? (
              <img src={persona.foto_url} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-4xl flex-shrink-0">👤</div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight mb-1">{persona.nombre_completo}</h1>
              {persona.apodo && <p className="text-xs text-gray-400 mb-1">"{persona.apodo}"</p>}
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${st.cls} mb-2`}>
                {es ? st.es : st.en}
              </span>
              <div className="flex flex-wrap gap-1">
                {persona.edad_aprox && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{persona.edad_aprox} {es ? 'años' : 'yrs'}</span>}
                {persona.sexo && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize">{persona.sexo}</span>}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
            <Clock size={10} />
            <span>{es ? 'Reportado' : 'Reported'} {tiempoRelativo(persona.created_date, es)}</span>
            {persona.updated_date !== persona.created_date && (
              <span>· {es ? 'Actualizado' : 'Updated'} {tiempoRelativo(persona.updated_date, es)}</span>
            )}
          </div>
        </div>

        {/* ALERTA ANTI-EXTORSIÓN */}
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {es
              ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.'
              : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
          </p>
        </div>

        {/* DATOS PÚBLICOS */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-2.5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">{es ? 'Última información conocida' : 'Last known information'}</h2>
          {persona.ultima_ubicacion_conocida && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">{es ? 'Última ubicación' : 'Last location'}</p>
                <p className="text-sm text-gray-800">{persona.ultima_ubicacion_conocida} · {persona.ciudad}{persona.estado_region ? `, ${persona.estado_region}` : ''}</p>
              </div>
            </div>
          )}
          {persona.fecha_ultima_vez && (
            <div className="flex items-start gap-2">
              <Clock size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">{es ? 'Vista por última vez' : 'Last seen'}</p>
                <p className="text-sm text-gray-800">{persona.fecha_ultima_vez}</p>
              </div>
            </div>
          )}
          {persona.descripcion_fisica && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{es ? 'Descripción física' : 'Physical description'}</p>
              <p className="text-sm text-gray-800">{persona.descripcion_fisica}</p>
            </div>
          )}
          {persona.notas_publicas && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{es ? 'Información adicional' : 'Additional info'}</p>
              <p className="text-sm text-gray-800">{persona.notas_publicas}</p>
            </div>
          )}
        </div>

        {/* PISTAS / LÍNEA DE TIEMPO */}
        {pistas.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">🕐 {es ? 'Línea de tiempo' : 'Timeline'}</h2>
            <div className="space-y-2">
              {pistas.map((p, i) => (
                <div key={p.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-700 leading-relaxed">{p.descripcion || p.ubicacion_pista}</p>
                    {p.ubicacion_pista && p.descripcion && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1"><MapPin size={9} />{p.ubicacion_pista}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{tiempoRelativo(p.created_date, es)}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500">{es ? 'Búsqueda publicada' : 'Search published'} · {tiempoRelativo(persona.created_date, es)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCIONES */}
        {esBuscando && (
          <div className="space-y-2 mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-2">{es ? 'Acciones rápidas' : 'Quick actions'}</h2>
            <Link to={`/reportar-encontrado?persona=${id}`}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl text-sm no-underline">
              ✋ {es ? 'La encontré — está a salvo' : 'I found them — they are safe'}
            </Link>
            <Link to={`/pista?persona=${id}`}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl text-sm no-underline">
              💡 {es ? 'Tengo una pista o la vi' : 'I have a lead or saw them'}
            </Link>
          </div>
        )}

        {/* COMPARTIR */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">{es ? 'Compartir esta ficha' : 'Share this record'}</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={compartir}
              className="flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-medium py-2.5 rounded-lg cursor-pointer">
              <Share2 size={13} /> WhatsApp
            </button>
            <button onClick={copiarEnlace}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium py-2.5 rounded-lg cursor-pointer">
              {copiado ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copiado ? (es ? 'Copiado' : 'Copied') : (es ? 'Copiar enlace' : 'Copy link')}
            </button>
          </div>
        </div>

        {/* SUSCRIPCIÓN */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-1">🔔 {es ? 'Notificarme si hay novedades' : 'Notify me of updates'}</h2>
          <p className="text-xs text-gray-400 mb-3">{es ? 'Sin cuenta. Tu número no se publica.' : 'No account needed. Your number is not published.'}</p>
          {suscrito ? (
            <p className="text-sm text-green-700 font-medium">✅ {es ? 'Suscrito. Te avisaremos si hay cambios.' : 'Subscribed. We will notify you of changes.'}</p>
          ) : (
            <div className="flex gap-2">
              <input value={telSub} onChange={e => setTelSub(e.target.value)}
                placeholder="+58..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              <button onClick={suscribirse} disabled={suscribiendo || !telSub.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40 cursor-pointer">
                {es ? 'Avisar' : 'Notify'}
              </button>
            </div>
          )}
        </div>

        {/* NOTA CIUDADANA */}
        <p className="text-[10px] text-gray-400 text-center leading-relaxed mb-4">
          {es
            ? 'Esta plataforma es una herramienta ciudadana y no partidista. La información proviene de ciudadanos y no ha sido verificada de manera independiente.'
            : 'This platform is a citizen and non-partisan tool. Information comes from citizens and has not been independently verified.'}
        </p>
      </div>
      <Footer />
    </div>
  );
}