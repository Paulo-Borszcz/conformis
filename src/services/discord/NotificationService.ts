import { Client } from "discord.js";
import { Ticket } from "../../models/Ticket";
import { Logger } from "../../utils/logger";
import { StandardTicketNotificationService } from "./NotificationServices/StandardTicketNotificationService";
import { ShiftTicketNotificationService } from "./NotificationServices/ShiftTicketNotificationService";

export class NotificationService {
  private logger: Logger;
  private standardNotifier: StandardTicketNotificationService;
  private shiftNotifier: ShiftTicketNotificationService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.standardNotifier = new StandardTicketNotificationService(logger);
    this.shiftNotifier = new ShiftTicketNotificationService(logger);
  }

  async sendNotificationsForNewTicket(client: Client, ticket: Ticket): Promise<void> {
    if (!ticket || !ticket.threadId) {
      this.logger.warn("Tentativa de enviar notificação sem ticket ou threadId válidos.");
      return;
    }
    this.logger.info(`Orquestrando notificações para o ticket ${ticket.threadId}`);

    const notificationPromises = [this.standardNotifier.send(client, ticket), this.shiftNotifier.send(client, ticket)];

    const results = await Promise.allSettled(notificationPromises);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const notifierName = index === 0 ? "Standard" : "Shift";
        this.logger.error(`Falha ao enviar notificação do tipo ${notifierName}:`, result.reason);
      }
    });

    this.logger.info(`Orquestração de notificações para o ticket ${ticket.threadId} concluída.`);
  }
}
