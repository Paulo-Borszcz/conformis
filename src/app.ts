import { Bot } from "./bot";
import { Logger } from "./utils/logger";

const logger = new Logger();

async function main() {
  try {
    const bot = new Bot();
    await bot.start();
  } catch (error) {
    logger.error("Erro fatal ao iniciar a aplicação", error);
    process.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  logger.error("Exceção não capturada", error);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Rejeição de promessa não tratada", { reason, promise });
});

main();
