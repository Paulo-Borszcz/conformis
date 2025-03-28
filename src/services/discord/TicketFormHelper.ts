import { ModalSubmitInteraction } from "discord.js";
import { TicketForm } from "../../models/Ticket";

export class TicketFormHelper {
  static extractFormData(interaction: ModalSubmitInteraction): TicketForm {
    return {
      descricaoProblema: interaction.fields.getTextInputValue("descricaoProblema"),
      vistoComDepartamento: interaction.fields.getTextInputValue("vistoComDepartamento"),
      sistemaECaminho: interaction.fields.getTextInputValue("sistemaECaminho"),
      filialUsuarioDF: interaction.fields.getTextInputValue("filialUsuarioDF"),
      logDeErro: interaction.fields.getTextInputValue("logDeErro"),
    };
  }
}
