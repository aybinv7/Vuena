import type { Router } from "framework7/types";

const homeRoutes: Router.RouteParameters[] = [
  {
    name: "about",
    path: "/about",
    routes: [],

    // beforeEnter: (context) => useAuthGuard(context),

    async({ resolve }) {
      import("@/modules/about/views/AboutView.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
];

export default homeRoutes;
