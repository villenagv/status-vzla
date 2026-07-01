import { useState } from 'react';
import { Loader2, UploadCloud, Trash2, AlertTriangle, CheckCircle2, WifiOff, Wifi } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { dataURLaFile } from '@/lib/comprimirFoto';

const RIESGO_LABEL = {
  riesgo_colapso:  { es: '💥 Colapso',  en: '💥 Collapse', color: 'bg-red-100 text-red-700' },
  riesgo_moderado: { es: '🟠 Moderado', en: '🟠 Moderate', color: 'bg-orange-100 text-orange-700' },
  solo_estetico:   { es: '🟢 Estético', en: '🟢 Cosmetic', color: 'bg-green-100 text-green-700' },
};

function ItemCard({ item, es, onEliminar, sincronizando }) {
  const r = RIESGO_LABEL[item.data.triage_riesgo] || {};
  const estado = item.status;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {item.data.nombre_lugar || item.data.tipo_estructura?.replace(/_/g, ' ') || (es ? 'Sin nombre' : 'Unnamed')}
          </p>
          <p className="text-xs text-gray-400 truncate">📍 {[item.data.direccion, item.data.ciudad].filter(Boolean).join(' · ')}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {r.es && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.color}`}>{es ? r.es : r.en}</span>}
            {item.fotos?.length > 0 && <span className="text-[10px] text-gray-400">📷 {item.fotos.length}</span>}
            {['si', 'voces'].includes(item.data.personas_atrapadas) && (
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full">{es ? '⚠ Atrapados' : '⚠ Trapped'}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {estado === 'sincronizado' ? (
            <span className="text-[10px] font-bold text-green-700 flex items-center gap-1"><CheckCircle2 size={11} /> {es ? 'Subido' : 'Synced'}</span>
          ) : estado === 'error' ? (
            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertTriangle size={11} /> {es ? 'Error' : 'Error'}</span>
          ) : (
            <span className="text-[10px] font-bold text-amber-600">{es ? '⏳ En dispositivo' : '⏳ On device'}</span>
          )}
          {estado !== 'sincronizado' && !sincronizando && (
            <button onClick={() => onEliminar(item.id)} className="text-gray-300 hover:text-red-500 cursor-pointer">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {estado === 'error' && item.error && <p className="text-[10px] text-red-500 mt-1">{item.error}</p>}
    </div>
  );
}

export default function CajaSalidaInspecciones({ es, queue }) {
  const { items, pendientes, eliminar, marcar, limpiarSincronizados } = queue;
  const [sincronizando, setSincronizando] = useState(false);
  const [progreso, setProgreso] = useState({ hecho: 0, total: 0 });
  const [online, setOnline] = useState(navigator.onLine);

  // refresca estado online al hacer clic
  const chequearRed = () => setOnline(navigator.onLine);

  const sincronizar = async () => {
    if (!navigator.onLine) { setOnline(false); return; }
    setOnline(true);
    setSincronizando(true);
    setProgreso({ hecho: 0, total: pendientes.length });

    for (let i = 0; i < pendientes.length; i++) {
      const item = pendientes[i];
      try {
        // 1) Subir fotos (comprimidas) una a una, con su área y nota
        const urls = [];
        const detalle = [];
        for (let j = 0; j < (item.fotos || []).length; j++) {
          const f = item.fotos[j];
          const dataURL = typeof f === 'string' ? f : f.dataURL;
          const area = typeof f === 'string' ? 'general' : (f.area || 'general');
          const nota = typeof f === 'string' ? '' : (f.nota || '').trim();
          const file = dataURLaFile(dataURL, `insp_${item.id}_${j}.jpg`);
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          if (file_url) {
            urls.push(file_url);
            detalle.push({ url: file_url, area, nota, piso: '', privada: false });
          }
        }
        // 2) Crear el reporte de daño con las URLs (galería pública limitada a 5) y los datos
        //    de la planilla mapeados a los campos que usa el informe de inspección
        const NIVEL_A_TIPO_DANO = { leve: 'estetico', moderado: 'estructural', critico: 'estructural', grave: 'estructural' };
        const creado = await base44.entities.ReportesDano.create({
          ...item.data,
          foto_urls: urls.slice(0, 5),
          inspeccion_fotos: urls,
          inspeccion_detalle_fotos: detalle,
          inspeccion_severidad: item.data.nivel_dano && item.data.nivel_dano !== 'no_evaluado' ? item.data.nivel_dano : 'sin_definir',
          inspeccion_tipo_dano: NIVEL_A_TIPO_DANO[item.data.nivel_dano] || 'sin_definir',
          inspeccion_notas: item.data.descripcion || '',
          inspeccion_por: item.data.triage_por || '',
          inspeccion_fecha: item.data.triage_fecha || new Date().toISOString(),
          // La inspección de campo ES la inspección presencial: la marcamos como completada
          // para que la ficha pública muestre el resultado y el enlace de descarga del PDF.
          triage_estado: 'inspeccionado',
          requiere_inspeccion_presencial: false,
          nivel_verificacion: 'institucional',
          estado_verificacion: 'verificado',
        });
        // 3) Registrar evento de línea de tiempo
        await base44.entities.ActualizacionesSitios.create({
          sitio_id: creado.id,
          tipo_sitio: 'edificio',
          tipo_accion: 'verificado',
          descripcion: `[INSPECCIÓN DE CAMPO] ${item.data.triage_riesgo?.replace(/_/g, ' ')}${item.data.descripcion ? ` — ${item.data.descripcion}` : ''}`,
          reportante_nombre: item.data.triage_por,
          fuente: 'inspeccion_campo',
          es_verificado: true,
        }).catch(() => {});
        // 4) Generar el informe PDF (planilla + miniaturas de fotos) y publicarlo en la ficha
        await base44.functions.invoke('generarInformeInspeccion', { reporte_id: creado.id }).catch(() => {});
        marcar(item.id, 'sincronizado');
      } catch (err) {
        marcar(item.id, 'error', es ? 'No se pudo subir. Reintenta.' : 'Upload failed. Retry.');
      }
      setProgreso({ hecho: i + 1, total: pendientes.length });
    }
    setSincronizando(false);
  };

  const sincronizados = items.filter(i => i.status === 'sincronizado').length;

  return (
    <div className="space-y-3">
      {/* Estado de red + acción */}
      <div className={`rounded-xl p-3 border ${online ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          {online ? <Wifi size={16} className="text-green-600" /> : <WifiOff size={16} className="text-red-600" />}
          <p className={`text-xs font-bold ${online ? 'text-green-800' : 'text-red-800'}`}>
            {online ? (es ? 'Con conexión' : 'Online') : (es ? 'Sin conexión' : 'Offline')}
          </p>
          <button onClick={chequearRed} className="text-[10px] text-gray-400 underline ml-auto cursor-pointer">{es ? 'verificar' : 'check'}</button>
        </div>
        <p className="text-[11px] mt-1 leading-relaxed text-gray-600">
          {pendientes.length === 0
            ? (es ? 'No tienes inspecciones pendientes de subir.' : 'No inspections pending upload.')
            : online
              ? (es ? `Tienes ${pendientes.length} inspección(es) lista(s) para subir.` : `You have ${pendientes.length} inspection(s) ready to upload.`)
              : (es ? `${pendientes.length} guardada(s) en el dispositivo. Súbelas cuando tengas señal.` : `${pendientes.length} saved on device. Upload them when you have signal.`)}
        </p>
      </div>

      {/* Botón sincronizar */}
      {pendientes.length > 0 && (
        <button onClick={sincronizar} disabled={sincronizando || !online}
          className="w-full bg-green-700 hover:bg-green-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
          {sincronizando
            ? <><Loader2 size={15} className="animate-spin" /> {es ? `Subiendo ${progreso.hecho}/${progreso.total}...` : `Uploading ${progreso.hecho}/${progreso.total}...`}</>
            : <><UploadCloud size={15} /> {es ? `Subir ${pendientes.length} a la plataforma` : `Upload ${pendientes.length} to platform`}</>}
        </button>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <div className="text-center py-8 bg-white border border-gray-200 rounded-2xl">
          <p className="text-3xl mb-2">📥</p>
          <p className="text-sm text-gray-500">{es ? 'Tu caja de salida está vacía.' : 'Your outbox is empty.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <ItemCard key={it.id} item={it} es={es} onEliminar={eliminar} sincronizando={sincronizando} />
          ))}
        </div>
      )}

      {sincronizados > 0 && !sincronizando && (
        <button onClick={limpiarSincronizados}
          className="w-full text-xs text-gray-400 hover:text-gray-700 py-2 cursor-pointer">
          {es ? `Limpiar ${sincronizados} ya subida(s)` : `Clear ${sincronizados} already uploaded`}
        </button>
      )}
    </div>
  );
}