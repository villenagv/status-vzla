import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, RotateCcw, Users, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';

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
          .filter(r => {
            const nombre = findCol(r, 'nombre completo', 'nombre', 'full name', 'name', 'nombre_completo');
            return nombre.length > 1;
          })
          .map((r, i) => ({
            _id: i,
            _estado: 'pendiente',
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

// Busca o crea un PuntoAyuda para esta institución
async function resolverCentroApoyo(instId, instNombre, instTipo, ciudad, estado, es, onDuplicado) {
  // Buscar si ya existe un punto de ayuda vinculado a esta institución
  const todos = await base44.entities.PuntosAyuda.filter({ nombre_lugar: instNombre });
  const similares = todos.filter(p =>
    p.nombre_lugar?.toLowerCase().trim() === instNombre.toLowerCase().trim() ||
    p.fuente === instId
  );

  if (similares.length > 0) {
    // Existe — preguntar si es duplicado
    return new Promise((resolve) => {
      onDuplicado(similares[0], (decision) => {
        if (decision === 'actualizar') {
          // Actualizar personas_actuales
          base44.entities.PuntosAyuda.update(similares[0].id, {
            ultima_actualizacion: new Date().toISOString(),
            requiere_actualizacion: false,
          }).catch(() => {});
        }
        resolve(similares[0].id);
      });
    });
  }

  // No existe — crear nuevo PuntoAyuda
  const tipoMap = {
    refugio: 'refugio', hospital: 'hospital', centro_acopio: 'centro_acopio',
    comedor: 'comedor', otro: 'refugio',
  };
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

export default function ProcesadorProgresivo({ es, instId, instNombre, instTipo, ciudad, estado, onPersonasGuardadas }) {
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);
  const [parseError, setParseError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);

  // Estado para diálogo de duplicado
  const [duplicadoData, setDuplicadoData] = useState(null); // { centroExistente, resolve }

  const inputRef = useRef();

  const okCount = filas.filter(f => f._estado === 'ok').length;
  const errorCount = filas.filter(f => f._estado === 'error').length;
  const progreso = filas.length > 0 ? Math.round((okCount + errorCount) / filas.length * 100) : 0;

  const handleFile = async (file) => {
    if (!file) return;
    setArchivo(file);
    setFilas([]);
    setParseError('');
    setCompletado(false);
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

    // Resolver centro de apoyo primero
    let centroId = null;
    try {
      centroId = await resolverCentroApoyo(
        instId, instNombre, instTipo, ciudad, estado, es,
        (centroExistente, resolveFn) => {
          setDuplicadoData({ centroExistente, resolveFn });
        }
      );
    } catch {
      centroId = null;
    }

    const nuevas = [];
    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      if (fila._estado === 'ok') continue;

      setFilas(prev => prev.map((f, idx) => idx === i ? { ...f, _estado: 'procesando' } : f));

      try {
        const creada = await base44.entities.PersonaRegistrada.create({
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
        nuevas.push(creada);
        setFilas(prev => prev.map((f, idx) => idx === i ? { ...f, _estado: 'ok' } : f));
      } catch {
        setFilas(prev => prev.map((f, idx) => idx === i ? { ...f, _estado: 'error' } : f));
      }
      await new Promise(r => setTimeout(r, 150));
    }

    // Actualizar contador de personas en PuntoAyuda
    if (centroId && nuevas.length > 0) {
      base44.entities.PuntosAyuda.update(centroId, {
        personas_actuales: nuevas.length,
        ultima_actualizacion: new Date().toISOString(),
      }).catch(() => {});
    }

    setProcesando(false);
    setCompletado(true);
    if (onPersonasGuardadas) onPersonasGuardadas(nuevas.length);
  };

  const reintentarErrores = async () => {
    if (procesando) return;
    setFilas(prev => prev.map(f => f._estado === 'error' ? { ...f, _estado: 'pendiente' } : f));
    await new Promise(r => setTimeout(r, 50));
    await procesarTodo();
  };

  const reset = () => {
    setArchivo(null);
    setFilas([]);
    setParseError('');
    setCompletado(false);
    setProcesando(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-white border border-[#2471A3] rounded-xl p-4 space-y-4">
      {/* Diálogo duplicado */}
      {duplicadoData && (
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
                    ? `"${duplicadoData.centroExistente.nombre_lugar}" ya está registrado en ${duplicadoData.centroExistente.ciudad || 'el sistema'}. ¿Qué deseas hacer?`
                    : `"${duplicadoData.centroExistente.nombre_lugar}" is already registered in ${duplicadoData.centroExistente.ciudad || 'the system'}. What do you want to do?`}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { const fn = duplicadoData.resolveFn; setDuplicadoData(null); fn('actualizar'); }}
                className="w-full bg-[#2471A3] text-white font-bold py-3 rounded-xl text-sm"
              >
                {es ? '🔄 Actualizar el centro existente' : '🔄 Update existing center'}
              </button>
              <button
                onClick={() => { const fn = duplicadoData.resolveFn; setDuplicadoData(null); fn('nuevo'); }}
                className="w-full border border-[#EDEBE8] text-gray-700 font-semibold py-3 rounded-xl text-sm"
              >
                {es ? '+ Crear como centro nuevo' : '+ Create as new center'}
              </button>
            </div>
          </div>
        </div>
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
            ? 'Leemos el archivo aquí mismo (sin internet). Luego guardamos cada persona una a una. Si falla la conexión, puedes reintentar solo los que fallaron.'
            : 'We read the file locally (no internet needed). Then save each person one by one. If the connection fails, retry only the failed ones.'}
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
              </p>
            </div>
            {!procesando && !completado && (
              <button onClick={reset} className="text-[11px] text-blue-500 underline cursor-pointer">{es ? 'Cambiar' : 'Change'}</button>
            )}
          </div>

          {/* Barra de progreso */}
          {(procesando || completado) && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-[#1A1F2E]">
                  {completado
                    ? (es ? '✅ Proceso completado' : '✅ Process complete')
                    : (es ? `Guardando... ${okCount + errorCount} de ${filas.length}` : `Saving... ${okCount + errorCount} of ${filas.length}`)}
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
                        f._estado === 'error' ? 'bg-red-50' : ''
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de acción */}
          {!completado && !procesando && (
            <button onClick={procesarTodo} className="w-full bg-[#2471A3] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <FileText size={15} />
              {es ? `Guardar ${filas.length} personas al centro` : `Save ${filas.length} people to center`}
            </button>
          )}

          {procesando && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={16} className="animate-spin text-[#2471A3]" />
              <p className="text-sm text-[#2471A3] font-semibold">
                {es ? 'Guardando, no cierres esta página...' : "Saving, don't close this page..."}
              </p>
            </div>
          )}

          {completado && errorCount > 0 && (
            <button onClick={reintentarErrores} className="w-full bg-[#D48C2E] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              <RotateCcw size={14} />
              {es ? `Reintentar ${errorCount} con error` : `Retry ${errorCount} with error`}
            </button>
          )}

          {completado && errorCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl">🙏</p>
              <p className="text-sm font-bold text-green-800">{es ? '¡Gracias por tu ayuda!' : 'Thank you for your help!'}</p>
              <p className="text-xs text-green-700 leading-relaxed">
                {es
                  ? `${okCount} personas registradas bajo "${instNombre}". El centro de apoyo fue actualizado con esta información.`
                  : `${okCount} people registered under "${instNombre}". The aid center was updated with this information.`}
              </p>
              <p className="text-[11px] text-green-600">
                {es ? '🔒 Los teléfonos no se publicarán. Solo nombre y condición son visibles.' : '🔒 Phones will not be published. Only name and condition are visible.'}
              </p>
            </div>
          )}

          {completado && (
            <button onClick={reset} className="w-full text-xs text-gray-400 underline py-1 cursor-pointer">
              {es ? 'Subir otro archivo' : 'Upload another file'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}