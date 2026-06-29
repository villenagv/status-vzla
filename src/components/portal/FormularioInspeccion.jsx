import { useState } from 'react';
import { Loader2, CheckCircle, Camera, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { comprimirFoto, dataURLaFile } from '@/lib/comprimirFoto';

/**
 * FormularioInspeccion
 * Formulario de RESPUESTA del especialista al declarar un edificio inspeccionado.
 * Captura:
 *  - Severidad confirmada (leve / moderado / grave / crítico)
 *  - Tipo de daño (estético / estructural / ambos / sin daños)
 *  - Notas técnicas (informe)
 *  - Fotos de la inspección (comprimidas, máx 5)
 *
 * Al confirmar: marca triage_estado='inspeccionado', guarda los datos en
 * ReportesDano, deja un evento en la línea de tiempo y avisa a suscriptores.
 *
 * Props:
 *  - reporte: ReportesDano
 *  - perfil: PerfilProfesional
 *  - es: idioma
 *  - onCancelar: () => void
 *  - onActualizado: (id, dataParcial) => void
 */

const SEVERIDAD_OPTS = [
  { val: 'leve',     es: '🟢 Leve',    en: '🟢 Minor',    color: 'green'  },
  { val: 'moderado', es: '🟠 Moderado', en: '🟠 Moderate', color: 'orange' },
  { val: 'grave',    es: '🔴 Grave',   en: '🔴 Severe',   color: 'red'    },
  { val: 'critico',  es: '💥 Crítico', en: '💥 Critical', color: 'red'    },
];

const TIPO_DANO_OPTS = [
  { val: 'sin_danos',   es: '✅ Sin daños',           en: '✅ No damage'           },
  { val: 'estetico',    es: '🎨 Solo estético',       en: '🎨 Cosmetic only'       },
  { val: 'estructural', es: '🏗️ Estructural',         en: '🏗️ Structural'          },
  { val: 'ambos',       es: '⚠️ Estético y estructural', en: '⚠️ Cosmetic & structural' },
];

// Severidad → nivel_dano del edificio (para que el semáforo público quede coherente)
const SEVERIDAD_A_NIVEL = { leve: 'leve', moderado: 'moderado', grave: 'grave', critico: 'critico' };

export default function FormularioInspeccion({ reporte, perfil, es, onCancelar, onActualizado }) {
  const [severidad, setSeveridad] = useState(reporte.inspeccion_severidad && reporte.inspeccion_severidad !== 'sin_definir' ? reporte.inspeccion_severidad : '');
  const [tipoDano, setTipoDano] = useState(reporte.inspeccion_tipo_dano && reporte.inspeccion_tipo_dano !== 'sin_definir' ? reporte.inspeccion_tipo_dano : '');
  const [notas, setNotas] = useState('');
  const [fotos, setFotos] = useState([]); // [{ dataURL }]
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const puedeConfirmar = !!severidad && !!tipoDano;

  const agregarFotos = async (files) => {
    const espacio = 5 - fotos.length;
    const archivos = Array.from(files).slice(0, Math.max(0, espacio));
    if (!archivos.length) return;
    setSubiendoFoto(true);
    for (const file of archivos) {
      try {
        const dataURL = await comprimirFoto(file, 1280, 0.7);
        setFotos(prev => [...prev, { dataURL }]);
      } catch { /* ignoramos la foto que falle */ }
    }
    setSubiendoFoto(false);
  };

  const confirmar = async () => {
    if (!puedeConfirmar) return;
    setEnviando(true);
    setError('');
    try {
      // Subir fotos de la inspección
      const urls = [];
      for (const f of fotos) {
        try {
          const file = dataURLaFile(f.dataURL, `inspeccion_${Date.now()}.jpg`);
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          if (file_url) urls.push(file_url);
        } catch { /* seguimos */ }
      }

      const ahora = new Date().toISOString();
      const inspector = perfil.user_nombre || perfil.user_email;
      const dataUpdate = {
        triage_estado: 'inspeccionado',
        requiere_inspeccion_presencial: false,
        inspeccion_severidad: severidad,
        inspeccion_tipo_dano: tipoDano,
        inspeccion_notas: notas.trim(),
        inspeccion_fecha: ahora,
        inspeccion_por: inspector,
        inspeccion_estado_pendiente: 'ninguno',
        inspeccion_motivo_pendiente: '',
        nivel_verificacion: 'institucional',
        estado_verificacion: 'verificado',
      };
      // Sincronizamos el nivel de daño público con la severidad confirmada
      if (SEVERIDAD_A_NIVEL[severidad]) dataUpdate.nivel_dano = SEVERIDAD_A_NIVEL[severidad];
      // Adjuntamos las fotos de inspección a las del edificio (máx 5 visibles)
      if (urls.length) {
        dataUpdate.inspeccion_fotos = urls;
        dataUpdate.foto_urls = [...(reporte.foto_urls || []), ...urls].slice(0, 5);
      }

      await base44.entities.ReportesDano.update(reporte.id, dataUpdate);

      const tipoLbl = (TIPO_DANO_OPTS.find(o => o.val === tipoDano) || {})[es ? 'es' : 'en'] || tipoDano;
      const sevLbl = (SEVERIDAD_OPTS.find(o => o.val === severidad) || {})[es ? 'es' : 'en'] || severidad;
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: reporte.id,
        tipo_sitio: 'edificio',
        tipo_accion: 'verificado',
        descripcion: `[INSPECCIÓN PRESENCIAL ${(perfil.tipo_perfil || 'especialista').toUpperCase()}] ${es ? 'Severidad' : 'Severity'}: ${sevLbl} · ${es ? 'Daño' : 'Damage'}: ${tipoLbl}.${notas.trim() ? ' ' + notas.trim() : ''}`,
        reportante_nombre: inspector,
        fuente: 'especialista',
        es_verificado: true,
      });

      base44.functions.invoke('notificarSuscriptoresPublicacion', {
        edificio_id: reporte.id,
        mensaje: notas.trim() || (es ? `Inspección técnica completada. Severidad: ${sevLbl}. Daño: ${tipoLbl}.` : `Technical inspection completed. Severity: ${sevLbl}. Damage: ${tipoLbl}.`),
        asunto: es ? `Inspección completada: ${reporte.nombre_lugar || reporte.direccion}` : `Inspection completed: ${reporte.nombre_lugar || reporte.direccion}`,
        remitente_nombre: inspector,
      }).catch(() => {});

      onActualizado?.(reporte.id, dataUpdate);
    } catch {
      setError(es ? 'No se pudo guardar la inspección. Intenta de nuevo.' : 'Could not save the inspection. Try again.');
    }
    setEnviando(false);
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3">
      <p className="text-xs font-bold text-green-800">✅ {es ? 'Declarar edificio inspeccionado' : 'Declare building inspected'}</p>

      {/* Severidad */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 mb-1.5">{es ? '¿Qué tan graves son los daños?' : 'How severe is the damage?'} <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-2 gap-1.5">
          {SEVERIDAD_OPTS.map(o => (
            <button key={o.val} type="button" onClick={() => setSeveridad(o.val)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${severidad === o.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de daño */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 mb-1.5">{es ? '¿Los daños son estéticos o estructurales?' : 'Is the damage cosmetic or structural?'} <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-1 gap-1.5">
          {TIPO_DANO_OPTS.map(o => (
            <button key={o.val} type="button" onClick={() => setTipoDano(o.val)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer text-left transition-colors ${tipoDano === o.val ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
      </div>

      {/* Notas técnicas */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 mb-1.5">{es ? 'Informe técnico (opcional)' : 'Technical report (optional)'}</p>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
          placeholder={es ? 'Describe los hallazgos: grietas, columnas, recomendaciones...' : 'Describe findings: cracks, columns, recommendations...'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-green-500" />
      </div>

      {/* Fotos de la inspección */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 mb-1.5">📷 {es ? 'Fotos de la inspección (opcional)' : 'Inspection photos (optional)'}</p>
        <div className="flex flex-wrap gap-2">
          {fotos.map((f, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              <img src={f.dataURL} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setFotos(p => p.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={8} /></button>
            </div>
          ))}
          {fotos.length < 5 && (
            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50">
              {subiendoFoto ? <Loader2 size={16} className="text-gray-400 animate-spin" /> : <Camera size={16} className="text-gray-400" />}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => { agregarFotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 text-center">{error}</p>}

      <button type="button" onClick={confirmar} disabled={!puedeConfirmar || enviando || subiendoFoto}
        className="w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
        {enviando ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
        {es ? 'Confirmar inspección completada' : 'Confirm inspection completed'}
      </button>
      {!puedeConfirmar && (
        <p className="text-[10px] text-gray-400 text-center -mt-1">{es ? 'Elige severidad y tipo de daño para confirmar.' : 'Choose severity and damage type to confirm.'}</p>
      )}
      <button type="button" onClick={onCancelar} className="w-full text-xs text-gray-400 underline cursor-pointer">{es ? 'Cancelar' : 'Cancel'}</button>
    </div>
  );
}