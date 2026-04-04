import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/data-sculptor/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "ds-client", "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "ds-client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "public", "data-sculptor"),
    emptyOutDir: true,
  },
});
