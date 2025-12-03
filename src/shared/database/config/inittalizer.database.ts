import databaseLogger from "@/shared/database/config/logger.database";

const databaseInitializer = async () => {
  await database.init();
  await database.connect(databaseConnector);
  await databaseConnector.init();
  databaseLogger();
};

export default databaseInitializer;
