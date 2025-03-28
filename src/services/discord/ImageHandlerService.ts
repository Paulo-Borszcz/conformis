import { Message, Attachment, ThreadChannel } from "discord.js";
import { Logger } from "../../utils/logger";
import { ImageDescriptionService } from "../ImageDescriptionService";

export class ImageHandlerService {
  private logger: Logger;
  private imageDescriptionService: ImageDescriptionService;

  constructor(logger: Logger, imageDescriptionService: ImageDescriptionService) {
    this.logger = logger;
    this.imageDescriptionService = imageDescriptionService;
  }

  async handleImageMessage(message: Message, clientUserId?: string): Promise<void> {
    try {
      if (!message.channel.isThread() || !message.author) return;

      const thread = message.channel as ThreadChannel;
      if (thread.ownerId !== clientUserId) return;

      const imageAttachment = message.attachments.find((attachment: Attachment) => attachment.contentType?.startsWith("image/"));

      if (imageAttachment) {
        const description = await this.imageDescriptionService.generateImageDescription(imageAttachment.url);
        await message.reply(description);
      }
    } catch (error) {
      this.logger.error("Erro ao processar mensagem com imagem", error);
    }
  }
}
