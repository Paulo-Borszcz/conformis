import winston from "winston";
import path from "path";

export class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let metaStr = "";
          if (Object.keys(metadata).length > 0) {
            metaStr = JSON.stringify(metadata);
          }
          return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, "../../logs/error.log"),
          level: "error",
        }),
        new winston.transports.File({
          filename: path.join(__dirname, "../../logs/combined.log"),
        }),
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    });
  }

  info(message: string, metadata: any = {}): void {
    this.logger.info(message, metadata);
  }

  warn(message: string, metadata: any = {}): void {
    this.logger.warn(message, metadata);
  }

  error(message: string, error: any = {}): void {
    const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);

    const stack = error instanceof Error ? error.stack : undefined;

    this.logger.error(message, { error: errorMessage, stack });
  }

  debug(message: string, metadata: any = {}): void {
    this.logger.debug(message, metadata);
  }
}
