import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/progress/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "progress-client", "src"),
    },
  },
  root: path.resolve(import.meta.dirname, "progress-client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "public", "progress"),
    emptyOutDir: true,
  },
});
