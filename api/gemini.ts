import { GoogleGenAI } from "@google/genai";

// This file is a Vercel Serverless Function that runs on the server.
// It securely handles the API key and proxies requests to the Gemini API.

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { prompt, operation } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !operation) {
        return new Response(JSON.stringify({ error: 'Missing or invalid prompt or operation' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable is not set on the server.");
        return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        let systemInstruction = '';
        if (operation === 'describe') {
            systemInstruction = `You are a creative writer. Take the user's simple idea and expand it into a vivid, descriptive, and detailed scene description for an image.
            Focus on visual elements, atmosphere, and mood.
            Respond with ONLY the detailed description. Do not add any extra text, explanation, or pleasantries.`;
        } else if (operation === 'optimize') {
            systemInstruction = `You are an expert prompt engineer for AI image generators. Your task is to take a user's prompt, which may be in Spanish, and transform it into a highly effective, detailed prompt in English.

            1. **Complete the Idea:** If the user's prompt is a simple idea, first expand it into a more complete and descriptive scene. Add vivid details about the subject, setting, and atmosphere.
            2. **Enhance with Keywords:** Add powerful keywords related to composition (e.g., 'cinematic shot', 'wide angle'), art style (e.g., 'photorealistic', 'fantasy art'), lighting (e.g., 'dramatic lighting', 'soft light'), and detail/quality (e.g., 'masterpiece', '8k', 'highly detailed', 'trending on ArtStation').
            3. **Translate to English:** Translate the entire, fully enhanced prompt into English.
            4. **Final Output:** Respond with ONLY the final, optimized English prompt. Do not include the original prompt, any explanations, or any introductory text.`;
        } else {
             return new Response(JSON.stringify({ error: 'Invalid operation' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User prompt: "${prompt}"`,
            config: {
                systemInstruction,
                temperature: 0.8,
            }
        });

        const text = response.text.trim().replace(/^"(.*)"$/, '$1');

        return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return new Response(JSON.stringify({ error: 'Failed to get response from AI model.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}