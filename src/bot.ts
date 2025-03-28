import { Client, Collection, GatewayIntentBits, REST, Routes } from "discord.js";
import { Config } from "./utils/config";
import { Logger } from "./utils/logger";
import { DiscordService } from "./services/DiscordService";
import { EmbeddingService } from "./services/EmbeddingService";
import { PineconeService } from "./services/PineconeService";
import { TicketService } from "./services/TicketService";
import * as questionCommand from "./commands/question";
import readyEvent from "./events/ready";
import interactionCreateEvent from "./events/InteractionCreate";
import { generateInviteUrl } from "./utils/inviteUrl";
import { RedactionService } from "./services/RedactionService";
import { GeminiService } from "./services/GeminiService";
import { ImageDescriptionService } from "./services/ImageDescriptionService";

export class Bot {
  private client: Client;
  private logger: Logger;
  private discordService: DiscordService;
  private embeddingService: EmbeddingService;
  private pineconeService: PineconeService;
  private ticketService: TicketService;
  private redactionService: RedactionService;
  private geminiService: GeminiService;
  private imageDescriptionService: ImageDescriptionService;

  constructor() {
    this.logger = new Logger();

    // Inicializa serviços auxiliares primeiro
    this.redactionService = new RedactionService(this.logger);
    this.geminiService = new GeminiService(this.logger);
    this.imageDescriptionService = new ImageDescriptionService(this.logger);

    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    });

    // Inicializa serviços principais com dependências
    this.discordService = new DiscordService(this.client, this.logger, this.geminiService, this.imageDescriptionService);

    this.embeddingService = new EmbeddingService(this.logger, this.redactionService);

    this.pineconeService = new PineconeService(this.logger);

    this.ticketService = new TicketService(this.discordService, this.embeddingService, this.pineconeService, this.logger, this.redactionService, this.geminiService);

    this.registerEvents();
  }

  private registerEvents(): void {
    this.client.once("ready", (...args) => {
      readyEvent.execute(this.client, this.logger);

      const inviteUrl = generateInviteUrl();
      this.logger.info(`URL de convite do bot: ${inviteUrl}`);
      console.log(`\n----------------------------------------`);
      console.log(`URL DE CONVITE DO BOT:`);
      console.log(inviteUrl);
      console.log(`----------------------------------------\n`);
    });

    this.client.on("interactionCreate", (interaction) => {
      interactionCreateEvent.execute(interaction, {
        discordService: this.discordService,
        ticketService: this.ticketService,
        logger: this.logger,
      });
    });
  }

  async registerCommands(): Promise<void> {
    try {
      const commands = [questionCommand.data.toJSON()];
      const rest = new REST({ version: "10" }).setToken(Config.DISCORD_TOKEN);

      this.logger.info("Iniciando registro de comandos (/)");

      try {
        this.logger.info("Tentando registrar comandos globalmente...");
        await rest.put(Routes.applicationCommands(Config.DISCORD_CLIENT_ID), { body: commands });
        this.logger.info("Comandos globais registrados com sucesso (pode levar até 1h para aparecer)");
      } catch (globalError) {
        this.logger.error("Erro ao registrar comandos globalmente, tentando por servidor...", globalError);

        try {
          await rest.put(Routes.applicationGuildCommands(Config.DISCORD_CLIENT_ID, Config.DISCORD_GUILD_ID), { body: commands });
          this.logger.info("Comandos por servidor registrados com sucesso");
        } catch (guildError) {
          this.logger.error("Erro ao registrar comandos por servidor", guildError);
          throw guildError;
        }
      }
    } catch (error) {
      this.logger.error("Erro ao registrar comandos", error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      Config.validate();

      await this.client.login(Config.DISCORD_TOKEN);
      this.logger.info("Bot logado com sucesso");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await this.registerCommands();
      this.logger.info("Bot iniciado com sucesso");
    } catch (error) {
      this.logger.error("Erro ao iniciar o bot", error);
      process.exit(1);
    }
  }
}
