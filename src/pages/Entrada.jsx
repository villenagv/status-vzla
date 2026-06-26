import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';

// Sin TopBar, sin Footer — pantalla de triage puro, carga instantánea
export default function Entrada() {
  const { lang, toggle: toggleLang } = useLang();
  const es = lang === 'es';

  return (
    <div className="min-h-screen flex flex-col bg-[#0D1117]">

      {/* Header mínimo */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D1117]">
        <div>
          <span className="font-black text-lg text-white tracking-tight">
            CRIS<span className="text-[#D48C2E]">·</span>VZLA
          </span>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-none">
            {es ? 'Emergencia · Venezuela 2026' : 'Emergency · Venezuela 2026'}
          </p>
        </div>
        <button
          onClick={toggleLang}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
        >
          {es ? 'EN' : 'ES'}
        </button>
      </div>

      {/* Alerta banner */}
      <div className="bg-[#B83A52] px-4 py-2.5 text-center">
        <p className="text-xs text-white font-bold">
          🔴 {es
            ? 'TERREMOTO ACTIVO · La Guaira, Caracas, Yaracuy · 24 junio 2026'
            : 'ACTIVE EARTHQUAKE · La Guaira, Caracas, Yaracuy · June 24 2026'}
        </p>
      </div>

      {/* Las 4 tarjetas — ocupan toda la pantalla sin scroll */}
      <main className="flex-1 flex flex-col p-3 gap-3">

        {/* TARJETA 1 — ROJA: Emergencia */}
        <Link
          to="/zona-afectada"
          className="flex-1 flex items-center gap-4 bg-[#B83A52] rounded-2xl px-5 py-4 min-h-[80px] active:bg-[#9e3046] no-underline"
          style={{ minHeight: '80px' }}
        >
          <span className="text-4xl flex-shrink-0">🆘</span>
          <div className="flex-1">
            <p className="font-black text-white text-lg leading-tight">
              {es ? 'Estoy en zona afectada' : 'I am in the affected area'}
            </p>
            <p className="text-sm text-red-100 mt-0.5 leading-snug">
              {es
                ? 'Reporta daños, pide ayuda o informa un refugio cercano'
                : 'Report damage, ask for help or report a nearby shelter'}
            </p>
          </div>
          <span className="text-white opacity-50 text-2xl">›</span>
        </Link>

        {/* TARJETA 2 — AZUL: Consultar */}
        <Link
          to="/consultar"
          className="flex-1 flex items-center gap-4 bg-[#1A4A8A] rounded-2xl px-5 py-4 min-h-[80px] active:bg-[#153a6e] no-underline"
          style={{ minHeight: '80px' }}
        >
          <span className="text-4xl flex-shrink-0">🔍</span>
          <div className="flex-1">
            <p className="font-black text-white text-lg leading-tight">
              {es ? 'Busco información de una zona' : 'I need info about an area'}
            </p>
            <p className="text-sm text-blue-200 mt-0.5 leading-snug">
              {es
                ? 'Estado de edificios, refugios activos y zonas reportadas'
                : 'Building status, active shelters and reported areas'}
            </p>
          </div>
          <span className="text-white opacity-50 text-2xl">›</span>
        </Link>

        {/* TARJETA 3 — VERDE: Institución */}
        <Link
          to="/institucional"
          className="flex-1 flex items-center gap-4 bg-[#1B5E20] rounded-2xl px-5 py-4 min-h-[80px] active:bg-[#154a19] no-underline"
          style={{ minHeight: '80px' }}
        >
          <span className="text-4xl flex-shrink-0">🏛️</span>
          <div className="flex-1">
            <p className="font-black text-white text-lg leading-tight">
              {es ? 'Soy institución o punto de ayuda' : 'I am an institution or help point'}
            </p>
            <p className="text-sm text-green-200 mt-0.5 leading-snug">
              {es
                ? 'Registra tu refugio, hospital, comedor o centro de donaciones'
                : 'Register your shelter, hospital, food center or donation point'}
            </p>
          </div>
          <span className="text-white opacity-50 text-2xl">›</span>
        </Link>

        {/* TARJETA 4 — MORADO: Personas */}
        <Link
          to="/personas"
          className="flex-1 flex items-center gap-4 bg-[#4A1A8A] rounded-2xl px-5 py-4 min-h-[80px] active:bg-[#38156e] no-underline"
          style={{ minHeight: '80px' }}
        >
          <span className="text-4xl flex-shrink-0">👤</span>
          <div className="flex-1">
            <p className="font-black text-white text-lg leading-tight">
              {es ? 'Busco o reporto a una persona' : 'I search or report a person'}
            </p>
            <p className="text-sm text-purple-200 mt-0.5 leading-snug">
              {es
                ? 'Reporta a alguien sin contacto o avisa que fue encontrado'
                : 'Report someone missing or notify they were found'}
            </p>
          </div>
          <span className="text-white opacity-50 text-2xl">›</span>
        </Link>
      </main>

      {/* Footer mínimo — emergencias y anti-extorsión */}
      <div className="px-4 pb-4 space-y-2">
        {/* Teléfonos de emergencia */}
        <div className="bg-[#1A1F2E] rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            📞 {es ? 'Emergencias Venezuela' : 'Venezuela Emergency Lines'}
          </p>
          <div className="grid grid-cols-4 gap-1">
            {[['171','CANTV'],['*1','Movilnet'],['112','Digitel'],['911','Movistar']].map(([num, op]) => (
              <a key={num} href={`tel:${num}`}
                className="flex flex-col items-center bg-[#B83A52] text-white rounded-xl py-2 px-1 text-center">
                <span className="font-black text-sm">{num}</span>
                <span className="text-[9px] opacity-80">{op}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Anti-extorsión */}
        <div className="bg-[#2A1A20] border border-[#6B2D3E] rounded-xl px-3 py-2">
          <p className="text-[10px] text-[#F4A4B8] font-semibold leading-relaxed text-center">
            ⚠️ {es
              ? 'Nunca envíes dinero a cambio de información. Si alguien pide dinero, es una estafa.'
              : "Never send money for information. Anyone asking for money is a scammer."}
          </p>
        </div>

        {/* Acceso institucional */}
        <div className="text-center">
          <Link to="/login" className="text-[10px] text-gray-600 underline underline-offset-2">
            {es ? 'Acceso institucional / Administrador' : 'Institutional access / Admin'}
          </Link>
        </div>
      </div>
    </div>
  );
}