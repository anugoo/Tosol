// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SearchProvider } from "./context/SearchContext"; // ЭНД ./context/ гэж бичнэ!

createRoot(document.getElementById("root")!).render(
  <SearchProvider>
    <App />
  </SearchProvider>
);