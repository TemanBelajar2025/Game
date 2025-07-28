
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

import type { SceneData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        sceneDescription: {
            type: Type.STRING,
            description: "A vivid, 2-3 paragraph description of the current scene in the text adventure game."
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A detailed, artistic prompt for an image generation model that captures the scene's essence. Focus on visual details like lighting, atmosphere, character appearance, and environment."
        },
        choices: {
            type: Type.ARRAY,
            items: { 
                type: Type.STRING,
                description: "A concise action the player can take, starting with a verb."
            },
            description: "An array of exactly 3 possible actions the player can take next."
        },
    },
    required: ["sceneDescription", "imagePrompt", "choices"]
};

const parseJsonResponse = (response: GenerateContentResponse): SceneData | null => {
    try {
        const jsonText = response.text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonText);
        // Basic validation
        if (data && data.sceneDescription && data.imagePrompt && Array.isArray(data.choices) && data.choices.length > 0) {
            return data as SceneData;
        }
        console.error("Parsed JSON does not match SceneData structure", data);
        return null;
    } catch (error) {
        console.error("Failed to parse JSON response:", error);
        console.error("Raw text from API:", response.text);
        return null;
    }
}

export const generateInitialScene = async (): Promise<SceneData> => {
    const prompt = `
        You are a master storyteller creating a dynamic text adventure game.
        Generate the very first scene of a fantasy adventure.
        Describe the scene vividly in about 2-3 paragraphs.
        Based on the scene, create a detailed, artistic prompt for an image generation model that captures the essence of the scene. This prompt should focus on visual details like lighting, atmosphere, character appearance, and environment.
        Finally, provide exactly 3 possible actions the player can take next. The actions should be concise, starting with a verb.
        Your response MUST conform to the provided JSON schema.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const sceneData = parseJsonResponse(response);
    if (!sceneData) {
        throw new Error("Failed to generate a valid initial scene from the API.");
    }
    return sceneData;
};

export const generateNextScene = async (storyHistory: string[], choice: string): Promise<SceneData> => {
    const historyText = storyHistory.map((s, i) => `Scene ${i+1}:\n${s}`).join('\n---\n');
    const prompt = `
        You are a master storyteller continuing a dynamic text adventure game.
        Here is the story so far, with each entry being a new scene:
        ${historyText}

        The player just chose to: "${choice}"

        Now, do the following:
        1. Write the next part of the story, describing the outcome of the player's action and the new situation they are in. Describe the scene vividly in 2-3 paragraphs.
        2. Based on this new scene, create a detailed, artistic prompt for an image generation model. This prompt should focus on visual details like lighting, atmosphere, character appearance, and environment.
        3. Provide exactly 3 new, concise actions the player can take. The actions must be different from previous choices and relevant to the new scene. Each action should start with a verb.
        Your response MUST conform to the provided JSON schema.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const sceneData = parseJsonResponse(response);
    if (!sceneData) {
        throw new Error("Failed to generate a valid next scene from the API.");
    }
    return sceneData;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `masterpiece, high quality, fantasy art, cinematic lighting. ${prompt}`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("Failed to generate image.");
};
