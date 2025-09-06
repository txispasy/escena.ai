import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { GalleryImage } from '../types';
import ImageCard from './ImageCard';

const Ranking = () => {
  const [gallery, setGallery] = useLocalStorage<GalleryImage[]>('imageGallery', []);

  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentImages = gallery.filter(image => (now - image.timestamp) < NINETY_DAYS_MS);

  const sortedImages = [...recentImages].sort((a, b) => b.votes - a.votes);

  const handleVote = (id: string, delta: number) => {
    setGallery(currentGallery => 
      currentGallery.map(image => 
        image.id === id ? { ...image, votes: (image.votes || 0) + delta } : image
      )
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-purple">
        Clasificación
      </h1>
      <p className="text-gray-400 mb-8">Vota por tus imágenes favoritas. Las más votadas aparecen primero.</p>
      
      {sortedImages.length === 0 ? (
         <div className="text-center py-20 bg-brand-gray rounded-lg">
          <p className="text-gray-400">No hay imágenes en la clasificación.</p>
          <p className="text-gray-500 text-sm">Guarda imágenes en la galería para que aparezcan aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedImages.map(image => (
            <div key={image.id} className="bg-brand-gray rounded-lg p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-shrink-0 w-full md:w-auto">
                <ImageCard image={image} showActions={false} className="md:w-64"/>
              </div>
              <div className="flex-grow text-center md:text-left">
                <p className="text-gray-400 text-sm truncate" title={image.prompt}>
                  Prompt: {image.prompt}
                </p>
                <p className="text-gray-300 text-sm">
                  Estilo: {image.style}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleVote(image.id, -1)} 
                  className="p-2 rounded-full bg-brand-light-gray hover:bg-red-500 transition-all transform hover:scale-110"
                  title="Votar en contra"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.484.062l4.256 1.696A2 2 0 0118 7.234v6.032a2 2 0 01-2 2h-3m-3 4V14m-3 4H5a2 2 0 01-2-2v-2" />
                  </svg>
                </button>
                <span className="text-2xl font-bold w-12 text-center">{image.votes}</span>
                <button 
                  onClick={() => handleVote(image.id, 1)} 
                  className="p-2 rounded-full bg-brand-light-gray hover:bg-green-500 transition-all transform hover:scale-110"
                  title="Votar a favor"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.018a2 2 0 01-1.995-1.858L5 7m5 3v6m4-6H9a2 2 0 00-2 2v6a2 2 0 002 2h.5" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Ranking;