import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "n5-client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "n5-client"),
  base: "/revision-n5/",
  build: {
    outDir: path.resolve(import.meta.dirname, "public/revision-n5"),
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
