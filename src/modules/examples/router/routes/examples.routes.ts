import type { Router } from "framework7/types";

const examplesRoutes: Router.RouteParameters[] = [
  {
    path: "/examples",
    async({ resolve }) {
      import("../../views/ExamplesIndex.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    path: "/examples/kysely-query",
    async({ resolve }) {
      import("../../views/KyselyQueryExample.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    path: "/examples/entity-form/:id?",
    async({ resolve }) {
      import("../../views/EntityFormExample.vue").then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
];

export default examplesRoutes;
