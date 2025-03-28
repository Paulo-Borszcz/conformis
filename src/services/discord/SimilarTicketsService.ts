import { EmbedBuilder, ThreadChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Ticket } from "../../models/Ticket";
import { GeminiService } from "../GeminiService";
import { Logger } from "../../utils/logger";
import { Config } from "../../utils/config";
import { COLORS, EMOJI } from "../../constants/discordConstants";
import { blockQuote } from "@discordjs/formatters";

export class SimilarTicketsService {
  private logger: Logger;
  private geminiService: GeminiService;

  constructor(logger: Logger, geminiService: GeminiService) {
    this.logger = logger;
    this.geminiService = geminiService;
  }

  async addSimilarTicketsToThread(client: any, ticket: Ticket): Promise<void> {
    if (!ticket.threadId || !ticket.similarTickets || ticket.similarTickets.length === 0) {
      return;
    }

    try {
      const thread = await client.channels.fetch(ticket.threadId);
      if (!thread || !(thread instanceof ThreadChannel)) {
        throw new Error("Thread do ticket não encontrado");
      }

      ticket.similarTickets.sort((a, b) => b.similarity - a.similarity);

      const similarTicketsEmbed = new EmbedBuilder()
        .setColor(COLORS.SIMILAR_TICKETS)
        .setTitle(`${EMOJI.SIMILAR} Tickets Similares Encontrados`)
        .setDescription("Encontramos os seguintes tickets que podem estar relacionados ao seu problema. " + "Confira se algum deles já possui a solução que você procura.")
        .setTimestamp()
        .setFooter({
          text: "Clique nos botões abaixo para acessar os tickets similares",
          iconURL: "https://cdn3.emoji.gg/emojis/69863-pengu-modcheck.gif",
        });

      const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];
      let currentRow = new ActionRowBuilder<ButtonBuilder>();

      const maxItems = 10;
      const length = Math.min(ticket.similarTickets.length, maxItems);

      for (let i = 0; i < length; i++) {
        const similarTicket = ticket.similarTickets[i];

        const summary = await this.geminiService.generateCaseSummary(similarTicket.content);

        similarTicketsEmbed.addFields({
          name: `${i + 1}. Ticket Similar (${(similarTicket.similarity * 100).toFixed(0)}%)`,
          value: blockQuote(`\`${summary}\``),
        });

        const button = new ButtonBuilder()
          .setLabel(`Ticket #${i + 1}`)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${Config.DISCORD_GUILD_ID}/${similarTicket.threadId}`);

        if (currentRow.components.length < 3) {
          currentRow.addComponents(button);
        } else {
          actionRows.push(currentRow);
          currentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        }
      }

      if (currentRow.components.length > 0) {
        actionRows.push(currentRow);
      }

      await thread.send({
        embeds: [similarTicketsEmbed],
        components: actionRows,
      });
    } catch (error) {
      this.logger.error("Erro ao adicionar tickets similares ao thread", error);
    }
  }
}
