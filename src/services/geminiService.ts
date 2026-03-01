import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getGasLawExplanation = async (law: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Giải thích ngắn gọn về định luật ${law} trong vật lý nhiệt động lực học bằng tiếng Việt.`,
  });
  return response.text;
};
