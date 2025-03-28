import { ModalSubmitInteraction, ThreadChannel } from "discord.js";
import { Ticket, TicketForm } from "../models/Ticket";
import { DiscordService } from "./DiscordService";
import { EmbeddingService } from "./EmbeddingService";
import { PineconeService } from "./PineconeService";
import { Logger } from "../utils/logger";
import { RedactionService } from "./RedactionService";
import { GeminiService } from "./GeminiService";

export class TicketService {
  private discordService: DiscordService;
  private embeddingService: EmbeddingService;
  private pineconeService: PineconeService;
  private logger: Logger;
  private redactionService: RedactionService;
  private geminiService: GeminiService;

  constructor(discordService: DiscordService, embeddingService: EmbeddingService, pineconeService: PineconeService, logger: Logger, redactionService: RedactionService, geminiService: GeminiService) {
    this.discordService = discordService;
    this.embeddingService = embeddingService;
    this.pineconeService = pineconeService;
    this.logger = logger;
    this.redactionService = redactionService;
    this.geminiService = geminiService;
  }

  async processTicketCreation(interaction: ModalSubmitInteraction): Promise<void> {
    try {
      const formData = this.discordService.extractFormData(interaction);

      const ticket = new Ticket(interaction.user.id, interaction.user.username, formData);

      await interaction.reply({
        content: "Seu ticket está sendo processado, aguarde um momento...",
        ephemeral: true,
      });

      const thread = await this.discordService.createTicketThread(interaction, ticket);
      ticket.setThreadId(thread.id);

      await this.discordService.sendNotification(ticket);

      const embeddings = await this.embeddingService.generateEmbeddings(ticket);
      ticket.setEmbeddings(embeddings);

      await this.pineconeService.storeTicketEmbeddings(ticket);

      const similarTickets = await this.pineconeService.findSimilarTickets(ticket);
      ticket.setSimilarTickets(similarTickets);

      await this.discordService.addSimilarTicketsToThread(ticket);

      await interaction.editReply({
        content: `Seu ticket foi criado com sucesso! Acompanhe o tópico: <#${thread.id}>`,
      });

      this.logger.info(`Ticket ${ticket.id} processado com sucesso`);
    } catch (error) {
      this.logger.error("Erro ao processar ticket", error);

      try {
        await interaction.editReply({
          content: "Ocorreu um erro ao processar seu ticket. Por favor, tente novamente ou contate um administrador.",
        });
      } catch (replyError) {
        this.logger.error("Erro ao enviar resposta de erro", replyError);
      }
    }
  }
}
