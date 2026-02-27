import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider {
  static async gerarPerguntas(linguagem: string, tags: string[], dificuldade: number) {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY não configurada no servidor.");
    }

    const prompt = `
      Gere 10 perguntas de programação de nível ${dificuldade} para a linguagem ${linguagem}.
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

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "Você é um arquiteto de software sênior focado em educação. Responda apenas com o JSON solicitado.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Robust JSON extraction
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);
      return parsed.perguntas || [];
    } catch (parseError) {
      console.error("Failed to parse Groq response:", content);
      throw new Error("A IA retornou um formato inválido. Tentando novamente...");
    }
  }
}
