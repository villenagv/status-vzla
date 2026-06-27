import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Upload, CheckCircle, Clock, XCircle, ShieldCheck, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

export default function Voluntario() {
  const { lang } = useLang();
  const es = lang === 'es';
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const tokenUrl = params.get('token') || '';

  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [solicitud, setSolicitud] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [tokenCargando, setTokenCargando] = useState(false);

  // Form state
  const [institucion, setInstitucion] = useState('');
  const [fotoId, setFotoId] = useState(null);
  const [fotoIdUrl, setFotoIdUrl] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const t = (esStr, enStr) => es ? esStr : enStr;

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); return u; })
      .catch(() => { window.location.href = `/login?next=/voluntario${tokenUrl ? `?token=${tokenUrl}` : ''}`; })
      .finally(() => setCargando(false));
  }, []);

  // Validar token si viene en URL
  useEffect(() => {
    if (!tokenUrl) return;
    setTokenCargando(true);
    base44.functions.invoke('gestionarVoluntario', { accion: 'validar_token', token: tokenUrl })
      .then(r => setTokenInfo(r.data))
      .catch(() => setTokenInfo({ valido: false, error: 'Error al validar' }))
      .finally(() => setTokenCargando(false));
  }, [tokenUrl]);

  // Verificar si ya tiene solicitud
  useEffect(() => {
    if (!user) return;
    base44.entities.SolicitudVoluntario.filter({ user_id: user.id })
      .then(sols => { if (sols?.length > 0) setSolicitud(sols[0]); })
      .catch(() => {});
  }, [user]);

  const subirFotoId = async (file) => {
    setSubiendoFoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFotoIdUrl(file_url);
    } catch {
      setError(t('Error al subir foto. Intenta de nuevo.', 'Error uploading photo. Try again.'));
    }
    setSubiendoFoto(false);
  };

  const enviarSolicitud = async () => {
    setError('');
    setEnviando(true);
    try {
      const result = await base44.functions.invoke('gestionarVoluntario', {
        accion: 'registrar_solicitud',
        token_invitacion: tokenUrl || '',
        institucion_nombre: institucion,
        foto_id_url: fotoIdUrl,
      });
      setSolicitud({ estado: result.data?.estado || 'pendiente' });
      setEnviado(true);
    } catch {
      setError(t('Error al enviar solicitud. Intenta de nuevo.', 'Error submitting request. Try again.'));
    }
    setEnviando(false);
  };

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
    </div>
  );

  // Ya tiene solicitud aprobada → redirigir al portal
  if (solicitud?.estado === 'aprobado') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12 max-w-sm mx-auto">
          <CheckCircle size={48} className="text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">{t('¡Acceso activo!', 'Access active!')}</h1>
          <p className="text-sm text-gray-500">{t('Tu cuenta de voluntario está activa. Accede al portal para comenzar.', 'Your volunteer account is active. Access the portal to get started.')}</p>
          <Link to="/portal-voluntario" className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-center no-underline">
            {t('Ir al Portal de Voluntarios →', 'Go to Volunteer Portal →')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Solicitud pendiente
  if (solicitud?.estado === 'pendiente') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12 max-w-sm mx-auto">
          <Clock size={48} className="text-amber-500" />
          <h1 className="text-xl font-bold text-gray-900">{t('Solicitud en revisión', 'Request under review')}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('Tu solicitud está siendo revisada por un administrador. Te notificaremos por email cuando sea aprobada.', 'Your request is being reviewed by an administrator. We will notify you by email when approved.')}
          </p>
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
            <p className="text-xs text-amber-700 font-semibold">{t('¿Qué pasa ahora?', 'What happens now?')}</p>
            <ul className="text-xs text-amber-600 mt-1.5 space-y-1">
              <li>✉️ {t('Recibirás un email cuando te aprueben.', 'You will receive an email when approved.')}</li>
              <li>⏱️ {t('El proceso toma 24–48 horas.', 'The process takes 24–48 hours.')}</li>
              <li>🔒 {t('Tus datos son privados y seguros.', 'Your data is private and secure.')}</li>
            </ul>
          </div>
          <Link to="/" className="text-sm text-gray-400 underline">{t('← Volver al inicio', '← Back to home')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Rechazada
  if (solicitud?.estado === 'rechazado') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12 max-w-sm mx-auto">
          <XCircle size={48} className="text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">{t('Solicitud no aprobada', 'Request not approved')}</h1>
          {solicitud.motivo_rechazo && (
            <p className="text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-xl p-3">
              {solicitud.motivo_rechazo}
            </p>
          )}
          <Link to="/contactanos" className="text-sm text-blue-600 underline">{t('Contáctanos si crees que es un error', 'Contact us if you think this is an error')}</Link>
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
          <div className="text-4xl mb-2">🤝</div>
          <h1 className="text-xl font-black text-white mb-1">{t('Portal de Voluntarios', 'Volunteer Portal')}</h1>
          <p className="text-sm text-gray-400">{t('Solicita acceso para gestionar información humanitaria.', 'Request access to manage humanitarian information.')}</p>
        </div>

        {/* Token info banner */}
        {tokenUrl && (
          <div className={`rounded-xl border p-3 mb-4 ${tokenCargando ? 'border-gray-200 bg-gray-50' : tokenInfo?.valido ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            {tokenCargando ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                {t('Verificando invitación...', 'Verifying invitation...')}
              </div>
            ) : tokenInfo?.valido ? (
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-800">{t('Invitación válida — acceso pre-aprobado', 'Valid invitation — pre-approved access')}</p>
                  <p className="text-xs text-green-600">{tokenInfo.institucion_nombre}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{t('Invitación inválida o expirada. Puedes solicitar acceso de forma normal.', 'Invalid or expired invitation. You can request access normally.')}</p>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-bold text-blue-800 mb-1">{t('¿Qué es el Portal de Voluntarios?', 'What is the Volunteer Portal?')}</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            {t('Es el área de trabajo para personas que ayudan a gestionar información de emergencia: subir listas, actualizar estados, verificar reportes y apoyar a la comunidad.',
               'It is the workspace for people who help manage emergency information: upload lists, update statuses, verify reports, and support the community.')}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">
            {t('Completa tu solicitud de acceso', 'Complete your access request')}
          </h2>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-semibold">{t('Registrado como:', 'Registered as:')}</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('Institución u organización (opcional)', 'Institution or organization (optional)')}
            </label>
            <input
              value={institucion}
              onChange={e => setInstitucion(e.target.value)}
              placeholder={t('Ej: Cruz Roja, Hospital Vargas, ONG Rescate...', 'E.g. Red Cross, Vargas Hospital, NGO Rescue...')}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400"
            />
          </div>

          {/* Foto de identificación */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              📷 {t('Foto de identificación (opcional — acelera aprobación)', 'Photo ID (optional — speeds up approval)')}
            </label>
            <p className="text-xs text-gray-400 mb-2 leading-relaxed">
              {t('Puedes subir una foto de tu cédula, carnet institucional o credencial. No es obligatorio. Tu foto no es pública.',
                 'You can upload a photo of your ID, institutional card, or credential. Not required. Your photo is not public.')}
            </p>
            {fotoIdUrl ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <img src={fotoIdUrl} alt="ID" className="w-14 h-14 object-cover rounded-lg border border-green-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700">✅ {t('Foto subida correctamente', 'Photo uploaded successfully')}</p>
                  <button onClick={() => setFotoIdUrl('')} className="text-xs text-red-500 underline mt-0.5">
                    {t('Quitar', 'Remove')}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                {subiendoFoto ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Camera size={18} className="text-gray-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {subiendoFoto ? t('Subiendo...', 'Uploading...') : t('Subir foto de ID', 'Upload ID photo')}
                  </p>
                  <p className="text-xs text-gray-400">{t('JPG o PNG · máx. 5MB', 'JPG or PNG · max 5MB')}</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) subirFotoId(e.target.files[0]); e.target.value = ''; }} disabled={subiendoFoto} />
              </label>
            )}
          </div>

          {/* Privacidad */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              🔒 {t('Tus datos son privados. No se muestran públicamente. Solo los revisa un administrador para validar tu acceso.',
                     'Your data is private. Not shown publicly. Only reviewed by an administrator to validate your access.')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={enviarSolicitud}
            disabled={enviando || subiendoFoto}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : '🤝'}
            {enviando
              ? t('Enviando solicitud...', 'Submitting request...')
              : tokenInfo?.valido
              ? t('Activar acceso institucional', 'Activate institutional access')
              : t('Enviar solicitud de voluntario', 'Submit volunteer request')}
          </button>

          <p className="text-center text-xs text-gray-400">
            {tokenInfo?.valido
              ? t('Tu acceso será activado inmediatamente por ser invitación institucional.', 'Your access will be activated immediately due to institutional invitation.')
              : t('Un administrador revisará tu solicitud en 24–48 horas.', 'An administrator will review your request within 24–48 hours.')}
          </p>
        </div>

        <Link to="/" className="block text-center text-xs text-gray-400 mt-5 hover:text-gray-600">
          {t('← Volver al inicio sin solicitar acceso', '← Back to home without requesting access')}
        </Link>
      </div>
      <Footer />
    </div>
  );
}