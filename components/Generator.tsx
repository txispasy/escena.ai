import React, { useState, useCallback } from 'react';
import { VISUAL_STYLES, ASPECT_RATIOS, GENERATION_MODES, MAX_SCENES } from '../constants';
import type { VisualStyle, AspectRatio, GenerationMode, GeneratorMode, GeneratedImage, GalleryImage } from '../types';
import { getDetailedDescription, optimizePrompt } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';
import ImageCard from './ImageCard';
import Spinner from './Spinner';
import Tabs from './ui/Tabs';

interface OptimizationModalState {
  isOpen: boolean;
  isOptimizing: boolean;
  original: string;
  optimized: string;
}

const Generator = () => {
  const [mode, setMode] = useState<GeneratorMode>('Simple');
  const [scenes, setScenes] = useState<string[]>(['']);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState<VisualStyle>('Pixar');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('Horizontal');
  const [genMode, setGenMode] = useState<GenerationMode>('Calidad');
  const [variants, setVariants] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  
  const [optimizationModal, setOptimizationModal] = useState<OptimizationModalState>({
    isOpen: false,
    isOptimizing: false,
    original: '',
    optimized: '',
  });

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const [, setHistory] = useLocalStorage<GeneratedImage[]>('imageHistory', []);
  const [gallery, setGallery] = useLocalStorage<GalleryImage[]>('imageGallery', []);

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

  const handleImproveIdea = useCallback(async () => {
    if (isImproving || !scenes[0]) return;
    setIsImproving(true);
    try {
      const improved = await getDetailedDescription(scenes[0]);
      handleSceneChange(0, improved);
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al mejorar la idea.');
    } finally {
      setIsImproving(false);
    }
  }, [isImproving, scenes]);
  

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
        const stylePromptMap: Record<VisualStyle, (p: string) => string> = {
            'Pixar': p => `a 3D render of ${p}, in the style of Pixar, disney style, vibrant colors, animation`,
            'Realistic': p => `a photorealistic image of ${p}, hyperrealistic, 8k, ultra detailed, photography`,
            'Fantasy': p => `a fantasy art painting of ${p}, masterpiece, epic, by Greg Rutkowski, trending on ArtStation`,
            'Creepy': p => `a creepy, unsettling image of ${p}, horror style, dark, by Zdzisław Beksiński, surreal`,
            'Comic': p => `a comic book illustration of ${p}, marvel comics style, pop art, graphic novel`,
            'Anime': p => `an anime artwork of ${p}, manga style, masterpiece, by Makoto Shinkai, Studio Ghibli`,
            '3D Disney': p => `a Disney animation style rendering of ${p}, 3d, vibrant, character design`,
            'Cinematic': p => `a cinematic shot of ${p}, movie still, dramatic lighting, film grain`
        };

        let finalPrompt = stylePromptMap[style](basePrompt) || basePrompt;

        if (genMode === 'Calidad') {
            finalPrompt += ', masterpiece, best quality, highly detailed';
        }
        if (mode === 'Pro' && negativePrompt) {
            finalPrompt += ` --neg ${negativePrompt}`;
        }
        
        const generationPromises = Array.from({ length: variants }).map((_, i) => {
          const [width, height] = aspectRatio === 'Horizontal' ? [768, 512] : [512, 768];
          const seed = Math.floor(Math.random() * 1000000000) + i;
          
          const encodedPrompt = encodeURIComponent(finalPrompt);
          const targetUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
          const API_URL = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

          return fetch(API_URL)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
                }
                return res.blob();
            })
            .then(blob => {
                return new Promise<GeneratedImage>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        if (typeof base64data !== 'string') {
                            return reject(new Error("Failed to read blob as data URL."));
                        }
                        const newImage: GeneratedImage = {
                            id: crypto.randomUUID(),
                            url: base64data,
                            prompt: originalPrompt,
                            enhancedPrompt: finalPrompt,
                            style: style,
                            timestamp: Date.now(),
                            aspectRatio: aspectRatio,
                        };
                        resolve(newImage);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            });
      });

      const results = await Promise.allSettled(generationPromises);
      const newImages: GeneratedImage[] = [];

      results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
              newImages.push(result.value);
          } else if (result.status === 'rejected') {
              console.error("Image generation failed:", result.reason);
          }
      });

      if (newImages.length < variants && newImages.length > 0) {
          alert("Algunas imágenes no se pudieron generar. Las que sí se generaron se muestran a continuación.");
      } else if (newImages.length === 0 && variants > 0) {
          throw new Error("Todas las imágenes fallaron al generarse. Revisa la consola para más detalles.");
      }

      setGeneratedImages(newImages);
      if (newImages.length > 0) {
          setHistory(prevHistory => [...newImages, ...prevHistory]);
      }

    } catch (error) {
        console.error("Error during image generation process:", error);
        alert("Ocurrió un error al generar las imágenes. Por favor, inténtalo de nuevo.");
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, mode, scenes, negativePrompt, style, aspectRatio, genMode, variants, setHistory]);


  const startGenerationProcess = useCallback(async () => {
    if (isLoading || optimizationModal.isOptimizing) return;

    const originalBasePrompt = mode === 'Simple' ? scenes[0] : scenes.filter(s => s.trim() !== '').join('. ');
    
    if (!originalBasePrompt.trim()) {
        alert("Por favor describe lo que quieres crear primero.");
        return;
    }

    setOptimizationModal({
        isOpen: true,
        isOptimizing: true,
        original: originalBasePrompt,
        optimized: '',
    });

    try {
        const optimized = await optimizePrompt(originalBasePrompt);
        setOptimizationModal(prev => ({
            ...prev,
            isOptimizing: false,
            optimized: optimized,
        }));
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al optimizar el prompt. Puedes continuar con el original.');
        setOptimizationModal(prev => ({
            ...prev,
            isOptimizing: false,
            optimized: prev.original,
        }));
    }
  }, [isLoading, optimizationModal.isOptimizing, mode, scenes]);


  const addToGallery = (image: GeneratedImage) => {
    if (gallery.some(g => g.id === image.id)) return;
    setGallery(prev => [...prev, { ...image, votes: 0 }]);
  };

  const addToRanking = (image: GeneratedImage) => {
    addToGallery(image);
  };
  
  const totalPromptLength = scenes.reduce((acc, s) => acc + s.length, 0);

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
            </label>
            <div className="relative">
              <textarea
                id="simple-prompt"
                rows={4}
                className="w-full bg-brand-light-gray rounded-md p-3 pr-12 focus:ring-2 focus:ring-brand-pink focus:outline-none transition"
                placeholder="e.g., Un robot encuentra una flor en una ciudad post-apocalíptica"
                value={scenes[0]}
                onChange={(e) => handleSceneChange(0, e.target.value)}
                maxLength={4000}
              />
              <button
                  onClick={handleImproveIdea}
                  disabled={isImproving || !scenes[0]}
                  title="Mejorar idea"
                  className="absolute top-3 right-3 text-gray-400 hover:text-brand-pink disabled:opacity-50 disabled:cursor-not-allowed transition p-1"
              >
                  {isImproving ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 3.5l-12 12" /><path d="M22 6.5l-1.5-1.5" /><path d="M20 8.5l-1.5-1.5" /><path d="M16 4.5l-1.5-1.5" /><path d="M18 2.5l-1.5-1.5" /><path d="M12.5 11.5L9 8" /><path d="M7 13.5l-1.5-1.5" /><path d="M5 15.5l-1.5-1.5" />
                      </svg>
                  )}
              </button>
            </div>
            <p className="text-right text-xs text-gray-400 mt-1">{scenes[0].length}/4000</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe tus escenas (hasta {MAX_SCENES})
            </label>
            {scenes.map((scene, index) => (
              <div key={index} className="mb-3">
                <textarea
                  rows={2}
                  className="w-full bg-brand-light-gray rounded-md p-3 focus:ring-2 focus:ring-brand-pink focus:outline-none transition"
                  placeholder={`Escena ${index + 1}: ej., Un robot encuentra una flor`}
                  value={scene}
                  onChange={(e) => handleSceneChange(index, e.target.value)}
                  maxLength={4000 / scenes.length}
                />
              </div>
            ))}
            {scenes.length < MAX_SCENES && (
              <button
                onClick={addScene}
                className="w-full text-center py-2 border-2 border-dashed border-gray-600 rounded-md text-brand-pink hover:bg-brand-light-gray transition"
              >
                + Añadir Otra Escena
              </button>
            )}
             <p className="text-right text-xs text-gray-400 mt-1">{totalPromptLength}/4000</p>
          </div>
        )}

        {mode === 'Pro' && (
          <div>
            <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300 mb-2">
              Prompt Negativo (opcional)
            </label>
            <textarea
              id="negative-prompt"
              rows={2}
              className="w-full bg-brand-light-gray rounded-md p-3 focus:ring-2 focus:ring-brand-purple focus:outline-none transition"
              placeholder="ej., mala anatomía, deformado, texto, marcas de agua"
              value={negativePrompt}
              onChange={(e) => handleNegativePromptChange(e.target.value)}
              maxLength={1000}
            />
            <p className="text-right text-xs text-gray-400 mt-1">{negativePrompt.length}/1000</p>
          </div>
        )}
      </div>

      {/* Style & Settings Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Estilo Visual</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VISUAL_STYLES.map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`py-3 px-4 rounded-lg transition font-medium text-sm ${
                  style === s ? 'bg-blue-500 ring-2 ring-blue-300' : 'bg-brand-gray hover:bg-brand-light-gray'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Aspect Ratio</h3>
            <div className="flex bg-brand-gray rounded-lg p-1">
              {ASPECT_RATIOS.map(ar => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`w-1/2 py-2 rounded-md transition text-sm font-semibold ${
                    aspectRatio === ar ? 'bg-fuchsia-600' : 'hover:bg-brand-light-gray'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Modo de Generación</h3>
            <div className="flex bg-brand-gray rounded-lg p-1">
              {GENERATION_MODES.map(gm => (
                <button
                  key={gm}
                  onClick={() => setGenMode(gm)}
                  className={`w-1/2 py-2 rounded-md transition text-sm font-semibold ${
                    genMode === gm ? 'bg-fuchsia-600' : 'hover:bg-brand-light-gray'
                  }`}
                >
                  {gm}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Variantes por Escena</h3>
            <select
              value={variants}
              onChange={(e) => setVariants(parseInt(e.target.value, 10))}
              className="w-full bg-brand-gray rounded-lg p-1 py-2 px-3 focus:ring-2 focus:ring-brand-pink focus:outline-none"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
        </div>
      </div>
      
      <button
        onClick={startGenerationProcess}
        disabled={isLoading || optimizationModal.isOptimizing}
        className="w-full py-4 text-lg font-bold rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Generando...' : `Generar ${variants * (mode === 'Simple' ? 1 : scenes.filter(s => s.trim()).length || 1)} Imágenes`}
      </button>

      {/* Results Section */}
      {isLoading && <Spinner />}
      {!isLoading && generatedImages.length > 0 && (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {generatedImages.map(image => (
              <ImageCard 
                key={image.id}
                image={image}
                onAddToGallery={() => addToGallery(image)}
                onAddToRanking={() => addToRanking(image)}
                showActions={true}
              />
            ))}
        </div>
      )}

      {/* Optimization Modal */}
      {optimizationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-brand-gray w-full max-w-2xl rounded-lg shadow-xl flex flex-col p-6 space-y-4">
                <h2 className="text-2xl font-bold">Optimización de Prompt</h2>
                {optimizationModal.isOptimizing ? (
                    <div className="text-center py-8">
                        <Spinner />
                        <p className="mt-4 text-gray-300">Optimizando tu prompt con IA...</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-400">Hemos optimizado tu prompt. Elige cuál quieres usar para generar tus imágenes.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400">Original</label>
                                <p className="mt-1 p-3 bg-brand-dark rounded-md text-sm text-gray-300 h-32 overflow-y-auto">{optimizationModal.original}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400">Optimizado</label>
                                <p className="mt-1 p-3 bg-brand-dark rounded-md text-sm text-white h-32 overflow-y-auto">{optimizationModal.optimized}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => executeImageGeneration(optimizationModal.original, optimizationModal.original)}
                                className="w-full py-3 rounded-md transition font-semibold bg-brand-light-gray hover:bg-gray-700"
                            >
                                Continuar con el Original
                            </button>
                            <button 
                                onClick={() => executeImageGeneration(optimizationModal.optimized, optimizationModal.original)}
                                className="w-full py-3 rounded-md transition font-semibold bg-brand-purple hover:bg-purple-800"
                            >
                                Usar Prompt Optimizado
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Generator;