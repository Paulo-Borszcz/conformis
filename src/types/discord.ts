import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { DiscordService } from "../services/DiscordService";

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction, discordService: DiscordService) => Promise<void>;
}
