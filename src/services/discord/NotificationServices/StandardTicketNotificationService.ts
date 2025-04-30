import { Client, TextChannel, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, User, DiscordAPIError } from "discord.js";
import { Ticket } from "../../../models/Ticket";
import { Config } from "../../../utils/config";
import { Logger } from "../../../utils/logger";
import { COLORS, EMOJI } from "../../../constants/discordConstants";

interface StandardNotificationEntities {
  channel: TextChannel;
  user: User;
}

export class StandardTicketNotificationService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.logger.info("StandardTicketNotificationService inicializado.");
  }

  public async send(client: Client, ticket: Ticket): Promise<void> {
    this.logger.info(`Iniciando envio de notificação padrão para ticket ${ticket.threadId}`);

    try {
      const { channel, user } = await this._fetchRequiredEntities(client, ticket);

      const embed = this._buildNotificationEmbed(ticket, user);

      const actionRow = this._buildActionRow(ticket);

      const content = `<@${ticket.userId}>`;

      await channel.send({
        content: content,
        embeds: [embed],
        components: [actionRow],
      });

      this.logger.info(`Notificação padrão enviada com sucesso para canal ${channel.name} (${channel.id})`);
    } catch (error) {
      this._handleSendError(error, Config.DISCORD_NOTIFICATION_CHANNEL_ID);
      throw error;
    }
  }

  private async _fetchRequiredEntities(client: Client, ticket: Ticket): Promise<StandardNotificationEntities> {
    const channelId = Config.DISCORD_NOTIFICATION_CHANNEL_ID;
    const userId = ticket.userId;

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error(`Canal de notificação padrão (${channelId}) não encontrado ou não é um canal de texto.`);
      }

      const user = await client.users.fetch(userId);
      if (!user) {
        throw new Error(`Usuário criador do ticket (${userId}) não encontrado.`);
      }

      return { channel, user };
    } catch (error) {
      this.logger.error("Erro ao buscar entidades para notificação padrão:", error);
      if (error instanceof DiscordAPIError) {
        this.logger.error(`Discord API Error: Code ${error.code}, Message: ${error.message}`);
      }
      throw new Error(`Falha ao buscar entidades necessárias: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private _buildNotificationEmbed(ticket: Ticket, user: User): EmbedBuilder {
    const userAvatarURL = user.displayAvatarURL({ size: 128 });
    const formattedTime = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return new EmbedBuilder()
      .setColor(COLORS.NOTIFICATION)
      .setTitle(`${EMOJI.ALERT} Novo Ticket de Plantão`)
      .setDescription(`${EMOJI.TICKET} **Ticket** aberto por <@${ticket.userId}> às ${formattedTime}`)
      .setThumbnail(userAvatarURL)
      .addFields(
        {
          name: "Sobre",
          value: "`" + this.trimText(ticket.form.descricaoProblema, 100) + "`",
          inline: false,
        },
        {
          name: "Sistema",
          value: `\`${this.trimText(ticket.form.sistemaECaminho?.split(">")[0], 100) || "Não especificado"}\``,
          inline: true,
        },
        {
          name: "Filial",
          value: `\`${this.trimText(ticket.form.filialUsuarioDF?.split(",")[0], 100) || "Não especificado"}\``,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Use o botão abaixo para acessar este ticket`,
        iconURL: "https://cdn.discordapp.com/emojis/1037045289081905152.webp",
      });
  }

  private _buildActionRow(ticket: Ticket): ActionRowBuilder<ButtonBuilder> {
    if (!ticket.threadId) {
      this.logger.warn(`Ticket ${ticket.id || ticket.userId} sem threadId definido ao tentar criar botão de link.`);
      throw new Error("Não é possível criar botão de acesso sem threadId no ticket.");
    }
    const ticketUrl = `https://discord.com/channels/${Config.DISCORD_GUILD_ID}/${ticket.threadId}`;

    const linkButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`${EMOJI.LINK} Acessar Ticket`).setURL(ticketUrl);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);
  }

  private _handleSendError(error: unknown, channelId: string): void {
    this.logger.error(`Erro ao enviar notificação padrão para canal ${channelId}:`, error);
    if (error instanceof DiscordAPIError) {
      this.logger.error(`Erro específico da API Discord: [${error.code}] ${error.message}`);
      if (error.code === 50001) {
        this.logger.warn(`Verifique as permissões do bot no canal padrão ${channelId}.`);
      } else if (error.code === 10003) {
        this.logger.warn(`Verifique se o ID do canal de notificação padrão (${channelId}) está correto.`);
      }
    }
  }

  private trimText(text: string | undefined | null, maxLength: number): string {
    if (!text) return "*Não informado*";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}
