/**
 * Utilidades para manejo, compresión y optimización de fotos y videos
 * desde la galería del dispositivo para el Feed y los Estados (Stories).
 */

export interface ProcessedImage {
  dataUrl: string;
  name: string;
  sizeKb: number;
  width: number;
  height: number;
}

export interface ProcessedVideo {
  url: string;
  name: string;
  sizeMb: number;
  duration?: number;
}

/**
 * Comprime y redimensiona una imagen desde la galería usando Canvas
 * para que no consuma memoria excesiva y cargue a máxima velocidad.
 */
export async function compressImageFromGallery(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 1200,
  quality: number = 0.72
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular relación de aspecto manteniendo proporciones
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback a reader.result si canvas no está disponible
          resolve({
            dataUrl: e.target?.result as string,
            name: file.name,
            sizeKb: Math.round(file.size / 1024),
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Renderizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          name: file.name,
          sizeKb: approxSizeKb,
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error('No se pudo decodificar la imagen seleccionada de la galería.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo de la galería.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Procesa un archivo de video seleccionado desde la galería.
 * Usa ObjectURL para reproducción fluida e instantánea sin desbordar Storage.
 */
export async function processVideoFromGallery(file: File): Promise<ProcessedVideo> {
  return new Promise((resolve) => {
    const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      resolve({
        url: objectUrl,
        name: file.name,
        sizeMb,
        duration: Math.round(tempVideo.duration),
      });
    };
    tempVideo.onerror = () => {
      resolve({
        url: objectUrl,
        name: file.name,
        sizeMb,
      });
    };
    tempVideo.src = objectUrl;
  });
}

/**
 * Detecta si una URL corresponde a un video o a una imagen.
 */
export function isVideoSource(url?: string, explicitType?: 'image' | 'video'): boolean {
  if (explicitType === 'video') return true;
  if (explicitType === 'image') return false;
  if (!url) return false;

  if (url.startsWith('data:video/')) return true;
  if (url.startsWith('blob:')) {
    // Si no está especificado pero contiene pistas
    return true;
  }
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.includes('video')
  );
}
