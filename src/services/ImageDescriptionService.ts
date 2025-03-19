import { GoogleGenerativeAI } from "@google/generative-ai";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";
import axios from "axios";

export class ImageDescriptionService {
  private genAI: GoogleGenerativeAI;
  private logger: Logger;

  constructor(logger: Logger) {
    if (!Config.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    this.genAI = new GoogleGenerativeAI(Config.GEMINI_API_KEY);
    this.logger = logger;
  }

  private async fileToGenerativePart(url: string, mimeType: string): Promise<any> {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");
      return {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType,
        },
      };
    } catch (error) {
      this.logger.error("Erro ao converter imagem para GenerativePart", error);
      throw error;
    }
  }

  async generateImageDescription(imageUrl: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `Descreva esta imagem de forma curta e objetiva, em no máximo 2 ou 3 linhas. A descrição deve ser em português e sem nenhuma formatação markdown.`;

      const mimeType = imageUrl.split(".").pop() || "image/png";
      const imagePart = await this.fileToGenerativePart(imageUrl, `image/${mimeType}`);

      const response = await model.generateContent([prompt, imagePart]);
      const description = response.response.text();

      return `_${description.trim()}_`;
    } catch (error) {
      this.logger.error("Erro ao gerar descrição da imagem", error);
      return "*Não foi possível gerar uma descrição para esta imagem.*";
    }
  }
}
