import { GoogleGenAI } from "@google/genai";

// This function takes a simple idea and fleshes it out into a detailed description.
export const getDetailedDescription = async (idea: string): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY is not set in environment variables.");
        return idea;
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const systemInstruction = `You are a creative writer. Take the user's simple idea and expand it into a vivid, descriptive, and detailed scene description for an image.
        Focus on visual elements, atmosphere, and mood.
        Respond with ONLY the detailed description. Do not add any extra text, explanation, or pleasantries.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User idea: "${idea}"`,
            config: {
                systemInstruction,
                temperature: 0.8,
            }
        });

        const enhanced = response.text.trim();
        return enhanced.replace(/^"(.*)"$/, '$1');

    } catch (error) {
        console.error('Error getting detailed description with Gemini:', error);
        return idea;
    }
};

// This function optimizes a finalized prompt for an image generator like Perchance (Stable Diffusion based).
export const optimizePrompt = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY is not set in environment variables.");
        return prompt;
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are an expert prompt engineer for AI image generators that use models similar to Stable Diffusion.
        Optimize the following prompt to create a more visually stunning and coherent image.
        Add keywords related to composition, art style, lighting, and detail.
        Make it specific. For example, instead of 'a robot', say 'a weathered, rusted android'.
        Structure the prompt with comma-separated keywords and phrases.
        Respond with ONLY the optimized prompt.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Prompt to optimize: "${prompt}"`,
            config: {
                systemInstruction,
                temperature: 0.7,
            }
        });
        
        const optimized = response.text.trim();
        return optimized.replace(/^"(.*)"$/, '$1');

    } catch (error) {
        console.error('Error optimizing prompt with Gemini:', error);
        return prompt;
    }
};
