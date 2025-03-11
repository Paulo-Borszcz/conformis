import { Events, Interaction } from "discord.js";
import { DiscordService } from "../services/DiscordService";
import { TicketService } from "../services/TicketService";
import * as questionCommand from "../commands/question";
import { Logger } from "../utils/logger";

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(
    interaction: Interaction,
    services: {
      discordService: DiscordService;
      ticketService: TicketService;
      logger: Logger;
    }
  ) {
    const { discordService, ticketService, logger } = services;

    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "question") {
          await questionCommand.execute(interaction, discordService);
          return;
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId === "questionModal") {
          await ticketService.processTicketCreation(interaction);
          return;
        }
      }
    } catch (error) {
      logger.error("Erro ao processar interação", error);

      try {
        if (interaction.isRepliable() && !interaction.replied) {
          await interaction.reply({
            content: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
            ephemeral: true,
          });
        }
      } catch (replyError) {
        logger.error("Erro ao enviar resposta de erro", replyError);
      }
    }
  },
};
