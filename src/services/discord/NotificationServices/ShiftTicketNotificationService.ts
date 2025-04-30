import { Client, TextChannel, EmbedBuilder, Guild, User, DiscordAPIError } from "discord.js";
import { Ticket } from "../../../models/Ticket";
import { Config } from "../../../utils/config";
import { Logger } from "../../../utils/logger";
import { COLORS, EMOJI } from "../../../constants/discordConstants";

interface ShiftConfig {
  channelId: string;
  roleId: string;
}

interface RequiredDiscordEntities {
  guild: Guild;
  channel: TextChannel;
  user: User;
}

export class ShiftTicketNotificationService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.logger.info("ShiftTicketNotificationService inicializado.");
  }

  public async send(client: Client, ticket: Ticket): Promise<void> {
    const dayOfWeek = new Date().getDay();
    const shiftConfig = this._getShiftConfigForDay(dayOfWeek);

    if (!shiftConfig) {
      this.logger.info(`Nenhuma configuração de plantão encontrada para o dia ${dayOfWeek}. Notificação de plantão não será enviada.`);
      return;
    }

    this.logger.info(`Iniciando envio de notificação de plantão para ticket ${ticket.threadId} (Dia: ${dayOfWeek}, Canal: ${shiftConfig.channelId}, Cargo: ${shiftConfig.roleId})`);

    try {
      const { guild, channel, user } = await this._fetchRequiredDiscordEntities(client, ticket.userId, Config.SHIFT_NOTIFICATION_GUILD_ID, shiftConfig.channelId);

      const embed = this._buildShiftEmbed(ticket, user, dayOfWeek);
      const content = this._buildMessageContent(ticket, shiftConfig.roleId);

      await channel.send({
        content: content,
        embeds: [embed],
      });

      this.logger.info(`Notificação de plantão enviada com sucesso para canal ${channel.name} (${channel.id}) na guild ${guild.name}`);
    } catch (error) {
      this._handleSendError(error, shiftConfig);
      throw error;
    }
  }

  private _getShiftConfigForDay(dayOfWeek: number): ShiftConfig | null {
    const channelId = Config.SHIFT_CHANNEL_IDS[dayOfWeek];
    const roleId = Config.SHIFT_ROLE_IDS[dayOfWeek];

    if (channelId && roleId) {
      return { channelId, roleId };
    }
    return null;
  }

  private async _fetchRequiredDiscordEntities(client: Client, ticketUserId: string, targetGuildId: string, targetChannelId: string): Promise<RequiredDiscordEntities> {
    try {
      const guild = await client.guilds.fetch(targetGuildId);
      if (!guild) throw new Error(`Guild de plantão (${targetGuildId}) não encontrada.`);

      const channel = await guild.channels.fetch(targetChannelId);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error(`Canal de plantão (${targetChannelId}) não encontrado ou não é um canal de texto na guild ${guild.name}.`);
      }

      const user = await client.users.fetch(ticketUserId);
      if (!user) throw new Error(`Usuário criador do ticket (${ticketUserId}) não encontrado.`);

      return { guild, channel, user };
    } catch (error) {
      this.logger.error("Erro ao buscar entidades do Discord para notificação de plantão:", error);
      if (error instanceof DiscordAPIError) {
        this.logger.error(`Discord API Error: Code ${error.code}, Message: ${error.message}`);
      }
      throw new Error(`Falha ao buscar entidades necessárias: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private _buildShiftEmbed(ticket: Ticket, user: User, dayOfWeek: number): EmbedBuilder {
    const userAvatarURL = user.displayAvatarURL({ size: 128 });
    const formattedTime = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJI.TICKET} Novo Ticket Recebido - Plantão ${this.getDayName(dayOfWeek)}`)
      .setDescription(`Ticket aberto por ${user.username} às ${formattedTime}.`)
      .setThumbnail(userAvatarURL)
      .addFields({
        name: "Descrição Breve",
        value: "`" + this.trimText(ticket.form.descricaoProblema, 150) + "`",
        inline: false,
      })
      .setTimestamp()
      .setFooter({ text: `Ticket criado no servidor principal.` });
  }

  private _buildMessageContent(ticket: Ticket, roleId: string): string {
    return `Atenção <@&${roleId}>! Novo ticket de <@${ticket.userId}>.`;
  }

  private _handleSendError(error: unknown, config: ShiftConfig): void {
    this.logger.error(`Erro ao enviar notificação de plantão para canal ${config.channelId} mencionando role ${config.roleId}:`, error);
    if (error instanceof DiscordAPIError) {
      this.logger.error(`Erro específico da API Discord: [${error.code}] ${error.message}`);
      if (error.code === 50001) {
        this.logger.warn(`Verifique as permissões do bot no canal ${config.channelId} e servidor.`);
      } else if (error.code === 10003 || error.code === 10011 || error.code === 10004) {
        this.logger.warn(`Verifique se os IDs de canal/cargo/servidor (${config.channelId}, ${config.roleId}, ${Config.SHIFT_NOTIFICATION_GUILD_ID}) estão corretos e se o bot está no servidor.`);
      }
    }
  }

  private getDayName(dayIndex: number): string {
    const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    return days[dayIndex] || "Dia Desconhecido";
  }

  private trimText(text: string | undefined | null, maxLength: number): string {
    if (!text) return "*Não informado*";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}
