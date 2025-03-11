import { Pinecone } from "@pinecone-database/pinecone";
import { Config } from "../utils/config";
import { Ticket, TicketEmbedding } from "../models/Ticket";
import { Logger } from "../utils/logger";

export class PineconeService {
  private pinecone: Pinecone;
  private index: any;
  private logger: Logger;

  constructor(logger: Logger) {
    this.pinecone = new Pinecone({
      apiKey: Config.PINECONE_API_KEY,
    });
    this.index = this.pinecone.index(Config.PINECONE_INDEX);
    this.logger = logger;
  }

  async storeTicketEmbeddings(ticket: Ticket): Promise<void> {
    try {
      if (!ticket.embeddings || ticket.embeddings.length === 0) {
        throw new Error("Ticket não possui embeddings para armazenar");
      }

      const vectors = ticket.embeddings.map((embedding, i) => ({
        id: `${ticket.id}_${i}`,
        values: embedding.embedding,
        metadata: {
          ticketId: ticket.id,
          userId: ticket.userId,
          username: ticket.username,
          content: embedding.content,
          threadId: ticket.threadId || "",
          createdAt: ticket.createdAt.toISOString(),
        },
      }));

      await this.index.upsert(vectors);
      this.logger.info(`Armazenados ${vectors.length} embeddings para o ticket ${ticket.id} no Pinecone`);
    } catch (error) {
      this.logger.error("Erro ao armazenar embeddings no Pinecone", error);
      throw error;
    }
  }

  async findSimilarTickets(ticket: Ticket, topK: number = 3): Promise<{ id: string; threadId: string; similarity: number }[]> {
    try {
      if (!ticket.embeddings || ticket.embeddings.length === 0) {
        throw new Error("Ticket não possui embeddings para busca de similares");
      }

      const queryEmbedding = ticket.embeddings[0].embedding;
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
        filter: {
          ticketId: { $ne: ticket.id },
        },
      });

      const results = (queryResponse.matches || []).map((match: { metadata: { ticketId: any; threadId: any }; score: any }) => {
        return {
          id: match.metadata.ticketId,
          threadId: match.metadata.threadId,
          similarity: match.score,
        };
      });

      const dedupedResults: { id: string; threadId: string; similarity: number }[] = Array.from(
        results
          .reduce((map: { get: (arg0: any) => any; set: (arg0: any, arg1: any) => void }, item: { id: any; similarity: number }) => {
            const existing = map.get(item.id);
            if (!existing || item.similarity > existing.similarity) {
              map.set(item.id, item);
            }
            return map;
          }, new Map<string, (typeof results)[0]>())
          .values()
      );

      this.logger.info(`Encontrados ${dedupedResults.length} tickets similares para o ticket ${ticket.id}`);
      return dedupedResults;
    } catch (error) {
      this.logger.error("Erro ao buscar tickets similares no Pinecone", error);
      return [];
    }
  }
}
