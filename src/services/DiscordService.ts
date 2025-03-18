import { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, ThreadChannel, TextChannel, EmbedBuilder, CommandInteraction, ChannelType, ColorResolvable, Message, Attachment } from "discord.js";
import { blockQuote } from "@discordjs/formatters";
import { Config } from "../utils/config";
import { Ticket, TicketForm } from "../models/Ticket";
import { Logger } from "../utils/logger";
import { GeminiService } from "./GeminiService";
import { ImageDescriptionService } from "./ImageDescriptionService";

export class DiscordService {
  private client: Client;
  private logger: Logger;
  private geminiService: GeminiService;
  private imageDescriptionService: ImageDescriptionService;
  private readonly COLORS = {
    NEW_TICKET: 0x4361ee as ColorResolvable,
    NOTIFICATION: 0xff9f1c as ColorResolvable,
    SIMILAR_TICKETS: 0x2ec4b6 as ColorResolvable,
    ERROR: 0xe71d36 as ColorResolvable,
    SUCCESS: 0x06d6a0 as ColorResolvable,
    INFO: 0x3a86ff as ColorResolvable,
  };

  private readonly EMOJI = {
    TICKET: "🎫",
    ALERT: "🔔",
    ERROR: "⚠️",
    SUCCESS: "✅",
    INFO: "ℹ️",
    SIMILAR: "🔍",
    LINK: "🔗",
    WAITING: "⏳",
    DEPARTMENT: "🏢",
    SYSTEM: "💻",
    BRANCH: "🏬",
    ERROR_LOG: "📋",
  };

  constructor(client: Client, logger: Logger, geminiService: GeminiService, imageDescriptionService: ImageDescriptionService) {
    this.client = client;
    this.logger = logger;
    this.geminiService = geminiService;
    this.imageDescriptionService = imageDescriptionService;
    this.client.on("messageCreate", this.handleImageMessage.bind(this));
  }

  private async handleImageMessage(message: Message): Promise<void> {
    try {
      if (!message.channel.isThread() || !message.author) return;

      const thread = message.channel as ThreadChannel;
      if (thread.ownerId !== this.client.user?.id) return;

      const imageAttachment = message.attachments.find((attachment: Attachment) => attachment.contentType?.startsWith("image/"));

      if (imageAttachment) {
        const description = await this.imageDescriptionService.generateImageDescription(imageAttachment.url);

        await message.reply(description);
      }
    } catch (error) {
      this.logger.error("Erro ao processar mensagem com imagem", error);
    }
  }

  createQuestionModal(): { modal: ModalBuilder; actionRow: ActionRowBuilder<TextInputBuilder>[] } {
    const modal = new ModalBuilder().setCustomId("questionModal").setTitle("📝 Formulário de Problema de Plantão");

    const descricaoInput = new TextInputBuilder().setCustomId("descricaoProblema").setLabel("📄 Descreva o Problema").setPlaceholder("Explique detalhadamente o problema que está enfrentando...").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const departamentoInput = new TextInputBuilder().setCustomId("vistoComDepartamento").setLabel("🏢 Foi visto com o departamento responsável?").setPlaceholder("Sim/Não - Se sim, com qual departamento?").setStyle(TextInputStyle.Short).setRequired(true);

    const sistemaInput = new TextInputBuilder().setCustomId("sistemaECaminho").setLabel("💻 Sistema, caminho e operação realizada").setPlaceholder("Ex: WebVendas > Contas a Pagar > Lançamento de NF").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const filialInput = new TextInputBuilder().setCustomId("filialUsuarioDF").setLabel("🏬 Filial, Usuário e DF do Cliente").setPlaceholder("Ex: Filial SP01, Usuário João Silva, DF 12345").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const logInput = new TextInputBuilder().setCustomId("logDeErro").setLabel("📋 Retornou algum LOG de erro?").setPlaceholder("Cole aqui o log de erro completo, se houver").setStyle(TextInputStyle.Paragraph).setRequired(false);

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

      const threadName = `${this.EMOJI.TICKET} Plantão: ${ticket.username} - ${new Date().toLocaleString("pt-BR")}`;

      const thread = await interaction.channel.threads.create({
        name: threadName,
        autoArchiveDuration: 60,
        reason: `Ticket de plantão criado por ${ticket.username}`,
      });

      const formattedDate = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor(this.COLORS.NEW_TICKET)
        .setTitle(`${this.EMOJI.TICKET} Ticket de Plantão`)
        .setDescription(`**Aberto por:** \`${ticket.username}\`\n**Data:** \`${formattedDate}\`\n\n*Este ticket está aguardando atendimento.*`)
        .setAuthor({
          name: ticket.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .addFields(
          {
            name: `${this.EMOJI.INFO} Descrição do Problema`,
            value: `\`${this.formatFieldValue(ticket.form.descricaoProblema)}\``,
            inline: false,
          },
          {
            name: `${this.EMOJI.DEPARTMENT} Visto com Departamento`,
            value: `\`${this.formatFieldValue(ticket.form.vistoComDepartamento)}\``,
            inline: true,
          },
          {
            name: `${this.EMOJI.SYSTEM} Sistema e Caminho`,
            value: `\`${this.formatFieldValue(ticket.form.sistemaECaminho)}\``,
            inline: false,
          },
          {
            name: `${this.EMOJI.BRANCH} Filial, Usuário, Código do Erro...`,
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
        ticketEmbed.addFields({
          name: `${this.EMOJI.ERROR_LOG} Log de Erro`,
          value: `\`\`\`\n${this.trimText(ticket.form.logDeErro, 1024)}\n\`\`\``,
          inline: false,
        });
      }

      await thread.send({ embeds: [ticketEmbed] });

      const welcomeEmbed = new EmbedBuilder().setColor(this.COLORS.INFO).setDescription(`${this.EMOJI.INFO} <@${ticket.userId}> seu ticket foi criado com sucesso! Nossa equipe irá analisar seu problema em breve.\n\n${this.EMOJI.WAITING} **Status:** Aguardando atendimento`);

      await thread.send({ embeds: [welcomeEmbed] });

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

      const formattedTime = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const notificationEmbed = new EmbedBuilder()
        .setColor(this.COLORS.NOTIFICATION)
        .setTitle(`${this.EMOJI.ALERT} Novo Ticket de Plantão`)
        .setDescription(`${this.EMOJI.TICKET} **Ticket** aberto por <@${ticket.userId}> às ${formattedTime}`)
        .addFields(
          {
            name: "Sobre",
            value: "`" + this.trimText(ticket.form.descricaoProblema, 100) + "`",
            inline: false,
          },
          {
            name: "Sistema",
            value: `\`${this.trimText(ticket.form.sistemaECaminho.split(">")[0], 100) || "Não especificado"}\``,
            inline: true,
          },
          {
            name: "Filial",
            value: `\`${this.trimText(ticket.form.filialUsuarioDF.split(",")[0], 100) || "Não especificado"}\``,
            inline: true,
          },
          {
            name: `${this.EMOJI.LINK} Link Rápido`,
            value: ticket.threadId ? `[Acessar Thread](https://discord.com/channels/${Config.DISCORD_GUILD_ID}/${ticket.threadId})` : "Não disponível",
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Clique no link acima para acessar este ticket`,
          iconURL: "https://cdn.discordapp.com/emojis/1037045289081905152.webp",
        });

      await channel.send({ content: `<@&${Config.DISCORD_NOTIFICATION_CHANNEL_ID}>`, embeds: [notificationEmbed] });
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

      const similarTicketsEmbed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`${this.EMOJI.SIMILAR} Tickets Similares Encontrados`)
        .setDescription("Encontramos os seguintes tickets que podem estar relacionados ao seu problema. Confira se algum deles já possui a solução que você procura:")
        .setTimestamp();

      await Promise.all(
        ticket.similarTickets.slice(0, 5).map(async (similarTicket, index) => {
          let similarityBadge = "🟢"; // Similaridade Alta (>80%)
          if (similarTicket.similarity < 0.85 && similarTicket.similarity >= 0.6) {
            similarityBadge = "🟡"; // Similaridade Média (60-80%)
          } else if (similarTicket.similarity < 0.6) {
            similarityBadge = "🟠"; // Similaridade Baixa (<60%)
          }

          const summary = await this.geminiService.generateCaseSummary(similarTicket.content);

          similarTicketsEmbed.addFields({
            name: `${index + 1}. Ticket Similar`,
            value: `\n${this.EMOJI.LINK} [Ver detalhes](https://discord.com/channels/${Config.DISCORD_GUILD_ID}/${similarTicket.threadId})\n\n${similarityBadge} **Relevância:** ${(similarTicket.similarity * 100).toFixed(0)}%\n\n${blockQuote(`\`${summary}\``)}\n\n`,
          });
        })
      );

      similarTicketsEmbed.setFooter({
        text: "Clique nos links para consultar os tickets similares",
        iconURL: "https://cdn3.emoji.gg/emojis/69863-pengu-modcheck.gif",
      });

      await thread.send({ embeds: [similarTicketsEmbed] });
    } catch (error) {
      this.logger.error("Erro ao adicionar tickets similares ao thread", error);
    }
  }

  private formatFieldValue(value: string): string {
    if (!value || value.trim() === "") {
      return "*Não informado*";
    }

    if (value.length > 1024) {
      return this.trimText(value, 1024);
    }

    return value;
  }

  private trimText(text: string, maxLength: number): string {
    if (!text) return "*Não informado*";

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - 3) + "...";
  }
}
