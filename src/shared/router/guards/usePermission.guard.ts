import type { Router } from "framework7/types";
export const usePermissionGuard = ({ resolve }: Router.RouteCallbackCtx) => {
  resolve();
};
