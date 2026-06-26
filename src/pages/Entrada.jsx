import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, Search, Building2, ArrowRight, AlertTriangle } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import ContadoresBar from '@/components/svzla/ContadoresBar';
import Footer from '@/components/svzla/Footer';
import { getContadores } from '@/lib/counters';

function StatCard({ value, label, color }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDEBE8] px-4 py-3 text-center">
      <p className={`text-3xl font-black ${color}`}>{value ?? 0}</p>
      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function PrimaryAction({ emoji, title, desc, to, variant }) {
  const base = "block rounded-2xl px-5 py-5 active:scale-[0.98] transition-transform no-underline";
  const styles = {
    danger: "bg-[#B83A52] text-white shadow-lg",
    dark:   "bg-[#1A1F2E] text-white shadow-md",
    amber:  "bg-[#D48C2E] text-white shadow-md",
    green:  "bg-[#2E7D32] text-white shadow-md",
  };
  return (
    <Link to={to} className={`${base} ${styles[variant]}`}>
      <div className="flex items-center gap-4">
        <span className="text-4xl flex-shrink-0 leading-none">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base leading-tight">{title}</p>
          <p className="text-sm opacity-80 mt-0.5 leading-snug">{desc}</p>
        </div>
        <ArrowRight size={20} className="opacity-60 flex-shrink-0" />
      </div>
    </Link>
  );
}

function SecondaryAction({ emoji, title, desc, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-white border border-[#EDEBE8] rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform no-underline"
    >
      <span className="text-2xl flex-shrink-0 leading-none">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[#1A1F2E] leading-tight">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
    </Link>
  );
}

export default function Entrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!lowBw) getContadores().then(setStats).catch(() => {});
  }, [lowBw]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F8]">
      <TopBar />
      {!lowBw && <ContadoresBar />}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-5">

        {/* Cabecera */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">STATUSVZLA.com</p>
          <h1 className="text-2xl font-black text-[#1A1F2E] leading-tight">
            {es ? 'Sistema de respuesta a emergencias' : 'Emergency response system'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {es ? 'Sin registro obligatorio. Funciona con poca señal.' : 'No registration required. Works on low signal.'}
          </p>
        </div>

        {/* Stats en tiempo real */}
        {!lowBw && stats && (
          <div className="grid grid-cols-2 gap-2">
            <StatCard value={stats.personas_buscando} label={es ? 'búsquedas activas' : 'active searches'} color="text-[#D48C2E]" />
            <StatCard value={stats.puntos_abiertos} label={es ? 'puntos de ayuda abiertos' : 'open help points'} color="text-green-600" />
            {stats.criticos > 0 && <StatCard value={stats.criticos} label={es ? 'alertas críticas' : 'critical alerts'} color="text-[#B83A52]" />}
            {stats.personas_encontradas > 0 && <StatCard value={stats.personas_encontradas} label={es ? 'personas encontradas' : 'people found'} color="text-green-700" />}
          </div>
        )}

        {/* Acción principal: emergencia */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#B83A52] mb-2">
            {es ? '⚡ Acción de emergencia' : '⚡ Emergency action'}
          </p>
          <PrimaryAction
            emoji="🚨"
            title={es ? 'Hay peligro — reportar ahora' : 'There is danger — report now'}
            desc={es ? 'Edificio dañado, personas atrapadas, gas, incendio' : 'Damaged building, trapped people, gas, fire'}
            to="/reportar"
            variant="danger"
          />
        </div>

        {/* Aviso anti-extorsión */}
        <div className="flex gap-2.5 bg-[#FDF1F0] border border-[#E8B4B0] rounded-2xl px-4 py-3">
          <Shield size={15} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] leading-relaxed font-medium">
            {es
              ? 'Nunca envíes dinero a cambio de información. No autorizamos pagos ni rescates privados.'
              : 'Never send money in exchange for information. We do not authorize payments or private rescue fees.'}
          </p>
        </div>

        {/* Personas */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
            <Search size={11} /> {es ? 'Personas' : 'People'}
          </p>
          <div className="space-y-2.5">
            <PrimaryAction
              emoji="🔎"
              title={es ? 'Busco a alguien' : "I'm looking for someone"}
              desc={es ? 'Registra a tu familiar o amigo desaparecido' : 'Register your missing family member or friend'}
              to="/buscar-persona"
              variant="dark"
            />
            <PrimaryAction
              emoji="🙋"
              title={es ? 'Vi o encontré a alguien' : 'I found or saw someone'}
              desc={es ? 'Avisa ahora — puede salvar a una familia' : 'Report now — it can save a family'}
              to="/reportar-encontrado"
              variant="green"
            />
          </div>
        </div>

        {/* Consultar */}
        <SecondaryAction
          emoji="🗺️"
          title={es ? 'Consultar zonas y reportes' : 'Search zones and reports'}
          desc={es ? 'Edificios, refugios, zonas activas' : 'Buildings, shelters, active zones'}
          to="/consultar"
        />

        {/* Instituciones */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
            <Building2 size={11} /> {es ? 'Instituciones y puntos de ayuda' : 'Institutions and help points'}
          </p>
          <div className="space-y-2">
            <SecondaryAction
              emoji="🏥"
              title={es ? 'Registrar punto de ayuda' : 'Register help point'}
              desc={es ? 'Refugio, hospital, comedor, centro de acopio' : 'Shelter, hospital, food center, depot'}
              to="/institucional"
            />
            <SecondaryAction
              emoji="📋"
              title={es ? 'Subir lista de personas encontradas' : 'Upload list of found persons'}
              desc={es ? 'Registro institucional masivo' : 'Institutional bulk registration'}
              to="/registro-institucional"
            />
            <SecondaryAction
              emoji="⚙️"
              title={es ? 'Administrar mi punto de ayuda' : 'Manage my help point'}
              desc={es ? 'Actualizar estado, capacidad y necesidades' : 'Update status, capacity and needs'}
              to="/portal-institucional"
            />
          </div>
        </div>

        {/* Acceso / login */}
        <div className="bg-white border border-[#EDEBE8] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[#D48C2E]" />
            <p className="text-xs text-gray-600">
              {es ? 'Acceso inmediato — sin registro obligatorio' : 'Immediate access — no registration required'}
            </p>
          </div>
          <Link to="/login" className="text-xs font-bold text-[#1A1F2E] underline underline-offset-2 flex-shrink-0">
            {es ? 'Iniciar sesión' : 'Log in'}
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}