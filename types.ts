export type VisualStyle =
  | 'Artistic'
  | 'Realistic'
  | 'Anime'
  | 'Cartoon'
  | 'Fantasy'
  | 'Sci-Fi'
  | 'Abstract'
  | '3D Model'
  | 'Pixel Art';

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
  isPublic?: boolean;
  votes?: number;
}