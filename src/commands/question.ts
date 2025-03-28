import { SlashCommandBuilder } from "discord.js";
import { DiscordService } from "../services/DiscordService";

export const data = new SlashCommandBuilder().setName("question").setDescription("Abre um formulário para registrar um problema de plantão");

export async function execute(interaction: any, discordService: DiscordService) {
  try {
    const { modal } = discordService.createQuestionModal();

    await interaction.showModal(modal);
  } catch (error) {
    console.error("Erro ao executar comando /question:", error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: "Ocorreu um erro ao abrir o formulário. Por favor, tente novamente.",
      });
    } else {
      await interaction.reply({
        content: "Ocorreu um erro ao abrir o formulário. Por favor, tente novamente.",
        ephemeral: true,
      });
    }
  }
}
