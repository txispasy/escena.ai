// This function calls our own serverless function, which then calls the Gemini API securely.

const callGeminiApi = async (prompt: string, operation: 'describe' | 'optimize'): Promise<string> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, operation }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        return data.text;

    } catch (error) {
        console.error(`Error during Gemini API call for operation "${operation}":`, error);
        // Return the original prompt as a fallback
        return prompt;
    }
}


// This function takes a simple idea and fleshes it out into a detailed description.
export const getDetailedDescription = async (idea: string): Promise<string> => {
    if (!idea.trim()) return idea;
    return callGeminiApi(idea, 'describe');
};

// This function optimizes a finalized prompt for an image generator.
export const optimizePrompt = async (prompt: string): Promise<string> => {
    if (!prompt.trim()) return prompt;
    return callGeminiApi(prompt, 'optimize');
};
