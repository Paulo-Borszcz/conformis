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
    let thread: ThreadChannel | null = null;
    let ticket: Ticket | null = null;

    try {
      const formData = this.discordService.extractFormData(interaction);
      ticket = new Ticket(interaction.user.id, interaction.user.username, formData);

      await interaction.reply({
        content: "Seu ticket está sendo processado, aguarde um momento...",
        ephemeral: true,
      });

      thread = await this.discordService.createTicketThread(interaction, ticket);
      if (!thread) {
        throw new Error("Falha ao criar a thread do ticket.");
      }
      ticket.setThreadId(thread.id);

      await this.discordService.sendNotifications(ticket);

      const embeddings = await this.embeddingService.generateEmbeddings(ticket);
      ticket.setEmbeddings(embeddings);

      await this.pineconeService.storeTicketEmbeddings(ticket);

      const similarTickets = await this.pineconeService.findSimilarTickets(ticket);
      ticket.setSimilarTickets(similarTickets);

      await this.discordService.addSimilarTicketsToThread(ticket);

      await interaction.editReply({
        content: `Seu ticket foi criado com sucesso! Acompanhe o tópico: <#${thread.id}>`,
      });

      this.logger.info(`Ticket ${ticket.threadId} processado com sucesso para usuário ${ticket.userId}`);
    } catch (error) {
      this.logger.error("Erro ao processar criação de ticket:", error);

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({
            content: "Ocorreu um erro inesperado ao processar seu ticket. A equipe foi notificada. Por favor, tente novamente mais tarde ou contate um administrador se o problema persistir.",
          });
        } else {
          await interaction.reply({
            content: "Ocorreu um erro inesperado ao processar seu ticket. A equipe foi notificada.",
            ephemeral: true,
          });
        }
      } catch (replyError) {
        this.logger.error("Erro adicional ao tentar enviar mensagem de erro ao usuário:", replyError);
      }
    }
  }
}
