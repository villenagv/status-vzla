import { useState, useEffect } from 'react';
import { UserPlus, Phone, Mail, User, CheckCircle, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

export default function AgregarContactos() {
  const params = new URLSearchParams(window.location.search);
  const edificioId = params.get('edificio');
  const token = params.get('token');

  const [estado, setEstado] = useState('cargando'); // cargando | ok | error | token_invalido
  const [edificio, setEdificio] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', rol: '' });
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!edificioId || !token) {
      setEstado('token_invalido');
      return;
    }
    cargarContactos();
  }, []);

  const cargarContactos = async () => {
    setEstado('cargando');
    try {
      const res = await base44.functions.invoke('gestionarContactosAcceso', {
        edificio_id: edificioId,
        token,
      });
      if (res?.data?.ok) {
        setEdificio(res.data.edificio);
        setContactos(res.data.contactos || []);
        setEstado('ok');
      } else {
        setEstado('token_invalido');
      }
    } catch {
      setEstado('token_invalido');
    }
  };

  const agregarContacto = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) return;
    setEnviando(true);
    setErrorMsg('');
    try {
      const res = await base44.functions.invoke('gestionarContactosAcceso', {
        edificio_id: edificioId,
        token,
        contacto: {
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim(),
          rol: form.rol.trim(),
        },
      });
      if (res?.data?.ok) {
        setContactos(res.data.contactos || []);
        setForm({ nombre: '', telefono: '', email: '', rol: '' });
        setExito('Contacto agregado correctamente ✓');
        setTimeout(() => setExito(''), 3000);
      } else {
        setErrorMsg('No se pudo guardar el contacto. Intenta de nuevo.');
      }
    } catch {
      setErrorMsg('Error de conexión. Verifica tu señal e intenta de nuevo.');
    }
    setEnviando(false);
  };

  if (estado === 'cargando') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (estado === 'token_invalido') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-0)' }}>
        <TopBar />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
          <AlertTriangle size={48} style={{ color: '#EF4444', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Enlace no válido</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Este enlace no es válido o ha expirado. Si crees que es un error, contacta al equipo de Status Vzla.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const lugarNombre = edificio?.nombre_lugar || edificio?.direccion || edificio?.ciudad || 'el edificio';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-0)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, maxWidth: 560, margin: '0 auto', width: '100%', padding: '24px 16px 40px' }}>

        {/* Cabecera */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C3AED', background: 'rgba(124,58,237,0.12)', padding: '4px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 10 }}>
            🔒 Acceso privado · Solo para el equipo autorizado
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.2 }}>
            Contactos de acceso
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Edificio: <strong style={{ color: 'var(--text-primary)' }}>{lugarNombre}</strong>
            {edificio?.ciudad ? ` · ${edificio.ciudad}` : ''}
          </p>
        </div>

        {/* Nota de privacidad */}
        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <ShieldCheck size={16} style={{ color: '#7C3AED', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Los contactos que registre en este formulario podrán ser compartidos con el <strong>equipo autorizado, inspectores y voluntarios asignados</strong> a esta inspección, con el único propósito de coordinar el acceso al edificio, recopilar información relevante y facilitar la organización de la visita. Si actualmente no hay contactos adicionales disponibles, podrá agregarlos más adelante usando este mismo enlace.
            </p>
          </div>
        </div>

        {/* Lista de contactos actuales */}
        {contactos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
              Contactos registrados ({contactos.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contactos.map((c, i) => (
                <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <User size={14} style={{ color: '#7C3AED', flexShrink: 0 }} />
                    <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{c.nombre}</strong>
                    {c.rol && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(124,58,237,0.15)', color: '#7C3AED', padding: '2px 7px', borderRadius: 20 }}>{c.rol}</span>}
                    {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(21,128,61,0.15)', color: '#15803D', padding: '2px 7px', borderRadius: 20 }}>Solicitante</span>}
                  </div>
                  {c.telefono && (
                    <a href={`tel:${c.telefono}`} style={{ fontSize: 13, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginBottom: 2 }}>
                      <Phone size={12} /> {c.telefono}
                    </a>
                  )}
                  {c.email && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <Mail size={12} /> {c.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario de nuevo contacto */}
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <UserPlus size={16} style={{ color: '#7C3AED' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agregar nuevo contacto</h2>
          </div>

          <form onSubmit={agregarContacto} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Nombre completo <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: María González"
                required
                style={{
                  width: '100%', background: 'var(--surface-3)', border: '1.5px solid var(--border-strong)',
                  borderRadius: 10, padding: '11px 13px', fontSize: 14, color: 'var(--text-primary)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Teléfono <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                placeholder="Ej: +58 412 123 4567"
                type="tel"
                required
                style={{
                  width: '100%', background: 'var(--surface-3)', border: '1.5px solid var(--border-strong)',
                  borderRadius: 10, padding: '11px 13px', fontSize: 14, color: 'var(--text-primary)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Correo electrónico <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Ej: maria@email.com"
                type="email"
                style={{
                  width: '100%', background: 'var(--surface-3)', border: '1.5px solid var(--border-strong)',
                  borderRadius: 10, padding: '11px 13px', fontSize: 14, color: 'var(--text-primary)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Rol o relación con el edificio <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                placeholder="Ej: Administrador, Vecino piso 3, Junta de condominio..."
                style={{
                  width: '100%', background: 'var(--surface-3)', border: '1.5px solid var(--border-strong)',
                  borderRadius: 10, padding: '11px 13px', fontSize: 14, color: 'var(--text-primary)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {errorMsg && (
              <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>⚠ {errorMsg}</p>
            )}

            {exito && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16A34A' }}>
                <CheckCircle size={16} />
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{exito}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!form.nombre.trim() || !form.telefono.trim() || enviando}
              style={{
                width: '100%', background: '#7C3AED', color: '#fff', border: 'none',
                borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700,
                cursor: !form.nombre.trim() || !form.telefono.trim() || enviando ? 'not-allowed' : 'pointer',
                opacity: !form.nombre.trim() || !form.telefono.trim() || enviando ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50,
              }}
            >
              {enviando ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {enviando ? 'Guardando...' : 'Guardar contacto'}
            </button>
          </form>
        </div>

        {/* Nota final */}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0 0', lineHeight: 1.5 }}>
          Puedes regresar a este enlace en cualquier momento para agregar más contactos antes o durante la inspección.
        </p>
      </main>
      <Footer />
    </div>
  );
}