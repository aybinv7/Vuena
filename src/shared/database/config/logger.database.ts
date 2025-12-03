import { createBaseLogger, LogLevel } from "@powersync/web";

const databaseLogger = () => {
  const logger = createBaseLogger();
  logger.useDefaults();
  logger.setLevel(LogLevel.DEBUG);
};

export default databaseLogger;
