import { Auth } from "@/shared/services/auth/auth.service";
import type { Router } from "framework7/types";

const auth = new Auth();

export const useRoleGuard = async ({
  resolve,
}: Router.RouteCallbackCtx): Promise<void> => {
  const userRoles = await auth.getUserRoles();
  const requiredRoles = ["admin", "user"];

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role: string) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      resolve("/401/");
      return;
    }
  }

  resolve();
};
