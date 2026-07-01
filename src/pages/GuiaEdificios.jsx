import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, ShieldAlert, Search } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import SeccionGuia from '@/components/guia/SeccionGuia';
import { SECCIONES } from '@/lib/guiaEdificiosContenido';

// ── Página principal ──────────────────────────────────────────────────────────
export default function GuiaEdificios() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;
  const [busqueda, setBusqueda] = useState('');

  const seccionesFiltradas = SECCIONES.filter(s =>
    !busqueda.trim() ||
    (es ? s.es : s.en).toLowerCase().includes(busqueda.toLowerCase()) ||
    s.items.some(item =>
      (es ? item.es : item.en).toLowerCase().includes(busqueda.toLowerCase()) ||
      (es ? item.desc_es : item.desc_en).toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">

        <Link to="/edificios" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {t('Edificios', 'Buildings', 'Edifícios')}
        </Link>

        {/* Encabezado */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            {t('Guía de seguridad', 'Safety guide', 'Guia de segurança')}
          </p>
          <h1 className="text-xl font-black text-gray-900 leading-tight mb-2">
            🏗️ {t('Edificios dañados: qué hacer', 'Damaged buildings: what to do', 'Edifícios danificados: o que fazer')}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t(
              'Guía práctica para evaluar, reportar y actuar correctamente ante un edificio dañado. Sin cuenta. Sin tecnicismos.',
              'Practical guide to evaluate, report, and act correctly when facing a damaged building. No account. No jargon.',
              'Guia prática para avaliar, reportar e agir corretamente ante um edifício danificado. Sem conta. Sem jargão.'
            )}
          </p>
        </div>

        {/* Alerta principal */}
        <div className="flex gap-3 bg-red-50 border-2 border-red-400 rounded-2xl p-4 mb-5">
          <ShieldAlert size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-800 mb-1">
              🚫 {t('Regla número uno: NO ENTRES.', 'Rule number one: DO NOT ENTER.', 'Regra número um: NÃO ENTRE.')}
            </p>
            <p className="text-xs text-red-700 leading-relaxed">
              {t(
                'Ante la duda, no entres. Espera a Protección Civil (171), Bomberos o rescatistas autorizados. Tu vida vale más que cualquier objeto.',
                'When in doubt, do not enter. Wait for Civil Protection (171), Firefighters, or authorized rescuers. Your life is worth more than any object.',
                'Na dúvida, não entre. Aguarde Proteção Civil (171), Bombeiros ou resgatistas autorizados. Sua vida vale mais do que qualquer objeto.'
              )}
            </p>
          </div>
        </div>

        {/* Teléfonos de emergencia — siempre visibles */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            📞 {t('Llama ahora si hay emergencia activa', 'Call now if there is an active emergency', 'Ligue agora se houver emergência ativa')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[{ num: '171', op: 'CANTV' }, { num: '*1', op: 'Movilnet' }, { num: '112', op: 'Digitel' }, { num: '911', op: 'Movistar' }].map(({ num, op }) => (
              <a key={num} href={`tel:${num}`}
                className="flex flex-col items-center bg-red-600 rounded-xl py-3 no-underline">
                <span className="text-sm font-black text-white">{num}</span>
                <span className="text-[9px] text-red-200 mt-0.5">{op}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Link to="/edificios?tab=consultar"
            className="flex flex-col items-center gap-2 bg-blue-700 text-white rounded-2xl py-4 no-underline text-center">
            <Search size={20} />
            <span className="text-xs font-black">{t('¿Es seguro mi edificio?', 'Is my building safe?', 'Meu edifício é seguro?')}</span>
          </Link>
          <Link to="/edificios?tab=reportar"
            className="flex flex-col items-center gap-2 bg-red-600 text-white rounded-2xl py-4 no-underline text-center">
            <AlertTriangle size={20} />
            <span className="text-xs font-black">{t('Reportar daño ahora', 'Report damage now', 'Reportar dano agora')}</span>
          </Link>
        </div>

        {/* Buscador de temas */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={t('Buscar tema en la guía...', 'Search topic in the guide...', 'Buscar tema no guia...')}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs cursor-pointer">✕</button>
          )}
        </div>

        {/* Secciones de la guía */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          📖 {t('Contenido de la guía', 'Guide contents', 'Conteúdo do guia')} ({seccionesFiltradas.length})
        </p>

        {seccionesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm">{t('No encontramos ese tema.', 'Topic not found.', 'Tema não encontrado.')}</p>
            <button onClick={() => setBusqueda('')} className="text-sm text-blue-600 underline mt-2 cursor-pointer">
              {t('Ver toda la guía', 'View full guide', 'Ver guia completo')}
            </button>
          </div>
        ) : (
          seccionesFiltradas.map(s => <SeccionGuia key={s.id} seccion={s} es={es} />)
        )}

        {/* Resumen de semáforo visual */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            🚦 {t('Referencia rápida de semáforo', 'Quick traffic light reference', 'Referência rápida do semáforo')}
          </p>
          <div className="space-y-2">
            {[
              { icon: '🟢', label: t('ENTRADA AUTORIZADA', 'ENTRY AUTHORIZED', 'ENTRADA AUTORIZADA'), desc: t('Estructura segura verificada', 'Verified safe structure', 'Estrutura segura verificada'), color: '#16a34a', bg: '#f0fdf4' },
              { icon: '🟡', label: t('PRECAUCIÓN', 'CAUTION', 'CUIDADO'),                             desc: t('Daño leve — entrar con cuidado', 'Minor damage — enter carefully', 'Dano leve — entrar com cuidado'), color: '#d97706', bg: '#fffbeb' },
              { icon: '🟠', label: t('ENTRADA LIMITADA', 'LIMITED ENTRY', 'ENTRADA LIMITADA'),        desc: t('Solo rescatistas o urgencia extrema', 'Only rescuers or extreme emergency', 'Somente resgatistas ou urgência extrema'), color: '#ea580c', bg: '#fff7ed' },
              { icon: '🔴', label: t('NO ENTRAR', 'DO NOT ENTER', 'NÃO ENTRAR'),                     desc: t('Daño grave o crítico', 'Severe or critical damage', 'Dano grave ou crítico'), color: '#dc2626', bg: '#fef2f2' },
              { icon: '💥', label: t('COLAPSADO', 'COLLAPSED', 'COLAPSADO'),                         desc: t('Zona de rescate — mantén distancia', 'Rescue zone — keep distance', 'Zona de resgate — mantenha distância'), color: '#4A0E0E', bg: '#fcecec' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: item.bg }}>
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-black" style={{ color: item.color }}>{item.label}</p>
                  <p className="text-[10px] text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4 space-y-2">
          <p className="text-xs font-bold text-white mb-3">
            {t('¿Tienes información sobre un edificio?', 'Do you have info about a building?', 'Tem informações sobre um edifício?')}
          </p>
          <Link to="/edificios" className="flex items-center justify-between bg-white text-gray-900 rounded-xl px-4 py-3 no-underline">
            <span className="text-sm font-bold">📋 {t('Ver directorio de edificios', 'View building directory', 'Ver diretório de edifícios')}</span>
            <span className="text-gray-400">›</span>
          </Link>
          <Link to="/edificios?tab=reportar" className="flex items-center justify-between bg-red-600 text-white rounded-xl px-4 py-3 no-underline">
            <span className="text-sm font-bold">🚨 {t('Reportar edificio dañado', 'Report damaged building', 'Reportar edifício danificado')}</span>
            <span className="text-red-200">›</span>
          </Link>
        </div>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          {t(
            'Esta guía es informativa y no sustituye a las instrucciones de autoridades locales. Siempre sigue las indicaciones de Protección Civil, Bomberos y rescatistas profesionales.',
            'This guide is informational and does not replace instructions from local authorities. Always follow the instructions of Civil Protection, Firefighters, and professional rescuers.',
            'Este guia é informativo e não substitui as instruções das autoridades locais. Sempre siga as instruções da Proteção Civil, Bombeiros e resgatistas profissionais.'
          )}
        </p>
      </div>
      <Footer />
    </div>
  );
}