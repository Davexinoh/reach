import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reachApi } from "./server/api.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "reach-api",
      configureServer(server) {
        server.middlewares.use(reachApi());
      },
      configurePreviewServer(server) {
        server.middlewares.use(reachApi());
      },
    },
  ],
  server: { port: 5173, strictPort: true },
});
