import { Logger } from "../utils/logger";

export class RedactionService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  redactSensitiveInfo(text: string): string {
    try {
      let redacted = text.replace(/(\d{3}[\.\-]?){3}\d{2}/g, "[REDACTED_CPF]");

      redacted = redacted.replace(/\b(?:\d[ \-.]*){13,19}\b/g, "[REDACTED_CREDIT_CARD]");

      redacted = redacted.replace(/(Rua|Av\.|Avenida|Travessa|Praça)\s[\w\s]+\s+(\d+)/gi, "[REDACTED_ADDRESS]");

      return redacted;
    } catch (error) {
      this.logger.error("Erro na redação de informações", error);
      return text;
    }
  }
}
