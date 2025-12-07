import { createBaseLogger, LogLevel } from "@powersync/web";

export const databaseLogger = () => {
  const logger = createBaseLogger();
  logger.useDefaults();

  const envLogLevel = import.meta.env.VITE_DB_LOG_LEVEL;
  let logLevel = LogLevel.WARN; // Default to WARN

  if (envLogLevel) {
    switch (envLogLevel.toUpperCase()) {
      case "DEBUG":
        logLevel = LogLevel.DEBUG;
        break;
      case "INFO":
        logLevel = LogLevel.INFO;
        break;
      case "WARN":
        logLevel = LogLevel.WARN;
        break;
      case "ERROR":
        logLevel = LogLevel.ERROR;
        break;
    }
  }

  logger.setLevel(logLevel);
};
