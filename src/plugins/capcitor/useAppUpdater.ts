import { App } from "@capacitor/app";
const { init: initUpdater, check: checkUpdates } = useUpdater();

const useAppUpdater = async () => {
  await initUpdater();
  App.addListener(
    "appStateChange",
    async ({ isActive }: { isActive: boolean }) => {
      if (isActive) {
        await checkUpdates(true);
      }
    }
  );
};

export default useAppUpdater;
