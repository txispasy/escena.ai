import type { VisualStyle } from '../types';

// This is a client-side prompt engineering utility.
// It wraps the user's prompt in a sophisticated, style-specific English template
// to leverage the image generator's native style understanding more effectively.

const styleTemplates: Record<VisualStyle, (prompt: string) => string> = {
    'Artistic': (p) => `An artistic painting of "${p}", beautiful composition, dynamic lighting, intricate details, concept art, trending on artstation.`,
    'Realistic': (p) => `A photorealistic ultra-detailed photograph of "${p}", 8k, sharp focus, professional color grading, shot on a DSLR camera with a 50mm lens.`,
    'Anime': (p) => `A beautiful anime scene of "${p}", in the style of Studio Ghibli and Makoto Shinkai, vibrant colors, detailed background, cinematic lighting.`,
    'Cartoon': (p) => `A playful cartoon illustration of "${p}", in the style of modern western animation, bold outlines, vibrant colors, expressive characters.`,
    'Fantasy': (p) => `An epic fantasy book cover illustration of "${p}". Features majestic landscapes, mythical creatures, elaborate armor, and magical elements.`,
    'Sci-Fi': (p) => `A futuristic sci-fi concept art of "${p}". Features advanced technology, sleek designs, neon lights, and a cyberpunk or space opera aesthetic.`,
    'Abstract': (p) => `An abstract piece of art representing "${p}". Features geometric shapes, bold colors, non-representational forms, and a focus on texture and composition.`,
    '3D Model': (p) => `A high-quality 3D model render of "${p}", created with Blender and rendered in Octane. Features realistic materials, detailed textures, and studio lighting.`,
    'Pixel Art': (p) => `A detailed pixel art scene of "${p}", 16-bit, vibrant color palette, reminiscent of classic SNES games, trending on itch.io.`
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
    
    // Fallback for any style not in the template record
    const templateBuilder = styleTemplates[style] || ((p) => p);
    
    // Build the prompt from the template
    return templateBuilder(prompt.trim());
};