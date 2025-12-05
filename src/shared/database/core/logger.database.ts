import { createBaseLogger, LogLevel } from "@powersync/web";

export const databaseLogger = () => {
  const logger = createBaseLogger();
  logger.useDefaults();
  logger.setLevel(LogLevel.DEBUG);
};
