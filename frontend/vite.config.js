import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Lets `npm run dev` talk to a locally-running backend on :8000
      // without a separate nginx proxy, mirroring the container setup.
      "/api": "http://localhost:8000",
    },
  },
});
