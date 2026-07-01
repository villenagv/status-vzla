import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, FileUp, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const TIPOS = [
  { val: 'planilla_funvisis', es: 'Planilla FUNVISIS (evaluación de daños)', en: 'FUNVISIS form (damage assessment)' },
  { val: 'informe_tecnico',   es: 'Informe técnico',                        en: 'Technical report' },
  { val: 'foto_inspeccion',   es: 'Foto de inspección',                     en: 'Inspection photo' },
  { val: 'otro',              es: 'Otro documento',                        en: 'Other document' },
];

export default function RecursosTecnicos() {
  const { lang } = useLang();
  const es = lang === 'es';
  const t = (esStr, enStr) => es ? esStr : enStr;

  const [tipoDocumento, setTipoDocumento] = useState('planilla_funvisis');
  const [nombreLugar, setNombreLugar] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estadoRegion, setEstadoRegion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const subirArchivo = async (f) => {
    setError('');
    setSubiendoArchivo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setFileUrl(file_url);
      setFile(f);
    } catch {
      setError(t('Error al subir el archivo. Intenta de nuevo.', 'Error uploading the file. Try again.'));
    }
    setSubiendoArchivo(false);
  };

  const enviar = async () => {
    if (!fileUrl || !ciudad.trim()) return;
    setError('');
    setEnviando(true);
    try {
      await base44.entities.DocumentoTecnico.create({
        tipo_documento: tipoDocumento,
        nombre_lugar: nombreLugar,
        ciudad,
        estado_region: estadoRegion,
        descripcion,
        file_url: fileUrl,
        subido_por_nombre: nombre,
        subido_por_contacto: contacto,
      });
      setEnviado(true);
    } catch {
      setError(t('No se pudo enviar. Intenta de nuevo.', 'Could not submit. Try again.'));
    }
    setEnviando(false);
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-14 max-w-sm mx-auto">
          <CheckCircle size={48} className="text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">{t('¡Documento recibido!', 'Document received!')}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('Gracias por tu aporte. El documento será revisado por el equipo antes de vincularse a un edificio o publicarse.',
               'Thanks for your contribution. The document will be reviewed by the team before being linked to a building or published.')}
          </p>
          <Link to="/recursos-tecnicos" className="text-sm text-blue-600 underline"
            onClick={() => { setEnviado(false); setFileUrl(''); setFile(null); setNombreLugar(''); setDescripcion(''); }}>
            {t('Subir otro documento', 'Upload another document')}
          </Link>
          <Link to="/" className="text-sm text-gray-400 underline">{t('← Volver al inicio', '← Back to home')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-md mx-auto w-full px-4 py-6 flex-1">

        {/* Header */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-5 text-center">
          <div className="text-4xl mb-2">📄</div>
          <h1 className="text-xl font-black text-white mb-1">{t('Recursos técnicos', 'Technical resources')}</h1>
          <p className="text-sm text-gray-400">
            {t('Sube planillas de evaluación de daños, informes técnicos o fotos de inspección. No necesitas cuenta ni iniciar sesión.',
               'Upload damage assessment forms, technical reports, or inspection photos. No account or login needed.')}
          </p>
        </div>

        {/* Explicación / uso */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-blue-800 mb-1">{t('¿Para qué sirve esto?', 'What is this for?')}</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            {t('Usa este formulario si tienes una planilla de evaluación de daños (por ejemplo, del formato FUNVISIS), un informe técnico o fotos de una inspección de un edificio. El equipo revisará el documento antes de publicarlo.',
               'Use this form if you have a damage assessment form (for example, in the FUNVISIS format), a technical report, or inspection photos of a building. The team will review the document before publishing it.')}
          </p>
        </div>

        {/* Advertencia de seguridad */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
          <ShieldAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            {t('No entres a estructuras dañadas para tomar fotos o datos. Espera a Protección Civil, Bomberos o personal capacitado.',
               'Do not enter damaged structures to take photos or data. Wait for Civil Protection, firefighters, or trained personnel.')}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">

          {/* Tipo de documento */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              {t('Tipo de documento *', 'Document type *')}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TIPOS.map(op => (
                <button key={op.val} onClick={() => setTipoDocumento(op.val)}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 text-xs font-semibold cursor-pointer transition-colors ${tipoDocumento === op.val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}>
                  {es ? op.es : op.en}
                </button>
              ))}
            </div>
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('Archivo (PDF o imagen) *', 'File (PDF or image) *')}
            </label>
            {fileUrl ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <FileUp size={18} className="text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 truncate">✅ {file?.name || t('Archivo subido', 'File uploaded')}</p>
                  <button onClick={() => { setFileUrl(''); setFile(null); }} className="text-xs text-red-500 underline mt-0.5">
                    {t('Quitar', 'Remove')}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                {subiendoArchivo ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <FileUp size={18} className="text-gray-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {subiendoArchivo ? t('Subiendo...', 'Uploading...') : t('Subir documento', 'Upload document')}
                  </p>
                  <p className="text-xs text-gray-400">{t('PDF, JPG o PNG · máx. 10MB', 'PDF, JPG or PNG · max 10MB')}</p>
                </div>
                <input type="file" accept="application/pdf,image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) subirArchivo(e.target.files[0]); e.target.value = ''; }}
                  disabled={subiendoArchivo} />
              </label>
            )}
          </div>

          {/* Lugar */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('Nombre o dirección del edificio (opcional)', 'Building name or address (optional)')}
            </label>
            <input value={nombreLugar} onChange={e => setNombreLugar(e.target.value)}
              placeholder={t('Ej: Edificio Los Palos Grandes, Torre B', 'E.g. Los Palos Grandes Building, Tower B')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('Ciudad *', 'City *')}
              </label>
              <input value={ciudad} onChange={e => setCiudad(e.target.value)}
                placeholder={t('Ej: Caracas', 'E.g. Caracas')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('Estado (opcional)', 'State (optional)')}
              </label>
              <input value={estadoRegion} onChange={e => setEstadoRegion(e.target.value)}
                placeholder={t('Ej: Miranda', 'E.g. Miranda')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('Descripción breve (opcional)', 'Brief description (optional)')}
            </label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
              placeholder={t('Ej: Evaluación externa, edificio con etiqueta amarilla...', 'E.g. External assessment, building with yellow tag...')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('Tu nombre (opcional)', 'Your name (optional)')}
              </label>
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder={t('Ej: Juan Pérez', 'E.g. John Smith')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('Contacto (opcional)', 'Contact (optional)')}
              </label>
              <input value={contacto} onChange={e => setContacto(e.target.value)}
                placeholder={t('Tel. o email', 'Phone or email')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              🔒 {t('Tu nombre y contacto son privados. Solo el equipo revisor los verá.',
                     'Your name and contact are private. Only the review team will see them.')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={enviar}
            disabled={enviando || subiendoArchivo || !fileUrl || !ciudad.trim()}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : '📤'}
            {enviando ? t('Enviando...', 'Sending...') : t('Enviar documento', 'Submit document')}
          </button>

          <p className="text-center text-xs text-gray-400">
            {t('Un moderador revisará el documento antes de vincularlo a un edificio o publicarlo.',
               'A moderator will review the document before linking it to a building or publishing it.')}
          </p>
        </div>

        <Link to="/" className="block text-center text-xs text-gray-400 mt-5 hover:text-gray-600">
          {t('← Volver al inicio', '← Back to home')}
        </Link>
      </div>
      <Footer />
    </div>
  );
}