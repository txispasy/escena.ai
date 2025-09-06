import React, { useState, useCallback } from 'react';
import { VISUAL_STYLES, ASPECT_RATIOS, GENERATION_MODES, MAX_SCENES } from '../constants';
import type { VisualStyle, AspectRatio, GenerationMode, GeneratorMode, GeneratedImage } from '../types';
import { optimizePrompt } from '../services/promptService';
import useLocalStorage from '../hooks/useLocalStorage';
import ImageCard from './ImageCard';
import Spinner from './Spinner';
import Tabs from './ui/Tabs';
import { generateImages } from '../services/geminiService';

interface OptimizationModalState {
  isOpen: boolean;
  original: string;
  optimized: string;
}

const Generator = () => {
  const [mode, setMode] = useState<GeneratorMode>('Simple');
  const [scenes, setScenes] = useState<string[]>(['']);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState<VisualStyle>('Artistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('Horizontal');
  const [genMode, setGenMode] = useState<GenerationMode>('Calidad');
  const [variants, setVariants] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  
  const [optimizationModal, setOptimizationModal] = useState<OptimizationModalState>({
    isOpen: false,
    original: '',
    optimized: '',
  });

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const [allImages, setAllImages] = useLocalStorage<GeneratedImage[]>('imageData', []);

  const handleSceneChange = (index: number, value: string) => {
    const newScenes = [...scenes];
    newScenes[index] = value;
    setScenes(newScenes);
  };
  
  const handleNegativePromptChange = (value: string) => {
    setNegativePrompt(value);
  }

  const addScene = () => {
    if (scenes.length < MAX_SCENES) {
      setScenes([...scenes, '']);
    }
  };

  const executeImageGeneration = useCallback(async (basePrompt: string, originalPrompt: string) => {
    if (isLoading) return;
    
    if (!basePrompt.trim()) {
        alert("Por favor describe lo que quieres crear.");
        return;
    }

    setOptimizationModal(prev => ({ ...prev, isOpen: false }));
    setIsLoading(true);
    setGeneratedImages([]);

    try {
        const imageUrls = await generateImages(
            basePrompt,
            variants,
            aspectRatio,
            style,
            mode === 'Pro' ? negativePrompt : undefined
        );

        const allNewImages: GeneratedImage[] = imageUrls.map(url => ({
            id: crypto.randomUUID(),
            url: url,
            prompt: originalPrompt,
            enhancedPrompt: basePrompt, // Storing the prompt before negative was added
            style: style,
            timestamp: Date.now(),
            aspectRatio: aspectRatio,
            isPublic: false,
            votes: 0,
        }));

        setGeneratedImages(allNewImages);

        if (allNewImages.length > 0) {
            setAllImages(prevImages => [...allNewImages, ...prevImages]);
        }

        if (allNewImages.length < variants) {
            alert(`Se generaron ${allNewImages.length} de ${variants} imágenes. Algunas fallaron.`);
        }

    } catch (error) {
        console.error("Error during image generation process:", error);
        alert("Ocurrió un error al generar las imágenes. Por favor, inténtalo de nuevo.");
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, style, aspectRatio, variants, setAllImages, negativePrompt, mode]);


  const startGenerationProcess = useCallback(() => {
    if (isLoading) return;

    const originalBasePrompt = mode === 'Simple' ? scenes[0] : scenes.filter(s => s.trim() !== '').join('. ');
    
    if (!originalBasePrompt.trim()) {
        alert("Por favor describe lo que quieres crear primero.");
        return;
    }

    // Always optimize and show modal for user choice
    let enhancedPrompt = optimizePrompt(originalBasePrompt, style);
    if (genMode === 'Calidad') {
        enhancedPrompt += ', masterpiece, best quality, highly detailed';
    }
    
    setOptimizationModal({
        isOpen: true,
        original: originalBasePrompt,
        optimized: enhancedPrompt,
    });
  }, [isLoading, mode, scenes, style, genMode]);


  const addToGallery = (image: GeneratedImage) => {
    const existingImage = allImages.find(i => i.id === image.id);
    if (existingImage && existingImage.isPublic) {
        return;
    }

    setAllImages(prevImages =>
        prevImages.map(img =>
            img.id === image.id
                ? { ...img, isPublic: true, votes: img.votes ?? 0 }
                : img
        )
    );
  };

  const addToRanking = (image: GeneratedImage) => {
    addToGallery(image);
  };
  
  const totalPromptLength = scenes.reduce((acc, s) => acc + s.length, 0);
  const activeColorClass = mode === 'Simple' ? 'bg-brand-pink' : 'bg-brand-purple';

  return (
    <div className="space-y-8">
      <Tabs
        activeTab={mode}
        onTabChange={(tab) => {
          setMode(tab as GeneratorMode);
          if (tab === 'Simple' && scenes.length > 1) setScenes([scenes[0]]);
        }}
        tabs={['Simple', 'Pro']}
      />

      {/* Prompts Section */}
      <div className="bg-brand-gray p-6 rounded-lg space-y-4">
        {mode === 'Simple' ? (
          <div>
            <label htmlFor="simple-prompt" className="block text-sm font-medium text-gray-300 mb-2">
              Describe lo que quieres crear (o una idea simple)
              <span className="text-gray-400 text-xs ml-2"> (mejor en Inglés)</span>
            </label>
            <div className="relative">
              <textarea
                id="simple-prompt"
                value={scenes[0]}
                onChange={(e) => handleSceneChange(0, e.target.value)}
                className="w-full bg-brand-light-gray rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-brand-pink border-transparent focus:border-transparent resize-none"
                rows={3}
                placeholder="Ej: Un astronauta montando a caballo en Marte, estilo fotorealista"
                maxLength={500}
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {scenes[0].length} / 500
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe las escenas de tu historia (hasta {MAX_SCENES})
                <span className="text-gray-400 text-xs ml-2"> (mejor en Inglés)</span>
              </label>
              {scenes.map((scene, index) => (
                <div key={index} className="relative mb-2">
                  <textarea
                    value={scene}
                    onChange={(e) => handleSceneChange(index, e.target.value)}
                    className="w-full bg-brand-light-gray rounded-md p-3 pr-10 text-gray-200 focus:ring-2 focus:ring-brand-purple border-transparent focus:border-transparent resize-none"
                    rows={2}
                    placeholder={`Escena ${index + 1}...`}
                    maxLength={300}
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {scene.length} / 300
                  </div>
                </div>
              ))}
              {scenes.length < MAX_SCENES && (
                <button
                  onClick={addScene}
                  disabled={isLoading}
                  className="text-sm text-brand-purple hover:text-fuchsia-400 disabled:opacity-50"
                >
                  + Añadir Escena
                </button>
              )}
            </div>
            <div>
              <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                Negative Prompt (elementos a evitar)
              </label>
              <input
                id="negative-prompt"
                type="text"
                value={negativePrompt}
                onChange={(e) => handleNegativePromptChange(e.target.value)}
                className="w-full bg-brand-light-gray rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-brand-purple border-transparent"
                placeholder="Ej: texto, mala anatomía, borroso"
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Estilo Visual</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {VISUAL_STYLES.map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                disabled={isLoading}
                className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 text-center ${
                  style === s ? (activeColorClass + ' text-white') : 'bg-brand-gray text-gray-300 hover:bg-brand-light-gray'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Formato</label>
            <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} disabled={isLoading} className="w-full bg-brand-gray p-2 rounded-md border border-brand-light-gray focus:ring-2 focus:ring-brand-purple">
              {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="variants" className="block text-sm font-medium text-gray-300 mb-2">Variantes</label>
            <input id="variants" type="number" min="1" max="4" value={variants} onChange={(e) => setVariants(Math.max(1, Math.min(4, parseInt(e.target.value, 10) || 1)))} disabled={isLoading} className="w-full bg-brand-gray p-2 rounded-md border border-brand-light-gray focus:ring-2 focus:ring-brand-purple" />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-4 bg-brand-gray p-2 rounded-lg max-w-sm mx-auto">
          <span className="text-sm font-medium text-gray-300">Calidad:</span>
          {GENERATION_MODES.map(gm => (
            <button
              key={gm}
              onClick={() => setGenMode(gm)}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 ${genMode === gm ? (activeColorClass + ' text-white') : 'bg-brand-light-gray text-gray-400 hover:bg-opacity-80'}`}
            >
              {gm}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-center pt-4">
        <button
          onClick={startGenerationProcess}
          disabled={isLoading}
          className={`w-full max-w-md mx-auto py-3 px-6 rounded-lg text-lg font-bold text-white transition-all transform hover:scale-105 shadow-lg ${activeColorClass} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Generando...' : 'Generar'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          La generación de imágenes puede tardar hasta 1 minuto.
        </p>
      </div>
      
      {isLoading && <Spinner />}

      {generatedImages.length > 0 && !isLoading && (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Resultados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generatedImages.map(image => (
                    <ImageCard 
                        key={image.id}
                        image={image}
                        showActions={true}
                        onAddToGallery={() => addToGallery(image)}
                        onAddToRanking={() => addToRanking(image)}
                    />
                ))}
            </div>
        </div>
      )}

      {optimizationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
          <div className="bg-brand-gray w-full max-w-lg rounded-lg shadow-xl p-6">
            <h3 className="text-xl font-bold mb-2">Optimizar Prompt</h3>
            <p className="text-gray-400 mb-4">Hemos mejorado tu idea para obtener mejores resultados. ¿Qué versión prefieres usar?</p>
            <div className="space-y-4">
                <div>
                    <label className="text-sm text-gray-400">Tu Idea Original:</label>
                    <p className="bg-brand-light-gray p-2 rounded-md max-h-24 overflow-y-auto">{optimizationModal.original}</p>
                </div>
                <div>
                    <label className="text-sm text-gray-400">Idea Optimizada (en Inglés):</label>
                    <p className="bg-brand-light-gray p-2 rounded-md font-mono text-sm max-h-32 overflow-y-auto">{optimizationModal.optimized}</p>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setOptimizationModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 rounded-md bg-brand-light-gray hover:bg-opacity-80 text-white">
                    Cancelar
                </button>
                <button 
                  onClick={() => {
                    let originalWithQuality = optimizationModal.original;
                    if (genMode === 'Calidad') {
                        originalWithQuality += ', masterpiece, best quality, highly detailed';
                    }
                    executeImageGeneration(originalWithQuality, optimizationModal.original);
                  }} 
                  className="px-4 py-2 rounded-md text-white bg-gray-500 hover:bg-gray-600 transition-colors"
                >
                    Usar Original
                </button>
                <button onClick={() => executeImageGeneration(optimizationModal.optimized, optimizationModal.original)} className={`px-4 py-2 rounded-md text-white transition-colors ${activeColorClass}`}>
                    Usar Optimizada
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generator;