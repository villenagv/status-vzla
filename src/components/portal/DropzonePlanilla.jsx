import { useState, useRef } from 'react';
import { Loader2, FileText, UploadCloud, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * DropzonePlanilla — arrastra y suelta una planilla PDF (ej. FUNVISIS) para
 * extraer automáticamente los datos y pre-llenar el formulario de inspección.
 * Props: es, onExtraido(datos)
 */
const SCHEMA = {
  type: 'object',
  properties: {
    nombre_lugar: { type: 'string', description: 'Nombre del edificio o sitio' },
    direccion: { type: 'string', description: 'Dirección o referencia' },
    ciudad: { type: 'string' },
    estado_region: { type: 'string' },
    pisos_totales: { type: 'string', description: 'Número total de pisos' },
    descripcion: { type: 'string', description: 'Descripción de los daños observados' },
    personas_atrapadas: { type: 'string', enum: ['si', 'no', 'no_sabe', 'voces', 'posible'] },
  },
};

export default function DropzonePlanilla({ es, onExtraido }) {
  const [arrastrando, setArrastrando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const procesar = async (file) => {
    if (!file) return;
    setProcesando(true);
    setError('');
    setOk(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: SCHEMA });
      if (res.status === 'success' && res.output) {
        onExtraido(res.output);
        setOk(true);
      } else {
        setError(es ? 'No se pudieron extraer datos de este archivo.' : 'Could not extract data from this file.');
      }
    } catch {
      setError(es ? 'No se pudo procesar el archivo. Intenta de nuevo.' : 'Could not process the file. Try again.');
    }
    setProcesando(false);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={e => { e.preventDefault(); setArrastrando(false); procesar(e.dataTransfer.files?.[0]); }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${arrastrando ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'}`}
    >
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
        onChange={e => { procesar(e.target.files?.[0]); e.target.value = ''; }} />
      {procesando ? (
        <>
          <Loader2 size={20} className="animate-spin text-blue-600 mx-auto mb-1" />
          <p className="text-xs font-semibold text-blue-700">{es ? 'Leyendo planilla...' : 'Reading form...'}</p>
        </>
      ) : ok ? (
        <>
          <CheckCircle2 size={20} className="text-green-600 mx-auto mb-1" />
          <p className="text-xs font-semibold text-green-700">{es ? 'Datos cargados. Puedes revisarlos abajo.' : 'Data loaded. You can review it below.'}</p>
          <p className="text-[10px] text-gray-400 mt-1">{es ? 'Arrastra otra planilla para reemplazar' : 'Drop another form to replace'}</p>
        </>
      ) : (
        <>
          <UploadCloud size={20} className="text-gray-400 mx-auto mb-1" />
          <p className="text-xs font-semibold text-gray-600">
            {es ? 'Arrastra aquí la planilla PDF (o toca para elegirla)' : 'Drag the PDF form here (or tap to choose it)'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
            <FileText size={11} /> {es ? 'Rellenaremos los campos automáticamente' : "We'll fill in the fields automatically"}
          </p>
        </>
      )}
      {error && <p className="text-[11px] text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}