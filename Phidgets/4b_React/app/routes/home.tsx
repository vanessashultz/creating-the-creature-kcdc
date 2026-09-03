import { Link } from "react-router";
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <>
      <Welcome />
      <nav
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 16px 40px",
          display: "flex",
          gap: 16,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <Link to="/example1">Example 1</Link>
        <Link to="/example2">Example 2</Link>
        <Link to="/example3">Example 3</Link>
      </nav>
    </>
  );
}
