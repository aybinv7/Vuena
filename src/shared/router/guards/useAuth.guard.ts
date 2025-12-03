import { Auth } from "@/shared/services/auth/auth.service";
import type { Router } from "framework7/types";

const auth = new Auth();

export async function useAuthGuard({
  resolve,
}: Router.RouteCallbackCtx): Promise<void> {
  const isLoggedIn = await auth.isLoggedIn();

  const isRequiredAuth = true;

  if (isRequiredAuth && !isLoggedIn) {
    resolve("/");
    return;
  }

  if (!isRequiredAuth && isLoggedIn) {
    resolve("/home/");
    return;
  }

  resolve();
}
