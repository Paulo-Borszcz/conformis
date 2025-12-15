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
}
