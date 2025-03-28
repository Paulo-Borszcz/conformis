import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private logger: Logger;

  constructor(logger: Logger) {
    if (!Config.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    this.genAI = new GoogleGenerativeAI(Config.GEMINI_API_KEY);
    this.logger = logger;
  }

  async generateCaseSummary(text: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const prompt = `Resuma o problema técnico relatado mantendo apenas informações essenciais.
        Remova dados sensíveis como CPF, cartões e endereços (mantenha informações como número do pedido "PV" e número do atendimento). Texto: ${text.substring(0, 5000)}`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.logger.error("Erro no GeminiService", error);
      return "Resumo indisponível";
    }
  }
}
