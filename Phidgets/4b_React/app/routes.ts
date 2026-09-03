import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("example1", "routes/example1.tsx"),
  route("example2", "routes/example2.tsx"),
  route("example3", "routes/example3.tsx"),
] satisfies RouteConfig;
