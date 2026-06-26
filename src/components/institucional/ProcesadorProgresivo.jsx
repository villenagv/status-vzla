import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, RotateCcw, Users, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import DialogoDuplicado from './DialogoDuplicado';

const CONDICION_MAP = {
  'a salvo': 'a_salvo', 'a_salvo': 'a_salvo', 'safe': 'a_salvo', 'bien': 'a_salvo',
  'herido leve': 'herido_leve', 'leve': 'herido_leve', 'minor injury': 'herido_leve',
  'herido grave': 'herido_grave', 'grave': 'herido_grave', 'serious injury': 'herido_grave',
  'fallecido': 'fallecido_reportado', 'fallecido reportado': 'fallecido_reportado', 'death reported': 'fallecido_reportado',
  'no identificado': 'no_identificado', 'unidentified': 'no_identificado',
  'no sabe': 'no_sabe', 'unknown': 'no_sabe', 'n/a': 'no_sabe', 'desconocido': 'no_sabe',
};

function normalizeCondicion(val) {
  if (!val) return 'no_sabe';
  return CONDICION_MAP[String(val).toLowerCase().trim()] || 'no_sabe';
}

function findCol(row, ...keys) {
  for (const key of keys) {
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().trim() === key.toLowerCase()) {
        const v = row[k];
        if (v !== null && v !== undefined) {
          const s = String(v).trim();
          if (s && s.toLowerCase() !== 'n/a') return s;
        }
      }
    }
  }
  return '';
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const parsed = rows
          .filter(r => findCol(r, 'nombre completo', 'nombre', 'full name', 'name', 'nombre_completo').length > 1)
          .map((r, i) => ({
            _id: i,
            _estado: 'pendiente', // pendiente | procesando | ok | duplicado | error | ignorado
            nombre_completo: findCol(r, 'nombre completo', 'nombre', 'full name', 'name', 'nombre_completo'),
            fecha_nacimiento: findCol(r, 'fecha de nacimiento', 'fecha nacimiento', 'nacimiento', 'date of birth', 'fecha_nacimiento'),
            telefono_contacto: findCol(r, 'teléfono de contacto', 'telefono de contacto', 'teléfono', 'telefono', 'phone', 'telefono_contacto'),
            email: findCol(r, 'email', 'correo', 'correo electrónico', 'e-mail'),
            condicion: normalizeCondicion(findCol(r, 'condición', 'condicion', 'condition', 'estado')),
            observaciones: findCol(r, 'observaciones', 'notas', 'notes', 'obs'),
          }));
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const CONDICION_LABEL = {
  a_salvo: { es: 'A salvo', en: 'Safe', color: 'bg-green-100 text-green-700' },
  herido_leve: { es: 'Herido leve', en: 'Minor injury', color: 'bg-yellow-100 text-yellow-700' },
  herido_grave: { es: 'Herido grave', en: 'Serious injury', color: 'bg-orange-100 text-orange-700' },
  fallecido_reportado: { es: 'Fallecido', en: 'Death rep.', color: 'bg-gray-200 text-gray-600' },
  no_identificado: { es: 'No identif.', en: 'Unidentified', color: 'bg-purple-100 text-purple-700' },
  no_sabe: { es: 'No se sabe', en: 'Unknown', color: 'bg-gray-100 text-gray-500' },
};

// Normaliza un nombre para comparación fuzzy simple
function normalizarNombre(n) {
  return String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Devuelve true si los nombres son similares (contiene palabras clave)
function nombreSimilar(a, b) {
  const na = normalizarNombre(a);
  const nb = normalizarNombre(b);
  if (na === nb) return true;
  // Verificar si las palabras principales coinciden (al menos 2 palabras de >= 3 letras)
  const wordsA = na.split(/\s+/).filter(w => w.length >= 3);
  const wordsB = nb.split(/\s+/).filter(w => w.length >= 3);
  const matches = wordsA.filter(w => wordsB.includes(w));
  return matches.length >= 2;
}

// Busca duplicados en PersonaCRIS y PersonaRegistrada
async function buscarDuplicados(nombre) {
  const n = normalizarNombre(nombre);
  const palabras = n.split(/\s+/).filter(w => w.length >= 3);
  if (palabras.length === 0) return [];

  // Buscar usando la primera palabra del nombre como filtro de texto
  const [enCris, enRegistradas] = await Promise.all([
    base44.entities.PersonaCRIS.filter({}, '-created_date', 200).catch(() => []),
    base44.entities.PersonaRegistrada.filter({}, '-created_date', 200).catch(() => []),
  ]);

  const coincidenciasCris = enCris.filter(p =>
    nombreSimilar(p.nombre, nombre) || nombreSimilar(`${p.nombre} ${p.apellido}`, nombre)
  );
  const coincidenciasReg = enRegistradas.filter(p =>
    nombreSimilar(p.nombre_completo, nombre)
  );

  return [...coincidenciasCris, ...coincidenciasReg];
}

// Crea o actualiza PuntoAyuda
async function resolverCentroApoyo(instId, instNombre, instTipo, ciudad, estado, onDuplicadoCentro) {
  const todos = await base44.entities.PuntosAyuda.filter({ nombre_lugar: instNombre }).catch(() => []);
  const similares = todos.filter(p =>
    p.nombre_lugar?.toLowerCase().trim() === instNombre.toLowerCase().trim() || p.fuente === instId
  );
  if (similares.length > 0) {
    return new Promise((resolve) => {
      onDuplicadoCentro(similares[0], (decision) => {
        if (decision === 'actualizar') {
          base44.entities.PuntosAyuda.update(similares[0].id, {
            ultima_actualizacion: new Date().toISOString(),
            requiere_actualizacion: false,
          }).catch(() => {});
        }
        resolve(similares[0].id);
      });
    });
  }
  const tipoMap = { refugio: 'refugio', hospital: 'hospital', centro_acopio: 'centro_acopio', comedor: 'comedor', otro: 'refugio' };
  const nuevo = await base44.entities.PuntosAyuda.create({
    nombre_lugar: instNombre,
    tipo_lugar: tipoMap[instTipo] || 'refugio',
    tipo_entidad: instTipo,
    estado_operativo: 'abierto',
    ciudad: ciudad || '',
    estado_region: estado || '',
    fuente: instId,
    nivel_verificacion: 'institucional',
    ultima_actualizacion: new Date().toISOString(),
  });
  return nuevo.id;
}

async function crearPersona(fila, instId, instNombre, centroId) {
  return base44.entities.PersonaRegistrada.create({
    nombre_completo: fila.nombre_completo,
    fecha_nacimiento: fila.fecha_nacimiento,
    telefono_contacto: fila.telefono_contacto,
    email: fila.email,
    condicion: fila.condicion,
    observaciones: fila.observaciones,
    institucion_id: instId,
    institucion_nombre: instNombre,
    centro_apoyo: centroId || '',
    nivel_verificacion: 'institucional',
    fuente: 'institucional',
  });
}

export default function ProcesadorProgresivo({ es, instId, instNombre, instTipo, ciudad, estado, onPersonasGuardadas }) {
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);
  const [parseError, setParseError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);

  // Diálogo duplicado de centro de apoyo
  const [duplicadoCentro, setDuplicadoCentro] = useState(null);

  // Cola de duplicados de personas pendientes de resolver
  const [colaDuplicados, setColaDuplicados] = useState([]); // [{filaIdx, fila, coincidencias}]
  const [duplicadoActual, setDuplicadoActual] = useState(null);

  // centroId ref para usarlo en resolución de duplicados
  const centroIdRef = useRef(null);
  const inputRef = useRef();

  const setFilaEstado = (idx, estado) =>
    setFilas(prev => prev.map((f, i) => i === idx ? { ...f, _estado: estado } : f));

  const okCount = filas.filter(f => f._estado === 'ok').length;
  const errorCount = filas.filter(f => f._estado === 'error').length;
  const ignoradoCount = filas.filter(f => f._estado === 'ignorado').length;
  const dupCount = filas.filter(f => f._estado === 'duplicado_pendiente').length;
  const procesados = filas.filter(f => ['ok', 'error', 'ignorado'].includes(f._estado)).length;
  const progreso = filas.length > 0 ? Math.round(procesados / filas.length * 100) : 0;

  const handleFile = async (file) => {
    if (!file) return;
    setArchivo(file);
    setFilas([]);
    setParseError('');
    setCompletado(false);
    setColaDuplicados([]);
    setDuplicadoActual(null);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        setParseError(es
          ? 'No se encontraron filas con nombres. Verifica que el archivo tenga una columna "Nombre Completo".'
          : 'No rows with names found. Make sure the file has a "Full Name" column.');
        return;
      }
      setFilas(parsed);
    } catch {
      setParseError(es
        ? 'No se pudo leer el archivo. Verifica que sea Excel (.xlsx) o CSV válido.'
        : 'Could not read the file. Make sure it is a valid Excel (.xlsx) or CSV.');
    }
  };

  const procesarTodo = async () => {
    if (!filas.length || procesando) return;
    setProcesando(true);
    setCompletado(false);
    setColaDuplicados([]);
    setDuplicadoActual(null);

    // 1. Resolver centro de apoyo
    let centroId = null;
    try {
      centroId = await resolverCentroApoyo(
        instId, instNombre, instTipo, ciudad, estado,
        (centroExistente, resolveFn) => setDuplicadoCentro({ centroExistente, resolveFn })
      );
    } catch { centroId = null; }
    centroIdRef.current = centroId;

    // 2. Procesar cada fila — buscar duplicados, crear si no hay
    const colaPendiente = [];
    const snapshot = filas; // usar snapshot para índices correctos

    for (let i = 0; i < snapshot.length; i++) {
      const fila = snapshot[i];
      if (fila._estado === 'ok' || fila._estado === 'ignorado') continue;

      setFilaEstado(i, 'procesando');

      // Buscar duplicados
      let duplicados = [];
      try {
        duplicados = await buscarDuplicados(fila.nombre_completo);
      } catch { duplicados = []; }

      if (duplicados.length > 0) {
        // Marcar como duplicado pendiente y encolar
        setFilaEstado(i, 'duplicado_pendiente');
        colaPendiente.push({ filaIdx: i, fila, coincidencias: duplicados });
        await new Promise(r => setTimeout(r, 80));
        continue;
      }

      // Sin duplicados — crear directamente
      try {
        await crearPersona(fila, instId, instNombre, centroId);
        setFilaEstado(i, 'ok');
      } catch {
        setFilaEstado(i, 'error');
      }
      await new Promise(r => setTimeout(r, 120));
    }

    // 3. Si hay duplicados en cola, mostrar uno a uno
    if (colaPendiente.length > 0) {
      setProcesando(false); // pausar spinner principal
      setColaDuplicados(colaPendiente);
      setDuplicadoActual(0);
      return; // La resolución continúa en handleDecisionDuplicado
    }

    // 4. Finalizar
    finalizarProceso(centroId);
  };

  const handleDecisionDuplicado = async ({ accion, coincidenciaId }) => {
    const item = colaDuplicados[duplicadoActual];
    const centroId = centroIdRef.current;

    if (accion === 'nuevo') {
      // Crear como persona nueva
      try {
        await crearPersona(item.fila, instId, instNombre, centroId);
        setFilaEstado(item.filaIdx, 'ok');
      } catch {
        setFilaEstado(item.filaIdx, 'error');
      }
    } else if (accion === 'mismo') {
      // Actualizar la existente con los datos nuevos (si es PersonaRegistrada)
      try {
        await base44.entities.PersonaRegistrada.update(coincidenciaId, {
          condicion: item.fila.condicion,
          observaciones: item.fila.observaciones,
          institucion_id: instId,
          institucion_nombre: instNombre,
          centro_apoyo: centroId || '',
          nivel_verificacion: 'institucional',
        }).catch(async () => {
          // Si falla (es PersonaCRIS), crear un enlace en PersonaRegistrada igualmente
          await crearPersona(item.fila, instId, instNombre, centroId);
        });
        setFilaEstado(item.filaIdx, 'ok');
      } catch {
        setFilaEstado(item.filaIdx, 'error');
      }
    } else {
      // ignorar
      setFilaEstado(item.filaIdx, 'ignorado');
    }

    const siguienteIdx = duplicadoActual + 1;
    if (siguienteIdx < colaDuplicados.length) {
      setDuplicadoActual(siguienteIdx);
    } else {
      // Cola agotada — finalizar
      setDuplicadoActual(null);
      setColaDuplicados([]);
      finalizarProceso(centroId);
    }
  };

  const finalizarProceso = (centroId) => {
    // Actualizar contador en PuntoAyuda
    if (centroId) {
      setFilas(prev => {
        const okC = prev.filter(f => f._estado === 'ok').length;
        base44.entities.PuntosAyuda.update(centroId, {
          personas_actuales: okC,
          ultima_actualizacion: new Date().toISOString(),
        }).catch(() => {});
        return prev;
      });
    }
    setProcesando(false);
    setCompletado(true);
    if (onPersonasGuardadas) {
      setFilas(prev => {
        const okC = prev.filter(f => f._estado === 'ok').length;
        onPersonasGuardadas(okC);
        return prev;
      });
    }
  };

  const reintentarErrores = async () => {
    if (procesando) return;
    setFilas(prev => prev.map(f => f._estado === 'error' ? { ...f, _estado: 'pendiente' } : f));
    setCompletado(false);
    await new Promise(r => setTimeout(r, 50));
    await procesarTodo();
  };

  const reset = () => {
    setArchivo(null);
    setFilas([]);
    setParseError('');
    setCompletado(false);
    setProcesando(false);
    setColaDuplicados([]);
    setDuplicadoActual(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const itemDuplicadoActual = duplicadoActual !== null ? colaDuplicados[duplicadoActual] : null;

  return (
    <div className="bg-white border border-[#2471A3] rounded-xl p-4 space-y-4">

      {/* Diálogo duplicado de CENTRO */}
      {duplicadoCentro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-[#D48C2E] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#1A1F2E]">
                  {es ? '⚠️ Ya existe un centro con este nombre' : '⚠️ A center with this name already exists'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {es
                    ? `"${duplicadoCentro.centroExistente.nombre_lugar}" ya está registrado en ${duplicadoCentro.centroExistente.ciudad || 'el sistema'}. ¿Qué deseas hacer?`
                    : `"${duplicadoCentro.centroExistente.nombre_lugar}" is already registered in ${duplicadoCentro.centroExistente.ciudad || 'the system'}. What do you want to do?`}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { const fn = duplicadoCentro.resolveFn; setDuplicadoCentro(null); fn('actualizar'); }}
                className="w-full bg-[#2471A3] text-white font-bold py-3 rounded-xl text-sm"
              >
                {es ? '🔄 Actualizar el centro existente' : '🔄 Update existing center'}
              </button>
              <button
                onClick={() => { const fn = duplicadoCentro.resolveFn; setDuplicadoCentro(null); fn('nuevo'); }}
                className="w-full border border-[#EDEBE8] text-gray-700 font-semibold py-3 rounded-xl text-sm"
              >
                {es ? '+ Crear como centro nuevo' : '+ Create as new center'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo duplicado de PERSONA */}
      {itemDuplicadoActual && (
        <DialogoDuplicado
          persona={itemDuplicadoActual.fila}
          coincidencias={itemDuplicadoActual.coincidencias}
          es={es}
          onDecision={handleDecisionDuplicado}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Users size={16} className="text-[#2471A3]" />
        <h3 className="text-sm font-bold text-[#1A1F2E]">
          {es ? 'Opción B — Procesar archivo persona por persona' : 'Option B — Process file person by person'}
        </h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1">
        <p className="text-[11px] text-blue-800 font-semibold">
          ⚡ {es ? '¿Tienes mala conexión? Esta opción es para ti.' : 'Poor connection? This option is for you.'}
        </p>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          {es
            ? 'Leemos el archivo aquí mismo. Luego guardamos cada persona, detectamos posibles duplicados y te preguntamos antes de crear registros repetidos.'
            : 'We read the file locally. Then save each person, detect possible duplicates and ask before creating repeated records.'}
        </p>
        <p className="text-[11px] text-blue-600">
          {es ? '✅ El centro de apoyo se creará o actualizará automáticamente.' : '✅ The aid center will be created or updated automatically.'}
        </p>
      </div>

      {/* Upload zone */}
      {!filas.length && (
        <div>
          <label
            htmlFor="prog-file-upload"
            className="flex flex-col items-center gap-3 border-2 border-dashed border-[#2471A3] rounded-xl p-5 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <Upload size={28} className="text-[#2471A3]" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1A1F2E]">
                {archivo ? `📄 ${archivo.name}` : (es ? 'Toca para seleccionar archivo' : 'Tap to select file')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Excel (.xlsx) · CSV</p>
            </div>
          </label>
          <input
            ref={inputRef}
            id="prog-file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
          {parseError && (
            <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 mt-2">
              <AlertCircle size={14} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#B83A52]">{parseError}</p>
            </div>
          )}
        </div>
      )}

      {/* Preview + procesamiento */}
      {filas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <div>
              <p className="text-xs font-bold text-blue-800">📄 {archivo?.name}</p>
              <p className="text-[11px] text-blue-600">
                {filas.length} {es ? 'personas detectadas' : 'people detected'}
                {okCount > 0 && ` · ✅ ${okCount}`}
                {errorCount > 0 && ` · ❌ ${errorCount}`}
                {dupCount > 0 && ` · 🔍 ${dupCount} ${es ? 'a revisar' : 'to review'}`}
                {ignoradoCount > 0 && ` · ⊘ ${ignoradoCount}`}
              </p>
            </div>
            {!procesando && !completado && !itemDuplicadoActual && (
              <button onClick={reset} className="text-[11px] text-blue-500 underline cursor-pointer">{es ? 'Cambiar' : 'Change'}</button>
            )}
          </div>

          {/* Aviso cola de duplicados */}
          {itemDuplicadoActual && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center">
              <p className="text-xs font-bold text-orange-800">
                🔍 {es
                  ? `Revisando ${duplicadoActual + 1} de ${colaDuplicados.length} posible${colaDuplicados.length > 1 ? 's' : ''} duplicado${colaDuplicados.length > 1 ? 's' : ''}`
                  : `Reviewing ${duplicadoActual + 1} of ${colaDuplicados.length} possible duplicate${colaDuplicados.length > 1 ? 's' : ''}`}
              </p>
              <p className="text-[11px] text-orange-600">
                {es ? 'Los demás registros ya se guardaron. Ahora revisa los que tienen coincidencias.' : 'Other records are already saved. Now review those with matches.'}
              </p>
            </div>
          )}

          {/* Barra de progreso */}
          {(procesando || completado || itemDuplicadoActual) && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-[#1A1F2E]">
                  {completado && !itemDuplicadoActual
                    ? (es ? '✅ Proceso completado' : '✅ Process complete')
                    : itemDuplicadoActual
                      ? (es ? '🔍 Revisando duplicados...' : '🔍 Reviewing duplicates...')
                      : (es ? `Guardando... ${procesados} de ${filas.length}` : `Saving... ${procesados} of ${filas.length}`)}
                </p>
                <span className="text-xs font-bold text-[#2471A3]">{progreso}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%`, background: errorCount > 0 && completado ? '#d48c2e' : '#1A7A4A' }}
                />
              </div>
            </div>
          )}

          {/* Tabla de filas */}
          <div className="border border-[#EDEBE8] rounded-xl overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-[#EDEBE8] sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500">#</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500">{es ? 'Nombre' : 'Name'}</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500">{es ? 'Condición' : 'Condition'}</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500">{es ? 'Estado' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEBE8]">
                  {filas.map((f, i) => {
                    const cond = CONDICION_LABEL[f.condicion] || CONDICION_LABEL.no_sabe;
                    return (
                      <tr key={f._id} className={
                        f._estado === 'procesando' ? 'bg-blue-50' :
                        f._estado === 'ok' ? 'bg-green-50' :
                        f._estado === 'error' ? 'bg-red-50' :
                        f._estado === 'duplicado_pendiente' ? 'bg-orange-50' :
                        f._estado === 'ignorado' ? 'bg-gray-50 opacity-50' : ''
                      }>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-[#1A1F2E] max-w-[120px] truncate">{f.nombre_completo}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cond.color}`}>
                            {es ? cond.es : cond.en}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {f._estado === 'pendiente' && <span className="text-gray-400">—</span>}
                          {f._estado === 'procesando' && <Loader2 size={12} className="animate-spin text-blue-500" />}
                          {f._estado === 'ok' && <CheckCircle size={13} className="text-green-600" />}
                          {f._estado === 'error' && <AlertCircle size={13} className="text-red-500" />}
                          {f._estado === 'duplicado_pendiente' && <span className="text-orange-500 text-[10px] font-bold">🔍</span>}
                          {f._estado === 'ignorado' && <span className="text-gray-400 text-[10px]">⊘</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de acción */}
          {!completado && !procesando && !itemDuplicadoActual && (
            <button onClick={procesarTodo} className="w-full bg-[#2471A3] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <FileText size={15} />
              {es ? `Guardar ${filas.length} personas al centro` : `Save ${filas.length} people to center`}
            </button>
          )}

          {procesando && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={16} className="animate-spin text-[#2471A3]" />
              <p className="text-sm text-[#2471A3] font-semibold">
                {es ? 'Guardando y verificando duplicados...' : 'Saving and checking for duplicates...'}
              </p>
            </div>
          )}

          {completado && !itemDuplicadoActual && errorCount > 0 && (
            <button onClick={reintentarErrores} className="w-full bg-[#D48C2E] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              <RotateCcw size={14} />
              {es ? `Reintentar ${errorCount} con error` : `Retry ${errorCount} with error`}
            </button>
          )}

          {completado && !itemDuplicadoActual && errorCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl">🙏</p>
              <p className="text-sm font-bold text-green-800">{es ? '¡Gracias por tu ayuda!' : 'Thank you for your help!'}</p>
              <p className="text-xs text-green-700 leading-relaxed">
                {es
                  ? `${okCount} personas registradas bajo "${instNombre}". El centro de apoyo fue actualizado.`
                  : `${okCount} people registered under "${instNombre}". The aid center was updated.`}
                {ignoradoCount > 0 && (es ? ` ${ignoradoCount} omitidas.` : ` ${ignoradoCount} skipped.`)}
              </p>
              <p className="text-[11px] text-green-600">
                {es ? '🔒 Los teléfonos no se publicarán.' : '🔒 Phones will not be published.'}
              </p>
            </div>
          )}

          {completado && !itemDuplicadoActual && (
            <button onClick={reset} className="w-full text-xs text-gray-400 underline py-1 cursor-pointer">
              {es ? 'Subir otro archivo' : 'Upload another file'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}