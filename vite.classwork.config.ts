import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/classwork/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "classwork-client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "classwork-client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "public", "classwork"),
    emptyOutDir: true,
  },
});
