import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { QuestionLangProvider } from "./context/QuestionLangContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QuestionLangProvider>
        <App />
      </QuestionLangProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
