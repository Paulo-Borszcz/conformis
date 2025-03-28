import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { Config } from "../../utils/config";
import { Ticket } from "../../models/Ticket";
import { COLORS, EMOJI } from "../../constants/discordConstants";
import { Logger } from "../../utils/logger";

export class NotificationService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }


  async sendNotification(client: any, ticket: Ticket): Promise<void> {
    try {
      const channel = await client.channels.fetch(Config.DISCORD_NOTIFICATION_CHANNEL_ID);

      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error("Canal de notificação não encontrado ou não é um canal de texto");
      }

      const user = await client.users.fetch(ticket.userId);
      const userAvatarURL = user.displayAvatarURL({ size: 128 });

      const formattedTime = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const notificationEmbed = new EmbedBuilder()
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
            value: `\`${this.trimText(ticket.form.sistemaECaminho.split(">")[0], 100) || "Não especificado"}\``,
            inline: true,
          },
          {
            name: "Filial",
            value: `\`${this.trimText(ticket.form.filialUsuarioDF.split(",")[0], 100) || "Não especificado"}\``,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Use o botão abaixo para acessar este ticket`,
          iconURL: "https://cdn.discordapp.com/emojis/1037045289081905152.webp",
        });

      const linkButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`${EMOJI.LINK} Acessar Ticket`).setURL(`https://discord.com/channels/${Config.DISCORD_GUILD_ID}/${ticket.threadId}`);

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

      await channel.send({
        content: `<@${ticket.userId}>`,
        embeds: [notificationEmbed],
        components: [actionRow],
      });
    } catch (error) {
      this.logger.error("Erro ao enviar notificação", error);
    }
  }

  private trimText(text: string, maxLength: number): string {
    if (!text) return "*Não informado*";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}
