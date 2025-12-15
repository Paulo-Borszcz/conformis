import { Message, Attachment, ThreadChannel } from "discord.js";
import { Logger } from "../../utils/logger";

export class ImageHandlerService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async handleImageMessage(message: Message, clientUserId?: string): Promise<void> {
    // DO NOTHING
  }
}
