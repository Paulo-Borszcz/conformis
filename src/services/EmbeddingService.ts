import OpenAI from "openai";
import { Config } from "../utils/config";
import { Ticket, TicketEmbedding } from "../models/Ticket";
import { Logger } from "../utils/logger";

export class EmbeddingService {
  private openai: OpenAI;
  private logger: Logger;

  constructor(logger: Logger) {
    this.openai = new OpenAI({
      apiKey: Config.OPENAI_API_KEY,
    });
    this.logger = logger;
  }

  async generateEmbeddings(ticket: Ticket): Promise<TicketEmbedding[]> {
    try {
      const ticketText = ticket.toText();

      const chunks = this.splitTextIntoChunks(ticketText);

      const embeddings: TicketEmbedding[] = [];

      for (const chunk of chunks) {
        const response = await this.openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk,
        });

        embeddings.push({
          embedding: response.data[0].embedding,
          content: chunk,
        });
      }

      this.logger.info(`Gerado ${embeddings.length} embeddings para o ticket ${ticket.id}`);
      return embeddings;
    } catch (error) {
      this.logger.error("Erro ao gerar embeddings", error);
      throw error;
    }
  }

  private splitTextIntoChunks(text: string, maxChunkSize: number = 4000): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = "";

    const lines = text.split("\n");

    for (const line of lines) {
      if ((currentChunk + line).length > maxChunkSize) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? "\n" : "") + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}
