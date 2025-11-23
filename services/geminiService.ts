import { GoogleGenAI, Type, Schema } from "@google/genai";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey });
};

// FAST TASK: Validate Player ID using Flash-Lite or Flash
export const validatePlayerId = async (playerId: string): Promise<{ isValid: boolean; message: string }> => {
    try {
        const client = getClient();
        const prompt = `
            Check if this PUBG Mobile Player ID is valid: "${playerId}".
            Rules:
            1. Must be numeric.
            2. Length between 5 and 15 digits.
            
            Return JSON.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isValid: { type: Type.BOOLEAN },
                        message: { type: Type.STRING, description: "Short reason if invalid, or 'Valid' if valid" }
                    },
                    required: ["isValid", "message"]
                }
            }
        });

        const result = JSON.parse(response.text || '{"isValid": false, "message": "AI Error"}');
        return result;
    } catch (e) {
        // Fallback checks if AI fails
        const isNumeric = /^\d+$/.test(playerId);
        return {
            isValid: isNumeric && playerId.length >= 5 && playerId.length <= 15,
            message: isNumeric ? "Valid Format" : "Invalid Format"
        };
    }
};

// COMPLEX TASK: Analyze the result of the redemption attempt using Pro
export const analyzeRedemptionResult = async (
    websiteOutputText: string, 
    playerId: string, 
    productName: string
): Promise<{ success: boolean; userNotification: string }> => {
    try {
        const client = getClient();
        const prompt = `
            You are the intelligence engine of a game redemption bot.
            The bot attempted to redeem "${productName}" for Player ID "${playerId}".
            
            The website returned this raw text/message:
            """
            ${websiteOutputText}
            """
            
            Analyze this text carefully.
            1. Did the redemption succeed? (Look for keywords like "Success", "Redeemed", "Sent", "OK").
            2. Write a notification message for the user in the same language as the website text (or English if mixed).
            
            Return JSON.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-3-pro-preview', // Pro model for better reasoning on unstructured text
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        success: { type: Type.BOOLEAN },
                        userNotification: { type: Type.STRING }
                    },
                    required: ["success", "userNotification"]
                }
            }
        });

        return JSON.parse(response.text || '{"success": false, "userNotification": "Analysis Failed"}');
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return { success: false, userNotification: "Could not verify transaction status via AI." };
    }
};

export const parseProductCSV = async (csvText: string): Promise<Array<{name: string, price: number, redeemCode: string, imageUrl?: string | null}>> => {
    try {
        const client = getClient();
        const prompt = `
            Extract product information from this raw text data into a JSON array.
            Each product must have a name, price, and redeemCode.
            
            Data:
            ${csvText.slice(0, 30000)}
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            price: { type: Type.NUMBER },
                            redeemCode: { type: Type.STRING },
                            imageUrl: { type: Type.STRING, nullable: true }
                        },
                        required: ["name", "price", "redeemCode"]
                    }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (error) {
        console.error("Gemini CSV Parse Error:", error);
        return [];
    }
};
