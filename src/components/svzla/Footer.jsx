import { useLang } from '@/lib/LangContext';
import { Phone, Shield, Heart } from 'lucide-react';
import { useState } from 'react';

const EMERGENCIAS = [
  {
    categoria: { es: 'Líneas nacionales', en: 'National lines' },
    items: [
      { nombre: '171 — CANTV fijo', numero: '171' },
      { nombre: '*1 — Movilnet', numero: '*1' },
      { nombre: '112 — Digitel', numero: '112' },
      { nombre: '911 — Movistar', numero: '911' },
    ],
  },
  {
    categoria: { es: 'Aeroambulancias', en: 'Air ambulance' },
    items: [
      { nombre: 'Aeroambulancias (0212)', numero: '02129932541' },
      { nombre: '992.89.80', numero: '02129928980' },
      { nombre: '992.89.90', numero: '02129928990' },
      { nombre: '991.79.40', numero: '02129917940' },
    ],
  },
  {
    categoria: { es: 'Rescate · Caracas', en: 'Rescue · Caracas' },
    items: [
      { nombre: 'Rescarven (0212)', numero: '02129936911' },
      { nombre: '993.69.91', numero: '02129936991' },
      { nombre: '993.13.10', numero: '02129931310' },
      { nombre: '993.33.67', numero: '02129933367' },
    ],
  },
  {
    categoria: { es: 'Ambulancia Metropolitano', en: 'Metropolitan Ambulance' },
    items: [
      { nombre: '(0212) 545.45.45', numero: '02125454545' },
      { nombre: '545.46.55', numero: '02125454655' },
      { nombre: '577.92.09', numero: '02125779209' },
    ],
  },
];

export default function Footer() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [mostrarTels, setMostrarTels] = useState(false);

  return (
    <footer className="bg-[#1A1F2E] text-gray-300 mt-auto">

      {/* Franja de misión */}
      <div className="border-t border-gray-700 px-4 py-5 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-4">
          <Heart size={16} className="text-[#D48C2E] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            {es
              ? 'Esta plataforma fue creada de manera voluntaria por venezolanos dentro y fuera del país para apoyar la búsqueda de personas desaparecidas. No solicitamos ni gestionamos dinero, donaciones ni ayudas de ningún tipo. Nuestro único objetivo es facilitar la recopilación y organización de información que pueda contribuir a su localización.'
              : 'This platform was created voluntarily by Venezuelans inside and outside the country to support the search for missing people. We do not request or manage money, donations, or aid of any kind. Our only goal is to facilitate the collection and organization of information that may help locate them.'}
          </p>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <Shield size={16} className="text-[#D48C2E] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            {es
              ? 'Esta es una herramienta ciudadana y no partidista. Ante una emergencia médica, llama a los organismos de rescate. Verifica siempre la información antes de difundirla.'
              : 'This is a citizen and non-partisan tool. In a medical emergency, call rescue services. Always verify information before sharing it.'}
          </p>
        </div>

        {/* Anti-extorsión */}
        <div className="bg-[#2A1A20] border border-[#6B2D3E] rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-[#F4A4B8] font-semibold leading-relaxed">
            ⚠️ {es
              ? 'Nunca envíes dinero a cambio de información. No autorizamos pagos, rescates privados ni intermediarios anónimos. Si alguien pide dinero, es una estafa — repórtalo.'
              : 'Never send money in exchange for information. We do not authorize payments, private rescue fees, or anonymous intermediaries. If someone asks for money, it\'s a scam — report it.'}
          </p>
        </div>

        {/* Teléfonos de emergencia — colapsable */}
        <button
          onClick={() => setMostrarTels(v => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#D48C2E] py-2 border-t border-gray-700"
        >
          <span className="flex items-center gap-2">
            <Phone size={13} />
            {es ? 'Teléfonos de emergencia · Venezuela' : 'Emergency phones · Venezuela'}
          </span>
          <span>{mostrarTels ? '▲' : '▼'}</span>
        </button>

        {mostrarTels && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EMERGENCIAS.map(grupo => (
              <div key={grupo.categoria.es}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  {es ? grupo.categoria.es : grupo.categoria.en}
                </p>
                <div className="space-y-1">
                  {grupo.items.map(item => (
                    <a
                      key={item.numero}
                      href={`tel:${item.numero}`}
                      className="flex items-center gap-2 text-xs text-gray-300 hover:text-[#D48C2E] transition-colors"
                    >
                      <Phone size={10} className="text-gray-600 flex-shrink-0" />
                      {item.nombre}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Franja inferior */}
      <div className="border-t border-gray-800 px-4 py-3 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
        <p className="text-[10px] text-gray-600 text-center sm:text-left">
          <span className="font-black text-gray-500">STATUSVZLA<span className="text-[#D48C2E]">.com</span></span>
          {' · '}
          {es ? 'Herramienta ciudadana · No partidista · Sin fines de lucro' : 'Citizen tool · Non-partisan · Non-profit'}
        </p>
        <p className="text-[10px] text-gray-700">
          {es ? 'Hecho con ❤️ por venezolanos' : 'Made with ❤️ by Venezuelans'}
        </p>
      </div>
    </footer>
  );
}