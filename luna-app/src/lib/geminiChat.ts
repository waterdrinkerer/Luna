// src/lib/geminiChat.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getGeminiResponse(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `You are Moonie, a helpful and supportive chatbot inside a period tracking app.
You assist users with questions about menstrual cycles, symptoms, moods, ovulation, PMS, and period care.
Always give gentle, clear, and accurate answers in a friendly tone, like a caring big sister.`;

    const fullPrompt = `${systemInstruction}\nUser: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return "Sorry, Moonie is having trouble right now 🌙";
  }
}
