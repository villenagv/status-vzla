import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const ACCIONES = [
  {
    emoji: '📍',
    to: '/estoy-aqui',
    es_titulo: 'Estoy aquí',
    en_titulo: 'I am here',
    es_desc: 'Estoy vivo/a. Quiero avisar dónde estoy.',
    en_desc: "I'm alive. I want to say where I am.",
    variant: 'danger',
  },
  {
    emoji: '🌍',
    to: '/zona-afectada',
    es_titulo: 'Estoy en zona afectada',
    en_titulo: 'I am in the affected area',
    es_desc: 'Necesito ayuda o quiero reportar mi situación.',
    en_desc: 'I need help or want to report my situation.',
    variant: 'danger',
  },
  {
    emoji: '🙋',
    to: '/reportar-encontrado',
    es_titulo: 'Encontré a alguien',
    en_titulo: 'I found someone',
    es_desc: 'Vi, encontré o tengo información de una persona.',
    en_desc: 'I saw, found or have info about someone.',
    variant: 'amber',
  },
  {
    emoji: '🔎',
    to: '/buscar-persona',
    es_titulo: 'Busco a alguien',
    en_titulo: "I'm looking for someone",
    es_desc: 'Buscar por nombre, zona o crear alerta familiar.',
    en_desc: 'Search by name, zone or create a family alert.',
    variant: 'dark',
  },
  {
    emoji: '✈️',
    to: '/fuera-zona',
    es_titulo: 'Estoy fuera de la zona',
    en_titulo: "I'm outside the affected area",
    es_desc: 'Estoy a salvo y busco a alguien o dejo un mensaje.',
    en_desc: "I'm safe and I'm looking for someone or leaving a message.",
    variant: 'dark',
  },
  {
    emoji: '🏥',
    to: '/consultar',
    es_titulo: 'Refugios, hospitales y puntos de ayuda',
    en_titulo: 'Shelters, hospitals and help points',
    es_desc: 'Consultar disponibilidad y ubicación.',
    en_desc: 'Check availability and location.',
    variant: 'green',
  },
  {
    emoji: '🏛️',
    to: '/portal-institucional',
    es_titulo: 'Portal institucional',
    en_titulo: 'Institutional portal',
    es_desc: 'Registrar personas, traslados y actualizaciones.',
    en_desc: 'Register people, transfers and updates.',
    variant: 'outline',
  },
];

const COLORS = {
  danger:  'bg-[#B83A52] text-white shadow-lg active:bg-[#9e3046]',
  amber:   'bg-[#D48C2E] text-white shadow-md active:bg-[#b87724]',
  dark:    'bg-[#1A1F2E] text-white shadow-md active:bg-[#2d3549]',
  green:   'bg-[#2E7D32] text-white shadow-md active:bg-[#236027]',
  outline: 'bg-white border-2 border-[#1A1F2E] text-[#1A1F2E] shadow-sm active:bg-gray-50',
};

export default function Entrada() {
  const { lang } = useLang();
  const es = lang === 'es';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F8]">
      <TopBar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4">

        {/* Cabecera */}
        <div className="bg-[#1A1F2E] rounded-2xl px-5 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">CRIS · STATUSVZLA.com</p>
          <h1 className="text-xl font-black leading-tight mb-1">
            {es ? 'Sistema de ubicación y reunificación familiar' : 'Location and family reunification system'}
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            {es
              ? 'Reporta dónde estás, busca familiares, avisa si encontraste a alguien o consulta traslados a hospitales y refugios.'
              : 'Report where you are, find family, report if you found someone, or check transfers to hospitals and shelters.'}
          </p>
        </div>

        {/* Aviso de emergencia */}
        <div className="flex gap-3 bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl px-4 py-3">
          <Shield size={16} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] leading-relaxed font-medium">
            {es
              ? 'Si hay peligro inmediato, llama a Protección Civil, Bomberos o emergencias de tu zona. CRIS organiza información, pero no reemplaza a los organismos de rescate.'
              : 'If there is immediate danger, call Civil Protection, firefighters or emergency services in your area. CRIS organizes information but does not replace rescue services.'}
          </p>
        </div>

        {/* Botones principales */}
        <div className="space-y-2.5">
          {ACCIONES.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors no-underline ${COLORS[a.variant]}`}
            >
              <span className="text-3xl flex-shrink-0 leading-none">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base leading-tight">{es ? a.es_titulo : a.en_titulo}</p>
                <p className={`text-xs mt-0.5 leading-snug ${a.variant === 'outline' ? 'text-gray-500' : 'opacity-80'}`}>
                  {es ? a.es_desc : a.en_desc}
                </p>
              </div>
              <ArrowRight size={18} className="flex-shrink-0 opacity-60" />
            </Link>
          ))}
        </div>

        {/* Anti-extorsión */}
        <div className="bg-[#2A1A20] border border-[#6B2D3E] rounded-2xl px-4 py-3">
          <p className="text-xs text-[#F4A4B8] font-semibold leading-relaxed">
            ⚠️ {es
              ? 'Nunca envíes dinero a cambio de información. No autorizamos pagos, rescates privados ni intermediarios anónimos.'
              : "Never send money in exchange for information. We do not authorize payments, private rescue fees, or anonymous intermediaries."}
          </p>
        </div>

        {/* Acceso / login */}
        <div className="text-center pb-2">
          <Link to="/login" className="text-xs text-gray-400 underline underline-offset-2">
            {es ? 'Acceso institucional / Iniciar sesión' : 'Institutional access / Log in'}
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}