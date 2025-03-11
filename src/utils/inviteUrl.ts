import { Config } from "./config";

export function generateInviteUrl(): string {
  const clientId = Config.DISCORD_CLIENT_ID;

  const scopes = ["bot", "applications.commands"];

  const permissions = ["MANAGE_CHANNELS", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS", "CREATE_PUBLIC_THREADS", "MANAGE_THREADS", "VIEW_CHANNEL"];

  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=534723950656&scope=${scopes.join("%20")}`;

  return url;
}
