import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export class Config {
  static readonly DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
  static readonly DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
  static readonly DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID as string;
  static readonly DISCORD_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_NOTIFICATION_CHANNEL_ID as string;

  static readonly SHIFT_NOTIFICATION_GUILD_ID = process.env.SHIFT_NOTIFICATION_GUILD_ID as string;
  static readonly SHIFT_CHANNEL_IDS: { [key: number]: string | undefined } = {
    1: process.env.SHIFT_CHANNEL_ID_1, // Segunda
    2: process.env.SHIFT_CHANNEL_ID_2, // Terça
    3: process.env.SHIFT_CHANNEL_ID_3, // Quarta
    4: process.env.SHIFT_CHANNEL_ID_4, // Quinta
    5: process.env.SHIFT_CHANNEL_ID_5, // Sexta
  };
  static readonly SHIFT_ROLE_IDS: { [key: number]: string | undefined } = {
    1: process.env.SHIFT_ROLE_ID_1, // Segunda
    2: process.env.SHIFT_ROLE_ID_2, // Terça
    3: process.env.SHIFT_ROLE_ID_3, // Quarta
    4: process.env.SHIFT_ROLE_ID_4, // Quinta
    5: process.env.SHIFT_ROLE_ID_5, // Sexta
  };

  static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
  static readonly PINECONE_API_KEY = process.env.PINECONE_API_KEY as string;
  static readonly PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT as string;
  static readonly PINECONE_INDEX = process.env.PINECONE_INDEX as string;
  static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  static validate(): void {
    const requiredEnvVars = [
      "DISCORD_TOKEN",
      "DISCORD_CLIENT_ID",
      "DISCORD_GUILD_ID",
      "DISCORD_NOTIFICATION_CHANNEL_ID",
      "OPENAI_API_KEY",
      "PINECONE_API_KEY",
      "PINECONE_ENVIRONMENT",
      "PINECONE_INDEX",
      "GEMINI_API_KEY",
      "SHIFT_NOTIFICATION_GUILD_ID",
      "SHIFT_CHANNEL_ID_1",
      "SHIFT_ROLE_ID_1",
      "SHIFT_CHANNEL_ID_2",
      "SHIFT_ROLE_ID_2",
      "SHIFT_CHANNEL_ID_3",
      "SHIFT_ROLE_ID_3",
      "SHIFT_CHANNEL_ID_4",
      "SHIFT_ROLE_ID_4",
      "SHIFT_CHANNEL_ID_5",
      "SHIFT_ROLE_ID_5",
    ];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Faltam variáveis de ambiente: ${missingVars.join(", ")}`);
    }
  }
}

Config.validate();

export default Config;
