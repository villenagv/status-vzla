import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import ContadoresBar from '@/components/svzla/ContadoresBar';
import Footer from '@/components/svzla/Footer';

// Rol selector shown first to reduce cognitive load
const ROLES = [
  {
    key: 'ciudadano',
    icon: '🧍',
    es: 'Soy una persona afectada',
    en: 'I am an affected person',
    desc_es: 'Busco ayuda, reporto o busco a alguien',
    desc_en: 'I need help, I\'m reporting or searching',
    color: 'bg-[#FDF1F0] border-[#E8B4B0]',
  },
  {
    key: 'institucion',
    icon: '🏥',
    es: 'Soy una institución o punto de ayuda',
    en: 'I represent a help point or institution',
    desc_es: 'Refugio, hospital, comedor, donaciones...',
    desc_en: 'Shelter, hospital, food center, donations...',
    color: 'bg-[#F0FAF4] border-[#A8D8BC]',
  },
  {
    key: 'consultar',
    icon: '🗺️',
    es: 'Solo quiero consultar información',
    en: 'I just want to check information',
    desc_es: 'Ver reportes, zonas, refugios activos',
    desc_en: 'View reports, zones, active shelters',
    color: 'bg-[#F0F4FD] border-[#B0C4E8]',
  },
];

const CARDS_CIUDADANO = [
  {
    key: 'red',
    icon: '🚨',
    es: 'Hay peligro — necesito reportar',
    en: 'There is danger — I need to report',
    desc_es: 'Edificio dañado, personas atrapadas, riesgo de gas o incendio',
    desc_en: 'Damaged building, trapped people, gas or fire hazard',
    to: '/reportar',
    bg: 'bg-[#FDF1F0]', border: 'border-[#E8B4B0]', iconBg: 'bg-[#F4D5DD]',
    badge: 'URGENTE', badgeColor: 'bg-[#B83A52] text-white',
  },
  {
    key: 'search',
    icon: '🔎',
    es: 'Busco a alguien — no sé dónde está',
    en: 'I\'m looking for someone — I don\'t know where they are',
    desc_es: 'Registra a tu familiar o amigo desaparecido',
    desc_en: 'Register your missing family member or friend',
    to: '/buscar-persona',
    bg: 'bg-[#FFF8EE]', border: 'border-[#E6C195]', iconBg: 'bg-[#FFF0D0]',
    badge: null,
  },
  {
    key: 'found',
    icon: '🙋',
    es: 'Vi o encontré a alguien — quiero informar',
    en: 'I saw or found someone — I want to report',
    desc_es: 'Dilo ahora. Puede salvar a una familia entera.',
    desc_en: 'Say it now. It can save an entire family.',
    to: '/reportar-encontrado',
    bg: 'bg-[#F0FAF4]', border: 'border-[#A8D8BC]', iconBg: 'bg-green-100',
    badge: null,
  },
];

const CARDS_INSTITUCION = [
  {
    key: 'inst',
    icon: '🏥',
    es: 'Registrar mi punto de ayuda',
    en: 'Register my help point',
    desc_es: 'Refugio, hospital, comedor o centro de acopio',
    desc_en: 'Shelter, hospital, food center or supply depot',
    to: '/institucional',
    bg: 'bg-[#F0FAF4]', border: 'border-[#A8D8BC]', iconBg: 'bg-green-100',
    badge: null,
  },
  {
    key: 'portal',
    icon: '📋',
    es: 'Administrar mi punto de ayuda',
    en: 'Manage my help point',
    desc_es: 'Actualizar estado, capacidad, necesidades',
    desc_en: 'Update status, capacity, urgent needs',
    to: '/portal-institucional',
    bg: 'bg-[#F0F4FD]', border: 'border-[#B0C4E8]', iconBg: 'bg-blue-100',
    badge: null,
  },
];

const CARDS_CONSULTAR = [
  {
    key: 'consult',
    icon: '🗺️',
    es: 'Buscar reportes y zonas afectadas',
    en: 'Search reports and affected areas',
    desc_es: 'Estado de edificios, refugios activos y reportes',
    desc_en: 'Building status, active shelters and reports',
    to: '/consultar',
    bg: 'bg-[#F0F4FD]', border: 'border-[#B0C4E8]', iconBg: 'bg-blue-100',
    badge: null,
  },
];

function CardList({ cards, es }) {
  return (
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
              <span className="font-bold text-[#1A1F2E] text-base leading-tight">{es ? card.es : card.en}</span>
              {card.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${card.badgeColor}`}>
                  {card.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-snug">{es ? card.desc_es : card.desc_en}</p>
          </div>
          <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
}

export default function Entrada() {
  const { t, lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [rol, setRol] = useState(null); // null | 'ciudadano' | 'institucion' | 'consultar'

  const cards =
    rol === 'ciudadano' ? CARDS_CIUDADANO :
    rol === 'institucion' ? CARDS_INSTITUCION :
    rol === 'consultar' ? CARDS_CONSULTAR : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F8]">
      <TopBar />
      {!lowBw && <ContadoresBar />}

      <main className="flex-1 flex flex-col justify-center px-4 py-6 max-w-lg mx-auto w-full">
        {!rol ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">STATUSVZLA.com</p>
              <h1 className="text-2xl font-bold text-[#1A1F2E] leading-tight">
                {es ? '¿Quién eres?' : 'Who are you?'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {es
                  ? 'Selecciona para ver solo lo que necesitas ahora.'
                  : 'Select to see only what you need right now.'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {ROLES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRol(r.key)}
                  className={`flex items-center gap-4 rounded-xl border px-5 py-5 text-left active:scale-[0.98] transition-transform ${r.color}`}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 bg-white bg-opacity-60">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[#1A1F2E] text-base leading-tight block">{es ? r.es : r.en}</span>
                    <p className="text-sm text-gray-500 leading-snug mt-0.5">{es ? r.desc_es : r.desc_en}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <Link to="/login" className="text-[11px] text-gray-400 hover:text-[#1A1F2E] underline underline-offset-2">
                {es ? 'Iniciar sesión / Registrarse' : 'Log in / Register'}
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Back + role header */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setRol(null)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1A1F2E]"
              >
                <X size={16} /> {es ? 'Cambiar' : 'Change'}
              </button>
              <span className="text-sm font-bold text-[#1A1F2E]">
                {ROLES.find(r => r.key === rol)?.[es ? 'es' : 'en']}
              </span>
            </div>

            <div className="mb-4">
              <h1 className="text-xl font-bold text-[#1A1F2E]">
                {es ? '¿Qué necesitas hacer?' : 'What do you need to do?'}
              </h1>
            </div>

            <CardList cards={cards} es={es} />

            <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">{t.no_reg}</p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}