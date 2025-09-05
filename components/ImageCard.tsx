import React, { useState } from 'react';
import type { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  showActions?: boolean;
  onAddToGallery?: () => void;
  onAddToRanking?: () => void;
  className?: string;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, showActions = false, onAddToGallery, onAddToRanking, className = '' }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
        if (image.url.startsWith('data:')) {
            // Handle Base64 data URI
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = image.url;
            const mimeType = image.url.substring(image.url.indexOf(':') + 1, image.url.indexOf(';'));
            const extension = mimeType.split('/')[1] || 'png';
            a.download = `${image.prompt.substring(0, 30).replace(/\s/g, '_')}.${extension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            // Handle regular URL
            const response = await fetch(image.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${image.prompt.substring(0, 30).replace(/\s/g, '_')}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        }
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('No se pudo descargar la imagen. Intenta abrirla en una nueva pestaña y guardarla desde allí.');
    } finally {
        setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const text = `Mira esta imagen que generé con Escena.AI: ${image.prompt}`;
    const fallbackShare = () => {
        alert('Tu navegador no soporta compartir imágenes directamente. Se compartirá solo el texto.');
        const encodedText = encodeURIComponent(text);
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    };

    if (navigator.share) {
        try {
            // Convert data URL to blob to file
            const response = await fetch(image.url);
            const blob = await response.blob();
            const extension = blob.type.split('/')[1] || 'png';
            const filename = `${image.prompt.substring(0, 30).replace(/\s/g, '_')}.${extension}`;
            const file = new File([blob], filename, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                 await navigator.share({
                    files: [file],
                    title: 'Imagen de Escena.AI',
                    text: text,
                });
            } else {
               throw new Error("File sharing not supported.");
            }
        } catch (error) {
             // AbortError is expected if the user cancels the share dialog.
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log("Share action was cancelled by the user.");
            } else {
                console.error('Web Share API failed, falling back:', error);
                fallbackShare();
            }
        }
    } else {
        fallbackShare();
    }
  };

  return (
    <div className={`group relative rounded-lg overflow-hidden bg-brand-gray ${className}`}>
      <img 
        src={image.url} 
        alt={image.prompt} 
        className={`w-full h-auto object-cover ${image.aspectRatio === 'Vertical' ? 'aspect-[9/16]' : 'aspect-[16/9]'}`} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
        <p className="text-white text-sm line-clamp-2" title={image.prompt}>
          {image.prompt}
        </p>
        {showActions && (
          <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
            <button onClick={handleDownload} disabled={isDownloading} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm">
                {isDownloading ? (
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )}
            </button>
            <button onClick={handleShare} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
            </button>
            <button onClick={onAddToGallery} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm" title="Añadir a Galería">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button onClick={onAddToRanking} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm" title="Enviar a Clasificación">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCard;