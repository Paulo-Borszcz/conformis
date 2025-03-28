import { EmbedBuilder, ThreadChannel, ModalSubmitInteraction, ChannelType } from "discord.js";
import { Ticket } from "../../models/Ticket";
import { COLORS, EMOJI } from "../../constants/discordConstants";
import { Logger } from "../../utils/logger";

export class ThreadService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async createTicketThread(interaction: ModalSubmitInteraction, ticket: Ticket): Promise<ThreadChannel> {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      throw new Error("O comando deve ser usado em um canal de texto de servidor");
    }

    try {
      const threadName = `${EMOJI.TICKET} Plantão: ${ticket.username} - ${new Date().toLocaleString("pt-BR")}`;

      const thread = await interaction.channel.threads.create({
        name: threadName,
        autoArchiveDuration: 60,
        reason: `Ticket de plantão criado por ${ticket.username}`,
      });

      const ticketEmbed = this.buildTicketEmbed(interaction, ticket);

      await thread.send({ embeds: [ticketEmbed] });

      const welcomeEmbed = new EmbedBuilder().setColor(COLORS.INFO).setDescription(`${EMOJI.INFO} <@${ticket.userId}> seu ticket foi criado com sucesso! Nossa equipe irá analisar seu problema em breve.\n\n` + `${EMOJI.WAITING} **Status:** Aguardando atendimento`);
      await thread.send({ embeds: [welcomeEmbed] });

      return thread;
    } catch (error) {
      this.logger.error("Erro ao criar thread de ticket", error);
      throw error;
    }
  }

  private buildTicketEmbed(interaction: ModalSubmitInteraction, ticket: Ticket): EmbedBuilder {
    const formattedDate = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.NEW_TICKET)
      .setTitle(`${EMOJI.TICKET} Ticket de Plantão`)
      .setDescription(`**Aberto por:** \`${ticket.username}\`\n` + `**Data:** \`${formattedDate}\`\n\n` + `*Este ticket está aguardando atendimento.*`)
      .setAuthor({
        name: ticket.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: `${EMOJI.INFO} Descrição do Problema`,
          value: `\`${this.formatFieldValue(ticket.form.descricaoProblema)}\``,
          inline: false,
        },
        {
          name: `${EMOJI.DEPARTMENT} Visto com Departamento`,
          value: `\`${this.formatFieldValue(ticket.form.vistoComDepartamento)}\``,
          inline: true,
        },
        {
          name: `${EMOJI.SYSTEM} Sistema e Caminho`,
          value: `\`${this.formatFieldValue(ticket.form.sistemaECaminho)}\``,
          inline: false,
        },
        {
          name: `${EMOJI.BRANCH} Filial, Usuário, Código do Erro...`,
          value: `\`${this.formatFieldValue(ticket.form.filialUsuarioDF)}\``,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `ID: ${ticket.id} • Responda neste tópico para atualizar o ticket`,
        iconURL: "https://cdn.discordapp.com/emojis/1037045204016918669.webp",
      });

    if (ticket.form.logDeErro && ticket.form.logDeErro.trim() !== "") {
      embed.addFields({
        name: `${EMOJI.ERROR_LOG} Log de Erro`,
        value: `\`\`\`\n${this.trimText(ticket.form.logDeErro, 1024)}\n\`\`\``,
        inline: false,
      });
    }

    return embed;
  }

  private formatFieldValue(value: string): string {
    if (!value || value.trim() === "") {
      return "*Não informado*";
    }
    return this.trimText(value, 1024);
  }

  private trimText(text: string, maxLength: number): string {
    if (!text) return "*Não informado*";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}
