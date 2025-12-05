import type { Router } from "framework7/types";

const homeRoutes: Router.RouteParameters[] = [
  {
    name: "authenticated",
    path: "/",
    routes: [],

    // beforeEnter: (context) => useAuthGuard(context),

    async({ resolve }) {
      import("@/modules/home/views/HomeView.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    name: "activity",
    path: "/activity",
    async({ resolve }) {
      import("@/modules/home/views/ActivityView.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    name: "profile",
    path: "/profile",
    async({ resolve }) {
      import("@/modules/home/views/ProfileView.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
];

export default homeRoutes;
