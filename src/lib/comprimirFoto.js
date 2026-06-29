/**
 * comprimirFoto — comprime una imagen a JPEG base64 liviano para guardar en localStorage.
 * Reduce el lado mayor a maxLado px y calidad 0.7. Pensado para baja señal / poco almacenamiento.
 * Retorna una promesa con el dataURL (string base64).
 */
export function comprimirFoto(file, maxLado = 1280, calidad = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxLado) {
          height = Math.round(height * (maxLado / width));
          width = maxLado;
        } else if (height > maxLado) {
          width = Math.round(width * (maxLado / height));
          height = maxLado;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convierte un dataURL base64 a un objeto File para subir. */
export function dataURLaFile(dataURL, nombre = 'foto.jpg') {
  const [head, body] = dataURL.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(body);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], nombre, { type: mime });
}