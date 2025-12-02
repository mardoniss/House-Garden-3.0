import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
// Note: In a real production app, API calls should be proxied through a backend to protect the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIssueDescription = async (
  title: string,
  location: string,
  priority: string
): Promise<string> => {
  try {
    const prompt = `
      Você é um assistente técnico de engenharia civil experiente.
      Gere uma descrição técnica detalhada e profissional para uma não-conformidade (pendência) de obra.
      
      Dados:
      - Problema: ${title}
      - Local: ${location}
      - Prioridade: ${priority}

      A descrição deve ser concisa, indicar a ação corretiva necessária e usar terminologia técnica adequada.
      Responda apenas com o texto da descrição.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a descrição.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com o assistente de IA.";
  }
};