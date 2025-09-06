import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { GeneratedImage } from '../types';
import ImageCard from './ImageCard';

const Gallery = () => {
  const [allImages] = useLocalStorage<GeneratedImage[]>('imageData', []);

  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const publicImages = allImages.filter(image => image.isPublic);
  const recentImages = publicImages.filter(image => (now - image.timestamp) < NINETY_DAYS_MS);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-purple">
        Galería
      </h1>
      <p className="text-gray-400 mb-8">Tus imágenes guardadas. Las imágenes se eliminan después de 90 días.</p>

      {recentImages.length === 0 ? (
        <div className="text-center py-20 bg-brand-gray rounded-lg">
          <p className="text-gray-400">Tu galería está vacía.</p>
          <p className="text-gray-500 text-sm">Genera algunas imágenes y guárdalas aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recentImages.map(image => (
            <ImageCard key={image.id} image={image} showActions={false} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;