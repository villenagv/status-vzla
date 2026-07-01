import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, FileUp, CheckCircle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const TIPO_LABEL = {
  titulo: { es: 'Título profesional', en: 'Professional degree' },
  carnet: { es: 'Carnet de colegiado', en: 'Professional license card' },
  certificacion: { es: 'Certificación profesional', en: 'Professional certification' },
  identificacion: { es: 'Identificación', en: 'ID document' },
  otro: { es: 'Documento adicional', en: 'Additional document' },
};

export default function SubirCredencial() {
  const { lang } = useLang();
  const es = lang === 'es';
  const t = (a, b) => es ? a : b;
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const [cargando, setCargando] = useState(true);
  const [info, setInfo] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setCargando(false); return; }
    base44.functions.invoke('gestionarCredencialAdicional', { accion: 'validar_token', token })
      .then(r => setInfo(r.data))
      .catch(() => setInfo({ valido: false }))
      .finally(() => setCargando(false));
  }, [token]);

  const subirArchivo = async (file) => {
    setSubiendo(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
    } catch {
      setError(t('Error al subir el archivo. Intenta de nuevo.', 'Error uploading file. Try again.'));
    }
    setSubiendo(false);
  };

  const confirmar = async () => {
    if (!fileUrl) return;
    setGuardando(true);
    setError('');
    try {
      await base44.functions.invoke('gestionarCredencialAdicional', { accion: 'subir_credencial', token, file_url: fileUrl });
      setListo(true);
    } catch {
      setError(t('No se pudo guardar tu documento. Intenta de nuevo.', 'Could not save your document. Try again.'));
    }
    setGuardando(false);
  };

  const tipoLabel = info?.tipo_documento ? (TIPO_LABEL[info.tipo_documento] || TIPO_LABEL.otro) : null;

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
    </div>
  );

  if (!token || !info?.valido) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12 max-w-sm mx-auto">
          <XCircle size={48} className="text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">{t('Enlace inválido o ya usado', 'Invalid or already used link')}</h1>
          <p className="text-sm text-gray-500">
            {t('Este enlace no es válido, expiró o ya fue usado. Si necesitas ayuda, contáctanos.',
               'This link is not valid, expired, or was already used. If you need help, contact us.')}
          </p>
          <Link to="/contactanos" className="text-sm text-blue-600 underline">{t('Contáctanos', 'Contact us')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (listo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12 max-w-sm mx-auto">
          <CheckCircle size={48} className="text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">{t('¡Documento guardado!', 'Document saved!')}</h1>
          <p className="text-sm text-gray-500">
            {t('Gracias, tu documento fue recibido correctamente.', 'Thanks, your document was received successfully.')}
          </p>
          <Link to="/" className="text-sm text-gray-400 underline">{t('← Volver al inicio', '← Back to home')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-sm mx-auto w-full px-4 py-8 flex-1">
        <div className="bg-gray-900 rounded-2xl p-5 mb-5 text-center">
          <div className="text-4xl mb-2">📄</div>
          <h1 className="text-xl font-black text-white mb-1">{t('Sube tu documento', 'Upload your document')}</h1>
          <p className="text-sm text-gray-400">
            {t('Hola', 'Hi')} {info.nombre}, {t('necesitamos que subas:', 'we need you to upload:')} <strong className="text-white">{tipoLabel ? (es ? tipoLabel.es : tipoLabel.en) : ''}</strong>
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          {fileUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle size={28} className="text-green-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-green-700">{t('Archivo listo para enviar', 'File ready to submit')}</p>
              </div>
              <button onClick={() => setFileUrl('')} className="text-xs text-red-500 underline">{t('Cambiar archivo', 'Change file')}</button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl py-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              {subiendo ? <Loader2 size={28} className="animate-spin text-gray-400" /> : <FileUp size={28} className="text-gray-400" />}
              <span className="text-sm font-semibold text-gray-700">
                {subiendo ? t('Subiendo...', 'Uploading...') : t('Subir archivo', 'Upload file')}
              </span>
              <span className="text-xs text-gray-400">{t('Imagen o PDF · máx. 10MB', 'Image or PDF · max 10MB')}</span>
              <input type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => { if (e.target.files?.[0]) subirArchivo(e.target.files[0]); e.target.value = ''; }} disabled={subiendo} />
            </label>
          )}

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}

          <button onClick={confirmar} disabled={!fileUrl || guardando}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
            {guardando ? <Loader2 size={16} className="animate-spin" /> : '✅'}
            {guardando ? t('Guardando...', 'Saving...') : t('Confirmar envío', 'Confirm submission')}
          </button>

          <p className="text-center text-xs text-gray-400">
            🔒 {t('Este documento se usa solo para validar tu perfil profesional internamente.', 'This document is used only to internally validate your professional profile.')}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}