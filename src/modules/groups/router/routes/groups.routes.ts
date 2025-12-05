import type { Router } from "framework7/types";

const groupsRoutes: Router.RouteParameters[] = [
  {
    name: "group-detail",
    path: "/group/:id",
    async({ resolve }) {
      import("@/modules/groups/views/GroupDetail.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    name: "group-expenses",
    path: "/group/:id/:expenseId",
    async({ resolve }) {
      import("@/modules/groups/views/GroupDetailExtra.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
];

export default groupsRoutes;
