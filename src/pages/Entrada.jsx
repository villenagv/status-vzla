import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle, Search, Heart, Building2, UserPlus, ClipboardList, ArrowRight, Shield, Zap } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import ContadoresBar from '@/components/svzla/ContadoresBar';
import Footer from '@/components/svzla/Footer';
import { getContadores } from '@/lib/counters';

// Acción rápida: bloque hero de emergencia
function AccionUrgente({ es }) {
  return (
    <Link
      to="/reportar"
      className="block bg-[#B83A52] hover:bg-[#a03044] active:scale-[0.98] transition-all rounded-2xl px-5 py-5 text-white shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 text-3xl">
          🚨
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {es ? 'URGENTE' : 'URGENT'}
            </span>
          </div>
          <p className="font-bold text-base leading-tight">
            {es ? 'Hay peligro — reportar ahora' : 'There is danger — report now'}
          </p>
          <p className="text-sm text-white/75 mt-0.5">
            {es ? 'Edificio dañado, personas atrapadas, gas, incendio' : 'Damaged building, trapped people, gas, fire'}
          </p>
        </div>
        <ArrowRight size={20} className="text-white/70 flex-shrink-0" />
      </div>
    </Link>
  );
}

// Tarjeta de acción secundaria
function ActionCard({ icon: Icon, emoji, title, desc, to, badge, badgeColor, bg, border, iconBg }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 rounded-2xl border px-5 py-4 active:scale-[0.98] transition-transform no-underline ${bg} ${border}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${iconBg}`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-bold text-[#1A1F2E] text-sm leading-tight">{title}</span>
          {badge && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-snug">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
    </Link>
  );
}

// Bloque de estadísticas rápidas (sección hero)
function StatsRow({ data, es }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-white border border-[#EDEBE8] rounded-xl px-4 py-3 text-center">
        <p className="text-2xl font-black text-[#D48C2E]">{data.personas_buscando ?? 0}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{es ? 'búsquedas activas' : 'active searches'}</p>
      </div>
      <div className="bg-white border border-[#EDEBE8] rounded-xl px-4 py-3 text-center">
        <p className="text-2xl font-black text-green-600">{data.puntos_abiertos ?? 0}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{es ? 'puntos de ayuda' : 'help points open'}</p>
      </div>
      {data.criticos > 0 && (
        <div className="bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-[#B83A52]">{data.criticos}</p>
          <p className="text-[11px] text-[#B83A52] mt-0.5">{es ? 'alertas críticas' : 'critical alerts'}</p>
        </div>
      )}
      {data.personas_encontradas > 0 && (
        <div className="bg-[#F0FAF4] border border-[#A8D8BC] rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-green-700">{data.personas_encontradas}</p>
          <p className="text-[11px] text-green-700 mt-0.5">{es ? 'personas encontradas' : 'people found'}</p>
        </div>
      )}
    </div>
  );
}

export default function Entrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!lowBw) {
      getContadores().then(setStats).catch(() => {});
    }
  }, [lowBw]);

  const ACCIONES_PERSONAS = [
    {
      emoji: '🔎',
      title: es ? 'Busco a alguien — no sé dónde está' : "I'm looking for someone",
      desc: es ? 'Registra a tu familiar o amigo desaparecido' : 'Register your missing family member or friend',
      to: '/buscar-persona',
      bg: 'bg-[#FFF8EE]', border: 'border-[#E6C195]', iconBg: 'bg-yellow-50',
    },
    {
      emoji: '🙋',
      title: es ? 'Vi o encontré a alguien' : 'I saw or found someone',
      desc: es ? 'Avisa ahora — puede salvar a una familia entera' : 'Report now — it can save an entire family',
      to: '/reportar-encontrado',
      bg: 'bg-[#F0FAF4]', border: 'border-[#A8D8BC]', iconBg: 'bg-green-50',
    },
    {
      emoji: '🗺️',
      title: es ? 'Consultar zonas y reportes' : 'Search zones and reports',
      desc: es ? 'Ver estado de edificios, refugios y zonas' : 'See building status, shelters and zones',
      to: '/consultar',
      bg: 'bg-[#F0F4FD]', border: 'border-[#B0C4E8]', iconBg: 'bg-blue-50',
    },
  ];

  const ACCIONES_INSTITUCIONES = [
    {
      emoji: '🏥',
      title: es ? 'Registrar punto de ayuda' : 'Register help point',
      desc: es ? 'Refugio, hospital, comedor, centro de acopio' : 'Shelter, hospital, food center, supply depot',
      to: '/institucional',
      bg: 'bg-[#F0FAF4]', border: 'border-[#A8D8BC]', iconBg: 'bg-green-50',
    },
    {
      emoji: '📋',
      title: es ? 'Subir lista de personas encontradas' : 'Upload list of found persons',
      desc: es ? 'Registra nombres, condición y datos de traslado' : 'Register names, condition and transfer info',
      to: '/registro-institucional',
      bg: 'bg-[#FFF8EE]', border: 'border-[#E6C195]', iconBg: 'bg-yellow-50',
      badge: 'NUEVO', badgeColor: 'bg-[#D48C2E] text-white',
    },
    {
      emoji: '⚙️',
      title: es ? 'Administrar mi punto de ayuda' : 'Manage my help point',
      desc: es ? 'Actualizar estado, capacidad y necesidades' : 'Update status, capacity and urgent needs',
      to: '/portal-institucional',
      bg: 'bg-[#F0F4FD]', border: 'border-[#B0C4E8]', iconBg: 'bg-blue-50',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F8]">
      <TopBar />
      {!lowBw && <ContadoresBar />}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">

        {/* Hero */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">STATUSVZLA.com</p>
          <h1 className="text-2xl font-black text-[#1A1F2E] leading-tight">
            {es ? 'Sistema de respuesta a emergencias' : 'Emergency response system'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {es
              ? 'Busca personas, reporta daños y encuentra puntos de ayuda. Sin registro obligatorio.'
              : 'Find people, report damage and locate help points. No registration required.'}
          </p>
        </div>

        {/* Stats */}
        {!lowBw && <StatsRow data={stats} es={es} />}

        {/* Acción urgente */}
        <AccionUrgente es={es} />

        {/* Anti-extorsión compacta */}
        <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl px-4 py-3">
          <Shield size={14} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] leading-relaxed">
            {es
              ? 'Nunca envíes dinero a cambio de información. No autorizamos pagos ni rescates privados.'
              : 'Never send money in exchange for information. We do not authorize payments or private rescue fees.'}
          </p>
        </div>

        {/* Personas */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <Search size={12} /> {es ? 'Personas' : 'People'}
          </h2>
          <div className="flex flex-col gap-2.5">
            {ACCIONES_PERSONAS.map(a => <ActionCard key={a.to} {...a} />)}
          </div>
        </section>

        {/* Instituciones */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <Building2 size={12} /> {es ? 'Instituciones y puntos de ayuda' : 'Institutions and help points'}
          </h2>
          <div className="flex flex-col gap-2.5">
            {ACCIONES_INSTITUCIONES.map(a => <ActionCard key={a.to} {...a} />)}
          </div>
        </section>

        {/* Acceso */}
        <div className="bg-white border border-[#EDEBE8] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[#D48C2E]" />
            <p className="text-xs text-gray-600">
              {es ? 'Acceso inmediato — sin registro obligatorio' : 'Immediate access — no registration required'}
            </p>
          </div>
          <Link to="/login" className="text-xs font-semibold text-[#1A1F2E] underline underline-offset-2 flex-shrink-0">
            {es ? 'Iniciar sesión' : 'Log in'}
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}