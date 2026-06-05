import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TechStoreApp } from "./TechStoreApp.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TechStoreApp />
  </StrictMode>,
);
