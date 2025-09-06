import type { VisualStyle } from '../types';

// This is a client-side prompt engineering utility.
// It wraps the user's prompt in a sophisticated, style-specific English template
// to leverage the image generator's native style understanding more effectively.

const styleTemplates: Record<VisualStyle, (prompt: string) => string> = {
    'Pixar': (p) => `A 3D render of "${p}", in the iconic style of a Disney Pixar animation. Features vibrant colors, soft lighting, and detailed, expressive character design.`,
    'Realistic': (p) => `An ultra-detailed, photorealistic 8k photograph of "${p}". Shot with a professional camera, featuring sharp focus, perfect composition, and cinematic lighting.`,
    'Fantasy': (p) => `An epic fantasy digital painting of "${p}". In the style of fantasy art legends like Greg Rutkowski, dramatic lighting, highly detailed, trending on ArtStation.`,
    'Creepy': (p) => `A creepy, unsettling, surreal horror style artwork depicting "${p}". Ominous, atmospheric lighting, dark themes, in the style of Zdzisław Beksiński.`,
    'Comic': (p) => `A vibrant comic book panel illustrating "${p}", in the classic style of Marvel or DC Comics. Features bold lines, dynamic action, and graphic novel aesthetics.`,
    'Anime': (p) => `A beautiful, high-quality anime artwork of "${p}", reminiscent of the style of Makoto Shinkai or Studio Ghibli. Features beautiful scenery and emotional lighting.`,
    '3D Disney': (p) => `A charming 3D render of "${p}", in the modern Disney animation style. Features smooth textures, vibrant colors, and a heartwarming feel.`,
    'Cinematic': (p) => `A cinematic film still of "${p}". Features dramatic, moody lighting, high contrast, film grain, and masterful composition. The scene feels like it was pulled from a blockbuster movie.`
};

/**
 * Optimizes a user's prompt by wrapping it in a style-specific, high-quality English template.
 * This function runs entirely on the client-side.
 * @param prompt The user's original prompt (can be in any language).
 * @param style The selected visual style.
 * @returns An enhanced, English-based prompt ready for the image generator.
 */
export const optimizePrompt = (prompt: string, style: VisualStyle): string => {
    if (!prompt.trim()) return '';
    
    const templateBuilder = styleTemplates[style] || ((p) => p);
    
    // Build the prompt from the template and add universal quality enhancers.
    return `${templateBuilder(prompt.trim())}, masterpiece, best quality, ultra-detailed`;
};
