import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Camera, CheckCircle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

export default function SubirFotoPerfil() {
  const { lang } = useLang();
  const es = lang === 'es';
  const t = (a, b) => es ? a : b;
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const [cargando, setCargando] = useState(true);
  const [info, setInfo] = useState(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setCargando(false); return; }
    base44.functions.invoke('gestionarFotoPerfil', { accion: 'validar_token', token })
      .then(r => setInfo(r.data))
      .catch(() => setInfo({ valido: false }))
      .finally(() => setCargando(false));
  }, [token]);

  const subirFoto = async (file) => {
    setSubiendo(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFotoUrl(file_url);
    } catch {
      setError(t('Error al subir la foto. Intenta de nuevo.', 'Error uploading photo. Try again.'));
    }
    setSubiendo(false);
  };

  const confirmar = async () => {
    if (!fotoUrl) return;
    setGuardando(true);
    setError('');
    try {
      await base44.functions.invoke('gestionarFotoPerfil', { accion: 'subir_foto', token, foto_url: fotoUrl });
      setListo(true);
    } catch {
      setError(t('No se pudo guardar tu foto. Intenta de nuevo.', 'Could not save your photo. Try again.'));
    }
    setGuardando(false);
  };

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
            {t('Este enlace de foto de perfil no es válido, expiró o ya fue usado. Si necesitas ayuda, contáctanos.',
               'This profile photo link is not valid, expired, or was already used. If you need help, contact us.')}
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
          <h1 className="text-xl font-bold text-gray-900">{t('¡Foto guardada!', 'Photo saved!')}</h1>
          <p className="text-sm text-gray-500">
            {t('Gracias, tu foto de perfil fue actualizada correctamente.', 'Thanks, your profile photo was updated successfully.')}
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
          <div className="text-4xl mb-2">📷</div>
          <h1 className="text-xl font-black text-white mb-1">{t('Sube tu foto de perfil', 'Upload your profile photo')}</h1>
          <p className="text-sm text-gray-400">{t('Hola', 'Hi')} {info.nombre}, {t('necesitamos una foto tuya para tu perfil de equipo.', 'we need a photo of you for your team profile.')}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          {fotoUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img src={fotoUrl} alt="preview" className="w-32 h-32 object-cover rounded-full border-4 border-green-200" />
              <button onClick={() => setFotoUrl('')} className="text-xs text-red-500 underline">{t('Cambiar foto', 'Change photo')}</button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl py-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              {subiendo ? <Loader2 size={28} className="animate-spin text-gray-400" /> : <Camera size={28} className="text-gray-400" />}
              <span className="text-sm font-semibold text-gray-700">
                {subiendo ? t('Subiendo...', 'Uploading...') : t('Tomar o subir foto', 'Take or upload photo')}
              </span>
              <span className="text-xs text-gray-400">{t('JPG o PNG · máx. 5MB', 'JPG or PNG · max 5MB')}</span>
              <input type="file" accept="image/*" capture="user" className="hidden"
                onChange={e => { if (e.target.files?.[0]) subirFoto(e.target.files[0]); e.target.value = ''; }} disabled={subiendo} />
            </label>
          )}

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}

          <button onClick={confirmar} disabled={!fotoUrl || guardando}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
            {guardando ? <Loader2 size={16} className="animate-spin" /> : '✅'}
            {guardando ? t('Guardando...', 'Saving...') : t('Confirmar foto', 'Confirm photo')}
          </button>

          <p className="text-center text-xs text-gray-400">
            🔒 {t('Esta foto se usa solo para identificar al equipo internamente.', 'This photo is used only to internally identify the team.')}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}