import homeRoutes from "@/modules/home/router/routes/home.routes";
import aboutRoutes from "@/modules/about/router/routes/about.routes";

const routes = [...homeRoutes, ...aboutRoutes, ...globalRoutes];
export default routes;
