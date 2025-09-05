import type { VisualStyle } from '../types';

// This is a client-side prompt engineering utility.
// It enhances prompts with style-specific keywords known to improve image generation results.

const styleEnhancers: Record<VisualStyle, string> = {
    'Pixar': '3d render, disney pixar style, vibrant colors, animation, soft lighting, detailed character',
    'Realistic': 'photorealistic, 8k, ultra detailed, photography, sharp focus, masterpiece, professional lighting',
    'Fantasy': 'fantasy art, masterpiece, epic, by Greg Rutkowski, trending on ArtStation, dramatic, cinematic',
    'Creepy': 'creepy, unsettling, horror style, dark, by Zdzisław Beksiński, surreal, ominous lighting',
    'Comic': 'comic book illustration, marvel comics style, graphic novel art, pop art, vibrant, bold lines',
    'Anime': 'anime artwork, manga style, masterpiece, by Makoto Shinkai, Studio Ghibli, beautiful scenery',
    '3D Disney': 'disney animation style, 3d character rendering, vibrant, charming, smooth textures',
    'Cinematic': 'cinematic shot, movie still, dramatic lighting, film grain, high contrast, masterpiece, best quality'
};

/**
 * Optimizes a user's prompt by appending style-specific keywords.
 * This function runs entirely on the client-side.
 * @param prompt The user's original prompt.
 * @param style The selected visual style.
 * @returns An enhanced prompt with added keywords.
 */
export const optimizePrompt = (prompt: string, style: VisualStyle): string => {
    if (!prompt.trim()) return '';
    
    const enhancer = styleEnhancers[style] || '';
    
    // Combine the original prompt with the enhancer keywords.
    // We add a comma if the original prompt doesn't end with one.
    const separator = prompt.trim().endsWith(',') ? ' ' : ', ';
    
    return `${prompt.trim()}${separator}${enhancer}`;
};
