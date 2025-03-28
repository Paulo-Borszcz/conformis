import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export class ModalService {
  createQuestionModal() {
    const modal = new ModalBuilder().setCustomId("questionModal").setTitle("📝 Formulário de Problema de Plantão");

    const descricaoInput = new TextInputBuilder().setCustomId("descricaoProblema").setLabel("📄 Descreva o Problema").setPlaceholder("Explique detalhadamente o problema que está enfrentando...").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const departamentoInput = new TextInputBuilder().setCustomId("vistoComDepartamento").setLabel("🏢 Foi visto com o departamento responsável?").setPlaceholder("Sim/Não - Se sim, com qual departamento?").setStyle(TextInputStyle.Short).setRequired(true);

    const sistemaInput = new TextInputBuilder().setCustomId("sistemaECaminho").setLabel("💻 Sistema, caminho e operação realizada").setPlaceholder("Ex: WebVendas > Contas a Pagar > Lançamento de NF").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const filialInput = new TextInputBuilder().setCustomId("filialUsuarioDF").setLabel("🏬 Filial, Usuário e DF do Cliente").setPlaceholder("Ex: Filial SP01, Usuário João Silva, DF 12345").setStyle(TextInputStyle.Paragraph).setRequired(true);

    const logInput = new TextInputBuilder().setCustomId("logDeErro").setLabel("📋 Retornou algum LOG de erro?").setPlaceholder("Cole aqui o log de erro completo, se houver").setStyle(TextInputStyle.Paragraph).setRequired(false);

    const actionRows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(descricaoInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(departamentoInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(sistemaInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(filialInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(logInput),
    ];

    actionRows.forEach((row) => {
      modal.addComponents(row);
    });

    return { modal, actionRows };
  }
}
