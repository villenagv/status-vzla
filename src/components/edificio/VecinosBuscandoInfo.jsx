import { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VecinosBuscandoInfo({ solicitudes, setSolicitudes, t }) {
  const [conozco, setConozco] = useState(null);
  const [respConozco, setRespConozco] = useState({ nombre: '', desc: '' });
  const [enviandoResp, setEnviandoResp] = useState(false);

  if (solicitudes.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-2">
        <Users size={14} className="text-purple-700 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-purple-800">{t('Vecinos buscando información', 'Neighbors looking for info', 'Vizinhos buscam informações')}</p>
          <p className="text-[11px] text-purple-600">{t('¿Conoces alguno de estos edificios en la zona?', 'Do you know any of these buildings in the area?', 'Você conhece algum destes edifícios na área?')}</p>
        </div>
      </div>
      <div className="space-y-2">
        {solicitudes.slice(0, 3).map(s => (
          <div key={s.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-bold text-gray-900">{s.nombre_lugar}</p>
                <p className="text-xs text-gray-500">📍 {s.direccion || t('Sin dirección', 'No address', 'Sem endereço')} · {s.ciudad}</p>
              </div>
              <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">{t('Sin datos', 'No data', 'Sem dados')}</span>
            </div>
            {conozco === s.id ? (
              <div className="space-y-2 pt-2 border-t border-amber-200">
                <textarea rows={2} value={respConozco.desc} onChange={e => setRespConozco(p => ({ ...p, desc: e.target.value }))}
                  placeholder={t('Cuéntanos qué sabes...', 'Tell us what you know...', 'Conte-nos o que você sabe...')}
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm resize-none placeholder-gray-400 focus:outline-none" />
                <input value={respConozco.nombre} onChange={e => setRespConozco(p => ({ ...p, nombre: e.target.value }))}
                  placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')}
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={async () => {
                    setEnviandoResp(true);
                    try {
                      await base44.entities.ActualizacionesSitios.create({ sitio_id: s.id, tipo_sitio: 'edificio', tipo_accion: 'tengo_actualizacion', descripcion: respConozco.desc || t('Ciudadano conoce este edificio', 'Citizen knows this building', 'Cidadão conhece este edifício'), reportante_nombre: respConozco.nombre, fuente: 'ciudadano' });
                      setSolicitudes(prev => prev.filter(x => x.id !== s.id));
                    } catch {}
                    setEnviandoResp(false); setConozco(null); setRespConozco({ nombre: '', desc: '' });
                  }} disabled={enviandoResp}
                    className="flex-1 bg-purple-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer">
                    {enviandoResp ? <Loader2 className="animate-spin inline" size={13} /> : '📨'} {t('Aportar información', 'Share info', 'Compartilhar informação')}
                  </button>
                  <button onClick={() => setConozco(null)} className="text-xs text-gray-400 underline cursor-pointer">{t('Cancelar', 'Cancel', 'Cancelar')}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConozco(s.id)} className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl cursor-pointer transition-colors">
                👁️ {t('Yo conozco este edificio', 'I know this building', 'Eu conheço este edifício')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}