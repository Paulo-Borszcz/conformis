import { Client } from "discord.js";
import { Logger } from "../utils/logger";
import { GeminiService } from "./GeminiService";
import { ImageDescriptionService } from "./ImageDescriptionService";
import { ImageHandlerService } from "./discord/ImageHandlerService";
import { ModalService } from "./discord/ModalService";
// Importa o NotificationService (que agora é o orquestrador)
import { NotificationService } from "./discord/NotificationService";
import { SimilarTicketsService } from "./discord/SimilarTicketsService";
import { ThreadService } from "./discord/ThreadService";
import { Ticket } from "../models/Ticket";
import { TicketFormHelper } from "./discord/TicketFormHelper";

export class DiscordService {
  private client: Client;
  private logger: Logger;
  private geminiService: GeminiService;
  private imageDescriptionService: ImageDescriptionService;

  private imageHandlerService: ImageHandlerService;
  private modalService: ModalService;
  private threadService: ThreadService;
  // Mantém a instância do NotificationService (orquestrador)
  private notificationService: NotificationService;
  private similarTicketsService: SimilarTicketsService;

  constructor(client: Client, logger: Logger, geminiService: GeminiService, imageDescriptionService: ImageDescriptionService) {
    this.client = client;
    this.logger = logger;
    this.geminiService = geminiService;
    this.imageDescriptionService = imageDescriptionService;

    this.imageHandlerService = new ImageHandlerService(logger, imageDescriptionService);
    this.modalService = new ModalService();
    this.threadService = new ThreadService(logger);
    this.notificationService = new NotificationService(logger);
    this.similarTicketsService = new SimilarTicketsService(logger, geminiService);

    this.client.on("messageCreate", (message) => {
      this.imageHandlerService.handleImageMessage(message, this.client.user?.id);
    });
  }

  createQuestionModal() {
    return this.modalService.createQuestionModal();
  }

  extractFormData(interaction: any) {
    return TicketFormHelper.extractFormData(interaction);
  }

  async createTicketThread(interaction: any, ticket: Ticket) {
    return this.threadService.createTicketThread(interaction, ticket);
  }

  async sendNotifications(ticket: Ticket): Promise<void> {
    if (!ticket || !ticket.threadId) {
      this.logger.warn(`[DiscordService] Tentativa de enviar notificações para ticket inválido ou sem threadId. Ticket Data: ${JSON.stringify(ticket)}`);
      return;
    }
    this.logger.info(`[DiscordService] Solicitando envio de notificações para ticket ${ticket.threadId}`);
    await this.notificationService.sendNotificationsForNewTicket(this.client, ticket);
  }

  async addSimilarTicketsToThread(ticket: Ticket) {
    return this.similarTicketsService.addSimilarTicketsToThread(this.client, ticket);
  }
}
