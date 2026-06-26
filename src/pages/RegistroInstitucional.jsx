import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Upload, Loader2, CheckCircle, AlertCircle, FileText, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import TablaPersonas from '@/components/institucional/TablaPersonas';
import FormularioManual from '@/components/institucional/FormularioManual';
import PromptCopiable from '@/components/institucional/PromptCopiable';
import ProcesadorProgresivo from '@/components/institucional/ProcesadorProgresivo';
import SubidorArchivo from '@/components/institucional/SubidorArchivo';
import PegadorTexto from '@/components/institucional/PegadorTexto';

const TIPOS = [
  { val: 'refugio', es: 'Refugio', en: 'Shelter' },
  { val: 'hospital', es: 'Hospital', en: 'Hospital' },
  { val: 'centro_acopio', es: 'Centro de acopio', en: 'Aid center' },
  { val: 'comedor', es: 'Comedor / cocina', en: 'Food center' },
  { val: 'otro', es: 'Otro', en: 'Other' },
];

const PASO_INSTITUCION = 'institucion';
const PASO_PERSONAS = 'personas';
const PASO_CONFIRMACION = 'confirmacion';

export default function RegistroInstitucional() {
  const { lang } = useLang();
  const es = lang === 'es';

  // Paso actual
  const [paso, setPaso] = useState(PASO_INSTITUCION);

  // Datos institución
  const [inst, setInst] = useState({
    institucion_nombre: '', institucion_tipo: '', institucion_ciudad: '',
    institucion_estado: '', responsable_nombre: '', responsable_telefono: '',
    responsable_email: '',
  });
  const [instId, setInstId] = useState(null);
  const [guardandoInst, setGuardandoInst] = useState(false);
  const [instError, setInstError] = useState('');
  const [camposError, setCamposError] = useState({});

  // Personas
  const [personas, setPersonas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);

  // Carga de archivo
  const [archivo, setArchivo] = useState(null);
  const [indexando, setIndexando] = useState(false);
  const [indexError, setIndexError] = useState('');

  const setI = (k, v) => setInst(f => ({ ...f, [k]: v }));

  // PASO 1: Registrar institución
  const registrarInstitucion = async () => {
    const errores = {};
    if (!inst.institucion_nombre.trim()) errores.institucion_nombre = es ? 'El nombre del lugar es obligatorio.' : 'Place name is required.';
    if (!inst.institucion_tipo) errores.institucion_tipo = es ? 'Selecciona el tipo de lugar.' : 'Select the place type.';
    if (!inst.responsable_telefono.trim()) errores.responsable_telefono = es ? 'El teléfono del responsable es obligatorio.' : 'Responsible phone is required.';
    if (Object.keys(errores).length > 0) {
      setCamposError(errores);
      setInstError(es ? 'Corrige los campos marcados en rojo antes de continuar.' : 'Fix the fields marked in red before continuing.');
      return;
    }
    setCamposError({});
    setGuardandoInst(true);
    setInstError('');
    try {
      const creada = await base44.entities.RegistroInstitucional.create(inst);
      setInstId(creada.id);
      setPaso(PASO_PERSONAS);
    } catch {
      setInstError(es ? 'Error al registrar. Intenta de nuevo.' : 'Registration error. Try again.');
    }
    setGuardandoInst(false);
  };

  // PASO 2A: Indexar archivo con IA
  const indexarArchivo = async () => {
    if (!archivo) return;
    setIndexando(true);
    setIndexError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      const res = await base44.functions.invoke('indexarListaInstitucional', {
        file_url,
        institucion_id: instId,
        institucion_nombre: inst.institucion_nombre,
      });
      if (res.data?.status === 'success' && res.data.personas?.length > 0) {
        setPersonas(prev => [...prev, ...res.data.personas]);
        setArchivo(null);
      } else {
        setIndexError(es
          ? 'El sistema no pudo leer el archivo. Usa el formulario manual o el prompt de IA.'
          : 'The system could not read the file. Use manual entry or the AI prompt.');
      }
    } catch {
      setIndexError(es ? 'Error al procesar el archivo.' : 'Error processing the file.');
    }
    setIndexando(false);
  };

  // Editar/eliminar persona en tabla borrador
  const editarPersona = (idx, datos) => {
    setPersonas(prev => prev.map((p, i) => i === idx ? { ...p, ...datos } : p));
  };
  const eliminarPersona = (idx) => {
    setPersonas(prev => prev.filter((_, i) => i !== idx));
  };
  const agregarPersona = (nueva) => {
    setPersonas(prev => [...prev, { ...nueva, institucion_id: instId, institucion_nombre: inst.institucion_nombre, nivel_verificacion: 'borrador', fuente: 'institucional' }]);
  };

  // PASO 3: Confirmar y guardar todo
  const confirmarYGuardar = async () => {
    if (personas.length === 0) return;
    setGuardando(true);
    try {
      await base44.entities.PersonaRegistrada.bulkCreate(
        personas.map(p => ({ ...p, nivel_verificacion: 'institucional' }))
      );
      setGuardadoOk(true);
      setPaso(PASO_CONFIRMACION);
    } catch {
      alert(es ? 'Error al guardar. Intenta de nuevo.' : 'Save error. Try again.');
    }
    setGuardando(false);
  };

  // ── PANTALLA ÉXITO ──
  if (paso === PASO_CONFIRMACION) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center">
        <div className="text-5xl mb-4">🙏</div>
        <CheckCircle size={40} className="text-green-600 mb-3" />
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">
          {es ? '¡Gracias por tu ayuda!' : 'Thank you for your help!'}
        </h2>
        <p className="text-sm text-gray-600 max-w-xs mb-2 leading-relaxed">
          {es
            ? `El listado de "${inst.institucion_nombre}" fue registrado. Esta información ayuda a las familias a encontrar a sus seres queridos.`
            : `The list for "${inst.institucion_nombre}" has been registered. This information helps families find their loved ones.`}
        </p>
        <p className="text-xs text-gray-400 max-w-xs mb-6">
          {es
            ? '🔒 Los teléfonos y datos privados NO se publicarán. Solo nombre y condición son visibles públicamente.'
            : '🔒 Phones and private data will NOT be published. Only name and condition are publicly visible.'}
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button onClick={() => { setPaso(PASO_PERSONAS); setGuardadoOk(false); }} className="bg-[#D48C2E] text-white font-bold py-3 rounded-xl text-sm">
            {es ? 'Agregar más personas' : 'Add more people'}
          </button>
          <Link to="/" className="block text-center bg-[#1A1F2E] text-white font-bold py-3 rounded-xl text-sm">
            {es ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">

        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        {/* Cabecera */}
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
            {es ? 'Portal Institucional' : 'Institutional Portal'}
          </p>
          <h1 className="text-xl font-bold text-[#1A1F2E]">
            {es ? '🏥 Registro de personas encontradas' : '🏥 Register found persons'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {es
              ? 'Para refugios, hospitales y centros de acopio. Registra tu institución y sube el listado de personas que tienes a tu cargo. Los datos privados (teléfonos) nunca se publicarán.'
              : 'For shelters, hospitals and aid centers. Register your institution and upload the list of people in your care. Private data (phones) will never be published.'}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: PASO_INSTITUCION, label: es ? '1. Institución' : '1. Institution' },
            { key: PASO_PERSONAS, label: es ? '2. Personas' : '2. People' },
          ].map((p, i) => (
            <div key={p.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${paso === p.key ? 'bg-[#1A1F2E] text-white' : instId ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {p.label}
              </div>
              {i < 1 && <div className="h-px w-4 bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* ══════════ PASO 1: INSTITUCIÓN ══════════ */}
        {paso === PASO_INSTITUCION && (
          <div className="space-y-4">
            <div className="bg-white border border-[#EDEBE8] rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? 'Datos de la institución' : 'Institution data'}</h3>

              <div>
                <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Nombre del lugar' : 'Place name'} *</label>
                <input
                  value={inst.institucion_nombre}
                  onChange={e => { setI('institucion_nombre', e.target.value); setCamposError(p => ({ ...p, institucion_nombre: '' })); }}
                  placeholder={es ? 'Ej: Refugio Escuela Bolívar' : 'E.g: Bolivar School Shelter'}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none ${camposError.institucion_nombre ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-[#EDEBE8] focus:border-[#1A1F2E]'}`}
                />
                {camposError.institucion_nombre && <p className="text-xs text-red-600 mt-1">⚠ {camposError.institucion_nombre}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1F2E] mb-2">{es ? 'Tipo de lugar' : 'Place type'} *</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <button key={t.val} type="button" onClick={() => { setI('institucion_tipo', t.val); setCamposError(p => ({ ...p, institucion_tipo: '' })); }} className={`px-3 py-2 rounded-xl text-xs border transition-colors ${inst.institucion_tipo === t.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : camposError.institucion_tipo ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
                      {es ? t.es : t.en}
                    </button>
                  ))}
                </div>
                {camposError.institucion_tipo && <p className="text-xs text-red-600 mt-1">⚠ {camposError.institucion_tipo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Ciudad' : 'City'} *</label>
                  <input value={inst.institucion_ciudad} onChange={e => setI('institucion_ciudad', e.target.value)} placeholder="Caracas" className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Estado' : 'State'} *</label>
                  <input value={inst.institucion_estado} onChange={e => setI('institucion_estado', e.target.value)} placeholder="Miranda" className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#EDEBE8] rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? 'Responsable' : 'Responsible person'}</h3>
              <p className="text-xs text-gray-400">{es ? 'No se publicará.' : 'Will not be published.'}</p>
              <div>
                <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Nombre del responsable' : 'Responsible name'}</label>
                <input value={inst.responsable_nombre} onChange={e => setI('responsable_nombre', e.target.value)} placeholder={es ? 'Ej: Carlos Pérez' : 'E.g: Carlos Pérez'} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Teléfono' : 'Phone'} *</label>
                   <input
                     value={inst.responsable_telefono}
                     onChange={e => { setI('responsable_telefono', e.target.value); setCamposError(p => ({ ...p, responsable_telefono: '' })); }}
                     placeholder="+58..."
                     className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${camposError.responsable_telefono ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-[#EDEBE8] focus:border-[#1A1F2E]'}`}
                   />
                   {camposError.responsable_telefono && <p className="text-xs text-red-600 mt-1">⚠ {camposError.responsable_telefono}</p>}
                 </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">Email</label>
                  <input type="email" value={inst.responsable_email} onChange={e => setI('responsable_email', e.target.value)} placeholder="correo@..." className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]" />
                </div>
              </div>
            </div>

            {instError && (
              <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3">
                <AlertCircle size={14} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#B83A52]">{instError}</p>
              </div>
            )}

            <button
              onClick={registrarInstitucion}
              disabled={guardandoInst}
              className="w-full bg-[#1A1F2E] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
            >
              {guardandoInst ? <Loader2 size={18} className="animate-spin" /> : null}
              {es ? 'Continuar — agregar personas →' : 'Continue — add people →'}
            </button>
          </div>
        )}

        {/* ══════════ PASO 2: PERSONAS ══════════ */}
        {paso === PASO_PERSONAS && (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-800 font-semibold">
                {es ? `Institución registrada: ${inst.institucion_nombre}` : `Institution registered: ${inst.institucion_nombre}`}
              </p>
            </div>

            {/* Instrucciones generales */}
            <div className="bg-[#F0F4FD] border border-[#B0C4E8] rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-[#1A1F2E]">
                📋 {es ? '¿Cómo quieres subir tu listado?' : 'How do you want to upload your list?'}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {es
                  ? 'Usa la opción que mejor se adapte a tu situación. El sistema actualizará automáticamente el centro de apoyo con la información registrada.'
                  : 'Use the option that best fits your situation. The system will automatically update the aid center with the registered information.'}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white border border-[#EDEBE8] rounded-lg px-2 py-2">
                  <p className="text-lg">📁</p>
                  <p className="text-[10px] font-semibold text-[#D48C2E]">{es ? 'A: Guardar archivo' : 'A: Save file'}</p>
                  <p className="text-[9px] text-gray-400">{es ? 'Sin procesar' : 'Without processing'}</p>
                </div>
                <div className="bg-white border border-[#B0C4E8] rounded-lg px-2 py-2">
                  <p className="text-lg">⚡</p>
                  <p className="text-[10px] font-semibold text-[#2471A3]">{es ? 'B: Procesar Excel/CSV' : 'B: Process Excel/CSV'}</p>
                  <p className="text-[9px] text-gray-400">{es ? 'Uno a uno' : 'One by one'}</p>
                </div>
                <div className="bg-white border border-[#EDEBE8] rounded-lg px-2 py-2">
                  <p className="text-lg">📝</p>
                  <p className="text-[10px] font-semibold text-[#6C3483]">{es ? 'C: Copiar y pegar' : 'C: Copy & paste'}</p>
                  <p className="text-[9px] text-gray-400">{es ? 'Texto libre' : 'Free text'}</p>
                </div>
              </div>
            </div>

            {/* OPCIÓN A: Solo guardar archivo sin procesar */}
            <SubidorArchivo es={es} />

            {/* OPCIÓN B: Procesamiento progresivo con centro de apoyo */}
            <ProcesadorProgresivo
              es={es}
              instId={instId}
              instNombre={inst.institucion_nombre}
              instTipo={inst.institucion_tipo}
              ciudad={inst.institucion_ciudad}
              estado={inst.institucion_estado}
              onPersonasGuardadas={(n) => {
                if (n > 0) setPaso(PASO_CONFIRMACION);
              }}
            />

            {/* OPCIÓN C: Copiar y pegar texto */}
            <PegadorTexto
              es={es}
              instId={instId}
              instNombre={inst.institucion_nombre}
              onGuardado={(n) => {
                if (n > 0) setPaso(PASO_CONFIRMACION);
              }}
            />

            {/* Prompt IA */}
            <PromptCopiable es={es} />

            {/* Manual */}
            <FormularioManual es={es} onAgregar={agregarPersona} />

            {/* Tabla borrador */}
            {personas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1A1F2E]">
                    {es ? `📋 Lista borrador — ${personas.length} persona${personas.length !== 1 ? 's' : ''}` : `📋 Draft list — ${personas.length} person${personas.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {es ? 'Revisa y edita los datos antes de confirmar. Los teléfonos no se publicarán.' : 'Review and edit data before confirming. Phones will not be published.'}
                </p>
                <TablaPersonas personas={personas} es={es} onChange={editarPersona} onDelete={eliminarPersona} />

                <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-xl p-3">
                  <p className="text-xs text-[#7A5000] font-semibold">
                    ⚠️ {es
                      ? 'Revisa la información antes de guardar. Una vez confirmada, los datos quedarán registrados como aportados por tu institución.'
                      : 'Review the information before saving. Once confirmed, data will be recorded as submitted by your institution.'}
                  </p>
                </div>

                <button
                  onClick={confirmarYGuardar}
                  disabled={guardando || personas.length === 0}
                  className="w-full bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2"
                >
                  {guardando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {es ? `Confirmar y guardar ${personas.length} persona${personas.length !== 1 ? 's' : ''}` : `Confirm and save ${personas.length} person${personas.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}