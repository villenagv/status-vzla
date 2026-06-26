import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import ContadoresBar from '@/components/svzla/ContadoresBar';

const cards = [
  {
    key: 'red',
    icon: '🚨',
    titleKey: 'card1_title',
    descKey: 'card1_desc',
    to: '/reportar',
    bg: 'bg-[#FDF1F0]',
    border: 'border-[#E8B4B0]',
    iconBg: 'bg-[#F4D5DD]',
    badge: 'URGENTE',
    badgeColor: 'bg-[#B83A52] text-white',
  },
  {
    key: 'search',
    icon: '🔎',
    titleKey: 'card_buscar_title',
    descKey: 'card_buscar_desc',
    to: '/buscar-persona',
    bg: 'bg-[#FFF8EE]',
    border: 'border-[#E6C195]',
    iconBg: 'bg-[#FFF0D0]',
    badge: null,
  },
  {
    key: 'found',
    icon: '🙋',
    titleKey: 'card_encontrado_title',
    descKey: 'card_encontrado_desc',
    to: '/reportar-encontrado',
    bg: 'bg-[#F0FAF4]',
    border: 'border-[#A8D8BC]',
    iconBg: 'bg-green-100',
    badge: null,
  },
  {
    key: 'blue',
    icon: '🗺️',
    titleKey: 'card2_title',
    descKey: 'card2_desc',
    to: '/consultar',
    bg: 'bg-[#F0F4FD]',
    border: 'border-[#B0C4E8]',
    iconBg: 'bg-blue-100',
    badge: null,
  },
  {
    key: 'green',
    icon: '🏥',
    titleKey: 'card3_title',
    descKey: 'card3_desc',
    to: '/institucional',
    bg: 'bg-[#F0FAF4]',
    border: 'border-[#A8D8BC]',
    iconBg: 'bg-green-100',
    badge: null,
  },
];

export default function Entrada() {
  const { t } = useLang();
  const { lowBw } = useLowBw();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F8]">
      <TopBar />
      {!lowBw && <ContadoresBar />}

      <main className="flex-1 flex flex-col justify-center px-4 py-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
            STATUSVZLA.com
          </p>
          <h1 className="text-2xl font-bold text-[#1A1F2E] leading-tight">
            {t.lang_toggle === 'English' ? '¿Qué necesitas hacer?' : 'What do you need to do?'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.lang_toggle === 'English'
              ? 'Selecciona una opción para continuar'
              : 'Select an option to continue'}
          </p>
        </div>

        {/* Entry Cards */}
        <div className="flex flex-col gap-3">
          {cards.map(card => (
            <Link
              key={card.key}
              to={card.to}
              className={`flex items-center gap-4 rounded-xl border px-5 py-5 cursor-pointer active:scale-[0.98] transition-transform ${card.bg} ${card.border} no-underline`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${card.iconBg}`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[#1A1F2E] text-base leading-tight">{t[card.titleKey]}</span>
                  {card.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-snug">{t[card.descKey]}</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
          {t.no_reg}
        </p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <Link to="/login" className="text-[11px] text-gray-400 hover:text-[#1A1F2E] underline underline-offset-2">
            {t.lang_toggle === 'English' ? 'Iniciar sesión / Registrarse' : 'Log in / Register'}
          </Link>
          <span className="text-gray-300">·</span>
          <Link to="/portal-institucional" className="text-[11px] text-gray-400 hover:text-green-700 underline underline-offset-2">
            {t.lang_toggle === 'English' ? 'Portal Institucional' : 'Institutional Portal'}
          </Link>
        </div>
      </main>
    </div>
  );
}