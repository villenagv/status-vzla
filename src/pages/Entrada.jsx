import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Link } from 'react-router-dom';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import ContadoresEntrada from '@/components/svzla/ContadoresEntrada';
import JsonLd, { buildSiteJsonLd } from '@/components/seo/JsonLd';
import SeoMeta from '@/components/seo/SeoMeta';

const TELS = [
  { num: '171', op: 'CANTV' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

// ── ACCIONES PRIMARIAS DE TRIAGE ──
const TRIAGE = [
  {
    to: '/edificios?tab=reportar',
    emoji: '🚨',
    color: '#C0392B',
    bg: 'rgba(192,57,43,0.06)',
    border: 'rgba(192,57,43,0.30)',
    es: { title: 'Reportar daño o peligro', sub: 'Edificio dañado · Gas · Personas atrapadas', hint: 'No entres. Reporta desde afuera.' },
    en: { title: 'Report damage or hazard', sub: 'Damaged building · Gas · Trapped people', hint: 'Do not enter. Report from outside.' },
    pt: { title: 'Reportar dano ou perigo', sub: 'Edifício danificado · Gás · Pessoas presas', hint: 'Não entre. Reporte de fora.' },
  },
  {
    to: '/buscar-persona',
    emoji: '🔎',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.30)',
    es: { title: 'Buscar a alguien', sub: 'Personas desaparecidas · Cruces de información', hint: 'Busca por nombre o zona.' },
    en: { title: 'Search for someone', sub: 'Missing people · Cross-search', hint: 'Search by name or area.' },
    pt: { title: 'Procurar alguém', sub: 'Pessoas desaparecidas · Busca cruzada', hint: 'Busque por nome ou área.' },
  },
  {
    to: '/reportar-encontrado',
    emoji: '🙋',
    color: '#15803D',
    bg: 'rgba(21,128,61,0.06)',
    border: 'rgba(21,128,61,0.30)',
    es: { title: 'Encontré a alguien', sub: 'Vi o tengo información real de una persona', hint: 'Ayuda a reunir una familia.' },
    en: { title: 'I found someone', sub: 'I saw or have real info about a person', hint: 'Help reunite a family.' },
    pt: { title: 'Encontrei alguém', sub: 'Vi ou tenho informação real de uma pessoa', hint: 'Ajude a reunir uma família.' },
  },
  {
    to: '/centros-apoyo',
    emoji: '🏥',
    color: '#0E7490',
    bg: 'rgba(14,116,144,0.06)',
    border: 'rgba(14,116,144,0.30)',
    es: { title: 'Buscar refugio o ayuda', sub: 'Refugios · Hospitales · Agua y comida', hint: 'Ver direcciones y disponibilidad.' },
    en: { title: 'Find shelter or help', sub: 'Shelters · Hospitals · Water & food', hint: 'See addresses and availability.' },
    pt: { title: 'Encontrar abrigo ou ajuda', sub: 'Abrigos · Hospitais · Água e comida', hint: 'Veja endereços e disponibilidade.' },
  },
];

// ── CONSULTA / INFORMACIÓN ──
const PILARES = [
  {
    to: '/edificios',
    emoji: '🏗️',
    color: '#B45309',
    es: { badge: 'EDIFICIOS', title: 'Estado de edificios', sub: '¿Puedo entrar? · Daños · Servicios' },
    en: { badge: 'BUILDINGS', title: 'Building status', sub: 'Can I enter? · Damage · Services' },
    pt: { badge: 'EDIFÍCIOS', title: 'Estado dos edifícios', sub: 'Posso entrar? · Danos · Serviços' },
  },
  {
    to: '/directorio',
    emoji: '📂',
    color: '#4B5563',
    es: { badge: 'DIRECTORIO', title: 'Directorio completo', sub: 'Organizaciones · Contactos · Recursos' },
    en: { badge: 'DIRECTORY', title: 'Full directory', sub: 'Organizations · Contacts · Resources' },
    pt: { badge: 'DIRETÓRIO', title: 'Diretório completo', sub: 'Organizações · Contatos · Recursos' },
  },
  {
    to: '/aliados',
    emoji: '🤝',
    color: '#15803D',
    es: { badge: 'ALIADOS', title: 'Organizaciones aliadas', sub: 'ONGs · Voluntarios · Instituciones' },
    en: { badge: 'PARTNERS', title: 'Partner organizations', sub: 'NGOs · Volunteers · Institutions' },
    pt: { badge: 'PARCEIROS', title: 'Organizações parceiras', sub: 'ONGs · Voluntários · Instituições' },
  },
];

const SECUNDARIAS = [
  { to: '/como-funciona', emoji: '🧭', es: 'Qué hacemos', en: 'What we do', pt: 'O que fazemos' },
  { to: '/guia-plataforma', emoji: '❓', es: 'Cómo usar la app', en: 'How to use the app', pt: 'Como usar o app' },
  { to: '/guia-edificios', emoji: '📖', es: 'Guía edificios', en: 'Building guide', pt: 'Guia de edifícios' },
  { to: '/contactanos', emoji: '✉️', es: 'Contáctanos', en: 'Contact us', pt: 'Contate-nos' },
  { to: '/voluntario', emoji: '🤝', es: 'Ser voluntario', en: 'Volunteer', pt: 'Ser voluntário', accent: true },
];

// ── Encabezado de sección estilo panel ──
function SectionHeader({ label, color }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span style={{ width: 5, height: 5, borderRadius: 999, background: color || '#9CA3AF', flexShrink: 0 }} />
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
        {label}
      </p>
    </div>
  );
}

export default function Entrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F2F5' }}>
      <SeoMeta
        title={es ? 'Emergencias Venezuela — Edificios, Personas y Refugios' : 'Venezuela Emergency — Buildings, People and Shelters'}
        description={es
          ? 'Plataforma ciudadana para reportar daños en edificios, buscar personas desaparecidas y encontrar refugios en Venezuela. Sin cuenta. Funciona con poca señal.'
          : 'Citizen platform to report building damage, search for missing people and find shelters in Venezuela. No account needed. Works with poor signal.'}
        lang={lang}
      />
      <JsonLd data={buildSiteJsonLd()} />
      <TopBar />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">

        {/* ── PANEL SUPERIOR: estado + título ── */}
        <div className="rounded-2xl px-5 py-4" style={{ background: '#111827', boxShadow: '0 2px 10px rgba(0,0,0,0.10)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#E5E7EB' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#22C55E' }} />
              {t('Sistema activo', 'System active', 'Sistema ativo')}
            </span>
            {lowBw && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(234,179,8,0.15)', color: '#FCD34D' }}>
                ⚡ {t('Bajo consumo', 'Low-BW', 'Baixo consumo')}
              </span>
            )}
          </div>
          <h1 className="text-xl font-black leading-tight mb-1" style={{ color: '#fff', letterSpacing: '-0.01em' }}>
            {t('¿Qué necesitas hacer ahora?', 'What do you need to do now?', 'O que você precisa fazer agora?')}
          </h1>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t('Sin cuenta obligatoria · Funciona con poca señal', 'No account required · Works with poor signal', 'Sem conta obrigatória · Funciona com pouco sinal')}
          </p>

          {/* Contadores integrados al panel */}
          <div className="mt-3.5 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <ContadoresEntrada />
          </div>
        </div>

        {/* ── ACCIÓN INMEDIATA: grid 2x2 compacto ── */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SectionHeader label={t('⚡ Acción inmediata', '⚡ Immediate action', '⚡ Ação imediata')} color="#C0392B" />
          <div className="grid grid-cols-2 gap-2">
            {TRIAGE.map(item => {
              const txt = pt ? (item.pt || item.es) : es ? item.es : item.en;
              return (
                <Link key={item.to} to={item.to} className="no-underline block" style={{ borderRadius: 12 }}>
                  <div style={{
                    background: item.bg,
                    border: `1.5px solid ${item.border}`,
                    borderRadius: 12,
                    padding: '12px 12px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    <span style={{ fontSize: 22 }}>{item.emoji}</span>
                    <p style={{ fontSize: 12.5, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>
                      {txt.title}
                    </p>
                    <p style={{ fontSize: 10.5, color: '#6B7280', lineHeight: 1.35 }}>
                      {txt.sub}
                    </p>
                    <p style={{ fontSize: 9.5, fontWeight: 700, color: item.color, lineHeight: 1.3, marginTop: 'auto', paddingTop: 4 }}>
                      {txt.hint}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── PEDIR INSPECCIÓN — fila destacada dentro del panel ── */}
        <Link to="/solicitar-inspeccion" className="no-underline block" style={{ borderRadius: 16 }}>
          <div className="flex items-center gap-3.5" style={{
            background: '#1D4ED8',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 2px 8px rgba(29,78,216,0.20)',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>📸</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>
                {t('Pedir inspección de daños', 'Request a damage inspection', 'Solicitar inspeção de danos')}
              </p>
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.35 }}>
                {t('Toma fotos · Un voluntario técnico te contactará', 'Take photos · A technical volunteer will contact you', 'Tire fotos · Um voluntário técnico entrará em contato')}
              </p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, flexShrink: 0 }}>›</span>
          </div>
        </Link>

        {/* ── CONSULTAR INFORMACIÓN: tabla compacta tipo panel ── */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SectionHeader label={t('📋 Consultar información', '📋 Browse information', '📋 Consultar informações')} color="#4B5563" />
          <div className="flex flex-col" style={{ border: '1px solid #F0F1F3', borderRadius: 12, overflow: 'hidden' }}>
            {PILARES.map((item, i) => {
              const txt = pt ? (item.pt || item.es) : es ? item.es : item.en;
              return (
                <Link key={item.to} to={item.to} className="no-underline block">
                  <div className="flex items-center gap-3" style={{
                    padding: '10px 12px',
                    borderTop: i > 0 ? '1px solid #F0F1F3' : 'none',
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0, width: 26, textAlign: 'center' }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2">
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{txt.title}</p>
                        <span style={{
                          fontSize: 8.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: item.color, background: 'transparent',
                        }}>
                          · {txt.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.35 }}>{txt.sub}</p>
                    </div>
                    <span style={{ color: '#D1D5DB', fontSize: 16, flexShrink: 0 }}>›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── ACCESOS RÁPIDOS ── */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SectionHeader label={t('🔗 Accesos rápidos', '🔗 Quick links', '🔗 Acessos rápidos')} color="#6B7280" />
          <div className="grid grid-cols-2 gap-2">
            {SECUNDARIAS.map(item => (
              <Link key={item.to} to={item.to} className="no-underline flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={item.accent
                  ? { background: '#F0FDF4', border: '1px solid rgba(21,128,61,0.25)' }
                  : { background: '#F9FAFB', border: '1px solid #EEF0F2' }}>
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: item.accent ? '#15803D' : '#374151', lineHeight: 1.3 }}>
                  {pt ? item.pt : es ? item.es : item.en}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── TELÉFONOS + ANTI-EXTORSIÓN: fila combinada ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
            <SectionHeader label={t('📞 Emergencias', '📞 Emergency lines', '📞 Emergências')} color="#C0392B" />
            <div className="grid grid-cols-4 gap-1.5">
              {TELS.map(({ num, op }) => (
                <a key={num} href={`tel:${num}`} className="no-underline flex flex-col items-center py-2.5 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid rgba(192,57,43,0.15)' }}>
                  <span className="text-xs font-black" style={{ color: '#C0392B' }}>{num}</span>
                  <span className="text-[8.5px] mt-0.5" style={{ color: '#9CA3AF' }}>{op}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: '#FEF9F0', border: '1px solid rgba(245,158,11,0.30)' }}>
            <SectionHeader label={t('⚠️ Seguridad', '⚠️ Safety', '⚠️ Segurança')} color="#B45309" />
            <p className="text-[11.5px] leading-relaxed" style={{ color: '#92400E' }}>
              {t(
                'Nunca envíes dinero a cambio de información. Si alguien pide dinero para localizar a alguien, es una estafa.',
                "Never send money in exchange for information. If someone asks for money to locate a person, it's a scam.",
                'Nunca envie dinheiro por informações. Se alguém pedir dinheiro para localizar alguém, é um golpe.'
              )}
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}