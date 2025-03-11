import { User } from "./User";

export interface TicketForm {
  descricaoProblema: string;
  vistoComDepartamento: string;
  sistemaECaminho: string;
  filialUsuarioDF: string;
  logDeErro: string;
}

export interface TicketEmbedding {
  embedding: number[];
  content: string;
}

export class Ticket {
  id: string;
  userId: string;
  username: string;
  form: TicketForm;
  threadId?: string;
  createdAt: Date;
  embeddings?: TicketEmbedding[];
  similarTickets?: { id: string; threadId: string; similarity: number }[];

  constructor(userId: string, username: string, form: TicketForm) {
    this.id = `ticket_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.userId = userId;
    this.username = username;
    this.form = form;
    this.createdAt = new Date();
  }

  toText(): string {
    return `
      Problema: ${this.form.descricaoProblema}
      Visto com departamento: ${this.form.vistoComDepartamento}
      Sistema e caminho: ${this.form.sistemaECaminho}
      Filial, usuário e DF: ${this.form.filialUsuarioDF}
      Log de erro: ${this.form.logDeErro}
    `;
  }

  setThreadId(threadId: string): void {
    this.threadId = threadId;
  }

  setEmbeddings(embeddings: TicketEmbedding[]): void {
    this.embeddings = embeddings;
  }

  setSimilarTickets(similarTickets: { id: string; threadId: string; similarity: number }[]): void {
    this.similarTickets = similarTickets;
  }
}
