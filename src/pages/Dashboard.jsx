import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, RefreshCw, TrendingUp, MousePointerClick, Eye, Target, Globe, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import TopBar from '@/components/svzla/TopBar';

const PERIODS = [
  { label: '7 días', days: 7 },
  { label: '28 días', days: 28 },
  { label: '90 días', days: 90 },
];

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-black text-[#1A1F2E] truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [period, setPeriod] = useState(28);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    loadSites();
  }, []);

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const res = await base44.functions.invoke('searchConsoleMetrics', {});
      const list = res.data?.sites || [];
      setSites(list);
      if (list.length > 0) setSelectedSite(list[0].siteUrl);
    } catch (e) {
      setError('No se pudo conectar con Google Search Console.');
    }
    setLoadingSites(false);
  };

  useEffect(() => {
    if (selectedSite) fetchMetrics();
  }, [selectedSite, period]);

  const fetchMetrics = async () => {
    if (!selectedSite) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('searchConsoleMetrics', { siteUrl: selectedSite, days: period });
      setData(res.data);
    } catch (e) {
      setError('Error al cargar las métricas. Intenta de nuevo.');
    }
    setLoading(false);
  };

  const fmtNum = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n || 0));

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-2 mb-5">
          <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1A1F2E]">
            <ChevronLeft size={16} /> Inicio
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-black text-[#1A1F2E]">📊 Dashboard del Equipo</h1>
            <p className="text-sm text-gray-500 mt-0.5">Rendimiento de búsqueda — Google Search Console</p>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={loading || !selectedSite}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-[#EDEBE8] bg-white rounded-xl px-3 py-2 hover:bg-gray-50 disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Site selector + period */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {loadingSites ? (
            <div className="flex-1 h-11 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              className="flex-1 border border-[#EDEBE8] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            >
              {sites.length === 0 && <option value="">Sin sitios encontrados</option>}
              {sites.map(s => (
                <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>
              ))}
            </select>
          )}
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${period === p.days ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52] mb-4">{error}</div>
        )}

        {loading && !data && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <MetricCard icon={MousePointerClick} label="Clics totales" value={fmtNum(data.summary?.clicks)} color="bg-[#1A1F2E]" />
              <MetricCard icon={Eye} label="Impresiones" value={fmtNum(data.summary?.impressions)} color="bg-[#3B72C4]" />
              <MetricCard icon={Target} label="CTR promedio" value={`${data.summary?.ctr}%`} color="bg-[#D48C2E]" />
              <MetricCard icon={TrendingUp} label="Posición media" value={`#${data.summary?.position}`} color="bg-[#2E7D32]" />
            </div>

            {/* Period label */}
            <p className="text-xs text-gray-400 mb-3">
              📅 {data.period?.startDate} → {data.period?.endDate} · {data.siteUrl}
            </p>

            {/* Daily chart */}
            {data.daily && data.daily.length > 0 && (
              <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 mb-4">
                <h2 className="text-sm font-bold text-[#1A1F2E] mb-3">Clics por día</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data.daily.map(r => ({ fecha: r.keys?.[0]?.slice(5) || r.keys?.[0], clics: r.clicks }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EDEBE8' }} />
                    <Line type="monotone" dataKey="clics" stroke="#1A1F2E" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top pages */}
            {data.topPages && data.topPages.length > 0 && (
              <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 mb-4">
                <h2 className="text-sm font-bold text-[#1A1F2E] mb-3 flex items-center gap-1.5">
                  <Globe size={14} /> Top páginas
                </h2>
                <div className="space-y-2">
                  {data.topPages.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-600 truncate flex-1">{(p.keys?.[0] || '').replace(/^https?:\/\/[^/]+/, '') || '/'}</p>
                      <div className="flex gap-3 flex-shrink-0 text-xs">
                        <span className="font-bold text-[#1A1F2E]">{fmtNum(p.clicks)} clics</span>
                        <span className="text-gray-400">{fmtNum(p.impressions)} imp.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top queries */}
            {data.topQueries && data.topQueries.length > 0 && (
              <div className="bg-white rounded-xl border border-[#EDEBE8] p-4">
                <h2 className="text-sm font-bold text-[#1A1F2E] mb-3 flex items-center gap-1.5">
                  <Search size={14} /> Top búsquedas
                </h2>
                <div className="space-y-2">
                  {data.topQueries.map((q, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-600 truncate flex-1">"{q.keys?.[0]}"</p>
                      <div className="flex gap-3 flex-shrink-0 text-xs">
                        <span className="font-bold text-[#1A1F2E]">{fmtNum(q.clicks)} clics</span>
                        <span className="text-gray-400">pos. {q.position?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}