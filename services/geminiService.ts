
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  mejorarPrompt: async (contenido: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un experto ingeniero de prompts. Mejora este prompt para que sea más efectivo, detallado y profesional. Devuelve solo el texto del prompt.\n\nPrompt: ${contenido}`,
    });
    return response.text?.trim() || contenido;
  },

  analizarCalidad: async (contenido: string): Promise<{ score: number, feedback: string, tono: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza la calidad de este prompt de IA. Evalúa del 1 al 10 basándote en especificidad, contexto y claridad. Proporciona un consejo breve de mejora y detecta el tono predominante.\n\nPrompt: ${contenido}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            tono: { type: Type.STRING }
          },
          required: ["score", "feedback", "tono"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{"score": 5, "feedback": "No se pudo analizar", "tono": "Neutral"}');
    } catch (e) {
      return { score: 0, feedback: 'Error de análisis', tono: 'Desconocido' };
    }
  },

  autoEtiquetar: async (contenido: string): Promise<{ categoria: string, etiquetas: string[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza este prompt. Categoría (1 palabra) y etiquetas (máx 5). JSON format.\n\nContenido: ${contenido}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoria: { type: Type.STRING },
            etiquetas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["categoria", "etiquetas"]
        }
      }
    });
    return JSON.parse(response.text || '{"categoria": "General", "etiquetas": []}');
  },

  generarDesdeIdea: async (idea: string): Promise<{ titulo: string, contenido: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Convierte esta idea en un prompt profesional y creativo con un título.\n\nIdea: ${idea}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            contenido: { type: Type.STRING }
          },
          required: ["titulo", "contenido"]
        }
      }
    });
    return JSON.parse(response.text || '{"titulo": "Nuevo Prompt", "contenido": ""}');
  }
};
