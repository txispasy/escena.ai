import { GoogleGenAI } from "@google/genai";
import type { AspectRatio, VisualStyle } from '../types';

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to map app's aspect ratio to Gemini's supported values
const getGeminiAspectRatio = (ratio: AspectRatio): '16:9' | '9:16' => {
  switch (ratio) {
    case 'Horizontal':
      return '16:9';
    case 'Vertical':
      return '9:16';
    default:
        return '16:9';
  }
};

/**
 * Generates images using the Google Gemini API.
 * @param prompt The text prompt for image generation.
 * @param numberOfImages The number of images to generate.
 * @param aspectRatio The desired aspect ratio for the images.
 * @param style The visual style for the images (used for prompt optimization before this function is called).
 * @param negativePrompt An optional negative prompt.
 * @returns An array of base64 data URLs for the generated images.
 */
export const generateImages = async (
  prompt: string,
  numberOfImages: number,
  aspectRatio: AspectRatio,
  style: VisualStyle, // Kept for signature compatibility, not used directly as style is in the pre-optimized prompt
  negativePrompt?: string,
): Promise<string[]> => {
  console.log(`Generating ${numberOfImages} image(s) with Gemini for prompt: "${prompt}"`);

  let fullPrompt = prompt;
  if (negativePrompt && negativePrompt.trim()) {
    // Append the negative prompt to the main prompt for the API
    fullPrompt += `. Avoid the following: ${negativePrompt.trim()}`;
  }

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          aspectRatio: getGeminiAspectRatio(aspectRatio),
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        console.error("Gemini API returned no images.");
        return [];
    }
    
    const imageUrls = response.generatedImages.map(img => {
        const base64ImageBytes: string = img.image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    });
    
    console.log(`Successfully generated ${imageUrls.length} image(s) from Gemini.`);
    return imageUrls;

  } catch (error) {
    console.error(`Error generating images with Gemini:`, error);
    return [];
  }
};