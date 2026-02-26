import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export class GeminiService {
  static async gerarPerguntas(linguagem: string, tags: string[], dificuldade: number) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `
      Gere 5 perguntas de programação de nível ${dificuldade} para a linguagem ${linguagem}.
      Foque nos seguintes tópicos (tags): ${tags.join(", ")}.
      As perguntas devem ser didáticas e amigáveis.
      
      Retorne estritamente um JSON seguindo este esquema:
      {
        "perguntas": [
          {
            "enunciado": "string",
            "explicacaoDidatica": "string",
            "tipo": "multipla_escolha",
            "dificuldade": number,
            "alternativas": [
              { "texto": "string", "correta": boolean }
            ],
            "tags": ["string"]
          }
        ]
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              perguntas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    enunciado: { type: Type.STRING },
                    explicacaoDidatica: { type: Type.STRING },
                    tipo: { type: Type.STRING },
                    dificuldade: { type: Type.NUMBER },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    alternativas: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          texto: { type: Type.STRING },
                          correta: { type: Type.BOOLEAN }
                        },
                        required: ["texto", "correta"]
                      }
                    }
                  },
                  required: ["enunciado", "explicacaoDidatica", "tipo", "dificuldade", "alternativas", "tags"]
                }
              }
            },
            required: ["perguntas"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      return data.perguntas || [];
    } catch (error) {
      console.error("Erro ao gerar perguntas com Gemini:", error);
      return [];
    }
  }
}
