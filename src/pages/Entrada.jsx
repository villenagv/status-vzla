import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Zap, ZapOff } from 'lucide-react';
import { useState } from 'react';

// Pantalla 1 de 12 — Entrada principal
// Filosofía: NO es un menú. Es una decisión de orientación inmediata.
// Sin scroll (las tarjetas caben en una pantalla móvil), sin animaciones,
// sin mapa, sin registro obligatorio — carga instantánea.

const TARJETAS = [
  {
    id: 'afectada',
    emoji: '🚨',
    bg: '#FDF1F0',
    border: '#E8B4B0',
    iconBg: '#B83A52',
    to_es: '/zona-afectada',
    to_en: '/zona-afectada',
    titulo_es: 'Estoy en zona afectada',
    titulo_en: "I'm in an affected area",
    sub_es: 'Reporta daños, pide ayuda o informa que estás a salvo',
    sub_en: 'Report damage, request help or report you are safe',
  },
  {
    id: 'buscar',
    emoji: '🔍',
    bg: '#F0F4FD',
    border: '#B0C4E8',
    iconBg: '#1A4A8A',
    to_es: '/buscar-persona',
    to_en: '/buscar-persona',
    titulo_es: 'Busco a alguien / Me buscan',
    titulo_en: 'Looking for someone / Being searched',
    sub_es: 'Buscar por nombre, zona o registrar alerta familiar',
    sub_en: 'Search by name, area or register a family alert',
  },
  {
    id: 'institucion',
    emoji: '🏥',
    bg: '#F0FAF4',
    border: '#A8D8BC',
    iconBg: '#2E7D32',
    to_es: '/institucional',
    to_en: '/institucional',
    titulo_es: 'Soy institución o punto de ayuda',
    titulo_en: 'I am an institution or help point',
    sub_es: 'Registrar refugio, hospital, comedor o centro de donaciones',
    sub_en: 'Register shelter, hospital, food center or donation site',
  },
];

// Acciones secundarias — acceso rápido sin ocupar espacio primario
const SECUNDARIAS = [
  { to: '/reportar-encontrado', es: '🙋 Encontré a alguien', en: '🙋 I found someone' },
  { to: '/directorio-encontrados', es: '📋 Directorio encontrados', en: '📋 Found people' },
  { to: '/consultar', es: '🔎 Consultar zonas', en: '🔎 Search areas' },
  { to: '/portal-institucional', es: '🏛️ Portal institucional', en: '🏛️ Institutional portal' },
];

export default function Entrada() {
  const { lang, toggle: toggleLang } = useLang();
  const { lowBw, toggle: toggleLowBw } = useLowBw();
  const es = lang === 'es';

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Header mínimo — solo marca + controles esenciales */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <p className="font-black text-base tracking-tight text-[#1A1F2E]">
            CRIS <span className="text-[#D48C2E]">·</span> <span className="text-xs font-normal text-gray-400">statusvzla.com</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLowBw}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${
              lowBw
                ? 'bg-[#D48C2E] border-[#D48C2E] text-white'
                : 'border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
            title={es ? 'Modo bajo consumo' : 'Low-bandwidth mode'}
          >
            {lowBw ? <ZapOff size={11} /> : <Zap size={11} />}
            <span className="hidden sm:inline">{es ? 'Bajo consumo' : 'Low-BW'}</span>
          </button>
          <button
            onClick={toggleLang}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:border-gray-400 font-semibold"
          >
            {es ? 'EN' : 'ES'}
          </button>
        </div>
      </header>

      {/* Título de orientación — breve, no decorativo */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {es ? 'Sistema de respuesta ciudadana' : 'Citizen emergency system'}
        </p>
        <h1 className="text-xl font-black text-[#1A1F2E] leading-tight">
          {es ? '¿Cuál es tu situación?' : "What's your situation?"}
        </h1>
      </div>

      {/* Tarjetas principales — 3, sin scroll en móvil, altura mínima 72px cada una */}
      <div className="px-4 flex flex-col gap-3 flex-1">
        {TARJETAS.map(t => (
          <Link
            key={t.id}
            to={es ? t.to_es : t.to_en}
            style={{ backgroundColor: t.bg, borderColor: t.border }}
            className="flex items-center gap-4 rounded-2xl border px-5 py-5 no-underline active:scale-[0.98] transition-transform"
          >
            {/* Ícono con fondo de color */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: t.iconBg }}
            >
              <span>{t.emoji}</span>
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="font-black text-base text-[#1A1F2E] leading-tight mb-0.5">
                {es ? t.titulo_es : t.titulo_en}
              </p>
              <p className="text-xs text-gray-500 leading-snug">
                {es ? t.sub_es : t.sub_en}
              </p>
            </div>

            {/* Flecha */}
            <span className="text-2xl text-gray-400 flex-shrink-0 font-light">›</span>
          </Link>
        ))}

        {/* Separador */}
        <div className="border-t border-gray-100 my-1" />

        {/* Acciones secundarias — compactas, en grid 2x2 */}
        <div className="grid grid-cols-2 gap-2 pb-4">
          {SECUNDARIAS.map(s => (
            <Link
              key={s.to}
              to={s.to}
              className="bg-[#F4F4F8] border border-[#EDEBE8] rounded-xl px-3 py-3 text-xs font-semibold text-[#1A1F2E] no-underline hover:bg-gray-100 active:scale-[0.97] transition-transform leading-snug"
            >
              {es ? s.es : s.en}
            </Link>
          ))}
        </div>

        {/* Aviso anti-extorsión — compacto pero presente */}
        <div className="bg-[#2A1A20] border border-[#6B2D3E] rounded-xl px-4 py-3 mb-2">
          <p className="text-[11px] text-[#F4A4B8] font-semibold leading-relaxed">
            ⚠️ {es
              ? 'Nunca envíes dinero a cambio de información. Si alguien pide dinero, es una estafa.'
              : "Never send money for information. If someone asks for money, it's a scam."}
          </p>
        </div>

        {/* Footer mínimo */}
        <div className="flex items-center justify-between pb-5">
          <p className="text-[10px] text-gray-400">
            {es ? 'Herramienta ciudadana · No partidista' : 'Citizen tool · Non-partisan'}
          </p>
          <Link to="/login" className="text-[10px] text-gray-400 underline underline-offset-2">
            {es ? 'Acceso institucional' : 'Institutional login'}
          </Link>
        </div>
      </div>
    </div>
  );
}