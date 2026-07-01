import { useState } from 'react';
import { Loader2, CheckCircle, Camera, X, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { comprimirFoto, dataURLaFile } from '@/lib/comprimirFoto';
import { AREAS_INSPECCION, GRUPOS_AREA, areaLabel } from './areasInspeccion';
import ChecklistFotosGuia from './ChecklistFotosGuia';

/**
 * FormularioInspeccion
 * Formulario de RESPUESTA del especialista al declarar un edificio inspeccionado.
 * Captura:
 *  - Severidad confirmada (leve / moderado / grave / crítico)
 *  - Tipo de daño (estético / estructural / ambos / sin daños)
 *  - Notas técnicas generales (informe)
 *  - Fotos de la inspección — cada una con su ÁREA y NOTA opcional (foto por foto)
 *
 * Al confirmar:
 *   1. Sube cada foto y registra { url, area, nota } en inspeccion_detalle_fotos.
 *   2. Marca triage_estado='inspeccionado', sincroniza el nivel de daño público
 *      (lo que define el sello oficial automáticamente).
 *   3. Genera el PDF del informe (backend), lo adjunta a la ficha y lo envía
 *      por email al solicitante de la inspección (sin datos personales).
 *   4. Avisa a suscriptores.
 *
 * Props: reporte, perfil, es, onCancelar, onActualizado
 */

const SEVERIDAD_OPTS = [
  { val: 'leve',     es: '🟢 Leve',    en: '🟢 Minor'    },
  { val: 'moderado', es: '🟠 Moderado', en: '🟠 Moderate' },
  { val: 'grave',    es: '🔴 Grave',   en: '🔴 Severe'   },
  { val: 'critico',  es: '💥 Crítico', en: '💥 Critical' },
];

const TIPO_DANO_OPTS = [
  { val: 'sin_danos',   es: '✅ Sin daños',           en: '✅ No damage'           },
  { val: 'estetico',    es: '🎨 Solo estético',       en: '🎨 Cosmetic only'       },
  { val: 'estructural', es: '🏗️ Estructural',         en: '🏗️ Structural'          },
  { val: 'ambos',       es: '⚠️ Estético y estructural', en: '⚠️ Cosmetic & structural' },
];

// Severidad → nivel_dano del edificio (para que el semáforo público quede coherente)
const SEVERIDAD_A_NIVEL = { leve: 'leve', moderado: 'moderado', grave: 'grave', critico: 'critico' };

const MAX_FOTOS = 12;

const DERIVACION_OPTS = [
  { val: '', es: 'Ninguna / no aplica', en: 'None / not applicable' },
  { val: 'proteccion_civil', es: 'Protección Civil', en: 'Civil Protection' },
  { val: 'bomberos', es: 'Bomberos', en: 'Firefighters' },
  { val: 'ingenieria_estructural', es: 'Ingeniería estructural', en: 'Structural engineering' },
  { val: 'alcaldia', es: 'Alcaldía / autoridad local', en: 'Mayor\'s office / local authority' },
];

export default function FormularioInspeccion({ reporte, perfil, es, onCancelar, onActualizado }) {
  const [severidad, setSeveridad] = useState(reporte.inspeccion_severidad && reporte.inspeccion_severidad !== 'sin_definir' ? reporte.inspeccion_severidad : '');
  const [tipoDano, setTipoDano] = useState(reporte.inspeccion_tipo_dano && reporte.inspeccion_tipo_dano !== 'sin_definir' ? reporte.inspeccion_tipo_dano : '');
  const [notas, setNotas] = useState('');
  // Cada foto: { id, dataURL, area, nota }
  const [fotos, setFotos] = useState([]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState('');
  const [error, setError] = useState('');

  // Checklist de cierre (Período 12 — reporte final)
  const [areasDocumentadas, setAreasDocumentadas] = useState(null); // true/false
  const [riesgoColapso, setRiesgoColapso] = useState(null); // true/false
  const [derivacion, setDerivacion] = useState('');
  const [confirmaFinal, setConfirmaFinal] = useState(false);

  const checklistCompleto = areasDocumentadas !== null && riesgoColapso !== null && confirmaFinal;
  const puedeConfirmar = !!severidad && !!tipoDano && checklistCompleto;

  const agregarFotos = async (files) => {
    const espacio = MAX_FOTOS - fotos.length;
    const archivos = Array.from(files).slice(0, Math.max(0, espacio));
    if (!archivos.length) return;
    setSubiendoFoto(true);
    for (const file of archivos) {
      try {
        const dataURL = await comprimirFoto(file, 1280, 0.7);
        setFotos(prev => [...prev, { id: Date.now() + Math.random(), dataURL, area: 'general', nota: '', piso: '', privada: false }]);
      } catch { /* ignorar foto que falle */ }
    }
    setSubiendoFoto(false);
  };

  const actualizarFoto = (id, campo, valor) => {
    setFotos(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  };

  const eliminarFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));

  const confirmar = async () => {
    if (!puedeConfirmar) return;
    setEnviando(true);
    setError('');
    try {
      // 1) Subir cada foto y armar el detalle estructurado
      setProgreso(es ? 'Subiendo fotos...' : 'Uploading photos...');
      const detalle = [];
      const urls = [];
      for (let i = 0; i < fotos.length; i++) {
        const f = fotos[i];
        setProgreso(es ? `Subiendo foto ${i + 1} de ${fotos.length}...` : `Uploading photo ${i + 1} of ${fotos.length}...`);
        try {
          const file = dataURLaFile(f.dataURL, `inspeccion_${Date.now()}_${i}.jpg`);
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          if (file_url) {
            detalle.push({ url: file_url, area: f.area || 'general', nota: (f.nota || '').trim(), piso: (f.piso || '').trim(), privada: !!f.privada });
            urls.push(file_url);
          }
        } catch { /* seguimos con la siguiente */ }
      }

      // 2) Actualizar el reporte con el resultado de la inspección
      setProgreso(es ? 'Guardando inspección...' : 'Saving inspection...');
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
        derivacion_recomendada: derivacion,
        tipo_evaluacion: 'evaluacion_presencial',
        comentarios_tecnicos: [
          ...(reporte.comentarios_tecnicos || []),
          { texto: notas.trim() || (es ? 'Inspección presencial completada.' : 'On-site inspection completed.'), autor: inspector, fecha: ahora },
        ],
      };
      if (SEVERIDAD_A_NIVEL[severidad]) dataUpdate.nivel_dano = SEVERIDAD_A_NIVEL[severidad];
      // Riesgo inminente de colapso confirmado en el checklist de cierre → prioridad crítica automática
      if (riesgoColapso) dataUpdate.prioridad = 'critica';
      if (detalle.length) {
        dataUpdate.inspeccion_detalle_fotos = detalle;
        dataUpdate.inspeccion_fotos = urls;
        const urlsPublicas = detalle.filter(d => !d.privada).map(d => d.url);
        dataUpdate.foto_urls = [...(reporte.foto_urls || []), ...urlsPublicas].slice(0, 5);
      }

      await base44.entities.ReportesDano.update(reporte.id, dataUpdate);

      // 3) Línea de tiempo pública (sin datos personales)
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

      // 4) Generar PDF (backend) y enviar email al solicitante
      setProgreso(es ? 'Generando informe PDF y enviando al solicitante...' : 'Generating PDF report and emailing requester...');
      await base44.functions.invoke('generarInformeInspeccion', { reporte_id: reporte.id }).catch(() => {});

      // 5) Avisar a suscriptores
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
    setProgreso('');
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3">
      <p className="text-xs font-bold text-green-800">✅ {es ? 'Declarar edificio inspeccionado' : 'Declare building inspected'}</p>
      <p className="text-[11px] text-green-700 -mt-2 leading-relaxed">
        {es ? 'Al confirmar, generaremos un informe PDF (sin tus datos personales ni los del solicitante) y lo enviaremos al correo de quien pidió la inspección. El PDF queda disponible en la ficha pública.'
            : 'On confirm, we will generate a PDF report (no personal contact data) and email it to the inspection requester. The PDF will be available on the public record.'}
      </p>

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

      {/* Notas técnicas generales */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 mb-1.5">{es ? 'Informe técnico general (opcional)' : 'General technical report (optional)'}</p>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
          placeholder={es ? 'Hallazgos generales, recomendaciones, próximos pasos...' : 'General findings, recommendations, next steps...'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-green-500" />
      </div>

      {/* Fotos foto-por-foto con área + nota */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 mb-1.5">📷 {es ? `Fotos por área (opcional, máx ${MAX_FOTOS})` : `Photos by area (optional, max ${MAX_FOTOS})`}</p>
        <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
          {es ? 'Para cada foto elige el tipo de toma, el área del edificio y, si quieres, el piso y una nota técnica corta.'
              : 'For each photo choose the shot type, the building area and, if you wish, the floor and a short technical note.'}
        </p>

        {fotos.length > 0 && <div className="mb-2"><ChecklistFotosGuia fotos={fotos} es={es} /></div>}

        <div className="space-y-2">
          {fotos.map((f, i) => (
            <div key={f.id} className="bg-white border border-gray-200 rounded-lg p-2 flex gap-2">
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={f.dataURL} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => eliminarFoto(f.id)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer">
                  <X size={10} />
                </button>
                <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold bg-black/60 text-white px-1 rounded">#{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <select value={f.area} onChange={e => actualizarFoto(f.id, 'area', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-green-500 cursor-pointer">
                  {GRUPOS_AREA.map(g => (
                    <optgroup key={g.val} label={es ? g.es : g.en}>
                      {AREAS_INSPECCION.filter(a => a.grupo === g.val).map(a => (
                        <option key={a.val} value={a.val}>{es ? a.es : a.en}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="flex gap-1">
                  <input type="text" value={f.piso} onChange={e => actualizarFoto(f.id, 'piso', e.target.value)}
                    placeholder={es ? 'Piso (ej: 3)' : 'Floor (e.g. 3)'}
                    className="w-1/3 border border-gray-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-green-500" />
                  <input type="text" value={f.nota} onChange={e => actualizarFoto(f.id, 'nota', e.target.value)}
                    maxLength={200}
                    placeholder={es ? 'Nota técnica (opcional)' : 'Technical note (optional)'}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-green-500" />
                </div>
                <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={!!f.privada} onChange={e => actualizarFoto(f.id, 'privada', e.target.checked)} className="rounded" />
                  {es ? '🔒 Mantener esta foto privada (no mostrar públicamente)' : '🔒 Keep this photo private (do not show publicly)'}
                </label>
              </div>
            </div>
          ))}

          {fotos.length < MAX_FOTOS && (
            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-green-400 hover:bg-green-50">
              {subiendoFoto ? (
                <Loader2 size={18} className="text-gray-400 animate-spin mx-auto" />
              ) : (
                <>
                  <Camera size={18} className="text-gray-400 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    {es ? `Agregar fotos (${fotos.length}/${MAX_FOTOS})` : `Add photos (${fotos.length}/${MAX_FOTOS})`}
                  </span>
                </>
              )}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => { agregarFotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>

      {/* Checklist de cierre — Reporte final */}
      <div className="bg-white border border-gray-300 rounded-xl p-3 space-y-3">
        <p className="text-xs font-bold text-gray-800">✅ {es ? 'Checklist de cierre (antes de terminar)' : 'Closing checklist (before finishing)'}</p>

        <div>
          <p className="text-[11px] font-semibold text-gray-600 mb-1.5">{es ? '¿Se documentaron todas las áreas críticas?' : 'Were all critical areas documented?'} <span className="text-red-500">*</span></p>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => setAreasDocumentadas(true)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${areasDocumentadas === true ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}>{es ? 'Sí' : 'Yes'}</button>
            <button type="button" onClick={() => setAreasDocumentadas(false)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${areasDocumentadas === false ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}>{es ? 'No' : 'No'}</button>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-600 mb-1.5">{es ? '¿Existe riesgo inminente de colapso?' : 'Is there an imminent risk of collapse?'} <span className="text-red-500">*</span></p>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => setRiesgoColapso(true)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${riesgoColapso === true ? 'bg-red-700 text-white border-red-700' : 'bg-white text-gray-700 border-gray-300'}`}>{es ? 'Sí' : 'Yes'}</button>
            <button type="button" onClick={() => setRiesgoColapso(false)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${riesgoColapso === false ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}>{es ? 'No' : 'No'}</button>
          </div>
          {riesgoColapso === true && (
            <p className="text-[10px] text-red-700 font-semibold mt-1">⚠️ {es ? 'La prioridad del reporte pasará a Crítica automáticamente.' : 'The report priority will automatically become Critical.'}</p>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-600 mb-1.5">{es ? '¿Se recomienda derivar a alguna autoridad?' : 'Should this be referred to an authority?'}</p>
          <select value={derivacion} onChange={e => setDerivacion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 cursor-pointer">
            {DERIVACION_OPTS.map(o => <option key={o.val} value={o.val}>{es ? o.es : o.en}</option>)}
          </select>
        </div>

        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={confirmaFinal} onChange={e => setConfirmaFinal(e.target.checked)} className="mt-0.5 rounded" />
          <span className="text-[11px] text-gray-700 leading-relaxed">
            {es ? 'Confirmo que este informe refleja fielmente la situación observada en sitio.' : 'I confirm this report faithfully reflects the situation observed on site.'}
          </span>
        </label>
      </div>

      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      {enviando && progreso && (
        <p className="text-[11px] text-green-700 text-center flex items-center justify-center gap-1.5">
          <Loader2 size={11} className="animate-spin" /> {progreso}
        </p>
      )}

      <button type="button" onClick={confirmar} disabled={!puedeConfirmar || enviando || subiendoFoto}
        className="w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
        {enviando ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
        {es ? 'Confirmar y generar informe PDF' : 'Confirm and generate PDF report'}
      </button>
      {!puedeConfirmar && (
        <p className="text-[10px] text-gray-400 text-center -mt-1">{es ? 'Elige severidad, tipo de daño y completa el checklist de cierre para confirmar.' : 'Choose severity, damage type, and complete the closing checklist to confirm.'}</p>
      )}
      <button type="button" onClick={onCancelar} disabled={enviando}
        className="w-full text-xs text-gray-400 underline cursor-pointer disabled:opacity-40">{es ? 'Cancelar' : 'Cancel'}</button>
    </div>
  );
}

// Re-exporta el helper por compatibilidad con otros componentes que lo importan
export { areaLabel };