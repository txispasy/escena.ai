export type VisualStyle = 'Pixar' | 'Realistic' | 'Fantasy' | 'Creepy' | 'Comic' | 'Anime' | '3D Disney' | 'Cinematic';
export type AspectRatio = 'Horizontal' | 'Vertical';
export type GenerationMode = 'Calidad' | 'Rápido';
export type GeneratorMode = 'Simple' | 'Pro';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt: string;
  style: VisualStyle;
  timestamp: number;
  aspectRatio: AspectRatio;
}

export interface GalleryImage extends GeneratedImage {
  votes: number;
}
