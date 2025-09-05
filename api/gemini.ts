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
            systemInstruction = `You are an expert prompt engineer for AI image generators.
            Optimize the following prompt to create a more visually stunning and coherent image.
            Add keywords related to composition, art style, lighting, and detail.
            Structure the prompt with comma-separated keywords and phrases.
            Respond with ONLY the optimized prompt.`;
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
