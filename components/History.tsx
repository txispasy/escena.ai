import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { GeneratedImage } from '../types';

interface HistoryProps {
  onClose: () => void;
}

const History: React.FC<HistoryProps> = ({ onClose }) => {
  const [allImages, setAllImages] = useLocalStorage<GeneratedImage[]>('imageData', []);
  
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentHistory = allImages.filter(image => (now - image.timestamp) < NINETY_DAYS_MS);

  const deleteImage = (id: string) => {
    setAllImages(currentImages => currentImages.filter(image => image.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar todo el historial? Esta acción no se puede deshacer.")) {
        setAllImages([]);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-brand-gray w-full max-w-4xl h-[90vh] rounded-lg shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-brand-light-gray flex justify-between items-center">
          <h2 className="text-xl font-bold">Historial de Generación</h2>
          <div>
            <button onClick={clearHistory} className="text-sm text-red-400 hover:text-red-300 mr-4">
                Borrar Todo
            </button>
            <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto">
          {recentHistory.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">No hay historial de imágenes.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentHistory.map(image => (
                <div key={image.id} className="group relative">
                  <img src={image.url} alt={image.prompt} className="w-full h-auto object-cover rounded-md aspect-square" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-end p-2 text-white">
                    <p className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate" title={image.prompt}>
                      {image.prompt}
                    </p>
                    <button 
                      onClick={() => deleteImage(image.id)} 
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                      title="Eliminar imagen"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;