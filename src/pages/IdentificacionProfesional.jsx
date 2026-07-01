import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, HardHat, Heart, CheckCircle, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import TipoApoyoSelector from '@/components/voluntario/TipoApoyoSelector';
import DocumentosValidacion from '@/components/voluntario/DocumentosValidacion';

const DISPONIBILIDAD_OPTS = [
  { val: 'tiempo_completo', es: 'Tiempo completo', en: 'Full time' },
  { val: 'medio_tiempo',    es: 'Medio tiempo',     en: 'Part time' },
  { val: 'fines_semana',    es: 'Fines de semana',  en: 'Weekends' },
  { val: 'bajo_demanda',    es: 'Bajo demanda',     en: 'On demand' },
];

const PERFILES = [
  {
    val: 'voluntario',
    emoji: '🤝',
    color: '#0F766E',
    bg: 'rgba(15,118,110,0.10)',
    border: 'rgba(15,118,110,0.40)',
    es: { titulo: 'Voluntario/a', desc: 'Apoyo humanitario, carga de datos, actualización de información y coordinación de personas.' },
    en: { titulo: 'Volunteer', desc: 'Humanitarian support, data upload, information updates and people coordination.' },
  },
  {
    val: 'ingeniero',
    emoji: '⚙️',
    color: '#1D4ED8',
    bg: 'rgba(29,78,216,0.10)',
    border: 'rgba(29,78,216,0.40)',
    es: { titulo: 'Ingeniero/a Civil', desc: 'Evaluación de daños estructurales. Podrás marcar edificios como seguros o inseguros.' },
    en: { titulo: 'Civil Engineer', desc: 'Structural damage assessment. You can mark buildings as safe or unsafe.' },
  },
  {
    val: 'arquitecto',
    emoji: '📐',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    border: 'rgba(124,58,237,0.40)',
    es: { titulo: 'Arquitecto/a', desc: 'Evaluación de daños en estructuras y edificios. Acceso a tareas de evaluación.' },
    en: { titulo: 'Architect', desc: 'Building and structural damage assessment. Access to evaluation tasks.' },
  },
];

export default function IdentificacionProfesional() {
  const { lang } = useLang();
  const es = lang === 'es';
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tipoPerfil, setTipoPerfil] = useState('');
  const [profesion, setProfesion] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [numeroColegio, setNumeroColegio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [zonaApoyo, setZonaApoyo] = useState('');
  const [disponibilidad, setDisponibilidad] = useState('');
  const [tipoApoyo, setTipoApoyo] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);

  const t = (a, b) => es ? a : b;

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u) { window.location.href = '/login'; return; }
        setUser(u);
        // Verificar si ya completó el perfil
        return base44.entities.PerfilProfesional.filter({ user_id: u.id })
          .then(perfiles => {
            if (perfiles?.length > 0 && perfiles[0].completado) {
              navigate('/portal-voluntario');
            }
          }).catch(() => {});
      })
      .catch(() => { window.location.href = '/login'; })
      .finally(() => setCargando(false));
  }, []);

  const subirFotoPerfil = async (file) => {
    setSubiendoFoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFotoPerfilUrl(file_url);
    } catch {}
    setSubiendoFoto(false);
  };

  const guardar = async () => {
    if (!tipoPerfil || !fotoPerfilUrl) return;
    setGuardando(true);
    try {
      // Verificar si ya existe un perfil sin completar
      const existentes = await base44.entities.PerfilProfesional.filter({ user_id: user.id }).catch(() => []);
      const perfilData = {
        user_id: user.id,
        user_email: user.email,
        user_nombre: user.full_name || '',
        tipo_perfil: tipoPerfil,
        profesion,
        especialidad,
        institucion,
        numero_colegio: numeroColegio,
        telefono_contacto: telefono,
        zona_apoyo: zonaApoyo,
        disponibilidad,
        tipo_apoyo: tipoApoyo,
        documentos_validacion: documentos,
        foto_perfil_url: fotoPerfilUrl,
        estado_aprobacion: ['ingeniero', 'arquitecto'].includes(tipoPerfil) ? 'pendiente' : 'aprobado',
        completado: true,
      };
      if (existentes?.length > 0) {
        await base44.entities.PerfilProfesional.update(existentes[0].id, perfilData);
      } else {
        await base44.entities.PerfilProfesional.create(perfilData);
      }
      setListo(true);
      setTimeout(() => navigate('/portal-voluntario'), 1800);
    } catch {}
    setGuardando(false);
  };

  if (cargando) return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={28} />
    </div>
  );

  if (listo) return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-6 text-center gap-4">
      <CheckCircle size={56} className="text-green-500" />
      <h2 className="text-xl font-black text-white">{t('¡Perfil guardado!', 'Profile saved!')}</h2>
      <p className="text-sm text-gray-400">{t('Redirigiendo al portal...', 'Redirecting to portal...')}</p>
    </div>
  );

  const perfilSeleccionado = PERFILES.find(p => p.val === tipoPerfil);

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      <TopBar />
      <div className="max-w-md mx-auto w-full px-4 py-8 flex-1">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-black text-white mb-2">
            {t('¿Cómo participas?', 'How are you participating?')}
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            {t('Cuéntanos tu rol para darte el acceso correcto y las herramientas que necesitas.',
               'Tell us your role so we can give you the right access and tools.')}
          </p>
        </div>

        {/* Opciones de perfil */}
        <div className="space-y-3 mb-6">
          {PERFILES.map(p => {
            const txt = es ? p.es : p.en;
            const activo = tipoPerfil === p.val;
            return (
              <button
                key={p.val}
                onClick={() => setTipoPerfil(p.val)}
                style={{
                  background: activo ? p.bg : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${activo ? p.border : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  padding: '16px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms',
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: activo ? p.color : '#fff', margin: 0 }}>
                    {txt.titulo}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {txt.desc}
                  </p>
                </div>
                {activo && (
                  <CheckCircle size={20} style={{ color: p.color, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Campos adicionales para ingeniero/arquitecto */}
        {(tipoPerfil === 'ingeniero' || tipoPerfil === 'arquitecto') && (
          <div className="space-y-3 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t('Datos profesionales (opcionales)', 'Professional data (optional)')}
            </p>
            <input
              value={especialidad}
              onChange={e => setEspecialidad(e.target.value)}
              placeholder={t('Especialidad (Ej: Estructuras, Geotecnia...)', 'Specialty (E.g.: Structures, Geotechnics...)')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', outline: 'none' }}
            />
            <input
              value={numeroColegio}
              onChange={e => setNumeroColegio(e.target.value)}
              placeholder={t('Nº de colegio / cédula profesional (opcional)', 'Professional ID / registration number (optional)')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', outline: 'none' }}
            />
            <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: '#FCD34D', margin: 0, lineHeight: 1.5 }}>
                ⏳ {t('Tu acceso como especialista será revisado por el administrador antes de activarse (24–48h).',
                       'Your specialist access will be reviewed by the admin before activation (24–48h).')}
              </p>
            </div>
          </div>
        )}

        {/* Datos generales para todos los perfiles */}
        {tipoPerfil && (
          <div className="space-y-3 mb-6">
            <input
              value={profesion}
              onChange={e => setProfesion(e.target.value)}
              placeholder={t('Profesión u ocupación (opcional)', 'Profession or occupation (optional)')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', outline: 'none' }}
            />
            <input
              value={institucion}
              onChange={e => setInstitucion(e.target.value)}
              placeholder={t('Organización o institución (opcional)', 'Organization or institution (optional)')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', outline: 'none' }}
            />
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder={t('Teléfono / WhatsApp (opcional)', 'Phone / WhatsApp (optional)')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', outline: 'none' }}
            />
            <input
              value={zonaApoyo}
              onChange={e => setZonaApoyo(e.target.value)}
              placeholder={t('Estado o zona donde puedes apoyar (opcional)', 'State or area where you can help (optional)')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', outline: 'none' }}
            />

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                {t('Disponibilidad (opcional)', 'Availability (optional)')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DISPONIBILIDAD_OPTS.map(op => {
                  const activo = disponibilidad === op.val;
                  return (
                    <button key={op.val} type="button" onClick={() => setDisponibilidad(activo ? '' : op.val)}
                      style={{
                        padding: '9px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        border: `1.5px solid ${activo ? '#4A9EDB' : 'rgba(255,255,255,0.12)'}`,
                        background: activo ? 'rgba(74,158,219,0.14)' : 'rgba(255,255,255,0.06)',
                        color: activo ? '#93C5FD' : '#fff', fontSize: 12, fontWeight: 600,
                      }}>
                      {es ? op.es : op.en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <TipoApoyoSelector value={tipoApoyo} onChange={setTipoApoyo} es={es} />
            </div>

            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <DocumentosValidacion value={documentos} onChange={setDocumentos} es={es} />
            </div>

            {/* Foto de perfil — obligatoria */}
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('Foto de perfil (obligatoria)', 'Profile photo (required)')} <span style={{ color: '#F87171' }}>*</span>
              </p>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                {t('Necesaria para identificar a inspectores, voluntarios y arquitectos del equipo.',
                   'Needed to identify inspectors, volunteers and architects on the team.')}
              </p>
              {fotoPerfilUrl ? (
                <div className="flex items-center gap-3">
                  <img src={fotoPerfilUrl} alt="perfil" className="w-16 h-16 object-cover rounded-full border-2 border-green-400" />
                  <button type="button" onClick={() => setFotoPerfilUrl('')} className="text-xs text-red-400 underline">
                    {t('Cambiar', 'Change')}
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px dashed rgba(255,255,255,0.20)', borderRadius: 10, padding: '12px', cursor: 'pointer' }}>
                  {subiendoFoto ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Camera size={18} className="text-gray-400" />}
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    {subiendoFoto ? t('Subiendo...', 'Uploading...') : t('Subir foto de perfil', 'Upload profile photo')}
                  </span>
                  <input type="file" accept="image/*" className="hidden" disabled={subiendoFoto}
                    onChange={e => { if (e.target.files?.[0]) subirFotoPerfil(e.target.files[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Botón guardar */}
        <button
          onClick={guardar}
          disabled={!tipoPerfil || !fotoPerfilUrl || guardando}
          style={{
            width: '100%',
            background: perfilSeleccionado ? perfilSeleccionado.color : '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '16px',
            fontSize: 15,
            fontWeight: 800,
            cursor: tipoPerfil && fotoPerfilUrl ? 'pointer' : 'not-allowed',
            opacity: !tipoPerfil || !fotoPerfilUrl || guardando ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {guardando ? <Loader2 size={18} className="animate-spin" /> : '✅'}
          {guardando
            ? t('Guardando...', 'Saving...')
            : t('Confirmar y acceder al portal', 'Confirm and access portal')}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed">
          {t('Podrás actualizar tu perfil en cualquier momento desde el portal.',
             'You can update your profile at any time from the portal.')}
        </p>
      </div>
    </div>
  );
}