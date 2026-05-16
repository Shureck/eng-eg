import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { QuestionLangProvider } from "./context/QuestionLangContext";
import "./index.css";

/** BASE_URL от Vite всегда с завершающим `/`, например `/` или `/Angl-en/` */
function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (base === "/") return undefined;
  return base.replace(/\/$/, "");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      basename={routerBasename()}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <QuestionLangProvider>
        <App />
      </QuestionLangProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
