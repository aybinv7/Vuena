import type { Router } from "framework7/types";

const modules = import.meta.glob<Router.RouteParameters[]>(
  "../modules/*/router/routes/*.routes.ts",
  { eager: true, import: "default" }
);

const routes: Router.RouteParameters[] = [];

Object.values(modules).forEach((moduleRoutes) => {
  routes.push(...(moduleRoutes as unknown as Router.RouteParameters[]));
});

export default routes;
