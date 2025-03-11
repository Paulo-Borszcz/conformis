import { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, ThreadChannel, TextChannel, EmbedBuilder, CommandInteraction, ChannelType } from "discord.js";
import { Config } from "../utils/config";
import { Ticket, TicketForm } from "../models/Ticket";
import { Logger } from "../utils/logger";

export class DiscordService {
  private client: Client;
  private logger: Logger;

  constructor(client: Client, logger: Logger) {
    this.client = client;
    this.logger = logger;
  }

  createQuestionModal(): { modal: ModalBuilder; actionRow: ActionRowBuilder<TextInputBuilder>[] } {
    const modal = new ModalBuilder().setCustomId("questionModal").setTitle("Formulário de Problema de Plantão");

    const descricaoInput = new TextInputBuilder().setCustomId("descricaoProblema").setLabel("Descreva o Problema").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const departamentoInput = new TextInputBuilder().setCustomId("vistoComDepartamento").setLabel("Já foi visto com o dpto responsável?").setStyle(TextInputStyle.Short).setRequired(true);

    const sistemaInput = new TextInputBuilder().setCustomId("sistemaECaminho").setLabel("Sistema, caminho e operação realizada").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const filialInput = new TextInputBuilder().setCustomId("filialUsuarioDF").setLabel("Filial, Usuário e DF do Cliente").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const logInput = new TextInputBuilder().setCustomId("logDeErro").setLabel("Retornou algum LOG de erro?").setStyle(TextInputStyle.Paragraph).setRequired(false);

    const actionRows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(descricaoInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(departamentoInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(sistemaInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(filialInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(logInput),
    ];

    actionRows.forEach((row) => {
      modal.addComponents(row);
    });

    return { modal, actionRow: actionRows };
  }

  extractFormData(interaction: ModalSubmitInteraction): TicketForm {
    return {
      descricaoProblema: interaction.fields.getTextInputValue("descricaoProblema"),
      vistoComDepartamento: interaction.fields.getTextInputValue("vistoComDepartamento"),
      sistemaECaminho: interaction.fields.getTextInputValue("sistemaECaminho"),
      filialUsuarioDF: interaction.fields.getTextInputValue("filialUsuarioDF"),
      logDeErro: interaction.fields.getTextInputValue("logDeErro"),
    };
  }

  async createTicketThread(interaction: ModalSubmitInteraction, ticket: Ticket): Promise<ThreadChannel> {
    try {
      if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
        throw new Error("O comando deve ser usado em um canal de texto de servidor");
      }

      const threadName = `Plantão: ${ticket.username} - ${new Date().toLocaleString("pt-BR")}`;

      const thread = await interaction.channel.threads.create({
        name: threadName,
        autoArchiveDuration: 60,
        reason: `Ticket de plantão criado por ${ticket.username}`,
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`Ticket de Plantão: ${ticket.id}`)
        .setAuthor({ name: ticket.username, iconURL: interaction.user.displayAvatarURL() })
        .addFields(
          { name: "Descrição do Problema", value: ticket.form.descricaoProblema },
          { name: "Visto com Departamento", value: ticket.form.vistoComDepartamento },
          { name: "Sistema e Caminho", value: ticket.form.sistemaECaminho },
          { name: "Filial, Usuário e DF", value: ticket.form.filialUsuarioDF }
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${ticket.id}` });

      if (ticket.form.logDeErro && ticket.form.logDeErro.trim() !== "") {
        ticketEmbed.addFields({ name: "Log de Erro", value: ticket.form.logDeErro });
      }

      await thread.send({ embeds: [ticketEmbed] });

      await thread.send(`<@${ticket.userId}> seu ticket foi criado. Acompanhe as atualizações neste tópico.`);

      return thread;
    } catch (error) {
      this.logger.error("Erro ao criar thread de ticket", error);
      throw error;
    }
  }

  async sendNotification(ticket: Ticket): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(Config.DISCORD_NOTIFICATION_CHANNEL_ID);

      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error("Canal de notificação não encontrado ou não é um canal de texto");
      }

      const notificationEmbed = new EmbedBuilder()
        .setColor(0xff9900)
        .setTitle("Novo Ticket de Plantão")
        .setDescription(`<@${ticket.userId}> criou um novo ticket de plantão`)
        .addFields({ name: "ID do Ticket", value: ticket.id }, { name: "Thread", value: ticket.threadId ? `<#${ticket.threadId}>` : "Não disponível" })
        .setTimestamp();

      await channel.send({ embeds: [notificationEmbed] });
    } catch (error) {
      this.logger.error("Erro ao enviar notificação", error);
    }
  }

  async addSimilarTicketsToThread(ticket: Ticket): Promise<void> {
    if (!ticket.threadId || !ticket.similarTickets || ticket.similarTickets.length === 0) {
      return;
    }

    try {
      const thread = await this.client.channels.fetch(ticket.threadId);

      if (!thread || !(thread instanceof ThreadChannel)) {
        throw new Error("Thread do ticket não encontrado");
      }

      const similarTicketsEmbed = new EmbedBuilder().setColor(0x00ff99).setTitle("Tickets Similares Encontrados").setDescription("Encontramos os seguintes tickets similares que podem ajudar a resolver este problema:").setTimestamp();

      ticket.similarTickets.slice(0, 5).forEach((similarTicket, index) => {
        similarTicketsEmbed.addFields({
          name: `👉 Ticket Similar #${index + 1}`,
          value: `[Link para o tópico](https://discord.com/channels/${Config.DISCORD_GUILD_ID}/${similarTicket.threadId})\n⚡ Similaridade: ${(similarTicket.similarity * 100).toFixed(2)}%`,
        });
      });

      await thread.send({ embeds: [similarTicketsEmbed] });
    } catch (error) {
      this.logger.error("Erro ao adicionar tickets similares ao thread", error);
    }
  }
}
