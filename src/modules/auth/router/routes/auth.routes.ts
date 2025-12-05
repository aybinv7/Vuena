import type { Router } from "framework7/types";

const authRoutes: Router.RouteParameters[] = [
  {
    name: "login",
    path: "/login",
    async({ resolve }) {
      import("@/modules/auth/views/LoginView.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
];

export default authRoutes;
