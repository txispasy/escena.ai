import React, { useState, useCallback } from 'react';
import { VISUAL_STYLES, ASPECT_RATIOS, GENERATION_MODES, MAX_SCENES } from '../constants';
import type { VisualStyle, AspectRatio, GenerationMode, GeneratorMode, GeneratedImage, GalleryImage } from '../types';
import { optimizePrompt } from '../services/promptService';
import useLocalStorage from '../hooks/useLocalStorage';
import ImageCard from './ImageCard';
import Spinner from './Spinner';
import Tabs from './ui/Tabs';

interface OptimizationModalState {
  isOpen: boolean;
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
  
  const [optimizationModal, setOptimizationModal] = useState<OptimizationModalState>({
    isOpen: false,
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
        let finalPrompt = basePrompt;
        
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
  }, [isLoading, style, aspectRatio, variants, setHistory]);


  const startGenerationProcess = useCallback(() => {
    if (isLoading) return;

    const originalBasePrompt = mode === 'Simple' ? scenes[0] : scenes.filter(s => s.trim() !== '').join('. ');
    
    if (!originalBasePrompt.trim()) {
        alert("Por favor describe lo que quieres crear primero.");
        return;
    }

    // Client-side prompt enhancement
    let enhancedPrompt = optimizePrompt(originalBasePrompt, style);
    if (genMode === 'Calidad') {
        enhancedPrompt += ', masterpiece, best quality, highly detailed';
    }
    if (mode === 'Pro' && negativePrompt) {
        // Perchance doesn't have a standard negative prompt API via URL, 
        // but some models might interpret it. We keep it for potential compatibility.
        // It's better to guide the AI with positive phrasing in the main prompt.
    }

    setOptimizationModal({
        isOpen: true,
        original: originalBasePrompt,
        optimized: enhancedPrompt,
    });

  }, [isLoading, mode, scenes, style, genMode, negativePrompt]);


  const addToGallery = (image: GeneratedImage) => {
    if (gallery.some(g => g.id === image.id)) return;
    setGallery(prev => [...prev, { ...image, votes: 0 }]);
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
                rows={4}
                className="w-full bg-brand-light-gray rounded-md p-3 pr-4 focus:ring-2 focus:ring-brand-pink focus:outline-none transition"
                placeholder="e.g., A robot finds a flower in a post-apocalyptic city"
                value={scenes[0]}
                onChange={(e) => handleSceneChange(0, e.target.value)}
                maxLength={4000}
              />
            </div>
            <p className="text-right text-xs text-gray-400 mt-1">{scenes[0].length}/4000</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe tus escenas (hasta {MAX_SCENES})
              <span className="text-gray-400 text-xs ml-2"> (mejor en Inglés)</span>
            </label>
            {scenes.map((scene, index) => (
              <div key={index} className="mb-3">
                <textarea
                  rows={2}
                  className="w-full bg-brand-light-gray rounded-md p-3 focus:ring-2 focus:ring-brand-purple focus:outline-none transition"
                  placeholder={`Escena ${index + 1}: ej., A robot finds a flower`}
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
             <div className="pt-4">
                <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                    Prompt Negativo (opcional)
                    <span className="text-gray-400 text-xs ml-2">Describe lo que NO quieres ver en la imagen.</span>
                </label>
                <textarea
                    id="negative-prompt"
                    rows={2}
                    className="w-full bg-brand-light-gray rounded-md p-3 focus:ring-2 focus:ring-brand-purple focus:outline-none transition"
                    placeholder="ej., bad anatomy, deformed, text, watermark"
                    value={negativePrompt}
                    onChange={(e) => handleNegativePromptChange(e.target.value)}
                    maxLength={1000}
                />
                <p className="text-right text-xs text-gray-400 mt-1">{negativePrompt.length}/1000</p>
             </div>
          </div>
        )}
      </div>

      {/* Style Section */}
      <div className="bg-brand-gray p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Estilo Visual</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VISUAL_STYLES.map(s => (
            <button 
              key={s} 
              onClick={() => setStyle(s)}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                style === s 
                  ? 'bg-blue-500 border-blue-400 shadow-lg' 
                  : 'bg-brand-light-gray border-transparent hover:bg-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Generation Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-gray p-4 rounded-lg">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Aspect Ratio</label>
          <div className="flex bg-brand-light-gray p-1 rounded-md">
            {ASPECT_RATIOS.map(ar => (
              <button 
                key={ar} 
                onClick={() => setAspectRatio(ar)}
                className={`w-1/2 py-2 text-sm rounded transition-colors ${
                  aspectRatio === ar ? `${activeColorClass} text-white` : 'hover:bg-brand-gray'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-brand-gray p-4 rounded-lg">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Modo de Generación</label>
           <div className="flex bg-brand-light-gray p-1 rounded-md">
            {GENERATION_MODES.map(gm => (
              <button 
                key={gm} 
                onClick={() => setGenMode(gm)}
                className={`w-1/2 py-2 text-sm rounded transition-colors ${
                  genMode === gm ? `${activeColorClass} text-white` : 'hover:bg-brand-gray'
                }`}
              >
                {gm}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-brand-gray p-4 rounded-lg">
          <label htmlFor="variants" className="text-sm font-medium text-gray-300 mb-2 block">Variantes por Escena</label>
          <select 
            id="variants" 
            value={variants}
            onChange={(e) => setVariants(parseInt(e.target.value, 10))}
            className="w-full bg-brand-light-gray p-2.5 rounded-md focus:ring-2 focus:ring-brand-pink focus:outline-none"
          >
            {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={startGenerationProcess}
        disabled={isLoading}
        className="w-full py-4 text-lg font-bold rounded-lg bg-gradient-to-r from-brand-pink to-brand-purple hover:from-brand-pink hover:to-fuchsia-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          `Generar ${variants * (scenes.filter(s => s.trim()).length || (mode === 'Simple' && scenes[0] ? 1 : 0) ) } Imágenes`
        )}
      </button>
      
      {isLoading && <Spinner />}

      {/* Results */}
      {generatedImages.length > 0 && (
        <div className="space-y-4">
           <h2 className="text-2xl font-bold text-center">Resultados</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map(img => (
              <ImageCard 
                key={img.id} 
                image={img} 
                showActions={true} 
                onAddToGallery={() => addToGallery(img)}
                onAddToRanking={() => addToRanking(img)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optimization Modal */}
      {optimizationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
          <div className="bg-brand-gray w-full max-w-2xl rounded-lg shadow-xl flex flex-col">
            <div className="p-4 border-b border-brand-light-gray">
              <h2 className="text-xl font-bold">Optimización de Prompt</h2>
              <p className="text-sm text-gray-400">Hemos mejorado tu prompt para obtener mejores resultados. ¿Cuál quieres usar?</p>
            </div>
            <div className="p-6 space-y-4 md:space-y-0 md:flex md:gap-4 flex-grow">
                <div className="md:w-1/2">
                    <h3 className="font-semibold mb-2">Original</h3>
                    <p className="text-sm bg-brand-light-gray p-3 rounded h-32 overflow-y-auto">{optimizationModal.original}</p>
                </div>
                <div className="md:w-1/2">
                    <h3 className="font-semibold mb-2">Optimizado (en Inglés)</h3>
                    <p className="text-sm bg-brand-light-gray p-3 rounded h-32 overflow-y-auto">{optimizationModal.optimized}</p>
                </div>
            </div>
             <div className="p-4 bg-brand-light-gray/50 flex justify-end gap-3">
                 <button onClick={() => executeImageGeneration(optimizationModal.original, optimizationModal.original)} className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 transition">
                    Continuar con el Original
                 </button>
                 <button onClick={() => executeImageGeneration(optimizationModal.optimized, optimizationModal.original)} className="px-4 py-2 rounded bg-brand-purple hover:bg-purple-700 transition">
                    Usar Prompt Optimizado
                 </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Generator;