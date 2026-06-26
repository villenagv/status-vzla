import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400 placeholder-gray-400";

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d}d` : `${d}d ago`;
  if (h > 0) return es ? `hace ${h}h` : `${h}h ago`;
  return es ? `hace ${m} min` : `${m} min ago`;
}

export default function Seguimiento() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null); // { tipo, data }
  const [noEncontrado, setNoEncontrado] = useState(false);

  const [telSub, setTelSub] = useState('');
  const [suscribiendo, setSuscribiendo] = useState(false);
  const [suscrito, setSuscrito] = useState(false);

  const buscar = async () => {
    if (codigo.trim().length < 4) return;
    setBuscando(true);
    setNoEncontrado(false);
    setResultado(null);
    try {
      const cod = codigo.trim().toUpperCase();
      // Buscar en PersonasBuscadas por notas_publicas que contengan el código (campo de búsqueda por nombre)
      // En la práctica se busca por nombre/apodo/código
      const [personas, danos] = await Promise.all([
        base44.entities.PersonasBuscadas.filter({ nombre_completo: cod }, null, 5).catch(() => []),
        base44.entities.ReportesDano.filter({ direccion: cod }, null, 5).catch(() => []),
      ]);
      // También buscar por búsqueda de texto en nombre
      const todasPersonas = await base44.entities.PersonasBuscadas.list('-updated_date', 100).catch(() => []);
      const match = todasPersonas.find(p =>
        p.nombre_completo?.toUpperCase().includes(cod) ||
        (p.notas_publicas || '').toUpperCase().includes(cod)
      );
      if (match) {
        setResultado({ tipo: 'persona', data: match });
      } else if (danos.length > 0) {
        setResultado({ tipo: 'dano', data: danos[0] });
      } else {
        setNoEncontrado(true);
      }
    } catch {
      setNoEncontrado(true);
    }
    setBuscando(false);
  };

  const suscribirse = async () => {
    if (!telSub.trim() || !resultado) return;
    setSuscribiendo(true);
    try {
      await base44.entities.SuscriptoresSeguimiento.create({
        reporte_id: resultado.data.id,
        tipo_reporte: resultado.tipo,
        telefono_whatsapp: telSub.trim(),
        activo: true,
      });
      setSuscrito(true);
    } catch {}
    setSuscribiendo(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800">
          <ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}
        </Link>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          🔎 {es ? 'Seguir un reporte' : 'Track a report'}
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {es
            ? 'Ingresa el nombre de la persona o palabras clave del reporte para ver su estado actual.'
            : 'Enter the person\'s name or report keywords to see the current status.'}
        </p>

        {/* Búsqueda */}
        <div className="flex gap-2 mb-6">
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder={es ? 'Nombre de persona, dirección...' : 'Person name, address...'}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          />
          <button onClick={buscar} disabled={buscando || codigo.trim().length < 2}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium cursor-pointer">
            {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="space-y-4">
            {resultado.tipo === 'persona' && (() => {
              const p = resultado.data;
              return (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{p.nombre_completo}</p>
                      {p.edad_aprox && <p className="text-xs text-gray-500">{p.edad_aprox} {es ? 'años' : 'yrs'}</p>}
                      <p className="text-xs text-gray-500">📍 {p.ultima_ubicacion_conocida} · {p.ciudad}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={`/persona?id=${p.id}`}
                      className="flex items-center justify-center bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm no-underline">
                      {es ? 'Ver ficha completa →' : 'View full record →'}
                    </Link>
                    <Link to={`/pista?persona=${p.id}`}
                      className="flex items-center justify-center border border-blue-200 text-blue-700 font-medium py-2.5 rounded-lg text-sm no-underline">
                      💡 {es ? 'Tengo una pista' : 'I have a lead'}
                    </Link>
                  </div>
                </div>
              );
            })()}

            {resultado.tipo === 'dano' && (() => {
              const d = resultado.data;
              return (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-gray-900 text-sm mb-1">🏗️ {d.nombre_lugar || d.tipo_estructura}</p>
                  <p className="text-xs text-gray-500 mb-2">📍 {d.direccion} · {d.ciudad}</p>
                  <span className="text-[10px] font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {d.nivel_dano} · {d.estado_verificacion}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">{tiempoRelativo(d.updated_date, es)}</p>
                </div>
              );
            })()}

            {/* Suscripción */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">🔔 {es ? '¿Quieres saber si cambia el estado?' : 'Want updates on status changes?'}</h3>
              <p className="text-xs text-gray-400 mb-3">{es ? 'Sin cuenta. Ingresa tu WhatsApp.' : 'No account needed. Enter your WhatsApp.'}</p>
              {suscrito ? (
                <p className="text-sm text-green-700">✅ {es ? 'Suscrito. Te avisamos si hay cambios.' : 'Subscribed. We will notify you of changes.'}</p>
              ) : (
                <div className="flex gap-2">
                  <input value={telSub} onChange={e => setTelSub(e.target.value)}
                    placeholder="+58..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <button onClick={suscribirse} disabled={suscribiendo || !telSub.trim()}
                    className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40 cursor-pointer">
                    {es ? 'Avisar' : 'Notify'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {noEncontrado && (
          <div className="text-center py-8 space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="text-sm text-gray-600 font-medium">{es ? 'No encontramos resultados.' : 'No results found.'}</p>
            <p className="text-xs text-gray-400">{es ? 'Intenta con otro nombre o verifica la búsqueda.' : 'Try another name or check your search.'}</p>
            <div className="flex flex-col gap-2 items-center">
              <Link to="/personas" className="text-sm text-blue-600 underline">{es ? '→ Buscar en el directorio de personas' : '→ Search in people directory'}</Link>
              <Link to="/edificios" className="text-sm text-blue-600 underline">{es ? '→ Buscar en edificios reportados' : '→ Search in reported buildings'}</Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}