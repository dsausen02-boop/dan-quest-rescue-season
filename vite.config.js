import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/dan-quest-rescue-season/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5175
  },
  preview: {
    host: "127.0.0.1",
    port: 4175
  },
  build: {
    chunkSizeWarningLimit: 1900
  }
});
