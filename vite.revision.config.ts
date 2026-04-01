import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/revision/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "revision-client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "revision-client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "public", "revision"),
    emptyOutDir: true,
  },
});
