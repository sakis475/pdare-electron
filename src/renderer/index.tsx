import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

console.log("Renderer script is running!");

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("React root rendered!");
