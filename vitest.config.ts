import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  test: {
    projects: [
      {
        extends: false,
        plugins: [react()],
        test: {
          name: "n5",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/n5/**/*.test.{ts,tsx}"],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "n5-client/src"),
            "@shared": path.resolve(__dirname, "shared"),
          },
        },
      },
      {
        extends: false,
        plugins: [react()],
        test: {
          name: "revision",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/revision/**/*.test.{ts,tsx}"],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "revision-client/src"),
            "@shared": path.resolve(__dirname, "shared"),
          },
        },
      },
      {
        extends: false,
        plugins: [react()],
        test: {
          name: "ds",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/ds/**/*.test.{ts,tsx}"],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "ds-client/src"),
            "@shared": path.resolve(__dirname, "shared"),
            "@assets": path.resolve(__dirname, "attached_assets"),
          },
        },
      },
    ],
  },
});
