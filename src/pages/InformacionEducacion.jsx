import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import InfografiaDanos from '@/components/informacion/InfografiaDanos';

const TARJETAS = [
  {
    emoji: '⚙️', to: '/como-funciona', color: '#1A5276', bg: '#EBF5FB',
    es: 'Cómo funciona CRIS', en: 'How CRIS works',
    desc_es: 'Qué es la plataforma, sus principios y qué puedes hacer en cada módulo.',
    desc_en: 'What the platform is, its principles, and what you can do in each module.',
  },
  {
    emoji: '📖', to: '/guia-plataforma', color: '#6C3483', bg: '#F3E8FD',
    es: 'Guía de uso paso a paso', en: 'Step-by-step user guide',
    desc_es: 'Instrucciones detalladas para buscar personas, reportar edificios y más.',
    desc_en: 'Detailed instructions to search for people, report buildings, and more.',
  },
  {
    emoji: '🏗️', to: '/guia-edificios', color: '#C0392B', bg: '#FDEDEC',
    es: 'Edificios dañados: qué hacer', en: 'Damaged buildings: what to do',
    desc_es: 'Semáforo de riesgo, señales de peligro y cuándo NO entrar a una estructura.',
    desc_en: 'Risk traffic light, danger signs, and when NOT to enter a structure.',
  },
  {
    emoji: '📄', to: '/recursos-tecnicos', color: '#1A7A4A', bg: '#E6F5ED',
    es: 'Recursos técnicos', en: 'Technical resources',
    desc_es: 'Sube planillas de evaluación de daños, informes técnicos o fotos de inspección.',
    desc_en: 'Upload damage assessment forms, technical reports, or inspection photos.',
  },
  {
    emoji: '📍', to: '/sobre', color: '#4B5563', bg: '#F9FAFB',
    es: 'Sobre Status Vzla', en: 'About Status Vzla',
    desc_es: 'Quiénes somos, para quién es CRIS y cómo se financia el proyecto.',
    desc_en: 'Who we are, who CRIS is for, and how the project is funded.',
  },
];

export default function InformacionEducacion() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr) => es ? esStr : enStr;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <main className="max-w-lg mx-auto w-full px-4 py-5 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {t('Inicio', 'Home')}
        </Link>

        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            {t('Aprende a usar la plataforma', 'Learn how to use the platform')}
          </p>
          <h1 className="text-xl font-black text-gray-900 leading-tight mb-2">
            📚 {t('Información y Educación', 'Information & Education')}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t(
              'Guías, explicaciones y recursos para entender cómo funciona CRIS y qué hacer en una emergencia.',
              'Guides, explanations, and resources to understand how CRIS works and what to do in an emergency.'
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {TARJETAS.map((c, i) => (
            <Link key={i} to={c.to} className="flex items-center gap-3 rounded-2xl p-4 no-underline border" style={{ background: c.bg, borderColor: c.color + '30' }}>
              <span className="text-3xl flex-shrink-0">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black" style={{ color: c.color }}>{es ? c.es : c.en}</p>
                <p className="text-xs text-gray-600 leading-snug mt-0.5">{es ? c.desc_es : c.desc_en}</p>
              </div>
              <ChevronRight size={18} style={{ color: c.color }} className="flex-shrink-0" />
            </Link>
          ))}
        </div>

        <div className="mt-5">
          <InfografiaDanos es={es} />
        </div>

        <div className="mt-1 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-2">
            ⚠️ {t('Aviso de seguridad', 'Safety notice')}
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            {t(
              'Nunca envíes dinero a cambio de información. CRIS no autoriza pagos, rescates privados ni intermediarios. Si alguien pide dinero, es una estafa.',
              'Never send money in exchange for information. CRIS does not authorize payments, private rescues, or intermediaries. If someone asks for money, it is a scam.'
            )}
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/contactanos" className="text-sm text-blue-600 underline no-underline">
            {t('¿Tienes dudas? Contáctanos →', 'Have questions? Contact us →')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}