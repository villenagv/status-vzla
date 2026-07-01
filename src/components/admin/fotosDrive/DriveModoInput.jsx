import { Loader2, FolderOpen } from 'lucide-react';

function extraerFolderId(url) {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
  return null;
}

export default function DriveModoInput({
  driveLink, setDriveLink, driveArchivos, setDriveArchivos, driveCargando, driveError, setDriveError, leerCarpetaDrive,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 11, color: '#1e40af', margin: 0, lineHeight: 1.6 }}>
          <strong>📁 Cómo usar:</strong><br />
          1. Ve a Google Drive y abre la carpeta con las fotos de los edificios.<br />
          2. Copia el link de la carpeta (el URL del navegador).<br />
          3. Pégalo aquí — el sistema listará las imágenes disponibles.<br />
          <strong>⚠️ La carpeta debe estar compartida</strong> con la cuenta de Drive conectada en la plataforma.
        </p>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
          Link de carpeta de Google Drive <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="url"
          value={driveLink}
          onChange={e => { setDriveLink(e.target.value); setDriveError(''); setDriveArchivos([]); }}
          placeholder="https://drive.google.com/drive/folders/1ABCxyz..."
          style={{ width: '100%', background: '#fff', border: `1.5px solid ${driveLink ? '#16a34a' : '#d1d5db'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#111827', boxSizing: 'border-box', outline: 'none' }}
        />
        {driveLink && extraerFolderId(driveLink) && (
          <p style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>✅ ID detectado: {extraerFolderId(driveLink)}</p>
        )}
        {driveLink && !extraerFolderId(driveLink) && (
          <p style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>⚠️ No se reconoce como link de carpeta Drive</p>
        )}
      </div>

      {driveError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>⚠️ {driveError}</p>
        </div>
      )}

      <button onClick={leerCarpetaDrive} disabled={!driveLink || driveCargando || !extraerFolderId(driveLink)}
        style={{ background: driveLink && extraerFolderId(driveLink) ? '#1D4ED8' : '#e5e7eb', color: driveLink && extraerFolderId(driveLink) ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {driveCargando ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
        {driveCargando ? 'Leyendo carpeta...' : 'Leer fotos de la carpeta'}
      </button>

      {/* Lista de archivos encontrados */}
      {driveArchivos.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: '0 0 10px' }}>
            📸 {driveArchivos.length} imágenes encontradas en la carpeta
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {driveArchivos.slice(0, 30).map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '5px 9px', fontSize: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                🖼️ {f.nombre.length > 25 ? f.nombre.slice(0, 22) + '…' : f.nombre}
              </div>
            ))}
            {driveArchivos.length > 30 && (
              <div style={{ fontSize: 10, color: '#6b7280', padding: '5px 9px' }}>+{driveArchivos.length - 30} más...</div>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#15803d', margin: '10px 0 0', lineHeight: 1.5 }}>
            ⚠️ Para asociar estas fotos a edificios necesitas un Excel con columnas <strong>edificio_id</strong> y <strong>nombre_archivo</strong>. Cambia al modo <strong>"Excel con índice"</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

export { extraerFolderId };