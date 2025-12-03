import type { Router } from "framework7/types";

const globalRoutes: Router.RouteParameters[] = [
  {
    name: "not-found",
    path: "/:pathMatch(.*)*",
    async({ resolve }) {
      import("@/shared/components/error/404.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
];

export default globalRoutes;
