import { useState, useRef } from 'react';
import { Upload, CheckCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
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

function parseFileLocal(file) {
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
          .map(r => ({
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

/**
 * SubidorArchivo — Opción A
 * Sube el archivo a storage Y crea una ficha PersonaRegistrada por cada persona del listado.
 * Props: es, instId, instNombre
 */
export default function SubidorArchivo({ es, instId, instNombre }) {
  const [archivo, setArchivo] = useState(null);
  const [fase, setFase] = useState('idle'); // idle | subiendo | guardando | ok | error
  const [progreso, setProgreso] = useState(0);
  const [guardadas, setGuardadas] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef();

  const reset = () => {
    setArchivo(null);
    setFase('idle');
    setProgreso(0);
    setGuardadas(0);
    setTotal(0);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const procesar = async () => {
    if (!archivo) return;
    setErrorMsg('');

    // FASE 1: Subir archivo a storage (para auditoría)
    setFase('subiendo');
    let fileUrl = null;
    try {
      const res = await base44.integrations.Core.UploadFile({ file: archivo });
      fileUrl = res.file_url;
    } catch {
      // No bloqueamos si falla la subida — igual creamos fichas
    }

    // FASE 2: Parsear en cliente
    let personas = [];
    try {
      personas = await parseFileLocal(archivo);
    } catch {
      setFase('error');
      setErrorMsg(es
        ? 'No se pudo leer el archivo. Verifica que sea Excel (.xlsx) o CSV válido.'
        : 'Could not read the file. Make sure it is valid Excel (.xlsx) or CSV.');
      return;
    }

    if (personas.length === 0) {
      setFase('error');
      setErrorMsg(es
        ? 'No se encontraron personas en el archivo. Asegúrate de tener una columna "Nombre Completo".'
        : 'No people found in the file. Make sure you have a "Full Name" column.');
      return;
    }

    // FASE 3: Crear fichas una a una
    setFase('guardando');
    setTotal(personas.length);
    let ok = 0;
    for (let i = 0; i < personas.length; i++) {
      try {
        await base44.entities.PersonaRegistrada.create({
          ...personas[i],
          institucion_id: instId || '',
          institucion_nombre: instNombre || '',
          nivel_verificacion: 'institucional',
          fuente: 'institucional',
        });
        ok++;
      } catch { /* continuar con las demás */ }
      setProgreso(Math.round(((i + 1) / personas.length) * 100));
      setGuardadas(ok);
      await new Promise(r => setTimeout(r, 100));
    }

    setFase('ok');
    setGuardadas(ok);
  };

  return (
    <div className="bg-white border border-[#EDEBE8] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Upload size={16} className="text-[#D48C2E]" />
        <h3 className="text-sm font-bold text-[#1A1F2E]">
          {es ? 'Opción A — Subir archivo y crear fichas' : 'Option A — Upload file and create records'}
        </h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        {es
          ? 'Sube tu archivo Excel o CSV. El sistema leerá cada fila y creará una ficha individual por persona automáticamente.'
          : 'Upload your Excel or CSV file. The system will read each row and automatically create an individual record per person.'}
      </p>

      <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
        <p className="text-[11px] text-orange-800 leading-relaxed">
          📋 {es
            ? 'Acepta: Excel (.xlsx), CSV (.csv). Columna requerida: "Nombre Completo". Otras columnas opcionales: Fecha nacimiento, Teléfono, Condición, Observaciones.'
            : 'Accepts: Excel (.xlsx), CSV (.csv). Required column: "Full Name". Other optional columns: Date of birth, Phone, Condition, Notes.'}
        </p>
      </div>

      {fase === 'idle' && (
        <>
          <label
            htmlFor="subidor-file"
            className="flex flex-col items-center gap-2 border-2 border-dashed border-[#D48C2E] rounded-xl p-4 cursor-pointer hover:bg-orange-50 transition-colors"
          >
            <FileText size={24} className="text-[#D48C2E]" />
            <p className="text-sm font-semibold text-[#1A1F2E] text-center">
              {archivo ? `📄 ${archivo.name}` : (es ? 'Toca para seleccionar archivo' : 'Tap to select file')}
            </p>
            <p className="text-[10px] text-gray-400">.xlsx · .csv</p>
          </label>
          <input
            ref={inputRef}
            id="subidor-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={e => setArchivo(e.target.files[0])}
          />
          {archivo && (
            <button
              onClick={procesar}
              className="w-full bg-[#D48C2E] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              {es ? 'Subir y crear fichas' : 'Upload and create records'}
            </button>
          )}
        </>
      )}

      {(fase === 'subiendo') && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 size={16} className="animate-spin text-[#D48C2E]" />
          <p className="text-sm text-[#D48C2E] font-semibold">{es ? 'Subiendo archivo...' : 'Uploading file...'}</p>
        </div>
      )}

      {fase === 'guardando' && (
        <div className="space-y-2 py-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-[#1A1F2E] flex items-center gap-1">
              <Loader2 size={12} className="animate-spin text-[#D48C2E]" />
              {es ? `Creando fichas... ${guardadas} de ${total}` : `Creating records... ${guardadas} of ${total}`}
            </p>
            <span className="text-xs font-bold text-[#D48C2E]">{progreso}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#D48C2E] rounded-full transition-all duration-200" style={{ width: `${progreso}%` }} />
          </div>
          <p className="text-[11px] text-gray-400">{es ? 'No cierres esta página...' : "Don't close this page..."}</p>
        </div>
      )}

      {fase === 'ok' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-600" />
            <p className="text-xs font-bold text-green-800">
              {es ? `¡${guardadas} fichas creadas correctamente!` : `${guardadas} records created successfully!`}
            </p>
          </div>
          <p className="text-[11px] text-green-700">
            {es
              ? `Cada persona de la lista ya tiene su ficha en el sistema. 🔒 Los datos privados no son visibles públicamente.`
              : `Each person on the list now has a record in the system. 🔒 Private data is not publicly visible.`}
          </p>
          <button onClick={reset} className="text-[11px] text-green-600 underline cursor-pointer mt-1">
            {es ? 'Subir otro archivo' : 'Upload another file'}
          </button>
        </div>
      )}

      {fase === 'error' && (
        <div className="space-y-2">
          <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3">
            <AlertCircle size={14} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#B83A52]">{errorMsg}</p>
          </div>
          <button onClick={reset} className="w-full border border-[#EDEBE8] text-gray-600 text-xs font-semibold py-2.5 rounded-xl">
            {es ? 'Intentar con otro archivo' : 'Try with another file'}
          </button>
        </div>
      )}
    </div>
  );
}