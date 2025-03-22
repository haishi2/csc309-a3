import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/global.css";
import App from "@/App.tsx";

try {
  import("@/config/environment")
    .then(() => {
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    })
    .catch((error) => {
      const root = document.getElementById("root")!;
      root.innerHTML = `
        <div style="color: red; background: #ffdddd; padding: 20px; border-radius: 5px; font-family: sans-serif; max-width: 800px; margin: 50px auto; border: 2px solid red;">
          <h1>Environment Error</h1>
          <p style="font-size: 18px">${error.message}</p>
          <p>Please check your <code>.env.local</code> file and ensure all required variables are set.</p>
        </div>
      `;
      console.error(error);
    });
} catch (error) {
  document.body.innerHTML = `<div style="color: red; padding: 20px;">Application failed to start: ${
    error instanceof Error ? error.message : String(error)
  }</div>`;
  console.error(error);
}
