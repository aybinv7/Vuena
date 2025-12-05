export const inittalizerDatabase = async () => {
  await powerSyncDatabase.init();
  await powerSyncDatabase.connect(databaseConnector);
  await databaseConnector.init();
  databaseLogger();
};
