export class User {
  id: string;
  username: string;
  discriminator: string;
  ticketIds: string[];

  constructor(id: string, username: string, discriminator: string) {
    this.id = id;
    this.username = username;
    this.discriminator = discriminator;
    this.ticketIds = [];
  }

  addTicket(ticketId: string): void {
    this.ticketIds.push(ticketId);
  }

  getFullUsername(): string {
    return `${this.username}#${this.discriminator}`;
  }
}
