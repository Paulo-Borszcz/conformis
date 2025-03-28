import { Client, Events } from "discord.js";
import { Logger } from "../utils/logger";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client, logger: Logger) {
    logger.info(`Bot online! Logado como ${client.user?.tag}`);
  },
};
