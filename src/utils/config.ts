import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export class Config {
  static readonly DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
  static readonly DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
  static readonly DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID as string;
  static readonly DISCORD_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_NOTIFICATION_CHANNEL_ID as string;

  static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

  static readonly PINECONE_API_KEY = process.env.PINECONE_API_KEY as string;
  static readonly PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT as string;
  static readonly PINECONE_INDEX = process.env.PINECONE_INDEX as string;

  static validate(): void {
    const requiredEnvVars = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID", "DISCORD_GUILD_ID", "DISCORD_NOTIFICATION_CHANNEL_ID", "OPENAI_API_KEY", "PINECONE_API_KEY", "PINECONE_ENVIRONMENT", "PINECONE_INDEX"];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Faltam variáveis de ambiente: ${missingVars.join(", ")}`);
    }
  }
}

Config.validate();

export default Config;
