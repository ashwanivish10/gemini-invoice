
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ExtractedItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function to convert File to a Gemini Part
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const extractInvoiceDataFromImage = async (imageFile: File): Promise<ExtractedItem[]> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const textPart = {
        text: `Analyze the provided image of an invoice or a list. Extract each line item.
        For each item, identify the date and the quantity.
        - The date can be in various formats (e.g., '11 Oct 2025', '11/10/25'). Standardize it to 'DD Mon YYYY' format if possible.
        - The quantity might be a number like '1' or a calculation like '1+1'. If it's a calculation, sum the numbers to get the total quantity for that line.
        
        Return the data as a valid JSON array of objects. Each object must have two keys: "date" (string) and "quantity" (string). Do not include any other text or markdown formatting in your response.
        Example response for an image with two lines, one with '11/10/25' and quantity '1', and another with '12/10/25' and quantity '1+1':
        [{"date": "11 Oct 2025", "quantity": "1"}, {"date": "12 Oct 2025", "quantity": "2"}]
        `
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: {
                      type: Type.STRING,
                      description: 'The date of the item, formatted as DD Mon YYYY.',
                    },
                    quantity: {
                      type: Type.STRING,
                      description: 'The quantity of the item, summed up if it is an expression like "1+1".',
                    },
                  },
                  required: ["date", "quantity"],
                },
            },
        },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString) as ExtractedItem[];
    return parsedData;

  } catch (error) {
    console.error("Error extracting data from image with Gemini:", error);
    throw new Error("Failed to analyze image. Please ensure it's a clear image of an invoice or list.");
  }
};
